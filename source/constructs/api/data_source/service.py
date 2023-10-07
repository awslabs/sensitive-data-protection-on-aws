import json
import logging
import os
import traceback
from time import sleep
from botocore.exceptions import ClientError
import boto3
import copy

from catalog.service import delete_catalog_by_account_region as delete_catalog_by_account
from catalog.service import delete_catalog_by_database_region as delete_catalog_by_database_region
from common.constant import const
from common.enum import (MessageEnum,
                         ConnectionState,
                         Provider,
                         DataSourceType,
                         DatabaseType,
                         JDBCCreateType)
from common.exception_handler import BizException
from common.query_condition import QueryCondition
from discovery_job.service import delete_account as delete_job_by_account
from discovery_job.service import can_delete_database as can_delete_job_database
from discovery_job.service import delete_database as delete_job_database
from common.abilities import convert_provider_id_2_database_type
from . import s3_detector, rds_detector, glue_database_detector, crud
from .schemas import (AccountInfo, AdminAccountInfo,
                      JDBCInstanceSource, JDBCInstanceSourceUpdate,
                      ProviderResourceFullInfo, SourceNewAccount,
                      SourceResourceBase,
                      SourceCoverage,
                      SourceGlueDatabaseBase,
                      SourceGlueDatabase,
                      DataLocationInfo,
                      JDBCInstanceSourceBase,
                      JDBCInstanceSourceFullInfo)

SLEEP_TIME = 5
SLEEP_MIN_TIME = 2
GRANT_PERMISSIONS_RETRIES = 10

# for delegated account(IT), admin account could use this role to list stackset in IT account.
# CloudFormation Role name is: ListOrganizationRole
_delegated_role_name = os.getenv("DelegatedRoleName", 'ListOrganizationRole')

# agent account roles for all operations by admin account
# CloudFormation Role names are: RoleForAdmin, APIRole, GlueDetectionJobRole
_agent_role_name = os.getenv('AgentRoleNameList', 'RoleForAdmin')

logger = logging.getLogger("api")
sts = boto3.client('sts')
""" :type : pyboto3.sts """

caller_identity = boto3.client('sts').get_caller_identity()
partition = caller_identity['Arn'].split(':')[1]
_admin_account_id = caller_identity.get('Account')
_admin_account_region = boto3.session.Session().region_name


def build_s3_targets(bucket, credentials, region, is_init):
    s3 = boto3.client('s3',
                      aws_access_key_id=credentials['AccessKeyId'],
                      aws_secret_access_key=credentials['SecretAccessKey'],
                      aws_session_token=credentials['SessionToken'],
                      region_name=region)
    """ :type : pyboto3.s3 """
    response = s3.list_objects(Bucket=bucket, Delimiter='/')
    if 'Contents' not in response and 'CommonPrefixes' not in response:
        logger.info(response)
        raise BizException(MessageEnum.SOURCE_S3_EMPTY_BUCKET.get_code(),
                           MessageEnum.SOURCE_S3_EMPTY_BUCKET.get_msg())
    logger.info(response)
    s3_targets = []
    if 'CommonPrefixes' in response:
        for common_prefix in response['CommonPrefixes']:
            s3_targets.append(
                {
                    "Path": f"s3://{bucket}/{common_prefix['Prefix']}",
                    "SampleSize": 20,
                    "Exclusions": []
                }
            )
    if 'Contents' in response:
        if is_init:
            s3_targets.append(
                {
                    "Path": f"s3://{bucket}",
                    "SampleSize": 20,
                    "Exclusions": []
                }
            )
        else:
            for content in response['Contents']:
                s3_targets.append(
                    {
                        "Path": f"s3://{bucket}/{content['Key']}",
                        "SampleSize": 20,
                        "Exclusions": []
                    }
                )
    logger.info("build_s3_targets")
    logger.info(s3_targets)
    return s3_targets


def sync_s3_connection(account: str, region: str, bucket: str):
    glue_connection_name = f"{const.SOLUTION_NAME}-{DatabaseType.S3.value}-{bucket}"
    glue_database_name = f"{const.SOLUTION_NAME}-{DatabaseType.S3.value}-{bucket}"
    crawler_name = f"{const.SOLUTION_NAME}-{DatabaseType.S3.value}-{bucket}"
    if region != _admin_account_region:
        raise BizException(MessageEnum.SOURCE_DO_NOT_SUPPORT_CROSS_REGION.get_code(),
                           MessageEnum.SOURCE_DO_NOT_SUPPORT_CROSS_REGION.get_msg())

    state = crud.get_s3_bucket_source_glue_state(account, region, bucket)
    logger.info("sync_s3_connection state is:")
    logger.info(state)
    if state == ConnectionState.PENDING.value:
        raise BizException(MessageEnum.SOURCE_CONNECTION_NOT_FINISHED.get_code(),
                           MessageEnum.SOURCE_CONNECTION_NOT_FINISHED.get_msg())
    elif state == ConnectionState.CRAWLING.value:
        raise BizException(MessageEnum.SOURCE_CONNECTION_CRAWLING.get_code(),
                           MessageEnum.SOURCE_CONNECTION_CRAWLING.get_msg())
    # else:
    #     delete_glue_connection(account, region, crawler_name, glue_database_name, glue_connection_name)
    try:
        # PENDING｜ACTIVE｜ERROR with message
        crud.set_s3_bucket_source_glue_state(account, region, bucket, ConnectionState.PENDING.value)
        iam_role_name = crud.get_iam_role(account)
        assumed_role = sts.assume_role(
            RoleArn=f"{iam_role_name}",
            RoleSessionName="glue-s3-connection"
        )
        credentials = assumed_role['Credentials']
        s3_targets = build_s3_targets(bucket, credentials, region, True)
        logger.info("sync_s3_connection rebuild s3 targets:")
        logger.info(s3_targets)
        glue = boto3.client('glue',
                            aws_access_key_id=credentials['AccessKeyId'],
                            aws_secret_access_key=credentials['SecretAccessKey'],
                            aws_session_token=credentials['SessionToken'],
                            region_name=region
                            )
        """ :type : pyboto3.glue """

        try:
            glue.get_database(Name=glue_database_name)
        except Exception as e:
            logger.info("sync_s3_connection glue get_database error, and create database")
            logger.info(e)
            response = glue.create_database(DatabaseInput={'Name': glue_database_name})
            logger.info(response)
        # wait for database creation, several seconds
        lakeformation = boto3.client('lakeformation',
                                     aws_access_key_id=credentials['AccessKeyId'],
                                     aws_secret_access_key=credentials['SecretAccessKey'],
                                     aws_session_token=credentials['SessionToken'],
                                     region_name=region)
        """ :type : pyboto3.lakeformation """
        crawler_role_arn = __gen_role_arn(account_id=account,
                                          region=region,
                                          role_name='GlueDetectionJobRole')

        # retry for grant permissions
        num_retries = GRANT_PERMISSIONS_RETRIES
        while num_retries > 0:
            try:
                response = lakeformation.grant_permissions(
                    Principal={
                        'DataLakePrincipalIdentifier': f"{crawler_role_arn}"
                    },
                    Resource={
                        'Database': {
                            'Name': glue_database_name
                        }
                    },
                    Permissions=['ALL'],
                    PermissionsWithGrantOption=['ALL']
                )
            except Exception as e:
                sleep(SLEEP_MIN_TIME)
                num_retries -= 1
            else:
                break
        else:
            raise BizException(MessageEnum.SOURCE_UNCONNECTED.get_code(), MessageEnum.SOURCE_UNCONNECTED.get_msg())
        try:
            gt_cr_response = glue.get_crawler(Name=crawler_name)
            logger.info(gt_cr_response)
            try:
                if state == ConnectionState.ACTIVE.value or state == ConnectionState.UNSUPPORTED.value \
                        or state == ConnectionState.ERROR.value or state == ConnectionState.STOPPING.value:
                    up_cr_response = glue.update_crawler(
                        Name=crawler_name,
                        Role=crawler_role_arn,
                        DatabaseName=glue_database_name,
                        Targets={
                            "S3Targets": build_s3_targets(bucket, credentials, region, False)
                        },
                        SchemaChangePolicy={
                            'UpdateBehavior': 'UPDATE_IN_DATABASE',
                            'DeleteBehavior': 'DELETE_FROM_DATABASE'
                        }
                    )
                    logger.info("update crawler:")
                    logger.info(up_cr_response)
            except Exception as e:
                logger.info("update_crawler s3 error")
                logger.info(str(e))
            response = glue.start_crawler(
                Name=crawler_name
            )
            logger.info(response)
        except Exception as e:
            response = glue.create_crawler(
                Name=crawler_name,
                Role=crawler_role_arn,
                DatabaseName=glue_database_name,
                Targets={
                    "S3Targets": s3_targets
                },
                Tags={
                    'AdminAccountId': _admin_account_id
                }
            )
            logger.info(response)
            response = glue.start_crawler(
                Name=crawler_name
            )
            logger.info(response)

        crud.create_s3_connection(account, region, bucket, glue_connection_name, glue_database_name, crawler_name)
    except Exception as err:
        crud.set_s3_bucket_source_glue_state(account, region, bucket, str(err))
        glue = boto3.client('glue',
                            aws_access_key_id=credentials['AccessKeyId'],
                            aws_secret_access_key=credentials['SecretAccessKey'],
                            aws_session_token=credentials['SessionToken'],
                            region_name=region
                            )
        """ :type : pyboto3.glue """

        try:
            glue.delete_crawler(crawler_name)
        except Exception as e:
            pass
        try:
            glue.delete_database(Name=glue_database_name)
        except Exception as e:
            pass
        try:
            glue.delete_connection(ConnectionName=glue_connection_name)
        except Exception as e:
            pass

        logger.error(traceback.format_exc())
        raise BizException(MessageEnum.SOURCE_CONNECTION_FAILED.get_code(),
                           str(err))


def sync_s3_connection_by_region(account: str, region: str):
    buckets = crud.list_s3_bucket_source_by_account(
        account_id=account,
        region=region,
        state=None
    )
    for bucket in buckets:
        try:
            sync_s3_connection(
                account=account,
                region=region,
                bucket=bucket
            )
        except Exception as err:
            logger.error(traceback.format_exc())


def check_subnet_has_outbound_route(credentials, region_name: str, subnet_id: str):
    ec2_client = boto3.client('ec2',
                              aws_access_key_id=credentials['AccessKeyId'],
                              aws_secret_access_key=credentials['SecretAccessKey'],
                              aws_session_token=credentials['SessionToken'],
                              region_name=region_name)
    response = ec2_client.describe_route_tables(
        Filters=[
            {
                'Name': 'association.subnet-id',
                'Values': [subnet_id]
            }
        ]
    )

    for route_table in response['RouteTables']:
        for route in route_table['Routes']:
            if route.get('DestinationCidrBlock') == '0.0.0.0/0':
                logger.info("Has 0.0.0.0/0 route.")
                return True
    return False


def check_link(credentials, region_name: str, vpc_id: str, rds_secret_id: str):
    ec2_client = boto3.client('ec2',
                              aws_access_key_id=credentials['AccessKeyId'],
                              aws_secret_access_key=credentials['SecretAccessKey'],
                              aws_session_token=credentials['SessionToken'],
                              region_name=region_name)
    endpoints = ec2_client.describe_vpc_endpoints(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['VpcEndpoints']
    s3_endpoint_exists = False
    glue_endpoint_exists = False
    secret_endpoint_exists = False
    for endpoint in endpoints:
        if endpoint['ServiceName'] == f'com.amazonaws.{region_name}.s3':
            s3_endpoint_exists = True
        elif endpoint['ServiceName'] == f'com.amazonaws.{region_name}.glue':
            glue_endpoint_exists = True
        elif endpoint['ServiceName'] == f'com.amazonaws.{region_name}.secretsmanager':
            secret_endpoint_exists = True

    if not s3_endpoint_exists:
        raise BizException(MessageEnum.SOURCE_RDS_NO_VPC_S3_ENDPOINT.get_code(),
                           MessageEnum.SOURCE_RDS_NO_VPC_S3_ENDPOINT.get_msg())
    if not glue_endpoint_exists:
        raise BizException(MessageEnum.SOURCE_RDS_NO_VPC_GLUE_ENDPOINT.get_code(),
                           MessageEnum.SOURCE_RDS_NO_VPC_GLUE_ENDPOINT.get_msg())
    if rds_secret_id is not None and not secret_endpoint_exists:
        raise BizException(MessageEnum.SOURCE_RDS_NO_VPC_SECRET_MANAGER_ENDPOINT.get_code(),
                           MessageEnum.SOURCE_RDS_NO_VPC_SECRET_MANAGER_ENDPOINT.get_msg())
    logger.info("sync_rds_connection check_link :")
    logger.info(s3_endpoint_exists)
    logger.info(glue_endpoint_exists)
    logger.info(secret_endpoint_exists)

def sync_glue_database(account_id, region, glue_database_name):
    sqs = boto3.client(
        'sqs',
        region_name=region
    )
    message = {
        "detail": {
            "databaseName": glue_database_name,
            "databaseType": "glue",
            "accountId": account_id,
            "state": "Succeeded"
        },
        "region": region
    }
    sqs.send_message(
        QueueUrl=sqs.get_queue_url(QueueName=f"{const.SOLUTION_NAME}-Crawler"),
        MessageBody=json.dumps(message)
    )

def sync_jdbc_connection(jdbc: JDBCInstanceSourceBase):
    accont_id = jdbc.account_id if jdbc.account_provider_id == Provider.AWS_CLOUD.value else _admin_account_id
    region = jdbc.region if jdbc.account_provider_id == Provider.AWS_CLOUD.value else _admin_account_region
    ec2_client, credentials = __ec2(account=accont_id, region=region)
    glue_client = __glue(account=accont_id, region=region)
    lakeformation_client = __lakeformation(account=accont_id, region=region)
    crawler_role_arn = __gen_role_arn(account_id=accont_id,
                                      region=region,
                                      role_name='GlueDetectionJobRole')
    # get connection name from sdp db
    source: JDBCInstanceSourceFullInfo = crud.get_jdbc_instance_source_glue(provider_id=jdbc.account_provider_id,
                                                                            account=jdbc.account_id,
                                                                            region=jdbc.region,
                                                                            instance_id=jdbc.instance_id)
    if not source or not source.glue_connection:
        raise BizException(MessageEnum.SOURCE_JDBC_CONNECTION_NOT_EXIST.get_code(),
                           MessageEnum.SOURCE_JDBC_CONNECTION_NOT_EXIST.get_msg())
    # query connection info from glue
    conn_response = glue_client.get_connection(Name=source.glue_connection)['Connection']
    # return glue_client.get_connection(Name=source.glue_connection)

    logger.info(f"conn_response type is:{type(conn_response)}")
    logger.info(f"conn_response is:{conn_response}")
    condition_check(ec2_client, credentials, source.glue_state, conn_response['PhysicalConnectionRequirements'])
    sync(glue_client, lakeformation_client, credentials, crawler_role_arn, jdbc, conn_response['ConnectionProperties']['JDBC_CONNECTION_URL'])


def condition_check(ec2_client, credentials, state, connection: dict):
    
    # if not jdbc.master_username:
    #     raise BizException(MessageEnum.SOURCE_JDBC_NO_CREDENTIAL.get_code(),
    #                        MessageEnum.SOURCE_JDBC_NO_CREDENTIAL.get_msg())

    # if not jdbc.password and not jdbc.secret:
    #     raise BizException(MessageEnum.SOURCE_JDBC_NO_AUTH.get_code(),
    #                        MessageEnum.SOURCE_JDBC_NO_AUTH.get_msg())

    # if jdbc.password and jdbc.secret:
    #     raise BizException(MessageEnum.SOURCE_JDBC_DUPLICATE_AUTH.get_code(),
    #                        MessageEnum.SOURCE_JDBC_DUPLICATE_AUTH.get_msg())
    # res = crud.get_jdbc_instance_source_glue(jdbc.account_provider, jdbc.account_id, jdbc.region, jdbc.instance)
    if state == ConnectionState.PENDING.value:
        raise BizException(MessageEnum.SOURCE_CONNECTION_NOT_FINISHED.get_code(),
                           MessageEnum.SOURCE_CONNECTION_NOT_FINISHED.get_msg())

    elif state == ConnectionState.CRAWLING.value:
        raise BizException(MessageEnum.SOURCE_CONNECTION_CRAWLING.get_code(),
                           MessageEnum.SOURCE_CONNECTION_CRAWLING.get_msg())
    # credentials = None

    # try:
    #     iam_role_name = crud.get_iam_role(_admin_account_id)

    #     assumed_role = sts.assume_role(
    #         RoleArn=f"{iam_role_name}",
    #         RoleSessionName="glue-jdbc-connection"
    #     )
    #     credentials = assumed_role['Credentials']
    # except Exception as err:
    #     raise BizException(MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_code(),
    #                        MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_msg())
    if credentials is None:
        raise BizException(MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_code(),
                           MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_msg())
    
    security_groups = ec2_client.describe_security_groups(GroupNames=[const.SECURITY_GROUP_JDBC])["SecurityGroups"]
    if not security_groups:
        raise BizException(MessageEnum.SOURCE_SECURITY_GROUP_NOT_EXISTS.get_code(),
                           MessageEnum.SOURCE_SECURITY_GROUP_NOT_EXISTS.get_msg())
    security_group = list(filter(lambda sg: sg["GroupName"] == const.SECURITY_GROUP_JDBC, security_groups))[0]
    inbound_route = security_group["IpPermissions"][0]
    if inbound_route["IpProtocol"] != "tcp" or inbound_route["FromPort"] != 0 or inbound_route["ToPort"] != 65535 \
       or not inbound_route["IpRanges"] or inbound_route["IpRanges"][0]["CidrIp"] != "0.0.0.0/0":
        raise BizException(MessageEnum.SOURCE_SG_INBOUND_ROUTE_NOT_VALID.get_code(),
                           MessageEnum.SOURCE_SG_INBOUND_ROUTE_NOT_VALID.get_msg())
    outbound_route = security_group["IpPermissionsEgress"][0]
    if outbound_route["IpProtocol"] != "-1" or not outbound_route["IpRanges"] or outbound_route["IpRanges"][0]["CidrIp"] != "0.0.0.0/0":
        raise BizException(MessageEnum.SOURCE_SG_OUTBOUND_ROUTE_NOT_VALID.get_code(),
                           MessageEnum.SOURCE_SG_OUTBOUND_ROUTE_NOT_VALID.get_msg())
    subnet = ec2_client.describe_subnets(SubnetIds=[connection["SubnetId"]])["Subnets"]
    if not subnet:
        raise BizException(MessageEnum.SOURCE_SUBNET_JDBC_NOT_EXISTS.get_code(),
                           MessageEnum.SOURCE_SUBNET_JDBC_NOT_EXISTS.get_msg())
    if subnet[0]["MapPublicIpOnLaunch"]:
        raise BizException(MessageEnum.SOURCE_SUBNET_NOT_PRIVATE.get_code(),
                           MessageEnum.SOURCE_SUBNET_NOT_PRIVATE.get_msg())
    # if not ec2_client.describe_nat_gateways(Filters=[{'Name': 'subnet-id', 'Values': [jdbc.network_subnet_id]}])['NatGateways']:
    #     raise BizException(MessageEnum.SOURCE_SUBNET_NOT_CONTAIN_NAT.get_code(),
    #                        MessageEnum.SOURCE_SUBNET_NOT_CONTAIN_NAT.get_msg())
    #  contain gateway && subnet‘s route connected to ngw
    ngw_list = [item for item in ec2_client.describe_nat_gateways()['NatGateways'] if item['VpcId'] == subnet[0]['VpcId']]
    if not ngw_list:
        raise BizException(MessageEnum.SOURCE_VPC_NOT_CONTAIN_NAT.get_code(),
                           MessageEnum.SOURCE_VPC_NOT_CONTAIN_NAT.get_msg())
    if not ec2_client.describe_availability_zones(Filters=[{'Name': 'zone-name', 'Values': [connection["AvailabilityZone"]]}])["AvailabilityZones"]:
        raise BizException(MessageEnum.SOURCE_AVAILABILITY_ZONE_NOT_EXISTS.get_code(),
                           MessageEnum.SOURCE_AVAILABILITY_ZONE_NOT_EXISTS.get_msg())

def sync(glue, lakeformation, credentials, crawler_role_arn, jdbc: JDBCInstanceSourceBase, url: str):
    logger.info(f"START SYNC ...{url}")

    jdbc_targets = []
    database_type = convert_provider_id_2_database_type(jdbc.account_provider_id)
    # glue_connection_name = f"{const.SOLUTION_NAME}-{database_type}-{jdbc.instance}"
    glue_database_name = f"{const.SOLUTION_NAME}-{database_type}-{jdbc.instance_id}"
    crawler_name = f"{const.SOLUTION_NAME}-{database_type}-{jdbc.instance_id}"
    state, glue_connection_name = crud.get_jdbc_connection_glue_info(jdbc.account_provider_id, jdbc.account_id, jdbc.region, jdbc.instance_id)
    # crawler_role_arn = __gen_role_arn(account_id=_admin_account_id, region=_admin_account_region,
    #                                   role_name='GlueDetectionJobRole')
    
    # credentials = gen_credentials(_admin_account_id)
    # grant_lake_formation_permission(credentials, crawler_name, glue_database_name)
    # glue = boto3.client('glue',
    #                     aws_access_key_id=credentials['AccessKeyId'],
    #                     aws_secret_access_key=credentials['SecretAccessKey'],
    #                     aws_session_token=credentials['SessionToken'],
    #                     region_name=_admin_account_region
    #                     )
    
    try:
        schema = get_schema_from_url(url)
        jdbc_targets.append({'ConnectionName': glue_connection_name,
                             'Path': f"{schema}/%"})
        if schema:
            """ :type : pyboto3.glue """
            try:
                conn = glue.get_connection(Name=glue_connection_name)
                logger.info(f"connection exists! is{conn}")
            except Exception as e:
                logger.info("sync_jdbc_connection get_connection error and create:")
                logger.info(str(e))
                raise BizException()
                # if jdbc.secret is None:
                #     response = glue.create_connection(
                #         ConnectionInput={
                #             'Name': glue_connection_name,
                #             'Description': glue_connection_name,
                #             'ConnectionType': 'JDBC',
                #             'ConnectionProperties': {
                #                 'USERNAME': jdbc.master_username,
                #                 'PASSWORD': jdbc.password,
                #                 'JDBC_CONNECTION_URL': jdbc.jdbc_connection_url,
                #                 'JDBC_ENFORCE_SSL': 'false',
                #             },

                #             'PhysicalConnectionRequirements': {
                #                 'SubnetId': jdbc.network_subnet_id,
                #                 'AvailabilityZone': jdbc.network_availability_zone,
                #                 'SecurityGroupIdList': [jdbc.network_sg_id]
                #             }
                #         }
                #     )
                #     logger.info(response)
                # else:
                #     response = glue.create_connection(
                #         ConnectionInput={
                #             'Name': glue_connection_name,
                #             'Description': glue_connection_name,
                #             'ConnectionType': 'JDBC',
                #             'ConnectionProperties': {
                #                 'SECRET_ID': jdbc.secret,
                #                 'JDBC_CONNECTION_URL': jdbc.jdbc_connection_url,
                #                 'JDBC_ENFORCE_SSL': 'false',
                #             },

                #             'PhysicalConnectionRequirements': {
                #                 'SubnetId': jdbc.network_subnet_id,
                #                 'AvailabilityZone': jdbc.network_availability_zone,
                #                 'SecurityGroupIdList': [jdbc.network_sg_id]
                #             }
                #         }
                #     )
            try:
                # logger.info("get database start")
                glue.get_database(Name=glue_database_name)
                # logger.info("get database end")
            except Exception as e:
                logger.info("sync_jdbc_connection get_database error and create:")
                logger.info(str(e))
                response = glue.create_database(DatabaseInput={'Name': glue_database_name})
                logger.info("creat response is:")
                logger.info(response)
            # grant_lake_formation_permission(credentials, crawler_name, glue_database_name)
            # lakeformation = boto3.client('lakeformation',
            #                              aws_access_key_id=credentials['AccessKeyId'],
            #                              aws_secret_access_key=credentials['SecretAccessKey'],
            #                              aws_session_token=credentials['SessionToken'],
            #                              region_name=_admin_account_region)
            """ :type : pyboto3.lakeformation """
            # retry for grant permissions
            num_retries = GRANT_PERMISSIONS_RETRIES
            while num_retries > 0:
                try:
                    response = lakeformation.grant_permissions(
                        Principal={
                            'DataLakePrincipalIdentifier': f"{crawler_role_arn}"
                        },
                        Resource={
                            'Database': {
                                'Name': glue_database_name
                            }
                        },
                        Permissions=['ALL'],
                        PermissionsWithGrantOption=['ALL']
                    )
                except Exception as e:
                    logger.error(traceback.format_exc())
                    sleep(SLEEP_MIN_TIME)
                    num_retries -= 1
                else:
                    break
            else:
                raise BizException(MessageEnum.SOURCE_UNCONNECTED.get_code(), MessageEnum.SOURCE_UNCONNECTED.get_msg())
            # lakeformation = boto3.client('lakeformation',
            #                              aws_access_key_id=credentials['AccessKeyId'],
            #                              aws_secret_access_key=credentials['SecretAccessKey'],
            #                              aws_session_token=credentials['SessionToken'],
            #                              region_name=_admin_account_region)
            # """ :type : pyboto3.lakeformation """
            # # retry for grant permissions
            # num_retries = GRANT_PERMISSIONS_RETRIES
            # while num_retries > 0:
            #     try:
            #         response = lakeformation.grant_permissions(
            #             Principal={
            #                 'DataLakePrincipalIdentifier': f"{crawler_role_arn}"
            #             },
            #             Resource={
            #                 'Database': {
            #                     'Name': glue_database_name
            #                 }
            #             },
            #             Permissions=['ALL'],
            #             PermissionsWithGrantOption=['ALL']
            #         )
            #     except Exception as e:
            #         sleep(SLEEP_MIN_TIME)
            #         num_retries -= 1
            #     else:
            #         break
            # else:
            #     raise BizException(MessageEnum.SOURCE_UNCONNECTED.get_code(), MessageEnum.SOURCE_UNCONNECTED.get_msg())
           
            # for schema in schema_list:
            # jdbc_targets.append(
            #     {
            #         'ConnectionName': glue_connection_name,
            #         'Path': f"{schema}/%",
            #     }
            # )
            logger.info("sync_jdbc_connection jdbc_targets:")
            logger.info(jdbc_targets)
        try:
            response = glue.get_crawler(Name=crawler_name)
            logger.info("sync_jdbc_connection get_crawler:")
            logger.info(response)
            try:
                if state == ConnectionState.ACTIVE.value or state == ConnectionState.UNSUPPORTED.value \
                        or state == ConnectionState.ERROR.value or state == ConnectionState.STOPPING.value:
                    up_cr_response = glue.update_crawler(
                        Name=crawler_name,
                        Role=crawler_role_arn,
                        DatabaseName=glue_database_name,
                        Targets={
                            'JdbcTargets': jdbc_targets,
                        },
                        SchemaChangePolicy={
                            'UpdateBehavior': 'UPDATE_IN_DATABASE',
                            'DeleteBehavior': 'DELETE_FROM_DATABASE'
                        }
                    )
                    logger.info("update jdbc crawler:")
                    logger.info(up_cr_response)
            except Exception as e:
                logger.info("update_crawler error")
                logger.info(str(e))
            st_cr_response = glue.start_crawler(
                Name=crawler_name
            )
            logger.info(st_cr_response)
        except Exception as e:
            logger.info("sync_jdbc_connection get_crawler and create:")
            logger.info(str(e))
            logger.info(f"targets is:{jdbc_targets}")
            response = glue.create_crawler(
                Name=crawler_name,
                Role=crawler_role_arn,
                DatabaseName=glue_database_name,
                Targets={
                    'JdbcTargets': jdbc_targets,
                },
                Tags={
                    'AdminAccountId': _admin_account_id
                }
            )
            logger.info(response)
            start_response = glue.start_crawler(
                Name=crawler_name
            )
            logger.info(start_response)
            crud.update_jdbc_connection(jdbc.account_provider_id,
                                        jdbc.account_id,
                                        jdbc.region,
                                        jdbc.instance_id,
                                        glue_database_name,
                                        crawler_name)
            crud.set_jdbc_connection_glue_state(jdbc.account_provider_id, jdbc.account_id, jdbc.region, jdbc.instance_id, ConnectionState.CRAWLING.value)
        else:
            crud.set_jdbc_connection_glue_state(jdbc.account_provider_id, jdbc.account_id, jdbc.region, jdbc.instance_id,
                                                MessageEnum.SOURCE_JDBC_NO_SCHEMA.get_msg())
            raise BizException(MessageEnum.SOURCE_JDBC_NO_SCHEMA.get_code(), MessageEnum.SOURCE_JDBC_NO_SCHEMA.get_msg())
    except Exception as err:
        crud.set_jdbc_connection_glue_state(jdbc.account_provider_id, jdbc.account_id, jdbc.region, jdbc.instance_id, str(err))
        glue = boto3.client('glue',
                            aws_access_key_id=credentials['AccessKeyId'],
                            aws_secret_access_key=credentials['SecretAccessKey'],
                            aws_session_token=credentials['SessionToken'],
                            region_name=jdbc.region
                            )
        """ :type : pyboto3.glue """
        try:
            glue.delete_crawler(crawler_name)
        except Exception:
            pass
        try:
            glue.delete_database(Name=glue_database_name)
        except Exception:
            pass
        try:
            glue.delete_connection(ConnectionName=glue_connection_name)
        except Exception:
            pass

        logger.error(traceback.format_exc())
        raise BizException(MessageEnum.SOURCE_CONNECTION_FAILED.get_code(),
                           str(err))

def before_delete_glue_database(provider, account, region, name):
    glue_database = crud.get_glue_database_source(provider, account, region, name)
    if glue_database is None:
        raise BizException(MessageEnum.SOURCE_GLUE_DATABASE_NO_INSTANCE.get_code(),
                           MessageEnum.SOURCE_GLUE_DATABASE_NO_INSTANCE.get_msg())

    if not can_delete_job_database(account_id=account, region=region, database_type=DatabaseType.GLUE.value,
                                   database_name=name):
        raise BizException(MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_code(),
                           MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_msg())


# Delete third-party connection
def before_delete_jdbc_connection(provider_id, account, region, instance_id, database_type):
    jdbc_instance: JDBCInstanceSource = crud.get_jdbc_instance_source(provider_id, account, region, instance_id)
    if jdbc_instance is None:
        raise BizException(MessageEnum.SOURCE_JDBC_CONNECTION_NOT_EXIST.get_code(),
                           MessageEnum.SOURCE_JDBC_CONNECTION_NOT_EXIST.get_msg())
    # if rds_instance.glue_crawler is None:
    #     raise BizException(MessageEnum.SOURCE_RDS_NO_CRAWLER.get_code(),
    #                        MessageEnum.SOURCE_RDS_NO_CRAWLER.get_msg())
    # if rds_instance.glue_database is None:
    #     raise BizException(MessageEnum.SOURCE_RDS_NO_DATABASE.get_code(),
    #                        MessageEnum.SOURCE_RDS_NO_DATABASE.get_msg())
    # crawler, if crawling try to stop and raise, if pending raise directly
    # res = crud.get_jdbc_instance_source_glue(provider_id, account, region, instance_id)
    if jdbc_instance.glue_state == ConnectionState.PENDING.value:
        raise BizException(MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_code(),
                           MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_msg())
    elif jdbc_instance.glue_state == ConnectionState.CRAWLING.value:
        try:
            assume_account, assume_region = gen_assume_account(provider_id, account, region)
            # Stop the crawler
            __glue(account=assume_account, region=assume_region).stop_crawler(Name=jdbc_instance.glue_crawler)
        except Exception as e:
            logger.error(traceback.format_exc())
        raise BizException(MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_code(),
                           MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_msg())
    elif jdbc_instance.glue_state == ConnectionState.ACTIVE.value:
        # if job running, do not stop but raising
        if not can_delete_job_database(account_id=account, region=region, database_type=database_type,
                                       database_name=jdbc_instance.instance_id):
            raise BizException(MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_code(),
                               MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_msg())
    else:
        logger.info(f"delete jdbc connection: {account},{region},{database_type},{jdbc_instance.instance_id}")

def gen_assume_account(provider_id, account, region):
    account = account if provider_id == Provider.AWS_CLOUD.value else _admin_account_id
    region = region if provider_id == Provider.AWS_CLOUD.value else _admin_account_region
    return account, region

def delete_glue_database(provider_id: int, account: str, region: str, name: str):
    before_delete_glue_database(provider_id, account, region, name)
    err = []
    # 1/3 delete job database
    try:
        delete_job_database(account_id=account, region=region, database_type=DatabaseType.GLUE.value, database_name=name)
    except Exception as e:
        err.append(str(e))
    # 2/3 delete catalog
    try:
        delete_catalog_by_database_region(database=name, region=region, type=DatabaseType.GLUE.value)
    except Exception as e:
        err.append(str(e))
    # 3/3 delete source
    s3_bucket = crud.get_glue_database_source(provider_id, account, region, name)
    glue = __glue(account=account, region=region)
    try:
        glue.delete_crawler(Name=s3_bucket.glue_crawler)
    except Exception as e:
        err.append(str(e))
    try:
        glue.delete_database(Name=s3_bucket.glue_database)
    except Exception as e:
        err.append(str(e))

    crud.delete_glue_database(provider_id, account, region, name)
    try:
        crud.update_glue_database_count(account, region)
    except Exception as e:
        err.append(str(e))

    if err:
        logger.error(traceback.format_exc())
        # raise BizException(MessageEnum.SOURCE_S3_CONNECTION_DELETE_ERROR.get_code(), err)

    return True

def delete_jdbc_connection(provider_id: int, account: str, region: str, instance_id: str):
    database_type = convert_provider_id_2_database_type(provider_id)
    before_delete_jdbc_connection(provider_id, account, region, instance_id, database_type)
    assume_account, assume_region = gen_assume_account(provider_id, account, region)
    err = []
    # 1/3 delete job database

    try:
        logger.info('delete_job_database start')
        delete_job_database(account_id=account, region=region, database_type=database_type, database_name=instance_id)
        logger.info('delete_job_database end')
    except Exception as e:
        logger.error(traceback.format_exc())
        err.append(str(e))
    # 2/3 delete catalog
    try:
        logger.info('delete_catalog_by_database_region start')
        delete_catalog_by_database_region(database=instance_id, region=region, type=database_type)
        logger.info('delete_catalog_by_database_region end')
    except Exception as e:
        logger.error(traceback.format_exc())
        err.append(str(e))
    # 3/3 delete source
    jdbc_conn = crud.get_jdbc_instance_source(provider_id, account, region, instance_id)
    glue = __glue(account=assume_account, region=assume_region)
    if jdbc_conn.glue_crawler:
        try:
            logger.info(f'delete_crawler start:{assume_account, jdbc_conn.glue_crawler}')
            glue.delete_crawler(Name=jdbc_conn.glue_crawler)
            logger.info(f'delete_crawler end:{jdbc_conn.glue_crawler}')
        except Exception as e:
            logger.error(traceback.format_exc())
            err.append(str(e))
    if jdbc_conn.glue_database:
        try:
            glue.delete_database(Name=jdbc_conn.glue_database)
        except Exception as e:
            logger.error(traceback.format_exc())
            err.append(str(e))
    crud.delete_jdbc_connection(provider_id, account, region, instance_id)
    try:
        crud.update_jdbc_instance_count(provider_id, account, region)
    except Exception as e:
        logger.error(traceback.format_exc())
        err.append(str(e))

    if not err:
        logger.error(err)
        # raise BizException(MessageEnum.SOURCE_S3_CONNECTION_DELETE_ERROR.get_code(), err)

    return True

def gen_credentials(account: str):
    try:
        iam_role_name = crud.get_iam_role(account)
        assumed_role = sts.assume_role(
            RoleArn=f"{iam_role_name}",
            RoleSessionName="glue-rds-connection"
        )
        credentials = assumed_role['Credentials']
    except Exception as err:
        logger.error(err)
        raise BizException(MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_code(),
                           MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_msg())
    if credentials is None:
        raise BizException(MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_code(),
                           MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_msg())
    return credentials

# Create crawler, connection and database and start crawler
def sync_rds_connection(account: str, region: str, instance_name: str, rds_user=None, rds_password=None,
                        rds_secret_id=None):
    glue_connection_name = f"{const.SOLUTION_NAME}-{DatabaseType.RDS.value}-{instance_name}"
    glue_database_name = f"{const.SOLUTION_NAME}-{DatabaseType.RDS.value}-{instance_name}"
    crawler_name = f"{const.SOLUTION_NAME}-{DatabaseType.RDS.value}-{instance_name}"
    if rds_user is None and rds_secret_id is None:
        raise BizException(MessageEnum.SOURCE_RDS_NO_AUTH.get_code(),
                           MessageEnum.SOURCE_RDS_NO_AUTH.get_msg())

    if rds_user is not None and rds_secret_id is not None:
        raise BizException(MessageEnum.SOURCE_RDS_DUPLICATE_AUTH.get_code(),
                           MessageEnum.SOURCE_RDS_DUPLICATE_AUTH.get_msg())

    if region != _admin_account_region:
        raise BizException(MessageEnum.SOURCE_DO_NOT_SUPPORT_CROSS_REGION.get_code(),
                           MessageEnum.SOURCE_DO_NOT_SUPPORT_CROSS_REGION.get_msg())

    state = crud.get_rds_instance_source_glue_state(account, region, instance_name)
    logger.info("sync_rds_connection state is:")
    logger.info(state)
    if state == ConnectionState.PENDING.value:
        raise BizException(MessageEnum.SOURCE_CONNECTION_NOT_FINISHED.get_code(),
                           MessageEnum.SOURCE_CONNECTION_NOT_FINISHED.get_msg())

    elif state == ConnectionState.CRAWLING.value:
        raise BizException(MessageEnum.SOURCE_CONNECTION_CRAWLING.get_code(),
                           MessageEnum.SOURCE_CONNECTION_CRAWLING.get_msg())

    crawler_role_arn = __gen_role_arn(account_id=account,
                                      region=region,
                                      role_name='GlueDetectionJobRole')
    credentials = gen_credentials(account)
    try:
        # PENDING｜ACTIVE｜ERROR with message
        crud.set_rds_instance_source_glue_state(account, region, instance_name, ConnectionState.PENDING.value)
        rds = boto3.client(
            'rds',
            aws_access_key_id=credentials['AccessKeyId'],
            aws_secret_access_key=credentials['SecretAccessKey'],
            aws_session_token=credentials['SessionToken'],
            region_name=region
        )
        """ :type : pyboto3.rds """

        rds_instance = rds.describe_db_instances(DBInstanceIdentifier=instance_name)['DBInstances'][0]
        logger.info("sync_rds_connection describe_db_instances ")
        logger.info(rds_instance)
        engine = rds_instance['Engine']
        host = rds_instance['Endpoint']['Address']
        port = rds_instance['Endpoint']['Port']
        rds_vpc_id = rds_instance['DBSubnetGroup']['VpcId']
        rds_az = rds_instance['AvailabilityZone']
        rds_security_groups = []
        for vpc_sg in rds_instance['VpcSecurityGroups']:
            if vpc_sg['Status'] == 'active':
                rds_security_groups.append(vpc_sg['VpcSecurityGroupId'])

        ec2_client = boto3.client('ec2',
                                  aws_access_key_id=credentials['AccessKeyId'],
                                  aws_secret_access_key=credentials['SecretAccessKey'],
                                  aws_session_token=credentials['SessionToken'],
                                  region_name=region)
        response = ec2_client.describe_subnets(
            Filters=[
                {
                    'Name': 'vpc-id',
                    'Values': [rds_vpc_id]
                },
                {
                    'Name': 'availability-zone',
                    'Values': [rds_az]
                }
            ]
        )
        logger.debug(response)
        # Private subnet priority
        rds_subnet_id = const.EMPTY_STR
        public_subnet_id = const.EMPTY_STR
        has_outbound_route = False
        for subnet_desc in response['Subnets']:
            subnet_map_public_ip = subnet_desc['MapPublicIpOnLaunch']
            if subnet_map_public_ip:
                logger.info(f"subnet({subnet_desc['SubnetId']}) is public")
                public_subnet_id = subnet_desc['SubnetId']
            else:
                logger.info(f"subnet({subnet_desc['SubnetId']}) is private")
                rds_subnet_id = subnet_desc['SubnetId']
                has_outbound_route = check_subnet_has_outbound_route(credentials, region, subnet_desc['SubnetId'])
                if has_outbound_route:
                    break

        if rds_subnet_id == const.EMPTY_STR:
            if public_subnet_id == const.EMPTY_STR:
                raise BizException(MessageEnum.SOURCE_RDS_NO_PRIVATE_ACCESSABLE.get_code(),
                                   MessageEnum.SOURCE_RDS_NO_PRIVATE_ACCESSABLE.get_msg())
            else:
                rds_subnet_id = public_subnet_id

        if not has_outbound_route:
            check_link(credentials, region, rds_vpc_id, rds_secret_id)
        if rds_secret_id is not None:
            secretsmanager = boto3.client('secretsmanager',
                                          aws_access_key_id=credentials['AccessKeyId'],
                                          aws_secret_access_key=credentials['SecretAccessKey'],
                                          aws_session_token=credentials['SessionToken'],
                                          region_name=region
                                          )
            """ :type : pyboto3.secretsmanager """
            secret_value = secretsmanager.get_secret_value(
                SecretId=rds_secret_id
            )
            secret_values = json.loads(secret_value['SecretString'])
            rds_user = secret_values['username']
            rds_password = secret_values['password']

        payload = {
            "engine": engine,
            "host": host,
            "port": port,
            "username": rds_user,
            "password": rds_password,
        }
        schema_list = __list_rds_schema(account, region, credentials, instance_name, payload, rds_security_groups,
                                        rds_subnet_id)
        logger.info("sync_rds_connection schema_list :")
        logger.info(schema_list)
        if len(schema_list) > 0:
            glue = boto3.client('glue',
                                aws_access_key_id=credentials['AccessKeyId'],
                                aws_secret_access_key=credentials['SecretAccessKey'],
                                aws_session_token=credentials['SessionToken'],
                                region_name=region
                                )
            """ :type : pyboto3.glue """

            jdbc_url = __create_jdbc_url(engine=engine, host=host, port=port)
            try:
                glue.get_connection(Name=glue_connection_name)
            except Exception as e:
                logger.info("sync_rds_connection get_connection error and create:")
                logger.info(str(e))
                if rds_secret_id is None:
                    response = glue.create_connection(
                        ConnectionInput={
                            'Name': glue_connection_name,
                            'Description': glue_connection_name,
                            'ConnectionType': 'JDBC',
                            'ConnectionProperties': {
                                'USERNAME': rds_user,
                                'PASSWORD': rds_password,
                                'JDBC_CONNECTION_URL': jdbc_url,
                                'JDBC_ENFORCE_SSL': 'false',
                            },

                            'PhysicalConnectionRequirements': {
                                'SubnetId': rds_subnet_id,
                                'AvailabilityZone': rds_az,
                                'SecurityGroupIdList': rds_security_groups
                            }
                        }
                    )
                    logger.info(response)
                else:
                    response = glue.create_connection(
                        ConnectionInput={
                            'Name': glue_connection_name,
                            'Description': glue_connection_name,
                            'ConnectionType': 'JDBC',
                            'ConnectionProperties': {
                                'SECRET_ID': rds_secret_id,
                                'JDBC_CONNECTION_URL': jdbc_url,
                                'JDBC_ENFORCE_SSL': 'false',
                            },

                            'PhysicalConnectionRequirements': {
                                'SubnetId': rds_subnet_id,
                                'AvailabilityZone': rds_az,
                                'SecurityGroupIdList': rds_security_groups
                            }
                        }
                    )
                    logger.info(response)
            try:
                glue.get_database(Name=glue_database_name)
            except Exception as e:
                logger.info("sync_rds_connection get_database error and create:")
                logger.info(str(e))
                response = glue.create_database(DatabaseInput={'Name': glue_database_name})
                logger.info(response)
            lakeformation = boto3.client('lakeformation',
                                         aws_access_key_id=credentials['AccessKeyId'],
                                         aws_secret_access_key=credentials['SecretAccessKey'],
                                         aws_session_token=credentials['SessionToken'],
                                         region_name=region)
            """ :type : pyboto3.lakeformation """
            # retry for grant permissions
            num_retries = GRANT_PERMISSIONS_RETRIES
            while num_retries > 0:
                try:
                    response = lakeformation.grant_permissions(
                        Principal={
                            'DataLakePrincipalIdentifier': f"{crawler_role_arn}"
                        },
                        Resource={
                            'Database': {
                                'Name': glue_database_name
                            }
                        },
                        Permissions=['ALL'],
                        PermissionsWithGrantOption=['ALL']
                    )
                except Exception as e:
                    sleep(SLEEP_MIN_TIME)
                    num_retries -= 1
                else:
                    break
            else:
                raise BizException(MessageEnum.SOURCE_UNCONNECTED.get_code(), MessageEnum.SOURCE_UNCONNECTED.get_msg())
            jdbc_targets = []
            for schema in schema_list:
                jdbc_targets.append(
                    {
                        'ConnectionName': glue_connection_name,
                        'Path': f"{schema}/%",
                    }
                )
            logger.info("sync_rds_connection jdbc_targets:")
            logger.info(jdbc_targets)
            try:
                response = glue.get_crawler(Name=crawler_name)
                logger.info("sync_rds_connection get_crawler:")
                logger.info(response)
                try:
                    if state == ConnectionState.ACTIVE.value or state == ConnectionState.UNSUPPORTED.value \
                            or state == ConnectionState.ERROR.value or state == ConnectionState.STOPPING.value:
                        up_cr_response = glue.update_crawler(
                            Name=crawler_name,
                            Role=crawler_role_arn,
                            DatabaseName=glue_database_name,
                            Targets={
                                'JdbcTargets': jdbc_targets,
                            },
                            SchemaChangePolicy={
                                'UpdateBehavior': 'UPDATE_IN_DATABASE',
                                'DeleteBehavior': 'DELETE_FROM_DATABASE'
                            }
                        )
                        logger.info("update rds crawler:")
                        logger.info(up_cr_response)
                except Exception as e:
                    logger.info("update_crawler error")
                    logger.info(str(e))
                st_cr_response = glue.start_crawler(
                    Name=crawler_name
                )
                logger.info(st_cr_response)
            except Exception as e:
                logger.info("sync_rds_connection get_crawler and create:")
                logger.info(str(e))
                response = glue.create_crawler(
                    Name=crawler_name,
                    Role=crawler_role_arn,
                    DatabaseName=glue_database_name,
                    Targets={
                        'JdbcTargets': jdbc_targets,
                    },
                    Tags={
                        'AdminAccountId': _admin_account_id
                    }
                )
                logger.info(response)
                start_response = glue.start_crawler(
                    Name=crawler_name
                )
                logger.info(start_response)
            crud.create_rds_connection(account, region, instance_name, glue_connection_name, glue_database_name,
                                       None, crawler_name)
        else:
            crud.set_rds_instance_source_glue_state(account, region, instance_name,
                                                    MessageEnum.SOURCE_RDS_NO_SCHEMA.get_msg())
            raise BizException(MessageEnum.SOURCE_RDS_NO_SCHEMA.get_code(), MessageEnum.SOURCE_RDS_NO_SCHEMA.get_msg())
    except Exception as err:
        crud.set_rds_instance_source_glue_state(account, region, instance_name, str(err))
        glue = boto3.client('glue',
                            aws_access_key_id=credentials['AccessKeyId'],
                            aws_secret_access_key=credentials['SecretAccessKey'],
                            aws_session_token=credentials['SessionToken'],
                            region_name=region
                            )
        """ :type : pyboto3.glue """

        try:
            glue.delete_crawler(crawler_name)
        except Exception:
            pass
        try:
            glue.delete_database(Name=glue_database_name)
        except Exception:
            pass
        try:
            glue.delete_connection(ConnectionName=glue_connection_name)
        except Exception:
            pass

        logger.error(traceback.format_exc())
        raise BizException(MessageEnum.SOURCE_CONNECTION_FAILED.get_code(),
                           str(err))


# raise error if cannot delete data source for rds
def before_delete_rds_connection(account: str, region: str, instance: str):
    rds_instance = crud.get_rds_instance_source(account, region, instance)
    if rds_instance is None:
        raise BizException(MessageEnum.SOURCE_RDS_NO_INSTANCE.get_code(),
                           MessageEnum.SOURCE_RDS_NO_INSTANCE.get_msg())
    # if rds_instance.glue_crawler is None:
    #     raise BizException(MessageEnum.SOURCE_RDS_NO_CRAWLER.get_code(),
    #                        MessageEnum.SOURCE_RDS_NO_CRAWLER.get_msg())
    # if rds_instance.glue_database is None:
    #     raise BizException(MessageEnum.SOURCE_RDS_NO_DATABASE.get_code(),
    #                        MessageEnum.SOURCE_RDS_NO_DATABASE.get_msg())
    # crawler, if crawling try to stop and raise, if pending raise directly
    state = crud.get_rds_instance_source_glue_state(account, region, instance)
    if state == ConnectionState.PENDING.value:
        raise BizException(MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_code(),
                           MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_msg())
    elif state == ConnectionState.CRAWLING.value:
        try:
            # Stop the crawler
            __glue(account=account, region=region).stop_crawler(Name=rds_instance.glue_crawler)
        except Exception as e:
            logger.error(traceback.format_exc())
        raise BizException(MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_code(),
                           MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_msg())
    elif state == ConnectionState.ACTIVE.value:
        # if job running, do not stop but raising
        if not can_delete_job_database(account_id=account, region=region, database_type='rds',
                                       database_name=instance):
            raise BizException(MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_code(),
                               MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_msg())


def delete_rds_connection(account: str, region: str, instance: str):
    before_delete_rds_connection(account, region, instance)
    glue = __glue(account, region)
    rds_instance = crud.get_rds_instance_source(account, region, instance)
    err = []
    # 1/3 delete job database
    try:
        delete_job_database(account_id=account, region=region, database_type='rds', database_name=instance)
    except Exception as e:
        err.append(str(e))
    # 2/3 delete catalog
    try:
        delete_catalog_by_database_region(database=instance, region=region, type='rds')
    except Exception as e:
        err.append(str(e))
    # 3/3 delete source
    try:
        glue.delete_crawler(Name=rds_instance.glue_crawler)
    except Exception as e:
        err.append(e)
    try:
        glue.delete_database(Name=rds_instance.glue_database)
    except Exception as e:
        err.append(e)
    try:
        glue.delete_connection(ConnectionName=rds_instance.glue_connection)
    except Exception as e:
        err.append(e)
    crud.delete_rds_connection(account, region, instance)
    if err:
        logger.error(traceback.format_exc())
        # raise BizException(MessageEnum.SOURCE_RDS_CONNECTION_DELETE_ERROR.get_code(), f"Delete with error: {err}")

    return []


def list_s3_bucket_source(condition: QueryCondition):
    return crud.list_s3_bucket_source(condition)


# raise error if cannot delete data source for s3
def before_delete_s3_connection(account: str, region: str, bucket: str):
    s3_bucket = crud.get_s3_bucket_source(account, region, bucket)
    if s3_bucket is None:
        raise BizException(MessageEnum.SOURCE_S3_NO_BUCKET.get_code(),
                           MessageEnum.SOURCE_S3_NO_BUCKET.get_msg())
    # if s3_bucket.glue_crawler is None:
    #     raise BizException(MessageEnum.SOURCE_S3_NO_CRAWLER.get_code(),
    #                        MessageEnum.SOURCE_S3_NO_CRAWLER.get_msg())
    # if s3_bucket.glue_database is None:
    #     raise BizException(MessageEnum.SOURCE_S3_NO_DATABASE.get_code(),
    #                        MessageEnum.SOURCE_S3_NO_DATABASE.get_msg())
    # crawler, if crawling try to stop and raise, if pending raise directly
    state = crud.get_s3_bucket_source_glue_state(account, region, bucket)
    if state == ConnectionState.PENDING.value:
        raise BizException(MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_code(),
                           MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_msg())
    elif state == ConnectionState.CRAWLING.value:
        try:
            # Stop the crawler
            __glue(account=account, region=region).stop_crawler(Name=s3_bucket.glue_crawler)
        except Exception as e:
            logger.error(traceback.format_exc())
        raise BizException(MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_code(),
                           MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_msg())
    elif state == ConnectionState.ACTIVE.value:
        # if job running, do not stop but raising
        if not can_delete_job_database(account_id=account, region=region, database_type='s3',
                                       database_name=bucket):
            raise BizException(MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_code(),
                               MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_msg())


def delete_s3_connection(account: str, region: str, bucket: str):
    before_delete_s3_connection(account, region, bucket)
    err = []
    # 1/3 delete job database
    try:
        delete_job_database(account_id=account, region=region, database_type='s3', database_name=bucket)
    except Exception as e:
        err.append(str(e))
    # 2/3 delete catalog
    try:
        delete_catalog_by_database_region(database=bucket, region=region, type='s3')
    except Exception as e:
        err.append(str(e))
    # 3/3 delete source
    s3_bucket = crud.get_s3_bucket_source(account, region, bucket)
    glue = __glue(account=account, region=region)
    try:
        glue.delete_crawler(Name=s3_bucket.glue_crawler)
    except Exception as e:
        err.append(str(e))
    try:
        glue.delete_database(Name=s3_bucket.glue_database)
    except Exception as e:
        err.append(str(e))

    crud.delete_s3_bucket_connection(account, region, bucket)
    try:
        crud.update_s3_bucket_count(account, region)
    except Exception as e:
        err.append(str(e))

    if err:
        logger.error(traceback.format_exc())
        # raise BizException(MessageEnum.SOURCE_S3_CONNECTION_DELETE_ERROR.get_code(), err)

    return True


def delete_glue_connection(account: str, region: str, glue_crawler: str,
                           glue_database: str, glue_connection: str):
    glue = __glue(account=account, region=region)
    try:
        glue.delete_crawler(Name=glue_crawler)
    except Exception as e:
        logger.info("delete_glue_crawler" + str(e))
    try:
        glue.delete_database(Name=glue_database)
    except Exception as e:
        logger.info("delete_glue_database" + str(e))
    # try:
    #     glue.delete_connection(ConnectionName=glue_connection)
    # except Exception as e:
    #     logger.info("delete_glue_connection" + str(e))
    return True


def refresh_data_source(provider_id: int, accounts: list[str], type: str):
    # tmp_provider = int(provider)
    if provider_id == Provider.AWS_CLOUD.value:
        refresh_aws_data_source(accounts, type)
    else:
        pass


def refresh_aws_data_source(accounts: list[str], type: str):
    if type is None or len(accounts) == 0:
        raise BizException(MessageEnum.SOURCE_REFRESH_FAILED.get_code(),
                           MessageEnum.SOURCE_REFRESH_FAILED.get_msg())
    try:
        if type == DataSourceType.s3.value:
            s3_detector.detect(accounts)

        elif type == DataSourceType.rds.value:
            rds_detector.detect(accounts)

        elif type == DataSourceType.glue_database.value:
            glue_database_detector.detect(accounts)

        elif type == DataSourceType.all.value:
            s3_detector.detect(accounts)
            rds_detector.detect(accounts)
            glue_database_detector.detect(accounts)
    except Exception as e:
        logger.error(traceback.format_exc())
        raise BizException(MessageEnum.SOURCE_CONNECTION_FAILED.get_code(), str(e))


def get_data_source_coverage(provider_id):
    provider_id = int(provider_id)
    if provider_id == Provider.AWS_CLOUD.value:
        res = SourceCoverage(s3_total=crud.get_total_s3_buckets_count(),
                             s3_connected=crud.get_connected_s3_buckets_size(),
                             rds_total=crud.get_total_rds_instances_count(),
                             rds_connected=crud.get_connected_rds_instances_count(),
                             jdbc_total=crud.get_total_jdbc_instances_count(provider_id),
                             jdbc_connected=crud.get_connected_jdbc_instances_count(provider_id)
                             )
    else:
        res = SourceCoverage(jdbc_total=crud.get_total_jdbc_instances_count(provider_id),
                             jdbc_connected=crud.get_connected_jdbc_instances_count(provider_id)
                             )
    return res


# Update account list by stackset state
# It will clean up accounts which stack_id is not null
def reload_organization_account(it_account: str):
    stack_instances = []
    member_accounts = []
    delegated_role_arn = __gen_role_arn(
        account_id=it_account,
        region=_admin_account_region,
        role_name=_delegated_role_name)
    if __assume_role(it_account, delegated_role_arn):
        # do not clean up for autosync
        # crud.cleanup_delegated_account(delegated_account_id=it_account)
        assumed_role = sts.assume_role(
            RoleArn=delegated_role_arn,
            RoleSessionName='get_organization'
        )
        credentials = assumed_role['Credentials']
        try:
            # check if it is delegated admin
            orgs = boto3.client('organizations',
                                aws_access_key_id=credentials['AccessKeyId'],
                                aws_secret_access_key=credentials['SecretAccessKey'],
                                aws_session_token=credentials['SessionToken'],
                                region_name=_admin_account_region
                                )
            delegated = orgs.list_delegated_administrators()
            call_as = 'DELEGATED_ADMIN' if any(
                admin['Id'] == it_account for admin in delegated['DelegatedAdministrators']) else 'SELF'
            cloudformation = boto3.client('cloudformation',
                                          aws_access_key_id=credentials['AccessKeyId'],
                                          aws_secret_access_key=credentials['SecretAccessKey'],
                                          aws_session_token=credentials['SessionToken'],
                                          region_name=_admin_account_region
                                          )
            active_stack_sets = cloudformation.list_stack_sets(
                Status='ACTIVE',
                CallAs=call_as
            )['Summaries']
            for stack_set in active_stack_sets:
                stack = cloudformation.describe_stack_set(
                    StackSetName=stack_set['StackSetName'],
                    CallAs=call_as
                )
                if '(SO8031-sub)' in stack['StackSet']['TemplateBody']:
                    response = cloudformation.list_stack_instances(
                        StackSetName=stack_set['StackSetName'],
                        MaxResults=30,
                        CallAs=call_as
                    )
                    stack_instances.extend(response['Summaries'])

                    while 'NextToken' in response:
                        response = cloudformation.list_stack_instances(
                            StackSetName=stack_set['StackSetName'],
                            MaxResults=30,
                            NextToken=response['NextToken'],
                            CallAs=call_as
                        )
                        stack_instances.extend(response['Summaries'])
            logger.debug(stack_instances)
            # convert to unique account list
            member_accounts = list(set(item['Account'] for item in stack_instances))
            for account in member_accounts:
                add_aws_account(account)
        except Exception as e:
            logger.error(traceback.format_exc())
            raise BizException(MessageEnum.SOURCE_ORG_ADD_ACCOUNT_FAILED.get_code(), str(e))
    else:
        raise BizException(MessageEnum.SOURCE_ASSUME_DELEGATED_ROLE_FAILED.get_code(),
                           MessageEnum.SOURCE_ASSUME_DELEGATED_ROLE_FAILED.get_msg())
    return member_accounts


def add_account(account: SourceNewAccount):
    # 同名测试
    if account.account_provider == Provider.AWS_CLOUD.value:
        add_aws_account(account.account_id)
    else:
        add_third_account(account, _admin_account_id, _admin_account_region)


def add_aws_account(account_id: str):
    # Open this loop for multiple region support
    # for region in const.CN_REGIONS:
    assumed_role = False
    for region in [_admin_account_region]:
        role_arn = __gen_role_arn(account_id=account_id, region=region, role_name=_agent_role_name)
        if __assume_role(account_id, role_arn):
            assumed_role = True
            # raise BizException(MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_code(),
            #  MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_msg())
            crud.add_account(
                aws_account_id=account_id,
                aws_account_alias=None,
                aws_account_email=None,
                region=region,
                status=1,
                detection_role_status='SUCCESS',
                delegated_aws_account_id=None,
                organization_unit_id=None,
                stack_id=None,
                stackset_id=None,
                stackset_name=None,
                stack_status=None,
                stack_instance_status=None,
                detection_role_name=role_arn
            )
            __update_access_policy_for_account()
            # add account and retrieve data source for all
            refresh_data_source(accounts=[account_id], type='all')
        else:
            logger.debug(MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_msg())
    if not assumed_role:
        raise BizException(MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_code(),
                           MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_msg())

def add_third_account(account, admin_account, admin_region):
    role_arn = __gen_role_arn(account_id=admin_account, region=admin_region, role_name=_agent_role_name)
    crud.add_third_account(account, role_arn)

def delete_account(account_provider: int, account_id: str, region: str):
    if account_provider == Provider.AWS_CLOUD.value:
        delete_aws_account(account_id)
    else:
        delete_third_account(account_provider, account_id, region)


def delete_aws_account(account_id):
    accounts_by_region = crud.list_all_accounts_by_region(region=_admin_account_region)
    list_accounts = [c[0] for c in accounts_by_region]
    if account_id not in list_accounts:
        raise BizException(MessageEnum.SOURCE_ACCOUNT_NOT_EXIST.get_code(),
                           MessageEnum.SOURCE_ACCOUNT_NOT_EXIST.get_msg())
    # this loop for multiple region support
    # for region in const.CN_REGIONS:
    assumed_role = False
    for region in [_admin_account_region]:
        role_arn = __gen_role_arn(account_id=account_id, region=region, role_name=_agent_role_name)
        if __assume_role(account_id, role_arn):
            assumed_role = True
        else:
            logger.debug(MessageEnum.SOURCE_ASSUME_ROLE_FAILED.get_msg())
    if not assumed_role:
        # account agent is undeployed, delete permanently, only infra
        del_error = False
        try:
            # delete jobs in db
            delete_job_by_account(account_id=account_id, region=_admin_account_region)
        except Exception:
            del_error = True
            logger.error(traceback.format_exc())
        try:
            # delete catalogs in db
            delete_catalog_by_account(account_id=account_id, region=_admin_account_region)
        except Exception:
            del_error = True
            logger.error(traceback.format_exc())
        try:
            # delete data sources in db
            __delete_data_source_by_account(account_id=account_id, region=_admin_account_region)
        except Exception:
            del_error = True
            logger.error(traceback.format_exc())
        try:
            # delete account in db
            __delete_account(account_id=account_id, region=_admin_account_region)
        except Exception:
            del_error = True
            logger.error(traceback.format_exc())
        try:
            # update policy
            __update_access_policy_for_account()
        except Exception:
            del_error = True
            logger.error(traceback.format_exc())
        if del_error:
            raise BizException(MessageEnum.SOURCE_ACCOUNT_DELETE_FAILED.get_code(),
                               MessageEnum.SOURCE_ACCOUNT_DELETE_FAILED.get_msg())
    else:
        # account agent exists, need uninsatll agent first
        raise BizException(MessageEnum.SOURCE_ACCOUNT_AGENT_EXIST.get_code(),
                           MessageEnum.SOURCE_ACCOUNT_AGENT_EXIST.get_msg())


def delete_third_account(account_provider, account_id, region):
    crud.delete_third_account(account_provider, account_id, region)


def refresh_account():
    __update_access_policy_for_account()


def get_secrets(account: str, region: str):
    iam_role_name = crud.get_iam_role(account)

    assumed_role = sts.assume_role(
        RoleArn=f"{iam_role_name}",
        RoleSessionName="glue-s3-connection"
    )
    credentials = assumed_role['Credentials']
    secretsmanager = boto3.client('secretsmanager',
                                  aws_access_key_id=credentials['AccessKeyId'],
                                  aws_secret_access_key=credentials['SecretAccessKey'],
                                  aws_session_token=credentials['SessionToken'],
                                  region_name=region
                                  )
    """ :type : pyboto3.secretsmanager """
    response = secretsmanager.list_secrets()
    secrets = []
    for secret in response['SecretList']:
        secrets.append(
            {
                "Name": secret['Name'],
                "ARN": secret['ARN']
            }
        )
    return secrets


def get_admin_account_info():
    return AdminAccountInfo(account_id=_admin_account_id, region=_admin_account_region)

def import_glue_database(glueDataBase: SourceGlueDatabaseBase):
    list = crud.list_glue_database_by_account(glueDataBase.account_id, glueDataBase.region, glueDataBase.glue_database_name)
    if list:
        raise BizException(MessageEnum.SOURCE_GLUE_DATABASE_EXISTS.get_code(),
                           MessageEnum.SOURCE_GLUE_DATABASE_EXISTS.get_msg())
    response = __glue(account=glueDataBase.account_id, region=glueDataBase.region).get_database(CatalogId=glueDataBase.account_id,
                                                                                                Name=glueDataBase.glue_database_name)['Database']
    # return response
    crud.import_glue_database(glueDataBase, response)

def update_jdbc_conn(jdbcConn: JDBCInstanceSource):
    account_id = jdbcConn.account_id if jdbcConn.account_provider_id == Provider.AWS_CLOUD.value else _admin_account_id
    region = jdbcConn.region if jdbcConn.account_provider_id == Provider.AWS_CLOUD.value else _admin_account_id
    check_connection(jdbcConn, account_id, region)
    update_connection(jdbcConn, account_id, region)

def check_connection(jdbc_instance: JDBCInstanceSource, assume_account, assume_role):

    res = crud.get_jdbc_instance_source_glue(jdbc_instance.account_provider_id, jdbc_instance.account_id, jdbc_instance.region, jdbc_instance.instance_id)
    if not res:
        raise BizException(MessageEnum.SOURCE_JDBC_CONNECTION_NOT_EXIST.get_code(),
                           MessageEnum.SOURCE_JDBC_CONNECTION_NOT_EXIST.get_msg())
    if res.glue_state == ConnectionState.PENDING.value:
        raise BizException(MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_code(),
                           MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_msg())
    elif res.glue_state == ConnectionState.CRAWLING.value:
        try:
            # Stop the crawler
            __glue(account=assume_account, region=assume_role).stop_crawler(Name=jdbc_instance.glue_crawler)
        except Exception as e:
            logger.error(traceback.format_exc())
        raise BizException(MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_code(),
                           MessageEnum.SOURCE_DELETE_WHEN_CONNECTING.get_msg())
    elif res.glue_state == ConnectionState.ACTIVE.value:
        # if job running, do not stop but raising
        if not can_delete_job_database(account_id=jdbc_instance.account_id, region=jdbc_instance.region, database_type='jdbc',
                                       database_name=jdbc_instance):
            raise BizException(MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_code(),
                               MessageEnum.DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE.get_msg())
    else:
        pass

def update_connection(jdbc_instance: JDBCInstanceSourceUpdate, assume_account, assume_role):
    source: JDBCInstanceSourceFullInfo = crud.get_jdbc_instance_source_glue(provider_id=jdbc_instance.account_provider_id,
                                                                            account=jdbc_instance.account_id,
                                                                            region=jdbc_instance.region,
                                                                            instance_id=jdbc_instance.instance_id)
    if not source:
        raise BizException(MessageEnum.SOURCE_JDBC_CONNECTION_NOT_EXIST.get_code(),
                           MessageEnum.SOURCE_JDBC_CONNECTION_NOT_EXIST.get_msg())
    
    logger.info(f"source.glue_connection is: {source.glue_connection}")
    response = __glue(account=assume_account, region=assume_role).update_connection(
        CatalogId=assume_account,
        Name=source.glue_connection,
        ConnectionInput={
            'Name': source.glue_connection,
            'Description': jdbc_instance.description,
            'ConnectionType': 'JDBC',
            'ConnectionProperties': {
                # 'CUSTOM_JDBC_CERT': jdbcConn.custom_jdbc_cert,
                # 'CUSTOM_JDBC_CERT_STRING': jdbcConn.custom_jdbc_cert_string,
                'JDBC_CONNECTION_URL': jdbc_instance.jdbc_connection_url,
                'JDBC_ENFORCE_SSL': jdbc_instance.jdbc_enforce_ssl,
                # 'KAFKA_SSL_ENABLED': jdbcConn.kafka_ssl_enabled,
                # 'SKIP_CUSTOM_JDBC_CERT_VALIDATION': jdbcConn.skip_custom_jdbc_cert_validation,
                'USERNAME': jdbc_instance.master_username,
                'PASSWORD': jdbc_instance.password,
                # 'JDBC_DRIVER_CLASS_NAME': jdbcConn.jdbc_driver_class_name,
                # 'JDBC_DRIVER_JAR_URI': jdbcConn.jdbc_driver_jar_uri
            },
            'PhysicalConnectionRequirements': {
                'SubnetId': jdbc_instance.network_subnet_id,
                'SecurityGroupIdList': [
                    jdbc_instance.network_sg_id,
                ],
                'AvailabilityZone': jdbc_instance.network_availability_zone
            }
        }
    )
    crud.update_jdbc_connection_full(jdbc_instance)


def add_jdbc_conn(jdbcConn: JDBCInstanceSource):
    account_id = jdbcConn.account_id if jdbcConn.account_provider_id == Provider.AWS_CLOUD.value else _admin_account_id
    region = jdbcConn.region if jdbcConn.account_provider_id == Provider.AWS_CLOUD.value else _admin_account_region
    list = crud.list_jdbc_instance_source_by_instance_id_account(jdbcConn, account_id)
    if list:
        raise BizException(MessageEnum.SOURCE_JDBC_ALREADY_EXISTS.get_code(),
                           MessageEnum.SOURCE_JDBC_ALREADY_EXISTS.get_msg())
    database_type = convert_provider_id_2_database_type(jdbcConn.account_provider_id)
    glue_connection_name = f"{const.SOLUTION_NAME}-{database_type}-{jdbcConn.instance_id}"
    # network_availability_zone by subnetId
    ec2_client, __ = __ec2(account=account_id, region=region)
    # return availability_zone
    try:
        availability_zone = ec2_client.describe_subnets(SubnetIds=[jdbcConn.network_subnet_id])['Subnets'][0]['AvailabilityZone']
        response = __glue(account=account_id, region=region).create_connection(
            CatalogId=account_id,
            ConnectionInput={
                'Name': glue_connection_name,
                'Description': jdbcConn.description,
                'ConnectionType': 'JDBC',
                'ConnectionProperties': {
                    # 'CUSTOM_JDBC_CERT': jdbcConn.custom_jdbc_cert,
                    # 'CUSTOM_JDBC_CERT_STRING': jdbcConn.custom_jdbc_cert_string,
                    'JDBC_CONNECTION_URL': jdbcConn.jdbc_connection_url,
                    'JDBC_ENFORCE_SSL': jdbcConn.jdbc_enforce_ssl,
                    # 'KAFKA_SSL_ENABLED': jdbcConn.kafka_ssl_enabled,
                    # 'SKIP_CUSTOM_JDBC_CERT_VALIDATION': jdbcConn.skip_custom_jdbc_cert_validation,
                    'USERNAME': jdbcConn.master_username,
                    'PASSWORD': jdbcConn.password,
                    # 'JDBC_DRIVER_CLASS_NAME': jdbcConn.jdbc_driver_class_name,
                    # 'JDBC_DRIVER_JAR_URI': jdbcConn.jdbc_driver_jar_uri
                },
                'PhysicalConnectionRequirements': {
                    'SubnetId': jdbcConn.network_subnet_id,
                    'SecurityGroupIdList': [
                        jdbcConn.network_sg_id
                    ],
                    'AvailabilityZone': availability_zone
                }
            }
        )
        if response['ResponseMetadata']['HTTPStatusCode'] != 200:
            raise BizException(MessageEnum.SOURCE_JDBC_CREATE_FAIL.get_code(),
                               MessageEnum.SOURCE_JDBC_CREATE_FAIL.get_msg())
        jdbcConn.network_availability_zone = availability_zone
        jdbcConn.create_type = JDBCCreateType.ADD.value
        jdbc_conn_insert = JDBCInstanceSourceFullInfo()
        jdbc_conn_insert.instance_id = jdbcConn.instance_id
        jdbc_conn_insert.account_provider_id = jdbcConn.account_provider_id
        jdbc_conn_insert.account_id = jdbcConn.account_id
        jdbc_conn_insert.region = jdbcConn.region
        jdbc_conn_insert.description = jdbcConn.description
        jdbc_conn_insert.jdbc_connection_url = jdbcConn.jdbc_connection_url
        jdbc_conn_insert.jdbc_enforce_ssl = jdbcConn.jdbc_enforce_ssl
        jdbc_conn_insert.kafka_ssl_enabled = jdbcConn.kafka_ssl_enabled
        jdbc_conn_insert.master_username = jdbcConn.master_username
        # jdbc_conn_insert.password = jdbcConn.password
        jdbc_conn_insert.skip_custom_jdbc_cert_validation = jdbcConn.skip_custom_jdbc_cert_validation
        jdbc_conn_insert.custom_jdbc_cert = jdbcConn.custom_jdbc_cert
        jdbc_conn_insert.custom_jdbc_cert_string = jdbcConn.custom_jdbc_cert_string
        jdbc_conn_insert.network_availability_zone = jdbcConn.network_availability_zone
        jdbc_conn_insert.network_subnet_id = jdbcConn.network_subnet_id
        jdbc_conn_insert.network_sg_id = jdbcConn.network_sg_id
        jdbc_conn_insert.creation_time = jdbcConn.creation_time
        jdbc_conn_insert.last_updated_time = jdbcConn.last_updated_time
        jdbc_conn_insert.jdbc_driver_class_name = jdbcConn.jdbc_driver_class_name
        jdbc_conn_insert.jdbc_driver_jar_uri = jdbcConn.jdbc_driver_jar_uri
        jdbc_conn_insert.create_type = jdbcConn.create_type
        jdbc_conn_insert.glue_connection = glue_connection_name
        crud.add_jdbc_conn(jdbc_conn_insert)
    except ClientError as ce:
        logger.error(traceback.format_exc())
        if ce.response['Error']['Code'] == 'AlreadyExistsException':
            raise BizException(MessageEnum.SOURCE_JDBC_ALREADY_EXISTS.get_code(),
                               MessageEnum.SOURCE_JDBC_ALREADY_EXISTS.get_msg())
        elif ce.response['Error']['Code'] == 'InvalidSubnetID.NotFound':
            raise BizException(MessageEnum.SOURCE_SUBNET_NOT_EXIST.get_code(),
                               MessageEnum.SOURCE_SUBNET_NOT_EXIST.get_msg())
        else:
            raise BizException(MessageEnum.BIZ_UNKNOWN_ERR.get_code(),
                               MessageEnum.BIZ_UNKNOWN_ERR.get_msg())
    except Exception as e:
        raise BizException(MessageEnum.BIZ_UNKNOWN_ERR.get_code(),
                           MessageEnum.BIZ_UNKNOWN_ERR.get_msg())

def test_jdbc_conn(jdbc_conn_param: JDBCInstanceSourceBase):
    account_id = jdbc_conn_param.account_id if jdbc_conn_param.account_provider_id == Provider.AWS_CLOUD.value else _admin_account_id
    region = jdbc_conn_param.region if jdbc_conn_param.region == Provider.AWS_CLOUD.value else _admin_account_region
    # get connection name from sdp db
    source: JDBCInstanceSourceFullInfo = crud.get_jdbc_instance_source_glue(provider_id=jdbc_conn_param.account_provider_id,
                                                                            account=jdbc_conn_param.account_id,
                                                                            region=jdbc_conn_param.region,
                                                                            instance_id=jdbc_conn_param.instance_id)
    if not source:
        raise BizException(MessageEnum.SOURCE_JDBC_CONNECTION_NOT_EXIST.get_code(),
                           MessageEnum.SOURCE_JDBC_CONNECTION_NOT_EXIST.get_msg())
    ConnectionProperties = __glue(account_id, region).get_connection(Name=source.glue_connection)['Connection']['ConnectionProperties']
    jdbc_url = ConnectionProperties['JDBC_CONNECTION_URL']
    username = ConnectionProperties['USERNAME']
    password = ConnectionProperties['PASSWORD']
    pass

def import_jdbc_conn(jdbcConn: JDBCInstanceSourceBase):
    res_connection = None
    if jdbcConn.account_provider_id != Provider.AWS_CLOUD.value:
        raise BizException(MessageEnum.SOURCE_NOT_AWS_ACCOUNT.get_code(),
                           MessageEnum.SOURCE_NOT_AWS_ACCOUNT.get_msg())
    try:
        res_connection = __glue(jdbcConn.account_id, jdbcConn.region).get_connection(Name=jdbcConn.instance_id)['Connection']
    except ClientError as ce:
        logger.error(traceback.format_exc())
        if ce.response['Error']['Code'] == 'EntityNotFoundException':
            raise BizException(MessageEnum.SOURCE_CONNECTION_NOT_FOUND.get_code(),
                               MessageEnum.SOURCE_CONNECTION_NOT_FOUND.get_msg())
        else:
            raise BizException(MessageEnum.BIZ_UNKNOWN_ERR.get_code(),
                               MessageEnum.BIZ_UNKNOWN_ERR.get_msg())
    except Exception as e:
        logger.error(traceback.format_exc())
        raise BizException(MessageEnum.BIZ_UNKNOWN_ERR.get_code(),
                           MessageEnum.BIZ_UNKNOWN_ERR.get_msg())
    logger.info(f"connection info:{res_connection}")
    jdbc_conn_insert = JDBCInstanceSourceFullInfo()
    jdbc_conn_insert.account_id = jdbcConn.account_id
    jdbc_conn_insert.region = jdbcConn.region
    jdbc_conn_insert.account_provider_id = jdbcConn.account_provider_id
    jdbc_conn_insert.instance_id = jdbcConn.instance_id
    jdbc_conn_insert.glue_connection = jdbcConn.instance_id
    jdbc_conn_insert.create_type = JDBCCreateType.IMPORT.value
    jdbc_conn_insert.description = res_connection['Description']
    jdbc_conn_insert.jdbc_connection_url = res_connection['ConnectionProperties']['JDBC_CONNECTION_URL']
    jdbc_conn_insert.jdbc_enforce_ssl = res_connection['ConnectionProperties']['JDBC_ENFORCE_SSL']
    # jdbc_conn_insert.kafka_ssl_enabled = res_connection['ConnectionProperties']['KAFKA_SSL_ENABLED']
    jdbc_conn_insert.master_username = res_connection['ConnectionProperties']['USERNAME']
    # jdbc_conn_insert.skip_custom_jdbc_cert_validation = res_connection['Description']
    # jdbc_conn_insert.custom_jdbc_cert = res_connection['Description']
    # jdbc_conn_insert.custom_jdbc_cert_string = res_connection['Description']
    jdbc_conn_insert.network_availability_zone = res_connection['PhysicalConnectionRequirements']['AvailabilityZone']
    jdbc_conn_insert.network_subnet_id = res_connection['PhysicalConnectionRequirements']['SubnetId']
    jdbc_conn_insert.network_sg_id = "|".join(res_connection['PhysicalConnectionRequirements']['SecurityGroupIdList'])
    jdbc_conn_insert.creation_time = res_connection['CreationTime']
    jdbc_conn_insert.last_updated_time = res_connection['LastUpdatedTime']
    # jdbc_conn_insert.jdbc_driver_class_name = res_connection['Description']
    # jdbc_conn_insert.jdbc_driver_jar_uri = res_connection['Description']
    res = crud.list_aws_jdbc_instance_source_by_account(jdbcConn)
    if res:
        crud.update_jdbc_conn(jdbc_conn_insert)
    else:
        crud.add_jdbc_conn(jdbc_conn_insert)

def __glue(account: str, region: str):
    iam_role_name = crud.get_iam_role(account)
    assumed_role = sts.assume_role(
        RoleArn=f"{iam_role_name}",
        RoleSessionName="glue-connection"
    )
    credentials = assumed_role['Credentials']
    return boto3.client('glue',
                        aws_access_key_id=credentials['AccessKeyId'],
                        aws_secret_access_key=credentials['SecretAccessKey'],
                        aws_session_token=credentials['SessionToken'],
                        region_name=region
                        )

def __ec2(account: str, region: str):
    iam_role_name = crud.get_iam_role(account)
    assumed_role = sts.assume_role(
        RoleArn=f"{iam_role_name}",
        RoleSessionName="ec2-client"
    )
    credentials = assumed_role['Credentials']
    return boto3.client('ec2',
                        aws_access_key_id=credentials['AccessKeyId'],
                        aws_secret_access_key=credentials['SecretAccessKey'],
                        aws_session_token=credentials['SessionToken'],
                        region_name=region), credentials

def __lakeformation(account: str, region: str):
    iam_role_name = crud.get_iam_role(account)
    assumed_role = sts.assume_role(
        RoleArn=f"{iam_role_name}",
        RoleSessionName="lakeformation-client"
    )
    credentials = assumed_role['Credentials']
    return boto3.client('lakeformation',
                        aws_access_key_id=credentials['AccessKeyId'],
                        aws_secret_access_key=credentials['SecretAccessKey'],
                        aws_session_token=credentials['SessionToken'],
                        region_name=region)

def __create_jdbc_url(engine: str, host: str, port: str):
    # see https://docs.aws.amazon.com/glue/latest/dg/connection-properties.html#connection-properties-jdbc
    if engine == 'aurora-postgres' or engine == "postgres":
        return f"jdbc:postgresql://{host}:{port}/postgres"
    elif engine == 'aurora-mysql' or engine == "mysql":
        return f"jdbc:mysql://{host}:{port}/information_schema"
    elif engine == 'oracle':
        return f"jdbc:oracle:thin://@{host}:{port}/database"
    return ''

# Add S3 bucket, SQS queues access policies
def __update_access_policy_for_account():
    s3_resource = boto3.session.Session().resource('s3')
    # for cn_region in const.CN_REGIONS:
    # check if s3 bucket, sqs exists
    bucket_name = f"{const.SOLUTION_NAME}-admin-{_admin_account_id}-{_admin_account_region}".lower()
    try:
        missing_resource = bucket_name
        s3_resource.meta.client.head_bucket(
            Bucket=bucket_name
        )
        sqs = boto3.client(
            'sqs',
            region_name=_admin_account_region
        )
        missing_resource = f"{const.SOLUTION_NAME}-Crawler"
        sqs.get_queue_url(
            QueueName=f"{const.SOLUTION_NAME}-Crawler",
            QueueOwnerAWSAccountId=_admin_account_id
        )
        missing_resource = f"{const.SOLUTION_NAME}-DiscoveryJob"
        sqs.get_queue_url(
            QueueName=f"{const.SOLUTION_NAME}-DiscoveryJob",
            QueueOwnerAWSAccountId=_admin_account_id
        )
        missing_resource = f"{const.SOLUTION_NAME}-AutoSyncData"
        sqs.get_queue_url(
            QueueName=f"{const.SOLUTION_NAME}-AutoSyncData",
            QueueOwnerAWSAccountId=_admin_account_id
        )
    except Exception as err:
        logger.error(f"Required resource {missing_resource} is missing, skipping region: {_admin_account_region}")
        return

    accounts = crud.list_all_accounts_by_region(region=_admin_account_region)
    if len(accounts) > 0:
        bucket_access_principals = []
        sqs_job_trigger_principals = []
        sqs_crawler_trigger_principals = []
        auto_sync_data_trigger_principals = []
        for account in accounts:

            role_arn = __gen_role_arn(account_id=account.aws_account_id, region=account.region,
                                      role_name=_agent_role_name)
            # validate assumed
            if __assume_role(account.aws_account_id, role_arn):
                s3_access_role_arn = f"arn:{partition}:iam::{account.aws_account_id}:role/{const.SOLUTION_NAME}GlueDetectionJobRole-{account.region}"
                bucket_access_principals.append(s3_access_role_arn)

                crawler_trigger_role_arn = f"arn:{partition}:iam::{account.aws_account_id}:role/{const.SOLUTION_NAME}RoleForCrawlerEvent-{account.region}"
                sqs_crawler_trigger_principals.append(crawler_trigger_role_arn)

                job_trigger_role_arn = f"arn:{partition}:iam::{account.aws_account_id}:role/{const.SOLUTION_NAME}DiscoveryJobRole-{account.region}"
                sqs_job_trigger_principals.append(job_trigger_role_arn)

                auto_sync_data_role_arn = f"arn:{partition}:iam::{account.aws_account_id}:role/{const.SOLUTION_NAME}DeleteAgentResourcesRole-{account.region}"
                auto_sync_data_trigger_principals.append(auto_sync_data_role_arn)

        # Bucket policies are limited to 20 KB in size.
        read_statement = {
            "Sid": "res-r",
            "Effect": "Allow",
            "Principal": {
                "AWS": bucket_access_principals
            },
            "Action": [
                "s3:GetObject",
            ],
            "Resource": [
                f"arn:{partition}:s3:::{bucket_name}/job/*",
                f"arn:{partition}:s3:::{bucket_name}/template/*"
            ]
        }
        list_statement = {
            "Sid": "res-l",
            "Effect": "Allow",
            "Principal": {
                "AWS": bucket_access_principals
            },
            "Action": [
                "s3:ListBucket",
            ],
            "Resource": [
                f"arn:{partition}:s3:::{bucket_name}"
            ]
        }
        write_statement = {
            "Sid": "res-w",
            "Effect": "Allow",
            "Principal": {
                "AWS": bucket_access_principals
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
            ],
            "Resource": f"arn:{partition}:s3:::{bucket_name}/glue-database/*"
        }
        s3 = boto3.client('s3')
        """ :type : pyboto3.s3 """
        try:
            restored_statements = []
            bucket_policy = json.loads(s3.get_bucket_policy(Bucket=bucket_name)['Policy'])
            for stat in bucket_policy['Statement']:
                if 'Sid' in stat and stat['Sid'] in ('res-w', 'res-r', 'res-l'):
                    continue
                else:
                    restored_statements.append(stat)

            restored_statements.append(read_statement)
            restored_statements.append(write_statement)
            restored_statements.append(list_statement)
            bucket_policy['Statement'] = restored_statements

            s3.put_bucket_policy(
                Bucket=bucket_name,
                Policy=json.dumps(bucket_policy)
            )
        except Exception as err:
            logger.error(traceback.format_exc())

        sqs = boto3.client(
            'sqs',
            region_name=_admin_account_region
        )
        """ :type : pyboto3.sqs """
        sqs_job_trigger_policy = {
            "Version": "2008-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:{partition}:iam::{_admin_account_id}:root"
                    },
                    "Action": "SQS:*",
                    "Resource": f"arn:{partition}:sqs:{_admin_account_region}:{_admin_account_id}:{const.SOLUTION_NAME}-DiscoveryJob"
                },
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": sqs_job_trigger_principals
                    },
                    "Action": "SQS:SendMessage",
                    "Resource": f"arn:{partition}:sqs:{_admin_account_region}:{_admin_account_id}:{const.SOLUTION_NAME}-DiscoveryJob"
                }
            ]
        }
        sqs_crawler_trigger_policy = {
            "Version": "2008-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:{partition}:iam::{_admin_account_id}:root"
                    },
                    "Action": "SQS:*",
                    "Resource": f"arn:{partition}:sqs:{_admin_account_region}:{_admin_account_id}:{const.SOLUTION_NAME}-Crawler"
                },
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": sqs_crawler_trigger_principals
                    },
                    "Action": "SQS:SendMessage",
                    "Resource": f"arn:{partition}:sqs:{_admin_account_region}:{_admin_account_id}:{const.SOLUTION_NAME}-Crawler"
                }
            ]
        }
        auto_sync_data_trigger_policy = {
            "Version": "2008-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:{partition}:iam::{_admin_account_id}:root"
                    },
                    "Action": "SQS:*",
                    "Resource": f"arn:{partition}:sqs:{_admin_account_region}:{_admin_account_id}:{const.SOLUTION_NAME}-AutoSyncData"
                },
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": auto_sync_data_trigger_principals
                    },
                    "Action": "SQS:SendMessage",
                    "Resource": f"arn:{partition}:sqs:{_admin_account_region}:{_admin_account_id}:{const.SOLUTION_NAME}-AutoSyncData"
                }
            ]
        }
        try:
            sqs.set_queue_attributes(
                QueueUrl=sqs.get_queue_url(QueueName=f"{const.SOLUTION_NAME}-DiscoveryJob")['QueueUrl'],
                Attributes={
                    "Policy": json.dumps(sqs_job_trigger_policy)
                }
            )
        except Exception as err:
            logger.error(traceback.format_exc())
        try:
            sqs.set_queue_attributes(
                QueueUrl=sqs.get_queue_url(QueueName=f"{const.SOLUTION_NAME}-Crawler")['QueueUrl'],
                Attributes={
                    "Policy": json.dumps(sqs_crawler_trigger_policy)
                }
            )
        except Exception as err:
            logger.error(traceback.format_exc())
        try:
            sqs.set_queue_attributes(
                QueueUrl=sqs.get_queue_url(QueueName=f"{const.SOLUTION_NAME}-AutoSyncData")["QueueUrl"],
                Attributes={
                    "Policy": json.dumps(auto_sync_data_trigger_policy)
                }
            )
        except Exception as err:
            logger.error(traceback.format_exc())


def __update_access_policy_for_ou(ou_id: str):
    pass


def __gen_role_arn(account_id: str, region: str, role_name: str):
    return f'arn:{partition}:iam::{account_id}:role/{const.SOLUTION_NAME}{role_name}-{region}'


def __assume_role(account_id: str, role_arn: str):
    try:
        response = sts.assume_role(
            RoleArn=role_arn,
            RoleSessionName='account_onboard_check',
            DurationSeconds=900,
        )
        return True
    except Exception as error:
        logger.error(traceback.format_exc())
    return False


def __list_rds_schema(account, region, credentials, instance_name, payload, rds_security_groups, rds_subnet_id):
    logger.info("__list_rds_schema")
    function_name = f"{const.SOLUTION_NAME}-{instance_name[0:50]}"
    schema_path = []
    lambda_ = boto3.client(
        'lambda',
        aws_access_key_id=credentials['AccessKeyId'],
        aws_secret_access_key=credentials['SecretAccessKey'],
        aws_session_token=credentials['SessionToken'],
        region_name=region
    )
    logger.info("__list_rds_schema get lambda")
    """ :type : pyboto3.lambda_ """
    try:
        lambda_.get_function(FunctionName=function_name)
    except Exception as e:
        logger.info("__list_rds_schema get lambda error and create")
        logger.info(str(e))
        lambda_.create_function(
            FunctionName=function_name,
            Handler='lambda_function.lambda_handler',
            Runtime='python3.9',
            Role=f"arn:{partition}:iam::{account}:role/SDPSLambdaRdsRole-{region}",
            Code={
                'S3Bucket': f"aws-gcr-solutions-{region}",
                'S3Key': 'aws-sensitive-data-protection/1.0.0/resource/schema_detection_function.zip',
            },
            Timeout=120,
            VpcConfig={
                'SubnetIds': [
                    rds_subnet_id,
                ],
                'SecurityGroupIds': rds_security_groups
            },
        )
        state = ''
        time_elapsed = 0
        timeout = 600
        while state != 'Active':
            response = lambda_.get_function(FunctionName=function_name)
            logger.info("__list_rds_schema get lambda function:")
            state = response['Configuration']['State']
            logger.info(state)
            sleep(SLEEP_TIME)
            time_elapsed += SLEEP_TIME
            if time_elapsed >= timeout:
                break

    logger.info("__list_rds_schema get lambda function invoke:")
    response = lambda_.invoke(
        FunctionName=function_name,
        InvocationType='RequestResponse',
        Payload=json.dumps(payload),
    )
    body = response['Payload'].read().decode()
    logger.info(body)
    # delete lambda
    logger.info("__list_rds_schema get lambda function delete:")
    logger.info(function_name)
    # lambda_.delete_function(FunctionName=function_name)
    schemas = json.loads(body)
    if schemas['statusCode'] == 500:
        raise Exception(schemas['errorMessage'])
    else:
        for schema in schemas['schema']:
            if schema['system'] == False:
                schema_path.append(schema['name'])
    logger.info("__list_rds_schema schema_path")
    logger.info(schema_path)
    return schema_path


def __delete_data_source_by_account(account_id: str, region: str):
    try:
        crud.delete_s3_bucket_source_by_account(account_id=account_id, region=region)
    except Exception:
        logger.error(traceback.format_exc())
    try:
        crud.delete_rds_instance_source_by_account(account_id=account_id, region=region)
    except Exception:
        logger.error(traceback.format_exc())


def __delete_account(account_id: str, region: str):
    try:
        crud.delete_account_by_region(account_id=account_id, region=region)
    except Exception:
        logger.error(traceback.format_exc())


def query_glue_connections(account: AdminAccountInfo):
    return __glue(account=account.account_id, region=account.region).get_connections(CatalogId=account.account_id,
                                                                                     Filter={'ConnectionType': 'JDBC'},
                                                                                     MaxResults=100,
                                                                                     HidePassword=True)['ConnectionList']

def query_glue_databases(account: AdminAccountInfo):
    return __glue(account=account.account_id, region=account.region).get_databases()['DatabaseList']

def query_account_network(account: AccountInfo):
    accont_id = account.account_id if account.account_provider_id == Provider.AWS_CLOUD.value else _admin_account_id
    region = account.region if account.region == Provider.AWS_CLOUD.value else _admin_account_region
    ec2_client, __ = __ec2(account=accont_id, region=region)
    try:
        response = ec2_client.describe_security_groups(GroupNames=[const.SECURITY_GROUP_JDBC])
        vpc_ids = [item['VpcId'] for item in response['SecurityGroups']]
        subnets = ec2_client.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_ids[0]]}])['Subnets']
        private_subnet = list(filter(lambda x: not x["MapPublicIpOnLaunch"], subnets))
        return ec2_client.describe_vpcs(VpcIds=[vpc_ids[0]])['Vpcs'][0]['VpcId'], \
            private_subnet[0]['SubnetId'] if private_subnet else subnets[0]['SubnetId'], \
            response['SecurityGroups'][0]['GroupId']
    except ClientError as ce:
        logger.error(traceback.format_exc())
        if ce.response['Error']['Code'] == 'InvalidGroup.NotFound':
            raise BizException(MessageEnum.SOURCE_SECURITYGROUP_NOT_FOUND.get_code(),
                               MessageEnum.SOURCE_SECURITYGROUP_NOT_FOUND.get_msg())
        else:
            raise BizException(MessageEnum.BIZ_UNKNOWN_ERR.get_code(),
                               MessageEnum.BIZ_UNKNOWN_ERR.get_msg())
    except Exception as e:
        raise BizException(MessageEnum.BIZ_UNKNOWN_ERR.get_code(),
                           MessageEnum.BIZ_UNKNOWN_ERR.get_msg())


def test_glue_conn(account, connection):
    return boto3.client('glue').start_connection_test(
        CatalogId=account,
        ConnectionName=connection
    )['ConnectionTest']['Status']


def list_data_location():
    res = []
    provider_list = crud.list_distinct_provider()
    for item in provider_list:
        regions = crud.list_distinct_region_by_provider(item.id)
        accounts_db = crud.get_account_list_by_provider(item.id)
        if not regions:
            continue
        if not accounts_db:
            continue
        for subItem in regions:
            accounts = []
            for account in accounts_db:
                if account.region == subItem.region_name:
                    accounts.append(account)
            if len(accounts) == 0:
                continue
            # TODO filter logic
            location = DataLocationInfo()
            location.account_count = len(accounts)
            location.source = item.provider_name
            location.region = subItem.region_name
            location.coordinate = subItem.region_cord
            location.region_alias = subItem.region_alias
            location.provider_id = item.id
            location.provider_name = item.provider_name
            res.append(location)
     # 根据 location.account_count 对 res 进行排序（从高到低）
    res = sorted(res, key=lambda x: x.account_count, reverse=True)
    return res


def query_regions_by_provider(provider_id: int):
    return crud.query_regions_by_provider(provider_id)

def query_full_provider_resource_infos():
    res = []
    provider_list = crud.query_provider_list()
    for item in provider_list:
        provider = ProviderResourceFullInfo()
        provider.description = item.description
        provider.provider_id = item.id
        provider.provider_name = item.provider_name
        provider.resources = []
        resources = crud.query_resources_by_provider(item.id)
        for subItem in resources:
            resource = SourceResourceBase()
            resource.apply_region_ids = subItem.apply_region_ids
            resource.description = subItem.description
            resource.resource_alias = subItem.resource_alias
            resource.resource_name = subItem.resource_name
            resource.status = subItem.status
            provider.resources.append(resource)
        res.append(provider)
    return res

def list_providers():
    return crud.query_provider_list()


def get_schema_from_url(url):
    res = ''
    # jdbc:mysql://81.70.179.114:9000/sdps-glue
    if url.startswith("jdbc:mysql://"):
        res = url[url.rindex("/") + 1:]
    # elif url.startswith("jdbc:mysql://"):
    return res

def grant_lake_formation_permission(credentials, crawler_role_arn, glue_database_name):
    lakeformation = boto3.client('lakeformation',
                                 aws_access_key_id=credentials['AccessKeyId'],
                                 aws_secret_access_key=credentials['SecretAccessKey'],
                                 aws_session_token=credentials['SessionToken'],
                                 region_name=_admin_account_region)
    """ :type : pyboto3.lakeformation """
    # retry for grant permissions
    num_retries = GRANT_PERMISSIONS_RETRIES
    while num_retries > 0:
        try:
            response = lakeformation.grant_permissions(
                Principal={
                    'DataLakePrincipalIdentifier': f"{crawler_role_arn}"
                },
                Resource={
                    'Database': {
                        'Name': glue_database_name
                    }
                },
                Permissions=['ALL'],
                PermissionsWithGrantOption=['ALL']
            )
        except Exception as e:
            sleep(SLEEP_MIN_TIME)
            num_retries -= 1
        else:
            break
    else:
        raise BizException(MessageEnum.SOURCE_UNCONNECTED.get_code(), MessageEnum.SOURCE_UNCONNECTED.get_msg())
