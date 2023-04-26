import datetime
from typing import Optional
from pydantic import BaseModel


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

    class Config:
        orm_mode = True
