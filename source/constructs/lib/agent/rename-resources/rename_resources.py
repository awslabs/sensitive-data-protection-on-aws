import logging
import boto3
import json
import traceback
import requests
import os
import time

glue_client = boto3.client('glue')
lakeformation_client = boto3.client('lakeformation')
SLEEP_TIME = 5
SLEEP_MIN_TIME = 2
GRANT_PERMISSIONS_RETRIES = 10

logger = logging.getLogger('rename_resources')
logger.setLevel(logging.INFO)
request_type_list = ["Create","Update","Delete"]
admin_account_id = os.getenv('AdminAccountId')
solution_name = os.getenv('SolutionName')
caller_identity = boto3.client('sts').get_caller_identity()
account_id = caller_identity.get('Account')
region = boto3.session.Session().region_name
partition = caller_identity['Arn'].split(':')[1]


def lambda_handler(event, context):
    logger.info(event)
    try:
        request_type = event['RequestType']
        if request_type not in request_type_list:
            send_response(event,"FAILED","request type not in list")
            return

        if request_type == 'Create':
            on_create(event)
        elif request_type == 'Update':
            on_update(event)
        elif request_type == 'Delete':
            on_delete(event)
        send_response(event)
    except Exception:
        error_msg = traceback.format_exc()
        logger.exception(error_msg.replace("\n", "\r"))
        send_response(event, "FAILED" ,error_msg)


def send_response(event, response_status = "SUCCESS", reason = "OK"):
    response_url = event['ResponseURL']
    response_body = {}
    response_body['Status'] = response_status
    response_body['PhysicalResourceId'] = event['PhysicalResourceId'] if 'PhysicalResourceId' in event else event['LogicalResourceId']
    response_body['StackId'] = event['StackId']
    response_body['RequestId'] = event['RequestId']
    response_body['LogicalResourceId'] = event['LogicalResourceId']
    response_body['Reason'] = reason

    json_response_body = json.dumps(response_body)

    headers = {
        'content-type': '',
        'content-length': str(len(json_response_body))
    }
    response = requests.put(response_url,
                            data=json_response_body,
                            headers=headers)
    return response


def on_create(event):
    logger.info("Got create")


def on_update(event):
    logger.info("Got Update")
    list_crawlers()


def on_delete(event):
    logger.info("Got Delete")


def __rename_database(new_database_name):
    try:
        glue_client.get_database(Name=new_database_name)
        logger.info(f"The new database({new_database_name}) exists and does not need to be created")
    except glue_client.exceptions.EntityNotFoundException as e:
        logger.info(f"The new database({new_database_name}) does not exist and needs to be created")
        response = glue_client.create_database(DatabaseInput={'Name': new_database_name})
        # wait for database creation, several seconds
        crawler_role_arn = f'arn:{partition}:iam::{account_id}:role/{solution_name}GlueDetectionJobRole-{region}'

        # retry for grant permissions
        num_retries = GRANT_PERMISSIONS_RETRIES
        while num_retries > 0:
            try:
                lakeformation_client.grant_permissions(
                    Principal={
                        'DataLakePrincipalIdentifier': f"{crawler_role_arn}"
                    },
                    Resource={
                        'Database': {
                            'Name': new_database_name
                        }
                    },
                    Permissions=['ALL'],
                    PermissionsWithGrantOption=['ALL']
                )
            except Exception as e:
                time.sleep(SLEEP_MIN_TIME)
                num_retries -= 1
            else:
                break


def __rename_crawler(old_crawler_name, new_crawler_name, new_database_name, new_connection_name):
    response = glue_client.get_crawler(Name=old_crawler_name)
    logger.info(response)
    old_crawler = response["Crawler"]
    try:
        glue_client.get_crawler(Name=new_crawler_name)
        logger.info(f"The new crawler({new_crawler_name}) exists and does not need to be created")
    except glue_client.exceptions.EntityNotFoundException as e:
        logger.info(f"The new crawler({new_crawler_name}) does not exist and needs to be created")
        jdbc_targets = old_crawler["Targets"]["JdbcTargets"]
        if jdbc_targets:
            logger.info("rename connection name")
            for jdbc_target in jdbc_targets:
                jdbc_target["ConnectionName"] = new_connection_name
        glue_client.create_crawler(
            Name=new_crawler_name,
            Role=old_crawler["Role"],
            DatabaseName=new_database_name,
            Targets=old_crawler["Targets"],
            Tags={
                'AdminAccountId': admin_account_id,
                'Owner': solution_name,
            }
        )


def __rename_connection(old_connection_name, new_connection_name):
    response= glue_client.get_connection(Name=old_connection_name)
    logger.info(response)
    old_connection = response["Connection"]
    try:
        glue_client.get_connection(Name=new_connection_name)
        logger.info(f"The new connection({new_connection_name}) exists and does not need to be created")
    except glue_client.exceptions.EntityNotFoundException as e:
        logger.info(f"The new connection({new_connection_name}) does not exist and needs to be created")
        glue_client.create_connection(
                        ConnectionInput={
                            'Name': new_connection_name,
                            'Description': old_connection['Description'],
                            'ConnectionType': old_connection['ConnectionType'],
                            'ConnectionProperties': old_connection['ConnectionProperties'],
                            'PhysicalConnectionRequirements': old_connection['PhysicalConnectionRequirements'],
                        }
                    )


def __rename(old_crawler_name: str):
    new_crawler_name = f"{solution_name}-{old_crawler_name[:-8]}"
    new_database_name = new_crawler_name
    new_connection_name = new_crawler_name
    if old_crawler_name.startswith("rds-"):
        old_connection_name = f"{old_crawler_name[:-8]}-connection"
        __rename_connection(old_connection_name, new_connection_name)
    __rename_database(new_database_name)
    __rename_crawler(old_crawler_name, new_crawler_name, new_database_name, new_connection_name)


def list_crawlers():
    time.sleep(30)
    next_page = ''
    while True:
        # In v1.0 version, only the AdminAcountId parameter is used
        response = glue_client.list_crawlers(NextToken=next_page, Tags={'AdminAccountId': admin_account_id})
        # logger.info(response)
        for crawler_name in response['CrawlerNames']:
            if not ((crawler_name.startswith("rds-") or crawler_name.startswith("s3-")) and crawler_name.endswith("-crawler")):
                continue
            __rename(crawler_name)

        next_page = response.get('NextToken')
        if next_page is None:
            break
