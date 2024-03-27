import json
import discovery_job.service as discovery_job_service
import data_source.service as data_source_service
from db.database import gen_session, close_session
import logging.config
from common.constant import const
from . import auto_sync_data, sync_crawler_results
import re

logging.config.fileConfig('logging.conf', disable_existing_loggers=False)
logger = logging.getLogger(const.LOGGER_API)


def lambda_handler(event, context):
    try:
        logger.info(event)
        gen_session()
        if not event:
            return
        if "Records" in event:
            __dispatch_message(event)
            return
        # In the old version, the only parameter for scheduled job was JobId
        if "JobId" in event and len(event) == 1:
            __schedule_job(event)
        controller_action = event[const.CONTROLLER_ACTION]
        if not controller_action:
            return
        if controller_action == const.CONTROLLER_ACTION_SCHEDULE_JOB:
            __schedule_job(event)
        elif controller_action == const.CONTROLLER_ACTION_CHECK_RUNNING_RUN_DATABASES:
            discovery_job_service.check_running_run_databases()
        elif controller_action == const.CONTROLLER_ACTION_CHECK_PENDING_RUN_DATABASES:
            discovery_job_service.check_pending_run_databases()
        elif controller_action == const.CONTROLLER_ACTION_REFRESH_ACCOUNT:
            data_source_service.refresh_account()
        else:
            logger.error("Unknown action")
    finally:
        close_session()


def __schedule_job(event):
    discovery_job_service.start_job(event["JobId"])


def __replace_single_quotes(match):
    return match.group(0).replace("'", "`")


def __deal_single_quotes(payload):
    logger.info(payload)
    updated_string = re.sub(r'".*?"', __replace_single_quotes, str(payload))
    payload = updated_string.replace("\'", "\"")
    logger.debug(payload)
    return payload


def __dispatch_message(event):
    if event['Records'][0].get("EventSource") == "aws:sns":
        __deal_sns(event)
    else:
        __deal_sqs(event)


def __deal_sns(event):
    event_source = event['Records'][0]["EventSubscriptionArn"].split(":")[-2]
    logger.info(f"event_source:{event_source}")
    for record in event['Records']:
        payload = record["Sns"]["Message"]
        payload = __deal_single_quotes(payload)
        current_event = json.loads(payload)
        if event_source == f"{const.SOLUTION_NAME}-JobCompleted":
            discovery_job_service.generate_report(int(current_event["JobId"]), int(current_event["RunId"]))


def __deal_sqs(event):
    event_source = event['Records'][0]["eventSourceARN"].split(":")[-1]
    logger.info(f"event_source:{event_source}")
    for record in event['Records']:
        payload = record["body"]
        payload = __deal_single_quotes(payload)
        current_event = json.loads(payload)
        if event_source == f"{const.SOLUTION_NAME}-DiscoveryJob":
            discovery_job_service.complete_run_database(current_event)
            discovery_job_service.complete_run(int(current_event["RunId"]))
        elif event_source == f"{const.SOLUTION_NAME}-AutoSyncData":
            auto_sync_data.sync_data(current_event)
        elif event_source == f"{const.SOLUTION_NAME}-Crawler":
            sync_crawler_results.sync_result(current_event)
