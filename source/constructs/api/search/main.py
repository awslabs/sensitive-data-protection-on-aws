from enum import Enum
import json
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from db.models_catalog import CatalogColumnLevelClassification, CatalogTableLevelClassification, \
    CatalogDatabaseLevelClassification
from db.models_data_source import S3BucketSource, Account, DetectionHistory, RdsInstanceSource, JDBCInstanceSource, SourceGlueDatabase
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
        if value and value[0]:
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
