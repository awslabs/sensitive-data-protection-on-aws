import logging

from sqlalchemy import (and_)
from sqlalchemy import func, distinct

import db.models_catalog as models
import tools.mytime as mytime
from common.constant import const
from common.enum import (
    CatalogState,
    Privacy,
    DatabaseType
)
from common.query_condition import QueryCondition, query_with_condition, query_with_func_condition
from db.database import get_session
from tools.pydantic_tool import parse_pydantic_schema
from . import schemas


def get_catalog_column_level_classification_by_database(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
        page_size: int = 1000
):
    session = get_session()
    page = 1
    results = {}
    while True:
        query = (
            session.query(models.CatalogColumnLevelClassification)
            .filter(models.CatalogColumnLevelClassification.account_id == account_id)
            .filter(models.CatalogColumnLevelClassification.region == region)
            .filter(models.CatalogColumnLevelClassification.database_type == database_type)
            .filter(models.CatalogColumnLevelClassification.database_name == database_name)
            .limit(page_size)
            .offset((page - 1) * page_size)
            .all()
        )
        if not query:
            break
        for item in query:
            key_name = f'{item.table_name}_{item.column_name}'
            results[key_name] = item
        page += 1
    return results


def get_catalog_column_level_classification_by_table(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
        table_name: str,
):
    result = (
        get_session()
        .query(models.CatalogColumnLevelClassification)
        .filter(models.CatalogColumnLevelClassification.account_id == account_id)
        .filter(models.CatalogColumnLevelClassification.region == region)
        .filter(models.CatalogColumnLevelClassification.database_type == database_type)
        .filter(models.CatalogColumnLevelClassification.database_name == database_name)
        .filter(models.CatalogColumnLevelClassification.table_name == table_name)
        .order_by(models.CatalogColumnLevelClassification.column_order_num)
    )
    return result


def get_catalog_column_level_classification_by_name(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
        table_name: str,
        column_name: str,
):
    result = (
        get_session()
        .query(models.CatalogColumnLevelClassification)
        .filter(models.CatalogColumnLevelClassification.account_id == account_id)
        .filter(models.CatalogColumnLevelClassification.region == region)
        .filter(models.CatalogColumnLevelClassification.database_type == database_type)
        .filter(models.CatalogColumnLevelClassification.database_name == database_name)
        .filter(models.CatalogColumnLevelClassification.table_name == table_name)
        .filter(models.CatalogColumnLevelClassification.column_name == column_name)
        .first()
    )
    return result


def get_catalog_column_level_classification_by_id(
        column_id: str
):
    result = (
        get_session()
        .query(models.CatalogColumnLevelClassification)
        .filter(models.CatalogColumnLevelClassification.id == column_id)
        .first()
    )
    return result


def get_catalog_database_level_classification_by_params(account_id: str, region: str, database_type: str, state: str = None):
    result = (
        get_session()
        .query(models.CatalogDatabaseLevelClassification)
        .filter(models.CatalogDatabaseLevelClassification.account_id == account_id)
        .filter(models.CatalogDatabaseLevelClassification.region == region)
        .filter(models.CatalogDatabaseLevelClassification.database_type == database_type)
    )
    if state:
        result = result.filter(models.CatalogDatabaseLevelClassification.state == state)
    return result


def get_catalog_database_level_classification_by_type_all(database_type: str):
    if database_type.startswith(DatabaseType.JDBC.value):
        return get_session().query(models.CatalogDatabaseLevelClassification).filter(
            models.CatalogDatabaseLevelClassification.database_type.like(f'{database_type}%')
        )
    return get_session().query(models.CatalogDatabaseLevelClassification).filter(
        models.CatalogDatabaseLevelClassification.database_type == database_type
    )


def get_catalog_database_level_classification_by_type(condition: QueryCondition):
    return query_with_condition(get_session().query(models.CatalogDatabaseLevelClassification), condition)


def get_catalog_database_level_classification_s3(condition: QueryCondition):
    for condition_value in condition.conditions:
        if condition_value.column == 'database_type' and DatabaseType.S3.value in condition_value.values:
            if len(condition_value.values) == 1 and condition_value.values[0] == DatabaseType.S3.value:
                condition_value.values = [DatabaseType.S3.value, DatabaseType.S3_UNSTRUCTURED.value]
                condition_value.operation = 'in'
                condition.group_column = 'database_name'
    return query_with_func_condition(get_session().query(models.CatalogDatabaseLevelClassification), condition,
                                    ['object_count', 'size_key'])


def get_table_count_by_bucket_name(bucket_name: str):
    result = (
        get_session()
        .query(models.CatalogDatabaseLevelClassification)
        .filter(models.CatalogDatabaseLevelClassification.database_name == bucket_name)
        .all()
    )
    s3_count = 0
    unstructured_count = 0
    if result:
        for item in result:
            if item.database_type == DatabaseType.S3.value:
                s3_count = item.table_count
            elif item.database_type == DatabaseType.S3_UNSTRUCTURED.value:
                unstructured_count = item.table_count
    resp = {DatabaseType.S3.value: s3_count, DatabaseType.S3_UNSTRUCTURED.value: unstructured_count}
    return resp


def get_catalog_database_level_classification_by_name(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
):
    result = (
        get_session()
        .query(models.CatalogDatabaseLevelClassification)
        .filter(models.CatalogDatabaseLevelClassification.account_id == account_id)
        .filter(models.CatalogDatabaseLevelClassification.region == region)
        .filter(
            models.CatalogDatabaseLevelClassification.database_type == database_type
        )
        .filter(
            models.CatalogDatabaseLevelClassification.database_name == database_name
        )
        .first()
    )
    return result


def get_catalog_table_level_classification_by_database(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
):
    result = (
        get_session()
        .query(models.CatalogTableLevelClassification)
        .filter(models.CatalogTableLevelClassification.account_id == account_id)
        .filter(models.CatalogTableLevelClassification.region == region)
        .filter(models.CatalogTableLevelClassification.database_type == database_type)
        .filter(models.CatalogTableLevelClassification.database_name == database_name)
    )
    return result


def search_catalog_table_level_classification_by_database(
        condition: QueryCondition
):
    return query_with_condition(get_session().query(models.CatalogTableLevelClassification), condition)


def search_catalog_table_level_classification(
        condition: QueryCondition
):
    return query_with_condition(get_session().query(models.CatalogTableLevelClassification), condition)


def get_catalog_table_level_classification_by_database_all(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
        page_size: int = 1000
):
    session = get_session()
    page = 1
    results = {}
    while True:
        query = (
            session.query(models.CatalogTableLevelClassification)
            .filter(models.CatalogTableLevelClassification.account_id == account_id)
            .filter(models.CatalogTableLevelClassification.region == region)
            .filter(models.CatalogTableLevelClassification.database_type == database_type)
            .filter(models.CatalogTableLevelClassification.database_name == database_name)
            .limit(page_size)
            .offset((page - 1) * page_size)
            .all()
        )
        if not query:
            break
        for item in query:
            table_name = item.table_name
            results[table_name] = item
        page += 1
    return results


def get_catalog_table_level_classification_by_id(
        table_id: str
):
    try:
        result = (
            get_session()
            .query(models.CatalogTableLevelClassification)
            .filter(models.CatalogTableLevelClassification.id == table_id)
            .first()
        )
        return result
    except Exception as e:
        logging.error(e)
        return None


def get_catalog_table_level_classification_by_name(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
        table_name: str,
):
    result = (
        get_session()
        .query(models.CatalogTableLevelClassification)
        .filter(models.CatalogTableLevelClassification.account_id == account_id)
        .filter(models.CatalogTableLevelClassification.region == region)
        .filter(models.CatalogTableLevelClassification.database_type == database_type)
        .filter(models.CatalogTableLevelClassification.database_name == database_name)
        .filter(models.CatalogTableLevelClassification.table_name == table_name)
        .first()
    )
    return result


def get_catalog_table_level_classification_by_database_identifier(
        account_id: str,
        region: str,
        database_type: str,
        database_name: str,
        table_name: str,
        identifier: str,
):
    session = get_session()
    query = session.query(models.CatalogTableLevelClassification)
    query = query.filter(models.CatalogTableLevelClassification.account_id == account_id)
    query = query.filter(models.CatalogTableLevelClassification.region == region)
    query = query.filter(models.CatalogTableLevelClassification.database_type == database_type)
    query = query.filter(models.CatalogTableLevelClassification.database_name == database_name)
    query = query.filter(models.CatalogTableLevelClassification.identifiers.ilike("%" + identifier + "%"))
    if table_name is not None:
        query = query.filter(models.CatalogTableLevelClassification.table_name.ilike("%" + table_name + "%"))
    result = (
        query
    )
    return result


def get_catalog_table_level_classification_by_identifier_and_database_type(
        identifier: str,
        database_type: str
):
    result = (
        get_session()
        .query(models.CatalogTableLevelClassification)
        .filter(models.CatalogTableLevelClassification.database_type == database_type)
        .filter(
            models.CatalogTableLevelClassification.identifiers.ilike(
                "%" + identifier + "%"
            )
        )
    )
    return result


def create_catalog_column_level_classification(catalog_column: dict):
    parsed_schema = parse_pydantic_schema(catalog_column)
    db_catalog = models.CatalogColumnLevelClassification(
        **parsed_schema,
        column_value_example=const.NA,
        identifier='{"' + const.NA + '": 0}',
        identifier_score=0.0,
        privacy=Privacy.NA.value,
        sensitivity=const.NA,
        version=0,
        create_by=const.SOLUTION_NAME,
        create_time=mytime.get_time(),
        modify_by=const.SOLUTION_NAME,
        modify_time=mytime.get_time(),
        state=CatalogState.CREATED.value,
    )
    get_session().add(db_catalog)
    get_session().commit()
    return db_catalog


def batch_create_catalog_column_level_classification(catalog_columns: list):
    catalog_columns_db = []
    for catalog_column in catalog_columns:
        parsed_schema = parse_pydantic_schema(catalog_column)
        db_catalog = models.CatalogColumnLevelClassification(
            **parsed_schema,
            column_value_example=const.NA,
            identifier='{"' + const.NA + '": 0}',
            identifier_score=0.0,
            privacy=Privacy.NA.value,
            sensitivity=const.NA,
            version=0,
            create_by=const.SOLUTION_NAME,
            create_time=mytime.get_time(),
            modify_by=const.SOLUTION_NAME,
            modify_time=mytime.get_time(),
            state=CatalogState.CREATED.value,
        )
        catalog_columns_db.append(db_catalog)
    get_session().bulk_save_objects(catalog_columns_db)
    get_session().commit()


def create_catalog_table_level_classification(catalog_table: dict):
    parsed_schema = parse_pydantic_schema(catalog_table)
    db_catalog = models.CatalogTableLevelClassification(
        **parsed_schema,
        privacy=Privacy.NA.value,
        sensitivity=const.NA,
        identifiers=const.NA,
        version=0,
        create_by=const.SOLUTION_NAME,
        create_time=mytime.get_time(),
        modify_by=const.SOLUTION_NAME,
        modify_time=mytime.get_time(),
        state=CatalogState.CREATED.value,
    )
    get_session().add(db_catalog)
    get_session().commit()
    return db_catalog


def batch_create_catalog_table_level_classification(catalog_tables: list):
    catalog_tables_db = []
    for catalog_table in catalog_tables:
        parsed_schema = parse_pydantic_schema(catalog_table)
        db_catalog = models.CatalogTableLevelClassification(
            **parsed_schema,
            privacy=Privacy.NA.value,
            sensitivity=const.NA,
            identifiers=const.NA,
            version=0,
            create_by=const.SOLUTION_NAME,
            create_time=mytime.get_time(),
            modify_by=const.SOLUTION_NAME,
            modify_time=mytime.get_time(),
            state=CatalogState.CREATED.value,
        )
        catalog_tables_db.append(db_catalog)
    get_session().bulk_save_objects(catalog_tables_db)
    get_session().commit()


def create_catalog_database_level_classification(catalog_database: dict):
    parsed_schema = parse_pydantic_schema(catalog_database)
    db_catalog = models.CatalogDatabaseLevelClassification(
        **parsed_schema,
        privacy=Privacy.NA.value,
        sensitivity=const.NA,
        version=0,
        create_by=const.SOLUTION_NAME,
        create_time=mytime.get_time(),
        modify_by=const.SOLUTION_NAME,
        modify_time=mytime.get_time(),
        state=CatalogState.CREATED.value,
    )
    get_session().add(db_catalog)
    get_session().commit()
    return db_catalog


def update_catalog_database_level_classification(
        database: schemas.CatalogDatabaseLevelClassification,
):
    database.modify_time = mytime.get_time()
    del database.labels
    del database.modify_by
    size = (
        get_session()
        .query(models.CatalogDatabaseLevelClassification)
        .filter(models.CatalogDatabaseLevelClassification.id == database.id)
        .update(database.dict(exclude_unset=True))
    )
    get_session().commit()
    return size > 0


def update_catalog_table_level_classification(
        table: schemas.CatalogTableLevelClassification,
):
    table.modify_time = mytime.get_time()
    del table.labels
    del table.modify_by
    size = (
        get_session()
        .query(models.CatalogTableLevelClassification)
        .filter(models.CatalogTableLevelClassification.id == table.id)
        .update(table.dict(exclude_unset=True))
    )
    get_session().commit()
    return size > 0


def update_catalog_column_level_classification(
        column: schemas.CatalogColumnLevelClassification,
) -> bool:
    column.modify_time = mytime.get_time()
    del column.modify_by
    size = (
        get_session()
        .query(models.CatalogColumnLevelClassification)
        .filter(models.CatalogColumnLevelClassification.id == column.id)
        .update(column.dict(exclude_unset=True))
    )
    get_session().commit()
    return size > 0


def update_catalog_column_level_classification_by_id(
        id: int,
        column: dict,
) -> bool:
    column["modify_time"] = mytime.get_time()
    size = (
        get_session()
        .query(models.CatalogColumnLevelClassification)
        .filter(models.CatalogColumnLevelClassification.id == id)
        .update(column)  # column.dict(exclude_unset=True)
    )
    get_session().commit()
    return size > 0


def batch_update_catalog_column_level_classification_by_id(
        columns: list
):
    get_session().bulk_update_mappings(models.CatalogColumnLevelClassification, columns)
    get_session().commit()


def update_catalog_database_level_classification_by_id(
        id: int,
        database: dict,
):
    database["modify_time"] = mytime.get_time()
    size = (
        get_session()
        .query(models.CatalogDatabaseLevelClassification)
        .filter(models.CatalogDatabaseLevelClassification.id == id)
        .update(database)
    )
    get_session().commit()
    return size > 0


def update_catalog_table_level_classification_by_id(
        id: int,
        table: dict,
):
    table["modify_time"] = mytime.get_time()
    size = (
        get_session()
        .query(models.CatalogTableLevelClassification)
        .filter(models.CatalogTableLevelClassification.id == id)
        .update(table)
    )
    get_session().commit()
    return size > 0


def batch_update_catalog_table_level_classification_by_id(
        tables: list,
):
    get_session().bulk_update_mappings(models.CatalogTableLevelClassification, tables)
    get_session().commit()


def update_catalog_table_none_privacy_by_name(account_id: str,
                                              region: str,
                                              database_type: str,
                                              database_name: str,
                                              table_name: str,
                                              overwrite: bool,
                                              ):
    table = {"row_count": 0, "identifiers": const.NA, "privacy": Privacy.NA.value, "state": CatalogState.UPDATED.value}
    session = get_session()
    query = session.query(models.CatalogTableLevelClassification)
    query = query.filter(models.CatalogTableLevelClassification.account_id == account_id)
    query = query.filter(models.CatalogTableLevelClassification.region == region)
    query = query.filter(models.CatalogTableLevelClassification.database_type == database_type)
    query = query.filter(models.CatalogTableLevelClassification.database_name == database_name)
    if table_name is not None:
        query = query.filter(models.CatalogTableLevelClassification.table_name == table_name)
    if not overwrite:
        query = query.filter(models.CatalogTableLevelClassification.manual_tag != const.MANUAL)
    else:
        table['manual_tag'] = const.SYSTEM
    size = query.update(table)
    session.commit()
    return size > 0


def update_catalog_column_none_privacy_by_table(account_id: str,
                                                region: str,
                                                database_type: str,
                                                database_name: str,
                                                table_name: str,
                                                column_names: list,
                                                overwrite: bool,
                                                ):
    column = {"identifier": '{"N/A": 0}', "column_value_example": const.NA,
              "privacy": Privacy.NA.value, "state": CatalogState.UPDATED.value}
    session = get_session()
    query = session.query(models.CatalogColumnLevelClassification)
    query = query.filter(models.CatalogColumnLevelClassification.account_id == account_id)
    query = query.filter(models.CatalogColumnLevelClassification.region == region)
    query = query.filter(models.CatalogColumnLevelClassification.database_type == database_type)
    query = query.filter(models.CatalogColumnLevelClassification.database_name == database_name)
    if table_name is not None:
        query = query.filter(models.CatalogColumnLevelClassification.table_name == table_name)
    if column_names is not None:
        query = query.filter(~models.CatalogColumnLevelClassification.column_name.in_(column_names))
    if not overwrite:
        query = query.filter(models.CatalogColumnLevelClassification.manual_tag != const.MANUAL)
    else:
        column['manual_tag'] = const.SYSTEM
    size = query.update(column)
    session.commit()
    return size > 0


def delete_catalog_table_level_classification(id: int):
    session = get_session()
    session.query(models.CatalogTableLevelClassification).filter(
        models.CatalogTableLevelClassification.id == id
    ).delete()
    session.commit()


def delete_catalog_database_level_classification(id: int):
    session = get_session()
    session.query(models.CatalogDatabaseLevelClassification).filter(
        models.CatalogDatabaseLevelClassification.id == id
    ).delete()
    session.commit()


def delete_catalog_column_level_classification(id: int):
    session = get_session()
    session.query(models.CatalogColumnLevelClassification).filter(
        models.CatalogColumnLevelClassification.id == id
    ).delete()
    session.commit()


def delete_catalog_table_level_classification_by_account_region(account_id: str, region: str):
    session = get_session()
    session.query(models.CatalogTableLevelClassification).filter(
        models.CatalogTableLevelClassification.account_id == account_id
    ).filter(
        models.CatalogTableLevelClassification.region == region
    ).delete()
    session.commit()


def delete_catalog_database_level_classification_by_account_region(account_id: str, region: str):
    session = get_session()
    session.query(models.CatalogDatabaseLevelClassification).filter(
        models.CatalogDatabaseLevelClassification.account_id == account_id
    ).filter(
        models.CatalogDatabaseLevelClassification.region == region
    ).delete()
    session.commit()


def delete_catalog_column_level_classification_by_account_region(account_id: str, region: str):
    session = get_session()
    session.query(models.CatalogColumnLevelClassification).filter(
        models.CatalogColumnLevelClassification.account_id == account_id
    ).filter(
        models.CatalogColumnLevelClassification.region == region
    ).delete()
    session.commit()


def delete_catalog_table_level_classification_by_database_region(database: str, region: str, type: str):
    session = get_session()
    session.query(models.CatalogTableLevelClassification).filter(
        models.CatalogTableLevelClassification.database_name == database,
        models.CatalogTableLevelClassification.database_type == type
    ).filter(
        models.CatalogTableLevelClassification.region == region
    ).delete()
    session.commit()


def delete_catalog_table_level_classification_by_database(database: str, region: str, type: str):
    session = get_session()
    session.query(models.CatalogTableLevelClassification).filter(
        models.CatalogTableLevelClassification.database_name == database,
        models.CatalogTableLevelClassification.database_type == type,
        models.CatalogTableLevelClassification.region == region
    ).delete()
    session.commit()


def delete_catalog_table_level_classification_by_ids(ids: list):
    session = get_session()
    session.query(models.CatalogTableLevelClassification).filter(
        models.CatalogTableLevelClassification.id.in_(ids)
    ).delete()
    session.commit()


def delete_catalog_database_level_classification_by_database_region(database: str, region: str, type: str):
    session = get_session()
    session.query(models.CatalogDatabaseLevelClassification).filter(
        models.CatalogDatabaseLevelClassification.database_name == database,
        models.CatalogDatabaseLevelClassification.database_type == type
    ).filter(
        models.CatalogDatabaseLevelClassification.region == region
    ).delete()
    session.commit()


def delete_catalog_column_level_classification_by_database_region(database: str, region: str, type: str):
    session = get_session()
    session.query(models.CatalogColumnLevelClassification).filter(
        models.CatalogColumnLevelClassification.database_name == database,
        models.CatalogDatabaseLevelClassification.database_type == type
    ).filter(
        models.CatalogColumnLevelClassification.region == region
    ).delete()
    session.commit()


def delete_catalog_column_level_classification_by_database(database: str, region: str, type: str):
    session = get_session()
    session.query(models.CatalogColumnLevelClassification).filter(
        models.CatalogColumnLevelClassification.database_name == database,
        models.CatalogColumnLevelClassification.database_type == type,
        models.CatalogColumnLevelClassification.region == region
    ).delete()
    session.commit()

def get_s3_database_summary():
    return (get_session()
            .query(
        func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label("database_total"),
        func.sum(models.CatalogDatabaseLevelClassification.object_count).label("object_total"),
        func.sum(models.CatalogDatabaseLevelClassification.size_key).label("size_total"))
            .filter(models.CatalogDatabaseLevelClassification.database_type.in_([DatabaseType.S3.value, DatabaseType.S3_UNSTRUCTURED.value]))
            .all()
            )


def get_rds_column_summary(database_type: str):
    return (get_session()
            .query(func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label("instance_total"),
                   func.sum(models.CatalogDatabaseLevelClassification.column_count).label("column_total"))
            .filter(models.CatalogDatabaseLevelClassification.database_type == database_type)
            .all()
            )


def get_catalog_table_level_classification_by_type(database_type: str):
    if database_type == DatabaseType.S3.value or database_type == DatabaseType.S3_UNSTRUCTURED.value:
        return (get_session()
                .query(models.CatalogTableLevelClassification)
                .filter(models.CatalogTableLevelClassification.database_type.in_([DatabaseType.S3.value, DatabaseType.S3_UNSTRUCTURED.value]))
                .all()
                )
    return (get_session()
            .query(models.CatalogTableLevelClassification)
            .filter(models.CatalogTableLevelClassification.database_type == database_type)
            .all()
            )


def get_catalog_table_count_by_type(database_type: str):
    if database_type == DatabaseType.S3.value or database_type == DatabaseType.S3_UNSTRUCTURED.value:
        return (get_session()
                .query(models.CatalogTableLevelClassification.classification,
                       func.count(models.CatalogTableLevelClassification.table_name).label("table_total"))
                .filter(models.CatalogTableLevelClassification.database_type.in_([DatabaseType.S3.value, DatabaseType.S3_UNSTRUCTURED.value]))
                .group_by(models.CatalogTableLevelClassification.classification)
                .all()
                )
    return (get_session()
            .query(models.CatalogTableLevelClassification.classification,
                   func.count(models.CatalogTableLevelClassification.table_name).label("table_total"))
            .filter(models.CatalogTableLevelClassification.database_type == database_type)
            .group_by(models.CatalogTableLevelClassification.classification)
            .all()
            )


def get_s3_database_summary_with_region():
    return (get_session()
            .query(models.CatalogDatabaseLevelClassification.region,
                   func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label(
                       "database_total"),
                   func.sum(models.CatalogDatabaseLevelClassification.object_count).label("object_total"),
                   func.sum(models.CatalogDatabaseLevelClassification.size_key).label("size_total"))
            .filter(models.CatalogDatabaseLevelClassification.database_type == DatabaseType.S3.value)
            .group_by(models.CatalogDatabaseLevelClassification.region)
            .all()
            )


def get_rds_database_summary_with_attr(database_type, attribute: str, need_merge: bool):
    if need_merge:
        database_list = (get_session()
                         .query(getattr(models.CatalogDatabaseLevelClassification, attribute),
                                func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label(
                                    "database_total"),
                                func.sum(models.CatalogDatabaseLevelClassification.object_count).label("object_total"),
                                func.sum(models.CatalogDatabaseLevelClassification.size_key).label("size_total"),
                                func.sum(models.CatalogDatabaseLevelClassification.table_count).label("table_total"),
                                func.sum(models.CatalogDatabaseLevelClassification.column_count).label("row_total"))
                         .filter(models.CatalogDatabaseLevelClassification.database_type == database_type)
                         .group_by(getattr(models.CatalogDatabaseLevelClassification, attribute))
                         .all()
                         )
        table_list = get_rds_table_summary_with_attr(attribute, database_type)
        table_dict = {table["privacy"]: table["table_total"] for table in table_list}
        # row_dict = {table["privacy"]: table["row_total"] for table in table_list}
        column_list = get_rds_column_summary_with_attr(attribute, database_type)
        row_dict = {table["privacy"]: table["row_total"] for table in column_list}
        updated_database_list = []
        for database in database_list:
            privacy = database[attribute]
            table_total = table_dict.get(privacy, 0)
            row_total = row_dict.get(privacy, 0)
            updated_database_list.append({
                attribute: privacy,
                "database_total": database["database_total"],
                "instance_total": database["database_total"],
                "row_total": row_total,
                "size_total": database["size_total"],
                "table_total": table_total
            })
        for entry in table_list:
            privacy = entry["privacy"]
            if privacy not in [item[attribute] for item in updated_database_list]:
                row_total = row_dict.get(privacy, 0)
                table_total = table_dict.get(privacy, 0)
                updated_database_list.append({
                    attribute: privacy,
                    "database_total": 0,
                    "instance_total": 0,
                    "row_total": row_total,
                    "size_total": 0,
                    "table_total": table_total
                })

        for entry in column_list:
            privacy = entry["privacy"]
            if privacy not in [item[attribute] for item in updated_database_list]:
                table_total = table_dict.get(privacy, 0)
                updated_database_list.append({
                    attribute: privacy,
                    "database_total": 0,
                    "instance_total": 0,
                    "row_total": entry["row_total"],
                    "size_total": 0,
                    "table_total": table_total
                })
        return updated_database_list
    else:
        return (get_session()
                .query(getattr(models.CatalogDatabaseLevelClassification, attribute),
                       func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label(
                           "instance_total"),
                       func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label(
                           "database_total"),
                       func.sum(models.CatalogDatabaseLevelClassification.table_count).label("table_total"),
                       func.sum(models.CatalogDatabaseLevelClassification.column_count).label("row_total"))
                .filter(models.CatalogDatabaseLevelClassification.database_type == database_type)
                .group_by(getattr(models.CatalogDatabaseLevelClassification, attribute))
                .all()
                )


def get_s3_database_summary_with_attr(database_type, attribute: str, need_merge: bool):
    if need_merge:
        database_list = (get_session()
                         .query(getattr(models.CatalogDatabaseLevelClassification, attribute),
                                func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label(
                                    "database_total"),
                                func.sum(models.CatalogDatabaseLevelClassification.object_count).label("object_total"),
                                func.sum(models.CatalogDatabaseLevelClassification.size_key).label("size_total"),
                                func.sum(models.CatalogDatabaseLevelClassification.table_count).label("table_total"))
                         .filter(models.CatalogDatabaseLevelClassification.database_type.in_([DatabaseType.S3.value,
                                                                                              DatabaseType.S3_UNSTRUCTURED.value]))
                         .group_by(getattr(models.CatalogDatabaseLevelClassification, attribute))
                         .all()
                         )
        table_list = get_s3_folder_summary_with_attr(attribute)
        table_dict = {table["privacy"]: table["table_total"] for table in table_list}
        obj_dict = {table["privacy"]: table["object_count"] for table in table_list}
        size_dict = {table["privacy"]: table["size_key"] for table in table_list}
        column_list = get_s3_object_summary_with_attr(attribute)
        updated_database_list = []
        for database in database_list:
            privacy = database[attribute]
            table_total = table_dict.get(privacy, 0)
            object_total = obj_dict.get(privacy, 0)
            size_total = size_dict.get(privacy, 0)
            updated_database_list.append({
                attribute: privacy,
                "database_total": database["database_total"],
                "object_total": object_total,
                # "object_total": database["object_total"],
                "size_total": size_total,
                "table_total": table_total
                # "table_total": database["table_total"]
            })
        for entry in table_list:
            privacy = entry["privacy"]
            if privacy not in [item[attribute] for item in updated_database_list]:
                object_total = obj_dict.get(privacy, 0)
                size_total = size_dict.get(privacy, 0)
                updated_database_list.append({
                    attribute: privacy,
                    "database_total": 0,
                    "object_total": object_total,
                    "size_total": size_total,
                    "table_total": entry["table_total"]
                })

        for entry in column_list:
            privacy = entry["privacy"]
            if privacy not in [item[attribute] for item in updated_database_list]:
                table_total = table_dict.get(privacy, 0)
                object_total = obj_dict.get(privacy, 0)
                size_total = size_dict.get(privacy, 0)
                updated_database_list.append({
                    attribute: privacy,
                    "database_total": 0,
                    "object_total": object_total,
                    "size_total": size_total,
                    "table_total": table_total
                })
        return updated_database_list
    else:
        return (get_session()
                .query(getattr(models.CatalogDatabaseLevelClassification, attribute),
                       func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label(
                           "database_total"),
                       func.sum(models.CatalogDatabaseLevelClassification.object_count).label("object_total"),
                       func.sum(models.CatalogDatabaseLevelClassification.size_key).label("size_total"),
                       func.sum(models.CatalogDatabaseLevelClassification.table_count).label("table_total"))
                .filter(models.CatalogDatabaseLevelClassification.database_type == database_type)
                .group_by(getattr(models.CatalogDatabaseLevelClassification, attribute))
                .all()
                )


def get_rds_table_summary_with_attr(attribute: str, database_type: str):
    return (get_session()
            .query(getattr(models.CatalogTableLevelClassification, attribute),
                   func.count(models.CatalogTableLevelClassification.table_name).label("table_total"),
                   # func.sum(models.CatalogTableLevelClassification.object_count).label("object_count"),
                   func.sum(models.CatalogTableLevelClassification.column_count).label("row_total"),
                   func.sum(models.CatalogTableLevelClassification.size_key).label("size_key"))
            .filter(models.CatalogTableLevelClassification.database_type == database_type)
            .group_by(getattr(models.CatalogTableLevelClassification, attribute))
            .all()
            )


def get_s3_folder_summary_with_attr(attribute: str):
    return (get_session()
            .query(getattr(models.CatalogTableLevelClassification, attribute),
                   func.count(models.CatalogTableLevelClassification.table_name).label("table_total"),
                   func.sum(models.CatalogTableLevelClassification.object_count).label("object_count"),
                   func.sum(models.CatalogTableLevelClassification.size_key).label("size_key"))
            .filter(models.CatalogTableLevelClassification.database_type.in_([DatabaseType.S3.value,
                                                                              DatabaseType.S3_UNSTRUCTURED.value]))
            .group_by(getattr(models.CatalogTableLevelClassification, attribute))
            .all()
            )


def get_rds_column_summary_with_attr(attribute: str, database_type: str):
    # row_total -> column_total
    return (get_session()
            .query(getattr(models.CatalogColumnLevelClassification, attribute),
                   func.count(models.CatalogColumnLevelClassification.column_name).label("row_total"))
            .filter(models.CatalogColumnLevelClassification.database_type == database_type)
            .group_by(getattr(models.CatalogColumnLevelClassification, attribute))
            .all()
            )


def get_s3_object_summary_with_attr(attribute: str):
    # object_total -> column_total
    return (get_session()
            .query(getattr(models.CatalogColumnLevelClassification, attribute),
                   func.count(models.CatalogColumnLevelClassification.column_name).label("object_total"))
            .filter(models.CatalogColumnLevelClassification.database_type.in_([DatabaseType.S3.value,
                                                                              DatabaseType.S3_UNSTRUCTURED.value]))
            .group_by(getattr(models.CatalogColumnLevelClassification, attribute))
            .all()
            )


def delete_catalog_column_level_classification_by_table_name(
        account_id: str, region: str, database_type: str, database_name: str, table_name: str, column_names: list):
    session = get_session()
    query = session.query(models.CatalogColumnLevelClassification).filter(
        models.CatalogColumnLevelClassification.account_id == account_id
    )
    query = query.filter(
        models.CatalogColumnLevelClassification.region == region
    )
    query = query.filter(
        models.CatalogColumnLevelClassification.database_type == database_type
    )
    query = query.filter(
        models.CatalogColumnLevelClassification.database_name == database_name
    )
    query = query.filter(
        models.CatalogColumnLevelClassification.table_name == table_name
    )
    if column_names is not None:
        query = query.filter(
            ~models.CatalogColumnLevelClassification.column_name.in_(column_names)
        )
    query.delete()
    session.commit()


def update_catalog_column_comments(
        id: int,
        comments: str,
):
    update_dict = {"comments": (comments,)}
    size = (
        get_session()
        .query(models.CatalogColumnLevelClassification)
        .filter(models.CatalogColumnLevelClassification.id == id)
        .update(update_dict)
    )
    get_session().commit()
    return size > 0


def update_catalog_database_labels(
        id: int,
        labels: list,
):
    labels_str = ','.join(str(i) for i in labels)
    update_dict = {"label_ids": (labels_str,)}
    size = (
        get_session()
        .query(models.CatalogDatabaseLevelClassification)
        .filter(models.CatalogDatabaseLevelClassification.id == id)
        .update(update_dict)
    )
    get_session().commit()
    return size > 0


def update_catalog_table_labels(
        id: int,
        labels: list,
):
    labels_str = ','.join(str(i) for i in labels)
    update_dict = {"label_ids": (labels_str,)}
    size = (
        get_session()
        .query(models.CatalogTableLevelClassification)
        .filter(models.CatalogTableLevelClassification.id == id)
        .update(update_dict)
    )
    get_session().commit()
    return size > 0


def get_export_catalog_data():
    return get_session().query(models.CatalogColumnLevelClassification.account_id,
                               models.CatalogColumnLevelClassification.region,
                               models.CatalogColumnLevelClassification.database_type,
                               models.CatalogColumnLevelClassification.database_name,
                               models.CatalogColumnLevelClassification.table_name,
                               models.CatalogColumnLevelClassification.column_name,
                               models.CatalogColumnLevelClassification.column_path,
                               models.CatalogColumnLevelClassification.identifier,
                               models.CatalogColumnLevelClassification.column_value_example,
                               models.CatalogDatabaseLevelClassification.label_ids,
                               models.CatalogTableLevelClassification.label_ids,
                               models.CatalogColumnLevelClassification.comments,
                               ).join(models.CatalogTableLevelClassification,
                                      models.CatalogColumnLevelClassification.account_id == models.CatalogTableLevelClassification.account_id
                                      ).join(models.CatalogDatabaseLevelClassification,
                                             models.CatalogColumnLevelClassification.account_id == models.CatalogDatabaseLevelClassification.account_id
                                             ).filter(
        and_(models.CatalogColumnLevelClassification.region == models.CatalogTableLevelClassification.region,
             models.CatalogColumnLevelClassification.database_type == models.CatalogTableLevelClassification.database_type,
             models.CatalogColumnLevelClassification.database_name == models.CatalogTableLevelClassification.database_name,
             models.CatalogColumnLevelClassification.table_name == models.CatalogTableLevelClassification.table_name,
             models.CatalogColumnLevelClassification.region == models.CatalogDatabaseLevelClassification.region,
             models.CatalogColumnLevelClassification.database_type == models.CatalogDatabaseLevelClassification.database_type,
             models.CatalogColumnLevelClassification.database_name == models.CatalogDatabaseLevelClassification.database_name)
    ).distinct(models.CatalogColumnLevelClassification.database_type,
               models.CatalogColumnLevelClassification.account_id,
               models.CatalogColumnLevelClassification.region,
               models.CatalogColumnLevelClassification.database_name,
               models.CatalogColumnLevelClassification.table_name,
               models.CatalogColumnLevelClassification.column_name,
               models.CatalogColumnLevelClassification.identifier,
               models.CatalogColumnLevelClassification.column_value_example,
               models.CatalogTableLevelClassification.label_ids,
               models.CatalogDatabaseLevelClassification.label_ids,
               models.CatalogColumnLevelClassification.comments).all()


def get_catalog_summay_by_provider_region(region: str):
    return (get_session()
            .query(models.CatalogDatabaseLevelClassification.database_type,
                   func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label(
                       "database_total"),
                   func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label(
                       "instance_total"),
                   func.sum(models.CatalogDatabaseLevelClassification.object_count).label("object_total"),
                   func.sum(models.CatalogDatabaseLevelClassification.size_key).label("size_total"),
                   func.sum(models.CatalogDatabaseLevelClassification.table_count).label("table_total"),
                   func.sum(models.CatalogDatabaseLevelClassification.column_count).label("row_total"))
            .filter(models.CatalogDatabaseLevelClassification.region == region)
            .group_by(models.CatalogDatabaseLevelClassification.database_type)
            .all()
            )
