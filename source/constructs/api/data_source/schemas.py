from uuid import UUID
import datetime
from typing import Optional
from pydantic import BaseModel
from typing import List
from common.enum import DataSourceType

class DataSource(BaseModel):
    id: int
    source_type: Optional[str]
    status: Optional[int]
    source_id: Optional[int]


class Account(BaseModel):
    id: int
    account_id: Optional[str]
    account_alias: Optional[str]
    account_email: Optional[str]
    account_provider_id: Optional[int]
    delegated_account_id: Optional[str]
    region: Optional[str]
    organization_unit_id: Optional[str]
    stack_id: Optional[str]
    stackset_id: Optional[str]
    stackset_name: Optional[str]
    status: Optional[int]
    stack_status: Optional[str]
    stack_instance_status: Optional[str]
    detection_role_name: Optional[str]
    detection_role_status: Optional[int]
    total_s3_bucket: Optional[int]
    connected_s3_bucket: Optional[int]
    total_rds_instance: Optional[int]
    connect_rds_instance: Optional[int]
    total_glue_database: Optional[int]
    connected_glue_database: Optional[int]
    total_jdbc_instance: Optional[int]
    connect_jdbc_instance: Optional[int]
    last_updated: Optional[datetime.datetime]

    class Config:
        orm_mode = True


class DetectionHistory(BaseModel):
    id: int
    detect_uuid: Optional[UUID]
    detection_time: Optional[datetime.datetime]
    account_id: Optional[int]
    source_type: Optional[str]
    state: Optional[int]
    aws_account: Optional[str]


class S3BucketSource(BaseModel):
    id: int
    bucket_name: Optional[str]
    size: Optional[int]
    account_id: Optional[int]
    region: Optional[str]
    creation_date: Optional[datetime.datetime]
    data_source_id: Optional[int]
    detection_history_id: Optional[int]
    aws_account: Optional[str]
    glue_database: Optional[str]
    glue_connection: Optional[str]
    glue_vpc_endpoint: Optional[str]
    glue_crawler: Optional[str]
    glue_crawler_last_updated: Optional[datetime.datetime]
    glue_state: Optional[str]

    class Config:
        orm_mode = True


class DynamodbTableSource(BaseModel):
    id: int
    account_id: Optional[int]
    table_name: Optional[str]
    region: Optional[str]
    data_source_id: int
    detection_history_id: Optional[int]
    detection_history_id: Optional[int]
    aws_account: Optional[str]
    glue_database: Optional[str]
    glue_crawler: Optional[str]
    glue_crawler_last_updated: Optional[datetime.datetime]
    glue_state: Optional[str]

    class Config:
        orm_mode = True

class SourceGlueDatabaseBase(BaseModel):
    glue_database_name: Optional[str]
    account_id: Optional[str]
    region: Optional[str]

class SourceGlueDatabase(SourceGlueDatabaseBase):
    glue_database_description: Optional[str]
    glue_database_location_uri: Optional[str]
    glue_database_create_time: Optional[str]
    glue_database_catalog_id: Optional[str]
    data_lake_principal_identifier: Optional[str]
    permissions: Optional[str]

    class Config:
        orm_mode = True

class SourceGlueDatabaseFullInfo(SourceGlueDatabase):
    glue_state: Optional[str]
    account_id: Optional[str]
    region: Optional[str]

    class Config:
        orm_mode = True

class RdsInstanceSource(BaseModel):
    id: int
    instance_id: Optional[str]
    instance_class: Optional[str]
    engine: Optional[str]
    address: Optional[str]
    port: Optional[int]
    master_username: Optional[str]
    instance_status: Optional[str]
    account_id: Optional[int]
    region: Optional[str]
    data_source_id: Optional[int]
    detection_history_id: Optional[int]
    aws_account: Optional[str]
    created_time: Optional[datetime.datetime]
    glue_database: Optional[str]
    glue_connection: Optional[str]
    glue_vpc_endpoint: Optional[str]
    glue_crawler: Optional[str]
    glue_state: Optional[str]
    glue_crawler_last_updated: Optional[datetime.datetime]

    class Config:
        orm_mode = True


class JDBCInstanceSourceBase(BaseModel):
    instance_id: Optional[str]
    account_provider_id: Optional[int]
    account_id: Optional[str]
    region: Optional[str]

    class Config:
        orm_mode = True

class JDBCInstanceSource(JDBCInstanceSourceBase):
    description: Optional[str]
    jdbc_connection_url: Optional[str]
    jdbc_enforce_ssl: Optional[str]
    kafka_ssl_enabled: Optional[str]
    master_username: Optional[str]
    password: Optional[str]
    skip_custom_jdbc_cert_validation: Optional[str]
    custom_jdbc_cert: Optional[str]
    custom_jdbc_cert_string: Optional[str]
    network_availability_zone: Optional[str]
    network_subnet_id: Optional[str]
    network_sg_id: Optional[str]
    creation_time: Optional[str]
    last_updated_time: Optional[str]
    jdbc_driver_class_name: Optional[str]
    jdbc_driver_jar_uri: Optional[str]
    create_type: Optional[int]

    class Config:
        orm_mode = True

class JDBCInstanceSourceFullInfo(JDBCInstanceSource):
    data_source_id: Optional[int]
    detection_history_id: Optional[int]
    glue_database: Optional[str]
    glue_connection: Optional[str]
    glue_vpc_endpoint: Optional[str]
    glue_crawler: Optional[str]
    glue_state: Optional[str]
    instance_class: Optional[str]
    instance_status: Optional[str]

    class Config:
        orm_mode = True

class Region(BaseModel):
    id: Optional[int]
    region: Optional[str]
    state: Optional[int]


class AccountCompare(BaseModel):
    id: int
    aws_account_id: Optional[str]
    aws_account_alias: Optional[str]
    status: Optional[int]
    detection_role_name: Optional[str]


class SourceCoverage(BaseModel):
    s3_connected: Optional[int]
    s3_total: Optional[int]
    rds_connected: Optional[int]
    rds_total: Optional[int]
    jdbc_connected: Optional[int]
    jdbc_total: Optional[int]


class SourceS3Connection(BaseModel):
    account_id: str
    region: str
    bucket: str

class SourceRdsConnection(BaseModel):
    account_id: str
    region: str
    instance: str
    rds_user: Optional[str]
    rds_password: Optional[str]
    rds_secret: Optional[str]

class SourceJDBCConnectionBase(BaseModel):
    account_provider: Optional[int]
    account_id: Optional[str]
    region: Optional[str]
    instance: Optional[str]

class SourceJDBCConnection(BaseModel):
    account_provider: Optional[int]
    account_id: Optional[str]
    region: Optional[str]
    instance: Optional[str]
    secret: Optional[str]
    network_availability_zone: Optional[str]
    network_subnet_id: Optional[str]
    network_sg_id: Optional[str]
    jdbc_connection_url: Optional[str]
    jdbc_enforce_ssl: Optional[str]
    kafka_ssl_enabled: Optional[str]
    master_username: Optional[str]
    password: Optional[str]
    skip_custom_jdbc_cert_validation: Optional[str]
    custom_jdbc_cert: Optional[str]
    custom_jdbc_cert_string: Optional[str]

    class Config:
        orm_mode = True


class SourceDeteteGlueDatabase(BaseModel):
    account_provider: int
    account_id: str
    region: str
    name: str

class SourceDeteteJDBCConnection(BaseModel):
    account_provider: int
    account_id: str
    region: str
    instance: str

class SourceDeteteS3Connection(BaseModel):
    account_id: str
    region: str
    bucket: str

class SourceDeteteRdsConnection(BaseModel):
    account_id: str
    region: str
    instance: str

class SourceNewAccount(BaseModel):
    account_provider: int
    account_id: str
    region: str

class SourceOrgAccount(BaseModel):
    organization_management_account_id: str

class NewDataSource(BaseModel):
    provider_id: Optional[int]
    accounts: List[str]
    type: DataSourceType = DataSourceType.all

class AdminAccountInfo(BaseModel):
    account_id: str
    region: str

class SourceProvider(BaseModel):

    id: int
    provider_name: Optional[str]
    description: Optional[str]
    status: Optional[int]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class SourceRegion(BaseModel):

    id: int
    region_name: Optional[str]
    region_alias: Optional[str]
    region_cord: Optional[str]
    provider_id: Optional[int]
    description: Optional[str]
    status: Optional[int]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]

class SourceResourceBase(BaseModel):
    resource_name: Optional[str]
    resource_alias: Optional[str]
    description: Optional[str]
    status: Optional[int]
    apply_region_ids: Optional[str]

class SourceResource(SourceResourceBase):
    id: int
    provider_id: Optional[int]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class ProviderResourceFullInfo(BaseModel):
    provider_id: Optional[int]
    provider_name: Optional[str]
    description: Optional[str]
    resources: Optional[list[SourceResourceBase]]


class DataLocationInfo(BaseModel):
    source: Optional[str]
    region: Optional[str]
    account_count: Optional[int]
    coordinate: Optional[str]
    region_alias: Optional[str]
    provider_id: Optional[str]
    provider_name: Optional[str]
