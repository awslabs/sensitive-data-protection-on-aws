import data_source.service as service
from db.database import gen_session, close_session
import logging
from common.reference_parameter import logger

logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        logger.info(event)
        gen_session()
        service.refresh_account()
    finally:
        close_session()
