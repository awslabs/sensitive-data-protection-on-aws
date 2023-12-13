import json
import logging
import time
import boto3
from common.enum import AutoSyncDataAction, Provider
from data_source.service import delete_account
from db.database import close_session, gen_session
from common.reference_parameter import logger, admin_region, partition
from botocore.exceptions import ClientError
from common.constant import const

logger.setLevel(logging.INFO)
client_sts = boto3.client('sts')


def __check_role(agent_account_id: str) -> bool:
    try:
        client_sts.assume_role(
            RoleArn=f'arn:{partition}:iam::{agent_account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{admin_region}',
            RoleSessionName="CheckRole"
        )
        return True
    except ClientError as e:
        if e.response['Error']['Code'] != 'AccessDenied':
            logger.info(e)
        return False


def sync_data(input_event):
    if input_event["Action"] == AutoSyncDataAction.DELETE_ACCOUNT.value:
        agent_account_id = input_event["AccountID"]
        # Wait for agent's role is deleted
        for i in range(0, 10):
            logger.info(f"Check time:{i}")
            if __check_role(agent_account_id):
                time.sleep(30)
            else:
                break
        delete_account(Provider.AWS_CLOUD.value, agent_account_id, None)


def lambda_handler(event, context):
    try:
        gen_session()
        for record in event['Records']:
            payload = record["body"]
            logger.info(payload)
            sync_data(json.loads(payload))
    finally:
        close_session()
