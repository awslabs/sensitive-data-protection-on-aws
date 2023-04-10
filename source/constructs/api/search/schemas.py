# from uuid import UUID
# import datetime
# from typing import Optional
# from pydantic import BaseModel
#
#
# class DataSource(BaseModel):
#     id: int
#     source_type: Optional[str]
#     status: Optional[int]
#     source_id: Optional[int]
#
#
# class Account(BaseModel):
#     id: int
#     aws_account_id: Optional[str]
#     aws_account_alias: Optional[str]
#     status: Optional[int]
#     stack_status: Optional[str]
#     detection_role_name: Optional[str]
#     detection_role_status: Optional[int]
#     last_updated: Optional[datetime.datetime]
#
#     class Config:
#         orm_mode = True
#
# class DetectionHistory(BaseModel):
#     id: int
#     detect_uuid: Optional[UUID]
#     detection_time: Optional[datetime.datetime]
#     account_id: Optional[int]
#     source_type: Optional[str]
#     state: Optional[int]
#     aws_account: Optional[str]
#
#
# class S3BucketSource(BaseModel):
#     id: int
#     bucket_name: Optional[str]
#     size: Optional[int]
#     account_id: Optional[int]
#     region: Optional[str]
#     creation_date: Optional[datetime.datetime]
#     data_source_id: Optional[int]
#     detection_history_id: Optional[int]
#     aws_account: Optional[str]
#     glue_database: Optional[str]
#     glue_crawler: Optional[str]
#     glue_crawler_last_updated: Optional[datetime.datetime]
#
#     class Config:
#         orm_mode = True
#
#
# class DynamodbTableSource(BaseModel):
#     id: int
#     account_id: Optional[int]
#     table_name: Optional[str]
#     region: Optional[str]
#     data_source_id: int
#     detection_history_id: Optional[int]
#     aws_account: Optional[str]
#
#     class Config:
#         orm_mode = True
#
#
# class RdsInstanceSource(BaseModel):
#     id: int
#     instance_id: Optional[str]
#     instance_class: Optional[str]
#     engine: Optional[str]
#     address: Optional[str]
#     port: Optional[int]
#     master_username: Optional[str]
#     instance_status: Optional[str]
#     account_id: Optional[int]
#     region: Optional[str]
#     data_source_id: Optional[int]
#     detection_history_id: Optional[int]
#     aws_account: Optional[str]
#     created_time: Optional[datetime.datetime]
#
#     class Config:
#         orm_mode = True
#
#
# class Region(BaseModel):
#     id: Optional[int]
#     region: Optional[str]
#     state: Optional[int]
#
#
# class AccountCompare(BaseModel):
#     id: int
#     aws_account_id: Optional[str]
#     aws_account_alias: Optional[str]
#     status: Optional[int]
#     detection_role_name: Optional[str]
#
#
# class SourceCoverage(BaseModel):
#     s3_connected: Optional[int]
#     s3_total: Optional[int]
#     rds_connected: Optional[int]
#     rds_total: Optional[int]
