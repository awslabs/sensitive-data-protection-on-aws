import time
import logging.config
import jwt
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from mangum import Mangum
from discovery_job.main import router as discovery_router
from data_source.main import router as data_source_router
from catalog.main import router as catalog_router
from search.main import router as search
from common.response_wrapper import resp_err
from common.enum import MessageEnum
from common.constant import const
from template.main import router as template_router
from common.exception_handler import biz_exception
from okta_jwt_verifier import BaseJWTVerifier
from label.main import router as label_router
from fastapi_pagination import add_pagination

logging.config.fileConfig('logging.conf', disable_existing_loggers=False)
logger = logging.getLogger(const.LOGGER_API)
# use global list to cache token, we will use DDB in the future.
token_list = []

app = FastAPI(
    title=const.SOLUTION_FULL_NAME,
    description='',
    version="0.10",
)

# Global exception capture
# All exception handling in the code can be written as: raise BizException(code=500, message="XXXX")
# Among them, code is the business failure code, and message is the content of the failure
biz_exception(app)


# request interceptor
@app.middleware("http")
async def validate_token(request: Request, call_next):
    start_time = time.time()
    hs = request.headers
    method = request.method
    if os.getenv(const.MODE) == const.MODE_DEV and method == 'OPTIONS':
        return JSONResponse(
            content={
                'status': 'success',  # success|fail
                'code': 200,
                'message': 'success',
            },
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Credentials': 'true'
            },
        )
    authorization = hs.get("authorization")
    os.environ[const.USER] = const.USER_DEFAULT_NAME
    if request.scope["path"] in const.EXCLUDE_PATH_LIST:
        pass
    elif authorization:
        try:
            token = authorization.split(' ')[1]
            jwt_str = jwt.decode(token, options={"verify_signature": False})
        except Exception:
            return resp_err(MessageEnum.BIZ_INVALID_TOKEN.get_code(), MessageEnum.BIZ_INVALID_TOKEN.get_msg())
        os.environ[const.USER] = jwt_str['sub']
        if token in token_list:
            if time.time() > jwt_str['exp']:
                token_list.remove(token)
                invoke_okta_auth(token, jwt_str)
        else:
            invoke_okta_auth(token, jwt_str)
    elif os.getenv(const.MODE) == const.MODE_DEV:
        pass
    else:
        return resp_err(MessageEnum.BIZ_INVALID_TOKEN.get_code(), MessageEnum.BIZ_INVALID_TOKEN.get_msg())
    response = await call_next(request)
    if os.getenv(const.MODE) == const.MODE_DEV:
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Max-Age"] = "3600"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


def invoke_okta_auth(token, jwt_str):
    try:
        jwt_verifier = BaseJWTVerifier(issuer=jwt_str['iss'], audience=jwt_str['aud'])
        jwt_verifier.verify_access_token(token)
        os.environ[const.USER] = jwt_str['sub']
        token_list.append(token)
    except Exception:
        return resp_err(MessageEnum.BIZ_INVALID_TOKEN.get_code(), MessageEnum.BIZ_INVALID_TOKEN.get_msg())


app.include_router(discovery_router)
app.include_router(data_source_router)
app.include_router(catalog_router)
app.include_router(template_router)
app.include_router(search)
app.include_router(label_router)

handler = Mangum(app)
add_pagination(app)
