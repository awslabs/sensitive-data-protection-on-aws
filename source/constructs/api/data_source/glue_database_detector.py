import boto3
from common.constant import const
from common.enum import ConnectionState, DatabaseType, Provider
from db.database import get_session
from db.models_data_source import DetectionHistory
from . import crud, schemas
from sqlalchemy.orm import Session
import asyncio
from common.reference_parameter import logger, admin_region

sts_client = boto3.client('sts')


async def detect_glue_database_connection(session: Session, aws_account_id: str):
    iam_role_name = crud.get_iam_role(aws_account_id)
    history = DetectionHistory(account_id=aws_account_id, source_type=DatabaseType.GLUE.value, state=0)
    session.add(history)
    session.commit()
    session.refresh(history)
    assumed_role_object = sts_client.assume_role(
        RoleArn=f"{iam_role_name}",
        RoleSessionName="glue-database-source-detection"
    )
    credentials = assumed_role_object['Credentials']
    regions = crud.get_account_agent_regions(aws_account_id)
    db_database_name_list = []
    glue_database_name_list = []
    glue_database_list = []
    refresh_list = []
    for region in regions:
        client = boto3.client(
            'glue',
            aws_access_key_id=credentials['AccessKeyId'],
            aws_secret_access_key=credentials['SecretAccessKey'],
            aws_session_token=credentials['SessionToken'],
            region_name=region
        )
        # glue_database_list = client.get_databases()['DatabaseList']
        glue_database_list = get_all_databases(client)
    db_glue_list = crud.list_glue_database_ar(account_id=aws_account_id, region=admin_region)
    for item in db_glue_list:
        if not item.glue_database_name.upper().startswith(DatabaseType.JDBC.value):
            db_database_name_list.append(item.glue_database_name)
    for glue_database_item in glue_database_list:
        if glue_database_item["Name"].upper().startswith(const.SOLUTION_NAME):
            continue
        glue_database: dict = glue_database_item
        if glue_database["Name"].upper().startswith(const.SOLUTION_NAME):
            refresh_list.append(glue_database["Name"])
            continue

        glue_database_name_list.append(glue_database["Name"])
        if glue_database["Name"] not in db_database_name_list:
            source_glue_database = schemas.SourceGlueDatabase()
            source_glue_database.account_id = aws_account_id
            source_glue_database.region = regions[0]
            source_glue_database.detection_history_id = history.id
            source_glue_database.glue_database_name = glue_database["Name"]
            crud.import_glue_database(source_glue_database, glue_database)
    for item in db_database_name_list:
        if item not in glue_database_name_list:
            refresh_list.append(item)
    crud.delete_not_exist_glue_database(refresh_list)
    crud.update_glue_database_count(account=aws_account_id, region=admin_region)


def get_all_databases(glue_client):
    all_databases = []
    next_token = None
    
    while True:
        if next_token:
            response = glue_client.get_databases(
                NextToken=next_token
            )
        else:
            response = glue_client.get_databases()
            
        databases = response.get('DatabaseList', [])
        all_databases.extend(databases)
        
        # Check if there are more databases to retrieve
        next_token = response.get('NextToken')
        if not next_token:
            break
    
    return all_databases

async def detect_multiple_account_in_async(accounts):
    session = get_session()
    tasks = []

    for aws_account_id in accounts:
        task = asyncio.create_task(detect_glue_database_connection(session, aws_account_id))
        tasks.append(task)
    await asyncio.gather(*tasks)


def detect(accounts):
    asyncio.run(detect_multiple_account_in_async(accounts))
