import os

import boto3

from common.constant import const
from common.enum import ConnectionState
from db.database import get_session
from db.models_data_source import S3BucketSource, DetectionHistory
from . import crud

admin_account_region = os.getenv('AWS_REGION', const.CN_REGIONS[0])


def detect(accounts):
    session = get_session()
    sts_client = boto3.client('sts')

    for aws_account_id in accounts:
        iam_role_name = crud.get_iam_role(aws_account_id)
        # history = session.query(DetectionHistory).filter(DetectionHistory.aws_account == aws_account_id,
        #                                                  DetectionHistory.source_type == 's3').scalar()
        # if history is None:
        history = DetectionHistory(aws_account=aws_account_id, source_type='s3', state=0)
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
        for bucket in resource.buckets.all():
            _region = client.get_bucket_location(Bucket=bucket.name)['LocationConstraint']
            _region = "us-east-1" if _region is None else _region
            if _region in agent_regions:
                s3_bucket_source = session.query(S3BucketSource).filter(S3BucketSource.bucket_name == bucket.name,
                                                                        S3BucketSource.region == _region,
                                                                        S3BucketSource.aws_account == aws_account_id,
                                                                        S3BucketSource.account_id == 0).scalar()
                if s3_bucket_source is None:
                    s3_bucket_source = S3BucketSource(bucket_name=bucket.name, region=_region,
                                                      aws_account=aws_account_id,
                                                      account_id=0)
                total_s3_bucket += 1
                if crud.get_s3_bucket_source_glue_state(aws_account_id, _region,
                                                        bucket.name) == ConnectionState.ACTIVE.value:
                    connected_s3_bucket += 1

                s3_bucket_source.detection_history_id = history.id
                session.merge(s3_bucket_source)
        session.commit()
        # TODO support multiple regions
        crud.update_s3_bucket_count(account=aws_account_id, region=admin_account_region)
