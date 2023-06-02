import catalog.service as catalog_service
import data_source.crud as data_source_crud
from common.enum import DatabaseType, ConnectionState
from db.database import gen_session, close_session
import json
from common.constant import const
import logging
import re

logger = logging.getLogger(const.LOGGER_API)
logger.setLevel(logging.INFO)


def main(input_event):
    logger.info("start lambda : sync_crawler_results")
    logger.info(input_event)
    state = ConnectionState.ACTIVE.value
    if input_event['detail']['state'] == 'Failed':
        state = input_event['detail']['errorMessage']
    logger.info(state)
    crawler_name = input_event['detail']['crawlerName']
    logger.info(crawler_name)
    if crawler_name.startswith('rds-') and crawler_name.endswith('-crawler'):
        database_name = crawler_name[4:-8]
        try:
            if catalog_service.sync_crawler_result(account_id=input_event['detail']['accountId'],
                                                   region=input_event['region'],
                                                   database_type=DatabaseType.RDS.value,
                                                   database_name=database_name) == 0:
                state = ConnectionState.UNSUPPORTED.value

            data_source_crud.update_rds_instance_count(
                account=input_event['detail']['accountId'],
                region=input_event['region'],
            )
        except Exception as e:
            logger.error(str(e))

        data_source_crud.set_rds_instance_source_glue_state(
            account=input_event['detail']['accountId'],
            region=input_event['region'],
            instance_id=database_name,
            state=state
        )

    elif crawler_name.startswith('s3-') and crawler_name.endswith('-crawler'):
        database_name = crawler_name[3:-8]
        try:
            if catalog_service.sync_crawler_result(account_id=input_event['detail']['accountId'],
                                                   region=input_event['region'],
                                                   database_type=DatabaseType.S3.value,
                                                   database_name=database_name) == 0:
                state = ConnectionState.UNSUPPORTED.value

            data_source_crud.update_s3_bucket_count(
                account=input_event['detail']['accountId'],
                region=input_event['region'],
            )
        except Exception as e:
            logger.error(str(e))

        data_source_crud.set_s3_bucket_source_glue_state(
            account=input_event['detail']['accountId'],
            region=input_event['region'],
            bucket=database_name,
            state=state
        )


def lambda_handler(event, context):
    try:
        gen_session()
        for record in event['Records']:
            payload = record["body"]
            logger.info(payload)
            # main(payload)
            updated_string = re.sub(r'("[^"]*?)(\'.*?\')([^"]*?")', r'\1--\3', str(payload))
            payload = updated_string.replace("\'", "\"")
            main(json.loads(payload))
    finally:
        close_session()
