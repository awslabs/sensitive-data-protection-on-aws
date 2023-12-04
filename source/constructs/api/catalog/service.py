import logging
import csv
import json
import os
import tempfile
import time
import traceback
from datetime import datetime, timedelta
import tools.mytime as mytime
from time import sleep
from zipfile import ZipFile
import re

import boto3
from openpyxl import Workbook

from common.concurrent_upload2s3 import concurrent_upload
from common.constant import const
from common.enum import (
    DatabaseType,
    CatalogState,
    AthenaQueryState,
    GlueCrawlerState,
    Privacy,
    MessageEnum,
    ConnectionState,
    ExportFileType
)
from common.exception_handler import BizException
from common.query_condition import QueryCondition
from data_source import crud as data_source_crud
from label.crud import (get_labels_by_id_list, get_all_labels)
from template.service import get_identifiers
from . import crud, schemas
from common.reference_parameter import logger, admin_account_id, admin_region, admin_bucket_name, partition
from common.abilities import need_change_account_id

sql_result = "SELECT database_type,account_id,region,s3_bucket,s3_location,rds_instance_id,table_name,column_name,identifiers,sample_data,'','','' FROM job_detection_output_table"
tmp_folder = tempfile.gettempdir()


def get_boto3_client(account_id: str, region: str, service: str):
    sts_connection = boto3.client("sts")
    monitored_account = sts_connection.assume_role(
        RoleArn=f"arn:{partition}:iam::{account_id}:role/{const.SOLUTION_NAME}RoleForAdmin-{region}",
        RoleSessionName="sensitive-data-cross-acc",
    )

    ACCESS_KEY = monitored_account["Credentials"]["AccessKeyId"]
    SECRET_KEY = monitored_account["Credentials"]["SecretAccessKey"]
    SESSION_TOKEN = monitored_account["Credentials"]["SessionToken"]

    client = boto3.client(
        service,
        region_name=region,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        aws_session_token=SESSION_TOKEN,
    )
    return client


def get_database_identifiers_from_tables(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
):
    if database_type not in [member.value for member in DatabaseType.__members__.values()]:
        raise BizException(
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
        )
    table_list = crud.get_catalog_table_level_classification_by_database(
        account_id, region, database_type, database_name
    )
    result_list = []
    identifier_dict = {}

    for table in table_list:
        identifier_list = table.identifiers.split("|")
        for identifier in identifier_list:
            if identifier == "" or identifier == const.NA:
                continue
            if identifier not in identifier_dict:
                identifier_dict[identifier] = {
                    "objects": table.object_count,
                    "size": table.size_key,
                    "table_count": 1,  # Initialize table count
                    "column_count": table.column_count,
                    "row_count": table.row_count,
                    "table_name_list": [table.table_name]
                }
            if identifier in identifier_dict and table.table_name not in identifier_dict[identifier]['table_name_list']:
                identifier_dict[identifier]["objects"] += table.object_count
                identifier_dict[identifier]["size"] += table.size_key
                identifier_dict[identifier]["table_count"] += 1
                identifier_dict[identifier]["column_count"] += table.column_count
                identifier_dict[identifier]["row_count"] += table.row_count
                identifier_dict[identifier]['table_name_list'].append(table.table_name)
    logger.info(identifier_dict.keys())
    template_identifier_resp = get_identifiers(QueryCondition(size=500, conditions=[{"values": list(identifier_dict.keys()), "column": "name", "condition": "and", "operation": "in"}])).all()
    logger.info(template_identifier_resp)
    template_identifier_dict = {}
    for template_identifier in template_identifier_resp:
        template_identifier_dict[template_identifier.name] = template_identifier.props
    logger.info(template_identifier_dict)
    for k in identifier_dict:
        if k == const.NA:
            continue
        k_dict = identifier_dict[k]
        k_dict["identifier"] = k  # put the identifier name in result dict
        k_dict["props"] = template_identifier_dict[k] if template_identifier_dict.get(k) is not None else None
        result_list.append(k_dict)
    logger.info(result_list)
    return result_list


def get_s3_cloudwatch_metric(
        account_id: str,
        region: str,
        database_name: str,
        metric_name: str):
    cloudwatch_client = get_boto3_client(account_id, region, 'cloudwatch')
    response = {}
    if metric_name == const.NUMBER_OF_OBJECTS:
        response = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/S3',
            MetricName='NumberOfObjects',
            Dimensions=[
                {
                    'Name': 'BucketName',
                    'Value': f'{database_name}'
                },
                {
                    'Name': 'StorageType',
                    'Value': 'AllStorageTypes'
                }
            ],
            StartTime=datetime.utcnow() - timedelta(days=2),  # Define your start time
            EndTime=datetime.utcnow(),  # Define your end time
            Period=86400,  # 24 hours in seconds (daily average)
            # Period=600,
            Statistics=['Average'],  # or other statistic type like 'Sum', 'Minimum', 'Maximum', etc.
            # Unit='Bytes'
        )
    elif metric_name == const.BUCKET_SIZE_BYTES:
        response = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/S3',
            MetricName='BucketSizeBytes',
            Dimensions=[
                {
                    'Name': 'BucketName',
                    'Value': f'{database_name}'
                },
                {
                    'Name': 'StorageType',
                    'Value': 'StandardStorage'
                }
            ],
            StartTime=datetime.utcnow() - timedelta(days=2),  # Define your start time
            EndTime=datetime.utcnow(),  # Define your end time
            Period=86400,  # 24 hours in seconds (daily average)
            # Period=600,
            Statistics=['Average'],  # or other statistic type like 'Sum', 'Minimum', 'Maximum', etc.
            Unit='Bytes'
        )
    # 获取最近时间的数据
    if not response or not response.get('Datapoints'):
        return None
    # 根据 Timestamp 对 Datapoints 列表进行排序，取时间最近的那个
    latest_data = max(response['Datapoints'], key=lambda x: x['Timestamp'])
    latest_timestamp = latest_data['Timestamp']
    latest_average = latest_data['Average']
    logger.debug(f"最近时间的 Average 值：{latest_average}")
    logger.debug(f"最近时间的 Timestamp：{latest_timestamp}")
    return latest_average


def sync_s3_result(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
):
    s3_client = get_boto3_client(account_id, region, 's3')
    # # 列出存储桶中的对象
    response = s3_client.list_objects_v2(Bucket=database_name)
    total_objects = response['KeyCount']  # 获取对象总数
    total_size = sum(obj['Size'] for obj in response.get('Contents', []))  # 计算对象总大小
    while response['IsTruncated']:
        response = s3_client.list_objects_v2(Bucket=database_name, ContinuationToken=response['NextContinuationToken'])
        total_objects += response['KeyCount']
        total_size += sum(obj['Size'] for obj in response.get('Contents', []))
        database_size = total_size
        database_object_count = total_objects
    logger.debug(f"Total Objects: {total_objects}")
    logger.debug(f"Total Size: {total_size} bytes")

    # response = s3_client.list_bucket_metrics_configurations(Bucket=database_name, ExpectedBucketOwner=account_id)
    # response = s3_client.get_bucket_metrics_configuration(Bucket=database_name, Id='NumberOfObjects')
    # response = s3_client.list_bucket_inventory_configurations(Bucket=database_name, ExpectedBucketOwner=account_id)
    return database_size, database_object_count


def sync_crawler_result(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
):
    logger.info(f"start params {account_id} {region} {database_type} {database_name}")
    start_time = time.time()
    rds_engine_type = const.NA
    # custom glue type will not use crawler, just syncing the catalog from existing glue tables
    is_custom_glue = database_type == DatabaseType.GLUE.value
    is_unstructured_glue = database_type == DatabaseType.S3_UNSTRUCTURED.value
    if database_type == DatabaseType.RDS.value:
        rds_database = data_source_crud.get_rds_instance_source(
            account_id, region, database_name
        )
        if rds_database is not None:
            rds_engine_type = rds_database.engine

    if database_type.startswith(DatabaseType.JDBC.value):
        from common.abilities import convert_database_type_2_provider
        provider_id = convert_database_type_2_provider(database_type)
        jdbc_database = data_source_crud.get_jdbc_instance_source(
            provider_id, account_id, region, database_name
        )
        if jdbc_database:
            jdbc_engine_type = jdbc_database.jdbc_connection_url.split(':')[1]

    if need_change_account_id(database_type):
        glue_client = get_boto3_client(admin_account_id, admin_region, "glue")
    else:
        glue_client = get_boto3_client(account_id, region, "glue")

    glue_database_name = database_name if is_custom_glue else (
        const.SOLUTION_NAME + "-" + database_type + "-" + database_name
    ).lower()

    if is_custom_glue or is_unstructured_glue:
        crawler_last_run_status = GlueCrawlerState.SUCCEEDED.value
    else:
        glue_crawler_name = (
            const.SOLUTION_NAME + "-" + database_type + "-" + database_name
        )
        crawler_response = glue_client.get_crawler(Name=glue_crawler_name)
        state = crawler_response["Crawler"]["State"]
        while state == 'STOPPING':
            crawler_response = glue_client.get_crawler(Name=glue_crawler_name)
            state = crawler_response["Crawler"]["State"]
            sleep(2)

        crawler_last_run_status = crawler_response["Crawler"]["LastCrawl"]["Status"]
        logger.info(
            """Cralwer status in crawler_response["Crawler"]["LastCrawl"]["Status"] is : """
            + crawler_last_run_status
        )

    database_object_count = 0  # Aggregate from each table
    database_size = 0  # Aggregate from each table
    database_column_count = 0  # Aggregate from each table
    table_count = 0  # Count each table
    need_clean_database = False
    if crawler_last_run_status == GlueCrawlerState.SUCCEEDED.value:
        # Next token is a continuation token, present if the current list segment is not the last.
        next_token = ""
        table_name_list = []
        table_column_dict = {}
        while True:
            tables_response = glue_client.get_tables(
                DatabaseName=glue_database_name, NextToken=next_token
            )
            logger.info(f"The number of tables is {len(tables_response['TableList'])}")
            # logger.info("get glue tables" + str(tables_response))
            delete_glue_table_names = []
            column_create_list = []
            column_update_list = []
            table_create_list = []
            table_update_list = []
            for table in tables_response["TableList"]:
                table_name = table["Name"].strip()
                # If the file is end of .csv or .json, but the content of the file is not csv/json
                # glue can't crawl them correctly
                # So there is no sizeKey in Parameters, we set the default value is 0
                table_size_key = 0
                if "Parameters" in table["StorageDescriptor"] and "sizeKey" in table["StorageDescriptor"]["Parameters"]:
                    table_size_key = int(
                        table["StorageDescriptor"]["Parameters"]["sizeKey"]
                    )
                # TODO save
                serde_info = const.NA
                table_properties = const.NA
                if "SerdeInfo" in table["StorageDescriptor"]:
                    logger.debug(table["StorageDescriptor"]["SerdeInfo"])
                    serde_info = table["StorageDescriptor"]["SerdeInfo"]
                if "TableProperties" in table:
                    logger.debug(table["TableProperties"])
                    table_properties = table["TableProperties"]
                # Delete empty table when Glue crawler not supported the S3 file type
                # s3 can return directly ,but rds cannot
                if database_type == DatabaseType.S3.value and table_size_key == 0:
                    delete_glue_table_names.append(table_name)
                    # client.delete_table(DatabaseName=glue_database_name,
                    #                     Name=table_name)
                    logger.info("Delete empty glue table named " + glue_database_name + "." + table_name)
                    continue
                table_count += 1
                column_list = table["StorageDescriptor"]["Columns"]
                table_location = table["StorageDescriptor"]["Location"]
                # If a table is a specific S3 object, there is no objectCount in Parameters, and the object count is 1
                table_object_count = 1
                if "Parameters" in table["StorageDescriptor"] and "objectCount" in table["StorageDescriptor"]["Parameters"]:
                    table_object_count = int(
                        table["StorageDescriptor"]["Parameters"]["objectCount"]
                    )
                # For a s3 table, the classification is the file type of the table objects, csv/json/...
                table_classification = const.NA
                if "Parameters" in table["StorageDescriptor"] and "classification" in table["StorageDescriptor"]["Parameters"]:
                    table_classification = table["StorageDescriptor"]["Parameters"][
                        "classification"
                    ]
                elif database_type == DatabaseType.RDS.value:
                    table_classification = rds_engine_type
                elif database_type == DatabaseType.GLUE.value:
                    table_classification = rds_engine_type
                elif database_type.startswith(DatabaseType.JDBC.value):
                    table_classification = jdbc_engine_type
                if database_type == DatabaseType.S3_UNSTRUCTURED.value:
                    table_classification = table["StorageDescriptor"]["Parameters"][
                        "originalFileType"
                    ]
                    if not table_classification and table_name and table_name.split('_') and len(table_name.split('_')) > 2:
                        table_classification = table_name.split("_")[-2]
                database_object_count += table_object_count
                database_size += table_size_key
                column_order_num = 0
                logger.debug(f"start to process glue columns: {table_name}")
                original_column_list = crud.get_catalog_column_level_classification_by_table(account_id, region, database_type, database_name, table_name).all()
                original_column_dict = {item.column_name: item for item in original_column_list}
                for column in column_list:
                    column_order_num += 1
                    column_name = column["Name"].strip()
                    column_type = column["Type"].strip()
                    # To avoid too long embedded type like : struct<struct<xxxxxx.....>>
                    # In the testing process we found a type longer than 2048
                    if len(column_type) > 200 and (database_type == DatabaseType.S3.value or database_type == DatabaseType.S3_UNSTRUCTURED.value):
                        column_type = column_type.split("<")[0]
                    # Create column
                    catalog_column_dict = {
                        "account_id": account_id,
                        "region": region,
                        "database_type": database_type,
                        "database_name": database_name,
                        "table_name": table_name,
                        "column_name": column_name,
                        "column_order_num": column_order_num,
                        "column_type": column_type,
                    }
                    # original_column = crud.get_catalog_column_level_classification_by_name(account_id, region,
                    #                                                                        database_type, database_name,
                    #                                                                        table_name, column_name)
                    original_column = original_column_dict[column_name] if column_name in original_column_dict else None
                    if original_column is None:
                        column_create_list.append(catalog_column_dict)
                        # crud.create_catalog_column_level_classification(catalog_column_dict)
                    else:
                        # Keep the latest modify if it is a specfic user
                        catalog_column_dict['modify_by'] = original_column.modify_by
                        catalog_column_dict['modify_time'] = mytime.get_time()
                        catalog_column_dict['id'] = original_column.id
                        column_update_list.append(catalog_column_dict)
                        # crud.update_catalog_column_level_classification_by_id(original_column.id, catalog_column_dict)
                    if table_name in table_column_dict:
                        table_column_dict[table_name].append(column_name)
                    else:
                        table_column_dict[table_name] = [column_name]
                # Create  table
                catalog_table_dict = {
                    "account_id": account_id,
                    "region": region,
                    "database_type": database_type,
                    "database_name": database_name,
                    "table_name": table_name,
                    "object_count": table_object_count,
                    "size_key": table_size_key,
                    "column_count": column_order_num,
                    "storage_location": table_location,
                    "classification": table_classification,
                    "struct_type": False if (database_type == DatabaseType.S3_UNSTRUCTURED.value) else True,
                    "detected_time": datetime.now(),
                    "serde_info": str(serde_info),
                    "table_properties": str(table_properties)
                }
                original_table = crud.get_catalog_table_level_classification_by_name(account_id, region, database_type,
                                                                                     database_name, table_name)
                if original_table is None:
                    table_create_list.append(catalog_table_dict)
                    # crud.create_catalog_table_level_classification(catalog_table_dict)
                else:
                    # Keep the latest modify if it is a specfic user
                    catalog_table_dict['modify_by'] = original_table.modify_by
                    catalog_table_dict['modify_time'] = mytime.get_time()
                    catalog_table_dict['id'] = original_table.id
                    table_update_list.append(catalog_table_dict)
                    # crud.update_catalog_table_level_classification_by_id(original_table.id, catalog_table_dict)
                table_name_list.append(table_name)
                database_column_count += column_order_num
            try:
                logger.info("batch delete glue tables" + json.dumps(delete_glue_table_names))
                glue_client.batch_delete_table(DatabaseName=glue_database_name,
                                          TablesToDelete=delete_glue_table_names)
                logger.info("batch delete glue tables end.") # To be deleted
            except Exception as err:
                logger.exception("batch delete glue tables error" + str(err))
            if logger.isEnabledFor(logging.DEBUG):
                logger.debug("batch create columns" + str(column_create_list))
                logger.debug("batch update columns" + str(column_update_list))
                logger.debug("batch create tables" + str(table_create_list))
                logger.debug("batch update tables" + str(table_update_list))
            logger.info("batch_create_catalog_column_level_classification.") # To be deleted
            crud.batch_create_catalog_column_level_classification(column_create_list)
            logger.info("batch_update_catalog_column_level_classification_by_id.") # To be deleted
            crud.batch_update_catalog_column_level_classification_by_id(column_update_list)
            logger.info("batch_create_catalog_table_level_classification.") # To be deleted
            crud.batch_create_catalog_table_level_classification(table_create_list)
            logger.info("batch_update_catalog_table_level_classification_by_id.") # To be deleted
            crud.batch_update_catalog_table_level_classification_by_id(table_update_list)
            logger.info("batch_update_catalog_table_level_classification_by_id 2.") # To be deleted
            next_token = tables_response.get("NextToken")
            if next_token is None:
                break
        logger.info("get_catalog_table_level_classification_by_database.") # To be deleted
        catalog_table_list = crud.get_catalog_table_level_classification_by_database(account_id, region,
                                                                                     database_type, database_name)
        logger.info("for catalog in catalog_table_list.") # To be deleted
        for catalog in catalog_table_list:
            if catalog.table_name not in table_name_list:
                if logger.isEnabledFor(logging.DEBUG):
                    logger.debug("sync_crawler_result DELETE TABLE AND COLUMN WHEN NOT IN GLUE TABLES！！！" + catalog.table_name)
                logger.info("sync_crawler_result DELETE TABLE AND COLUMN WHEN NOT IN GLUE TABLES！！！" + catalog.table_name) # To be deleted
                crud.delete_catalog_table_level_classification(catalog.id)
                crud.delete_catalog_column_level_classification_by_table_name(account_id, region, database_type, database_name, catalog.table_name, None)
            if catalog.table_name in table_column_dict:
                column_list = table_column_dict[catalog.table_name]
                if logger.isEnabledFor(logging.DEBUG):
                    logger.debug(
                        "sync_crawler_result DELETE COLUMN WHEN NOT IN GLUE TABLES" + catalog.table_name + json.dumps(
                            table_column_dict[catalog.table_name]))
                logger.info(
                    "sync_crawler_result DELETE COLUMN WHEN NOT IN GLUE TABLES" + catalog.table_name + json.dumps(
                        table_column_dict[catalog.table_name])) # To be deleted
                crud.delete_catalog_column_level_classification_by_table_name(account_id, region, database_type,
                                                                              database_name, catalog.table_name,
                                                                              column_list)
        logger.info("end for catalog in catalog_table_list.") # To be deleted
    if table_count == 0:
        logger.info("table_count.")  # To be deleted
        if database_type == DatabaseType.RDS.value:
            data_source_crud.set_rds_instance_source_glue_state(account_id, region, database_name,
                                                                ConnectionState.UNSUPPORTED.value)
        elif database_type == DatabaseType.S3.value:
            data_source_crud.set_s3_bucket_source_glue_state(account_id, region, database_name,
                                                             ConnectionState.UNSUPPORTED.value)
        elif database_type.startswith(DatabaseType.JDBC.value):
            data_source_crud.set_jdbc_connection_glue_state(provider_id, account_id, region, database_name,
                                                            ConnectionState.UNSUPPORTED.value)
        elif database_type == DatabaseType.GLUE.value:
            data_source_crud.set_glue_database_glue_state(account_id, region, database_name,
                                                          ConnectionState.UNSUPPORTED.value)
        original_database = crud.get_catalog_database_level_classification_by_name(account_id, region,
                                                                                   database_type,
                                                                                   database_name)
        if original_database is not None:
            logger.info("sync_crawler_result table_count is 0 and delete exist catalog")
            crud.delete_catalog_database_level_classification(original_database.id)

    # create database
    origin_size_key = 0
    origin_obj_count = 0
    access_type = None
    if table_count > 0:
        if database_type == DatabaseType.S3.value:
            storage_location = "s3://" + database_name + "/"
            origin_size_key = get_s3_cloudwatch_metric(account_id, region, database_name, const.NUMBER_OF_OBJECTS)
            origin_obj_count = get_s3_cloudwatch_metric(account_id, region, database_name, const.BUCKET_SIZE_BYTES)
            s3_client = get_boto3_client(account_id, region, DatabaseType.S3.value)
            response = s3_client.get_bucket_acl(Bucket=database_name)
            if __get_s3_public_access(response) == const.YES:
                access_type = const.PUBLIC
            else:
                access_type = const.PRIVATE
        elif database_type == DatabaseType.RDS.value:
            storage_location = rds_engine_type
        elif database_type.startswith(DatabaseType.JDBC.value):
            storage_location = rds_engine_type
        elif database_type == DatabaseType.GLUE.value:
            storage_location = const.NA
        catalog_database_dict = {
            "account_id": account_id,
            "region": region,
            "database_type": database_type,
            "database_name": database_name,
            "object_count": database_object_count,
            # not error ， logic change when 1.1.0
            "size_key": database_size,
            "table_count": table_count,
            "column_count": database_column_count,
            "access_type": access_type,
            # "row_count": database_row_count,
            # Store location for s3 and engine type for rds
            # new column record old size and count
            "origin_size_key": origin_size_key,
            "origin_obj_count": origin_obj_count,
            "storage_location": storage_location
            if database_type == DatabaseType.S3.value
            else rds_engine_type,
        }
        logger.info("get_catalog_database_level_classification_by_name.")  # To be deleted
        original_database = crud.get_catalog_database_level_classification_by_name(account_id, region, database_type,
                                                                                   database_name)
        if original_database == None:
            crud.create_catalog_database_level_classification(catalog_database_dict)
        else:
            catalog_database_dict['modify_by'] = original_database.modify_by
            crud.update_catalog_database_level_classification_by_id(original_database.id, catalog_database_dict)

    logger.info(
        "Sync crawler result sucessfully, 1 database/"
        + str(table_count)
        + " tables affected."
    )
    execution_time = time.time() - start_time
    logger.info(f"代码执行时间：{execution_time:.6f}秒")
    return table_count == 0


def __get_s3_bucket_key_from_location(s3_location: str):
    bucket_name, key = s3_location[5:].split("/", 1)
    return bucket_name, key


def list_s3_sample_objects(account_id: str, region: str, s3_location: str, limit: int):
    s3_client = get_boto3_client(account_id, region, "s3")
    bucket_name, key = __get_s3_bucket_key_from_location(s3_location)
    obj_list = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=key)["Contents"]

    result_list = []
    current_s3_location = ""
    for obj in obj_list:
        if len(result_list) == limit:
            break
        object_key = obj["Key"]
        object_size = obj["Size"]
        full_path = "s3://" + bucket_name + "/" + object_key
        # A prefix is a object with size 0, so we skip them.
        if object_size > 0 and len(result_list) < limit:
            obj_dict = {
                "s3_full_path": full_path,
                "file_size": object_size,
                "file_type": object_key.split(".")[-1].upper(),
            }
            result_list.append(obj_dict)
        if object_key == 0:
            current_s3_location = full_path

    if len(result_list) < limit and current_s3_location != "":
        result_list.append(
            list_s3_sample_objects(
                account_id, region, current_s3_location, limit - len(result_list)
            )
        )

    return result_list


def list_unstructured_sample_objects(table_id: str):
    table_catalog = crud.get_catalog_table_level_classification_by_id(table_id)
    result_list = []
    if table_catalog:
        s3_client = get_boto3_client(table_catalog.account_id, table_catalog.region, "s3")
        column_catalogs = crud.get_catalog_column_level_classification_by_table(table_catalog.account_id, table_catalog.region, table_catalog.database_type, table_catalog.database_name, table_catalog.table_name)
        for column_catalog in column_catalogs:
            if not column_catalog.column_value_example or 'N/A' == column_catalog.column_value_example:
                continue
            file_size = 0
            if column_catalog.column_path:
                bucket_name, key = __get_s3_bucket_key_from_location(column_catalog.column_path)
                response = s3_client.get_object(Bucket=bucket_name, Key=key)
                file_size = response['ContentLength']
            obj_dict = {
                "id": column_catalog.id,
                "example_data": column_catalog.column_value_example,
                "privacy": column_catalog.privacy,
                "identifier": column_catalog.identifier,
                "s3_full_path": column_catalog.column_path,
                "file_size": file_size,
                "file_type": column_catalog.column_path.split(".")[-1].upper() if column_catalog.column_path else '',
            }
            result_list.append(obj_dict)
    return result_list


def get_rds_table_sample_records(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
        table_name: str,
):
    # order by column_order_num asc
    column_list = crud.get_catalog_column_level_classification_by_table(
        account_id, region, database_type, database_name, table_name
    )
    if column_list is None:
        raise BizException(
            MessageEnum.CATALOG_RDS_TABLE_HAS_NO_COLUMNS.get_code(),
            MessageEnum.CATALOG_RDS_TABLE_HAS_NO_COLUMNS.get_msg(),
        )

    result_list = []
    i = 0
    for col in column_list:
        sample_values = col.column_value_example
        value_list = sample_values.split("|")
        # To avoid sample value not enough to CATALOG_SAMPLE_ITEM_COUNT
        if len(value_list) < const.CATALOG_SAMPLE_ITEM_COUNT:
            for n in range(len(value_list), const.CATALOG_SAMPLE_ITEM_COUNT):
                value_list.append("")
        if i == 0:
            result_list.append([col.column_name])
            for value in value_list:
                result_list.append([value])
        else:
            result_list[0].append(col.column_name)
            for value in value_list:
                result_list[i].append(value)
                i += 1
        i = 1  # set to column value first index
    return result_list


def __remove_query_result_from_s3(query_id):
    response = boto3.client("s3").delete_object(
        Bucket=admin_bucket_name, Key="athena-output/" + query_id + ".csv"
    )

    response_meta = boto3.client("s3").delete_object(
        Bucket=admin_bucket_name,
        Key="athena-output/" + query_id + ".csv.metadata",
    )
    return True


def __query_job_result_by_athena(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
        run_id: str,
):
    client = boto3.client("athena")
    # Select result
    select_sql = (
            (
                """SELECT table_name,column_name,cast(identifiers as json) as identifiers_str,CASE WHEN sample_data is NULL then '' else array_join(sample_data, \'|\') end as sample_str, privacy, table_size, s3_location 
            FROM %s 
            WHERE account_id='%s'
                AND region='%s' 
                AND database_type='%s' 
                AND database_name='%s' 
                AND run_id='%s' """
            )
            % (const.JOB_RESULT_TABLE_NAME, account_id, region, database_type, database_name, run_id)
    )
    logger.debug("Athena SELECT SQL : " + select_sql)

    queryStart = client.start_query_execution(
        QueryString=select_sql,
        QueryExecutionContext={
            "Database": const.JOB_RESULT_DATABASE_NAME,
            "Catalog": "AwsDataCatalog",
        },
        ResultConfiguration={"OutputLocation": f"s3://{admin_bucket_name}/athena-output/"},
    )
    query_id = queryStart["QueryExecutionId"]
    while True:
        response = client.get_query_execution(QueryExecutionId=query_id)

        query_execution_status = response["QueryExecution"]["Status"]["State"]

        if query_execution_status == AthenaQueryState.SUCCEEDED.value:
            # logger.info("__query_job_result_by_athena : " + str(response))
            break

        if query_execution_status == AthenaQueryState.FAILED.value:
            raise Exception("Query Asset STATUS:" + response["QueryExecution"]["Status"]["StateChangeReason"])

        else:
            time.sleep(1)
    athena_result_list = []
    next_token = ''
    while True:
        if next_token:
            result = client.get_query_results(QueryExecutionId=query_id, NextToken=next_token)
        else:
            result = client.get_query_results(QueryExecutionId=query_id)
        athena_result_list.append(result)
        # logger.info(result)
        if "NextToken" in result and result['NextToken']:
            next_token = result['NextToken']
        else:
            break

    # result = client.get_query_results(QueryExecutionId=query_id, NextToken='')
    # Remove Athena query result to save cost.
    logger.debug(athena_result_list)
    __remove_query_result_from_s3(query_id)

    return athena_result_list


def __get_athena_column_value(value_dict: dict, type: str):
    if "VarCharValue" in value_dict:
        return value_dict["VarCharValue"]
    else:
        # type support str or int
        if type == "str":
            return const.NA
        else:
            return Privacy.NA.value


# identifiers format example: [["ENGLISH-NAME",0.21127309951376408]]
def __convert_identifiers_to_dict(identifiers: str):
    result_dict = {}
    if identifiers is None or identifiers == const.NA:
        result_dict[const.NA] = 0
        return result_dict
    json_list = json.loads(identifiers)
    for i in json_list:
        if isinstance(i, dict) and "identifier" in i and "score" in i:
            result_dict[i["identifier"]] = i["score"]
        elif len(i) == 2:
            result_dict[i[0]] = i[1]
    return result_dict


def sync_job_detection_result(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
        job_run_id: str,
        overwrite=True
):
    logger.info("start time")
    job_result_list = __query_job_result_by_athena(
        account_id,
        region,
        database_type,
        database_name,
        job_run_id,
    )
    if database_type == DatabaseType.S3.value:
        job_result_list += __query_job_result_by_athena(
            account_id,
            region,
            DatabaseType.S3_UNSTRUCTURED.value,
            database_name,
            job_run_id,
        )
    logger.info("athena time")
    table_privacy_dict = {}
    table_identifier_dict = {}
    table_size_dict = {}
    row_count = 0
    table_column_dict = {}
    m = 0
    column_dict_list = []
    # query column by database
    database_catalog_columns_dict = crud.get_catalog_column_level_classification_by_database(account_id, region,
                                                                                             database_type,
                                                                                             database_name)
    if database_type == DatabaseType.S3.value:
        database_catalog_columns_dict_unstructured = crud.get_catalog_column_level_classification_by_database(account_id, region,
                                                                 DatabaseType.S3_UNSTRUCTURED.value,
                                                                 database_name)
        database_catalog_columns_dict.update(database_catalog_columns_dict_unstructured)

    logger.info("column db time")
    logger.info(len(database_catalog_columns_dict))
    logger.debug(database_catalog_columns_dict)
    for job_result in job_result_list:
        if "ResultSet" in job_result and "Rows" in job_result["ResultSet"]:
            i = 0
            for row in job_result["ResultSet"]["Rows"]:
                if "Data" in row and i > 0:
                    table_name = __get_athena_column_value(row["Data"][0], "str")
                    column_name = __get_athena_column_value(row["Data"][1], "str")
                    identifier = __get_athena_column_value(row["Data"][2], "str")
                    column_sample_data = __get_athena_column_value(row["Data"][3], "str")
                    privacy = int(__get_athena_column_value(row["Data"][4], "int"))
                    table_size = int(__get_athena_column_value(row["Data"][5], "int"))
                    column_path = __get_athena_column_value(row["Data"][6], "str")
                    table_size_dict[table_name] = table_size
                    if table_name in table_column_dict:
                        table_column_dict[table_name].append(column_name)
                    else:
                        table_column_dict[table_name] = [column_name]
                    column_privacy = privacy
                    key_name = f'{table_name}_{column_name}'
                    if key_name not in database_catalog_columns_dict:
                        continue
                    catalog_column = database_catalog_columns_dict[key_name]
                    identifier_dict = __convert_identifiers_to_dict(identifier)
                    if catalog_column is not None and (overwrite or (
                            not overwrite and catalog_column.manual_tag != const.MANUAL)):
                        column_dict = {
                            "id": catalog_column.id,
                            "identifier": json.dumps(identifier_dict),
                            "column_value_example": column_sample_data,
                            "column_path": column_path,
                            "privacy": column_privacy,
                            "state": CatalogState.DETECTED.value,
                            "manual_tag": const.SYSTEM,
                        }
                        column_dict_list.append(column_dict)
                    # Initialize table privacy with NON-PII
                    if table_name not in table_privacy_dict:
                        table_privacy_dict[table_name] = Privacy.NON_PII.value
                    if column_privacy == Privacy.PII.value:
                        table_privacy_dict[table_name] = column_privacy

                    # A table maybe has more than one identifier from columns, so we use Set here.
                    if table_name not in table_identifier_dict:
                        table_identifier_dict[table_name] = set()
                    for key in identifier_dict:
                        table_identifier_dict[table_name].add(key)
                i += 1
                m += 1
    logger.info("column opt time")
    crud.batch_update_catalog_column_level_classification_by_id(column_dict_list)
    logger.info("column update time")
    logger.info(len(column_dict_list))
    if m <= 1:
        logger.info("sync_job_detection_result none data update because of m <= 1 and m is:" + str(m) + database_name)
        return True
    logger.info("sync_job_detection_result affected row count is :" + str(m) + database_name)
    if not table_size_dict:
        logger.info(
            "sync_job_detection_result - RESET NA TABLE AND COLUMNS WHEN TABLE_SIZE IS ZERO ")
    # Initialize database privacy with NON-PII
    database_privacy = Privacy.NON_PII.value
    # The two dict has all tables as key.
    table_dict_list = []
    database_catalog_table_dict = crud.get_catalog_table_level_classification_by_database_all(account_id, region,
                                                                                              database_type,
                                                                                              database_name)
    if database_type == DatabaseType.S3.value:
        database_catalog_table_dict_unstructured = crud.get_catalog_table_level_classification_by_database_all(
            account_id, region,
            DatabaseType.S3_UNSTRUCTURED.value,
            database_name)
        database_catalog_table_dict.update(database_catalog_table_dict_unstructured)
    logger.info("table db time")
    logger.debug(database_catalog_table_dict)
    for table_name in table_size_dict:
        table_size = table_size_dict[table_name]
        if table_size <= 0:
            logger.info(
                "sync_job_detection_result - RESET TABLE AND COLUMNS WHEN TABLE_SIZE IS ZERO : !")
            continue
        row_count += table_size
        catalog_table = None
        if table_name in database_catalog_table_dict:
            catalog_table = database_catalog_table_dict[table_name]
        logger.debug(
            "sync_job_detection_result - RESET ADDITIONAL COLUMNS : " + json.dumps(table_column_dict[table_name]))
        if table_name not in table_privacy_dict:
            if catalog_table is not None:
                table_dict = {
                    "id": catalog_table.id,
                    "row_count": table_size,
                }
                table_dict_list.append(table_dict)
            continue
        else:
            privacy = table_privacy_dict[table_name]
            # If a table contains PII, the database contains PII too.
            if privacy == Privacy.PII.value:
                database_privacy = privacy

            # A table identifiers come from all columns distinct identifer values
            identifier_set = table_identifier_dict[table_name]
            identifiers = "|".join(list(map(str, identifier_set)))
            if catalog_table is not None and (overwrite or (
                        not overwrite and catalog_table.manual_tag != const.MANUAL)):
                table_dict = {
                    "id": catalog_table.id,
                    "privacy": privacy,
                    "identifiers": identifiers,
                    "state": CatalogState.DETECTED.value,
                    "row_count": table_size,
                    "manual_tag": const.SYSTEM,
                }
                table_dict_list.append(table_dict)
    logger.info("table opt time")
    crud.batch_update_catalog_table_level_classification_by_id(table_dict_list)
    logger.info(len(table_dict_list))
    logger.info("table update time")
    catalog_database = crud.get_catalog_database_level_classification_by_name(
        account_id, region, database_type, database_name
    )

    if catalog_database is not None and (overwrite or (
                        not overwrite and catalog_database.manual_tag != const.MANUAL)):
        database_dict = {
            "privacy": database_privacy,
            "state": CatalogState.DETECTED.value,
            "row_count": row_count,
            "manual_tag": const.SYSTEM,
        }
        crud.update_catalog_database_level_classification_by_id(
            catalog_database.id, database_dict
        )
    if database_type == DatabaseType.S3.value:
        catalog_database_unstructured = crud.get_catalog_database_level_classification_by_name(account_id, region,
                                                                                               DatabaseType.S3_UNSTRUCTURED.value,
                                                                                               database_name)
        if catalog_database_unstructured is not None and (overwrite or (
                not overwrite and catalog_database_unstructured.manual_tag != const.MANUAL)):
            database_dict = {
                "privacy": database_privacy,
                "state": CatalogState.DETECTED.value,
                "row_count": row_count,
                "manual_tag": const.SYSTEM,
            }
            crud.update_catalog_database_level_classification_by_id(
                catalog_database_unstructured.id, database_dict
            )
    logger.info("Sync detection result sucessfully!")
    logger.info("end time")
    return True


def __get_s3_public_access(response: dict):
    try:
        for grant in d["Grants"]:
            if (
                    "URI" in grant["Grantee"]
                    and grant["Grantee"]["URI"].endswith("AllUsers")
                    and grant["Permission"] in ["READ", "FULL_CONTROL"]
            ):
                return "Yes"
        return "No"
    except Exception:
        # Cannot determine if s3 object is public.
        return "No"


def __get_s3_tagging(database_name, client):
    try:
        response = client.get_bucket_tagging(Bucket=database_name)
        return str(response['TagSet'])
    except Exception:
        # Have no tag.
        return const.NA


def get_database_prorpery(account_id: str,
                          region: str,
                          database_type: str,
                          database_name: str):
    result_list = []
    try:
        if database_type == DatabaseType.S3.value or database_type == DatabaseType.S3_UNSTRUCTURED.value:
            client = get_boto3_client(account_id, region, DatabaseType.S3.value)
            response = client.get_bucket_location(Bucket=database_name)
            result_list.append(["Region", response["LocationConstraint"]])
            response = client.get_bucket_acl(Bucket=database_name)
            result_list.append(["PublicAccess", __get_s3_public_access(response)])
            response = client.list_buckets()
            for b in response["Buckets"]:
                if b["Name"] == database_name:
                    result_list.append(["CreationDate", b["CreationDate"]])
            result_list.append(["Tags", __get_s3_tagging(database_name, client)])
        elif database_type == DatabaseType.RDS.value:
            client = get_boto3_client(account_id, region, DatabaseType.RDS.value)
            response = client.describe_db_instances(DBInstanceIdentifier=database_name)
            if "DBInstances" in response and len(response["DBInstances"]) > 0:
                instance_info = response["DBInstances"][0]
                result_list.append(["Engine", instance_info["Engine"]])
                result_list.append(["DBInstanceStatus", instance_info["DBInstanceStatus"]])
                result_list.append(["DBInstanceArn", instance_info["DBInstanceArn"]])
                result_list.append(["Endpoint", instance_info["Endpoint"]["Address"]])
                result_list.append(["Endpoint", instance_info["Endpoint"]["Port"]])
                result_list.append(["InstanceCreateTime", instance_info["InstanceCreateTime"]])
                result_list.append(["DBSubnetGroup", instance_info["DBSubnetGroup"]["DBSubnetGroupName"]])
                result_list.append(["Subnets", json.dumps(instance_info["DBSubnetGroup"]["Subnets"])])
                result_list.append(["VpcId", instance_info["DBSubnetGroup"]["VpcId"]])
                result_list.append(["PubliclyAccessible", "Yes" if instance_info["PubliclyAccessible"] else "No"])
        elif database_type == DatabaseType.GLUE.value:
            glue_client = get_boto3_client(account_id, region, DatabaseType.GLUE.value)
            # 获取数据库属性
            response = glue_client.get_database(Name=database_name)
            database = response.get('Database', {})
            database_properties = database.get('Parameters', {})
            logger.info("Database Properties:")
            logger.info(database_properties)
            result_list.append(["Name", database_name])
            result_list.append(["Description", None])
            result_list.append(["Location", None])
            result_list.append(["Created on (UTC)", response['Database']['CreateTime']])
        elif database_type.startswith(DatabaseType.JDBC.value):
            result_list.append(["Name", database_name])
            # raise BizException(
            #     MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            #     MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
            # )
        else:
            result_list.append(["Name", database_name])
            # raise BizException(
            #     MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            #     MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
            # )
    except Exception as e:
        logger.error(''.join(traceback.TracebackException.from_exception(e).format()))
        raise BizException(
            MessageEnum.CATALOG_DATABASE_PROPERTY_GET_FAILED.get_code(),
            MessageEnum.CATALOG_DATABASE_PROPERTY_GET_FAILED.get_msg(),
        )
    return result_list


def get_table_property(table_id: str):
    catalog_table = crud.get_catalog_table_level_classification_by_id(table_id)
    if not catalog_table:
        return {}
    result_list = []
    try:
        result_list.append(["Account", catalog_table.account_id])
        result_list.append(["Region", catalog_table.region])
        labels_str = ""
        if catalog_table.label_ids:
            labels = get_labels_by_id_list(catalog_table.label_ids)
            if labels is not None:
                labels_str = [{"id": label.id, "label_name": label.label_name} for label in labels]
        result_list.append(["ResourceTags", labels_str])
        result_list.append(["TableProperties", catalog_table.table_properties])
        result_list.append(["LastUpdated", catalog_table.detected_time])
        glue_database_name = catalog_table.database_name if catalog_table.database_type == DatabaseType.GLUE.value \
            else (const.SOLUTION_NAME + "-" + catalog_table.database_type + "-" + catalog_table.database_name)
        result_list.append(["GlueDatabase", glue_database_name])
        result_list.append(["GlueTable", catalog_table.table_name])
        result_list.append(["Location", catalog_table.storage_location])
        result_list.append(["SerdeParameters", catalog_table.serde_info])

        if catalog_table.database_type == DatabaseType.S3.value:
            result_list.append(["Objects", catalog_table.object_count])
            result_list.append(["Size", catalog_table.size_key])
            result_list.append(["Rows", catalog_table.row_count])
            result_list.append(["S3Location", catalog_table.storage_location])
            client = get_boto3_client(catalog_table.account_id, catalog_table.region, DatabaseType.S3.value)
            result_list.append(["Tags", __get_s3_tagging(catalog_table.database_name, client)])
        elif catalog_table.database_type == DatabaseType.RDS.value:
            client = get_boto3_client(catalog_table.account_id, catalog_table.region, DatabaseType.RDS.value)
            response = client.describe_db_instances(DBInstanceIdentifier=catalog_table.database_name)
            if "DBInstances" in response and len(response["DBInstances"]) > 0:
                instance_info = response["DBInstances"][0]
                logger.info(instance_info)
                result_list.append(["InstanceName", instance_info["DBInstanceIdentifier"]])
                result_list.append(["Engine", instance_info["Engine"]])
        else:
            logger.info(f"other database type{catalog_table.database_type}")
            # raise BizException(
            #     MessageEnum.CATALOG_TABLE_TYPE_ERR.get_code(),
            #     MessageEnum.CATALOG_TABLE_TYPE_ERR.get_msg(),
            # )
    except Exception as e:
        logger.error(''.join(traceback.TracebackException.from_exception(e).format()))
        raise BizException(
            MessageEnum.CATALOG_TABLE_PROPERTY_GET_FAILED.get_code(),
            MessageEnum.CATALOG_TABLE_PROPERTY_GET_FAILED.get_msg(),
        )
    return result_list


def update_catalog_column_level_classification(new_column: schemas.CatalogColumnLevelClassification):
    original_column = crud.get_catalog_column_level_classification_by_name(new_column.account_id,
                                                                           new_column.region,
                                                                           new_column.database_type,
                                                                           new_column.database_name,
                                                                           new_column.table_name,
                                                                           new_column.column_name
                                                                           )
    if original_column is None:
        raise BizException(
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
        )
    original_column_identifier = original_column.identifier
    original_column_privacy = original_column.privacy
    crud.update_catalog_column_level_classification(new_column)

    if original_column_identifier != new_column.identifier and new_column.identifier != '{"N/A": 0}':
        column_rows = crud.get_catalog_column_level_classification_by_table(new_column.account_id,
                                                                            new_column.region,
                                                                            new_column.database_type,
                                                                            new_column.database_name,
                                                                            new_column.table_name)

        table = crud.get_catalog_table_level_classification_by_name(new_column.account_id,
                                                                    new_column.region,
                                                                    new_column.database_type,
                                                                    new_column.database_name,
                                                                    new_column.table_name
                                                                    )
        # Reset table identifiers
        table_identifiers = ""
        for column in column_rows:
            if column.identifier.startswith("{"):
                identifier_dict = json.loads(column.identifier)
                for key in identifier_dict.keys():
                    if key != const.NA and key not in table_identifiers:
                        table_identifiers = (table_identifiers + "|" + key)
            else:
                if column.identifier != const.NA and column.identifier not in table_identifiers:
                    table_identifiers = (table_identifiers + "|" + column.identifier)
        table.identifiers = table_identifiers
        crud.update_catalog_table_level_classification_by_id(table.id, {"identifiers": table_identifiers})

    # update privacy to table and database level
    if original_column_privacy != new_column.privacy:
        update_catalog_table_and_database_level_privacy(new_column.account_id,
                                                        new_column.region,
                                                        new_column.database_type,
                                                        new_column.database_name,
                                                        new_column.table_name)

    return "Update catalog column successfully!"


def delete_catalog_by_account_region(account_id: str, region: str):
    try:
        crud.delete_catalog_database_level_classification_by_account_region(account_id, region)
    except Exception:
        raise BizException(
            MessageEnum.CATALOG_DATABASE_DELETE_FAILED.get_code(),
            MessageEnum.CATALOG_DATABASE_DELETE_FAILED.get_msg(),
        )
    try:
        crud.delete_catalog_table_level_classification_by_account_region(account_id, region)
    except Exception:
        raise BizException(
            MessageEnum.CATALOG_TABLE_DELETE_FAILED.get_code(),
            MessageEnum.CATALOG_TABLE_DELETE_FAILED.get_msg(),
        )
    try:
        crud.delete_catalog_column_level_classification_by_account_region(account_id, region)
    except Exception:
        raise BizException(
            MessageEnum.CATALOG_COLUMN_DELETE_FAILED.get_code(),
            MessageEnum.CATALOG_COLUMN_DELETE_FAILED.get_msg(),
        )
    return True


def delete_catalog_by_database_region(database: str, region: str, type: str):
    try:
        crud.delete_catalog_database_level_classification_by_database_region(database, region, type)
    except Exception:
        raise BizException(
            MessageEnum.CATALOG_DATABASE_DELETE_FAILED.get_code(),
            MessageEnum.CATALOG_DATABASE_DELETE_FAILED.get_msg(),
        )
    try:
        crud.delete_catalog_table_level_classification_by_database_region(database, region, type)
    except Exception:
        raise BizException(
            MessageEnum.CATALOG_TABLE_DELETE_FAILED.get_code(),
            MessageEnum.CATALOG_TABLE_DELETE_FAILED.get_msg(),
        )
    try:
        crud.delete_catalog_column_level_classification_by_database_region(database, region, type)
    except Exception:
        raise BizException(
            MessageEnum.CATALOG_COLUMN_DELETE_FAILED.get_code(),
            MessageEnum.CATALOG_COLUMN_DELETE_FAILED.get_msg(),
        )
    return True


def update_catalog_table_and_database_level_privacy(account_id, region, database_type, database_name, table_name):

    column_rows = crud.get_catalog_column_level_classification_by_table(account_id,
                                                                        region,
                                                                        database_type,
                                                                        database_name,
                                                                        table_name)

    table = crud.get_catalog_table_level_classification_by_name(account_id,
                                                                region,
                                                                database_type,
                                                                database_name,
                                                                table_name)

    table_rows = crud.get_catalog_table_level_classification_by_database(account_id,
                                                                         region,
                                                                         database_type,
                                                                         database_name)

    # Reset table privacy
    origin_table_privacy = table.privacy
    default_table_privacy = Privacy.NA.value
    for column in column_rows:
        column_privacy = column.privacy
        if column_privacy > default_table_privacy:
            default_table_privacy = column_privacy
    if origin_table_privacy != default_table_privacy:
        table.privacy = default_table_privacy
        crud.update_catalog_table_level_classification_by_id(table.id, {"privacy": default_table_privacy})

    logger.info("need to overwrite the privacy!!!")
    # Reset database privacy
    database = crud.get_catalog_database_level_classification_by_name(account_id,
                                                                      region,
                                                                      database_type,
                                                                      database_name)
    if database is not None:
        origin_database_privacy = database.privacy
        default_database_privacy = Privacy.NA.value
        for table in table_rows:
            table_privacy = table.privacy
            if table_privacy > default_database_privacy:
                default_database_privacy = table_privacy
        if origin_database_privacy != default_database_privacy:
            database.privacy = default_database_privacy
            crud.update_catalog_database_level_classification_by_id(database.id,
                                                                    {"privacy": default_database_privacy})


def replace_special_chars_with_hyphen(input_string):
    return re.sub(r'[^\w]+', '_', input_string)


def get_s3_unstructured_table_alias_name(bucket_name, table_name):
    prefix_str = f'{bucket_name}_{replace_special_chars_with_hyphen(bucket_name)}_'
    table_name_without_tail = '_'.join(table_name.split("_")[:-2]) if len(table_name.split("_")) >= 3 else table_name
    new_name = table_name_without_tail.removeprefix(prefix_str)
    return new_name


def fill_catalog_labels(catalogs):
    for catalog in catalogs:
        catalog.labels = []
        if catalog is None:
            continue
        if catalog.database_type == DatabaseType.S3_UNSTRUCTURED.value:
            catalog.table_name = get_s3_unstructured_table_alias_name(catalog.database_name, catalog.table_name)
        if catalog.label_ids is None or len(catalog.label_ids) <= 0:
            continue
        label_list = catalog.label_ids.split(',')
        label_id_list = list(map(int, label_list))
        labels = get_labels_by_id_list(label_id_list)
        if labels is None:
            continue
        labels_str = [{"id": label.id, "label_name": label.label_name} for label in labels]
        catalog.labels = labels_str
    return catalogs


def rebuild_catalog_labels(catalogs):
    result = []
    if not catalogs:
        return result
    for catalogDic in catalogs:
        catalog = catalogDic.CatalogDatabaseLevelClassification
        if not catalog:
            continue
        catalog.labels = []
        if catalog.database_type == DatabaseType.S3_UNSTRUCTURED.value:
            catalog.table_name = catalog.storage_location
        if catalog is not None and catalog.label_ids is not None and len(catalog.label_ids) > 0:
            label_list = catalog.label_ids.split(',')
            label_id_list = list(map(int, label_list))
            labels = get_labels_by_id_list(label_id_list)
            if labels is not None:
                labels_str = [{"id": label.id, "label_name": label.label_name} for label in labels]
                catalog.labels = labels_str
        catalog.object_count = catalogDic.object_count_sum
        catalog.size_key = catalogDic.size_key_sum
        result.append(catalog)
    return result


def get_s3_folder_sample_data(account_id: str, region: str, bucket_name: str, resource_name: str, refresh: bool):
    from .sample_service import init_s3_sample_job
    response = init_s3_sample_job(account_id, region, bucket_name, resource_name, refresh)
    return response


def get_database_sample_data(account_id: str, region: str, database_name: str, table_name: str, refresh: bool):
    from .sample_service import init_rds_sample_job
    response = init_rds_sample_job(account_id, region, database_name, table_name, refresh)
    return response


def get_catalog_export_url(file_type: str, sensitive_flag: str, time_str: str) -> str:
    run_result = crud.get_export_catalog_data()
    all_labels = get_all_labels()
    all_labels_dict = dict()
    tmp_filename = f"{tmp_folder}/catalog_{time_str}.zip"
    report_file = f"report/catalog_{time_str}.zip"
    for item in all_labels:
        all_labels_dict[item.id] = item.label_name
    filtered_records = filter_records(run_result, all_labels_dict, sensitive_flag)
    column_header = {const.EXPORT_S3_MARK_STR: const.EXPORT_FILE_S3_COLUMNS,
                     const.EXPORT_RDS_MARK_STR: const.EXPORT_FILE_RDS_COLUMNS,
                     const.EXPORT_GLUE_MARK_STR: const.EXPORT_FILE_GLUE_COLUMNS,
                     const.EXPORT_JDBC_MARK_STR: const.EXPORT_FILE_JDBC_COLUMNS}
    gen_zip_file(column_header, filtered_records, tmp_filename, file_type)
    stats = os.stat(tmp_filename)
    s3_client = boto3.client('s3')
    if stats.st_size < 6 * 1024 * 1024:
        s3_client.upload_file(tmp_filename, admin_bucket_name, report_file)
    else:
        concurrent_upload(admin_bucket_name, report_file, tmp_filename, s3_client)
    os.remove(tmp_filename)
    method_parameters = {'Bucket': admin_bucket_name, 'Key': report_file}
    pre_url = s3_client.generate_presigned_url(
        ClientMethod="get_object",
        Params=method_parameters,
        ExpiresIn=60
    )
    return pre_url

def filter_records(all_items: list, all_labels_dict: dict, sensitive_flag: str):
    s3_records = []
    rds_records = []
    glue_records = []
    jdbc_records = []
    for row in all_items:
        row_result = [cell for cell in row]
        if sensitive_flag != 'all' and "N/A" in row_result[7]:
            continue        
        if row_result[9]:
            row_result[9] = ",".join(gen_labels(all_labels_dict, row_result[9]))
        if row_result[10]:
            row_result[10] = ",".join(gen_labels(all_labels_dict, row_result[10]))
        catalog_type = row_result[2]
        # del row_result[0]
        if catalog_type == DatabaseType.S3.value or catalog_type == DatabaseType.S3_UNSTRUCTURED.value:
            s3_records.append([row_result])
        elif catalog_type == DatabaseType.RDS.value:
            del row_result[6]
            rds_records.append([row_result])
        elif catalog_type == DatabaseType.GLUE.value:
            del row_result[6]
            glue_records.append([row_result])
        elif catalog_type.startswith(DatabaseType.JDBC.value):
            del row_result[6]
            jdbc_records.append([row_result])
        else:
            pass
    return {const.EXPORT_S3_MARK_STR: s3_records,
            const.EXPORT_RDS_MARK_STR: rds_records,
            const.EXPORT_GLUE_MARK_STR: glue_records,
            const.EXPORT_JDBC_MARK_STR: jdbc_records}

def gen_labels(all_labels_dict, row_result_item):
    tmp = [all_labels_dict.get(int(result)) for result in row_result_item.split(",")]
    return [item for item in tmp if item is not None]

def gen_zip_file(header, record, tmp_filename, type):
    with ZipFile(tmp_filename, 'w') as zipf:
        for k, v in record.items():
            if not v:
                continue
            if type == ExportFileType.XLSX.value:
                batches = int(len(v) / const.EXPORT_XLSX_MAX_LINES)
                if batches < 1:
                    wb = Workbook()
                    ws1 = wb.active
                    ws1.title = k
                    ws1.append(header.get(k))
                    for row_index in range(0, len(v)):
                        ws1.append([__get_cell_value(cell) for cell in v[row_index][0]])
                    file_name = f"{tmp_folder}/{k}.xlsx"
                    wb.save(file_name)
                    zipf.write(file_name, os.path.abspath(file_name))
                    os.remove(file_name)
                else:
                    for i in range(0, batches + 1):
                        wb = Workbook()
                        ws1 = wb.active
                        ws1.title = k
                        ws1.append(header.get(k))
                        for row_index in range(const.EXPORT_XLSX_MAX_LINES * i, min(const.EXPORT_XLSX_MAX_LINES * (i + 1), len(v))):
                            ws1.append([__get_cell_value(cell) for cell in v[row_index][0]])
                        file_name = f"{tmp_folder}/{k}_{i+1}.xlsx"
                        wb.save(file_name)
                        zipf.write(file_name, os.path.basename(file_name))
                        os.remove(file_name)
            else:
                batches = int(len(v) / const.EXPORT_CSV_MAX_LINES)
                if batches < 1:
                    file_name = f"{tmp_folder}/{k}.csv"
                    with open(file_name, 'w', encoding="utf-8-sig", newline='') as csv_file:
                        csv_writer = csv.writer(csv_file)
                        csv_writer.writerow(header.get(k))
                        for record in v:
                            csv_writer.writerow([__get_cell_value(cell) for cell in record[0]])
                    zipf.write(file_name, os.path.abspath(file_name))
                    os.remove(file_name)
                else:
                    for i in range(0, batches + 1):
                        file_name = f"{tmp_folder}/{k}_{i+1}.csv"
                        with open(file_name, 'w', encoding="utf-8-sig", newline='') as csv_file:
                            csv_writer = csv.writer(csv_file)
                            csv_writer.writerow(header.get(k))
                            for record in v[const.EXPORT_CSV_MAX_LINES * i: min(const.EXPORT_CSV_MAX_LINES * (i + 1), len(v))]:
                                csv_writer.writerow([__get_cell_value(cell) for cell in record[0]])
                        zipf.write(file_name, os.path.abspath(file_name))
                        os.remove(file_name)

def __get_cell_value(cell: dict):
    if cell and "VarCharValue" in cell:
        return cell["VarCharValue"].replace('\x00', ' ').replace('\xa0', '  ') if cell["VarCharValue"] else cell["VarCharValue"]
    else:
        return cell.replace('\x00', ' ').replace('\xa0', '  ') if cell else cell

def clear_s3_object(time_str: str):
    s3 = boto3.client('s3')
    s3.delete_object(Bucket=admin_bucket_name, Key=f"report/catalog_{time_str}.zip")
