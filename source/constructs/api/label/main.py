from fastapi import APIRouter
from . import crud, schemas, service
from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params

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
    need_table_labels: bool,
):
    return service.get_category_labels_by_database(
        account_id, region, database_type, database_name, need_table_labels
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
def search_detail_labels_by_page(label_search: schemas.LabelSearch,):
    return paginate(crud.search_detail_labels_by_page(label_search), Params(
        size=label_search.size,
        page=label_search.page,
    ))


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
)
@inject_session
def update_label(
    label: schemas.LabelUpdate
):
    return crud.update_label(id, label)


@router.post(
    "/delete-labels-by-ids",
    response_model=BaseResponse[bool]
)
@inject_session
def delete_labels_by_ids(
    delete_param: schemas.LabelDelete,
):
    return crud.delete_labels_by_ids(delete_param.ids)

