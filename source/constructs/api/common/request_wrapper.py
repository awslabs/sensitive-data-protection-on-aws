from datetime import datetime
from functools import wraps
import time
from pydantic import BaseModel
from typing import Optional
from common.constant import const
import logging
from db.database import gen_session, close_session
from common.response_wrapper import resp_ok
from fastapi_pagination.bases import RawParams

logger = logging.getLogger(const.LOGGER_API)


def to_raw_params(self) -> RawParams:
    return RawParams(
        limit=self.size,
        offset=self.size * (self.page - 1),
    )


def inject_session(func):

    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        # Parameters may contain sensitive information entered by users, such as database connection information,
        # so they will not be output in the production environment
        logger.debug(f"START >>> METHOD: {func.__name__} PARAMS: {kwargs}")
        try:
            gen_session()
            result = func(*args, **kwargs)
            res = resp_ok(result)
            logger.debug(f"END >>> USED:{round(time.time()-start_time)}ms")
            return res
        finally:
            close_session()
    return wrapper


class BaseColumn(BaseModel):
    version: Optional[int]
    create_by: Optional[str]
    modify_by: Optional[str]
    modify_time: Optional[datetime]
    create_time: Optional[datetime]

    class Config:
        orm_mode = True
