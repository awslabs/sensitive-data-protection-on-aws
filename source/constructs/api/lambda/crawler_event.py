import logging
import os
import boto3

logger = logging.getLogger("api")
logger.setLevel(logging.INFO)

sqs = boto3.client('sqs')
caller_identity = boto3.client('sts').get_caller_identity()
partition = caller_identity['Arn'].split(':')[1]
url_suffix = '.cn' if partition == 'aws-cn' else ''
solution_name = os.getenv('SolutionName')
admin_account_id = os.getenv('AdminAccountId')
queue_url = f"https://sqs.{os.getenv('AWS_REGION')}.amazonaws.com{url_suffix}/{admin_account_id}/{solution_name}-Crawler"


def lambda_handler(event, context):
    logger.info(event)
    if 'detail' in event and 'crawlerName' in event['detail']:
        crawler_name = event['detail']['crawlerName']
        if crawler_name.startswith(solution_name + "-"):
            message = sqs.send_message(
                QueueUrl=queue_url,
                MessageBody=str(event))
        else:
            logger.info(f"crawler event not send msg because of crawler_name not valid :{event}")
    elif 'detail' in event and 'databaseName' in event['detail']:
        # customer type : if glue database/unstructured , does not have real glue connection and crawler
        message = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=str(event))
    return {
        'statusCode': 200
    }
