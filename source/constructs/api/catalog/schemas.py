import datetime
from typing import Optional
from pydantic import BaseModel


class CatalogColumnLevelClassification(BaseModel):

    id: int
    account_id: str
    region: str
    database_type: str
    database_name: str
    table_name: str
    column_name: str
    column_type: str
    column_order_num: int
    column_value_example: Optional[str]
    identifier: Optional[str]
    identifier_score: Optional[float]
    privacy: Optional[int]
    sensitivity: str
    comments: Optional[str]
    manual_tag: Optional[str]
    job_keyword: Optional[str]
    state: Optional[str]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]

    class Config:
        orm_mode = True


class CatalogTableLevelClassification(BaseModel):

    id: int
    account_id: str
    region: str
    database_type: str
    database_name: str
    table_name: str
    privacy: Optional[int]
    sensitivity: Optional[str]
    object_count: Optional[int]
    size_key: Optional[int]
    column_count: Optional[int]
    row_count: Optional[int]
    storage_location: Optional[str]
    identifiers: Optional[str]
    label_ids: Optional[str]
    manual_tag: Optional[str]
    state: Optional[str]
    classification: Optional[str]
    struct_type: Optional[str]
    detected_time: Optional[datetime.datetime]
    serde_info: Optional[str]
    table_properties: Optional[str]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]
    labels: Optional[list]



class CatalogDatabaseLevelClassification(BaseModel):

    id: int
    account_id: str
    region: str
    database_type: str
    database_name: str
    privacy: Optional[int]
    sensitivity: str
    object_count: Optional[int]
    size_key: Optional[int]
    table_count: Optional[int]
    column_count: Optional[int]
    row_count: Optional[int]
    storage_location: Optional[str]
    label_ids: Optional[str]
    manual_tag: Optional[str]
    state: Optional[str]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]
    labels: Optional[list]

    class Config:
        orm_mode = True


class CatalogCrawlerResultSync(BaseModel):

    account_id: str
    region: str
    database_type: str
    database_name: str


class CatalogJobResultDetection(BaseModel):

    account_id: str
    region: str
    database_type: str
    database_name: str
    job_run_id: str


class CatalogUpdateLabels(BaseModel):
    id: int
    labels: list