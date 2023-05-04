from fastapi import Depends, APIRouter
from . import crud, schemas, service
from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate

router = APIRouter(prefix="/labels", tags=["labels"])


# @router.get(
#     "/category/get-database-labels",
#     response_model=BaseResponse[schemas.LabelSimple],
#     description="获取Category下database级别的标签列表"
# )
# @inject_session
# def get_category_database_labels(
#     #     required
#     account_id: str,
#     #     required
#     region: str,
#     #     optional
#     database_type: str,
#     #     optional
#     database_name: str,
# ):
#     return None

@router.get(
    "/category/get-labels-by-one-database",
    response_model=BaseResponse,
    description="获取Category下某database级别的标签列表"
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


# @router.get(
#     "/category/get-labels-by-one-table",
#     response_model=BaseResponse[schemas.LabelSimple],
#     description="获取Category下某database下某table级别的标签列表"
# )
# @inject_session
# def get_category_labels_by_table(
#     #     required
#     account_id: str,
#     #     required
#     region: str,
#     #     required
#     database_type: str,
#     #     required
#     database_name: str,
#     #     required
#     table_name: str,
# ):
#     return None


@router.get(
    "/search-labels",
    response_model=BaseResponse,
    description="全量搜索简要标签列表"
)
@inject_session
def search_category_labels(
    label_name: str,
):
    return service.search_category_labels(label_name)


# @router.get(
#     "/category/search-labels-by-page",
#     response_model=BaseResponse[Page[schemas.LabelSimple]],
#     description="分页搜索Category下的标签列表"
# )
# @inject_session
# def search_category_labels_by_page(
#     label_name: str,
#     params: Params = Depends(),
# ):
#     return None


@router.post(
    "/search-detail-labels-by-page",
    description="分页搜索标签列表"
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
    response_model=BaseResponse,
    description="创建标签"
)
@inject_session
def create_label(label: schemas.LabelCreate):
    label_create = crud.create_label(label)
    return label_create


@router.post(
    "/update-label",
    response_model=BaseResponse[bool],
    description="编辑标签"
)
@inject_session
def update_label(
    id: int,
    label: schemas.LabelUpdate
):
    return crud.update_label(id, label)


@router.delete(
    "/delete-label",
    response_model=BaseResponse[bool],
    description="删除标签"
)
@inject_session
def delete_label(
    id: int,
):
    return crud.delete_label(id)

