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
    return response


def init_s3_sample_job(account_id: str, region: str, bucket_name: str, resource_name: str, refresh: bool):
    if refresh:
        job = schemas.DiscoveryJobCreate(
            name='s3_' + bucket_name + '_' + resource_name + '_job',
            description='get sample data',
            range=0,
            schedule=const.ON_DEMAND,
            databases=[
                schemas.DiscoveryJobDatabaseCreate(
                    account_id=account_id,
                    region=region,
                    database_type='s3',
                    database_name=bucket_name
                )
            ]
        )
        logger.info(job)
        discovery_job = create_job(job)
        logger.info(discovery_job.id)
        response = start_sample_job(discovery_job.id, resource_name)
        logger.info(response)
        job_name = f"{const.SOLUTION_NAME}-Sample-Job-S3"
        response = get_glue_job_run(account_id, region, job_name)
        logger.info(response)
        status = response['JobRuns'][0]['JobRunState']
        if status == 'SUCCEEDED':
            return 1
    file_uri = get_sample_file_uri(DatabaseType.S3.value, bucket_name, resource_name)


def init_rds_sample_job(account_id: str, region: str, instance_id: str, table_name: str, refresh: bool):
    job = schemas.DiscoveryJobCreate(
        name='rds_' + instance_id + '_' + table_name + '_job',
        description='get sample data',
        range=0,
        schedule=const.ON_DEMAND,
        databases=[
            schemas.DiscoveryJobDatabaseCreate(
                account_id=account_id,
                region=region,
                database_type='rds',
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
