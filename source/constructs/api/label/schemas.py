import datetime
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
    create_by: Optional[str]
    create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class LabelCreate(BaseModel):
    label_name: str
    classification: Optional[str] = LabelClassification.DEFAULT
    type: Optional[str] = LabelType.DEFAULT
    style_type: Optional[str] = LabelStyleType.DEFAULT
    style_value: Optional[str] = ''
    state: Optional[str] = LabelState.ONLINE
    version: Optional[int] = 0
    create_by: Optional[str]
    # create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    # modify_time: Optional[datetime.datetime]


class LabelUpdate(BaseModel):
    id: int
    label_name: Optional[str]
    classification: Optional[str]
    type: Optional[str]
    style_type: Optional[str]
    style_value: Optional[str]
    state: Optional[str]
    # version: Optional[int]
    # create_by: Optional[str]
    # create_time: Optional[datetime.datetime]
    modify_by: Optional[str]
    modify_time: Optional[datetime.datetime]


class LabelSimple(BaseModel):
    id: int
    label_name: str
    # classification: str
    # type: str
    # style_type: str
    # style_value: str
    # state: Optional[str]
    # version: Optional[int]
    # create_by: Optional[str]
    # create_time: Optional[datetime.datetime]
    # modify_by: Optional[str]
    # modify_time: Optional[datetime.datetime]




    class Config:
        orm_mode = True
