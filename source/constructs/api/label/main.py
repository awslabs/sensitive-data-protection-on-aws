from fastapi import Depends, APIRouter
from . import crud, schemas, service
from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate

router = APIRouter(prefix="/labels", tags=["labels"])


@router.get(
    "/category/get-labels-by-one-database"
)
@inject_session
def get_category_labels_by_database(
    #     required
    account_id: str,
    #     required
    region: str,
    #     required
    database_type: str,
    #     required
    database_name: str,
    #     required
    need_tabel_labels: bool,
):
    return service.get_category_labels_by_database(
        account_id, region, database_type, database_name, need_tabel_labels
    )


@router.get(
    "/search-labels",
    response_model=BaseResponse
)
@inject_session
def search_labels(
    label_name: str,
):
    return service.search_labels(label_name)


@router.post(
    "/search-detail-labels-by-page"
)
@inject_session
def search_detail_labels_by_page(
    label_search: schemas.LabelSearch,
    params: Params = Depends(),
):
    return paginate(
        crud.search_detail_labels_by_page(label_search),
        params
    )


@router.post(
    "/create-label",
    response_model=BaseResponse
)
@inject_session
def create_label(label: schemas.LabelCreate):
    label_create = crud.create_label(label)
    return label_create


@router.post(
    "/update-label",
    response_model=BaseResponse[bool]
)
@inject_session
def update_label(
    id: int,
    label: schemas.LabelUpdate
):
    return crud.update_label(id, label)


@router.delete(
    "/delete-label",
    response_model=BaseResponse[bool]
)
@inject_session
def delete_label(
    id: int,
):
    return crud.delete_label(id)
