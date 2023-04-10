import discovery_job.service as service
from db.database import gen_session, close_session
import logging
import json

logger = logging.getLogger('receive_job_info')
logger.setLevel(logging.INFO)


def main(input_event):
    service.complete_run_database(input_event)
    service.change_run_state(int(input_event["RunId"]))


def lambda_handler(event, context):
    try:
        gen_session()
        for record in event['Records']:
            payload = record["body"]
            logger.info(payload)
            main(json.loads(payload))
    finally:
        close_session()
