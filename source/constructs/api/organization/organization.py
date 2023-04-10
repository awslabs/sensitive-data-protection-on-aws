from fastapi import APIRouter
import boto3
import os
from common.response_wrapper import resp_ok, BaseResponse

router = APIRouter(prefix="/organization")

cfn_admin_role = os.environ.get('ADMIN_ROLE')
stack_set_name = os.environ.get('STACK_SET_NAME')

@router.get("")
def organization():
    sts_connection = boto3.client('sts')
    admin_session = sts_connection.assume_role(
        RoleArn=cfn_admin_role,
        RoleSessionName='get_organization'
    )
    access_key = admin_session['Credentials']['AccessKeyId']
    secret_key = admin_session['Credentials']['SecretAccessKey']
    session_token = admin_session['Credentials']['SessionToken']

    admin_cloud_formation_client = boto3.client(
        'cloudformation',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        aws_session_token=session_token,
    )

    response = admin_cloud_formation_client.list_stack_instances(
        StackSetName=stack_set_name,
        MaxResults=1,
        CallAs='DELEGATED_ADMIN'
    )

    result = response['Summaries']

    while 'NextToken' in response:
        response = admin_cloud_formation_client.list_stack_instances(
            StackSetName=stack_set_name,
            MaxResults=100,
            NextToken=response['NextToken'],
            CallAs='DELEGATED_ADMIN'
        )
        result.extend(response['Summaries'])

    return resp_ok(result)