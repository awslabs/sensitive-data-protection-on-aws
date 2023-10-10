import logging
import boto3
import json
import traceback
import requests
import os
import time
from common.constant import const

glue = boto3.client('glue')
admin_account_id = os.getenv('AdminAccountId')

logger = logging.getLogger('delete_resources')
logger.setLevel(logging.INFO)
request_type_list = ["Create","Update","Delete"]


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


def delete_role():
    # Delete admin assumed role
    iam = boto3.client("iam")
    role_name = os.getenv("RoleName")
    logger.info(f"Deleting role {role_name}")
    try:
        iam.delete_role(RoleName=role_name)
    except Exception as e:
        logger.info(f"""Error occurred while deleting role {role_name}, 
                    this may be due to the agent stack has been deleted: {e}""")


def notify_admin_to_delete_resources():
    sqs = boto3.client("sqs")
    caller_identity = boto3.client("sts").get_caller_identity()
    partition = caller_identity["Arn"].split(":")[1]

    message = {
        "AccountID": os.getenv("AgentAccountID"), # Agent account Id
        "Action": "DeleteAccount", # Valid action: AddAccount/DeleteAccount/AddDataSource/DeleteDataSource
        "Timestamp": str(int(time.time())), # Timestamp in seconds
        "Region": os.getenv("RegionName")
    }
    url_suffix = ".cn" if partition == "aws-cn" else ""
    try:
        response = sqs.send_message(
            QueueUrl=f"https://sqs.{os.getenv('AWS_REGION')}.amazonaws.com{url_suffix}/{os.getenv('AdminAccountId')}/{os.getenv('QueueName')}",
            MessageBody=json.dumps(message))
        logger.info(response)
    except Exception as e:
        logger.error(e)


def on_delete(event):
    logger.info("Got Delete")
    notify_admin_to_delete_resources()
    delete_role()
    solution_name = event["ResourceProperties"]["SolutionNameAbbr"]
    crawlers = cleanup_crawlers()
    for crawler in crawlers:
        remove_crawler(crawler)
    clean_jobs()


def cleanup_crawlers():
    crawlers = []
    next_page = ''
    while True:
        response = glue.list_crawlers(NextToken=next_page, Tags={'AdminAccountId': admin_account_id})

        for crawler in response['CrawlerNames']:
            # if (crawler.startswith('s3-') or crawler.startswith('rds-')) and crawler.endswith('-crawler'):
            if crawler.startswith(const.SOLUTION_NAME + "-"):
                response = glue.get_crawler(Name=crawler)
                print(response)
                database_name = response['Crawler']['DatabaseName']
                # if crawler[:-8] == database_name[:-9]:
                if crawler.lower() == database_name.lower():
                    remove_database(database_name)
                if len(response['Crawler']['Targets']['JdbcTargets']) == 1:
                    connection_name = response['Crawler']['Targets']['JdbcTargets'][0]['ConnectionName']
                    # if crawler[:-8] == connection_name[:-11]:
                    if crawler.lower() == connection_name.lower():
                        remove_jdbc_connection(connection_name)
                crawlers.append(crawler)

        next_page = response.get('NextToken')
        if next_page is None:
            break

    return crawlers


def remove_database(database: str):
    try:
        glue.delete_database(Name=database)
    except Exception as e:
        logger.error(e)


def remove_jdbc_connection(connection: str):
    try:
        glue.delete_connection(ConnectionName=connection)
    except Exception as e:
        logger.error(e)


def remove_crawler(crawler: str):
    try:
        glue.delete_crawler(Name=crawler)
    except Exception as e:
        logger.error(e)


def clean_jobs():
    next_token = ''
    while True:
        response = glue.list_jobs(
            NextToken=next_token,
            Tags={"AdminAccountId": admin_account_id}
        )
        for job in response["JobNames"]:
            glue.delete_job(JobName=job)
        next_token = response.get("NextToken")
        if next_token is None:
            break
