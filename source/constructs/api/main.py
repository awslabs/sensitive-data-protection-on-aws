import time
import logging.config
import os
import requests
from jose import jwk, jwt
from jose.utils import base64url_decode
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
from version.main import router as version_router
from common.exception_handler import biz_exception
from label.main import router as label_router
from fastapi_pagination import add_pagination

logging.config.fileConfig('logging.conf', disable_existing_loggers=False)
logger = logging.getLogger(const.LOGGER_API)
# use global list to cache token, we will use DDB in the future.
token_list = []

version = os.getenv("Version", "1.0.0")
app = FastAPI(
    title=const.SOLUTION_FULL_NAME,
    description='',
    version=version,
)

# Global exception capture
# All exception handling in the code can be written as: raise BizException(code=500, message="XXXX")
# Among them, code is the business failure code, and message is the content of the failure
biz_exception(app)

issuer = os.getenv(const.OIDC_ISSUER, const.EMPTY_STR)
client_id = os.getenv(const.OIDC_CLIENT_ID, const.EMPTY_STR)
jwks_uri = const.EMPTY_STR
if issuer != const.EMPTY_STR and "okta.com" not in issuer:
    oidc_configuration = requests.get(issuer + const.OIDC_CONFIGURATION_URL).json()
    jwks_uri = oidc_configuration["jwks_uri"]
    jwt_keys = requests.get(jwks_uri).json()['keys']


# request interceptor
@app.middleware("http")
async def validate(request: Request, call_next):
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
            jwt_claims = jwt.get_unverified_claims(token)
        except Exception as e:
            return resp_err(MessageEnum.BIZ_INVALID_TOKEN.get_code(), MessageEnum.BIZ_INVALID_TOKEN.get_msg())
        username = __get_username(jwt_claims)
        os.environ[const.USER] = username
        logger.debug(f"username:{username}")
        if token in token_list:
            logger.debug("token in list")
            if time.time() > jwt_claims['exp']:
                token_list.remove(token)
                return resp_err(MessageEnum.BIZ_INVALID_TOKEN.get_code(), MessageEnum.BIZ_INVALID_TOKEN.get_msg())
        else:
            logger.debug("token not in list")
            validate_result = __validate_token(token, jwt_claims)
            if validate_result:
                token_list.append(token)
            else:
                return resp_err(MessageEnum.BIZ_INVALID_TOKEN.get_code(), MessageEnum.BIZ_INVALID_TOKEN.get_msg())
    elif os.getenv(const.MODE) == const.MODE_DEV:
        pass
    else:
        return resp_err(MessageEnum.BIZ_INVALID_TOKEN.get_code(), MessageEnum.BIZ_INVALID_TOKEN.get_msg())
    logger.info("%%%%%%%%%%%%%%%%%%%%%%")
    logger.info(request)
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


def __get_username(jwt_claims: dict):
    username_keys = ["email", "username", "preferred_username"]
    for username_key in username_keys:
        username = jwt_claims.get(username_key)
        if username is not None:
            return username
    return jwt_claims.get("sub")


def __validate_token(token, jwt_claims):
    if jwks_uri == const.EMPTY_STR:
        return __online_validate(token, jwt_claims)
    else:
        return __offline_validate(token, jwt_claims)


def __offline_validate(token, jwt_claims):
    headers = jwt.get_unverified_headers(token)
    kid = headers['kid']
    # search for the kid in the downloaded public keys
    key_index = -1
    for i in range(len(jwt_keys)):
        if kid == jwt_keys[i]['kid']:
            key_index = i
            break
    if key_index == -1:
        logger.info(f'Public key not found in jwks.json.kid:{kid}')
        return False
    # construct the public key
    public_key = jwk.construct(jwt_keys[key_index])
    # get the last two sections of the token,
    # message and signature (encoded in base64)
    message, encoded_signature = str(token).rsplit('.', 1)
    # decode the signature
    decoded_signature = base64url_decode(encoded_signature.encode('utf-8'))
    # verify the signature
    if not public_key.verify(message.encode("utf8"), decoded_signature):
        logger.info('Signature verification failed')
        return False
    logger.debug('Signature successfully verified')
    # since we passed the verification, we can now safely
    # use the unverified claims
    if time.time() > jwt_claims['exp']:
        logger.info('Token is expired')
        return False
    return True


def __online_validate(token, jwt_claims):
    jwt_issuer = jwt_claims["iss"]
    # Currently only OKTA is supported
    if "okta.com" in jwt_issuer:
        headers = {"Content-type": "application/x-www-form-urlencoded"}
        url = f"{issuer}/oauth2/v1/introspect/"
        data = "client_id={}&token_type_hint=access_token&token={}".format(client_id, token)
        json_response = requests.post(url, data, headers=headers).json()
        logger.debug(json_response)
        return json_response.get("active")
    else:
        return False


app.include_router(discovery_router)
app.include_router(data_source_router)
app.include_router(catalog_router)
app.include_router(template_router)
app.include_router(search)
app.include_router(label_router)
app.include_router(version_router)

handler = Mangum(app)
add_pagination(app)
