import boto3
import os
import json
from . import crud, schemas
from data_source import crud as data_source_crud
import time
from time import sleep
from common.constant import const
from common.enum import (
    DatabaseType,
    CatalogState,
    AthenaQueryState,
    GlueResourceNameSuffix,
    GlueCrawlerState,
    Privacy,
    MessageEnum,
    ConnectionState
)
import logging
from common.exception_handler import BizException
import traceback
from discovery_job.crud import get_job_by_run_id
from label.crud import get_labels_by_id_list
from athena.service import repair

logger = logging.getLogger("api")
caller_identity = boto3.client('sts').get_caller_identity()
partition = caller_identity['Arn'].split(':')[1]


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
    if database_type not in [DatabaseType.RDS.value, DatabaseType.S3.value]:
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

    for k in identifier_dict:
        if k == const.NA:
            continue
        k_dict = identifier_dict[k]
        k_dict["identifier"] = k  # put the identifier name in result dict
        result_list.append(k_dict)

    return result_list


def __query_job_result_table_size_by_athena(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
):
    client = boto3.client("athena")
    select_sql = (
            (
                """SELECT table_name, column_name, job_id, run_id, account_id, region, database_type, database_name, table_size
                FROM %s 
                WHERE account_id='%s'
                    AND region='%s' 
                    AND database_type='%s' 
                    AND database_name='%s' """
            )
            % (const.JOB_RESULT_TABLE_NAME, account_id, region, database_type, database_name)
    )
    logger.debug("Athena SELECT TABLE_SIZE SQL : " + select_sql)
    project_bucket_name = os.getenv(
        const.PROJECT_BUCKET_NAME, const.PROJECT_BUCKET_DEFAULT_NAME
    )
    queryStart = client.start_query_execution(
        QueryString=select_sql,
        QueryExecutionContext={
            "Database": const.JOB_RESULT_DATABASE_NAME,
            "Catalog": "AwsDataCatalog",
        },
        ResultConfiguration={"OutputLocation": f"s3://{project_bucket_name}/athena-output/"},
    )
    query_id = queryStart["QueryExecutionId"]
    while True:
        response = client.get_query_execution(QueryExecutionId=query_id)
        query_execution_status = response["QueryExecution"]["Status"]["State"]
        if query_execution_status == AthenaQueryState.SUCCEEDED.value:
            break
        if query_execution_status == AthenaQueryState.FAILED.value:
            raise Exception("Query Asset STATUS:" + query_execution_status)
        else:
            time.sleep(1)
    result = client.get_query_results(QueryExecutionId=query_id)
    # Remove Athena query result to save cost.
    __remove_query_result_from_s3(query_id)
    table_size_dict = {}
    if "ResultSet" in result and "Rows" in result["ResultSet"]:
        i = 0
        for row in result["ResultSet"]["Rows"]:
            if "Data" in row and i > 0:
                table_name = __get_athena_column_value(row["Data"][0], "str")
                # column_name = __get_athena_column_value(row["Data"][1], "str")
                table_size = int(__get_athena_column_value(row["Data"][8], "int"))
                table_size_dict[table_name] = table_size
            i += 1
    # Initialize database privacy with NON-PII
    return table_size_dict


def sync_crawler_result(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
):
    if database_type not in [DatabaseType.RDS.value, DatabaseType.S3.value]:
        raise BizException(
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
        )

    rds_engine_type = const.NA
    if database_type == DatabaseType.RDS.value:
        rds_database = data_source_crud.get_rds_instance_source(
            account_id, region, database_name
        )
        if rds_database is not None:
            rds_engine_type = rds_database.engine

    client = get_boto3_client(account_id, region, "glue")
    glue_database_name = (
            database_type
            + "-"
            + database_name
            + "-"
            + GlueResourceNameSuffix.DATABASE.value
    )
    glue_crawler_name = (
            database_type + "-" + database_name + "-" + GlueResourceNameSuffix.CRAWLER.value
    )

    crawler_response = client.get_crawler(Name=glue_crawler_name)
    state = crawler_response["Crawler"]["State"]
    while state == 'STOPPING':
        crawler_response = client.get_crawler(Name=glue_crawler_name)
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
    database_row_count = 0  # Aggregate from each table
    table_count = 0  # Count each table
    need_clean_database = False
    if crawler_last_run_status == GlueCrawlerState.SUCCEEDED.value:

        # Next token is a continuation token, present if the current list segment is not the last.
        next_token = ""
        table_name_list = []
        table_column_dict = {}
        while True:
            tables_response = client.get_tables(
                DatabaseName=glue_database_name, NextToken=next_token
            )
            table_size_response = __query_job_result_table_size_by_athena(account_id, region, database_type,
                                                                          database_name)
            for table in tables_response["TableList"]:
                table_name = table["Name"].strip()
                # If the file is end of .csv or .json, but the content of the file is not csv/json
                # glue can't crawl them correctly
                # So there is no sizeKey in Parameters, we set the default value is 0
                table_size_key = 0
                if "sizeKey" in table["StorageDescriptor"]["Parameters"]:
                    table_size_key = int(
                        table["StorageDescriptor"]["Parameters"]["sizeKey"]
                    )
                # Delete empty table when Glue crawler not supported the S3 file type
                # s3 can return directly ,but rds cannot
                if database_type == DatabaseType.S3.value and table_size_key == 0:
                    client.delete_table(DatabaseName=glue_database_name,
                                        Name=table_name)
                    logger.info("Delete empty glue table named " + glue_database_name + "." + table_name)
                    continue
                table_count += 1
                column_list = table["StorageDescriptor"]["Columns"]
                table_location = table["StorageDescriptor"]["Location"]
                # If a table is a specific S3 object, there is no objectCount in Parameters, and the object count is 1
                table_object_count = 1
                if "objectCount" in table["StorageDescriptor"]["Parameters"]:
                    table_object_count = int(
                        table["StorageDescriptor"]["Parameters"]["objectCount"]
                    )
                # For a s3 table, the classification is the file type of the table objects, csv/json/...
                table_classification = const.NA
                if "classification" in table["StorageDescriptor"]["Parameters"]:
                    table_classification = table["StorageDescriptor"]["Parameters"][
                        "classification"
                    ]
                elif database_type == DatabaseType.RDS.value:
                    table_classification = rds_engine_type

                database_object_count += table_object_count
                database_size += table_size_key
                column_order_num = 0
                table_size = 0
                if table_size_response.get(table_name) is not None:
                    table_size = table_size_response[table_name]
                for column in column_list:
                    column_order_num += 1
                    column_name = column["Name"].strip()
                    column_type = column["Type"].strip()
                    # To avoid too long embedded type like : struct<struct<xxxxxx.....>>
                    # In the testing process we found a type longer than 2048
                    if len(column_type) > 200 and database_type == "s3":
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
                    original_column = crud.get_catalog_column_level_classification_by_name(account_id, region,
                                                                                           database_type, database_name,
                                                                                           table_name, column_name)
                    if original_column == None:
                        crud.create_catalog_column_level_classification(catalog_column_dict)
                    else:
                        # Keep the latest modify if it is a specfic user
                        catalog_column_dict['modify_by'] = original_column.modify_by
                        crud.update_catalog_column_level_classification_by_id(original_column.id, catalog_column_dict)
                    # table_column_dict.setdefault(table_column_dict[table_name], []).append(column_name)
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
                    "row_count": table_size,
                    "storage_location": table_location,
                    "classification": table_classification,
                }
                original_table = crud.get_catalog_table_level_classification_by_name(account_id, region, database_type,
                                                                                     database_name, table_name)
                if original_table == None:
                    crud.create_catalog_table_level_classification(catalog_table_dict)
                else:
                    # Keep the latest modify if it is a specfic user
                    catalog_table_dict['modify_by'] = original_table.modify_by
                    crud.update_catalog_table_level_classification_by_id(original_table.id, catalog_table_dict)
                table_name_list.append(table_name)
                database_column_count += column_order_num
                database_row_count += table_size
                # update_catalog_table_and_database_level_privacy(account_id,
                #                                                 region,
                #                                                 database_type,
                #                                                 database_name,
                #                                                 table_name)
            next_token = tables_response.get("NextToken")
            if next_token is None:
                break
        catalog_table_list = crud.get_catalog_table_level_classification_by_database(account_id, region,
                                                                                     database_type, database_name)
        for catalog in catalog_table_list:
            if catalog.table_name not in table_name_list:
                logger.info("sync_crawler_result DELETE TABLE AND COLUMN WHEN NOT IN GLUE TABLES！！！" + catalog.table_name)
                need_clean_database = True
                crud.delete_catalog_table_level_classification(catalog.id)
                crud.delete_catalog_column_level_classification_by_table_name(account_id, region, database_type, database_name, catalog.table_name, None)
            column_list = table_column_dict[catalog.table_name]
            logger.info("sync_crawler_result DELETE COLUMN WHEN NOT IN GLUE TABLES" + catalog.table_name + json.dumps(table_column_dict[catalog.table_name]))
            crud.delete_catalog_column_level_classification_by_table_name(account_id, region, database_type, database_name, catalog.table_name, column_list)

    if table_count == 0:
        if database_type == DatabaseType.RDS.value:
            data_source_crud.set_rds_instance_source_glue_state(account_id, region, database_name,
                                                                ConnectionState.UNSUPPORTED.value)
        elif database_type == DatabaseType.S3.value:
            data_source_crud.set_s3_bucket_source_glue_state(account_id, region, database_name,
                                                             ConnectionState.UNSUPPORTED.value)
    # create database
    if table_count > 0:
        catalog_database_dict = {
            "account_id": account_id,
            "region": region,
            "database_type": database_type,
            "database_name": database_name,
            "object_count": database_object_count,
            "size_key": database_size,
            "table_count": 0 if need_clean_database else table_count,
            "column_count": database_column_count,
            "row_count": database_row_count,
            # Store location for s3 and engine type for rds
            "storage_location": "s3://" + database_name + "/"
            if database_type == DatabaseType.S3.value
            else rds_engine_type,
        }
        original_database = crud.get_catalog_database_level_classification_by_name(account_id, region, database_type,
                                                                                   database_name)
        if original_database == None:
            crud.create_catalog_database_level_classification(catalog_database_dict)
        else:
            crud.update_catalog_database_level_classification_by_id(original_database.id, catalog_database_dict)

    logger.info(
        "Sync crawler result sucessfully, 1 database/"
        + str(table_count)
        + " tables affected."
    )
    return True


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
    project_bucket_name = os.getenv(
        const.PROJECT_BUCKET_NAME, const.PROJECT_BUCKET_DEFAULT_NAME
    )
    response = boto3.client("s3").delete_object(
        Bucket=project_bucket_name, Key="athena-output/" + query_id + ".csv"
    )

    response_meta = boto3.client("s3").delete_object(
        Bucket=project_bucket_name,
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
    # MSCK
    repair()

    client = boto3.client("athena")
    # Select result
    select_sql = (
            (
                """SELECT table_name,column_name,cast(identifiers as json) as identifiers_str,CASE WHEN sample_data is NULL then '' else array_join(sample_data, \'|\') end as sample_str, privacy, table_size
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

    project_bucket_name = os.getenv(
        const.PROJECT_BUCKET_NAME, const.PROJECT_BUCKET_DEFAULT_NAME
    )

    queryStart = client.start_query_execution(
        QueryString=select_sql,
        QueryExecutionContext={
            "Database": const.JOB_RESULT_DATABASE_NAME,
            "Catalog": "AwsDataCatalog",
        },
        ResultConfiguration={"OutputLocation": f"s3://{project_bucket_name}/athena-output/"},
    )
    query_id = queryStart["QueryExecutionId"]
    while True:
        response = client.get_query_execution(QueryExecutionId=query_id)

        query_execution_status = response["QueryExecution"]["Status"]["State"]

        if query_execution_status == AthenaQueryState.SUCCEEDED.value:
            logger.info("__query_job_result_by_athena : " )
            logger.info(response)
            break

        if query_execution_status == AthenaQueryState.FAILED.value:
            raise Exception("Query Asset STATUS:" + response["QueryExecution"]["Status"]["StateChangeReason"])

        else:
            time.sleep(1)

    result = client.get_query_results(QueryExecutionId=query_id)
    # Remove Athena query result to save cost.
    logger.info(result)
    __remove_query_result_from_s3(query_id)

    return result


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
    job_result = __query_job_result_by_athena(
        account_id,
        region,
        database_type,
        database_name,
        job_run_id,
    )

    table_privacy_dict = {}
    table_identifier_dict = {}
    table_size_dict = {}
    row_count = 0
    table_column_dict = {}
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
                table_size_dict[table_name] = table_size
                # table_column_dict.setdefault(table_column_dict[table_name], []).append(column_name)
                if table_name in table_column_dict:
                    table_column_dict[table_name].append(column_name)
                else:
                    table_column_dict[table_name] = [column_name]
                column_privacy = privacy
                catalog_column = crud.get_catalog_column_level_classification_by_name(
                    account_id,
                    region,
                    database_type,
                    database_name,
                    table_name,
                    column_name,
                )
                identifier_dict = __convert_identifiers_to_dict(identifier)
                if catalog_column is not None and (overwrite or (
                        not overwrite and catalog_column.manual_tag != "manual")):
                    column_dict = {
                        "identifier": json.dumps(identifier_dict),
                        "column_value_example": column_sample_data,
                        "privacy": column_privacy,
                        "state": CatalogState.DETECTED.value,
                    }
                    crud.update_catalog_column_level_classification_by_id(
                        catalog_column.id, column_dict
                    )
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
    if not table_size_dict:
        logger.info(
            "sync_job_detection_result - RESET NA TABLE AND COLUMNS WHEN TABLE_SIZE IS ZERO ")
        crud.update_catalog_table_none_privacy_by_name(account_id, region, database_type,
                                                       database_name, None, overwrite)
        crud.update_catalog_column_none_privacy_by_table(account_id, region, database_type,
                                                         database_name, None, None, overwrite)
    # Initialize database privacy with NON-PII
    database_privacy = Privacy.NON_PII.value
    # The two dict has all tables as key.
    for table_name in table_size_dict:
        table_size = table_size_dict[table_name]
        if table_size <= 0:
            logger.info(
                "sync_job_detection_result - RESET TABLE AND COLUMNS WHEN TABLE_SIZE IS ZERO : !")
            crud.update_catalog_table_none_privacy_by_name(account_id, region, database_type, database_name, table_name,
                                                           overwrite)
            crud.update_catalog_column_none_privacy_by_table(account_id, region, database_type, database_name,
                                                             table_name, None, overwrite)
            continue
        row_count += table_size
        catalog_table = crud.get_catalog_table_level_classification_by_name(
            account_id, region, database_type, database_name, table_name
        )
        columns = table_column_dict[table_name]
        logger.info(
            "sync_job_detection_result - RESET ADDITIONAL COLUMNS : " + json.dumps(table_column_dict[table_name]))
        crud.update_catalog_column_none_privacy_by_table(account_id, region, database_type, database_name,
                                                         table_name, columns, overwrite)
        if table_name not in table_privacy_dict:
            if catalog_table is not None:
                table_dict = {
                    "row_count": table_size,
                }
                crud.update_catalog_table_level_classification_by_id(
                    catalog_table.id, table_dict
                )
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
                        not overwrite and catalog_table.manual_tag != "manual")):
                table_dict = {
                    "privacy": privacy,
                    "identifiers": identifiers,
                    "state": CatalogState.DETECTED.value,
                    "row_count": table_size,
                }
                crud.update_catalog_table_level_classification_by_id(
                    catalog_table.id, table_dict
                )
    catalog_database = crud.get_catalog_database_level_classification_by_name(
        account_id, region, database_type, database_name
    )
    if catalog_database is not None and (overwrite or (
                        not overwrite and catalog_database.manual_tag != "manual")):
        database_dict = {
            "privacy": database_privacy,
            "state": CatalogState.DETECTED.value,
            "row_count": row_count,
        }
        crud.update_catalog_database_level_classification_by_id(
            catalog_database.id, database_dict
        )
    logger.info("Sync detection result sucessfully!")
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
        client = get_boto3_client(account_id, region, database_type)
        if database_type == DatabaseType.S3.value:
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
        else:
            raise BizException(
                MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
                MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
            )
    except Exception as e:
        logger.error(''.join(traceback.TracebackException.from_exception(e).format()))
        raise BizException(
            MessageEnum.CATALOG_DATABASE_PROPERTY_GET_FAILED.get_code(),
            MessageEnum.CATALOG_DATABASE_PROPERTY_GET_FAILED.get_msg(),
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


def fill_catalog_labels(catalogs):
    for catalog in catalogs:
        catalog.labels = []
        if catalog is None or catalog.label_ids is None or len(catalog.label_ids) <= 0:
            continue
        label_list = catalog.label_ids.split(',')
        label_id_list = list(map(int, label_list))
        labels = get_labels_by_id_list(label_id_list)
        if labels is None:
            continue
        labels_str = [{"id": label.id, "label_name": label.label_name} for label in labels]
        catalog.labels = labels_str
    return catalogs
