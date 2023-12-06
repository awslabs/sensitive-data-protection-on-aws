import json
import logging
import time

from common.enum import AutoSyncDataAction, Provider
from data_source.service import delete_account
from db.database import close_session, gen_session
from common.reference_parameter import logger

logger.setLevel(logging.INFO)


def sync_data(input_event):
    if input_event["Action"] == AutoSyncDataAction.DELETE_ACCOUNT.value:
        agent_account_id = input_event["AccountID"]
        # Wait for agent's role is deleted
        time.sleep(60)
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
