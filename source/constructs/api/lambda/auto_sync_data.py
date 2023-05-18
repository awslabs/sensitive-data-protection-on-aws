import json
import logging
import time

from common.enum import AutoSyncDataAction
from data_source.service import delete_account
from db.database import close_session, gen_session
from common.constant import const

logger = logging.getLogger(const.LOGGER_API)
logger.setLevel(logging.INFO)


def sync_data(input_event):
    if input_event["Action"] == AutoSyncDataAction.DELETE_ACCOUNT.value:
        agent_account_id = input_event["AccountID"]
        # Wait for agent's role is deleted
        time.sleep(300)
        delete_account(agent_account_id)


def lambda_handler(event, context):
    try:
        gen_session()
        for record in event['Records']:
            payload = record["body"]
            logger.info(payload)
            sync_data(json.loads(payload))
    finally:
        close_session()
