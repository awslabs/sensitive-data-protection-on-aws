import boto3
import logging
import os

logger = logging.getLogger('forward_message')
logger.setLevel(logging.INFO)
admin_region = os.getenv("AdminRegion", "cn-northwest-1")
sqs = boto3.resource('sqs', region_name=admin_region)


def lambda_handler(event, context):
    for record in event['Records']:
        event_source_arn = record["eventSourceARN"]
        queue_name = event_source_arn[event_source_arn.rfind(":") + 1:]
        payload = record["body"]
        logger.info(queue_name)
        logger.info(payload)
        forward_message(queue_name, payload)


def forward_message(queue_name: str, message: str):
    queue = sqs.get_queue_by_name(QueueName=queue_name)
    queue.send_message(MessageBody=message)
