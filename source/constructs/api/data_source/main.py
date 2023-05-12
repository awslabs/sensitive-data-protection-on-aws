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


@router.post("/s3", response_model=BaseResponse)
@inject_session
def create_s3_connection(s3: schemas.SourceS3Connection):
    if s3.bucket == '*':
        return service.create_s3_connection_by_region(
            s3.account_id,
            s3.region
        )
    else:
        return service.create_s3_connection(
            s3.account_id,
            s3.region,
            s3.bucket
        )


@router.post("/delete_s3", response_model=BaseResponse)
@inject_session
def delete_s3_connection(s3: schemas.SourceDeteteS3Connection):
    return service.delete_s3_connection(
        s3.account_id,
        s3.region,
        s3.bucket
    )


@router.post("/delete_rds", response_model=BaseResponse)
@inject_session
def delete_rds_connection(rds: schemas.SourceDeteteRdsConnection):
    return service.delete_rds_connection(
        rds.account_id,
        rds.region,
        rds.instance
    )


@router.post("/rds", response_model=BaseResponse)
@inject_session
def create_rds_connection(rds: schemas.SourceRdsConnection):
    return service.create_rds_connection(
        rds.account_id,
        rds.region,
        rds.instance,
        rds.rds_user,
        rds.rds_password,
        rds.rds_secret
    )


@router.post("/refresh", response_model=BaseResponse)
@inject_session
def refresh_data_source(type: schemas.NewDataSource):
    service.refresh_data_source(
        type.accounts,
        type.type
    )
    return True


@router.get("/coverage", response_model=BaseResponse[schemas.SourceCoverage])
@inject_session
def get_data_source_coverage():
    return service.get_data_source_coverage()


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


@router.get("/reload_organization_account", response_model=BaseResponse,
            description="Retrieve stacksets in the delegate account, and refresh account list by stackset status")
@inject_session
def reload_organization_account(organization_management_account_id=''):
    return service.reload_organization_account(organization_management_account_id)


@router.post("/add_account", response_model=BaseResponse,
             description="Add individual account")
@inject_session
def add_account(account: schemas.SourceNewAccount):
    return service.add_account(account.account_id)

@router.post("/delete_account", response_model=BaseResponse,
             description="Delete individual account")
@inject_session
def delete_account(account: schemas.SourceNewAccount):
    return service.delete_account(account.account_id)

@router.get("/secrets", response_model=BaseResponse, description="List Secrets for RDS")
@inject_session
def get_secrets(account: str, region: str):
    return service.get_secrets(account, region)
