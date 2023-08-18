from typing import Optional
from pydantic import BaseModel, Field

from common.request_wrapper import BaseColumn


class Template(BaseModel):

    name: Optional[str]
    snapshot_no: Optional[str]
    status: Optional[int]

    class Config:
        orm_mode = True


class TemplateFullInfo(BaseColumn, Template):
    id: int

    class Config:
        orm_mode = True


class TemplateIdentifierProp(BaseModel):
    prop_name: Optional[str]
    prop_type: Optional[int]

    class Config:
        orm_mode = True


class TemplateIdentifierPropFullInfo(BaseColumn, TemplateIdentifierProp):
    id: Optional[int]

    class Config:
        orm_mode = True


class TemplateIdentifier(BaseModel):
    description: Optional[str]
    type: Optional[int]
    name: Optional[str]
    classification: Optional[int] = Field(None)
    privacy: Optional[int]
    rule: Optional[str]
    header_keywords: Optional[str]
    props: Optional[list]
    exclude_keywords: Optional[str]

    class Config:
        orm_mode = True


class TemplateIdentifierFullInfo(BaseColumn, TemplateIdentifier):
    id: Optional[int]

    class Config:
        orm_mode = True


class TemplateMapping(BaseModel):

    template_id: Optional[int]
    identifier_ids: Optional[list[int]]
    status: Optional[int]


class TemplateMappingFullInfo(BaseColumn, TemplateMapping):
    id: int

    class Config:
        orm_mode = True


class TemplateMappingRes(BaseModel):
    id: int
    template_id: Optional[int]
    identifier_id: Optional[int]
    status: Optional[int]
    type: Optional[int]
    name: str
    description: Optional[str]
    props: Optional[list[TemplateIdentifierProp]]

    class Config:
        orm_mode = True


# class TemplateIdentifierPropRef(BaseModel):
#     id: int
#     identifier_id: int
#     prop_id: int
