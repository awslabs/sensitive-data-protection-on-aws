import catalog.service as catalog_service
import data_source.crud as data_source_crud
from common.enum import DatabaseType, ConnectionState
from db.database import gen_session, close_session
import json
from common.constant import const
import logging

logger = logging.getLogger(const.LOGGER_API)
logger.setLevel(logging.INFO)


def main(input_event):
    state = ConnectionState.ACTIVE.value
    if input_event['detail']['state'] == 'Failed':
        state = input_event['detail']['errorMessage']

    crawler_name = input_event['detail']['crawlerName']
    if crawler_name.startswith('rds-') and crawler_name.endswith('-crawler'):
        database_name = crawler_name[4:-8]
        data_source_crud.set_rds_instance_source_glue_state(
            account=input_event['detail']['accountId'],
            region=input_event['region'],
            instance_id=database_name,
            state=state
        )
        catalog_service.sync_crawler_result(account_id=input_event['detail']['accountId'],
                                            region=input_event['region'],
                                            database_type=DatabaseType.RDS.value,
                                            database_name=database_name)
        data_source_crud.update_rds_instance_count(
            account=input_event['detail']['accountId'],
            region=input_event['region'],
        )

    elif crawler_name.startswith('s3-') and crawler_name.endswith('-crawler'):
        database_name = crawler_name[3:-8]
        data_source_crud.set_s3_bucket_source_glue_state(
            account=input_event['detail']['accountId'],
            region=input_event['region'],
            bucket=database_name,
            state=state
        )
        catalog_service.sync_crawler_result(account_id=input_event['detail']['accountId'],
                                            region=input_event['region'],
                                            database_type=DatabaseType.S3.value,
                                            database_name=database_name)
        data_source_crud.update_s3_bucket_count(
            account=input_event['detail']['accountId'],
            region=input_event['region'],
        )


def lambda_handler(event, context):
    try:
        gen_session()
        for record in event['Records']:
            payload = record["body"]
            logger.info(payload)
            # main(payload)
            payload = payload.replace("\"", "--")
            payload = payload.replace("\'", "\"")
            main(json.loads(payload))
    finally:
        close_session()
