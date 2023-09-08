import logging
import boto3
import json
import traceback
import requests


logger = logging.getLogger('constructs')
logger.setLevel(logging.INFO)
request_type_list = ["Create","Update","Delete"]


def lambda_handler(event, context):
    logger.info(event)
    try:
        request_type = event['RequestType']
        if request_type not in request_type_list:
            send_response(event,"FAILED","request type not in list")
            return

        if request_type == 'Create':
            on_create(event)
        elif request_type == 'Update':
            on_update(event)
        elif request_type == 'Delete':
            on_delete(event)
        send_response(event)
    except Exception:
        error_msg = traceback.format_exc()
        logger.exception(error_msg.replace("\n", "\r"))
        send_response(event, "FAILED" ,error_msg)


def send_response(event, response_status = "SUCCESS", reason = "OK", data = {}):
    response_url = event['ResponseURL']
    response_body = {}
    response_body['Status'] = response_status
    response_body['PhysicalResourceId'] = event['PhysicalResourceId'] if 'PhysicalResourceId' in event else event['LogicalResourceId']
    response_body['StackId'] = event['StackId']
    response_body['RequestId'] = event['RequestId']
    response_body['LogicalResourceId'] = event['LogicalResourceId']
    response_body['Reason'] = reason
    response_body['Data'] = data

    json_response_body = json.dumps(response_body)
    logger.info(json_response_body)

    headers = {
        'content-type': '',
        'content-length': str(len(json_response_body))
    }
    response = requests.put(response_url,
                            data=json_response_body,
                            headers=headers)
    return response


def on_create(event):
    logger.info("Got create")
    properties = event["ResourceProperties"]
    update_user_pool_client(properties["UserPoolId"], properties["UserPoolClientId"], properties["CallbackUrl"], properties["LogoutUrl"])


def on_update(event):
    logger.info("Got Update")
    on_create(event)


def on_delete(event):
    logger.info("Got Delete")


def update_user_pool_client(user_pool_id: str, client_id: str, callback_url: str, logout_url: str):
    cognito_client = boto3.client('cognito-idp')
    describe_response = cognito_client.describe_user_pool_client(UserPoolId=user_pool_id,
        ClientId=client_id,)
    user_pool_client = describe_response['UserPoolClient']
    update_response = cognito_client.update_user_pool_client(
        UserPoolId=user_pool_id,
        ClientId=client_id,
        CallbackURLs=[callback_url],
        LogoutURLs=[logout_url],
        SupportedIdentityProviders=user_pool_client['SupportedIdentityProviders'],
        AllowedOAuthFlows=user_pool_client['AllowedOAuthFlows'],
        AllowedOAuthScopes=user_pool_client['AllowedOAuthScopes'],
        AllowedOAuthFlowsUserPoolClient=True,
    )
    logger.info(update_response)