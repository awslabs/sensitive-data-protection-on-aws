import logging
import os
from crhelper import CfnResource
import boto3

logger = logging.getLogger('delete_resources')
logger.setLevel(logging.INFO)

helper = CfnResource(json_logging=False, log_level='DEBUG', boto_level='CRITICAL', sleep_on_delete=30, ssl_verify=None)
glue = boto3.client('glue')

SOLUTION_NAME = "SDPS"
ADMIN_ACCOUNT_ID = os.getenv('AdminAccountId')

def cleanup_crawlers():
    crawlers = []
    next_page = ''
    while True:
        response = glue.list_crawlers(NextToken=next_page, Tags={'AdminAccountId': ADMIN_ACCOUNT_ID})

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
            Tags={"AdminAccountId": ADMIN_ACCOUNT_ID}
        )
        for job in response["JobNames"]:
            glue.delete_job(JobName=job)
        next_token = response.get("NextToken")
        if next_token is None:
            break


@helper.create
def create(event, context):
    logger.info("Got create")


@helper.update
def update(event, context):
    logger.info("Got Update")
    return "DeleteMyResourceId"


@helper.delete
def delete(event, context):
    crawlers = cleanup_crawlers()
    for crawler in crawlers:
        remove_crawler(crawler)
    clean_jobs()
    return "DeleteMyResourceId"


def lambda_handler(event, context):
    logger.info(event)
    helper(event, context)
