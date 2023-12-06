from common.enum import (Provider,
                         ProviderName,
                         DatabaseType)


def convert_database_type_2_provider(database_type: str) -> int:
    if database_type == DatabaseType.JDBC_GOOGLE.value:
        return Provider.GOOGLE_CLOUD.value
    elif database_type == DatabaseType.JDBC_TENCENT.value:
        return Provider.TENCENT_CLOUD.value
    elif database_type == DatabaseType.JDBC_PROXY.value:
        return Provider.JDBC_PROXY.value
    else:
        return Provider.AWS_CLOUD.value


def convert_provider_id_2_database_type(provider: int) -> str:
    if provider == Provider.TENCENT_CLOUD.value:
        return DatabaseType.JDBC_TENCENT.value
    elif provider == Provider.GOOGLE_CLOUD.value:
        return DatabaseType.JDBC_GOOGLE.value
    elif provider == Provider.JDBC_PROXY.value:
        return DatabaseType.JDBC_PROXY.value
    else:
        return DatabaseType.JDBC_AWS.value


def convert_provider_id_2_name(provider: int) -> str:
    if provider == Provider.TENCENT_CLOUD.value:
        return ProviderName.TENCENT_CLOUD.value
    elif provider == Provider.GOOGLE_CLOUD.value:
        return ProviderName.GOOGLE_CLOUD.value
    elif provider == Provider.JDBC_PROXY.value:
        return ProviderName.JDBC_PROXY.value
    else:
        return ProviderName.AWS_CLOUD.value


# This function is used for detecting the glue connection/crawler is created for third-party JDBC connections,
# it only returns true when the JDBC connection is a third-party JDBC connection.
def need_change_account_id(database_type: str) -> bool:
    if database_type.startswith(DatabaseType.JDBC.value) and database_type != DatabaseType.JDBC_AWS.value:
        return True
    return False

