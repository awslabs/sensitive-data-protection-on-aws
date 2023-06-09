from discovery_job.service import create_job
from discovery_job.service import start_sample_job
from discovery_job import schemas
from common import constant
from common.constant import const
import logging
logger = logging.getLogger(const.LOGGER_API)


def init_s3_sample_job(account_id: str, region: str, bucket_name: str, resource_name: str, refresh: bool):
    # 创建输入对象
    job = schemas.DiscoveryJobCreate(
        name='s3_' + bucket_name + '_' + resource_name + '_job',
        description='get sample data',
        range=0,
        schedule=const.ON_DEMAND,
        databases=[
            schemas.DiscoveryJobDatabaseCreate(
                account_id=account_id,
                region=region,
                database_type='s3',
                database_name=bucket_name
            )
        ]
    )
    logger.info(job)
    discovery_job = create_job(job)
    logger.info(discovery_job.id)
    response = start_sample_job(discovery_job.id)
    logger.info(response)

