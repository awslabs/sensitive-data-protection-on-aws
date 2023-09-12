import datetime

from sqlalchemy import desc
from common.enum import ConnectionState, MessageEnum, Provider
from common.query_condition import QueryCondition, query_with_condition
from db.database import get_session
from db.models_data_source import S3BucketSource, Account, RdsInstanceSource, JDBCInstanceSource
from common.exception_handler import BizException
from . import schemas


def list_accounts(condition: QueryCondition):
    return query_with_condition(get_session().query(Account).filter(Account.status == 1), condition).distinct(
        Account.account_provider, Account.account_id, Account.region)


def list_all_accounts_by_region(region: str):
    query = get_session().query(
        Account.account_id,
        Account.region
    ).filter(
        Account.account_provider == Provider.AWS.value,
        Account.status == 1,
        Account.region == region
    ).distinct(
        Account.account_provider,
        Account.account_id,
        Account.region
    ).all()
    return query


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
    accounts = get_session().query(Account).filter(Account.account_provider == Provider.AWS.value, Account.status == 1).all()
    account_ids = []
    for account in accounts:
        account_ids.append(account.account_id)
    buckets = get_session().query(S3BucketSource).filter(S3BucketSource.aws_account.in_(account_ids))
    buckets = query_with_condition(buckets, condition)
    return buckets


def list_s3_bucket_source_by_account(account_id: str, region: str, state: str):
    # status = 0 : admin
    # status = 1 : monitored account
    bucket_names = []
    buckets = get_session().query(S3BucketSource).filter(
        S3BucketSource.aws_account == account_id,
        S3BucketSource.region == region,
        S3BucketSource.glue_state != ConnectionState.PENDING.value,
        S3BucketSource.glue_state != ConnectionState.ACTIVE.value,
        S3BucketSource.glue_state != ConnectionState.CRAWLING.value
    )
    if buckets is not None:
        for bucket in buckets:
            bucket_names.append(bucket.bucket_name)
    buckets = get_session().query(S3BucketSource).filter(
        S3BucketSource.aws_account == account_id,
        S3BucketSource.region == region,
        S3BucketSource.glue_state == state
    )
    if buckets is not None:
        for bucket in buckets:
            bucket_names.append(bucket.bucket_name)

    return bucket_names


def list_rds_instance_source(condition: QueryCondition):
    # status = 0 : admin
    # status = 1 : monitored account
    instances = None
    accounts = get_session().query(Account).filter(Account.account_provider == Provider.AWS.value, Account.status == 1).all()
    account_ids = []
    for account in accounts:
        account_ids.append(account.account_id)
    instances = get_session().query(RdsInstanceSource).filter(
        RdsInstanceSource.aws_account.in_(account_ids))
    instances = query_with_condition(instances, condition)
    return instances


def list_jdbc_instance_source(condition: QueryCondition):
    # instances = Nonex
    # account_provider = filter(lambda item: item.column == "account_provider", condition.conditions)[0]
    # account_id = filter(lambda item: item.column == "account_id", condition.conditions)[0]
    # instances_tmp = get_session().query(JDBCInstanceSource).filter(
    #     JDBCInstanceSource.account_provider == account_provider, JDBCInstanceSource.account_id == account_id)
    # instances = query_with_condition(instances_tmp, condition)

    # return instances
    return query_with_condition(get_session().query(JDBCInstanceSource), condition)


def set_rds_instance_source_glue_state(account: str, region: str, instance_id: str, state: str):
    session = get_session()
    rds_instance_source = session.query(RdsInstanceSource).filter(RdsInstanceSource.instance_id == instance_id,
                                                                  RdsInstanceSource.region == region,
                                                                  RdsInstanceSource.aws_account == account).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    if rds_instance_source is not None:
        rds_instance_source.glue_state = state
        session.merge(rds_instance_source)
        session.commit()
    else:
        return None


def get_rds_instance_source_glue_state(account: str, region: str, instance_id: str):
    rds = get_session().query(RdsInstanceSource).filter(RdsInstanceSource.instance_id == instance_id,
                                                        RdsInstanceSource.region == region,
                                                        RdsInstanceSource.aws_account == account).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    if rds is not None:
        return rds.glue_state
    else:
        return None

def get_jdbc_instance_source_glue_state(provider: str, account: str, region: str, instance_id: str):
    account_tmp = get_session().query(Account.id).filter(Account.account_provider == provider, Account.account_id == account).first()
    rds = get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.data_source_id == account_tmp[0],
                                                         JDBCInstanceSource.instance_id == instance_id,
                                                         JDBCInstanceSource.region == region,
                                                         JDBCInstanceSource.aws_account == account).order_by(
        desc(JDBCInstanceSource.detection_history_id)).first()
    if rds is not None:
        return rds.glue_state
    else:
        return None


def update_rds_instance_count(account: str, region: str):
    session = get_session()

    connected = session.query(RdsInstanceSource).filter(RdsInstanceSource.region == region,
                                                        RdsInstanceSource.aws_account == account,
                                                        RdsInstanceSource.glue_state == ConnectionState.ACTIVE.value).count()
    total = session.query(RdsInstanceSource).filter(RdsInstanceSource.region == region,
                                                    RdsInstanceSource.aws_account == account).count()

    account = session.query(Account).filter(Account.account_id == account, Account.region == region).first()
    if account is not None:
        account.connect_rds_instance = connected
        account.total_rds_instance = total
    session.merge(account)
    session.commit()


def get_rds_instance_source(account: str, region: str, instance_id: str):
    return get_session().query(RdsInstanceSource).filter(RdsInstanceSource.aws_account == account,
                                                         RdsInstanceSource.region == region,
                                                         RdsInstanceSource.instance_id == instance_id).scalar()

def get_jdbc_instance_source(provider: str, account: str, region: str, instance_id: str):
    return get_session().query(JDBCInstanceSource).filter(JDBCInstanceSource.account_provider == provider,
                                                          JDBCInstanceSource.account_id == account,
                                                          JDBCInstanceSource.region == region,
                                                          JDBCInstanceSource.instance_id == instance_id).scalar()

def get_s3_bucket_source(account: str, region: str, bucket_name: str):
    return get_session().query(S3BucketSource).filter(S3BucketSource.aws_account == account,
                                                      S3BucketSource.region == region,
                                                      S3BucketSource.bucket_name == bucket_name).scalar()

def get_iam_role(account: str):
    return get_session().query(Account).filter(Account.account_id == account,
                                               Account.detection_role_name != None).first().detection_role_name


def create_s3_connection(account: str, region: str, bucket: str, glue_connection_name, glue_database_name: str,
                         crawler_name: str):
    session = get_session()
    s3_bucket_source = session.query(S3BucketSource).filter(S3BucketSource.bucket_name == bucket,
                                                            S3BucketSource.region == region,
                                                            S3BucketSource.aws_account == account).scalar()
    if s3_bucket_source is None:
        s3_bucket_source = S3BucketSource(bucket_name=bucket, region=region,
                                          aws_account=account)
    s3_bucket_source.glue_connection = glue_connection_name
    s3_bucket_source.glue_database = glue_database_name
    s3_bucket_source.glue_crawler = crawler_name
    s3_bucket_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    s3_bucket_source.glue_state = ConnectionState.CRAWLING.value
    session.merge(s3_bucket_source)
    session.commit()


def set_s3_bucket_source_glue_state(account: str, region: str, bucket: str, state: str):
    session = get_session()
    s3_bucket_source = session.query(S3BucketSource).filter(S3BucketSource.bucket_name == bucket,
                                                            S3BucketSource.region == region,
                                                            S3BucketSource.aws_account == account).order_by(
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
                                                       S3BucketSource.aws_account == account).order_by(
        desc(S3BucketSource.detection_history_id)).first()
    if query is None:
        return None
    return query.glue_state


def update_s3_bucket_count(account: str, region: str):
    session = get_session()

    connected = session.query(S3BucketSource).filter(S3BucketSource.region == region,
                                                     S3BucketSource.aws_account == account,
                                                     S3BucketSource.glue_state == ConnectionState.ACTIVE.value).count()
    total = session.query(S3BucketSource).filter(S3BucketSource.region == region,
                                                 S3BucketSource.aws_account == account).count()

    account = session.query(Account).filter(Account.account_id == account, Account.region == region).first()
    if account is not None:
        account.connected_s3_bucket = connected
        account.total_s3_bucket = total
    session.merge(account)
    session.commit()

def update_jdbc_instance_count(account: str, region: str):
    session = get_session()

    connected = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.region == region,
                                                     JDBCInstanceSource.aws_account == account,
                                                     JDBCInstanceSource.glue_state == ConnectionState.ACTIVE.value).count()
    total = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.region == region,
                                                 JDBCInstanceSource.aws_account == account).count()

    account = session.query(Account).filter(Account.account_id == account, Account.region == region).first()
    if account is not None:
        account.connected_jdbc_instance = connected
        account.total_jdbc_instance = total
    session.merge(account)
    session.commit()

def create_rds_connection(account: str, region: str, instance: str, glue_connection: str, glue_database: str
                          , glue_vpc_endpoint_id: str, crawler_name: str):
    session = get_session()
    rds_instance_source = session.query(RdsInstanceSource).filter(RdsInstanceSource.instance_id == instance,
                                                                  RdsInstanceSource.region == region,
                                                                  RdsInstanceSource.aws_account == account).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    if rds_instance_source is None:
        rds_instance_source = RdsInstanceSource(instance_id=instance, region=region,
                                                aws_account=account)
    rds_instance_source.glue_database = glue_database
    rds_instance_source.glue_crawler = crawler_name
    rds_instance_source.glue_connection = glue_connection
    rds_instance_source.glue_vpc_endpoint = glue_vpc_endpoint_id
    rds_instance_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    rds_instance_source.glue_state = ConnectionState.CRAWLING.value
    session.merge(rds_instance_source)
    session.commit()

def delete_third_account(account_provider, account_id, region):
    session = get_session()
    del_data = session.query(Account).filter(Account.account_provider == account_provider, Account.account_id == account_id, Account.region == region).delete()
    if not del_data:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.commit()


def delete_s3_bucket_connection(account: str, region: str, bucket_name: str):
    session = get_session()
    s3_bucket_source = session.query(S3BucketSource).filter(S3BucketSource.bucket_name == bucket_name,
                                                            S3BucketSource.region == region,
                                                            S3BucketSource.aws_account == account).scalar()

    s3_bucket_source.glue_database = None
    s3_bucket_source.glue_crawler = None
    s3_bucket_source.glue_connection = None
    s3_bucket_source.glue_vpc_endpoint = None
    s3_bucket_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    s3_bucket_source.glue_state = None
    session.merge(s3_bucket_source)
    session.commit()


def delete_rds_connection(account: str, region: str, instance: str):
    session = get_session()
    rds_instance_source = session.query(RdsInstanceSource).filter(RdsInstanceSource.instance_id == instance,
                                                                  RdsInstanceSource.region == region,
                                                                  RdsInstanceSource.aws_account == account).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    rds_instance_source.glue_database = None
    rds_instance_source.glue_crawler = None
    rds_instance_source.glue_connection = None
    rds_instance_source.glue_vpc_endpoint = None
    rds_instance_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    rds_instance_source.glue_state = None
    session.merge(rds_instance_source)
    session.commit()

def delete_jdbc_connection(provider: str, account: str, region: str, instance: str):
    session = get_session()
    jdbc_instance_source = session.query(JDBCInstanceSource).filter(JDBCInstanceSource.instance_id == instance,
                                                                  JDBCInstanceSource.region == region,
                                                                  JDBCInstanceSource.aws_account == account,
                                                                  JDBCInstanceSource.account_provider == provider).order_by(
        desc(RdsInstanceSource.detection_history_id)).first()
    jdbc_instance_source.glue_database = None
    jdbc_instance_source.glue_crawler = None
    jdbc_instance_source.glue_connection = None
    jdbc_instance_source.glue_vpc_endpoint = None
    jdbc_instance_source.glue_crawler_last_updated = datetime.datetime.utcnow()
    jdbc_instance_source.glue_state = None
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


# def add_account(account_id: str, assumed_role_name: str):
#     session = get_session()
#     account = session.query(Account).filter(Account.account_id == account_id, Account.status == 1).scalar()
#     if account is None:
#         account = Account(aws_account_id=account_id)
#
#     account.status = 1  # always 1
#     account.detection_role_name = assumed_role_name
#     account.last_updated = datetime.datetime.utcnow()
#     account = session.merge(account)
#     session.commit()
#     return True

def delete_account_by_region(account_id: str, region: str):
    session = get_session()
    session.query(Account).filter(
        Account.account_provider == Provider.AWS.value,
        Account.account_id == account_id,
        Account.region == region
    ).delete()
    session.commit()


def delete_s3_bucket_source_by_account(account_id: str, region: str):
    session = get_session()
    session.query(S3BucketSource).filter(
        S3BucketSource.aws_account == account_id,
        S3BucketSource.region == region
    ).delete()
    session.commit()


def delete_s3_bucket_source_by_name(account_id: str, region: str, bucket_name: str):
    session = get_session()
    session.query(S3BucketSource).filter(
        S3BucketSource.aws_account == account_id,
        S3BucketSource.region == region,
        S3BucketSource.bucket_name == bucket_name
    ).delete()
    session.commit()


def delete_rds_instance_source_by_account(account_id: str, region: str):
    session = get_session()
    session.query(RdsInstanceSource).filter(
        RdsInstanceSource.aws_account == account_id,
        RdsInstanceSource.region == region
    ).delete()
    session.commit()


def delete_rds_instance_source_by_instance_id(account_id: str, region: str, rds_instance_id: str):
    session = get_session()
    session.query(RdsInstanceSource).filter(
        RdsInstanceSource.aws_account == account_id,
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
    account = session.query(Account).filter(Account.account_provider == Provider.AWS.value, Account.account_id == aws_account_id, Account.region == region).first()
    if account is None:
        account = Account(account_provider=Provider.AWS.value,
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
                          connect_jdbc_instance=0,
                          last_updated=datetime.datetime.utcnow())

    else:
        account.aws_account_alias = aws_account_alias,
        account.aws_account_email = aws_account_email,
        account.delegated_aws_account_id = delegated_aws_account_id,
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

def add_third_account(account):
    session = get_session()
    account = session.query(Account).filter(Account.account_provider == Provider.AWS.value, Account.account_id == account.aws_account_id, Account.region == account.region).all()
    if not account:
        raise BizException(MessageEnum.SOURCE_ACCOUNT_ALREADY_EXISTS.get_code(),
                           MessageEnum.SOURCE_ACCOUNT_ALREADY_EXISTS.get_msg())
    target_account = Account()
    target_account.account_provider = account.account_provider
    target_account.account_id = account.account_id
    target_account.region = account.region
    session.merge(account)
    session.commit()
    return True


def get_source_s3_account_region():
    return (get_session()
            .query(S3BucketSource.region, S3BucketSource.aws_account)
            .distinct()
            .all()
            )


def get_source_rds_account_region():
    return (get_session()
            .query(RdsInstanceSource.region, RdsInstanceSource.aws_account)
            .distinct()
            .all()
            )

def add_jdbc_conn(jdbcConn: schemas.JDBCInstanceSource):
    session = get_session()

    jdbc_instance_source = JDBCInstanceSource()
    jdbc_instance_source.instance_id = jdbcConn.instance_id
    jdbc_instance_source.description = jdbcConn.description
    jdbc_instance_source.jdbc_connection_url = jdbcConn.jdbc_connection_url
    jdbc_instance_source.jdbc_enforce_ssl = jdbcConn.jdbc_enforce_ssl
    jdbc_instance_source.kafka_ssl_enabled = jdbcConn.kafka_ssl_enabled
    jdbc_instance_source.master_username = jdbcConn.master_username
    jdbc_instance_source.skip_custom_jdbc_cert_validation = jdbcConn.skip_custom_jdbc_cert_validation
    jdbc_instance_source.custom_jdbc_cert = jdbcConn.custom_jdbc_cert
    jdbc_instance_source.custom_jdbc_cert_string = jdbcConn.custom_jdbc_cert_string
    jdbc_instance_source.network_availability_zone = jdbcConn.network_availability_zone
    jdbc_instance_source.network_subnet_id = jdbcConn.network_subnet_id
    jdbc_instance_source.network_sg_id = jdbcConn.network_sg_id
    jdbc_instance_source.jdbc_driver_class_name = jdbcConn.jdbc_driver_class_name
    jdbc_instance_source.jdbc_driver_jar_uri = jdbcConn.jdbc_driver_jar_uri
    jdbc_instance_source.instance_class = jdbcConn.instance_class
    jdbc_instance_source.instance_status = jdbcConn.instance_status
    jdbc_instance_source.account_provider = jdbcConn.account_provider
    jdbc_instance_source.account_id = jdbcConn.account_id
    jdbc_instance_source.region = jdbcConn.region
    jdbc_instance_source.data_source_id = jdbcConn.data_source_id
    jdbc_instance_source.detection_history_id = jdbcConn.detection_history_id
    jdbc_instance_source.glue_database = jdbcConn.glue_database
    jdbc_instance_source.glue_crawler = jdbcConn.glue_crawler
    jdbc_instance_source.glue_connection = jdbcConn.glue_connection
    jdbc_instance_source.glue_vpc_endpoint = jdbcConn.glue_vpc_endpoint
    jdbc_instance_source.glue_state = jdbcConn.glue_state
    jdbc_instance_source.create_type = jdbcConn.create_type
    # jdbc_instance_source.

    session.add(jdbc_instance_source)
    session.commit()
    session.refresh(jdbc_instance_source)

    return jdbc_instance_source
