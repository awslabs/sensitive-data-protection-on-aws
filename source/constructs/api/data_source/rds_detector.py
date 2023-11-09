import os

import boto3
import logging

from common.constant import const
from common.enum import ConnectionState, DatabaseType, Provider
from db.database import get_session
from db.models_data_source import DetectionHistory, RdsInstanceSource, Account
from . import crud
from . import service
from catalog.service import delete_catalog_by_database_region
from sqlalchemy.orm import Session
import asyncio

sts_client = boto3.client('sts')
admin_account_region = boto3.session.Session().region_name
logger = logging.getLogger()
logger.setLevel(logging.INFO)

async def detect_rds_data_source(session: Session, aws_account_id: str):
    iam_role_name = crud.get_iam_role(aws_account_id)
    history = DetectionHistory(account_id=aws_account_id, source_type='rds', state=0)
    session.add(history)
    session.commit()
    assumed_role_object = sts_client.assume_role(
        RoleArn=f"{iam_role_name}",
        RoleSessionName="rds-instance-source-detection"
    )
    credentials = assumed_role_object['Credentials']
    regions = crud.get_account_agent_regions(aws_account_id)
    for region in regions:
        total_rds = 0
        connected_rds = 0
        client = boto3.client(
            'rds',
            aws_access_key_id=credentials['AccessKeyId'],
            aws_secret_access_key=credentials['SecretAccessKey'],
            aws_session_token=credentials['SessionToken'],
            region_name=region
        )
        rds_agent_list = []
        """ :type : pyboto3.rds """
        for instance in client.describe_db_instances()['DBInstances']:
            logger.debug(instance)
            if str(instance['DBInstanceStatus']).lower() != const.RDS_AVAILABLE:
                continue
            if instance['Engine'] not in const.RDS_SUPPORTED_ENGINES:
                continue
            rds_agent_list.append(instance['DBInstanceIdentifier'])
            rds_instance_source = session.query(RdsInstanceSource).filter(
                RdsInstanceSource.instance_id == instance['DBInstanceIdentifier'],
                RdsInstanceSource.region == region,
                # RdsInstanceSource.instance_class == instance['DBInstanceClass'],
                # RdsInstanceSource.engine == instance['Engine'],
                # RdsInstanceSource.instance_status == instance['DBInstanceStatus'],
                # RdsInstanceSource.address == instance['Endpoint']['Address'] if 'Endpoint' in instance else '',
                # RdsInstanceSource.port == instance['Endpoint']['Port'] if 'Endpoint' in instance else '',
                # RdsInstanceSource.master_username == instance['MasterUsername'],
                RdsInstanceSource.account_id == aws_account_id,
            ).scalar()
            if rds_instance_source is None:
                rds_instance_source = RdsInstanceSource(instance_id=str(instance['DBInstanceIdentifier']),
                                                        region=region,
                                                        instance_class=instance['DBInstanceClass'],
                                                        engine=instance['Engine'],
                                                        instance_status=instance['DBInstanceStatus'],
                                                        address=instance['Endpoint']['Address'],
                                                        port=instance['Endpoint']['Port'],
                                                        master_username=instance['MasterUsername'],
                                                        # created_time=instance['Engine'],
                                                        account_id=aws_account_id

                                                        )
            rds_instance_source.detection_history_id = history.id
            session.merge(rds_instance_source)
            total_rds += 1
            if crud.get_rds_instance_source_glue_state(aws_account_id, region, str(
                    instance['DBInstanceIdentifier'])) == ConnectionState.ACTIVE.value:
                connected_rds += 1

        session.commit()
        # Get RDS instance in data source table
        query_result = session.query(RdsInstanceSource).filter(RdsInstanceSource.account_id == aws_account_id).all()
        rds_db_list = []
        rds_db_region_list = []
        rds_db_glue_state = []
        for row in query_result:
            rds_db_list.append(row.instance_id)
            rds_db_region_list.append(row.region)
            rds_db_glue_state.append(row.glue_state) # None is unconnected
        deleted_rds_list = list(set(rds_db_list) - set(rds_agent_list))
        for deleted_rds_instance in deleted_rds_list:
            index = deleted_rds_list.index(deleted_rds_instance)
            rds_connection_state = rds_db_glue_state[index]
            deleted_rds_region = rds_db_region_list[index]
            
            if rds_connection_state is not None:
                # The RDS instance is a connected data source
                service.delete_rds_connection(aws_account_id, deleted_rds_region, deleted_rds_instance)
            
            # Delete data catalog in case the user first connect it and generate data catalog then disconnect it
            try:
                delete_catalog_by_database_region(deleted_rds_instance, deleted_rds_region, DatabaseType.RDS)
            except Exception as e:
                logger.error(str(e))
            crud.delete_rds_instance_source_by_instance_id(aws_account_id, deleted_rds_region, deleted_rds_instance)
        account = session.query(Account).filter(Account.account_provider_id == Provider.AWS_CLOUD.value,
                                                Account.account_id == aws_account_id,
                                                Account.region == region).first()
        # TODO support multiple regions
        crud.update_rds_instance_count(account=aws_account_id, region=admin_account_region)


async def detect_multiple_account_in_async(accounts):
    session = get_session()
    tasks = []

    for aws_account_id in accounts:
        task = asyncio.create_task(detect_rds_data_source(session, aws_account_id))
        tasks.append(task)
    await asyncio.gather(*tasks)


def detect(accounts):
    asyncio.run(detect_multiple_account_in_async(accounts))
