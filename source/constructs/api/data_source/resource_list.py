from common.enum import DatabaseType
from common.abilities import convert_database_type_2_provider
from common.query_condition import QueryCondition
from . import crud


def list_resources_by_database_type(database_type: str, account_id: str = None, region: str = None, condition: QueryCondition = None):
    if database_type == DatabaseType.S3.value:
        return crud.list_s3_resources(account_id, region, condition)
    elif database_type == DatabaseType.RDS.value:
        return crud.list_rds_resources(account_id, region, condition)
    elif database_type == DatabaseType.GLUE.value:
        return crud.list_glue_resources(account_id, region, condition)
    else:
        return crud.list_jdbc_resources_by_provider(convert_database_type_2_provider(database_type), account_id, region, condition)
