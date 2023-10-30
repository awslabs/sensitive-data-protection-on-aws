import data_source.service as service
from db.database import gen_session, close_session
from common.constant import const
import logging

logger = logging.getLogger(const.LOGGER_API)
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        logger.info(event)
        gen_session()
        service.refresh_account()
    finally:
        close_session()
