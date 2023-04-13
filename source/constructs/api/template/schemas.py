from typing import Optional
from pydantic import BaseModel, Field
from common.request_wrapper import BaseColumn


class Template(BaseModel):

    name: Optional[str]
    status: Optional[int]

    class Config:
        orm_mode = True


class TemplateFullInfo(BaseColumn, Template):
    id: int

    class Config:
        orm_mode = True


class TemplateIdentifier(BaseModel):
    description: Optional[str]
    type: Optional[int]
    name: str
    category: Optional[int] = Field(None)
    privacy: Optional[int]
    rule: Optional[str]
    header_keywords: Optional[str]

    class Config:
        orm_mode = True


class TemplateIdentifierFullInfo(BaseColumn, TemplateIdentifier):
    id: int

    class Config:
        orm_mode = True


class TemplateMapping(BaseModel):

    template_id: Optional[int]
    identifier_id: Optional[int]
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
