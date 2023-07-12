from fastapi import APIRouter
from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from version import service

router = APIRouter(prefix="/version", tags=["version"])

@router.get("/get-latest-version",
            response_model=BaseResponse[str])
@inject_session
def get_latest_version():
    return service.get_latest_version()
