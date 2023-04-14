import os

import boto3

from common.constant import const
from common.enum import ConnectionState
from db.database import get_session
from db.models_data_source import DetectionHistory, RdsInstanceSource, Account
from . import crud

admin_account_region = boto3.session.Session().region_name


def detect(accounts):
    session = get_session()
    sts_client = boto3.client('sts')

    for aws_account_id in accounts:
        iam_role_name = crud.get_iam_role(aws_account_id)
        history = DetectionHistory(aws_account=aws_account_id, source_type='rds', state=0)
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
            """ :type : pyboto3.rds """

            for instance in client.describe_db_instances()['DBInstances']:
                if instance['Engine'] not in const.RDS_SUPPORTED_ENGINES:
                    continue
                rds_instance_source = session.query(RdsInstanceSource).filter(
                    RdsInstanceSource.instance_id == instance['DBInstanceIdentifier'],
                    RdsInstanceSource.region == region,
                    RdsInstanceSource.instance_class == instance['DBInstanceClass'],
                    RdsInstanceSource.engine == instance['Engine'],
                    RdsInstanceSource.instance_status == instance['DBInstanceStatus'],
                    RdsInstanceSource.address == instance['Endpoint']['Address'],
                    RdsInstanceSource.port == instance['Endpoint']['Port'],
                    RdsInstanceSource.master_username == instance['MasterUsername'],
                    RdsInstanceSource.aws_account == aws_account_id,
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
                                                            aws_account=aws_account_id

                                                            )
                rds_instance_source.detection_history_id = history.id
                session.merge(rds_instance_source)
                total_rds += 1
                if crud.get_rds_instance_source_glue_state(aws_account_id, region, str(
                        instance['DBInstanceIdentifier'])) == ConnectionState.ACTIVE.value:
                    connected_rds += 1

            session.commit()
            account = session.query(Account).filter(Account.aws_account_id == aws_account_id,
                                                    Account.region == region).first()
            # TODO support multiple regions
            crud.update_rds_instance_count(account=aws_account_id, region=admin_account_region)
