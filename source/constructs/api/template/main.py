from fastapi import APIRouter, Depends
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate
from common.request_wrapper import inject_session
from common.response_wrapper import BaseResponse
from common.query_condition import QueryCondition
from template import schemas, service

router = APIRouter(prefix="/template", tags=["template"])

# condition query support
@router.post("/list-identifiers", response_model=BaseResponse[Page[schemas.TemplateIdentifierFullInfo]])
@inject_session
def list_identifiers(condition: QueryCondition):
    identifiers = service.get_identifiers(condition)
    if not identifiers:
        return None
    return paginate(identifiers, Params(
        size=condition.size,
        page=condition.page,
    ))


@router.get("/list-identifiers_by_template/{tid}",
            response_model=BaseResponse[list])
@inject_session
def list_identifiers_by_template(tid: int):
    return service.get_identifiers_by_template(tid)


@router.get("/identifiers/{id}", response_model=BaseResponse[schemas.TemplateIdentifierFullInfo])
@inject_session
def get_identifier(id: int):
    return service.get_identifier(id)


@router.post("/identifiers", response_model=BaseResponse[schemas.TemplateIdentifierFullInfo])
@inject_session
def create_identifier(identifier: schemas.TemplateIdentifier):
    return service.create_identifier(identifier)


@router.delete("/identifiers/{id}", response_model=BaseResponse[bool])
@inject_session
def delete_identifier(id: int):
    service.delete_identifier(id)


@router.patch("/identifiers/{id}", response_model=BaseResponse[schemas.TemplateIdentifierFullInfo])
@inject_session
def update_identifier(id: int, identifier: schemas.TemplateIdentifier):
    return service.update_identifier(id, identifier)


@router.get("/{id}", response_model=BaseResponse[schemas.Template])
@inject_session
def get_template(id: int):
    return service.get_template(id)

# condition query support
@router.post("/list-template-mappings", response_model=BaseResponse[Page[schemas.TemplateMappingRes]])
@inject_session
def list_mappings(condition: QueryCondition):
    mappings = service.get_mappings(condition)
    if not mappings:
        return None
    return paginate(mappings, Params(
        size=condition.size,
        page=condition.page,
    ))


@router.post("/template-mappings", response_model=BaseResponse[schemas.TemplateMappingFullInfo])
@inject_session
def create_mapping(mapping: schemas.TemplateMapping):
    return service.create_mapping(mapping)


@router.patch("/template-mappings/{id}", response_model=BaseResponse[schemas.TemplateMappingFullInfo])
@inject_session
def update_mapping(id: int, mapping: schemas.TemplateMapping):
    return service.update_mapping(id, mapping)


@router.delete("/template-mappings/{id}", response_model=BaseResponse[bool])
@inject_session
def delete_mapping(id: int):
    service.delete_mapping(id)
