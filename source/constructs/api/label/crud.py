import db.models_label as models
from tools.pydantic_tool import parse_pydantic_schema
import tools.mytime as mytime
from db.database import get_session
from . import schemas
from common.constant import const
from common.enum import (
    LabelState,
    LabelClassification,
    LabelType,
    LabelStyleType
)
from common.query_condition import QueryCondition, query_with_condition
from itertools import count
from sqlalchemy import func, distinct


def get_label_by_name(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
    table_name: str,
):
    result = (
        get_session()
        .query(models.Label)
        .filter(models.CatalogColumnLevelClassification.account_id == account_id)
        .filter(models.CatalogColumnLevelClassification.region == region)
        .filter(models.CatalogColumnLevelClassification.database_type == database_type)
        .filter(models.CatalogColumnLevelClassification.database_name == database_name)
        .filter(models.CatalogColumnLevelClassification.table_name == table_name)
        .order_by(models.CatalogColumnLevelClassification.column_order_num)
    )
    return result


def get_catalog_labels(
    label_name: str,
):
    result = (
        get_session()
        .query(models.Label)
        .filter(models.Label.classification == LabelClassification.CATALOG)
        .filter(models.Label.state == LabelState.ONLINE)
        .filter(
            models.Label.label_name.ilike(
                "%" + label_name + "%"
            )
        )
    )
    return result


def get_catalog_labels_by_page(
    label_name: str,
):
    result = (
        get_session()
        .query(models.Label)
        .filter(models.Label.classification == LabelClassification.CATALOG)
        .filter(models.Label.state == LabelState.ONLINE)
        .filter(
            models.Label.label_name.ilike(
                "%" + label_name + "%"
            )
        )
    )
    return result

def get_labels_by_name(
    label_name: str,
):
    result = (
        get_session()
        .query(models.Label)
        .filter(
            models.Label.label_name.ilike(
                "%" + label_name + "%"
            )
        )
    )
    return result


def get_catalog_table_level_classification_by_database_identifier(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
    identifier: str,
):
    result = (
        get_session()
        .query(models.CatalogTableLevelClassification)
        .filter(models.CatalogTableLevelClassification.account_id == account_id)
        .filter(models.CatalogTableLevelClassification.region == region)
        .filter(models.CatalogTableLevelClassification.database_type == database_type)
        .filter(models.CatalogTableLevelClassification.database_name == database_name)
        .filter(
            models.CatalogTableLevelClassification.identifiers.ilike(
                "%" + identifier + "%"
            )
        )
    )
    return result



def get_catalog_table_count_by_type(database_type: str):
    return (get_session()
    .query(models.CatalogTableLevelClassification.classification, func.count(models.CatalogTableLevelClassification.table_name).label("table_total"))
    .filter(models.CatalogTableLevelClassification.database_type == database_type)
    .group_by(models.CatalogTableLevelClassification.classification)
    .all()
    )

def get_rds_database_summary_with_attr(attribute: str):
    return (get_session()
    .query(getattr(models.CatalogDatabaseLevelClassification, attribute),
        func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label("instance_total"),
        func.count(distinct(models.CatalogDatabaseLevelClassification.database_name)).label("database_total"),
        func.sum(models.CatalogDatabaseLevelClassification.table_count).label("table_total"))
    .filter(models.CatalogDatabaseLevelClassification.database_type == DatabaseType.RDS.value)
    .group_by(getattr(models.CatalogDatabaseLevelClassification, attribute))
    .all()
    )