import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Index


Base = declarative_base()


class SourceProvider(Base):

    __tablename__ = 'source_provider'

    id = sa.Column(sa.Integer(), primary_key=True)
    provider_name = sa.Column(sa.String(255))
    description = sa.Column(sa.String(255))
    status = sa.Column(sa.Integer(), server_default='1')
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class SourceRegion(Base):

    __tablename__ = 'source_region'

    id = sa.Column(sa.Integer(), primary_key=True)
    region_name = sa.Column(sa.String(255))
    region_alias = sa.Column(sa.String(255))
    region_cord = sa.Column(sa.String(255))
    provider_id = sa.Column(sa.Integer())
    description = sa.Column(sa.String(255))
    status = sa.Column(sa.Integer(), server_default='1')
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class SourceResource(Base):

    __tablename__ = 'source_resource'

    id = sa.Column(sa.Integer(), primary_key=True)
    resource_name = sa.Column(sa.String(255))
    resource_alias = sa.Column(sa.String(255))
    provider_id = sa.Column(sa.Integer())
    apply_region_ids = sa.Column(sa.String(1000), server_default='all')
    description = sa.Column(sa.String(255))
    status = sa.Column(sa.Integer(), server_default='1')
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class SourceAccount(Base):

    __tablename__ = 'source_account'

    id = sa.Column(sa.Integer(), primary_key=True)
    account_id = sa.Column(sa.String(255))
    account_alias = sa.Column(sa.String(255))
    account_email = sa.Column(sa.String(255))
    account_provider_id = sa.Column(sa.Integer())
    delegated_account_id = sa.Column(sa.String(64))
    region = sa.Column(sa.String(64))
    organization_unit_id = sa.Column(sa.String(255))
    stack_id = sa.Column(sa.String(255))
    stackset_id = sa.Column(sa.String(255))
    stackset_name = sa.Column(sa.String(255))
    status = sa.Column(sa.Integer())
    stack_status = sa.Column(sa.String(255))
    stack_instance_status = sa.Column(sa.String(128))
    detection_role_name = sa.Column(sa.String(255))
    detection_role_status = sa.Column(sa.Integer())
    total_s3_bucket = sa.Column(sa.Integer(), server_default='0')
    connected_s3_bucket = sa.Column(sa.Integer(), server_default='0')
    total_rds_instance = sa.Column(sa.Integer(), server_default='0')
    connect_rds_instance = sa.Column(sa.Integer(), server_default='0')
    total_jdbc_instance = sa.Column(sa.Integer(), server_default='0')
    connected_jdbc_instance = sa.Column(sa.Integer(), server_default='0')
    last_updated = sa.Column(sa.DateTime())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class SourceAccountCompare(Base):

    __tablename__ = 'source_account_compare'

    id = sa.Column(sa.Integer(), primary_key=True)
    aws_account_id = sa.Column(sa.String(255))
    aws_account_alias = sa.Column(sa.String(255))
    status = sa.Column(sa.Integer())
    detection_role_name = sa.Column(sa.String(255))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class SourceDataSource(Base):

    __tablename__ = 'source_data_source'

    id = sa.Column(sa.Integer(), primary_key=True)
    source_type = sa.Column(sa.String(255))
    status = sa.Column(sa.Integer())
    source_id = sa.Column(sa.Integer())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class SourceDetectionHistory(Base):

    __tablename__ = 'source_detection_history'

    id = sa.Column(sa.Integer(), primary_key=True)
    detect_uuid = sa.Column(sa.String(255))
    detection_time = sa.Column(sa.DateTime())
    account_id = sa.Column(sa.Integer())
    source_type = sa.Column(sa.String(255))
    state = sa.Column(sa.Integer())
    aws_account = sa.Column(sa.String(255))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class SourceDynamodbTable(Base):

    __tablename__ = 'source_dynamodb_table'

    id = sa.Column(sa.Integer(), primary_key=True)
    account_id = sa.Column(sa.Integer())
    table_name = sa.Column(sa.String(255))
    region = sa.Column(sa.String(255))
    data_source_id = sa.Column(sa.Integer())
    detection_history_id = sa.Column(sa.Integer())
    aws_account = sa.Column(sa.String(255))
    glue_database = sa.Column(sa.String(255))
    glue_crawler = sa.Column(sa.String(255))
    glue_crawler_last_updated = sa.Column(sa.DateTime())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())

    __table_args__ = (
                
    Index('detection_history_id', detection_history_id)
            )



class SourceRdsInstance(Base):

    __tablename__ = 'source_rds_instance'

    id = sa.Column(sa.Integer(), primary_key=True)
    instance_id = sa.Column(sa.String(255))
    instance_class = sa.Column(sa.String(255))
    engine = sa.Column(sa.String(255))
    instance_status = sa.Column(sa.String(255))
    address = sa.Column(sa.String(255))
    port = sa.Column(sa.Integer())
    master_username = sa.Column(sa.String(255))
    created_time = sa.Column(sa.DateTime())
    account_id = sa.Column(sa.String(255))
    region = sa.Column(sa.String(255))
    data_source_id = sa.Column(sa.Integer())
    detection_history_id = sa.Column(sa.Integer())
    aws_account = sa.Column(sa.String(255))
    glue_database = sa.Column(sa.String(255))
    glue_connection = sa.Column(sa.String(255))
    glue_vpc_endpoint = sa.Column(sa.String(255))
    glue_crawler = sa.Column(sa.String(255))
    glue_crawler_last_updated = sa.Column(sa.DateTime())
    glue_state = sa.Column(sa.String(255))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class SourceGlueDatabase(Base):

    __tablename__ = 'source_glue_database'

    id = sa.Column(sa.Integer(), primary_key=True)
    glue_database_name = sa.Column(sa.String(255))
    glue_database_description = sa.Column(sa.String(255))
    glue_database_location_uri = sa.Column(sa.String(255))
    glue_database_create_time = sa.Column(sa.String(255))
    glue_database_catalog_id = sa.Column(sa.String(255))
    account_id = sa.Column(sa.String(255))
    region = sa.Column(sa.String(255))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class SourceJdbcInstance(Base):

    __tablename__ = 'source_jdbc_instance'

    id = sa.Column(sa.Integer(), primary_key=True)
    instance_id = sa.Column(sa.String(255))
    description = sa.Column(sa.String(2056))
    jdbc_connection_url = sa.Column(sa.String(1024))
    jdbc_enforce_ssl = sa.Column(sa.String(16))
    kafka_ssl_enabled = sa.Column(sa.String(16))
    master_username = sa.Column(sa.String(255))
    skip_custom_jdbc_cert_validation = sa.Column(sa.String(16))
    custom_jdbc_cert = sa.Column(sa.String(1024))
    custom_jdbc_cert_string = sa.Column(sa.String(1024))
    network_availability_zone = sa.Column(sa.String(255))
    network_subnet_id = sa.Column(sa.String(255))
    network_sg_id = sa.Column(sa.String(255))
    jdbc_driver_class_name = sa.Column(sa.String(2048))
    jdbc_driver_jar_uri = sa.Column(sa.String(2048))
    instance_class = sa.Column(sa.String(255))
    instance_status = sa.Column(sa.String(255))
    account_provider_id = sa.Column(sa.Integer())
    account_id = sa.Column(sa.String(255))
    region = sa.Column(sa.String(255))
    data_source_id = sa.Column(sa.Integer())
    detection_history_id = sa.Column(sa.Integer())
    glue_database = sa.Column(sa.String(255))
    glue_crawler = sa.Column(sa.String(255))
    glue_connection = sa.Column(sa.String(255))
    glue_vpc_endpoint = sa.Column(sa.String(255))
    glue_crawler_last_updated = sa.Column(sa.DateTime())
    glue_state = sa.Column(sa.String(255))
    create_type = sa.Column(sa.Integer())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())

    __table_args__ = (
                
    Index('detection_history_id', detection_history_id)
            )



class SourceS3Bucket(Base):

    __tablename__ = 'source_s3_bucket'

    id = sa.Column(sa.Integer(), primary_key=True)
    bucket_name = sa.Column(sa.String(255))
    size = sa.Column(sa.Integer())
    account_id = sa.Column(sa.Integer())
    region = sa.Column(sa.String(255))
    creation_date = sa.Column(sa.DateTime())
    data_source_id = sa.Column(sa.Integer())
    detection_history_id = sa.Column(sa.Integer())
    aws_account = sa.Column(sa.String(255))
    glue_database = sa.Column(sa.String(255))
    glue_connection = sa.Column(sa.String(255))
    glue_vpc_endpoint = sa.Column(sa.String(255))
    glue_crawler = sa.Column(sa.String(255))
    glue_crawler_last_updated = sa.Column(sa.DateTime())
    glue_state = sa.Column(sa.String(255))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())

    __table_args__ = (
                
    Index('detection_history_id', detection_history_id)
            )

