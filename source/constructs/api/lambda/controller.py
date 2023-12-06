import discovery_job.service as service
from db.database import gen_session, close_session
import logging
from common.reference_parameter import logger

logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        gen_session()
        job_id = event["JobId"]
        logger.info(f'JobId:{job_id}')
        service.start_job(job_id)
    finally:
        close_session()
