import boto3
from common.enum import Provider, MessageEnum
from db.database import get_session
from db.models_data_source import DetectionHistory
from common.abilities import convert_provider_id_2_name
from . import crud
from sqlalchemy.orm import Session
import asyncio
from db.models_data_source import JDBCInstanceSource
from botocore.exceptions import ClientError
from common.exception_handler import BizException
from common.reference_parameter import logger, admin_account_id, admin_region

sts_client = boto3.client('sts')


async def detect_jdbc_connection(provider_id: int, account_id: str, session: Session):
    not_exist_connections = []
    if provider_id == Provider.AWS_CLOUD.value:
        history = DetectionHistory(account_id=account_id, source_type='jdbc', state=0)
        regions = crud.get_account_agent_regions(account_id)
        iam_role_name = crud.get_iam_role(account_id)
    else:
        history = DetectionHistory(provider=convert_provider_id_2_name(provider_id), account_id=account_id, source_type='jdbc', state=0)
        iam_role_name = crud.get_iam_role(admin_account_id)
        regions = [admin_region]
    session.add(history)
    session.commit()
    assumed_role_object = sts_client.assume_role(
        RoleArn=f"{iam_role_name}",
        RoleSessionName="jdbc-connection-detection"
    )
    credentials = assumed_role_object['Credentials']
    for region in regions:
        client = boto3.client(
            'glue',
            aws_access_key_id=credentials['AccessKeyId'],
            aws_secret_access_key=credentials['SecretAccessKey'],
            aws_session_token=credentials['SessionToken'],
            region_name=region)
        res: list[JDBCInstanceSource] = crud.list_jdbc_connection_by_account(provider_id, account_id)
        for item in res:
            if item.glue_connection:
                try:
                    # item.glue_connection
                    client.get_connection(Name=item.glue_connection)
                except ClientError as e:
                    if e.response['Error']['Code'] == 'EntityNotFoundException':
                        not_exist_connections.append(item.id)
                except Exception as e:
                    raise BizException(MessageEnum.BIZ_UNKNOWN_ERR.get_code(),
                                       MessageEnum.BIZ_UNKNOWN_ERR.get_msg())
            else:
                not_exist_connections.append(item.id)
    # delete not existed jdbc
    crud.delete_jdbc_connection_by_accounts(not_exist_connections)
    region = admin_region if provider_id == Provider.AWS_CLOUD.value else None
    crud.update_jdbc_instance_count(provider=provider_id, account=account_id, region=region)

async def detect_multiple_account_in_async(provider_id, accounts):
    session = get_session()
    tasks = []

    for aws_account_id in accounts:
        task = asyncio.create_task(detect_jdbc_connection(provider_id, aws_account_id, session))
        tasks.append(task)
    await asyncio.gather(*tasks)


def detect(provider_id, accounts):
    asyncio.run(detect_multiple_account_in_async(provider_id, accounts))
