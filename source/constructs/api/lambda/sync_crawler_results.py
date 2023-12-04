import json
import logging
import re
import traceback

import catalog.service as catalog_service
import data_source.crud as data_source_crud
from common.abilities import convert_database_type_2_provider
from common.abilities import need_change_account_id
from common.constant import const
from common.enum import DatabaseType, ConnectionState
from db.database import gen_session, close_session
from common.reference_parameter import logger

logger.setLevel(logging.INFO)
crawler_prefixes = const.SOLUTION_NAME + "-"


def sync_result(input_event):
    state = ConnectionState.ACTIVE.value
    if input_event['detail']['state'] == 'Failed':
        state = input_event['detail']['errorMessage']

    crawler_account_id = input_event['detail']['accountId']
    crawler_region = input_event['region']
    if 'detail' in input_event and 'crawlerName' in input_event['detail']:
        crawler_name = input_event['detail']['crawlerName']
        if not crawler_name.startswith(crawler_prefixes):
            return
        # add type support for jdbc
        # @see common/enum.py
        # is_jdbc = crawler_name.startswith(crawler_suffix + DatabaseType.JDBC.value + "-")
        parts = crawler_name.split('-')
        if len(parts) < 3:
            logger.error(f"not valid crawler name {crawler_name}")
            return
        database_type = parts[1]
        database_name = '-'.join(parts[2:])
        if need_change_account_id(database_type):
            try:
                # This is the third-party account and region, sync_crawler_result function in catalog uses these parameters
                # to update catalog tables.
                thirdparty_jdbc_source = data_source_crud.get_jdbc_instance_source_by_crawler_name(crawler_name)
                crawler_account_id = thirdparty_jdbc_source.account_id
                crawler_region = thirdparty_jdbc_source.region
            except Exception as err:
                logger.error(traceback.format_exc())
                return

    elif 'detail' in input_event and 'databaseName' in input_event['detail']:
        # Glue database type which created by user but SDPS.
        database_type = input_event['detail']['databaseType']
        database_name = input_event['detail']['databaseName']

    logger.debug(f"sync_result database_type:{database_type} database_name:{database_name}")
    try:
        if catalog_service.sync_crawler_result(account_id=crawler_account_id,
                                            region=crawler_region,
                                            database_type=database_type,
                                            database_name=database_name):
            state = state if input_event['detail']['state'] == 'Failed' else ConnectionState.ACTIVE.value
        logger.debug("sync_crawler_result finished ,start to update datasource")
    except Exception as err:
        logger.error(traceback.format_exc())
        state = str(err)

    if database_type == DatabaseType.S3.value:
        data_source_crud.update_s3_bucket_count(
            account=crawler_account_id,
            region=crawler_region,
        )
        data_source_crud.set_s3_bucket_source_glue_state(
            account=crawler_account_id,
            region=crawler_region,
            bucket=database_name,
            state=state
        )
        logger.debug("update s3 datasource finished")
    elif database_type == DatabaseType.RDS.value:
        data_source_crud.update_rds_instance_count(
            account=crawler_account_id,
            region=crawler_region,
        )
        data_source_crud.set_rds_instance_source_glue_state(
            account=crawler_account_id,
            region=crawler_region,
            instance_id=database_name,
            state=state
        )
        logger.debug("update rds datasource finished")
    elif database_type == DatabaseType.GLUE.value:
        data_source_crud.update_glue_database_count(
            account=crawler_account_id,
            region=crawler_region,
        )
        data_source_crud.set_glue_database_glue_state(
            account=crawler_account_id,
            region=crawler_region,
            database=database_name,
            state=state
        )
        logger.debug("update glue datasource finished")
    elif database_type.startswith(DatabaseType.JDBC.value):
        data_source_crud.update_jdbc_instance_count(
            provider=convert_database_type_2_provider(database_type),
            account=crawler_account_id,
            region=crawler_region,
        )
        data_source_crud.set_jdbc_connection_glue_state(
            provider=convert_database_type_2_provider(database_type),
            account=crawler_account_id,
            region=crawler_region,
            instance=database_name,
            state=state
        )
        logger.debug("update jdbc datasource finished")


def lambda_handler(event, context):
    try:
        gen_session()
        for record in event['Records']:
            payload = record["body"]
            logger.info(payload)
            updated_string = re.sub(r'("[^"]*?)(\'.*?\')([^"]*?")', r'\1--\3', str(payload))
            payload = updated_string.replace("\'", "\"")
            sync_result(json.loads(payload))
    except Exception:
        logger.error(traceback.format_exc())
    finally:
        close_session()
