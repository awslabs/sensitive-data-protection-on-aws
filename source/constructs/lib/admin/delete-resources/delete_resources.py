import logging
import boto3
import json
import traceback
import requests
import os

events_client = boto3.client('events')
lambda_client = boto3.client('lambda')

logger = logging.getLogger('delete_resources')
logger.setLevel(logging.INFO)
request_type_list = ["Create","Update","Delete"]
solution_name = os.getenv('SolutionName')


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
    refresh_account(event)


def on_delete(event):
    logger.info("Got Delete")
    delete_event_rules()


def refresh_account(event):
    response = lambda_client.invoke(FunctionName=f'{solution_name}-Controller',
                                    Payload='{"Action":"RefreshAccount"}')
    logger.info(response)


def __do_delete_rule(rule_name):
    try:
        response = events_client.remove_targets(
            Rule=rule_name,
            Ids=[
                '1',
            ],
            Force=True
        )
    except events_client.exceptions.ResourceNotFoundException as e:
        logger.exception(e)

    response = events_client.delete_rule(
        Name=rule_name,
    )


def __do_delete_rules(response):
    for rule in response["Rules"]:
        logger.info(f'check rule:{rule["Name"]}')
        response_rule = events_client.list_tags_for_resource(ResourceARN=rule["Arn"])
        logger.info(response_rule)
        owner = False
        for tag in response_rule["Tags"]:
            if tag["Key"] == "Owner" and tag["Value"] == solution_name:
                owner = True
                break
        if owner:
            __do_delete_rule(rule["Name"])


def delete_event_rules():
    next_token = None
    while True:
        if next_token:
            response = events_client.list_rules(NamePrefix=f'{solution_name}-Controller-', Limit=100, NextToken=next_token)
        else:
            response = events_client.list_rules(NamePrefix=f'{solution_name}-Controller-', Limit=100)
        __do_delete_rules(response)
        next_token = response.get('NextToken')
        if not next_token:
            break
