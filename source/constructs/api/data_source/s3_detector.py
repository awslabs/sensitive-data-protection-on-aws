import os

import boto3
import logging

from common.constant import const
from common.enum import ConnectionState, DatabaseType
from db.database import get_session
from db.models_data_source import S3BucketSource, DetectionHistory
from . import crud
from . import service
from catalog.service import delete_catalog_by_database_region
import asyncio
from sqlalchemy.orm import Session

admin_account_region = boto3.session.Session().region_name
sts_client = boto3.client('sts')

logger = logging.getLogger()
logger.setLevel(logging.INFO)

async def detect_s3_data_source(session: Session, aws_account_id: str):
    iam_role_name = crud.get_iam_role(aws_account_id)
    # history = session.query(DetectionHistory).filter(DetectionHistory.account_id == aws_account_id,
    #                                                  DetectionHistory.source_type == 's3').scalar()
    # if history is None:
    history = DetectionHistory(account_id=aws_account_id, source_type='s3', state=0)
    # history.detection_time = datetime.datetime.utcnow()
    session.add(history)
    session.commit()
    # session.update(stmt)

    assumed_role_object = sts_client.assume_role(
        RoleArn=f"{iam_role_name}",
        RoleSessionName="s3-bucket-source-detection"
    )
    credentials = assumed_role_object['Credentials']
    resource = boto3.resource(
        's3',
        aws_access_key_id=credentials['AccessKeyId'],
        aws_secret_access_key=credentials['SecretAccessKey'],
        aws_session_token=credentials['SessionToken'],
    )
    client = boto3.client('s3',
                            aws_access_key_id=credentials['AccessKeyId'],
                            aws_secret_access_key=credentials['SecretAccessKey'],
                            aws_session_token=credentials['SessionToken'],
                            )
    agent_regions = crud.get_account_agent_regions(account_id=aws_account_id)
    total_s3_bucket = 0
    connected_s3_bucket = 0
    s3_agent_bucket_name_list = []
    
    for bucket in resource.buckets.all():
        try:
            _region = client.get_bucket_location(Bucket=bucket.name)['LocationConstraint']
        except Exception:
            logger.warning(f"get bucket location error:{bucket.name}")
            continue
        s3_agent_bucket_name_list.append(bucket.name)
        _region = "us-east-1" if _region is None else _region
        if _region in agent_regions:
            s3_bucket_source = session.query(S3BucketSource).filter(S3BucketSource.bucket_name == bucket.name,
                                                                    S3BucketSource.region == _region,
                                                                    S3BucketSource.account_id == aws_account_id).scalar()
            
            if s3_bucket_source is None:
                s3_bucket_source = S3BucketSource(bucket_name=bucket.name, region=_region,
                                                  account_id=aws_account_id)
            total_s3_bucket += 1
            if crud.get_s3_bucket_source_glue_state(aws_account_id, _region,
                                                    bucket.name) == ConnectionState.ACTIVE.value:
                connected_s3_bucket += 1

            s3_bucket_source.detection_history_id = history.id
            session.merge(s3_bucket_source)
    
    session.commit()

    # Get S3 bucket in data source table
    query_result = session.query(S3BucketSource).filter(S3BucketSource.account_id == aws_account_id).all()
    s3_db_bucket_name_list = []
    s3_db_region_list = []
    s3_db_glue_state = []
    for row in query_result:
        s3_db_bucket_name_list.append(row.bucket_name)
        s3_db_region_list.append(row.region)
        s3_db_glue_state.append(row.glue_state) # None is unconnected

    # Compare S3 bucket in data source table with S3 bucket in agent account
    deleted_s3_bucket_source_list = list(set(s3_db_bucket_name_list) - set(s3_agent_bucket_name_list))

    for deleted_s3_bucket_source in deleted_s3_bucket_source_list:
        index = s3_db_bucket_name_list.index(deleted_s3_bucket_source)
        s3_connection_state = s3_db_glue_state[index]
        deleted_s3_region = s3_db_region_list[index]

        if s3_connection_state is not None:
            # The bucket is a connected data source
            service.delete_s3_connection(aws_account_id, deleted_s3_region, deleted_s3_bucket_source)

        # Delete data catalog in case the user first connect it and generate data catalog then disconnect it
        try:
            delete_catalog_by_database_region(deleted_s3_bucket_source, deleted_s3_region, DatabaseType.S3)
        except Exception as e:
            logger.error(str(e))
        crud.delete_s3_bucket_source_by_name(aws_account_id, deleted_s3_region, deleted_s3_bucket_source)

    # TODO support multiple regions
    crud.update_s3_bucket_count(account=aws_account_id, region=admin_account_region)

async def detect_multiple_account_in_async(accounts):
    session = get_session()
    tasks = []

    for aws_account_id in accounts:
        task = asyncio.create_task(detect_s3_data_source(session, aws_account_id))
        tasks.append(task)
    await asyncio.gather(*tasks)


def detect(accounts):
    asyncio.run(detect_multiple_account_in_async(accounts))
