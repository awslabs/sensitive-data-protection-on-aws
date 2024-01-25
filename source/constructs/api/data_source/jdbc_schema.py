import boto3
import json
import traceback
from common.exception_handler import BizException
from common.enum import MessageEnum, Provider
from common.constant import const
from common.reference_parameter import logger, admin_account_id, admin_region, partition
from . import jdbc_database, crud
from .schemas import JdbcSource, JDBCInstanceSourceBase

sts = boto3.client('sts')


def list_jdbc_databases(source: JdbcSource) -> list[str]:
    url_arr = source.connection_url.split(":")
    if len(url_arr) != 4:
        raise BizException(MessageEnum.SOURCE_JDBC_URL_FORMAT_ERROR.get_code(), MessageEnum.SOURCE_JDBC_URL_FORMAT_ERROR.get_msg())
    if url_arr[1] != "mysql":
        raise BizException(MessageEnum.SOURCE_JDBC_LIST_DATABASES_NOT_SUPPORTED.get_code(), MessageEnum.SOURCE_JDBC_LIST_DATABASES_NOT_SUPPORTED.get_msg())
    host = url_arr[2][2:]
    port = int(url_arr[3].split("/")[0])
    user = source.username
    password = source.password
    if source.secret_id:
        secrets_client = boto3.client('secretsmanager')
        secret_response = secrets_client.get_secret_value(SecretId=source.secret_id)
        secrets = json.loads(secret_response['SecretString'])
        user = secrets['username']
        password = secrets['password']
    mysql_database = jdbc_database.MySQLDatabase(host, port, user, password)
    databases = mysql_database.list_databases()
    logger.info(databases)
    return databases


def get_schema_by_snapshot(provider_id: int, account_id: str, region: str, instance: str):
    res = crud.get_schema_by_snapshot(provider_id, account_id, region, instance)
    return res[0].split('\n') if res else None, res[1] if res else None


def get_schema_by_real_time(provider_id: int, account_id: str, region: str, instance: str, db_info: bool = False):
    db, subnet_id = None, None
    assume_account, assume_region = __get_admin_info(JDBCInstanceSourceBase(account_provider_id=provider_id, account_id=account_id, instance_id=instance, region=region))
    connection_rds = crud.get_connection_by_instance(provider_id, account_id, region, instance)
    glue = __get_glue_client(assume_account, assume_region)
    connection = glue.get_connection(Name=connection_rds[0]).get('Connection', {})
    subnet_id = connection.get('PhysicalConnectionRequirements', {}).get('SubnetId')
    if db_info:
        connection_properties = connection.get("ConnectionProperties", {})
        jdbc_source = JdbcSource(username=connection_properties.get("USERNAME"),
                                 password=connection_properties.get("PASSWORD"),
                                 secret_id=connection_properties.get("SECRET_ID"),
                                 connection_url=connection_properties.get("JDBC_CONNECTION_URL")
                                 )
        try:
            db = list_jdbc_databases(jdbc_source)
        except Exception as e:
            logger.info(e)
    return db, subnet_id


def sync_schema_by_job(provider_id: int, account_id: str, region: str, instance: str, schemas: list):
    jdbc_targets = []
    # Query Info
    info = crud.get_crawler_glue_db_by_instance(provider_id, account_id, region, instance)
    logger.info(f"info:{info}")
    if not info:
        return
    for db_name in schemas:
        trimmed_db_name = db_name.strip()
        if trimmed_db_name:
            jdbc_targets.append({
                'ConnectionName': info[2],
                'Path': f"{trimmed_db_name}/%"
            })
    # Update Crawler
    assume_account, assume_region = __get_admin_info(JDBCInstanceSourceBase(account_provider_id=provider_id, account_id=account_id, instance_id=instance, region=region))
    crawler_role_arn = __gen_role_arn(account_id=assume_account,
                                      region=assume_region,
                                      role_name='GlueDetectionJobRole')
    try:
        logger.info(f"assume_account:{assume_account}")
        logger.info(f"assume_region:{assume_region}")
        __get_glue_client(assume_account, assume_region).update_crawler(
            Name=info[0],
            Role=crawler_role_arn,
            DatabaseName=info[1],
            Targets={
                'JdbcTargets': jdbc_targets,
            },
            SchemaChangePolicy={
                'UpdateBehavior': 'UPDATE_IN_DATABASE',
                'DeleteBehavior': 'DELETE_FROM_DATABASE'
            }
        )
    except Exception as e:
        logger.error(traceback.format_exc())
        raise BizException(MessageEnum.BIZ_UNKNOWN_ERR.get_code(),
                           MessageEnum.BIZ_UNKNOWN_ERR.get_msg())
    # Update RDS
    crud.update_schema_by_account(provider_id, account_id, instance, region, "\n".join(schemas))


def __get_admin_info(jdbc):
    account_id = jdbc.account_id if jdbc.account_provider_id == Provider.AWS_CLOUD.value else admin_account_id
    region = jdbc.region if jdbc.account_provider_id == Provider.AWS_CLOUD.value else admin_region
    return account_id, region


def __get_glue_client(account, region):
    iam_role_name = crud.get_iam_role(account)
    logger.info(f"iam_role_name:{iam_role_name}")
    assumed_role = sts.assume_role(
        RoleArn=f"{iam_role_name}",
        RoleSessionName="glue-connection"
    )
    credentials = assumed_role['Credentials']
    glue = boto3.client('glue',
                        aws_access_key_id=credentials['AccessKeyId'],
                        aws_secret_access_key=credentials['SecretAccessKey'],
                        aws_session_token=credentials['SessionToken'],
                        region_name=region
                        )
    return glue


def __gen_role_arn(account_id: str, region: str, role_name: str):
    return f'arn:{partition}:iam::{account_id}:role/{const.SOLUTION_NAME}{role_name}-{region}'
