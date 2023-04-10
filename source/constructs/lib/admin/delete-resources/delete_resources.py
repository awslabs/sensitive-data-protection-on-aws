import logging
from crhelper import CfnResource
import boto3

logger = logging.getLogger('delete_resources')
logger.setLevel(logging.INFO)

helper = CfnResource(json_logging=False, log_level='DEBUG', boto_level='CRITICAL', sleep_on_delete=120, ssl_verify=None)
events_client = boto3.client('events')
SOLUTION_NAME = "SDPS"


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
        if rule["Name"] == f'{SOLUTION_NAME}-CheckRun':
            continue
        logger.info(f'delete rule:{rule["Name"]}')
        __do_delete_rule(rule["Name"])


def delete_event_rules():
    response = events_client.list_rules(
        NamePrefix=f'{SOLUTION_NAME}-',
        Limit=100,
    )
    __do_delete_rules(response)
    while True:
        if "NextToken" not in response:
            break
        next_token = response["NextToken"]
        response = events_client.list_rules(
            NamePrefix=f'{SOLUTION_NAME}-',
            Limit=100,
            NextToken=next_token
        )
        __do_delete_rules(response)


@helper.create
def create(event, context):
    logger.info("Got create")


@helper.update
def update(event, context):
    logger.info("Got Update")
    return "DeleteMyResourceId"


@helper.delete
def delete(event, context):
    delete_event_rules()
    return "DeleteMyResourceId"


def lambda_handler(event, context):
    logger.info(event)
    helper(event, context)
