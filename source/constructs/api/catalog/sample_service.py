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
    result_table = const.JOB_RESULT_TABLE_NAME
    full_database_name = f"{database_type}-{database_name}-database"
    file_folder_path = f"glue-database/{result_table}/{full_database_name}/{table_name}/"
    bucket_name = os.getenv(const.PROJECT_BUCKET_NAME, const.PROJECT_BUCKET_DEFAULT_NAME)
    file_uri = ''
    s3 = boto3.client('s3')
    response = s3.list_objects_v2(Bucket=bucket_name,
                                  Prefix=file_folder_path)
    logging.info(response)
    if 'Contents' in response and response['Contents']:
        # 提取文件路径
        file_paths = [obj['Key'] for obj in response['Contents']]
        logging.info(file_paths)
        # 打印文件路径
        for file_path in file_paths:
            key = file_folder_path + file_path
            logging.info(key)
            file_uri = key
            break
    if file_uri:
        return gen_s3_temp_uri(bucket_name, file_uri)
    return file_uri


def get_glue_job_run(account_id, region, job_name):
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
    response = client_glue.get_job_runs(JobName=job_name, MaxResults=1)
    logger.info(response)
    # 检查作业运行记录是否存在
    status = None
    if 'JobRuns' in response and len(response['JobRuns']) > 0:
        # 获取第一个作业运行记录的执行状态
        status = response['JobRuns'][0]['JobRunState']
        logger.info(f"Job status: {status}")
    else:
        logger.info("No job runs found.")
    return status


def init_s3_sample_job(account_id: str, region: str, bucket_name: str, resource_name: str, refresh: bool):
    result_list = []
    if refresh:
        job_name = f'{DatabaseType.S3.value}_{bucket_name}_{resource_name}_job'
        job = schemas.DiscoveryJobCreate(
            name=job_name,
            description='get s3 sample data',
            range=0,
            schedule=const.ON_DEMAND,
            databases=[
                schemas.DiscoveryJobDatabaseCreate(
                    account_id=account_id,
                    region=region,
                    database_type=DatabaseType.S3.value,
                    database_name=bucket_name
                )
            ]
        )
        # start glue job
        logger.info(job)
        discovery_job = create_job(job)
        logger.info(discovery_job.id)
        response = start_sample_job(discovery_job.id, resource_name)
        logger.info(response)
        # get glue result
        file_uri = ''
        job_name = f"{const.SOLUTION_NAME}-Sample-Job-S3"
        status = get_glue_job_run(account_id, region, job_name)
        while status != 'SUCCEEDED' or status != 'FAILED':
            status = get_glue_job_run(account_id, region, job_name)
            if status == 'SUCCEEDED':
                file_uri = get_sample_file_uri(DatabaseType.S3.value, bucket_name, resource_name)
                while file_uri == '' or file_uri is None:
                    file_uri = get_sample_file_uri(DatabaseType.S3.value, bucket_name, resource_name)
                logger.info(file_uri)
                break
            elif status == 'FAILED':
                logger.info(f"sample glue job failed {str(response)}")
                break


def init_rds_sample_job(account_id: str, region: str, instance_id: str, table_name: str, refresh: bool):
    job_name = f'{DatabaseType.RDS.value}_{instance_id}_{table_name}_job'
    job = schemas.DiscoveryJobCreate(
        name=job_name,
        description='get rds sample data',
        range=0,
        schedule=const.ON_DEMAND,
        databases=[
            schemas.DiscoveryJobDatabaseCreate(
                account_id=account_id,
                region=region,
                database_type=DatabaseType.RDS.value,
                database_name=instance_id
            )
        ]
    )
    logger.info(job)
    discovery_job = create_job(job)
    logger.info(discovery_job.id)
    response = start_sample_job(discovery_job.id, table_name)
    logger.info(response)
    job_name = f"{const.SOLUTION_NAME}-Sample-Job-RDS-" + instance_id
    response = get_glue_job_run(account_id, region, job_name)
    logger.info(response)
    status = response['JobRuns'][0]['JobRunState']
    if status == 'SUCCEEDED':
        return 1
    file_uri = get_sample_file_uri(DatabaseType.RDS.value, instance_id, table_name)
