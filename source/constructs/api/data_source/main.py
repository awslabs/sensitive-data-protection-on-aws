from fastapi import APIRouter
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate

from common.query_condition import QueryCondition
from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from . import crud, schemas, service

router = APIRouter(prefix="/data-source", tags=["data-source"])


@router.post("/list-s3", response_model=BaseResponse[Page[schemas.S3BucketSource]])
@inject_session
def list_s3_buckets(condition: QueryCondition):
    sources = crud.list_s3_bucket_source(condition)
    if sources is None:
        return None
    return paginate(sources, Params(
        size=condition.size,
        page=condition.page,
    ))


@router.post("/list-rds", response_model=BaseResponse[Page[schemas.RdsInstanceSource]])
@inject_session
def list_rds_instances(condition: QueryCondition):
    instances = crud.list_rds_instance_source(condition)
    if instances is None:
        return None
    return paginate(instances, Params(
        size=condition.size,
        page=condition.page,
    ))

@router.post("/list-glue-database", response_model=BaseResponse[Page[schemas.SourceGlueDatabaseFullInfo]])
@inject_session
def list_glue_databases(condition: QueryCondition):
    instances = crud.list_glue_database(condition)
    if instances is None:
        return None
    return paginate(instances, Params(
        size=condition.size,
        page=condition.page,
    ))

@router.post("/list-jdbc", response_model=BaseResponse[Page[schemas.JDBCInstanceSourceFullInfo]])
@inject_session
def list_jdbc_instances(provider_id: int, condition: QueryCondition):
    instances = crud.list_jdbc_instance_source(provider_id, condition)
    if instances is None:
        return None
    return paginate(instances, Params(
        size=condition.size,
        page=condition.page,
    ))


@router.post("/sync-s3", response_model=BaseResponse)
@inject_session
def sync_s3_connection(s3: schemas.SourceS3Connection):
    if s3.bucket == '*':
        return service.sync_s3_connection_by_region(
            s3.account_id,
            s3.region
        )
    else:
        return service.sync_s3_connection(
            s3.account_id,
            s3.region,
            s3.bucket
        )


@router.post("/delete-s3", response_model=BaseResponse)
@inject_session
def delete_s3_connection(s3: schemas.SourceDeteteS3Connection):
    return service.delete_s3_connection(
        s3.account_id,
        s3.region,
        s3.bucket
    )

@router.post("/disconnect-delete-catalog-jdbc", response_model=BaseResponse)
@inject_session
def disconnect_and_delete_catalog_jdbc_connection(jdbc: schemas.SourceDeteteJDBCConnection):
    return service.delete_jdbc_connection(
        int(jdbc.account_provider),
        jdbc.account_id,
        jdbc.region,
        jdbc.instance
    )

@router.post("/hide-s3", response_model=BaseResponse)
@inject_session
def hide_s3_connection(s3: schemas.SourceDeteteS3Connection):
    return service.hide_s3_connection(
        s3.account_id,
        s3.region,
        s3.bucket
    )

@router.post("/delete-catalog-s3", response_model=BaseResponse)
@inject_session
def delete_catalog_s3_connection(s3: schemas.SourceDeteteS3Connection):
    return service.delete_s3_connection(
        account=s3.account_id,
        region=s3.region,
        bucket=s3.bucket,
        delete_catalog_only=True
    )

@router.post("/disconnect-delete-catalog-s3", response_model=BaseResponse)
@inject_session
def disconnect_and_delete_catalog_s3_connection(s3: schemas.SourceDeteteS3Connection):
    return service.delete_s3_connection(
        s3.account_id,
        s3.region,
        s3.bucket
    )

@router.post("/delete-rds", response_model=BaseResponse)
@inject_session
def delete_rds_connection(rds: schemas.SourceDeteteRdsConnection):
    return service.delete_rds_connection(
        rds.account_id,
        rds.region,
        rds.instance,
        delete_catalog_only=True
    )

@router.post("/delete-catalog-rds", response_model=BaseResponse)
@inject_session
def delete_catalog_rds_connection(rds: schemas.SourceDeteteRdsConnection):
    return service.delete_rds_connection(
        rds.account_id,
        rds.region,
        rds.instance,
        delete_catalog_only=True
    )

@router.post("/disconnect-delete-catalog-rds", response_model=BaseResponse)
@inject_session
def disconnect_and_delete_catalog_rds_connection(rds: schemas.SourceDeteteRdsConnection):
    return service.delete_rds_connection(
        rds.account_id,
        rds.region,
        rds.instance
    )

@router.post("/hide-rds", response_model=BaseResponse)
@inject_session
def hide_rds_connection(rds: schemas.SourceDeteteRdsConnection):
    return service.hide_rds_connection(
        rds.account_id,
        rds.region,
        rds.instance
    )


@router.post("/sync-rds", response_model=BaseResponse)
@inject_session
def sync_rds_connection(rds: schemas.SourceRdsConnection):
    return service.sync_rds_connection(
        rds.account_id,
        rds.region,
        rds.instance,
        rds.rds_user,
        rds.rds_password,
        rds.rds_secret
    )

@router.post("/delete-glue-database", response_model=BaseResponse)
@inject_session
def delete_glue_database(glueDatabase: schemas.SourceDeteteGlueDatabase):
    return service.delete_glue_database(
        int(glueDatabase.account_provider),
        glueDatabase.account_id,
        glueDatabase.region,
        glueDatabase.name
    )

@router.post("/hide-glue-database", response_model=BaseResponse)
@inject_session
def hide_glue_database(glueDatabase: schemas.SourceDeteteGlueDatabase):
    return service.hide_glue_database(
        int(glueDatabase.account_provider),
        glueDatabase.account_id,
        glueDatabase.region,
        glueDatabase.name
    )



@router.post("/sync-glue-database", response_model=BaseResponse)
@inject_session
def sync_glue_database(glueDatabase: schemas.SourceGlueDatabaseBase):
    return service.sync_glue_database(
        glueDatabase.account_id,
        glueDatabase.region,
        glueDatabase.glue_database_name
    )

@router.post("/delete-jdbc", response_model=BaseResponse)
@inject_session
def delete_jdbc_connection(jdbc: schemas.SourceDeteteJDBCConnection):
    return service.delete_jdbc_connection(
        int(jdbc.account_provider),
        jdbc.account_id,
        jdbc.region,
        jdbc.instance
    )

@router.post("/delete-catalog-jdbc", response_model=BaseResponse)
@inject_session
def delete_catalog_jdbc_connection(jdbc: schemas.SourceDeteteJDBCConnection):
    return service.delete_jdbc_connection(
        int(jdbc.account_provider),
        jdbc.account_id,
        jdbc.region,
        jdbc.instance,
        delete_catalog_only=True
    )

@router.post("/hide-jdbc", response_model=BaseResponse)
@inject_session
def hide_jdbc_connection(jdbc: schemas.SourceDeteteJDBCConnection):
    return service.hide_jdbc_connection(
        int(jdbc.account_provider),
        jdbc.account_id,
        jdbc.region,
        jdbc.instance
    )

@router.post("/sync-jdbc", response_model=BaseResponse)
@inject_session
def sync_jdbc_connection(jdbc: schemas.JDBCInstanceSourceBase):
    return service.sync_jdbc_connection(jdbc)

@router.post("/refresh", response_model=BaseResponse)
@inject_session
def refresh_data_source(type: schemas.NewDataSource):
    service.refresh_data_source(
        type.provider_id,
        type.accounts,
        type.type
    )
    return True


@router.get("/coverage", response_model=BaseResponse[schemas.SourceCoverage])
@inject_session
def get_data_source_coverage(provider_id: int):
    return service.get_data_source_coverage(provider_id)


@router.post("/list-account", response_model=BaseResponse[Page[schemas.Account]])
@inject_session
def list_accounts(condition: QueryCondition):
    accounts = crud.list_accounts(condition)
    if accounts is None:
        return None
    return paginate(accounts, Params(
        size=condition.size,
        page=condition.page,
    ))


@router.post("/reload_organization_account", response_model=BaseResponse,
             description="Retrieve stacksets in the delegate account, and refresh account list by stackset status")
@inject_session
def reload_organization_account(account: schemas.SourceOrgAccount):
    return service.reload_organization_account(account.organization_management_account_id)


@router.post("/add_account", response_model=BaseResponse,
             description="Add individual account")
@inject_session
def add_account(account: schemas.SourceNewAccount):
    return service.add_account(account)

@router.post("/delete_account", response_model=BaseResponse,
             description="Delete individual account")
@inject_session
def delete_account(account: schemas.SourceNewAccount):
    return service.delete_account(account.account_provider, account.account_id, account.region)

@router.get("/secrets", response_model=BaseResponse, description="List Secrets for RDS")
@inject_session
def get_secrets(provider: str, account: str, region: str):
    return service.get_secrets(int(provider), account, region)

@router.get("/admin_account_info", response_model=BaseResponse[schemas.AdminAccountInfo])
@inject_session
def get_admin_account_info():
    return service.get_admin_account_info()

@router.post("/import-glue-database", response_model=BaseResponse)
@inject_session
def import_glue_database(glueDataBase: schemas.SourceGlueDatabaseBase):
    return service.import_glue_database(glueDataBase)

@router.post("/add-jdbc-conn", response_model=BaseResponse)
@inject_session
def add_jdbc_conn(jdbcConn: schemas.JDBCInstanceSource):
    return service.add_jdbc_conn(jdbcConn)

@router.post("/update-jdbc-conn", response_model=BaseResponse)
@inject_session
def update_jdbc_conn(jdbcConn: schemas.JDBCInstanceSource):
    return service.update_jdbc_conn(jdbcConn)

@router.post("/import-jdbc-conn", response_model=BaseResponse)
@inject_session
def import_jdbc_conn(jdbcConn: schemas.JDBCInstanceSourceBase):
    return service.import_jdbc_conn(jdbcConn)

@router.post("/query-glue-connections", response_model=BaseResponse)
@inject_session
def query_glue_connections(account: schemas.AccountInfo):
    return service.query_glue_connections(account)

@router.post("/query-glue-databases", response_model=BaseResponse)
@inject_session
def query_glue_databases(account: schemas.AdminAccountInfo):
    return service.query_glue_databases(account)

@router.post("/query-account-network", response_model=BaseResponse)
@inject_session
def query_account_network(account: schemas.AccountInfo):
    return service.query_account_network(account)

@router.post("/test-glue-conn", response_model=BaseResponse)
@inject_session
def test_glue_conn(account: str, connection: str):
    return service.test_glue_conn(account, connection)

# @router.post("/test", response_model=BaseResponse)
# @inject_session
# def test_glue_conn(jdbc_conn_param: schemas.JDBCInstanceSourceUpdateBase):
#     jdbc_conn_param.connection_status = "SUCCESS"
#     return crud.set_jdbc_instance_connection_status(jdbc_conn_param)


@router.post("/test-jdbc-conn", response_model=BaseResponse)
@inject_session
def test_jdbc_conn(jdbc_conn_param: schemas.JDBCInstanceSourceBase):
    return service.test_jdbc_conn(jdbc_conn_param)

@router.get("/dashboard/agg-data-location-list", response_model=BaseResponse)
@inject_session
def get_data_location_list():
    return service.list_data_location()

# @router.get("/dashboard/test_insert", response_model=BaseResponse)
# @inject_session
# def test_insert():
#     return crud.test_insert()

@router.get("/query-regions-by-provider", response_model=BaseResponse)
@inject_session
def query_regions_by_provider(provider_id: str):
    return service.query_regions_by_provider(provider_id)

@router.post("/query-full-provider-infos", response_model=BaseResponse)
@inject_session
def query_full_provider_infos():
    return service.query_full_provider_resource_infos()


@router.post("/list-providers", response_model=BaseResponse)
@inject_session
def list_providers():
    return service.list_providers()

@router.post("/list-buckets", response_model=BaseResponse)
@inject_session
def list_buckets(account: schemas.AccountInfo):
    return service.list_buckets(account)

@router.post("/query-connection-detail", response_model=BaseResponse)
@inject_session
def query_connection_detail(account: schemas.JDBCInstanceSourceBase):
    return service.query_connection_detail(account)


@router.post("/jdbc-databases", response_model=BaseResponse[list[str]])
@inject_session
def list_jdbc_databases(source: schemas.JdbcSource):
    return service.list_jdbc_databases(source)
