import db.models_discovery_job as models
from tools.pydantic_tool import parse_pydantic_schema
from db.database import get_session
import tools.mytime as mytime
from . import schemas
from common.exception_handler import BizException
from common.query_condition import QueryCondition, query_with_condition
from common.enum import MessageEnum, JobState, RunState, RunDatabaseState, DatabaseType, ConnectionState
from sqlalchemy import func
from common.constant import const
import uuid
from datetime import datetime
from data_source.resource_list import list_resources_by_database_type
from template.service import get_template_snapshot_no


def get_job(id: int) -> models.DiscoveryJob:
    db_job = get_session().query(models.DiscoveryJob).get(id)
    if db_job is None:
        raise BizException(MessageEnum.DISCOVERY_JOB_NON_EXIST.get_code(),
                           MessageEnum.DISCOVERY_JOB_NON_EXIST.get_msg())
    db_job.databases
    return db_job


def get_job_by_run_id(run_id: int) -> models.DiscoveryJob:
    subq = get_session().query(models.DiscoveryJobRun.job_id).filter(models.DiscoveryJobRun.id == run_id).subquery()
    db_job = get_session().query(models.DiscoveryJob).filter(models.DiscoveryJob.id == subq.c.job_id).first()
    if db_job is None:
        raise BizException(MessageEnum.DISCOVERY_JOB_NON_EXIST.get_code(),
                           MessageEnum.DISCOVERY_JOB_NON_EXIST.get_msg())
    db_job.databases
    return db_job


def list_jobs(condition: QueryCondition):
    return query_with_condition(get_session().query(models.DiscoveryJob), condition)


def create_job(job: schemas.DiscoveryJobCreate) -> models.DiscoveryJob:
    session = get_session()
    parsed_schema = parse_pydantic_schema(job)
    state = JobState.IDLE.value
    if job.schedule == const.ON_DEMAND:
        state = JobState.OD_READY.value
    db_job = models.DiscoveryJob(**parsed_schema,
                                 state=state,
                                 )
    session.add(db_job)
    session.commit()
    db_job.databases
    return db_job


def delete_job(id: int):
    session = get_session()
    session.query(models.DiscoveryJobDatabase).filter(models.DiscoveryJobDatabase.job_id == id).delete()
    session.query(models.DiscoveryJob).filter(models.DiscoveryJob.id == id).delete()
    session.commit()


def update_job(id: int, job: schemas.DiscoveryJobUpdate):
    session = get_session()
    size = session.query(models.DiscoveryJob).filter(models.DiscoveryJob.id == id).update(job.dict(exclude_unset=True))
    if size <= 0:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.commit()


def enable_job(id: int):
    session = get_session()
    job = schemas.DiscoveryJobState(state=JobState.IDLE.value)
    size = session.query(models.DiscoveryJob).filter(models.DiscoveryJob.id == id)\
              .filter(models.DiscoveryJob.state == JobState.PAUSED.value).update(job.dict(exclude_unset=True))
    if size <= 0:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.commit()


def disable_job(id: int):
    session = get_session()
    job = schemas.DiscoveryJobState(state=JobState.PAUSED.value)
    size = session.query(models.DiscoveryJob).filter(models.DiscoveryJob.id == id)\
              .filter(models.DiscoveryJob.state == JobState.IDLE.value).update(job.dict(exclude_unset=True))
    if size <= 0:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.commit()


def last_job_time() -> str:
    session = get_session()
    last_time = session.query(func.max(models.DiscoveryJob.last_end_time)).first()
    if last_time[0] is None:
        return "--"
    return mytime.format_time(last_time[0])


def get_running_run(job_id: int) -> models.DiscoveryJobRun:
    session = get_session()
    db_run = session.query(models.DiscoveryJobRun).filter(models.DiscoveryJobRun.job_id == job_id)\
                  .filter(models.DiscoveryJobRun.state.in_([RunState.RUNNING.value, RunState.STOPPING.value]))\
                  .order_by(models.DiscoveryJobRun.id.desc()).first()
    return db_run


def __get_database_name_key(database_type: str) -> str:
    if database_type == DatabaseType.S3.value:
        return "bucket_name"
    elif database_type == DatabaseType.RDS.value:
        return "instance_id"
    elif database_type == DatabaseType.GLUE.value:
        return "glue_database_name"
    else:
        return "instance_id"


def __add_job_databases(run: models.DiscoveryJobRun, database_type: str, base_time_dict: dict):
    data_sources = list_resources_by_database_type(database_type).all()
    database_name_key = __get_database_name_key(database_type)
    for data_source in data_sources:
        database_name = getattr(data_source, database_name_key)
        base_time = base_time_dict.get(f'{data_source.account_id}-{data_source.region}-{database_type}-{database_name}')
        run_database = models.DiscoveryJobRunDatabase(run_id=run.id,
                                                      account_id=data_source.account_id,
                                                      region=data_source.region,
                                                      database_type=database_type,
                                                      database_name=database_name,
                                                      base_time=base_time,
                                                      state=RunDatabaseState.READY.value,
                                                      uuid=uuid.uuid4().hex)
        run.databases.append(run_database)


def __build_base_time(job_databases: list[models.DiscoveryJobDatabase]) -> dict:
    base_time_dict = {}
    for job_database in job_databases:
        base_time_dict[f'{job_database.account_id}-{job_database.region}-{job_database.database_type}-{job_database.database_name}'] = job_database.base_time
    return base_time_dict


def init_run(job_id: int) -> int:
    session = get_session()
    job: models.DiscoveryJob = session.query(models.DiscoveryJob).get(job_id)
    if job.state == JobState.RUNNING.value or job.state == JobState.OD_RUNNING.value:
        return -1
    current_time = mytime.get_time()
    job_state = JobState.RUNNING.value
    if job.schedule == const.ON_DEMAND:
        job_state = JobState.OD_RUNNING.value
    job.state = job_state
    job.last_start_time = current_time
    job.last_end_time = None
    job_databases = session.query(models.DiscoveryJobDatabase).filter(
        models.DiscoveryJobDatabase.job_id == job_id).all()
    base_time_dict = __build_base_time(job_databases)
    template_snapshot_no = get_template_snapshot_no(job.template_id)
    run = models.DiscoveryJobRun(job_id=job_id,
                                 template_id=job.template_id,
                                 template_snapshot_no=template_snapshot_no,
                                 depth_structured=job.depth_structured,
                                 depth_unstructured=job.depth_unstructured,
                                 exclude_keywords=job.exclude_keywords,
                                 include_keywords=job.include_keywords,
                                 exclude_file_extensions=job.exclude_file_extensions,
                                 include_file_extensions=job.include_file_extensions,
                                 start_time=current_time,
                                 state=RunState.RUNNING.value)
    run.databases = []
    if job.all_rds == 1:
        __add_job_databases(run, DatabaseType.RDS.value, base_time_dict)
    if job.all_s3 == 1:
        __add_job_databases(run, DatabaseType.S3.value, base_time_dict)
    if job.all_ddb == 1:
        __add_job_databases(run, DatabaseType.DDB.value, base_time_dict)
    if job.all_emr == 1:
        __add_job_databases(run, DatabaseType.EMR.value, base_time_dict)
    if job.all_glue == 1:
        __add_job_databases(run, DatabaseType.GLUE.value, base_time_dict)
    if job.all_jdbc == 1:
        __add_job_databases(run, job.database_type, base_time_dict)
    for job_database in job_databases:
        if job_database.database_name:
            run_database = models.DiscoveryJobRunDatabase(run_id=run.id,
                                                          account_id=job_database.account_id,
                                                          region=job_database.region,
                                                          database_type=job_database.database_type,
                                                          database_name=job_database.database_name,
                                                          table_name=job_database.table_name,
                                                          base_time=job_database.base_time,
                                                          state=RunDatabaseState.READY.value,
                                                          uuid=uuid.uuid4().hex)
            run.databases.append(run_database)
        else:
            data_sources = list_resources_by_database_type(job_database.database_type, job_database.account_id, job_database.region).all()
            database_name_key = __get_database_name_key(job_database.database_type)
            for data_source in data_sources:
                database_name = getattr(data_source, database_name_key)
                base_time = base_time_dict.get(
                    f'{job_database.account_id}-{job_database.region}-{job_database.database_type}-{database_name}', datetime.min)
                run_database = models.DiscoveryJobRunDatabase(run_id=run.id,
                                                              account_id=job_database.account_id,
                                                              region=job_database.region,
                                                              database_type=job_database.database_type,
                                                              database_name=database_name,
                                                              base_time=base_time,
                                                              state=RunDatabaseState.READY.value,
                                                              uuid=uuid.uuid4().hex)
                run.databases.append(run_database)
    session.add(run)
    session.commit()
    return run.id


def get_runs(job_id: int):
    return get_session().query(models.DiscoveryJobRun).filter(models.DiscoveryJobRun.job_id == job_id)


def get_run(run_id: int) -> models.DiscoveryJobRun:
    db_run = get_session().query(models.DiscoveryJobRun).get(run_id)
    if db_run is None:
        raise BizException(MessageEnum.DISCOVERY_RUN_NON_EXIST.get_code(),
                           MessageEnum.DISCOVERY_RUN_NON_EXIST.get_msg())
    db_run.databases
    return db_run


def list_run_databases(run_id: int) -> list[models.DiscoveryJobRunDatabase]:
    return get_session().query(models.DiscoveryJobRunDatabase).filter(
            models.DiscoveryJobRunDatabase.run_id == run_id).all()


def list_run_databases_pagination(run_id: int, condition: QueryCondition):
    return query_with_condition(get_session().query(models.DiscoveryJobRunDatabase).filter(
            models.DiscoveryJobRunDatabase.run_id == run_id), condition)


def save_run_database(run_database: models.DiscoveryJobRunDatabase):
    get_session().commit()


def save_run_databases(run_databases: list[models.DiscoveryJobRunDatabase]):
    get_session().commit()


def count_run_databases(run_id: int):
    session = get_session()
    db_count = session.query(models.DiscoveryJobRunDatabase.state,
                                    func.count(models.DiscoveryJobRunDatabase.state))\
                                    .filter(models.DiscoveryJobRunDatabase.run_id == run_id)\
                                    .group_by(models.DiscoveryJobRunDatabase.state).all()
    return db_count


def stop_run(job_id: int, run_id: int):
    session = get_session()
    run_database_update = schemas.DiscoveryJobRunDatabaseUpdate()
    run_database_update.state = RunDatabaseState.STOPPING.value
    session.query(models.DiscoveryJobRunDatabase).filter(models.DiscoveryJobRunDatabase.run_id == run_id).update(run_database_update.dict(exclude_unset=True))

    run_update = schemas.DiscoveryJobRunUpdate()
    run_update.state = RunState.STOPPING.value
    session.query(models.DiscoveryJobRun).filter(models.DiscoveryJobRun.id == run_id).update(run_update.dict(exclude_unset=True))

    job: models.DiscoveryJob = session.query(models.DiscoveryJob).get(job_id)
    job.state = JobState.OD_STOPPING.value
    session.commit()


def complete_run(run_id: int):
    session = get_session()
    run: models.DiscoveryJobRun = session.query(models.DiscoveryJobRun).get(run_id)
    if run is None:
        return
    run.state = RunState.COMPLETED.value
    run.end_time = mytime.get_time()

    job: models.DiscoveryJob = session.query(models.DiscoveryJob).get(run.job_id)
    if job is not None:
        job_state = JobState.IDLE.value
        if job.schedule == const.ON_DEMAND:
            job_state = JobState.OD_COMPLETED.value
        job.state = job_state
        job.last_end_time = mytime.get_time()
        job.base_time = job.last_start_time
    session.commit()


def complete_run_database(run_database_id: int, state: str, message: str) -> models.DiscoveryJobRunDatabase:
    session = get_session()
    run_database: models.DiscoveryJobRunDatabase = session.query(models.DiscoveryJobRunDatabase).get(run_database_id)
    if run_database is None:
        return None
    run_database.state = state
    run_database.error_log = message
    run_database.end_time = mytime.get_time()
    session.commit()
    return run_database


def get_run_database(run_database_id: int) -> models.DiscoveryJobRunDatabase:
    session = get_session()
    return session.query(models.DiscoveryJobRunDatabase).get(run_database_id)


def update_job_database_base_time(job_id: int, account_id: str, region: str, database_type: str, database_name: str, base_time: datetime):
    session = get_session()
    job_database = schemas.DiscoveryJobDatabaseBaseTime(base_time=base_time)
    session.query(models.DiscoveryJobDatabase).filter(models.DiscoveryJobDatabase.job_id == job_id,
        models.DiscoveryJobDatabase.account_id == account_id,
        models.DiscoveryJobDatabase.region == region,
        models.DiscoveryJobDatabase.database_type == database_type,
        models.DiscoveryJobDatabase.database_name == database_name).update(job_database.dict(exclude_unset=True))
    session.commit()


def get_run_databases_by_state(state: RunDatabaseState) -> list[models.DiscoveryJobRunDatabase]:
    session = get_session()
    return session.query(models.DiscoveryJobRunDatabase).filter(models.DiscoveryJobRunDatabase.state == state.value).all()


def get_running_run_databases() -> list[models.DiscoveryJobRunDatabase]:
    return get_run_databases_by_state(RunDatabaseState.RUNNING)


def get_pending_run_databases() -> list[models.DiscoveryJobRunDatabase]:
    return get_run_databases_by_state(RunDatabaseState.PENDING)


def count_account_run_job(account_id: str, regin: str):
    session = get_session()
    db_count = session.query(func.count(models.DiscoveryJobRunDatabase.state)) \
                .filter(models.DiscoveryJobRunDatabase.account_id == account_id) \
                .filter(models.DiscoveryJobRunDatabase.region == regin) \
                .filter(models.DiscoveryJobRunDatabase.state == RunDatabaseState.RUNNING.value).all()
    return db_count[0][0]


def delete_account(account_id: str, regin: str):
    session = get_session()
    session.query(models.DiscoveryJobDatabase).filter(models.DiscoveryJobDatabase.account_id == account_id)\
        .filter(models.DiscoveryJobDatabase.region == regin).delete()
    session.commit()


def count_database_run_job(account_id: str, regin: str, database_type: str, database_name: str):
    session = get_session()
    db_count = session.query(func.count(models.DiscoveryJobRunDatabase.state)) \
                .filter(models.DiscoveryJobRunDatabase.account_id == account_id) \
                .filter(models.DiscoveryJobRunDatabase.region == regin) \
                .filter(models.DiscoveryJobRunDatabase.database_type == database_type) \
                .filter(models.DiscoveryJobRunDatabase.database_name == database_name) \
                .filter(models.DiscoveryJobRunDatabase.state == RunDatabaseState.RUNNING.value).all()
    return db_count[0][0]


def delete_database(account_id: str, regin: str, database_type: str, database_name: str):
    session = get_session()
    session.query(models.DiscoveryJobDatabase).filter(models.DiscoveryJobDatabase.account_id == account_id)\
        .filter(models.DiscoveryJobDatabase.region == regin)\
        .filter(models.DiscoveryJobDatabase.database_type == database_type)\
        .filter(models.DiscoveryJobDatabase.database_name == database_name)\
        .delete()
    session.commit()
