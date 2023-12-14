import logging
import boto3
import json
import traceback
import requests
from datetime import timedelta, datetime
import os

logger = logging.getLogger('add_partition')
logger.setLevel(logging.INFO)
request_type_list = ["Create","Update","Delete"]


def lambda_handler(event, context):
    logger.info(event)
    try:
        # EventBridge trigger
        if event is None or 'RequestType' not in event:
            __pre_add_partition(1)
            return
        
        # CloudFormation trigger
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
    __pre_add_partition(0)
    __pre_add_partition(1)


def on_update(event):
    logger.info("Got Update")


def on_delete(event):
    logger.info("Got Delete")


def __pre_add_partition(day_delta: int):
    database_name = "sdps_database"
    table_name = "job_detection_output_table"
    bucket_name = os.getenv("AdminBucketName")
    __do_add_partition(database_name, table_name, bucket_name, day_delta)


def __do_add_partition(database_name: str, table_name: str, bucket_name: str, day_delta):
    client = boto3.client('glue')
    s3_url = f"s3://{bucket_name}/glue-database/{table_name}"

    now = datetime.utcnow()
    logger.info(f"event time: {now}")
    do_datetime = now + timedelta(days=day_delta)
    logger.info(f"do time: {do_datetime}")

    year = str(do_datetime.year)
    month = str(do_datetime.month)
    day = str(do_datetime.day)

    try:
        response2 = client.get_table(
            DatabaseName=database_name,
            Name=table_name
        )
    except Exception as error:
        logger.error("Cannot fetch table as " + str(error))
        exit(1)

    # Parsing table info required to create partitions from table
    input_format = response2['Table']['StorageDescriptor']['InputFormat']
    output_format = response2['Table']['StorageDescriptor']['OutputFormat']
    serde_info = response2['Table']['StorageDescriptor']['SerdeInfo']

    create_dict = []
    part_location = f"{s3_url}/year={year}/month={month}/day={day}/"
    input_json = {
        'Values': [
            year, month, day
        ],
        'StorageDescriptor': {
            'Location': part_location,
            'InputFormat': input_format,
            'OutputFormat': output_format,
            'SerdeInfo': serde_info
        }
    }

    create_dict.append(input_json)

    logger.info(json.dumps(create_dict))
    create_partition_response = client.batch_create_partition(
        DatabaseName=database_name,
        TableName=table_name,
        PartitionInputList=create_dict
    )
    logger.info(json.dumps(create_partition_response))

    return {
        'statusCode': 200,
        'body': create_partition_response
    }
