import datetime
from typing import Optional
from pydantic import BaseModel


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


class SourceResource(BaseModel):

    id: int
    resource_name: Optional[str]
    resource_alias: Optional[str]
    provider_id: Optional[int]
    apply_region_ids: Optional[str]
    description: Optional[str]
    status: Optional[int]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class SourceAccount(BaseModel):

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
    total_jdbc_instance: Optional[int]
    connected_jdbc_instance: Optional[int]
    last_updated: Optional[datetime.datetime]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class SourceAccountCompare(BaseModel):

    id: int
    aws_account_id: Optional[str]
    aws_account_alias: Optional[str]
    status: Optional[int]
    detection_role_name: Optional[str]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class SourceDataSource(BaseModel):

    id: int
    source_type: Optional[str]
    status: Optional[int]
    source_id: Optional[int]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class SourceDetectionHistory(BaseModel):

    id: int
    detect_uuid: Optional[str]
    detection_time: Optional[datetime.datetime]
    account_id: Optional[int]
    source_type: Optional[str]
    state: Optional[int]
    aws_account: Optional[str]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class SourceDynamodbTable(BaseModel):

    id: int
    account_id: Optional[int]
    table_name: Optional[str]
    region: Optional[str]
    data_source_id: Optional[int]
    detection_history_id: Optional[int]
    aws_account: Optional[str]
    glue_database: Optional[str]
    glue_crawler: Optional[str]
    glue_crawler_last_updated: Optional[datetime.datetime]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class SourceRdsInstance(BaseModel):

    id: int
    instance_id: Optional[str]
    instance_class: Optional[str]
    engine: Optional[str]
    instance_status: Optional[str]
    address: Optional[str]
    port: Optional[int]
    master_username: Optional[str]
    created_time: Optional[datetime.datetime]
    account_id: Optional[str]
    region: Optional[str]
    data_source_id: Optional[int]
    detection_history_id: Optional[int]
    aws_account: Optional[str]
    glue_database: Optional[str]
    glue_connection: Optional[str]
    glue_vpc_endpoint: Optional[str]
    glue_crawler: Optional[str]
    glue_crawler_last_updated: Optional[datetime.datetime]
    glue_state: Optional[str]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class SourceGlueDatabase(BaseModel):

    id: int
    glue_database_name: Optional[str]
    glue_database_description: Optional[str]
    glue_database_location_uri: Optional[str]
    glue_database_create_time: Optional[str]
    glue_database_catalog_id: Optional[str]
    account_id: Optional[str]
    region: Optional[str]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class SourceJdbcInstance(BaseModel):

    id: int
    instance_id: Optional[str]
    description: Optional[str]
    jdbc_connection_url: Optional[str]
    jdbc_enforce_ssl: Optional[str]
    kafka_ssl_enabled: Optional[str]
    master_username: Optional[str]
    skip_custom_jdbc_cert_validation: Optional[str]
    custom_jdbc_cert: Optional[str]
    custom_jdbc_cert_string: Optional[str]
    network_availability_zone: Optional[str]
    network_subnet_id: Optional[str]
    network_sg_id: Optional[str]
    jdbc_driver_class_name: Optional[str]
    jdbc_driver_jar_uri: Optional[str]
    instance_class: Optional[str]
    instance_status: Optional[str]
    account_provider_id: Optional[int]
    account_id: Optional[str]
    region: Optional[str]
    data_source_id: Optional[int]
    detection_history_id: Optional[int]
    glue_database: Optional[str]
    glue_crawler: Optional[str]
    glue_connection: Optional[str]
    glue_vpc_endpoint: Optional[str]
    glue_crawler_last_updated: Optional[datetime.datetime]
    glue_state: Optional[str]
    create_type: Optional[int]
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class SourceS3Bucket(BaseModel):

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
    version: Optional[int]
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]
