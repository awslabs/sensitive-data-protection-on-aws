from fastapi import Depends, APIRouter
from . import crud, schemas, service, service_dashboard
from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from common.query_condition import QueryCondition
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from common.enum import (
    CatalogDashboardAttribute
)


router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get(
    "/get-columns-by-table",
    response_model=BaseResponse[Page[schemas.CatalogColumnLevelClassification]],
)
@inject_session
def get_catalog_column_by_params(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
    table_name: str,
    params: Params = Depends(),
):
    catalog = paginate(
        crud.get_catalog_column_level_classification_by_table(
            account_id, region, database_type, database_name, table_name
        ),
        params,
    )
    return catalog


@router.get(
    "/get-tables-by-database",
    response_model=BaseResponse[Page[schemas.CatalogTableLevelClassification]],
)
@inject_session
def get_catalog_tables_by_database(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
    params: Params = Depends(),
):
    catalog = paginate(
        crud.get_catalog_table_level_classification_by_database(
            account_id, region, database_type, database_name
        ),
        params,
    )
    return catalog


@router.get(
    "/get-databases-by-account-region-type",
    response_model=BaseResponse[Page[schemas.CatalogDatabaseLevelClassification]],
)
@inject_session
def get_catalog_database_by_params(
    account_id: str, region: str, database_type: str, params: Params = Depends()
):
    catalog = paginate(
        crud.get_catalog_database_level_classification_by_params(
            account_id, region, database_type
        ),
        params,
    )
    return catalog


@router.post(
    "/list-databases-by-type",
    response_model=BaseResponse[Page[schemas.CatalogDatabaseLevelClassification]],
)
@inject_session
# Removed database_type param because of it can be added in query condition
def get_catalog_database_by_type(condition: QueryCondition):
    catalog = crud.get_catalog_database_level_classification_by_type(condition)
    return paginate(catalog, Params(
        size=condition.size,
        page=condition.page,
    ))

@router.get(
    "/get-tables-by-database-identifier",
    response_model=BaseResponse[Page[schemas.CatalogTableLevelClassification]],
)
@inject_session
def get_catalog_table_by_database_identifier(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
    identifier: str,
    params: Params = Depends(),
):
    catalog = paginate(
        crud.get_catalog_table_level_classification_by_database_identifier(
            account_id, region, database_type, database_name, identifier
        ),
        params,
    )
    return catalog


@router.get("/get-database-identifiers", response_model=BaseResponse)
@inject_session
def get_database_identifiers(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
):
    return service.get_database_identifiers_from_tables(
        account_id, region, database_type, database_name
    )


@router.get("/get-s3-sample-objects", response_model=BaseResponse)
@inject_session
def get_s3_sample_objects(
    account_id: str,
    region: str,
    s3_location: str,
    limit: int,
):
    return service.list_s3_sample_objects(account_id, region, s3_location, limit)


@router.get("/get-rds-table-sample-records", response_model=BaseResponse)
@inject_session
def get_rds_table_sample_records(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
    table_name: str,
):
    return service.get_rds_table_sample_records(
        account_id, region, database_type, database_name, table_name
    )


@router.patch("/update-catalog-database", response_model=BaseResponse)
@inject_session
def update_catalog_database_level_classification(
    database: schemas.CatalogDatabaseLevelClassification,
):
    return crud.update_catalog_database_level_classification(database)


@router.patch("/update-catalog-table", response_model=BaseResponse)
@inject_session
def update_catalog_table_level_classification(
    table: schemas.CatalogTableLevelClassification,
):
    return crud.update_catalog_table_level_classification(table)


@router.patch("/update-catalog-database-labels", response_model=BaseResponse)
@inject_session
def update_catalog_database_labels(
    id: int,
    labels: list,
    modify_by: str,
):
    return crud.update_catalog_database_labels(id, labels, modify_by)


@router.patch("/update-catalog-tabel-labels", response_model=BaseResponse)
@inject_session
def update_catalog_tabel_labels(
    id: int,
    labels: list,
    modify_by: str,
):
    return crud.update_catalog_tabel_labels(id, labels, modify_by)


@router.patch("/update-catalog-column-comments", response_model=BaseResponse)
@inject_session
def update_catalog_column_comments(
    id: int,
    comments: str,
    modify_by: str,
):
    return crud.update_catalog_column_comments(id, comments, modify_by)


@router.patch("/update-catalog-column", response_model=BaseResponse)
@inject_session
def update_catalog_column_level_classification(
    column: schemas.CatalogColumnLevelClassification,
):
    return service.update_catalog_column_level_classification(column)


@router.post("/sync-crawler-results", response_model=BaseResponse)
@inject_session
def sync_crawler_results(catalog_sync: schemas.CatalogCrawlerResultSync):
    return service.sync_crawler_result(
        catalog_sync.account_id,
        catalog_sync.region,
        catalog_sync.database_type,
        catalog_sync.database_name,
    )


@router.post("/sync-job-detection-results", response_model=BaseResponse)
@inject_session
def sync_job_detection_result(catalog_detection: schemas.CatalogJobResultDetection):

    return service.sync_job_detection_result(
        catalog_detection.account_id,
        catalog_detection.region,
        catalog_detection.database_type,
        catalog_detection.database_name,
        catalog_detection.job_run_id,
    )


@router.get("/get-database-property", response_model=BaseResponse)
@inject_session
def get_database_property(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
):
    return service.get_database_prorpery(account_id, region, database_type, database_name)


@router.get("/dashboard/agg-data-source-summary", response_model=BaseResponse)
@inject_session
def agg_data_source_summary():

    return service_dashboard.agg_data_source_summary()


@router.get("/dashboard/agg-catalog-summay", response_model=BaseResponse)
@inject_session
def agg_catalog_summay(database_type: str):

    return service_dashboard.agg_catalog_summay(database_type)


@router.get("/dashboard/agg-catalog-summay-by-region", response_model=BaseResponse)
@inject_session
def agg_catalog_summary_by_region(database_type: str):

    return service_dashboard.agg_catalog_summary_by_attr(database_type, CatalogDashboardAttribute.REGION.value)


@router.get("/dashboard/agg-catalog-summay-by-privacy", response_model=BaseResponse)
@inject_session
def agg_catalog_summary_by_privacy(database_type: str):

    return service_dashboard.agg_catalog_summary_by_attr(database_type, CatalogDashboardAttribute.PRIVACY.value)


@router.get("/dashboard/agg-catalog-top-n", response_model=BaseResponse)
@inject_session
def agg_catalog_top_n(database_type: str, top_n: int):

    return service_dashboard.agg_catalog_data_source_top_n(database_type, top_n)


@router.get("/dashboard/agg-catalog-summary-by-modifier", response_model=BaseResponse)
@inject_session
def agg_catagg_catalog_summary_by_modifieralog_top_n(database_type: str):

    return service_dashboard.agg_catalog_summary_by_modifier(database_type)


@router.post("/dashboard/get-database-by-identifier",
            response_model=BaseResponse)
@inject_session
def get_database_property(
    condition: QueryCondition
):  
    result_list = service_dashboard.get_database_by_identifier_paginate(condition)
    response = {"items": result_list, 
                "total": len(result_list), 
                "page": condition.page, 
                "size": condition.size}
    return response