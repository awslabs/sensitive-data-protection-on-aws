import logging
import boto3
import json
import traceback
import requests
import os

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


def on_delete(event):
    logger.info("Got Delete")
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
            if (crawler.startswith('s3-') or crawler.startswith('rds-')) and crawler.endswith('-crawler'):
                response = glue.get_crawler(Name=crawler)
                print(response)
                database_name = response['Crawler']['DatabaseName']
                if crawler[:-8] == database_name[:-9]:
                    remove_database(database_name)
                if len(response['Crawler']['Targets']['JdbcTargets']) == 1:
                    connection_name = response['Crawler']['Targets']['JdbcTargets'][0]['ConnectionName']
                    if crawler[:-8] == connection_name[:-11]:
                        remove_jdbc_connection(connection_name)
                crawlers.append(crawler)

        next_page = response.get('NextToken')
        if next_page is None:
            break

    return crawlers


def remove_database(database: str):
    response = glue.get_database(Name=database)
    glue.delete_database(Name=database)


def remove_jdbc_connection(connection: str):
    response = glue.get_connection(Name=connection)
    glue.delete_connection(ConnectionName=connection)


def remove_crawler(crawler: str):
    response = glue.get_crawler(Name=crawler)
    glue.delete_crawler(Name=crawler)


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
