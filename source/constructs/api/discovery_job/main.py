from fastapi import Depends, APIRouter
from fastapi_pagination import Page, Params
from common.request_wrapper import inject_session
from . import schemas, service
from common.response_wrapper import BaseResponse
from common.query_condition import QueryCondition
from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi.responses import RedirectResponse
from common.constant import const

router = APIRouter(prefix="/discovery-jobs", tags=["discovery-job"])


# @router.get("/last-job-time", response_model=BaseResponse[str])
# @inject_session
# def last_job_time():
#     return service.last_job_time()


@router.post("", response_model=BaseResponse[schemas.DiscoveryJob])
@inject_session
def create_job(job: schemas.DiscoveryJobCreate):
    return service.create_job(job)


@router.post("/list-jobs", response_model=BaseResponse[Page[schemas.DiscoveryJobList]])
@inject_session
def list_jobs(condition: QueryCondition):
    return paginate(service.list_jobs(condition), Params(
        size=condition.size,
        page=condition.page,
    ))


@router.get("/{id}", response_model=BaseResponse[schemas.DiscoveryJob])
@inject_session
def get_job(id: int):
    return service.get_job(id)


@router.delete("/{id}", response_model=BaseResponse[bool])
@inject_session
def delete_job(id: int):
    service.delete_job(id)
    return True


@router.patch("/{id}", response_model=BaseResponse[bool])
@inject_session
def update_job(id: int, job: schemas.DiscoveryJobUpdate):
    service.update_job(id, job)
    return True


@router.post("/{id}/enable", response_model=BaseResponse[bool])
@inject_session
def enable_job(id: int):
    service.enable_job(id)
    return True


@router.post("/{id}/disable", response_model=BaseResponse[bool])
@inject_session
def disable_job(id: int):
    service.disable_job(id)
    return True


@router.post("/{id}/start", response_model=BaseResponse[bool])
@inject_session
def start_job(id: int):
    service.start_job(id)
    return True


@router.post("/{id}/stop", response_model=BaseResponse[bool])
@inject_session
def stop_job(id: int):
    service.stop_job(id)
    return True


@router.get("/{id}/runs", response_model=BaseResponse[Page[schemas.DiscoveryJobRunList]])
@inject_session
def list_runs(id: int, params: Params = Depends()):
    return paginate(service.get_runs(id), params)


@router.get("/{id}/runs/{run_id}", response_model=BaseResponse[schemas.DiscoveryJobRun])
@inject_session
def get_run(id: int, run_id: int):
    return service.get_run(run_id)


@router.post("/{id}/runs/{run_id}/databases", response_model=BaseResponse[Page[schemas.DiscoveryJobRunDatabaseList]])
@inject_session
def list_run_databases(id: int, run_id: int, condition: QueryCondition):
    return paginate(service.list_run_databases_pagination(run_id, condition), Params(
        size=condition.size,
        page=condition.page,
    ))


@router.get("/{id}/runs/{run_id}/status", response_model=BaseResponse[schemas.DiscoveryJobRunDatabaseStatus])
@inject_session
def get_run_status(id: int, run_id: int):
    return service.get_run_status(id, run_id)


@router.get("/{id}/runs/{run_id}/{run_database_id}/progress", response_model=BaseResponse[schemas.DiscoveryJobRunDatabaseProgress])
@inject_session
def get_run_database_progress(id: int, run_id: int, run_database_id: int):
    return service.get_run_database_progress(id, run_id, run_database_id)


@router.get("/{id}/runs/{run_id}/progress", response_model=BaseResponse[list[schemas.DiscoveryJobRunDatabaseProgress]])
@inject_session
def get_run_progress(id: int, run_id: int):
    return service.get_run_progress(id, run_id)


@router.get("/{id}/runs/{run_id}/report",
            response_class=RedirectResponse,
            responses={
                200: {
                    "content": {const.MIME_XLSX: {}},
                    "description": "Return a report in xlsx format.",
                }
            },
            )
def download_report(id: int, run_id: int):
    url = service.get_report_url(run_id)
    return RedirectResponse(url)


@router.get("/{id}/runs/{run_id}/report_url", response_model=BaseResponse[str])
@inject_session
def get_report_url(id: int, run_id: int):
    url = service.get_report_url(run_id)
    return url


@router.get("/{id}/runs/{run_id}/template_snapshot_url", response_model=BaseResponse[str])
@inject_session
def get_template_snapshot_url(id: int, run_id: int):
    url = service.get_template_snapshot_url(run_id)
    return url
