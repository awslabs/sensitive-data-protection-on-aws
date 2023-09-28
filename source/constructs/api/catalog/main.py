from fastapi import Depends, APIRouter
from . import crud, schemas, service, service_dashboard
from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from common.query_condition import QueryCondition
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi.responses import RedirectResponse
from catalog.sample_service import gen_s3_temp_uri
from common.constant import const
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
    # response_model=BaseResponse[Page[schemas.CatalogTableLevelClassification]],
)
@inject_session
def get_catalog_tables_by_database(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
    params: Params = Depends(),
):
    catalogs = crud.get_catalog_table_level_classification_by_database(
            account_id, region, database_type, database_name
        )
    rlt = paginate(catalogs, params)
    service.fill_catalog_labels(rlt.items)
    return rlt


@router.post(
    "/search-tables-by-database",
    # response_model=BaseResponse[Page[schemas.CatalogTableLevelClassification]],
)
@inject_session
def search_catalog_tables_by_database(condition: QueryCondition):
    catalogs = crud.search_catalog_table_level_classification_by_database(condition)
    rlt = paginate(catalogs, Params(
        size=condition.size,
        page=condition.page,
    ))
    service.fill_catalog_labels(rlt.items)
    return rlt


@router.post(
    "/search-tables",
    # response_model=BaseResponse[Page[schemas.CatalogTableLevelClassification]],
)
@inject_session
def search_catalog_tables(condition: QueryCondition):
    catalogs = crud.search_catalog_table_level_classification(condition)
    rlt = paginate(catalogs, Params(
        size=condition.size,
        page=condition.page,
    ))
    service.fill_catalog_labels(rlt.items)
    return rlt


@router.post(
    "/gen-s3-presigned-url-by-id"
)
@inject_session
def gen_s3_presigned_url_by_table_id(table_id: str):
    catalog = crud.get_catalog_table_level_classification_by_id(table_id)
    if catalog:
        if catalog.storage_location:
            bucket_name, key = service.__get_s3_bucket_key_from_location(catalog.storage_location)
            pre_url = gen_s3_temp_uri(bucket_name, key)
            return pre_url
    return ""


@router.get(
    "/get-databases-by-account-region-type",
    # response_model=BaseResponse[Page[schemas.CatalogDatabaseLevelClassification]],
)
@inject_session
def get_catalog_database_by_params(
    account_id: str, region: str, database_type: str, params: Params = Depends()
):
    catalogs = crud.get_catalog_database_level_classification_by_params(
            account_id, region, database_type
        )

    rlt = paginate(catalogs, params, )
    service.fill_catalog_labels(rlt.items)
    return rlt


@router.post(
    "/list-databases-by-type",
    # response_model=BaseResponse[Page[schemas.CatalogDatabaseLevelClassification]],
)
@inject_session
# Removed database_type param because of it can be added in query condition
def get_catalog_database_by_type(condition: QueryCondition):
    catalogs = crud.get_catalog_database_level_classification_by_type(condition)
    rlt = paginate(catalogs, Params(
        size=condition.size,
        page=condition.page,
    ))
    service.fill_catalog_labels(rlt.items)
    return rlt  

@router.get(
    "/get-tables-by-database-identifier",
    # response_model=BaseResponse[Page[schemas.CatalogTableLevelClassification]],
)
@inject_session
def get_catalog_table_by_database_identifier(
    account_id: str,
    region: str,
    database_type: str,
    database_name: str,
    table_name: str,
    identifier: str,
    params: Params = Depends(),
):
    catalogs = crud.get_catalog_table_level_classification_by_database_identifier(
            account_id, region, database_type, database_name, table_name, identifier
        )

    rlt = paginate(catalogs, params, )
    service.fill_catalog_labels(rlt.items)
    return rlt


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


@router.get("/get-s3-folder-sample-data", response_model=BaseResponse)
@inject_session
def get_s3_folder_sample_data(
    account_id: str,
    region: str,
    bucket_name: str,
    resource_name: str,
    refresh: bool,
):
    return service.get_s3_folder_sample_data(account_id, region, bucket_name, resource_name, refresh)


@router.get("/get-rds-database-sample-data", response_model=BaseResponse)
@inject_session
def get_database_sample_data(
    account_id: str,
    region: str,
    database_name: str,
    table_name: str,
    refresh: bool,
):
    return service.get_database_sample_data(account_id, region, database_name, table_name, refresh)


@router.patch("/update-catalog-database", response_model=BaseResponse)
@inject_session
def update_catalog_database_level_classification(
    database: schemas.CatalogDatabaseLevelClassification,
):
    database.manual_tag = const.MANUAL
    return crud.update_catalog_database_level_classification(database)


@router.patch("/update-catalog-table", response_model=BaseResponse)
@inject_session
def update_catalog_table_level_classification(
    table: schemas.CatalogTableLevelClassification,
):
    table.manual_tag = const.MANUAL
    return crud.update_catalog_table_level_classification(table)


@router.patch("/update-catalog-database-labels", response_model=BaseResponse)
@inject_session
def update_catalog_database_labels(update_param: schemas.CatalogUpdateLabels):
    return crud.update_catalog_database_labels(update_param.id, update_param.labels)


@router.patch("/update-catalog-table-labels", response_model=BaseResponse)
@inject_session
def update_catalog_table_labels(update_param: schemas.CatalogUpdateLabels):
    return crud.update_catalog_table_labels(update_param.id, update_param.labels)


@router.patch("/update-catalog-column-comments", response_model=BaseResponse)
@inject_session
def update_catalog_column_comments(
    id: int,
    comments: str,
):
    return crud.update_catalog_column_comments(id, comments)


@router.patch("/update-catalog-column", response_model=BaseResponse)
@inject_session
def update_catalog_column_level_classification(
    column: schemas.CatalogColumnLevelClassification,
):
    column.manual_tag = const.MANUAL
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


@router.get("/get-table-property", response_model=BaseResponse)
@inject_session
def get_folder_property(
    table_id: str,
):
    return service.get_table_property(table_id)


@router.get("/dashboard/agg-data-source-summary", response_model=BaseResponse)
@inject_session
def agg_data_source_summary(provider_id: str):

    return service_dashboard.agg_data_source_summary(provider_id)


@router.get("/dashboard/agg-catalog-summay", response_model=BaseResponse)
@inject_session
def agg_catalog_summay(database_type: str):

    return service_dashboard.agg_catalog_summay(database_type)


@router.get("/dashboard/agg-catalog-summay-by-region", response_model=BaseResponse)
@inject_session
def agg_catalog_summary_by_region(database_type: str):

    return service_dashboard.agg_catalog_summary_by_attr(database_type, CatalogDashboardAttribute.REGION.value, False)


@router.get("/dashboard/agg-catalog-summay-by-provider-region", response_model=BaseResponse)
@inject_session
def get_catalog_summay_by_provider_region(provider_id: int, region: str):
    return service_dashboard.get_catalog_summay_by_provider_region(provider_id, region)


@router.get("/dashboard/agg-catalog-summay-by-privacy", response_model=BaseResponse)
@inject_session
def agg_catalog_summary_by_privacy(database_type: str):

    return service_dashboard.agg_catalog_summary_by_attr(database_type, CatalogDashboardAttribute.PRIVACY.value, True)


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

@router.get("/data_catalog_export_url/{fileType}/{timeStr}", response_model=BaseResponse[str])
@inject_session
def get_catalog_export_url(fileType: str, timeStr: str):
    url = service.get_catalog_export_url(fileType, timeStr)
    return url


@router.get("/clear_s3_object/{timeStr}", response_model=BaseResponse[str])
@inject_session
def clear_s3_object(timeStr: str):
    return service.clear_s3_object(timeStr)
