from fastapi import Depends, APIRouter
from fastapi_pagination import Page, Params
from common.request_wrapper import inject_session
from . import schemas, service
from common.response_wrapper import BaseResponse
from common.query_condition import QueryCondition
from fastapi_pagination.ext.sqlalchemy import paginate

router = APIRouter(prefix="/discovery-jobs", tags=["discovery-job"])


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


@router.get("/{job_id}", response_model=BaseResponse[schemas.DiscoveryJob])
@inject_session
def get_job(job_id: int):
    return service.get_job(job_id)


@router.delete("/{job_id}", response_model=BaseResponse[bool])
@inject_session
def delete_job(job_id: int):
    service.delete_job(job_id)
    return True


@router.patch("/{job_id}", response_model=BaseResponse[bool])
@inject_session
def update_job(job_id: int, job: schemas.DiscoveryJobUpdate):
    service.update_job(job_id, job)
    return True


@router.post("/{job_id}/enable", response_model=BaseResponse[bool])
@inject_session
def enable_job(job_id: int):
    service.enable_job(job_id)
    return True


@router.post("/{job_id}/disable", response_model=BaseResponse[bool])
@inject_session
def disable_job(job_id: int):
    service.disable_job(job_id)
    return True


@router.post("/{job_id}/start", response_model=BaseResponse[bool])
@inject_session
def start_job(job_id: int):
    service.start_job(job_id)
    return True


@router.post("/{job_id}/stop", response_model=BaseResponse[bool])
@inject_session
def stop_job(job_id: int):
    service.stop_job(job_id)
    return True


@router.get("/{job_id}/runs", response_model=BaseResponse[Page[schemas.DiscoveryJobRunList]])
@inject_session
def list_runs(job_id: int, params: Params = Depends()):
    return paginate(service.get_runs(job_id), params)


@router.get("/{job_id}/runs/{run_id}", response_model=BaseResponse[schemas.DiscoveryJobRun])
@inject_session
def get_run(job_id: int, run_id: int):
    return service.get_run(run_id)


@router.post("/{job_id}/runs/{run_id}/databases", response_model=BaseResponse[Page[schemas.DiscoveryJobRunDatabaseList]])
@inject_session
def list_run_databases(job_id: int, run_id: int, condition: QueryCondition):
    return paginate(service.list_run_databases_pagination(run_id, condition), Params(
        size=condition.size,
        page=condition.page,
    ))


@router.get("/{job_id}/runs/{run_id}/status", response_model=BaseResponse[schemas.DiscoveryJobRunDatabaseStatus])
@inject_session
def get_run_status(job_id: int, run_id: int):
    return service.get_run_status(job_id, run_id)


@router.get("/{job_id}/runs/{run_id}/progress", response_model=BaseResponse[list[schemas.DiscoveryJobRunDatabaseProgress]])
@inject_session
def get_run_progress(job_id: int, run_id: int):
    return service.get_run_progress(job_id, run_id)


# @router.get("/{id}/runs/{run_id}/report",
#             response_class=RedirectResponse,
#             responses={
#                 200: {
#                     "content": {const.MIME_XLSX: {}},
#                     "description": "Return a report in xlsx format.",
#                 }
#             },
#             )
# def download_report(id: int, run_id: int):
#     url = service.get_report_url(run_id)
#     return RedirectResponse(url)


@router.get("/{job_id}/runs/{run_id}/report_url", response_model=BaseResponse[str])
@inject_session
def get_report_url(job_id: int, run_id: int):
    url = service.get_report_url(job_id, run_id)
    return url


@router.get("/{job_id}/runs/{run_id}/template_snapshot_url", response_model=BaseResponse[str])
@inject_session
def get_template_snapshot_url(job_id: int, run_id: int):
    url = service.get_template_snapshot_url(run_id)
    return url
