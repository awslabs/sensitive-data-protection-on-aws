import logging
from . import crud
from common.constant import const

logger = logging.getLogger(const.LOGGER_API)


def set_config(key: str, value: str):
    return crud.set_value(key, value)


def get_config(key: str) -> str:
    return crud.get_value(key)
