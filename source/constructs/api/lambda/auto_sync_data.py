import json
import logging

from common.enum import AutoSyncDataAction
from data_source.service import delete_account
from db.database import close_session, gen_session

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def sync_data(input_event):
    if input_event["Action"] == AutoSyncDataAction.DELETE_ACCOUNT.value:
        agent_account_id = input_event["AccountID"]
        delete_account(agent_account_id)


def lambda_handler(event, context):
    try:
        gen_session()
        for record in event['Records']:
            payload = record["body"]
            logger.info(payload)
            # main(payload)
            # payload = payload.replace("\'", "\"")
            sync_data(json.loads(payload))
    finally:
        close_session()
