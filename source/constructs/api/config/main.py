from fastapi import APIRouter
from . import service, schemas
from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from discovery_job import service as discovery_job_service

router = APIRouter(prefix="/config", tags=["config"])


@router.get("", response_model=BaseResponse[list[schemas.ConfigBase]])
@inject_session
def list_config():
    return service.list_config()


@router.post("")
@inject_session
def set_config(configs: list[schemas.ConfigBase]):
    return service.set_configs(configs)


@router.get("/subnets", response_model=BaseResponse[list[schemas.SubnetInfo]])
@inject_session
def list_subnets():
    return service.list_subnets()


@router.get("/run-database-ip-count", response_model=BaseResponse[int])
@inject_session
def get_run_database_ip_count(database_type: str):
    return discovery_job_service.get_run_database_ip_count(database_type)
