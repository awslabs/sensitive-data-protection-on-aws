import discovery_job.service as service
from db.database import gen_session, close_session
import logging
from common.reference_parameter import logger

logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        gen_session()
        service.check_running_run()
    finally:
        close_session()
