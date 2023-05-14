
from typing import Optional
from pydantic import BaseModel
from common.enum import (
    LabelClassification, LabelType, LabelStyleType, LabelState
)


class Label(BaseModel):
    id: int
    label_name: str
    classification: str
    type: str
    style_type: str
    style_value: str
    state: Optional[str]
    version: Optional[int]

    class Config:
        orm_mode = True


class LabelSearch(BaseModel):
    id: Optional[int]
    label_name: Optional[str]
    classification: Optional[str]
    type: Optional[str]
    style_type: Optional[str]
    style_value: Optional[str]
    state: Optional[str]
    size: Optional[int] = 20
    page: Optional[int] = 1

    class Config:
        orm_mode = True


class LabelCreate(BaseModel):
    label_name: str
    classification: Optional[str] = "default"
    type: Optional[str] = "default"
    style_type: Optional[str] = "default"
    style_value: Optional[str] = ''
    state: Optional[str] = "online"
    version: Optional[int] = 0

    class Config:
        orm_mode = True


class LabelUpdate(BaseModel):
    id: int
    label_name: Optional[str]
    classification: Optional[str]
    type: Optional[str]
    style_type: Optional[str]
    style_value: Optional[str]
    state: Optional[str]


class LabelDelete(BaseModel):
    ids: list


class LabelSimple(BaseModel):
    id: int
    label_name: str

    class Config:
        orm_mode = True
