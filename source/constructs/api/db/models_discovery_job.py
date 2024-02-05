import sqlalchemy as sa
from sqlalchemy.orm import relationship
from db.database import Base


class DiscoveryJob(Base):

    __tablename__ = 'discovery_job'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    name = sa.Column(sa.String(100), nullable=False, info={'searchable': True})
    state = sa.Column(sa.String(20), nullable=False)
    template_id = sa.Column(sa.Integer(), nullable=False)
    schedule = sa.Column(sa.String(100), nullable=False)
    description = sa.Column(sa.String(1000))
    last_start_time = sa.Column(sa.DateTime())
    last_end_time = sa.Column(sa.DateTime())
    range = sa.Column(sa.Integer(), nullable=False)
    depth_structured = sa.Column(sa.Integer())
    depth_unstructured = sa.Column(sa.Integer())
    detection_threshold = sa.Column(sa.Numeric(3,2))
    all_s3 = sa.Column(sa.Integer())
    all_rds = sa.Column(sa.Integer())
    all_ddb = sa.Column(sa.Integer())
    all_emr = sa.Column(sa.Integer())
    all_glue = sa.Column(sa.Integer())
    all_jdbc = sa.Column(sa.Integer())
    overwrite = sa.Column(sa.Integer())
    exclude_keywords = sa.Column(sa.String(1000))
    include_keywords = sa.Column(sa.String(1000))
    exclude_file_extensions = sa.Column(sa.String(200))
    include_file_extensions = sa.Column(sa.String(200))
    provider_id = sa.Column(sa.Integer())
    database_type = sa.Column(sa.String(20))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())
    databases = relationship("DiscoveryJobDatabase")


class DiscoveryJobDatabase(Base):

    __tablename__ = 'discovery_job_database'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    job_id = sa.Column(sa.Integer(), sa.ForeignKey('discovery_job.id'), nullable=False)
    account_id = sa.Column(sa.String(20))
    region = sa.Column(sa.String(20))
    database_type = sa.Column(sa.String(20))
    database_name = sa.Column(sa.String(255))
    table_name = sa.Column(sa.String(1000))
    base_time = sa.Column(sa.DateTime())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())


class DiscoveryJobRun(Base):

    __tablename__ = 'discovery_job_run'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    job_id = sa.Column(sa.Integer(), sa.ForeignKey('discovery_job.id'), nullable=False)
    template_id = sa.Column(sa.Integer())
    template_snapshot_no = sa.Column(sa.String(32))
    depth_structured = sa.Column(sa.Integer())
    depth_unstructured = sa.Column(sa.Integer())
    exclude_keywords = sa.Column(sa.String(1000))
    include_keywords = sa.Column(sa.String(1000))
    exclude_file_extensions = sa.Column(sa.String(200))
    include_file_extensions = sa.Column(sa.String(200))
    state = sa.Column(sa.String(10))
    start_time = sa.Column(sa.DateTime())
    end_time = sa.Column(sa.DateTime())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())
    databases = relationship("DiscoveryJobRunDatabase")
    total = 0


class DiscoveryJobRunDatabase(Base):

    __tablename__ = 'discovery_job_run_database'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    run_id = sa.Column(sa.Integer(), sa.ForeignKey('discovery_job_run.id'), nullable=False)
    account_id = sa.Column(sa.String(20), nullable=False)
    region = sa.Column(sa.String(20), nullable=False)
    database_type = sa.Column(sa.String(20))
    database_name = sa.Column(sa.String(255))
    table_name = sa.Column(sa.String(1000))
    base_time = sa.Column(sa.DateTime())
    start_time = sa.Column(sa.DateTime())
    end_time = sa.Column(sa.DateTime())
    state = sa.Column(sa.String(10))
    error_log = sa.Column(sa.Text())
    uuid = sa.Column(sa.String(32))
    table_count = sa.Column(sa.Integer())
    table_count_unstructured = sa.Column(sa.Integer())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())
