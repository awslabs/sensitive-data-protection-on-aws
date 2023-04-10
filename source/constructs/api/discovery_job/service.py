import os
import boto3
import json
import logging
import db.models_discovery_job as models
from . import crud, schemas
from common.exception_handler import BizException
from common.enum import MessageEnum, JobState, RunDatabaseState, DatabaseType
from common.constant import const
from common.query_condition import QueryCondition
import traceback
import tools.mytime as mytime
import datetime, time
from openpyxl import Workbook
from tempfile import NamedTemporaryFile
from catalog.service import sync_job_detection_result
from catalog.crud import get_catalog_database_level_classification_by_type_all

logger = logging.getLogger(const.LOGGER_API)
controller_function_name = f"{const.SOLUTION_NAME}-Controller"
admin_region = boto3.session.Session().region_name
admin_account_id = boto3.client('sts').get_caller_identity().get('Account')
project_bucket_name = os.getenv(const.PROJECT_BUCKET_NAME, const.PROJECT_BUCKET_DEFAULT_NAME)

sql_result = "SELECT database_type,account_id,region,s3_bucket,s3_location,rds_instance_id,table_name,column_name,identifiers,sample_data FROM job_detection_output_table where run_id='%d' and privacy = 1"
sql_error = "SELECT account_id,region,database_type,database_name,table_name,error_message FROM job_detection_error_table where run_id='%d'"


def list_jobs(condition: QueryCondition):
    return crud.list_jobs(condition)


def get_job(id: int):
    return crud.get_job(id)


def __add_job_databases(job: schemas.DiscoveryJobCreate, database_type: DatabaseType):
    databases = get_catalog_database_level_classification_by_type_all(database_type.value).all()
    for database in databases:
        database_create = schemas.DiscoveryJobDatabaseCreate(
            account_id=database.account_id,
            region=database.region,
            database_type=database_type.value,
            database_name=database.database_name,)
        job.databases.append(database_create)


def create_job(job: schemas.DiscoveryJobCreate, ext: schemas.DiscoveryJobCreateExt):
    if ext is not None and ext.all_s3 == 1:
        __add_job_databases(job, DatabaseType.S3)
    if ext is not None and ext.all_rds == 1:
        __add_job_databases(job, DatabaseType.RDS)
    db_job = crud.create_job(job)
    if db_job.schedule != const.ON_DEMAND:
        create_event(db_job.id, db_job.schedule)
    return db_job


def create_event(job_id: int, schedule: str):
    rule_name = f'{const.SOLUTION_NAME}-{job_id}'
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
                'Arn': f'arn:aws-cn:lambda:{admin_region}:{admin_account_id}:function:{controller_function_name}',
                'Input': json.dumps(input),
            },
        ]
    )

    client_lambda = boto3.client('lambda')
    response = client_lambda.add_permission(
        Action='lambda:InvokeFunction',
        FunctionName=controller_function_name,
        Principal='events.amazonaws.com',
        SourceArn=f'arn:aws-cn:events:{admin_region}:{admin_account_id}:rule/{rule_name}',
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
    rule_name = f'{const.SOLUTION_NAME}-{job_id}'
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
    rule_name = f'{const.SOLUTION_NAME}-{job_id}'
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
    rule_name = f'{const.SOLUTION_NAME}-{id}'
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
    rule_name = f'{const.SOLUTION_NAME}-{id}'
    client_events = boto3.client('events')
    client_events.disable_rule(Name=rule_name)
    crud.disable_job(id)


def start_job(id: int):
    run_id = crud.init_run(id)
    if run_id >= 0:
        __start_run(id, run_id)


def __start_run(job_id: int, run_id: int):
    job = crud.get_job(job_id)
    run_databases = crud.list_run_databases(run_id)
    module_path = f's3://{project_bucket_name}/job/ml-asset/python-module/'
    wheels = ["flatbuffers-23.1.21-py2.py3-none-any.whl",
              "protobuf-4.22.0-cp37-abi3-manylinux2014_x86_64.whl",
              "onnxruntime-1.10.0-cp37-cp37m-manylinux_2_17_x86_64.manylinux2014_x86_64.whl",
              "sdps_ner-0.5.0-py3-none-any.whl",
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
            base_time = str(datetime.datetime.min)
            if job.range == 1 and job.base_time is not None:
                base_time = mytime.format_time(job.base_time)
            crawler_name = run_database.database_type + "-" + run_database.database_name + "-crawler"
            job_name = f"{const.SOLUTION_NAME}-Detection-Job-S3"
            if run_database.database_type == DatabaseType.RDS.value:
                job_name = f"{const.SOLUTION_NAME}-Detection-Job-RDS-" + run_database.database_name
            execution_input = {
                "JobId": str(job.id),
                "JobRange": str(job.range),
                "BaseTime": base_time,
                "Depth": str(job.depth),
                "RunId": str(run_id),
                "RunDatabaseId": str(run_database.id),
                "AccountId": run_database.account_id,
                "Region": run_database.region,
                "CrawlerName": crawler_name,
                "JobName": job_name,
                "DatabaseName": run_database.database_name,
                "DatabaseType": run_database.database_type,
                "TemplateId": str(job.template_id),
                "DetectionThreshold": str(job.detection_threshold),
                "AdminAccountId": admin_account_id,
                "BucketName": project_bucket_name,
                "AdditionalPythonModules": ','.join([module_path + w for w in wheels]),
                "FirstWait": str(account_first_wait[account_id]),
                "LoopWait": str(account_loop_wait[account_id]),
                "QueueUrl": f'https://sqs.{run_database.region}.amazonaws.com.cn/{admin_account_id}/{const.SOLUTION_NAME}-DiscoveryJob',
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
        RoleArn=f'arn:aws-cn:iam::{account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{region}',
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
                                   GlueVersion='3.0',
                                   Command={'Name': 'glueetl',
                                            'ScriptLocation': f's3://{project_bucket_name}/job/script/glue-job.py'},
                                   Tags={'AdminAccountId': admin_account_id},
                                   Connections={'Connections': [f'rds-{database_name}-connection']},
                                   ExecutionProperty={'MaxConcurrentRuns': 3},
                                   )
        else:
            client_glue.create_job(Name=job_name,
                                   Role=f'{const.SOLUTION_NAME}GlueDetectionJobRole-{region}',
                                   GlueVersion='3.0',
                                   Command={'Name': 'glueetl',
                                            'ScriptLocation': f's3://{project_bucket_name}/job/script/glue-job.py'},
                                   Tags={'AdminAccountId': admin_account_id},
                                   ExecutionProperty={'MaxConcurrentRuns': 100},
                                   )


def __exec_run(execution_input, current_uuid):
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:aws-cn:iam::{execution_input["AccountId"]}:role/{const.SOLUTION_NAME}RoleForAdmin-{execution_input["Region"]}',
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
        stateMachineArn=f'arn:aws-cn:states:{execution_input["Region"]}:{execution_input["AccountId"]}:stateMachine:{const.SOLUTION_NAME}-DiscoveryJob',
        name=f'{const.SOLUTION_NAME}-{execution_input["RunId"]}-{execution_input["RunDatabaseId"]}-{current_uuid}',
        input=json.dumps(execution_input),
    )


def stop_job(id: int):
    db_run: models.DiscoveryJobRun = crud.get_running_run(id)
    if db_run is None:
        raise BizException(MessageEnum.DISCOVERY_JOB_NON_RUNNING.get_code(),
                           MessageEnum.DISCOVERY_JOB_NON_RUNNING.get_msg())
    run_databases: list[models.DiscoveryJobRunDatabase] = db_run.databases
    for run_database in run_databases:
        __stop_run(run_database)
    crud.stop_run(id, db_run.id)


def __stop_run(run_database: models.DiscoveryJobRunDatabase):
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:aws-cn:iam::{run_database.account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{run_database.region}',
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
            executionArn=f'arn:aws-cn:states:{run_database.region}:{run_database.account_id}:execution:{const.SOLUTION_NAME}-DiscoveryJob:{const.SOLUTION_NAME}-{run_database.run_id}-{run_database.id}-{run_database.uuid}',
            )
    except client_sfn.exceptions.ExecutionDoesNotExist as e:
        logger.warning(e)


def get_runs(job_id: int):
    return crud.get_runs(job_id)


def get_run(run_id: int):
    return crud.get_run(run_id)


def list_run_databases_pagination(run_id: int, condition: QueryCondition):
    return crud.list_run_databases_pagination(run_id, condition)


def list_run_databases(run_id: int):
    return crud.list_run_databases(run_id)


def get_run_status(job_id: int, run_id: int) -> schemas.DiscoveryJobRunDatabaseStatus:
    run_list = list_run_databases(run_id)
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


def change_run_state(run_id: int):
    run_databases = crud.count_run_databases(run_id)
    # If there are running tasks, the state is running.
    for state, count in run_databases:
        if state == RunDatabaseState.RUNNING.value:
            logger.info("There are also running tasks.")
            return
    crud.complete_run(run_id)


def complete_run_database(input_event):
    message = ""
    if "Message" in input_event["Result"]:
        message = input_event["Result"]["Message"]
    crud.complete_run_database(input_event["RunDatabaseId"], input_event["Result"]["State"], message)
    sync_job_detection_result(input_event["AccountId"],
                              input_event["Region"],
                              input_event["DatabaseType"],
                              input_event["DatabaseName"],
                              input_event["RunId"],
                              )


def check_running_run():
    run_databases = crud.get_running_run_databases()
    for run_database in run_databases:
        run_database_state = __get_run_database_state(run_database)
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
        run_database.end_time = mytime.get_time()
        crud.save_run_database(run_database)
        change_run_state(run_database.run_id)
        try:
            if run_database_state == RunDatabaseState.SUCCEEDED.value.upper():
                sync_job_detection_result(run_database.account_id,
                                          run_database.region,
                                          run_database.database_type,
                                          run_database.database_name,
                                          run_database.run_id,
                                          )
        except Exception:
            msg = traceback.format_exc()
            logger.exception("sync_job_detection_result exception:%s" % msg)


def __get_run_database_state(run_database: models.DiscoveryJobRunDatabase) -> str:
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:aws-cn:iam::{run_database.account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{run_database.region}',
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
            executionArn=f'arn:aws-cn:states:{run_database.region}:{run_database.account_id}:execution:{const.SOLUTION_NAME}-DiscoveryJob:{const.SOLUTION_NAME}-{run_database.run_id}-{run_database.id}-{run_database.uuid}',
        )
        return response["status"]
    except client_sfn.exceptions.ExecutionDoesNotExist as e:
        return RunDatabaseState.NOT_EXIST.value


def __get_run_error_log(run_database: models.DiscoveryJobRunDatabase) -> str:
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:aws-cn:iam::{run_database.account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{run_database.region}',
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
            executionArn=f'arn:aws-cn:states:{run_database.region}:{run_database.account_id}:execution:{const.SOLUTION_NAME}-DiscoveryJob:{const.SOLUTION_NAME}-{run_database.run_id}-{run_database.id}-{run_database.uuid}',
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


def get_report(run_id: int):
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
    client = boto3.client("athena")
    queryStart = client.start_query_execution(
        QueryString=sql,
        QueryExecutionContext={
            "Database": "sdps_database",
            "Catalog": "AwsDataCatalog",
        },
        ResultConfiguration={"OutputLocation": f"s3://{project_bucket_name}/athena-output/"},
    )

    query_id = queryStart["QueryExecutionId"]
    while True:
        response = client.get_query_execution(QueryExecutionId=query_id)
        query_execution_status = response["QueryExecution"]["Status"]["State"]
        if query_execution_status == "SUCCEEDED":
            break
        if query_execution_status == "FAILED":
            logger.exception(response)
            raise Exception("Query Asset STATUS:" + response["QueryExecution"]["Status"]["StateChangeReason"])
        else:
            time.sleep(1)

    result = client.get_query_results(QueryExecutionId=query_id)
    result = [x["Data"] for x in result["ResultSet"]["Rows"]]
    return result


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
