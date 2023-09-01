from . import crud
from data_source import crud as data_source_crud
from common.enum import (
    DatabaseType,
    MessageEnum,
    Privacy,
    CatalogModifier
)
from common.constant import const
import logging
from common.exception_handler import BizException
import heapq
from common.query_condition import QueryCondition


logger = logging.getLogger("api")


def agg_data_source_summary():
    # Get data source total region.
    s3_account_region = data_source_crud.get_source_s3_account_region()
    rds_account_region = data_source_crud.get_source_rds_account_region()

    account_set = set()
    region_set = set()
    for d in s3_account_region:
        account_set.add(d['aws_account'])
        region_set.add(d['region'])

    for d in rds_account_region:
        account_set.add(d['aws_account'])
        region_set.add(d['region'])

    result_dict = {'account_total': len(account_set), 'region_total': len(region_set)}
    return result_dict


def agg_catalog_summay(database_type: str):
    result_dict = {}
    if database_type == DatabaseType.S3.value:
        summary = crud.get_s3_database_summary()
        if len(summary) > 0:
            result_dict = summary[0]._asdict()
    elif database_type == DatabaseType.RDS.value:
        result_dict = crud.get_rds_column_summary()[0]._asdict()
        table_list = crud.get_catalog_table_level_classification_by_type(database_type)
        result_dict['table_total'] = len(table_list)
       
        rds_database_set = set()
        for table in table_list:
            rds_database = table.storage_location.split('.')[0]
            # To avoid same database name in different account/region/instance, table.database_name is RDS instance_id
            rds_database_full_name =  table.account_id + table.region + table.database_name + rds_database
            rds_database_set.add(rds_database_full_name)
        #TODO rds display database or instance
        result_dict['database_total'] = len(rds_database_set)
    else: 
        raise BizException(
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
        )

    result_dict['column_chart'] = crud.get_catalog_table_count_by_type(database_type)

    return result_dict


def agg_catalog_summary_by_attr(database_type: str,  agg_attribute: str, need_merge: bool):
    result_list = []
    if database_type == DatabaseType.S3.value:
        attr_rows = crud.get_s3_database_summary_with_attr(agg_attribute, need_merge)
        return attr_rows

    elif database_type == DatabaseType.RDS.value:
        attr_rows = crud.get_rds_database_summary_with_attr(agg_attribute, need_merge)
        return attr_rows
    else: 
        raise BizException(
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
        )
    return result_list


def __get_top_n_count(data_dict: dict, n: int):
    top_n_list = []
    # v is a set, we need to return top n set sort by it's length.
    data_list = []
    for k in data_dict.keys():
        data_list.append({'name': k, "data_source_count": len(data_dict[k])})

    top_n_list = heapq.nlargest(n, data_list, 
                         key=lambda x: x['data_source_count'])    
    return top_n_list


def __get_identifier_top_n_count(data_dict: dict, template_dict: dict, n: int):
    top_n_list = []
    # v is a set, we need to return top n set sort by it's length.
    data_list = []
    for k in data_dict.keys():
        data_list.append({'name': k, "data_source_count": len(data_dict[k]), "props": template_dict[k] if template_dict.get(k) is not None else None})

    top_n_list = heapq.nlargest(n, data_list, key=lambda x: x['data_source_count'])
    logger.info(top_n_list)
    return top_n_list


def agg_catalog_data_source_top_n(database_type: str, top_n: int):
    if database_type not in [DatabaseType.RDS.value, DatabaseType.S3.value]:
        raise BizException(
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
        )
    result_dict = {}
    table_rows = crud.get_catalog_table_level_classification_by_type(database_type)
    database_rows = crud.get_catalog_database_level_classification_by_type_all(database_type)
    account_dict = {}
    identifier_dict = {}

    for table in table_rows:
        if table.identifiers == const.NA:
            continue
        data_source_full_name = table.account_id + table.region + table.database_type + table.database_name
      
        table_identifiers = table.identifiers.split("|")
        for identifier in table_identifiers:
            if identifier == const.NA or identifier == "":
                continue
            if identifier not in identifier_dict:
                identifier_dict[identifier] = set()
            identifier_dict[identifier].add(data_source_full_name)

    for database in database_rows:
        if database.privacy == Privacy.NON_PII.value or database.privacy == Privacy.NA.value:
            continue
        data_source_full_name = database.account_id + database.region + database.database_type + database.database_name
        if database.account_id not in account_dict:
            account_dict[database.account_id]=set()
        account_dict[database.account_id].add(data_source_full_name)
        
    
    result_dict['account_top_n'] = __get_top_n_count(account_dict, top_n)

    logger.info(identifier_dict.keys())
    from template.service import get_identifiers
    template_identifier_resp = get_identifiers(QueryCondition(size=500, conditions=[
        {"values": list(identifier_dict.keys()), "column": "name", "condition": "and", "operation": "in"}])).all()
    logger.info(template_identifier_resp)
    template_identifier_dict = {}
    for template_identifier in template_identifier_resp:
        template_identifier_dict[template_identifier.name] = template_identifier.props
    logger.info(template_identifier_dict)
    result_dict['identifier_top_n'] = __get_identifier_top_n_count(identifier_dict, template_identifier_dict, top_n)
    return result_dict


def agg_catalog_summary_by_modifier(database_type: str):
    # The modifier should be classified to System/Manual.
    result_list = []
    if database_type not in [DatabaseType.RDS.value, DatabaseType.S3.value]:
        raise BizException(
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
        )
    
    attr_rows = crud.get_s3_database_summary_with_attr("modify_by", False) if database_type == DatabaseType.S3.value else crud.get_rds_database_summary_with_attr("modify_by", False)
    result_dict = {}
    for row in attr_rows:
        modifier = CatalogModifier.SYSTEM.value
        if row['modify_by'] != const.SOLUTION_NAME:
            modifier = CatalogModifier.MANUAL.value
        if modifier in result_dict:
            result_dict[modifier] += row["database_total"]
        else:
            result_dict[modifier] = row["database_total"]
        
    for modifier in result_dict.keys():
        result_list.append({"modifier": modifier, "data_sources": result_dict[modifier]})
    
    return result_list


def get_database_by_identifier(identifer_name, database_type):
    # Support double check when delete identifier
    if database_type not in [DatabaseType.RDS.value, DatabaseType.S3.value]:
        raise BizException(
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
    )
    result_list = []
    database_set = set()
    table_list = crud.get_catalog_table_level_classification_by_identifier_and_database_type(identifer_name, database_type)

    for table in table_list:
        database_full_name = table.account_id + "|" + table.region + "|" + table.database_type + "|" + table.database_name
        database_set.add(database_full_name)

    for database_full_name in database_set:
        database_info = database_full_name.split("|")
        result_db = crud.get_catalog_database_level_classification_by_name(database_info[0],
                                                                          database_info[1],
                                                                          database_info[2],
                                                                          database_info[3])
        result_list.append(result_db)
    return result_list


def get_database_by_identifier_paginate(condition: QueryCondition):
    result_list = []
    database_set = set()
    identifier = ""
    database_type = ""
    for con in condition.conditions:
        if con.column == "identifiers":
            identifier = con.values[0]
        if con.column == "database_type":
            database_type = con.values[0]
    if database_type not in [DatabaseType.RDS.value, DatabaseType.S3.value]:
        raise BizException(
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_code(),
            MessageEnum.CATALOG_DATABASE_TYPE_ERR.get_msg(),
    )
    table_list = crud.get_catalog_table_level_classification_by_identifier_and_database_type(identifier, database_type)

    for table in table_list:
        database_full_name = table.account_id + "|" + table.region + "|" + table.database_type + "|" + table.database_name
        database_set.add(database_full_name)
    database_list = sorted(list(database_set))
    for database_full_name in database_list:
        database_info = database_full_name.split("|")
        result_db = crud.get_catalog_database_level_classification_by_name(database_info[0],
                                                                          database_info[1],
                                                                          database_info[2],
                                                                          database_info[3])
        result_list.append(result_db)
    if condition.size >= len(result_list):
        return result_list
    else:
        page_end = condition.page * condition.size
        if page_end > len(result_list):
            page_end = len(result_list)
        return result_list[(condition.page - 1) * condition.size: page_end]