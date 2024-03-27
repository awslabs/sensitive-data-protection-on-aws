import io
import json
import time
import zipfile
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

import boto3
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from db.models_catalog import CatalogColumnLevelClassification, CatalogTableLevelClassification, \
    CatalogDatabaseLevelClassification
from db.models_data_source import S3BucketSource, Account, DetectionHistory, RdsInstanceSource, JDBCInstanceSource, \
    SourceGlueDatabase
from db.models_discovery_job import DiscoveryJob, DiscoveryJobDatabase, DiscoveryJobRun, DiscoveryJobRunDatabase
from db.models_template import TemplateIdentifier, TemplateMapping
from . import crud

router = APIRouter(prefix="/query", tags=["query"])

searchable = [S3BucketSource,
              Account,
              DetectionHistory,
              RdsInstanceSource,
              JDBCInstanceSource,
              SourceGlueDatabase,
              DiscoveryJob,
              DiscoveryJobDatabase,
              DiscoveryJobRun,
              DiscoveryJobRunDatabase,
              CatalogColumnLevelClassification,
              CatalogTableLevelClassification,
              CatalogDatabaseLevelClassification,
              TemplateIdentifier,
              TemplateMapping]


class ConditionEnum(str, Enum):
    condition_and = "and"
    condition_or = "or"


class OrderByEnum(str, Enum):
    asc = "asc"
    desc = "desc"


class Condition(BaseModel):
    column: str = ''
    values: list[str] = []
    condition: Optional[ConditionEnum] = ConditionEnum.condition_and


class Query(BaseModel):
    table: str = ''
    page: Optional[int] = 1
    size: Optional[int] = 20
    sort_column: Optional[str] = ''
    asc: Optional[bool] = True
    conditions: Optional[list[Condition]]


# table_name, page, page size, sort(one column name), desc(true/false), filter([ {cloumn_name, column_value, condition_type} ])

# @router.get("/properties", response_model=BaseResponse)
# @inject_session
# def table_properties(table_name: TableEnum):
#     properties = []
#     for table_meta in searchable_table['tables']:
#         if table_meta['name'] == table_name:
#             for column in table_meta['columns']:
#                 properties.append(column)
#             break;
#     return properties


@router.get("/property_values", response_model=BaseResponse)
@inject_session
def filter_values(table: str, column: str, condition: str):
    cond = json.loads(condition) if condition else None
    for searchable_class in searchable:
        if searchable_class.__tablename__ == table:
            distinct = crud.get_filter_values(searchable_class, column, cond)
            break
    values = []
    for value in distinct:
        if isinstance(value, dict):
            values.append('Empty')
        elif value and value[0]:
            values.append(value[0])
        else:
            values.append('Empty')
    return values


@router.post("/", response_model=BaseResponse)
@inject_session
def filter_values(query: Query):
    for searchable_class in searchable:
        if searchable_class.__tablename__ == query.table:
            return crud.query(query, searchable_class)


@router.get("/columns", response_model=BaseResponse)
@inject_session
def columns(table: str):
    columns = []
    for searchable_class in searchable:
        if searchable_class.__tablename__ == table:
            for col in searchable_class.__dict__:
                if not col.startswith('_'):
                    columns.append(col)
            break
    return columns


@router.get("/tables", response_model=BaseResponse)
@inject_session
def tables():
    tables = []
    for searchable_class in searchable:
        tables.append(searchable_class.__tablename__)
    return tables


@router.get("/download-logs", response_class=StreamingResponse)
def download_log_as_zip():
    filename = f"aws_sdps_cloudwatch_logs.zip"
    logs = boto3.client('logs')
    response = logs.describe_log_groups(logGroupNamePattern='APIAPIFunction')
    log_group_names = [group['logGroupName'] for group in response['logGroups']]
    end_time = int(time.time()) * 1000
    start_time = end_time - 1 * 24 * 60 * 60 * 1000  # recent 1 days logs

    zip_bytes = io.BytesIO()
    with zipfile.ZipFile(zip_bytes, 'w') as zipf:
        for log_group_name in log_group_names:
            response = logs.filter_log_events(
                logGroupName=log_group_name,
                startTime=start_time,
                endTime=end_time,
                interleaved=True
            )
            log_events = sorted(response['events'], key=lambda x: x['timestamp'], reverse=True)
            log_file_name = f'{log_group_name}.txt'
            log_content = []
            for event in log_events:
                timestamp = event['timestamp'] / 1000  # to seconds
                timestamp_str = datetime.fromtimestamp(timestamp, timezone.utc).isoformat()
                log_content.append(f'{timestamp_str}\t {event["message"]}')

            zipf.writestr(log_file_name, '\n'.join(log_content))

    zip_bytes.seek(0)
    return StreamingResponse(zip_bytes, media_type="application/zip",
                             headers={"Content-Disposition": f"attachment; filename={filename}"})
