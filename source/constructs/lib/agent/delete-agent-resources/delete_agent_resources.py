import logging
import boto3
import json
import traceback
import requests
import os
import time


glue = boto3.client('glue')

logger = logging.getLogger('delete_resources')
logger.setLevel(logging.INFO)
request_type_list = ["Create","Update","Delete"]
solution_name = os.getenv('SolutionName')
admin_account_id = os.getenv('AdminAccountId')

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
            QueueUrl=f"https://sqs.{os.getenv('AWS_REGION')}.amazonaws.com{url_suffix}/{admin_account_id}/{os.getenv('QueueName')}",
            MessageBody=json.dumps(message))
        logger.info(response)
    except Exception as e:
        logger.error(e)


def on_delete(event):
    logger.info("Got Delete")
    notify_admin_to_delete_resources()
    crawlers = cleanup_crawlers()
    for crawler in crawlers:
        remove_crawler(crawler)
    clean_jobs()


def cleanup_crawlers():
    crawlers = []
    next_page = ''
    while True:
        response = glue.list_crawlers(NextToken=next_page, Tags={'Owner':solution_name, 'AdminAccountId': admin_account_id})
        for crawler_name in response['CrawlerNames']:
            if not crawler_name.startswith(solution_name + "-"):
                continue
            response_crawler = glue.get_crawler(Name=crawler_name)
            logger.info(response_crawler)
            database_name = response_crawler['Crawler']['DatabaseName']
            remove_database(database_name)
            if database_name.startswith(f"{solution_name}-s3-"):
                unstructured_database_name = database_name.replace(f"{solution_name}-s3-",f"{solution_name}-unstructured-",1)
                remove_database(unstructured_database_name)
            if len(response_crawler['Crawler']['Targets']['JdbcTargets']) > 0:
                connection_name = response_crawler['Crawler']['Targets']['JdbcTargets'][0]['ConnectionName']
                remove_jdbc_connection(connection_name)
            crawlers.append(crawler_name)

        next_page = response.get('NextToken')
        if next_page is None:
            break

    return crawlers


def remove_database(database_name: str):
    try:
        logger.info(f"delete glue database:{database_name}")
        glue.delete_database(Name=database_name)
    except Exception as e:
        logger.error(e)


def remove_jdbc_connection(connection: str):
    try:
        glue.delete_connection(ConnectionName=connection)
    except Exception as e:
        logger.error(e)


def remove_crawler(crawler_name: str):
    try:
        glue.delete_crawler(Name=crawler_name)
    except Exception as e:
        logger.error(e)


def clean_jobs():
    next_token = ''
    while True:
        response = glue.list_jobs(
            NextToken=next_token,
            Tags={'Owner':solution_name, "AdminAccountId": admin_account_id}
        )
        for job in response["JobNames"]:
            glue.delete_job(JobName=job)
        next_token = response.get("NextToken")
        if next_token is None:
            break
