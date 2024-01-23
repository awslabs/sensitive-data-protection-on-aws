import json
import boto3
import math
from dateutil.parser import parse
import pytz
import logging

logger = logging.getLogger('SplitJob')
logger.setLevel(logging.INFO)
glue = boto3.client('glue')


def get_table_count(glue_database_name, base_time):
    next_token = ""
    table_count = 0
    while True:
        response = glue.get_tables(
            # CatalogId=catalog_id, 
            DatabaseName=glue_database_name, 
            NextToken=next_token)
        for table in response['TableList']:
            if table.get('Parameters', {}).get('classification', '') != 'UNKNOWN' and table['UpdateTime'] > base_time:
                table_count += 1
        next_token = response.get('NextToken')
        if next_token is None:
            break
    return table_count


def divide_and_round_up(a, b):
    return -math.floor(-a/b)


def get_job_number(event):
    if "JobNumber" in event:
        return event["JobNumber"]
    if event['DatabaseType'] in ["s3","glue"]:
        return 10
    return 3


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
    base_time = parse(event['BaseTime']).replace(tzinfo=pytz.timezone('UTC'))
    job_items = []
    if not(event.get('TableName') is None or event.get('TableName') == '' or event.get('TableName') == ','):
        job_item = event.copy()
        job_item["TableBegin"] = str(-1)
        job_item["TableEnd"] = str(-1)
        job_items.append(job_item)
        event["JobItems"]=job_items
        event["JobNumber"]=len(job_items)
        return event
    
    glue_database_name = event['GlueDatabaseName']
    if event.get("IsUnstructured") == 'true':
        glue_database_name = event['UnstructuredDatabaseName']
    logger.info(f"glue_database_name:{glue_database_name}")
    table_count = get_table_count(glue_database_name, base_time)
    if table_count == 0:
        event["JobItems"]=job_items
        event["JobNumber"]=len(job_items)  # Used to determine whether to execute a job
        return event
        
    job_number = get_job_number(event)
    logger.info(f"init JobNumber:{job_number}")
    if table_count < job_number:
        job_number = table_count
    table_size_per_job = divide_and_round_up(table_count,job_number)
    for index in range(0,job_number):
        table_begin = index * table_size_per_job
        table_end = (index+1) * table_size_per_job
        if table_end > table_count:
            table_end = table_count
        if table_begin >= table_end:
            break
        job_item = event.copy()
        job_item["TableBegin"] = str(table_begin)
        job_item["TableEnd"] = str(table_end)
        job_items.append(job_item)
    logger.info(f"actual JobNumber:{len(job_items)}")
    event["JobItems"]=job_items
    event["JobNumber"]=len(job_items)
    return event
