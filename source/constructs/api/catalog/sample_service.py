import boto3
import os
from discovery_job.service import create_job
from discovery_job.service import start_sample_job
from discovery_job import schemas
from common.constant import const
from common.enum import DatabaseType
import logging

logger = logging.getLogger(const.LOGGER_API)
caller_identity = boto3.client('sts').get_caller_identity()
partition = caller_identity['Arn'].split(':')[1]


def split_s3_path(s3_path):
    path_parts = s3_path.replace("s3://", "").split("/")
    bucket = path_parts.pop(0)
    key = "/".join(path_parts)
    return bucket, key


def gen_s3_temp_uri(bucket_name: str, key: str):
    s3_client = boto3.client('s3')
    method_parameters = {'Bucket': bucket_name, 'Key': key}
    pre_url = s3_client.generate_presigned_url(
        ClientMethod="get_object",
        Params=method_parameters,
        ExpiresIn=600
    )
    logger.info(pre_url)
    return pre_url


def get_sample_file_uri(database_type: str, database_name: str, table_name: str):
    result_table = const.JOB_SAMPLE_RESULT_TABLE_NAME
    full_database_name = f"{database_type}-{database_name}-database"
    file_folder_path = f"glue-database/{result_table}/{full_database_name}/{table_name}/"
    bucket_name = os.getenv(const.PROJECT_BUCKET_NAME, const.PROJECT_BUCKET_DEFAULT_NAME)
    file_uri = ''
    creation_time = ''
    s3 = boto3.client('s3')
    response = s3.list_objects_v2(Bucket=bucket_name,
                                  Prefix=file_folder_path)
    logging.debug(response)
    if 'Contents' in response and response['Contents']:
        # 提取文件路径
        file_paths = [obj['Key'] for obj in response['Contents']]
        logging.info(file_paths)
        # 打印文件路径
        for file_path in file_paths:
            file_uri = file_path
            logging.info(file_uri)
            break
    if file_uri:
        logger.info(f'{bucket_name}_{file_uri}')
        response = s3.head_object(Bucket=bucket_name, Key=file_uri)
        logger.debug(response)
        creation_time = response['LastModified']
        logger.info(creation_time)
        return f's3://{bucket_name}{file_uri}', gen_s3_temp_uri(bucket_name, file_uri), creation_time
    return f's3://{bucket_name}/{file_uri}', '', creation_time


def get_glue_job_run_status(account_id, region, job_name):
    client_sts = boto3.client('sts')
    assumed_role_object = client_sts.assume_role(
        RoleArn=f'arn:{partition}:iam::{account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{region}',
        RoleSessionName="AssumeRoleSession1"
    )
    credentials = assumed_role_object['Credentials']
    client_glue = boto3.client('glue',
                               aws_access_key_id=credentials['AccessKeyId'],
                               aws_secret_access_key=credentials['SecretAccessKey'],
                               aws_session_token=credentials['SessionToken'],
                               region_name=region,
                               )
    try:
        response = client_glue.get_job_runs(JobName=job_name, MaxResults=1)
        logger.debug(response)
        # 检查作业运行记录是否存在
        status = None
        if 'JobRuns' in response and len(response['JobRuns']) > 0:
            # 获取第一个作业运行记录的执行状态
            status = response['JobRuns'][0]['JobRunState']
            logger.info(f"Job status: {status}")
        else:
            logger.info("No job runs found.")
        return status
    except Exception as err:
        logger.info("get_job_runs error" + str(err))
    return None


def create_sample_job(account_id: str, database_name: str,
                      database_type: str, region: str, table_name: str, job_name: str):
    job = schemas.DiscoveryJobCreate(
        name=job_name,
        description=f'get {database_type} sample data',
        range=0,
        schedule=const.ON_DEMAND,
        databases=[
            schemas.DiscoveryJobDatabaseCreate(
                account_id=account_id,
                region=region,
                database_type=database_type,
                database_name=database_name
            )
        ]
    )
    # start glue job
    logger.debug(job)
    discovery_job = create_job(job)
    logger.info(discovery_job.id)
    response = start_sample_job(discovery_job.id, table_name)
    return response


def build_sample_data_response(state: str, pre_uri: str, real_uri: str, creation_date: str):
    result = {
        "status": state,
        "creation_date": creation_date,
        "pre_url": pre_uri,
        "source_url": real_uri
    }
    return result


def init_s3_sample_job(account_id: str, region: str, bucket_name: str, resource_name: str, refresh: bool):
    job_name = f"{const.SOLUTION_NAME}-Sample-Job-S3"
    status = get_glue_job_run_status(account_id, region, job_name)
    if status is None or refresh:
        response = create_sample_job(account_id, bucket_name, DatabaseType.S3.value, region, resource_name, job_name)
        logger.info(f" start to init sample job: {bucket_name},{resource_name},{response}")
        status = get_glue_job_run_status(account_id, region, job_name)
        logger.info(status)
        if status == 'SUCCEEDED':
            file_uri, pre_uri, creation_time = get_sample_file_uri(DatabaseType.S3.value, bucket_name, resource_name)
            return build_sample_data_response(status, pre_uri, file_uri, creation_time)
        else:
            return build_sample_data_response(status, '', '', '')
    else:
        file_uri, pre_uri, creation_time = get_sample_file_uri(DatabaseType.S3.value, bucket_name, resource_name)
        return build_sample_data_response(status, pre_uri, file_uri, creation_time)


def init_rds_sample_job(account_id: str, region: str, instance_id: str, table_name: str, refresh: bool):
    job_name = f"{const.SOLUTION_NAME}-Sample-Job-RDS-" + instance_id
    status = get_glue_job_run_status(account_id, region, job_name)
    if status is None or refresh:
        response = create_sample_job(account_id, instance_id, DatabaseType.RDS.value, region, table_name, job_name)
        logger.info(f" start to init sample job: {instance_id},{table_name},{response}")
        status = get_glue_job_run_status(account_id, region, job_name)
        logger.info(status)
        if status == 'SUCCEEDED':
            file_uri, pre_uri, creation_time = get_sample_file_uri(DatabaseType.S3.value, instance_id, table_name)
            return build_sample_data_response(status, pre_uri, file_uri, creation_time)
        else:
            return build_sample_data_response(status, '', '', '')
    else:
        file_uri, pre_uri, creation_time = get_sample_file_uri(DatabaseType.S3.value, instance_id, table_name)
        return build_sample_data_response(status, pre_uri, file_uri, creation_time)
