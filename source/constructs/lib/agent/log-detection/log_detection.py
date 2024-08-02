import json
import boto3
import math
from dateutil.parser import parse
import logging
from tempfile import NamedTemporaryFile

logger = logging.getLogger('SplitJob')
logger.setLevel(logging.INFO)
glue = boto3.client('glue')
s3_client = boto3.client('s3')


def get_log_crawler_result_index_count(event):
    source_data_base_name = event["DatabaseName"]
    log_crawler_result_bucket = event["AgentBucketName"]["Parameter"]["Value"]
    # Hardcode prefix to empty string for now, since we do not support scanning a specific prefix
    prefix = ""
    crawler_result_path_json = f"s3-log-crawler-result/crawler-results-index/{source_data_base_name}/{prefix}result.json"
    result_file = NamedTemporaryFile(delete=False, suffix=".json")
    s3_client.download_file(
        log_crawler_result_bucket, crawler_result_path_json, result_file.name
    )
    with open(result_file.name) as f:
        crawler_result_paths = json.load(f)

    return len(crawler_result_paths)

def divide_and_round_up(a, b):
    return -math.floor(-a/b)


def get_job_number(event):
    if "JobNumber" in event:
        return event["JobNumber"]
    if event['DatabaseType'] == "s3" or event['DatabaseType'] == "glue":
        return 10
    elif event['DatabaseType'] == "s3_log":
        return 50
    return 50


def __del_key(event, key):
    if key in event:
        del event[key]


def lambda_handler(event, context):
    logger.info(event)
    __del_key(event, "GetCrawler")
    __del_key(event, "StartCrawler")
    __del_key(event, "SendSchemaMessage")
    __del_key(event, "RunCrawler")
    __del_key(event, "CreateProcessingJob")
    __del_key(event, "GetProcessingJob")
    job_items = []
    if not(event.get('TableName') is None or event.get('TableName') == '' or event.get('TableName') == ','):
        job_item = event.copy()
        job_item["TableBegin"] = str(-1)
        job_item["TableEnd"] = str(-1)
        job_items.append(job_item)
        event["JobItems"]=job_items
        event["JobNumber"]=len(job_items)
        return event
    
    
    log_crawler_result_index_count = get_log_crawler_result_index_count(event)
    job_number = get_job_number(event)
    logger.info(f"init JobNumber:{job_number}")
    if log_crawler_result_index_count == 0:
        event["JobItems"]=job_items
        event["JobNumber"]=len(job_items)  # Used to determine whether to execute a job
        return event
    else:
        if log_crawler_result_index_count < job_number:
            job_number = log_crawler_result_index_count
        
        num_batch_per_job = log_crawler_result_index_count // job_number
        remainder = log_crawler_result_index_count % job_number
        
        for job_index in range(job_number):
            job_item = event.copy()
            if job_index < remainder:
                # Distribute the remainder among the first 'remainder' jobs
                begin = job_index * (num_batch_per_job + 1)
                end = begin + num_batch_per_job + 1
            else:
                begin = job_index * num_batch_per_job + remainder
                end = begin + num_batch_per_job
            job_item["TableBegin"] = str(begin)
            job_item["TableEnd"] = str(end)
            job_items.append(job_item)

        
        logger.info(f"actual JobNumber:{len(job_items)}")
        event["JobItems"]=job_items
        event["JobNumber"]=len(job_items)
        return event
