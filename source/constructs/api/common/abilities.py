from common.enum import (Provider,
                         DatabaseType)

def convert_database_type_provider(database_type: str) -> int:
    if database_type == DatabaseType.RDS.value:
        return Provider.AWS_CLOUD.value
    if database_type == DatabaseType.S3.value:
        return Provider.AWS_CLOUD.value
    if database_type == DatabaseType.S3_UNSTRUCTURED.value:
        return Provider.AWS_CLOUD.value
    if database_type == DatabaseType.GLUE.value:
        return Provider.AWS_CLOUD.value
    if database_type == DatabaseType.DDB.value:
        return Provider.AWS_CLOUD.value
    if database_type == DatabaseType.EMR.value:
        return Provider.AWS_CLOUD.value
    if database_type == DatabaseType.JDBC.value:
        return Provider.AWS_CLOUD.value
    if database_type == DatabaseType.JDBC_AWS.value:
        return Provider.AWS_CLOUD.value
    if database_type == DatabaseType.JDBC_ALIYUN.value:
        return Provider.ALI_CLOUD.value
    if database_type == DatabaseType.JDBC_TENCENT.value:
        return Provider.TENCENT_CLOUD.value

def convert_provider_id_str(provider: int) -> str:
    if provider == Provider.TENCENT_CLOUD.value:
        return DatabaseType.JDBC_TENCENT.value
    elif Provider.ALI_CLOUD.value:
        return DatabaseType.JDBC_ALIYUN.value
    else:
        return DatabaseType.JDBC_AWS.value
