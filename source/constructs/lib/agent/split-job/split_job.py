import json
import boto3
import math
from dateutil.parser import parse
import pytz
import logging

logger = logging.getLogger('SplitJob')
logger.setLevel(logging.INFO)


def get_table_count(database_name, base_time):
    next_token = ""
    glue = boto3.client(service_name='glue')
    table_count = 0
    while True:
        response = glue.get_tables(
            # CatalogId=catalog_id, 
            DatabaseName=database_name, 
            NextToken=next_token)
        for table in response['TableList']:
            if table['UpdateTime'] > base_time:
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
    if event['DatabaseType'] == "s3":
        return 10
    return 3


def lambda_handler(event, context):
    logger.info(event)
    full_database_name=f"{event['DatabaseType']}-{event['DatabaseName']}-database"
    base_time = parse(event['BaseTime']).replace(tzinfo=pytz.timezone('UTC'))
    job_items = []
    if not(event.get('TableName') is None or event.get('TableName') == '' or event.get('TableName') == ','):
        job_item = event.copy()
        job_item["TableBegin"] = str(-1)
        job_item["TableEnd"] = str(-1)
        job_items.append(job_item)
        event["JobItems"]=job_items
        return event
        
    table_count = get_table_count(full_database_name, base_time)
    if table_count == 0:
        event["JobItems"]=job_items
        return event
        
    job_number = get_job_number(event)
    logger.info(f"init JobNumber:{job_number}")
    if table_count < job_number:
        job_number = table_count
    logger.info(f"actual JobNumber:{job_number}")
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
    event["JobItems"]=job_items
    return event
