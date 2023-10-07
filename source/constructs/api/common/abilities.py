from common.enum import (Provider,
                         DatabaseType)

def convert_database_type_provider(database_type: str) -> int:
    match database_type:
        case DatabaseType.JDBC_ALIYUN.value:
            return Provider.ALI_CLOUD.value
        case DatabaseType.JDBC_TENCENT.value:
            return Provider.TENCENT_CLOUD.value
        case _:
            return Provider.AWS_CLOUD.value

def convert_provider_id_str(provider: int) -> str:
    if provider == Provider.TENCENT_CLOUD.value:
        return DatabaseType.JDBC_TENCENT.value
    elif Provider.ALI_CLOUD.value:
        return DatabaseType.JDBC_ALIYUN.value
    else:
        return DatabaseType.JDBC_AWS.value
