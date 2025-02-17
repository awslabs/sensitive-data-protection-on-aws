import datetime
from operator import or_

from sqlalchemy import desc, func
import logging
from common.enum import (ConnectionState,
                         MessageEnum,
                         Provider,
                         SourceRegionStatus,
                         SourceProviderStatus,
                         SourceResourcesStatus,
                         SourceAccountStatus)
from common.query_condition import QueryCondition, query_with_condition
from db.database import get_session
from db.models_data_source import (S3BucketSource,
                                   Account,
                                   RdsInstanceSource,
                                   JDBCInstanceSource,
                                   SourceRegion,
                                   SourceProvider,
                                   SourceResource,
                                   SourceGlueDatabase)
from common.exception_handler import BizException
from common.reference_parameter import partition, admin_region
from common.constant import const
from . import schemas


def list_accounts(condition: QueryCondition):
    return query_with_condition(get_session().query(Account).filter(Account.status == 1), condition).distinct(
        Account.account_provider_id, Account.account_id, Account.region)


def list_all_accounts_by_region(region: str):
    query = get_session().query(
        Account.account_id,
        Account.region
    ).filter(
        Account.account_provider_id == Provider.AWS_CLOUD.value,
        Account.status == 1,
        Account.region == region
    ).distinct(
        Account.account_provider_id,
        Account.account_id,
        Account.region
    ).all()
    return query


def get_account_by_id(account_id: str):
    account = get_session().query(Account).filter(
        Account.account_id == account_id
    ).first()
    return account

def get_account_agent_regions(account_id: str):
    regions = []
    account_with_regions = get_session().query(Account).filter(
        Account.account_id == account_id,
        Account.status == 1
    ).distinct(
        Account.account_id
    ).all()
    if account_with_regions is not None:
        for account in account_with_regions:
            regions.append(account.region)
    return regions


def list_s3_bucket_source(condition: QueryCondition):
    # status = 0 : admin
    # status = 1 : monitored account
    accounts = get_session().query(Account).filter(Account.account_provider_id == Provider.AWS_CLOUD.value,
                                                   Account.status == 1).all()
    account_ids = []
    for account in accounts:
        account_ids.append(account.account_id)
    buckets = get_session().query(S3BucketSource).filter(
        S3BucketSource.account_id.in_(account_ids),
        S3BucketSource.detection_history_id != -1
    )
    buckets = query_with_condition(buckets, condition)
    return buckets


def list_s3_bucket_source_by_account(account_id: str, region: str, state: str):
    # status = 0 : admin
    # status = 1 : monitored account
    bucket_names = []
    buckets = get_session().query(S3BucketSource).filter(
        S3BucketSource.account_id == account_id,
        S3BucketSource.region == region,
        S3BucketSource.glue_state != ConnectionState.PENDING.value,
        S3BucketSource.glue_state != ConnectionState.ACTIVE.value,
        S3BucketSource.glue_state != ConnectionState.CRAWLING.value
    )
    if buckets is not None:
        for bucket in buckets:
            bucket_names.append(bucket.bucket_name)
    buckets = get_session().query(S3BucketSource).filter(
        S3BucketSource.account_id == account_id,
        S3BucketSource.region == region,
        S3BucketSource.glue_state == state
    )
    if buckets is not None:
        for bucket in buckets:
            bucket_names.append(bucket.bucket_name)

    return bucket_names


def list_glue_database(condition: QueryCondition):
    instances = None
    accounts: list[Account] = get_session().query(Account).filter(
        Account.account_provider_id == Provider.AWS_CLOUD.value, Account.status == 1).all()
    account_ids = []
    for account in accounts:
        account_ids.append(account.account_id)
    instances = get_session().query(SourceGlueDatabase).filter(
        SourceGlueDatabase.account_id.in_(account_ids),
        SourceGlueDatabase.detection_history_id != -1
    )
    return query_with_condition(instances, condition)


def list_rds_instance_source(condition: QueryCondition):
    instances = None
    accounts = get_session().query(Account).filter(Account.account_provider_id == Provider.AWS_CLOUD.value,
                                                   Account.status == 1).all()
    account_ids = []
    for account in accounts:
        account_ids.append(account.account_id)
    instances = get_session().query(RdsInstanceSource).filter(
        RdsInstanceSource.account_id.in_(account_ids),
        RdsInstanceSource.detection_history_id != -1
    )
    instances = query_with_condition(instances, condition)
    return instances


def list_glue_database_by_account(account_id: str, region: str, name: str):
    return get_session().query(SourceGlueDatabase).filter(SourceGlueDatabase.account_id == account_id,
                                                          SourceGlueDatabase.region == region,
                                                          SourceGlueDatabase.glue_database_name == name).all()


def list_glue_database_ar(account_id: str, region: str) -> list[SourceGlueDatabase]:
    return get_session().query(SourceGlueDatabase).filter(SourceGlueDatabase.account_id == account_id, SourceGlueDatabase.region == region).all()

def list_jdbc_instance_source_by_instance_id(instance_id: str):
    return get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.instance_id == instance_id).all()

def list_aws_jdbc_instance_source_by_account(jdbcConn: schemas.JDBCInstanceSourceFullInfo) -> JDBCInstanceSource:
    return get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == Provider.AWS_CLOUD.value,
                                                          JDBCInstanceSource.account_id == jdbcConn.account_id,
                                                          JDBCInstanceSource.instance_id == jdbcConn.instance_id).first()

def list_jdbc_instance_source_by_instance_id_account(jdbcConn: JDBCInstanceSource, adminAccount: str):
    # 如果是非AWS，则在admin账号下不能同名
    if jdbcConn.account_provider_id != Provider.AWS_CLOUD.value:
        return get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == Provider.AWS_CLOUD.value,
                                                              JDBCInstanceSource.account_id == adminAccount,
                                                              JDBCInstanceSource.instance_id == jdbcConn.instance_id).all()
    # 如果是AWS，则同一个账号下不能同名
    return get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == jdbcConn.account_provider_id,
                                                          JDBCInstanceSource.account_id == jdbcConn.account_id,
                                                          JDBCInstanceSource.instance_id == jdbcConn.instance_id).all()

def list_jdbc_instance_source(provider_id: int, condition: QueryCondition):
    accounts = get_session().query(Account).filter(Account.account_provider_id == provider_id,
                                                   Account.status == 1).all()
    account_ids = []
    for account in accounts:
        account_ids.append(account.account_id)

    return query_with_condition(get_session().query(JDBCInstanceSource).filter(
        JDBCInstanceSource.account_id.in_(account_ids),
        JDBCInstanceSource.account_provider_id == provider_id,
        or_(JDBCInstanceSource.detection_history_id != -1, JDBCInstanceSource.detection_history_id == None)
    ), condition)

def list_jdbc_instance_source_without_condition(provider_id: int):
    accounts = get_session().query(Account).filter(Account.account_provider_id == provider_id,
                                                   Account.status == 1).all()
    account_ids = []
    for account in accounts:
        account_ids.append(account.account_id)
    res = get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == provider_id).filter(
        JDBCInstanceSource.account_id.in_(account_ids)
    )
    return res

def list_glue_database_source_without_condition():
    accounts = get_session().query(Account).filter(Account.account_provider_id == Provider.AWS_CLOUD.value,
                                                   Account.status == 1).all()
    account_ids = []
    for account in accounts:
        account_ids.append(account.account_id)
    return get_session().query(SourceGlueDatabase).filter(
        SourceGlueDatabase.account_id.in_(account_ids),
        SourceGlueDatabase.detection_history_id != -1
    )

def list_jdbc_connection_by_account(provider_id: int, account_id: str) -> list[JDBCInstanceSource]:
    return get_session().query(JDBCInstanceSource).filter(
        JDBCInstanceSource.account_provider_id == provider_id,
        JDBCInstanceSource.account_id == account_id
    ).all()

def list_jdbc_connection_by_connection(connection_name: str) -> list[JDBCInstanceSource]:
    return get_session().query(JDBCInstanceSource).filter(
        JDBCInstanceSource.glue_connection == connection_name
    ).all()

def delete_jdbc_connection_by_accounts(accounts: list):
    session = get_session()
    session.query(JDBCInstanceSource).filter(JDBCInstanceSource.id.in_(accounts)).delete()
    session.commit()

def set_jdbc_connection_glue_state(provider: int, account: str, region: str, instance: str, state: str):
    session = get_session()
    jdbc_connection_source = session.query(JDBCInstanceSource).filter(
        JDBCInstanceSource.account_provider_id == provider,
        JDBCInstanceSource.instance_id == instance,
        JDBCInstanceSource.region == region,
        JDBCInstanceSource.account_id == account).order_by(
        desc(JDBCInstanceSource.detection_history_id)).first()
    if jdbc_connection_source is not None:
        jdbc_connection_source.glue_state = state
        session.merge(jdbc_connection_source)
        session.commit()
    else:
        return None

def set_rds_instance_source_glue_state(account: str, region: str, instance_id: str, state: str):
    session = get_session()
    rds_instance_source = session.query(RdsInstanceSource).filter(RdsInstanceSource.instance_id == instance_id,
                                                                  RdsInstanceSource.region == region,
                                                                  RdsInstanceSource.account_id == account).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    if rds_instance_source is not None:
        rds_instance_source.glue_state = state
        session.merge(rds_instance_source)
        session.commit()
    else:
        return None


def get_jdbc_connection_glue_info(provider_id: int, account_id: str, region: str, instance: str):
    jdbc: JDBCInstanceSource = get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == provider_id,
                                                                              JDBCInstanceSource.account_id == account_id,
                                                                              JDBCInstanceSource.region == region,
                                                                              JDBCInstanceSource.instance_id == instance).order_by(
        desc(JDBCInstanceSource.detection_history_id)).first()
    if jdbc:
        return jdbc.glue_state, jdbc.glue_connection
    else:
        return None, None


def get_rds_instance_source_glue_state(account: str, region: str, instance_id: str):
    rds = get_session().query(RdsInstanceSource).filter(RdsInstanceSource.instance_id == instance_id,
                                                        RdsInstanceSource.region == region,
                                                        RdsInstanceSource.account_id == account).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    if rds is not None:
        return rds.glue_state
    else:
        return None


def get_jdbc_instance_source_glue(provider_id: int, account: str, region: str, instance_id: str) -> schemas.JDBCInstanceSourceFullInfo:
    return get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == provider_id,
                                                          JDBCInstanceSource.account_id == account,
                                                          JDBCInstanceSource.region == region,
                                                          JDBCInstanceSource.instance_id == instance_id).order_by(
        desc(JDBCInstanceSource.detection_history_id)).first()


def get_jdbc_instance_source_by_crawler_name(crawler: str):
    return get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.glue_crawler == crawler).order_by(
        desc(JDBCInstanceSource.detection_history_id)).first()


def delete_not_exist_glue_database(refresh_list: list[str]):
    get_session().query(SourceGlueDatabase).filter(SourceGlueDatabase.glue_database_name.in_(refresh_list)).delete()


def update_glue_database_count(account: str, region: str):
    session = get_session()

    connected = session.query(SourceGlueDatabase).filter(SourceGlueDatabase.region == region,
                                                         SourceGlueDatabase.account_id == account,
                                                         SourceGlueDatabase.glue_state == ConnectionState.ACTIVE.value).count()
    total = session.query(SourceGlueDatabase).filter(SourceGlueDatabase.region == region,
                                                     SourceGlueDatabase.account_id == account).count()

    account: Account = session.query(Account).filter(Account.account_id == account, Account.region == region).first()
    if account is not None:
        account.connected_glue_database = connected
        account.total_glue_database = total
    session.merge(account)
    session.commit()


def update_rds_instance_count(account: str, region: str):
    session = get_session()

    connected = session.query(RdsInstanceSource).filter(RdsInstanceSource.region == region,
                                                        RdsInstanceSource.account_id == account,
                                                        RdsInstanceSource.glue_state == ConnectionState.ACTIVE.value).count()
    total = session.query(RdsInstanceSource).filter(RdsInstanceSource.region == region,
                                                    RdsInstanceSource.account_id == account).count()

    account = session.query(Account).filter(Account.account_id == account, Account.region == region).first()
    if account is not None:
        account.connect_rds_instance = connected
        account.total_rds_instance = total
    session.merge(account)
    session.commit()


def get_rds_instance_source(account: str, region: str, instance_id: str):
    return get_session().query(RdsInstanceSource).filter(RdsInstanceSource.account_id == account,
                                                         RdsInstanceSource.region == region,
                                                         RdsInstanceSource.instance_id == instance_id).scalar()


def get_glue_database_source(account: str, region: str, name: str):
    return get_session().query(SourceGlueDatabase).filter(SourceGlueDatabase.account_id == account,
                                                          SourceGlueDatabase.region == region,
                                                          SourceGlueDatabase.glue_database_name == name).scalar()

def get_glue_database_source_glue_state(account: str, region: str, database: str):
    query = get_session().query(SourceGlueDatabase).filter(SourceGlueDatabase.account_id == account,
                                                           SourceGlueDatabase.region == region,
                                                           SourceGlueDatabase.glue_database_name == database).order_by(
        desc(SourceGlueDatabase.detection_history_id)).first()
    if query is None:
        return None
    return query.glue_state


def set_glue_database_glue_state(account, region, database, state):
    session = get_session()
    query = get_session().query(SourceGlueDatabase).filter(SourceGlueDatabase.account_id == account,
                                                           SourceGlueDatabase.region == region,
                                                           SourceGlueDatabase.glue_database_name == database).order_by(
        desc(SourceGlueDatabase.detection_history_id)).first()
    if query is not None:
        query.glue_state = state
        session.merge(query)
        session.commit()
    else:
        return None

def get_jdbc_instance_source(provider: int, account: str, region: str, instance_id: str)->JDBCInstanceSource:
    return get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == provider,
                                                          JDBCInstanceSource.account_id == account,
                                                          JDBCInstanceSource.region == region,
                                                          JDBCInstanceSource.instance_id == instance_id).scalar()


def get_s3_bucket_source(account: str, region: str, bucket_name: str):
    return get_session().query(S3BucketSource).filter(S3BucketSource.account_id == account,
                                                      S3BucketSource.region == region,
                                                      S3BucketSource.bucket_name == bucket_name).scalar()

def get_iam_role(account: str):
    res = get_session().query(Account).filter(Account.account_id == account).first()
    return res.detection_role_name if res else f"arn:{partition}:iam::{account}:role/{const.SOLUTION_NAME}RoleForAdmin-{admin_region}"


def create_s3_connection(account: str, region: str, bucket: str, glue_connection_name, glue_database_name: str,
                         crawler_name: str):
    session = get_session()
    s3_bucket_source = session.query(S3BucketSource).filter(S3BucketSource.bucket_name == bucket,
                                                            S3BucketSource.region == region,
                                                            S3BucketSource.account_id == account).scalar()
    if s3_bucket_source is None:
        s3_bucket_source = S3BucketSource(bucket_name=bucket, region=region,
                                          account_id=account)
    s3_bucket_source.glue_connection = glue_connection_name
    s3_bucket_source.glue_database = glue_database_name
    s3_bucket_source.glue_crawler = crawler_name
    s3_bucket_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    s3_bucket_source.glue_state = ConnectionState.AUTHORIZED.value
    session.merge(s3_bucket_source)
    session.commit()


def set_s3_bucket_source_glue_state(account: str, region: str, bucket: str, state: str):
    session = get_session()
    s3_bucket_source = session.query(S3BucketSource).filter(S3BucketSource.bucket_name == bucket,
                                                            S3BucketSource.region == region,
                                                            S3BucketSource.account_id == account).order_by(
        desc(S3BucketSource.detection_history_id)).first()
    if s3_bucket_source is not None:
        s3_bucket_source.glue_state = state
        session.merge(s3_bucket_source)
        session.commit()
    else:
        return None


def get_s3_bucket_source_glue_state(account: str, region: str, bucket: str):
    query = get_session().query(S3BucketSource).filter(S3BucketSource.bucket_name == bucket,
                                                       S3BucketSource.region == region,
                                                       S3BucketSource.account_id == account).order_by(
        desc(S3BucketSource.detection_history_id)).first()
    if query is None:
        return None
    return query.glue_state


def update_s3_bucket_count(account: str, region: str):
    session = get_session()

    connected = session.query(S3BucketSource).filter(S3BucketSource.region == region,
                                                     S3BucketSource.account_id == account,
                                                     S3BucketSource.glue_state == ConnectionState.ACTIVE.value).count()
    total = session.query(S3BucketSource).filter(S3BucketSource.region == region,
                                                 S3BucketSource.account_id == account).count()

    account = session.query(Account).filter(Account.account_id == account, Account.region == region).first()
    if account is not None:
        account.connected_s3_bucket = connected
        account.total_s3_bucket = total
    session.merge(account)
    session.commit()

# def update_glue_database_count(account: str, region: str):
#     session = get_session()
#     total = session.query(SourceGlueDatabase).filter(SourceGlueDatabase.region == region,
#                                                      SourceGlueDatabase.account_id == account).count()

#     account = session.query(Account).filter(Account.account_id == account, Account.region == region).first()
#     if account is not None:
#         account.connected_jdbc_instance = total
#         account.total_jdbc_instance = total
#     session.merge(account)
#     session.commit()


def update_jdbc_instance_count(provider: int, account: str, region: str):
    session = get_session()
    if region:
        connected = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == provider,
                                                             JDBCInstanceSource.region == region,
                                                             JDBCInstanceSource.account_id == account,
                                                             JDBCInstanceSource.glue_state == ConnectionState.ACTIVE.value,
                                                             JDBCInstanceSource.detection_history_id != -1).count()
        total = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.region == region,
                                                         JDBCInstanceSource.account_id == account,
                                                         JDBCInstanceSource.detection_history_id != -1).count()
        accountInfo: Account = session.query(Account).filter(Account.account_provider_id == provider, Account.account_id == account, Account.region == region).first()
        if accountInfo:
            accountInfo.connected_jdbc_instance = connected
            accountInfo.total_jdbc_instance = total
            session.merge(accountInfo)
            session.commit()
    else:
        total = {}
        connected = {}
        conns: list[JDBCInstanceSource] = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == provider,
                                                                                   JDBCInstanceSource.account_id == account).all()
        for conn in conns:
            if conn.detection_history_id == -1:
                continue

            total[conn.account_id + '-' + conn.region] = 1 if conn.account_id + '-' + conn.region not in total else total[conn.account_id + '-' + conn.region] + 1
            if conn.glue_state == 'ACTIVE':
                connected[conn.account_id + '-' + conn.region] = 1 if conn.account_id + '-' + conn.region not in connected else connected[conn.account_id + '-' + conn.region] + 1

        accountInfo: Account = session.query(Account).filter(Account.account_provider_id == provider, Account.account_id == account).first()
        if accountInfo:
            accountInfo.connected_jdbc_instance = 0 if accountInfo.account_id + '-' + accountInfo.region not in connected else connected[accountInfo.account_id + '-' + accountInfo.region]
            accountInfo.total_jdbc_instance = 0 if accountInfo.account_id + '-' + accountInfo.region not in total else total[accountInfo.account_id + '-' + accountInfo.region]
            session.merge(accountInfo)
            session.commit()


def update_jdbc_connection(provider_id: int,
                           account: str,
                           region: str,
                           instance: str,
                           glue_database: str,
                           crawler_name: str):
    session = get_session()
    jdbc_connection_source = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == provider_id,
                                                                      JDBCInstanceSource.account_id == account,
                                                                      JDBCInstanceSource.region == region,
                                                                      JDBCInstanceSource.instance_id == instance).order_by(
        desc(JDBCInstanceSource.detection_history_id)).first()
    if jdbc_connection_source is None:
        jdbc_connection_source = JDBCInstanceSource(instance_id=instance, region=region, account_id=account)
    jdbc_connection_source.glue_database = glue_database
    jdbc_connection_source.glue_crawler = crawler_name
    jdbc_connection_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    jdbc_connection_source.glue_state = ConnectionState.CRAWLING.value
    session.merge(jdbc_connection_source)
    session.commit()


def create_rds_connection(account: str,
                          region: str,
                          instance: str,
                          glue_connection: str,
                          glue_database: str,
                          glue_vpc_endpoint_id: str,
                          crawler_name: str):
    session = get_session()
    rds_instance_source = session.query(RdsInstanceSource).filter(RdsInstanceSource.instance_id == instance,
                                                                  RdsInstanceSource.region == region,
                                                                  RdsInstanceSource.account_id == account).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    if not rds_instance_source:
        rds_instance_source = RdsInstanceSource(instance_id=instance, region=region,
                                                account_id=account)
    rds_instance_source.glue_database = glue_database
    rds_instance_source.glue_crawler = crawler_name
    rds_instance_source.glue_connection = glue_connection
    rds_instance_source.glue_vpc_endpoint = glue_vpc_endpoint_id
    rds_instance_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    rds_instance_source.glue_state = ConnectionState.AUTHORIZED.value
    session.merge(rds_instance_source)
    session.commit()


def delete_third_account(account_provider, account_id, region):
    session = get_session()
    del_data = session.query(Account).filter(Account.account_provider_id == account_provider,
                                             Account.account_id == account_id, Account.region == region).delete()
    if not del_data:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.commit()


def delete_s3_bucket_connection(account: str, region: str, bucket_name: str):
    session = get_session()
    s3_bucket_source = session.query(S3BucketSource).filter(S3BucketSource.bucket_name == bucket_name,
                                                            S3BucketSource.region == region,
                                                            S3BucketSource.account_id == account).scalar()

    s3_bucket_source.glue_database = None
    s3_bucket_source.glue_crawler = None
    s3_bucket_source.glue_connection = None
    s3_bucket_source.glue_vpc_endpoint = None
    s3_bucket_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    s3_bucket_source.glue_state = None
    session.merge(s3_bucket_source)
    session.commit()

def hide_s3_bucket_connection(account: str, region: str, bucket_name: str):
    session = get_session()
    s3_bucket_source = session.query(S3BucketSource).filter(S3BucketSource.bucket_name == bucket_name,
                                                            S3BucketSource.region == region,
                                                            S3BucketSource.account_id == account).scalar()

    if s3_bucket_source is not None:
        s3_bucket_source.detection_history_id = -1
        session.merge(s3_bucket_source)
        session.commit()

def delete_rds_connection(account: str, region: str, instance: str):
    session = get_session()
    rds_instance_source = session.query(RdsInstanceSource).filter(RdsInstanceSource.instance_id == instance,
                                                                  RdsInstanceSource.region == region,
                                                                  RdsInstanceSource.account_id == account).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    rds_instance_source.glue_database = None
    rds_instance_source.glue_crawler = None
    rds_instance_source.glue_connection = None
    rds_instance_source.glue_vpc_endpoint = None
    rds_instance_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    rds_instance_source.glue_state = None
    session.merge(rds_instance_source)
    session.commit()

def hide_rds_connection(account: str, region: str, instance: str):
    session = get_session()
    rds_instance_source = session.query(RdsInstanceSource).filter(RdsInstanceSource.instance_id == instance,
                                                                  RdsInstanceSource.region == region,
                                                                  RdsInstanceSource.account_id == account).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    if rds_instance_source is not None:
        rds_instance_source.detection_history_id = -1
        session.merge(rds_instance_source)
        session.commit()

def delete_glue_database(account: str, region: str, instance: str):
    session = get_session()
    glue_database_source: SourceGlueDatabase = session.query(SourceGlueDatabase).filter(SourceGlueDatabase.glue_database_name == instance,
                                                                                        SourceGlueDatabase.region == region,
                                                                                        SourceGlueDatabase.account_id == account).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    glue_database_source.glue_database_catalog_id = None
    glue_database_source.glue_database_create_time = None
    glue_database_source.glue_database_description = None
    glue_database_source.glue_database_location_uri = None
    session.merge(glue_database_source)
    session.commit()


def delete_jdbc_connection(provider: str, account: str, region: str, instance: str):
    session = get_session()
    jdbc_instance_source: JDBCInstanceSource = session.query(JDBCInstanceSource).filter(
        JDBCInstanceSource.instance_id == instance,
        JDBCInstanceSource.region == region,
        JDBCInstanceSource.account_id == account,
        JDBCInstanceSource.account_provider_id == provider).delete()
    session.commit()


def hide_jdbc_connection(provider: str, account: str, region: str, instance: str):
    session = get_session()
    jdbc_instance_source: JDBCInstanceSource = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.instance_id == instance,
                                                                                        JDBCInstanceSource.region == region,
                                                                                        JDBCInstanceSource.account_id == account,
                                                                                        JDBCInstanceSource.account_provider_id == provider).order_by(
        desc(JDBCInstanceSource.detection_history_id)).first()
    jdbc_instance_source.detection_history_id = -1
    session.merge(jdbc_instance_source)
    session.commit()

def update_jdbc_connection_full(jdbc_instance: schemas.JDBCInstanceSourceUpdate):
    session = get_session()
    jdbc_instance_source: JDBCInstanceSource = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.instance_id == jdbc_instance.instance_id,
                                                                                        JDBCInstanceSource.region == jdbc_instance.region,
                                                                                        JDBCInstanceSource.account_id == jdbc_instance.account_id,
                                                                                        JDBCInstanceSource.account_provider_id == jdbc_instance.account_provider_id).order_by(
        desc(JDBCInstanceSource.detection_history_id)).first()
    jdbc_instance_source.detection_history_id = 0
    jdbc_instance_source.description = jdbc_instance.description
    jdbc_instance_source.jdbc_connection_url = jdbc_instance.jdbc_connection_url
    jdbc_instance_source.jdbc_connection_schema = jdbc_instance.jdbc_connection_schema
    jdbc_instance_source.jdbc_enforce_ssl = jdbc_instance.jdbc_enforce_ssl
    jdbc_instance_source.kafka_ssl_enabled = jdbc_instance.kafka_ssl_enabled
    jdbc_instance_source.master_username = jdbc_instance.master_username
    jdbc_instance_source.skip_custom_jdbc_cert_validation = jdbc_instance.skip_custom_jdbc_cert_validation
    jdbc_instance_source.custom_jdbc_cert = jdbc_instance.custom_jdbc_cert
    jdbc_instance_source.custom_jdbc_cert_string = jdbc_instance.custom_jdbc_cert_string
    jdbc_instance_source.network_availability_zone = jdbc_instance.network_availability_zone
    jdbc_instance_source.network_subnet_id = jdbc_instance.network_subnet_id
    jdbc_instance_source.network_sg_id = jdbc_instance.network_sg_id
    jdbc_instance_source.jdbc_driver_class_name = jdbc_instance.jdbc_driver_class_name
    jdbc_instance_source.jdbc_driver_jar_uri = jdbc_instance.jdbc_driver_jar_uri
    # jdbc_instance_source.glue_database = None
    # jdbc_instance_source.glue_crawler = None
    jdbc_instance_source.glue_connection = jdbc_instance_source.glue_connection
    # jdbc_instance_source.glue_vpc_endpoint = None
    jdbc_instance_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    jdbc_instance_source.glue_state = ConnectionState.AUTHORIZED.value
    session.merge(jdbc_instance_source)
    session.commit()

def get_total_s3_buckets_count():
    count = list_s3_bucket_source(None)
    return 0 if count is None else list_s3_bucket_source(None).count()


def get_connected_s3_buckets_size():
    count = list_s3_bucket_source(None)
    return 0 if count is None else count.filter(S3BucketSource.glue_state == ConnectionState.ACTIVE.value).count()


def get_total_rds_instances_count():
    count = list_rds_instance_source(None)
    return 0 if count is None else count.count()


def get_connected_rds_instances_count():
    count = list_rds_instance_source(None)
    return 0 if count is None else count.filter(RdsInstanceSource.glue_state == ConnectionState.ACTIVE.value).count()

def query_jdbc_connections_sub_info():
    return get_session().query(JDBCInstanceSource.glue_connection, JDBCInstanceSource.account_provider_id, JDBCInstanceSource.account_id).all()

def delete_account_by_region(account_id: str, region: str):
    session = get_session()
    session.query(Account).filter(
        Account.account_provider_id == Provider.AWS_CLOUD.value,
        Account.account_id == account_id,
        Account.region == region
    ).delete()
    session.commit()


def delete_s3_bucket_source_by_account(account_id: str, region: str):
    session = get_session()
    session.query(S3BucketSource).filter(
        S3BucketSource.account_id == account_id,
        S3BucketSource.region == region
    ).delete()
    session.commit()


def delete_s3_bucket_source_by_name(account_id: str, region: str, bucket_name: str):
    session = get_session()
    session.query(S3BucketSource).filter(
        S3BucketSource.account_id == account_id,
        S3BucketSource.region == region,
        S3BucketSource.bucket_name == bucket_name
    ).delete()
    session.commit()


def delete_rds_instance_source_by_account(account_id: str, region: str):
    session = get_session()
    session.query(RdsInstanceSource).filter(
        RdsInstanceSource.account_id == account_id,
        RdsInstanceSource.region == region
    ).delete()
    session.commit()


def delete_rds_instance_source_by_instance_id(account_id: str, region: str, rds_instance_id: str):
    session = get_session()
    session.query(RdsInstanceSource).filter(
        RdsInstanceSource.account_id == account_id,
        RdsInstanceSource.region == region,
        RdsInstanceSource.instance_id == rds_instance_id
    ).delete()
    session.commit()


def cleanup_delegated_account(delegated_account_id: str, service_managed_stack_name: str):
    session = get_session()
    session.query(Account).filter(Account.delegated_account_id == delegated_account_id,
                                  Account.stackset_name == service_managed_stack_name).delete()
    session.commit()


def add_account(aws_account_id: str, aws_account_alias: str, aws_account_email: str, delegated_aws_account_id: str,
                region: str, organization_unit_id: str, stack_id: str, stackset_id: str, stackset_name: str,
                status: str, stack_status: str,
                stack_instance_status: str, detection_role_name: str, detection_role_status: str):
    session = get_session()
    account: Account = session.query(Account).filter(Account.account_provider_id == Provider.AWS_CLOUD.value,
                                                     Account.account_id == aws_account_id, Account.region == region).first()
    if account is None:
        account = Account(account_provider_id=Provider.AWS_CLOUD.value,
                          account_id=aws_account_id,
                          account_alias=aws_account_alias,
                          account_email=aws_account_email,
                          delegated_account_id=delegated_aws_account_id,
                          region=region,
                          organization_unit_id=organization_unit_id,
                          stack_id=stack_id,
                          stackset_id=stackset_id,
                          stackset_name=stackset_name,
                          status=status,
                          stack_status=stack_status,
                          stack_instance_status=stack_instance_status,
                          detection_role_name=detection_role_name,
                          detection_role_status=detection_role_status,
                          total_s3_bucket=0,
                          connected_s3_bucket=0,
                          total_rds_instance=0,
                          connect_rds_instance=0,
                          total_jdbc_instance=0,
                          connected_jdbc_instance=0,
                          last_updated=datetime.datetime.utcnow())

    else:
        account.account_alias = aws_account_alias,
        account.account_email = aws_account_email,
        account.delegated_account_id = delegated_aws_account_id,
        account.region = region,
        account.organization_unit_id = organization_unit_id,
        account.stack_id = stack_id,
        account.stackset_id = stackset_id,
        account.stackset_name = stackset_name,
        account.status = status,
        account.stack_status = stack_status,
        account.stack_instance_status = stack_instance_status,
        account.detection_role_name = detection_role_name,
        account.detection_role_status = detection_role_status,
        account.last_updated = datetime.datetime.utcnow()
    session.merge(account)
    session.commit()
    return True


def add_third_account(account, role_arn):
    session = get_session()
    tmp_account = session.query(Account).filter(Account.account_provider_id == account.account_provider,
                                                Account.account_id == account.account_id,
                                                Account.region == account.region).all()

    if tmp_account:
        raise BizException(MessageEnum.SOURCE_ACCOUNT_ALREADY_EXISTS.get_code(),
                           MessageEnum.SOURCE_ACCOUNT_ALREADY_EXISTS.get_msg())
    target_account = Account()
    target_account.account_provider_id = account.account_provider
    target_account.account_id = account.account_id
    target_account.region = account.region
    target_account.connected_jdbc_instance = 0
    target_account.total_jdbc_instance = 0
    target_account.status = SourceAccountStatus.ENABLE.value
    target_account.detection_role_name = role_arn
    target_account.detection_role_status = 'SUCCESS'
    session.merge(target_account)
    session.commit()
    return True


# def get_source_s3_account_region():
#     return (get_session()
#             .query(S3BucketSource.region, S3BucketSource.account_id)
#             .distinct()
#             .all()
#             )

# def get_source_proxy_account_region():
#     return (get_session()
#             .query(Account.region, Account.account_id)
#             .filter(Account.account_provider_id == Provider.JDBC_PROXY.value)
#             .distinct()
#             .all()
#             )

def get_source_aws_account_region():
    return (get_session()
            .query(Account.region, Account.account_id)
            .filter(or_(Account.account_provider_id == Provider.AWS_CLOUD.value, Account.account_provider_id == Provider.JDBC_PROXY.value ))
            .distinct()
            .all()
            )

def import_glue_database(glue_database_param: schemas.SourceGlueDatabase, res: dict):
    if len(res['CreateTableDefaultPermissions']) == 1:
        CreateTableDefaultPermissions = res['CreateTableDefaultPermissions'][0]
        session = get_session()
        glue_database = SourceGlueDatabase()
        glue_database.glue_database_name = glue_database_param.glue_database_name
        glue_database.glue_database_location_uri = res['LocationUri'] if 'LocationUri' in res else None
        glue_database.glue_database_description = res['Description'] if 'Description' in res else None
        glue_database.glue_database_create_time = res['CreateTime'] if 'CreateTime' in res else None
        glue_database.glue_database_catalog_id = res['CatalogId'] if 'CatalogId' in res else None
        glue_database.data_lake_principal_identifier = CreateTableDefaultPermissions['Principal']['DataLakePrincipalIdentifier']
        glue_database.permissions = CreateTableDefaultPermissions['Permissions']
        glue_database.region = glue_database_param.region
        glue_database.account_id = glue_database_param.account_id
        glue_database.detection_history_id = glue_database_param.detection_history_id
        session.add(glue_database)
        session.commit()
        session.refresh(glue_database)
        return glue_database
    else:
        return False

def copy_properties(jdbc_instance_target: JDBCInstanceSource, jdbc_instance_origin: schemas.JDBCInstanceSourceFullInfo):
    jdbc_instance_target.instance_id = jdbc_instance_origin.instance_id
    jdbc_instance_target.description = jdbc_instance_origin.description
    jdbc_instance_target.jdbc_connection_url = jdbc_instance_origin.jdbc_connection_url
    jdbc_instance_target.jdbc_connection_schema = jdbc_instance_origin.jdbc_connection_schema
    jdbc_instance_target.jdbc_enforce_ssl = jdbc_instance_origin.jdbc_enforce_ssl
    jdbc_instance_target.kafka_ssl_enabled = jdbc_instance_origin.kafka_ssl_enabled
    jdbc_instance_target.master_username = jdbc_instance_origin.master_username
    jdbc_instance_target.skip_custom_jdbc_cert_validation = jdbc_instance_origin.skip_custom_jdbc_cert_validation
    jdbc_instance_target.custom_jdbc_cert = jdbc_instance_origin.custom_jdbc_cert
    jdbc_instance_target.custom_jdbc_cert_string = jdbc_instance_origin.custom_jdbc_cert_string
    jdbc_instance_target.network_availability_zone = jdbc_instance_origin.network_availability_zone
    jdbc_instance_target.network_subnet_id = jdbc_instance_origin.network_subnet_id
    jdbc_instance_target.network_sg_id = jdbc_instance_origin.network_sg_id
    jdbc_instance_target.jdbc_driver_class_name = jdbc_instance_origin.jdbc_driver_class_name
    jdbc_instance_target.jdbc_driver_jar_uri = jdbc_instance_origin.jdbc_driver_jar_uri
    jdbc_instance_target.detection_history_id = 0
    jdbc_instance_target.account_provider_id = jdbc_instance_origin.account_provider_id
    jdbc_instance_target.account_id = jdbc_instance_origin.account_id
    jdbc_instance_target.region = jdbc_instance_origin.region
    jdbc_instance_target.glue_database = jdbc_instance_origin.glue_database
    jdbc_instance_target.glue_crawler = jdbc_instance_origin.glue_crawler
    jdbc_instance_target.glue_connection = jdbc_instance_origin.glue_connection
    jdbc_instance_target.create_type = jdbc_instance_origin.create_type
    jdbc_instance_target.glue_state = ConnectionState.AUTHORIZED.value
    return jdbc_instance_target

def add_jdbc_conn(jdbcConn: schemas.JDBCInstanceSourceFullInfo):
    session = get_session()

    jdbc_instance_source = JDBCInstanceSource()
    target: JDBCInstanceSource = copy_properties(jdbc_instance_source, jdbcConn)

    session.add(target)
    session.commit()
    session.refresh(target)

    return jdbc_instance_source

def update_jdbc_conn(jdbc_conn_param: schemas.JDBCInstanceSourceFullInfo):
    session = get_session()
    jdbc_instance_source: JDBCInstanceSource = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == Provider.AWS_CLOUD.value,
                                                                                        JDBCInstanceSource.account_id == jdbc_conn_param.account_id,
                                                                                        JDBCInstanceSource.instance_id == jdbc_conn_param.instance_id).first()
    jdbc_instance_source = copy_properties(jdbc_instance_source, jdbc_conn_param)

    # session.add(jdbc_instance_source)
    session.commit()
    # session.refresh(jdbc_instance_source)

    return jdbc_instance_source


def set_jdbc_instance_connection_status(jdbc_conn_param: schemas.JDBCInstanceSourceUpdateBase):
    session = get_session()
    session.query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == jdbc_conn_param.account_provider_id,
                                             JDBCInstanceSource.account_id == jdbc_conn_param.account_id,
                                             JDBCInstanceSource.region == jdbc_conn_param.region,
                                             JDBCInstanceSource.instance_id == jdbc_conn_param.instance_id).update(jdbc_conn_param.dict(exclude_unset=True))
    session.commit()

def query_regions_by_provider(provider_id: int):
    return get_session().query(SourceRegion).filter(SourceRegion.provider_id == provider_id,
                                                    SourceRegion.status == SourceRegionStatus.ENABLE.value).all()


def query_provider_list() -> list[SourceProvider]:
    return get_session().query(SourceProvider).filter(SourceProvider.status == SourceProviderStatus.ENABLE.value).all()


def list_distinct_provider() -> list[SourceProvider]:
    return get_session().query(SourceProvider).filter(
        SourceProvider.status == SourceProviderStatus.ENABLE.value).distinct(SourceProvider.provider_name).all()


def query_resources_by_provider(provider_id: int) -> list[SourceResource]:
    return get_session().query(SourceResource).filter(SourceResource.status == SourceResourcesStatus.ENABLE.value,
                                                      SourceResource.provider_id == provider_id).all()


def get_account_list_by_provider(provider_id):
    return get_session().query(Account).filter(Account.account_provider_id == provider_id,
                                               Account.status == SourceAccountStatus.ENABLE.value).all()

def get_enable_account_list():
    return get_session().query(Account).filter(Account.status == SourceAccountStatus.ENABLE.value).all()

def get_enable_region_list():
    return get_session().query(SourceRegion).filter(SourceRegion.status == SourceRegionStatus.ENABLE.value).all()

def list_distinct_region_by_provider(provider_id) -> list[SourceRegion]:
    return get_session().query(SourceRegion).filter(SourceRegion.provider_id == provider_id,
                                                    SourceRegion.status == SourceRegionStatus.ENABLE.value).distinct(
        SourceRegion.region_name).all()


def get_distinct_region_list_by_provider(provider_id):
    return get_session().query(Account.region).filter(Account.account_provider_id == provider_id).distinct(Account.region).all()


def get_total_jdbc_instances_count(provider_id):
    list = list_jdbc_instance_source_without_condition(provider_id)
    return 0 if not list else list.filter(JDBCInstanceSource.detection_history_id != -1).count()


def get_connected_jdbc_instances_count(provider_id):
    list = list_jdbc_instance_source_without_condition(provider_id)
    return 0 if not list else list.filter(JDBCInstanceSource.detection_history_id != -1, JDBCInstanceSource.glue_state == ConnectionState.ACTIVE.value).count()

def get_total_glue_database_count():
    list = list_glue_database_source_without_condition()
    return 0 if not list else list.count()


def get_connected_glue_database_count():
    list = list_glue_database_source_without_condition()
    return 0 if not list else list.filter(SourceGlueDatabase.glue_state == ConnectionState.ACTIVE.value).count()


def get_schema_by_snapshot(provider_id, account_id, region, instance):
    return get_session().query(JDBCInstanceSource.jdbc_connection_schema, JDBCInstanceSource.network_subnet_id) \
        .filter(JDBCInstanceSource.account_provider_id == provider_id) \
        .filter(JDBCInstanceSource.account_id == account_id) \
        .filter(JDBCInstanceSource.instance_id == instance) \
        .filter(JDBCInstanceSource.region == region).first()


def get_connection_by_instance(provider_id, account_id, region, instance):
    return get_session().query(JDBCInstanceSource.glue_connection) \
        .filter(JDBCInstanceSource.account_provider_id == provider_id) \
        .filter(JDBCInstanceSource.account_id == account_id) \
        .filter(JDBCInstanceSource.instance_id == instance) \
        .filter(JDBCInstanceSource.region == region).first()


def get_crawler_glue_db_by_instance(provider_id, account_id, region, instance):
    return get_session().query(JDBCInstanceSource.glue_crawler, JDBCInstanceSource.glue_database, JDBCInstanceSource.glue_connection) \
        .filter(JDBCInstanceSource.account_provider_id == provider_id) \
        .filter(JDBCInstanceSource.account_id == account_id) \
        .filter(JDBCInstanceSource.instance_id == instance) \
        .filter(JDBCInstanceSource.region == region).first()

def get_enable_account_list():
    return get_session().query(Account.account_provider_id, Account.account_id, Account.region) \
        .filter(Account.status == SourceAccountStatus.ENABLE.value).all()

def update_schema_by_account(provider_id, account_id, instance, region, schema):
    session = get_session()
    jdbc_instance_source = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == provider_id, 
                                                                    JDBCInstanceSource.region == region,
                                                                    JDBCInstanceSource.account_id == account_id,
                                                                    JDBCInstanceSource.instance_id == instance).first()
    if jdbc_instance_source:
        jdbc_instance_source.jdbc_connection_schema = schema
    session.commit()

def list_s3_resources(account_id, region, condition):
    session_result = get_session().query(S3BucketSource)
    if account_id:
        session_result = session_result.filter(S3BucketSource.account_id == account_id)
    if region:
        session_result = session_result.filter(S3BucketSource.region == region)
    if condition:
        return query_with_condition(session_result, condition)
    return session_result

def list_rds_resources(account_id, region, condition):
    session_result = get_session().query(RdsInstanceSource)
    if account_id:
        session_result = session_result.filter(RdsInstanceSource.account_id == account_id)
    if region:
        session_result = session_result.filter(RdsInstanceSource.region == region)
    if condition:
        return query_with_condition(session_result, condition)
    return session_result

def list_glue_resources(account_id, region, condition):
    session_result = get_session().query(SourceGlueDatabase)
    if account_id:
        session_result = session_result.filter(SourceGlueDatabase.account_id == account_id)
    if region:
        session_result = session_result.filter(SourceGlueDatabase.region == region)
    if condition:
        return query_with_condition(session_result, condition)
    return session_result

def list_jdbc_resources_by_provider(provider_id: int, account_id, region, condition):
    session_result = get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider_id == provider_id)
    if account_id:
        session_result = session_result.filter(JDBCInstanceSource.account_id == account_id)
    if region:
        session_result = session_result.filter(JDBCInstanceSource.region == region)
    if condition:
        return query_with_condition(session_result, condition)
    return session_result

# ["account_id", "region", "bucket_name", "crawler_status", "last_updated_at", "last_updated_by"]
def get_datasource_from_s3():
    return get_session().query(S3BucketSource.account_id,
                               S3BucketSource.region,
                               S3BucketSource.bucket_name,
                               S3BucketSource.glue_state,
                               S3BucketSource.modify_time,
                               S3BucketSource.modify_by
                               ).all()

# ["account_id", "region", "instance_name", "engine_type", "location", "crawler_status", "last_updated_at", "last_updated_by"]
def get_datasource_from_rds():
    return get_session().query(RdsInstanceSource.account_id,
                               RdsInstanceSource.region,
                               RdsInstanceSource.instance_id,
                               RdsInstanceSource.engine,
                               RdsInstanceSource.address,
                               RdsInstanceSource.glue_state,
                               RdsInstanceSource.modify_time,
                               RdsInstanceSource.modify_by
                               ).all()

# ["account_id", "region", "database_name", "description", "location", "crawler_status", "last_updated_at", "last_updated_by"]
def get_datasource_from_glue():
    return get_session().query(SourceGlueDatabase.account_id,
                               SourceGlueDatabase.region,
                               SourceGlueDatabase.glue_database_name,
                               SourceGlueDatabase.glue_database_description,
                               SourceGlueDatabase.glue_database_location_uri,
                               SourceGlueDatabase.glue_state,
                               SourceGlueDatabase.modify_time,
                               SourceGlueDatabase.modify_by).all()

# ["type", "account_id", "region", "instance_name", "description", "location", "crawler_status", "last_updated_at", "last_updated_by"]
def get_datasource_from_jdbc():
    return get_session().query(JDBCInstanceSource.account_provider_id,
                               JDBCInstanceSource.account_id,
                               JDBCInstanceSource.region,
                               JDBCInstanceSource.instance_id,
                               JDBCInstanceSource.description,
                               JDBCInstanceSource.jdbc_connection_url,
                               JDBCInstanceSource.glue_state,
                               JDBCInstanceSource.modify_time,
                               JDBCInstanceSource.modify_by).all()
