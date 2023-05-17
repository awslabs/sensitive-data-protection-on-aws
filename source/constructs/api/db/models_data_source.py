import datetime

import sqlalchemy as sa
from sqlalchemy.orm import relationship

from db.database import Base


class DataSource(Base):
    __tablename__ = 'source_data_source'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    source_type = sa.Column(sa.String(255))
    status = sa.Column(sa.Integer())
    source_id = sa.Column(sa.Integer())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())

class Account(Base):
    __tablename__ = 'source_account'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    aws_account_id = sa.Column(sa.String(255), info={'searchable': True})
    aws_account_alias = sa.Column(sa.String(255), info={'searchable': True})
    aws_account_email = sa.Column(sa.String(255))
    delegated_aws_account_id = sa.Column(sa.String(64))
    region = sa.Column(sa.String(64))
    organization_unit_id = sa.Column(sa.String(255))
    stack_id = sa.Column(sa.String(255))
    stackset_id = sa.Column(sa.String(255))
    stackset_name = sa.Column(sa.String(255))
    status = sa.Column(sa.Integer())
    stack_status = sa.Column(sa.String(255))
    stack_instance_status = sa.Column(sa.String(128))
    detection_role_name = sa.Column(sa.String(255))
    # TODO fix to str
    detection_role_status = sa.Column(sa.Integer())
    total_s3_bucket = sa.Column(sa.Integer())
    connected_s3_bucket = sa.Column(sa.Integer())
    total_rds_instance = sa.Column(sa.Integer())
    connect_rds_instance = sa.Column(sa.Integer())
    last_updated = sa.Column(sa.DateTime)
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())

class AccountCompare(Base):
    __tablename__ = 'source_account_compare'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    aws_account_id = sa.Column(sa.String(255))
    aws_account_alias = sa.Column(sa.String(255))
    status = sa.Column(sa.Integer())
    detection_role_name = sa.Column(sa.String(255))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())

class DetectionHistory(Base):
    __tablename__ = 'source_detection_history'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    detect_uuid = sa.Column(sa.String(255))
    detection_time = sa.Column(sa.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    account_id = sa.Column(sa.Integer())
    source_type = sa.Column(sa.String(255))
    state = sa.Column(sa.Integer())
    aws_account = sa.Column(sa.String(255))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())

class S3BucketSource(Base):
    __tablename__ = 'source_s3_bucket'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    bucket_name = sa.Column(sa.String(255))
    size = sa.Column(sa.Integer())
    account_id = sa.Column(sa.Integer())
    region = sa.Column(sa.String(255))
    creation_date = sa.Column(sa.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    data_source_id = sa.Column(sa.Integer())
    detection_history_id = sa.Column(sa.Integer(), sa.ForeignKey('source_detection_history.id'))
    aws_account = sa.Column(sa.String(255))
    glue_database = sa.Column(sa.String(255))
    glue_connection = sa.Column(sa.String(255))
    glue_vpc_endpoint = sa.Column(sa.String(255))
    glue_crawler = sa.Column(sa.String(255))
    glue_state = sa.Column(sa.String(255))
    glue_crawler_last_updated = sa.Column(sa.DateTime)
    detection_history = relationship("DetectionHistory")
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())

class RdsInstanceSource(Base):
    __tablename__ = 'source_rds_instance'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    instance_id = sa.Column(sa.String(255))
    instance_class = sa.Column(sa.String(255))
    engine = sa.Column(sa.String(255))
    instance_status = sa.Column(sa.String(255))
    address = sa.Column(sa.String(255))
    port = sa.Column(sa.Integer())
    master_username = sa.Column(sa.String(255))
    created_time = sa.Column(sa.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    account_id = sa.Column(sa.String(255))
    region = sa.Column(sa.String(255))
    data_source_id = sa.Column(sa.Integer())
    detection_history_id = sa.Column(sa.Integer(), sa.ForeignKey('source_detection_history.id'))
    aws_account = sa.Column(sa.String(255))
    glue_database = sa.Column(sa.String(255))
    glue_crawler = sa.Column(sa.String(255))
    glue_connection = sa.Column(sa.String(255))
    glue_vpc_endpoint = sa.Column(sa.String(255))
    glue_crawler_last_updated = sa.Column(sa.DateTime)
    glue_state = sa.Column(sa.String(255))
    detection_history = relationship("DetectionHistory")
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())

class DynamodbTableSource(Base):
    __tablename__ = 'source_dynamodb_table'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    account_id = sa.Column(sa.Integer())
    table_name = sa.Column(sa.String(255))
    region = sa.Column(sa.String(255))
    data_source_id = sa.Column(sa.Integer())
    detection_history_id = sa.Column(sa.Integer(), sa.ForeignKey('source_detection_history.id'))
    aws_account = sa.Column(sa.String(255))
    glue_database = sa.Column(sa.String(255))
    glue_crawler = sa.Column(sa.String(255))
    glue_crawler_last_updated = sa.Column(sa.DateTime)
    detection_history = relationship("DetectionHistory")
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())