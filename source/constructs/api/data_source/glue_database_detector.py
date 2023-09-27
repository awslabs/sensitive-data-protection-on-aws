import os

import boto3
import logging

from common.constant import const
from common.enum import ConnectionState, DatabaseType, Provider
from db.database import get_session
from db.models_data_source import DetectionHistory, RdsInstanceSource, Account
from . import crud, schemas
from . import service
from catalog.service import delete_catalog_by_database_region
from sqlalchemy.orm import Session
import asyncio

sts_client = boto3.client('sts')
admin_account_region = boto3.session.Session().region_name
logger = logging.getLogger()
logger.setLevel(logging.INFO)

async def detect_glue_database_connection(session: Session, aws_account_id: str):
    iam_role_name = crud.get_iam_role(aws_account_id)
    history = DetectionHistory(aws_account=aws_account_id, source_type=DatabaseType.GLUE_DATABASE.value, state=0)
    session.add(history)
    session.commit()
    assumed_role_object = sts_client.assume_role(
        RoleArn=f"{iam_role_name}",
        RoleSessionName="glue-database-source-detection"
    )
    credentials = assumed_role_object['Credentials']
    regions = crud.get_account_agent_regions(aws_account_id)
    glue_database_list = []
    refresh_list = []
    logger.info("=================")
    logger.info(regions)
    for region in regions:
        client = boto3.client(
            'glue',
            aws_access_key_id=credentials['AccessKeyId'],
            aws_secret_access_key=credentials['SecretAccessKey'],
            aws_session_token=credentials['SessionToken'],
            region_name=region
        )
        glue_database_list.append(client.get_databases()['DatabaseList'])
        logger.info("detect_glue_database")
    # list exist rds not exist insert
    for glue_database_item in glue_database_list:
        glue_database = glue_database_item[0]
        refresh_list.append(glue_database["Name"])
        if not crud.list_glue_database_by_name(glue_database["Name"]):
            source_glue_database = schemas.SourceGlueDatabase
            source_glue_database.glue_database_name = glue_database["Name"]
            source_glue_database.glue_database_location_uri = glue_database["LocationUri"]
            source_glue_database.glue_database_description = glue_database["Description"]
            source_glue_database.glue_database_create_time = glue_database["CreateTime"]
            source_glue_database.glue_database_catalog_id = glue_database["CatalogId"]
            sub_info = glue_database["CreateTableDefaultPermissions"][0]
            source_glue_database.data_lake_principal_identifier = sub_info["Principal"]["DataLakePrincipalIdentifier"]
            source_glue_database.permissions = "|".join(sub_info["Permissions"])
            source_glue_database.region = ''
            source_glue_database.account_id = aws_account_id
            crud.add_glue_database(source_glue_database)
    # list not exist rds exist delete
    crud.delete_not_exist_glue_database(refresh_list)
    crud.update_glue_database_count(account=aws_account_id, region=admin_account_region)


async def detect_multiple_account_in_async(accounts):
    session = get_session()
    tasks = []

    for aws_account_id in accounts:
        task = asyncio.create_task(detect_glue_database_connection(session, aws_account_id))
        tasks.append(task)
    await asyncio.gather(*tasks)


def detect(accounts):
    asyncio.run(detect_multiple_account_in_async(accounts))
