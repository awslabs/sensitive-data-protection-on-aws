import discovery_job.service as service
from db.database import gen_session, close_session
from common.constant import const
import logging

logger = logging.getLogger(const.LOGGER_API)
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        gen_session()
        service.check_running_run()
    finally:
        close_session()
