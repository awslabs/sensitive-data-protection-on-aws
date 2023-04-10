import logging
import discovery_job.service as service
from db.database import gen_session, close_session

logger = logging.getLogger('controller')
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        gen_session()
        job_id = event["JobId"]
        logger.info(f'JobId:{job_id}')
        service.start_job(job_id)
    finally:
        close_session()
