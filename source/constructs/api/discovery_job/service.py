import os
import boto3
import json
import logging
import db.models_discovery_job as models
from . import crud, schemas
from common.exception_handler import BizException
from common.enum import MessageEnum, JobState, RunState, RunDatabaseState, DatabaseType, AthenaQueryState
from common.constant import const
from common.query_condition import QueryCondition
import traceback
import tools.mytime as mytime
import datetime, time
from openpyxl import Workbook
from tempfile import NamedTemporaryFile
from catalog.service import sync_job_detection_result

logger = logging.getLogger(const.LOGGER_API)
controller_function_name = os.getenv("ControllerFunctionName", f"{const.SOLUTION_NAME}-Controller")
caller_identity = boto3.client('sts').get_caller_identity()
partition = caller_identity['Arn'].split(':')[1]
admin_account_id = caller_identity.get('Account')
url_suffix = const.URL_SUFFIX_CN if partition == const.PARTITION_CN else ''
admin_region = boto3.session.Session().region_name
project_bucket_name = os.getenv(const.PROJECT_BUCKET_NAME, const.PROJECT_BUCKET_DEFAULT_NAME)
version = os.getenv(const.VERSION, '')
sqs_job = boto3.resource('sqs')

sql_result = "SELECT database_type,account_id,region,s3_bucket,s3_location,rds_instance_id,table_name,column_name,identifiers,sample_data FROM job_detection_output_table where run_id='%d' and privacy = 1"
sql_error = "SELECT account_id,region,database_type,database_name,table_name,error_message FROM job_detection_error_table where run_id='%d'"


def list_jobs(condition: QueryCondition):
    return crud.list_jobs(condition)


def get_job(id: int):
    return crud.get_job(id)


def __deduplicate_list_of_objects(lst):
    deduplicated_set = set(lst)
    deduplicated_list = list(deduplicated_set)
    return deduplicated_list


def create_job(job: schemas.DiscoveryJobCreate):
    job.databases = __deduplicate_list_of_objects(job.databases)

    db_job = crud.create_job(job)
    if db_job.schedule != const.ON_DEMAND:
        create_event(db_job.id, db_job.schedule)
    return db_job


def create_event(job_id: int, schedule: str):
    rule_name = f'{const.SOLUTION_NAME}-Controller-{job_id}'
    client_events = boto3.client('events')
    response = client_events.put_rule(
        Name=rule_name,
        ScheduleExpression=schedule,
        State='ENABLED',
        Description=f'create by {const.SOLUTION_NAME}',
        Tags=[
            {
                'Key': 'Owner',
                'Value': const.SOLUTION_NAME
            },
            {
                'Key': 'JobId',
                'Value': str(job_id)
            },
        ],
    )

    input = {"JobId": job_id}
    response = client_events.put_targets(
        Rule=rule_name,
        Targets=[
            {
                'Id': '1',
                'Arn': f'arn:{partition}:lambda:{admin_region}:{admin_account_id}:function:{controller_function_name}',
                'Input': json.dumps(input),
            },
        ]
    )

    client_lambda = boto3.client('lambda')
    response = client_lambda.add_permission(
        Action='lambda:InvokeFunction',
        FunctionName=controller_function_name,
        Principal='events.amazonaws.com',
        SourceArn=f'arn:{partition}:events:{admin_region}:{admin_account_id}:rule/{rule_name}',
        StatementId=rule_name,
    )


def delete_job(id: int):
    db_job = crud.get_job(id)
    if db_job.state == JobState.RUNNING.value or db_job.state == JobState.OD_RUNNING.value:
        raise BizException(MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_JOB.get_code(),
                           MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_JOB.get_msg())
    delete_event(id)
    crud.delete_job(id)


def delete_event(job_id: int):
    rule_name = f'{const.SOLUTION_NAME}-Controller-{job_id}'
    client_events = boto3.client('events')
    try:
        response = client_events.remove_targets(
            Rule=rule_name,
            Ids=['1'],
            Force=True
        )
    except client_events.exceptions.ResourceNotFoundException as e:
        logger.warning(e)

    response = client_events.delete_rule(
        Name=rule_name,
    )

    try:
        client_lambda = boto3.client('lambda')
        response = client_lambda.remove_permission(
            FunctionName=controller_function_name,
            StatementId=rule_name,
        )
    except client_lambda.exceptions.ResourceNotFoundException as e:
        logger.warning(e)


def update_event(job_id: int, schedule: str):
    rule_name = f'{const.SOLUTION_NAME}-Controller-{job_id}'
    client_events = boto3.client('events')
    response = client_events.put_rule(
        Name=rule_name,
        ScheduleExpression=schedule,
        Description=f'create by {const.SOLUTION_NAME}',
    )


def update_job(id: int, job: schemas.DiscoveryJobUpdate):
    length = len(job.dict(exclude_unset=True))
    if length == 0:
        raise BizException(MessageEnum.DISCOVERY_JOB_INVALID_PARAMETER.get_code(),
                           MessageEnum.DISCOVERY_JOB_INVALID_PARAMETER.get_msg())
    if job.schedule:
        db_job = crud.get_job(id)
        if db_job.schedule == const.ON_DEMAND and job.schedule == const.ON_DEMAND:
            pass
        elif db_job.schedule == const.ON_DEMAND and job.schedule != const.ON_DEMAND:
            create_event(id, job.schedule)
        elif db_job.schedule != const.ON_DEMAND and job.schedule == const.ON_DEMAND:
            delete_event(id)
        elif db_job.schedule != job.schedule:
            update_event(id, job.schedule)
    crud.update_job(id, job)


def last_job_time() -> str:
    return crud.last_job_time()


def enable_job(id: int):
    db_job = crud.get_job(id)
    if db_job.schedule == const.ON_DEMAND:
        raise BizException(MessageEnum.DISCOVERY_JOB_CAN_CHANGE_STATE.get_code(),
                           MessageEnum.DISCOVERY_JOB_CAN_CHANGE_STATE.get_msg())
    if db_job.state != JobState.PAUSED.value:
        raise BizException(MessageEnum.DISCOVERY_JOB_CAN_ENABLE.get_code(),
                           MessageEnum.DISCOVERY_JOB_CAN_ENABLE.get_msg())
    rule_name = f'{const.SOLUTION_NAME}-Controller-{id}'
    client_events = boto3.client('events')
    client_events.enable_rule(Name=rule_name)
    crud.enable_job(id)


def disable_job(id: int):
    db_job = crud.get_job(id)
    if db_job.schedule == const.ON_DEMAND:
        raise BizException(MessageEnum.DISCOVERY_JOB_CAN_CHANGE_STATE.get_code(),
                           MessageEnum.DISCOVERY_JOB_CAN_CHANGE_STATE.get_msg())
    if db_job.state != JobState.IDLE.value:
        raise BizException(MessageEnum.DISCOVERY_JOB_CAN_DISABLE.get_code(),
                           MessageEnum.DISCOVERY_JOB_CAN_DISABLE.get_msg())
    rule_name = f'{const.SOLUTION_NAME}-Controller-{id}'
    client_events = boto3.client('events')
    client_events.disable_rule(Name=rule_name)
    crud.disable_job(id)


def start_job(job_id: int):
    run_id = crud.init_run(job_id)
    if run_id >= 0:
        __start_run(job_id, run_id)


def __start_run(job_id: int, run_id: int):
    job = crud.get_job(job_id)
    run = crud.get_run(run_id)
    run_databases = run.databases
    module_path = f's3://{project_bucket_name}/job/ml-asset/python-module/'
    wheels = ["humanfriendly-10.0-py2.py3-none-any.whl",
              "protobuf-4.22.1-cp37-abi3-manylinux2014_x86_64.whl",
              "flatbuffers-23.3.3-py2.py3-none-any.whl",
              "coloredlogs-15.0.1-py2.py3-none-any.whl",
              "onnxruntime-1.13.1-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl",
              "sdps_ner-0.9.0-py3-none-any.whl",
              ]

    account_loop_wait = {}
    for run_database in run_databases:
        account_id = run_database.account_id
        if account_id in account_loop_wait:
            tmp = account_loop_wait[account_id]
            tmp = tmp + const.JOB_INTERVAL_WAIT
            account_loop_wait[account_id] = tmp
        else:
            account_loop_wait[account_id] = const.JOB_INTERVAL_WAIT

    account_first_wait = {}
    for run_database in run_databases:
        try:
            account_id = run_database.account_id
            if account_id in account_first_wait:
                tmp = account_first_wait[account_id]
                tmp = tmp + const.JOB_INTERVAL_WAIT
                account_first_wait[account_id] = tmp
            else:
                account_first_wait[account_id] = 0
            # job_bookmark_option = "job-bookmark-enable" if job.range == 1 else "job-bookmark-disable"
            base_time = str(datetime.datetime.min)
            if job.range == 1 and run_database.base_time is not None:
                base_time = mytime.format_time(run_database.base_time)
            crawler_name = run_database.database_type + "-" + run_database.database_name + "-crawler"
            job_name = f"{const.SOLUTION_NAME}-Detection-Job-{run_database.database_type.upper()}-{run_database.database_name}"
            execution_input = {
                "JobName": job_name,
                "CrawlerName": crawler_name,
                "JobId": str(job.id),
                "RunId": str(run_id),
                "RunDatabaseId": str(run_database.id),
                "AccountId": run_database.account_id,
                "Region": run_database.region,
                "DatabaseType": run_database.database_type,
                "DatabaseName": run_database.database_name,
                "TemplateId": str(job.template_id),
                "TemplateSnapshotNo": str(run.template_snapshot_no),
                "Depth": str(job.depth),
                "BaseTime": base_time,
                # "JobBookmarkOption": job_bookmark_option,
                "DetectionThreshold": str(job.detection_threshold),
                "OverWrite": str(job.overwrite),
                "AdminAccountId": admin_account_id,
                "BucketName": project_bucket_name,
                "AdditionalPythonModules": ','.join([module_path + w for w in wheels]),
                "FirstWait": str(account_first_wait[account_id]),
                "LoopWait": str(account_loop_wait[account_id]),
                "QueueUrl": f'https://sqs.{run_database.region}.amazonaws.com{url_suffix}/{admin_account_id}/{const.SOLUTION_NAME}-DiscoveryJob',
            }
            run_database.start_time = mytime.get_time()
            __create_job(run_database.database_type, run_database.account_id, run_database.region, run_database.database_name, job_name)
            __exec_run(execution_input, run_database.uuid)
            run_database.state = RunDatabaseState.RUNNING.value
        except Exception:
            msg = traceback.format_exc()
            run_database.state = RunDatabaseState.FAILED.value
            run_database.end_time = mytime.get_time()
            run_database.log = msg
            logger.exception("Run StepFunction exception:%s" % msg)
    crud.save_run_databases(run_databases)


def __create_job(database_type, account_id, region, database_name, job_name):
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:{partition}:iam::{account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{region}',
        RoleSessionName="AssumeRoleSession2"
    )
    credentials = assumed_role_object['Credentials']

    client_glue = boto3.client('glue',
                               aws_access_key_id=credentials['AccessKeyId'],
                               aws_secret_access_key=credentials['SecretAccessKey'],
                               aws_session_token=credentials['SessionToken'],
                               region_name=region,
                               )
    try:
        response = client_glue.get_job(JobName=job_name)
    except client_glue.exceptions.EntityNotFoundException as e:
        if database_type == DatabaseType.RDS.value:
            client_glue.create_job(Name=job_name,
                                   Role=f'{const.SOLUTION_NAME}GlueDetectionJobRole-{region}',
                                   GlueVersion='4.0',
                                   Command={'Name': 'glueetl',
                                            'ScriptLocation': f's3://{project_bucket_name}/job/script/glue-job.py'},
                                   Tags={const.PROJECT_TAG_KEY: const.PROJECT_TAG_VALUE,
                                         'AdminAccountId': admin_account_id,
                                         const.VERSION: version},
                                   NumberOfWorkers=2,
                                   WorkerType='G.1X',
                                   ExecutionProperty={'MaxConcurrentRuns': 100},
                                   Connections={'Connections': [f'rds-{database_name}-connection']},
                                   )
        else:
            client_glue.create_job(Name=job_name,
                                   Role=f'{const.SOLUTION_NAME}GlueDetectionJobRole-{region}',
                                   GlueVersion='4.0',
                                   Command={'Name': 'glueetl',
                                            'ScriptLocation': f's3://{project_bucket_name}/job/script/glue-job.py'},
                                   Tags={const.PROJECT_TAG_KEY: const.PROJECT_TAG_VALUE,
                                         'AdminAccountId': admin_account_id,
                                         const.VERSION: version},
                                   NumberOfWorkers=2,
                                   WorkerType='G.1X',
                                   ExecutionProperty={'MaxConcurrentRuns': 1000},
                                   )


def __exec_run(execution_input, current_uuid):
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:{partition}:iam::{execution_input["AccountId"]}:role/{const.SOLUTION_NAME}RoleForAdmin-{execution_input["Region"]}',
        RoleSessionName="AssumeRoleSession1"
    )
    credentials = assumed_role_object['Credentials']

    client_sfn = boto3.client('stepfunctions',
                              aws_access_key_id=credentials['AccessKeyId'],
                              aws_secret_access_key=credentials['SecretAccessKey'],
                              aws_session_token=credentials['SessionToken'],
                              region_name=execution_input["Region"],
                              )
    client_sfn.start_execution(
        stateMachineArn=f'arn:{partition}:states:{execution_input["Region"]}:{execution_input["AccountId"]}:stateMachine:{const.SOLUTION_NAME}-DiscoveryJob',
        name=f'{const.SOLUTION_NAME}-{execution_input["RunId"]}-{execution_input["RunDatabaseId"]}-{current_uuid}',
        input=json.dumps(execution_input),
    )


def stop_job(job_id: int):
    db_run: models.DiscoveryJobRun = crud.get_running_run(job_id)
    if db_run is None:
        raise BizException(MessageEnum.DISCOVERY_JOB_NON_RUNNING.get_code(),
                           MessageEnum.DISCOVERY_JOB_NON_RUNNING.get_msg())
    if db_run.state == RunState.STOPPING.value:
        delta_seconds = (mytime.get_now() - db_run.modify_time).seconds
        if delta_seconds < 900:
            raise BizException(MessageEnum.DISCOVERY_JOB_STOPPING.get_code(),
                               MessageEnum.DISCOVERY_JOB_STOPPING.get_msg())

    run_databases: list[models.DiscoveryJobRunDatabase] = db_run.databases
    crud.stop_run(job_id, db_run.id, True)
    job = crud.get_job(job_id)
    for run_database in run_databases:
        logger.info(f"Stop job,JobId:{job_id},RunId:{run_database.run_id},RunDatabaseId:{run_database.id},"
                    f"AccountId:{run_database.account_id},Region:{run_database.region},"
                    f"DatabaseType:{run_database.database_type},DatabaseName:{run_database.database_name}")
        __stop_run(run_database)
        __send_complete_run_database_message(job_id, run_database.run_id, run_database.id, run_database.account_id,
                                             run_database.region, run_database.database_type, run_database.database_name,
                                             job.overwrite == 1, RunDatabaseState.STOPPED.value)


def __stop_run(run_database: models.DiscoveryJobRunDatabase):
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:{partition}:iam::{run_database.account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{run_database.region}',
        RoleSessionName="AssumeRoleSession1"
    )
    credentials = assumed_role_object['Credentials']

    client_sfn = boto3.client('stepfunctions',
                              aws_access_key_id=credentials['AccessKeyId'],
                              aws_secret_access_key=credentials['SecretAccessKey'],
                              aws_session_token=credentials['SessionToken'],
                              region_name=run_database.region,
                              )
    try:
        client_sfn.stop_execution(
            executionArn=f'arn:{partition}:states:{run_database.region}:{run_database.account_id}:execution:{const.SOLUTION_NAME}-DiscoveryJob:{const.SOLUTION_NAME}-{run_database.run_id}-{run_database.id}-{run_database.uuid}',
            )
    except client_sfn.exceptions.ExecutionDoesNotExist as e:
        logger.warning(e)


def get_runs(job_id: int):
    return crud.get_runs(job_id)


def get_run(run_id: int):
    return crud.get_run(run_id)


def list_run_databases_pagination(run_id: int, condition: QueryCondition):
    return crud.list_run_databases_pagination(run_id, condition)


def get_run_status(job_id: int, run_id: int) -> schemas.DiscoveryJobRunDatabaseStatus:
    run_list = crud.list_run_databases(run_id)
    total_count = success_count = fail_count = ready_count = running_count = stopped_count = not_existed_count = 0
    success_per = fail_per = ready_per = running_per = stopped_per = not_existed_per = 0

    total_count = len(run_list)
    if total_count > 0:
        for run_item in run_list:
            if run_item.state == RunDatabaseState.SUCCEEDED.value:
                success_count += 1
            elif run_item.state == RunDatabaseState.FAILED.value:
                fail_count += 1
            elif run_item.state == RunDatabaseState.READY.value:
                ready_count += 1
            elif run_item.state == RunDatabaseState.RUNNING.value:
                running_count += 1
            elif run_item.state == RunDatabaseState.STOPPED.value:
                stopped_count += 1
            elif run_item.state == RunDatabaseState.NOT_EXIST.value:
                not_existed_count += 1

        fail_per = int(fail_count / total_count * 100)
        ready_per = int(ready_count / total_count * 100)
        running_per = int(running_count / total_count * 100)
        stopped_per = int(stopped_count / total_count * 100)
        not_existed_per = int(not_existed_count / total_count * 100)
        success_per = 100 - fail_per - ready_per - running_per - stopped_per - not_existed_per
    status = schemas.DiscoveryJobRunDatabaseStatus(
        id=job_id,
        run_id=run_id,
        success_count=success_count,
        fail_count=fail_count,
        ready_count=ready_count,
        running_count=running_count,
        stopped_count=stopped_count,
        not_existed_count=not_existed_count,
        total_count=total_count,
        success_per=success_per,
        fail_per=fail_per,
        ready_per=ready_per,
        running_per=running_per,
        stopped_per=stopped_per,
        not_existed_per=not_existed_per
    )
    return status


def get_run_database_progress(job_id: int, run_id: int, run_database_id: int) -> schemas.DiscoveryJobRunDatabaseProgress:
    run_database = crud.get_run_database(run_database_id)
    if run_database.table_count is None:
        try:
            run_database.table_count = __get_table_count_from_agent(run_database)
            crud.save_run_database(run_database)
        except Exception:
            message = traceback.format_exc()
            logger.exception(f"get table count from agent exception:{message}")
            return schemas.DiscoveryJobRunDatabaseProgress(current_table_count=-1,
                                                           table_count=-1)
    current_table_count = -1
    if run_database.state == RunDatabaseState.READY.value:
        current_table_count = 0
    # elif run_database.state == RunDatabaseState.SUCCEEDED.value:
    #     current_table_count = run_database.table_count
    elif run_database.state == RunDatabaseState.NOT_EXIST.value:
        current_table_count = -1
    else:
        current_table_count = __get_current_table_count(run_database.id)
    progress = schemas.DiscoveryJobRunDatabaseProgress(run_database_id=run_database_id,
                                                       current_table_count=current_table_count,
                                                       table_count=run_database.table_count)
    return progress


def get_run_progress(job_id: int, run_id: int) -> list[schemas.DiscoveryJobRunDatabaseProgress]:
    run = crud.get_run(run_id)
    run_current_table_count = __get_run_current_table_count(run_id)
    run_progress = []
    for run_database in run.databases:
        if run_database.table_count is None:
            try:
                run_database.table_count = __get_table_count_from_agent(run_database)
                crud.save_run_database(run_database)
            except Exception:
                message = traceback.format_exc()
                logger.exception(f"get table count from agent exception:{message}")
                progress = schemas.DiscoveryJobRunDatabaseProgress(run_database_id=run_database.id,
                                                                   current_table_count=-1,
                                                                   table_count=-1)
                run_progress.append(progress)
                continue
        current_table_count = run_current_table_count.get(run_database.id)
        if current_table_count is None:
            current_table_count = 0
        progress = schemas.DiscoveryJobRunDatabaseProgress(run_database_id=run_database.id,
                                                           current_table_count=current_table_count,
                                                           table_count=run_database.table_count)
        run_progress.append(progress)
    return run_progress


def __get_run_current_table_count(run_id: int):
    sql = f"select run_database_id,count(distinct table_name) from sdps_database.job_detection_output_table where run_id='{run_id}' group by run_database_id"
    current_table_count = __query_athena(sql)
    logger.debug(current_table_count)
    table_count = {}
    for row in current_table_count[1:]:
        row_result = [__get_cell_value(cell) for cell in row]
        table_count[int(row_result[0])] = int(row_result[1])
    logger.debug(table_count)
    return table_count


def __get_current_table_count(run_database_id: int):
    sql = f"select count(distinct table_name) from sdps_database.job_detection_output_table where run_database_id='{run_database_id}'"
    current_table_count = __query_athena(sql)
    logger.debug(current_table_count)
    return int(current_table_count[1][0]["VarCharValue"])


def __get_table_count_from_agent(run_database: models.DiscoveryJobRunDatabase):
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:{partition}:iam::{run_database.account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{run_database.region}',
        RoleSessionName="AssumeRoleSession1"
    )
    credentials = assumed_role_object['Credentials']

    glue = boto3.client(service_name='glue',
                        aws_access_key_id=credentials['AccessKeyId'],
                        aws_secret_access_key=credentials['SecretAccessKey'],
                        aws_session_token=credentials['SessionToken'],
                        region_name=run_database.region,
                        )
    next_token = ""
    count = 0
    while True:
        response = glue.get_tables(
            DatabaseName=f'{run_database.database_type}-{run_database.database_name}-database',
            NextToken=next_token)
        count += len(response['TableList'])
        next_token = response.get('NextToken')
        if next_token is None:
            break
    return count


def __send_complete_run_database_message(job_id, run_id, run_database_id, account_id, region,
                                         database_type, database_name, over_write, state):
    event = {'Result': {'State': state},
             'JobId': job_id,
             'RunId': run_id,
             'RunDatabaseId': run_database_id,
             'AccountId': account_id,
             'Region': region,
             'DatabaseType': database_type,
             'DatabaseName': database_name,
             'OverWrite': '1' if over_write else '0',
             }
    queue = sqs_job.get_queue_by_name(QueueName=const.JOB_QUEUE_NAME)
    queue.send_message(MessageBody=json.dumps(event))


def change_run_state(run_id: int):
    run_databases = crud.count_run_databases(run_id)
    # If there are running tasks, the state is running.
    for state, count in run_databases:
        if state == RunDatabaseState.RUNNING.value:
            logger.info("There are also running tasks.")
            return
    crud.complete_run(run_id)


def complete_run_database(input_event):
    state = input_event["Result"]["State"]
    message = ""
    if "Message" in input_event["Result"]:
        message = input_event["Result"]["Message"]
    if state == RunDatabaseState.SUCCEEDED.value or state == RunDatabaseState.STOPPED.value:
        try:
            sync_job_detection_result(input_event["AccountId"],
                                      input_event["Region"],
                                      input_event["DatabaseType"],
                                      input_event["DatabaseName"],
                                      input_event["RunId"],
                                      input_event["OverWrite"] == "1",
                                      )
        except Exception:
            state = RunDatabaseState.FAILED.value
            message = traceback.format_exc()
            logger.exception("sync job detection result exception:%s" % message)
    run_database = crud.complete_run_database(input_event["RunDatabaseId"], state, message)
    if run_database is not None and state == RunDatabaseState.SUCCEEDED.value:
        crud.update_job_database_base_time(input_event["JobId"],
                                           input_event["AccountId"],
                                           input_event["Region"],
                                           input_event["DatabaseType"],
                                           input_event["DatabaseName"],
                                           run_database.start_time
                                            )


def check_running_run():
    run_databases = crud.get_running_run_databases()
    for run_database in run_databases:
        run_database_state = __get_run_database_state_from_agent(run_database)
        logger.info(f"check running run,run database id:{run_database.id},run id:{run_database.run_id}"
                    f",account id:{run_database.account_id},region:{run_database.region}"
                    f",database type:{run_database.database_type},database name:{run_database.database_name}"
                    f",state:{run_database_state}")
        if run_database_state == RunDatabaseState.RUNNING.value.upper():
            continue
        if run_database_state == RunDatabaseState.NOT_EXIST.value:
            run_database.state = RunDatabaseState.NOT_EXIST.value
            run_database.log = 'Execution Does Not Exist'
        elif run_database_state == RunDatabaseState.SUCCEEDED.value.upper():
            run_database.state = RunDatabaseState.SUCCEEDED.value
        elif run_database_state == RunDatabaseState.FAILED.value.upper():
            error_log = __get_run_error_log(run_database)
            run_database.state = RunDatabaseState.FAILED.value
            run_database.log = error_log

        job = crud.get_job_by_run_id(run_database.run_id)
        if run_database_state != RunDatabaseState.NOT_EXIST.value:
            __send_complete_run_database_message(job.id, run_database.run_id, run_database.id, run_database.account_id,
                                                 run_database.region, run_database.database_type,
                                                 run_database.database_name,
                                                 job.overwrite == 1, run_database.state)
        run_database.end_time = mytime.get_time()
        crud.save_run_database(run_database)
        change_run_state(run_database.run_id)
        if run_database_state == RunDatabaseState.SUCCEEDED.value.upper():
            job = crud.get_job_by_run_id(run_database.run_id)
            crud.update_job_database_base_time(job.id,
                                               run_database.account_id,
                                               run_database.region,
                                               run_database.database_type,
                                               run_database.database_name,
                                               run_database.start_time
                                               )


def __get_run_database_state_from_agent(run_database: models.DiscoveryJobRunDatabase) -> str:
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:{partition}:iam::{run_database.account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{run_database.region}',
        RoleSessionName="AssumeRoleSession1"
    )
    credentials = assumed_role_object['Credentials']

    client_sfn = boto3.client('stepfunctions',
                              aws_access_key_id=credentials['AccessKeyId'],
                              aws_secret_access_key=credentials['SecretAccessKey'],
                              aws_session_token=credentials['SessionToken'],
                              region_name=run_database.region,
                              )

    try:
        response = client_sfn.describe_execution(
            executionArn=f'arn:{partition}:states:{run_database.region}:{run_database.account_id}:execution:{const.SOLUTION_NAME}-DiscoveryJob:{const.SOLUTION_NAME}-{run_database.run_id}-{run_database.id}-{run_database.uuid}',
        )
        return response["status"]
    except client_sfn.exceptions.ExecutionDoesNotExist as e:
        return RunDatabaseState.NOT_EXIST.value


def __get_run_error_log(run_database: models.DiscoveryJobRunDatabase) -> str:
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:{partition}:iam::{run_database.account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{run_database.region}',
        RoleSessionName="AssumeRoleSession1"
    )
    credentials = assumed_role_object['Credentials']

    client_sfn = boto3.client('stepfunctions',
                              aws_access_key_id=credentials['AccessKeyId'],
                              aws_secret_access_key=credentials['SecretAccessKey'],
                              aws_session_token=credentials['SessionToken'],
                              region_name=run_database.region,
                              )
    try:
        response = client_sfn.get_execution_history(
            executionArn=f'arn:{partition}:states:{run_database.region}:{run_database.account_id}:execution:{const.SOLUTION_NAME}-DiscoveryJob:{const.SOLUTION_NAME}-{run_database.run_id}-{run_database.id}-{run_database.uuid}',
            reverseOrder=True,
            maxResults=1,
        )
    except client_sfn.exceptions.ExecutionDoesNotExist as e:
        return RunDatabaseState.NOT_EXIST.value
    if response["events"][0]["type"] == "ExecutionFailed":
        return response["events"][0]["executionFailedEventDetails"]["cause"]
    return ""


def __get_cell_value(cell: dict):
    if "VarCharValue" in cell:
        return cell["VarCharValue"]
    else:
        return ""


def get_report_url(run_id: int):
    run_result = __query_athena(sql_result % run_id)

    wb = Workbook()

    ws1 = wb.active
    ws1.title = "Amazon S3"
    ws2 = wb.create_sheet("Amazon RDS")
    ws1.append(["account_id", "region", "s3_bucket", "s3_location", "column_name", "identifiers", "sample_data"])
    ws2.append(["account_id", "region", "rds_instance_id", "table_name,", "column_name", "identifiers", "sample_data"])

    for row in run_result[1:]:
        row_result = [__get_cell_value(cell) for cell in row]
        database_type = row_result[0]
        del row_result[0]
        if database_type == DatabaseType.S3.value:
            del row_result[4:6]
            ws1.append(row_result)
        else:
            del row_result[2:4]
            ws2.append(row_result)

    error_result = __query_athena(sql_error % run_id)
    if len(error_result) > 1:
        ws3 = wb.create_sheet("Detect failed tables")
        ws3.append(["account_id", "region", "database_type", "database_name", "table_name", "error_message"])
        for row in error_result[1:]:
            row_result = [__get_cell_value(cell) for cell in row]
            ws3.append(row_result)

    filename = NamedTemporaryFile().name
    wb.save(filename)
    s3_client = boto3.client('s3')
    key_name = f"report/report-{run_id}.xlsx"
    s3_client.upload_file(filename, project_bucket_name, key_name)
    os.remove(filename)
    method_parameters = {'Bucket': project_bucket_name, 'Key': key_name}
    pre_url = s3_client.generate_presigned_url(
        ClientMethod="get_object",
        Params=method_parameters,
        ExpiresIn=60
    )
    return pre_url


def __query_athena(sql: str):
    logger.debug(sql)
    client = boto3.client("athena")
    queryStart = client.start_query_execution(
        QueryString=sql,
        QueryExecutionContext={
            "Database": const.JOB_RESULT_DATABASE_NAME,
            "Catalog": "AwsDataCatalog",
        },
        ResultConfiguration={"OutputLocation": f"s3://{project_bucket_name}/athena-output/"},
    )

    query_execution_id = queryStart["QueryExecutionId"]
    while True:
        response = client.get_query_execution(QueryExecutionId=query_execution_id)
        query_execution_status = response["QueryExecution"]["Status"]["State"]
        if query_execution_status == AthenaQueryState.SUCCEEDED.value:
            break
        if query_execution_status == AthenaQueryState.FAILED.value:
            logger.exception(response)
            raise Exception("Query Asset STATUS:" + response["QueryExecution"]["Status"]["StateChangeReason"])
        else:
            time.sleep(1)

    results_paginator = client.get_paginator('get_query_results')
    results_iterator = results_paginator.paginate(
        QueryExecutionId=query_execution_id,
        PaginationConfig={
            'PageSize': 1000
        }
    )

    first_page = True
    result = []
    for results_page in results_iterator:
        tmp_result = [x["Data"] for x in results_page["ResultSet"]["Rows"]]
        if first_page:
            first_page = False
            result += tmp_result
        else:
            result += tmp_result[1:]
    return result


def get_template_snapshot_url(run_id: int):
    job_run = crud.get_run(run_id)
    if job_run.template_id is None or job_run.template_snapshot_no is None:
        raise BizException(MessageEnum.DISCOVERY_RUN_NON_EXIST_TEMPLATE_SNAPSHOT.get_code(),
                           MessageEnum.DISCOVERY_RUN_NON_EXIST_TEMPLATE_SNAPSHOT.get_msg())
    s3_client = boto3.client('s3')
    key_name = f"template/template-{job_run.template_id}-{job_run.template_snapshot_no}.json"
    method_parameters = {'Bucket': project_bucket_name, 'Key': key_name}
    pre_url = s3_client.generate_presigned_url(
        ClientMethod="get_object",
        Params=method_parameters,
        ExpiresIn=60
    )
    return pre_url


def can_delete_account(account_id: str, region: str):
    db_count = crud.count_account_run_job(account_id, region)
    return db_count == 0


def delete_account(account_id: str, region: str):
    if can_delete_account(account_id, region):
        crud.delete_account(account_id, region)
    else:
        raise BizException(MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_ACCOUNT.get_code(),
                           MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_ACCOUNT.get_msg())


def can_delete_database(account_id: str, region: str, database_type: str, database_name: str):
    db_count = crud.count_database_run_job(account_id, region, database_type, database_name)
    return db_count == 0


def delete_database(account_id: str, region: str, database_type: str, database_name: str):
    if can_delete_database(account_id, region, database_type, database_name):
        crud.delete_database(account_id, region, database_type, database_name)
    else:
        raise BizException(MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_code(),
                           MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_msg())
