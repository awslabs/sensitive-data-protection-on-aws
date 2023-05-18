import boto3
import os
import logging
from common.constant import const
from common.enum import AthenaQueryState
from config.service import set_config, get_config
import tools.mytime as mytime
import time

logger = logging.getLogger(const.LOGGER_API)
project_bucket_name = os.getenv(const.PROJECT_BUCKET_NAME, const.PROJECT_BUCKET_DEFAULT_NAME)


def repair():
    if not __need_repair():
        return
    if __is_repairing():
        return
    __set_start()
    __do_repair()
    __complete_repair()


def __need_repair():
    repair_date = get_config(const.MSCK_REPAIR_DATE)
    if repair_date is None:
        return True
    today = mytime.get_date()
    return today != repair_date


def __is_repairing():
    start_time_str = get_config(const.MSCK_REPAIR_START_TIME)
    if start_time_str is None:
        return False
    start_time = mytime.parse_time(start_time_str)
    now = mytime.get_now()
    delta_seconds = (now - start_time).seconds
    return delta_seconds < 900


def __set_start():
    set_config(const.MSCK_REPAIR_START_TIME, mytime.get_time())


def __do_repair():
    client = boto3.client("athena")
    # MSCK
    msck_sql = """MSCK REPAIR TABLE %s;""" % (const.JOB_RESULT_TABLE_NAME)
    queryStart = client.start_query_execution(
        QueryString=msck_sql,
        QueryExecutionContext={
            "Database": const.JOB_RESULT_DATABASE_NAME,
            "Catalog": "AwsDataCatalog",
        },
        ResultConfiguration={"OutputLocation": f"s3://{project_bucket_name}/athena-output/"},
    )
    query_id = queryStart["QueryExecutionId"]
    while True:
        response = client.get_query_execution(QueryExecutionId=query_id)
        query_execution_status = response["QueryExecution"]["Status"]["State"]
        if query_execution_status == AthenaQueryState.SUCCEEDED.value:
            break
        if query_execution_status == AthenaQueryState.FAILED.value:
            logger.exception(response)
            raise Exception("Query Asset STATUS:" + response["QueryExecution"]["Status"]["StateChangeReason"])
        else:
            time.sleep(1)
    logger.debug("Athena MSCK SQL : " + msck_sql)


def __complete_repair():
    set_config(const.MSCK_REPAIR_DATE, mytime.get_date())
