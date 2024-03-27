from typing import Optional
from pydantic import BaseModel
import db.models_config as models


class ConfigBase(BaseModel):
    config_key: str
    config_value: str

    class Meta:
        orm_model = models.Config

    class Config:
        orm_mode = True


class SubnetInfo(BaseModel):
    subnet_id: str
    name: Optional[str]
    available_ip_address_count: int
