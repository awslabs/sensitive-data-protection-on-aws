from common.enum import DatabaseType
from common.abilities import convert_database_type_2_provider
from . import crud


def list_resources_by_database_type(data_base_type: str):
    if data_base_type == DatabaseType.S3.value:
        return crud.list_s3_resources()
    elif data_base_type == DatabaseType.RDS.value:
        return crud.list_rds_resources()
    elif data_base_type == DatabaseType.GLUE.value:
        return crud.list_glue_resources()
    else:
        return crud.list_jdbc_resources_by_provider(convert_database_type_2_provider(data_base_type))
