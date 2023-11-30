import datetime
from typing import Optional
from pydantic import BaseModel
import db.models_discovery_job as models


class DiscoveryJobRunDatabaseBase(BaseModel):
    run_id: int
    account_id: str
    region: str
    database_type: Optional[str]
    database_name: Optional[str]
    table_name: Optional[str]
    base_time: Optional[datetime.datetime]
    start_time: Optional[datetime.datetime]
    end_time: Optional[datetime.datetime]
    state: Optional[str]
    error_content: Optional[str]


class DiscoveryJobRunDatabaseUpdate(BaseModel):
    end_time: Optional[datetime.datetime]
    state: Optional[str]
    error_content: Optional[str]


class DiscoveryJobRunDatabase(DiscoveryJobRunDatabaseBase):
    class Config:
        orm_mode = True


class DiscoveryJobRunDatabaseList(DiscoveryJobRunDatabaseBase):
    id: int

    class Config:
        orm_mode = True


class DiscoveryJobRunDatabaseStatus(BaseModel):
    id: int
    run_id: int
    success_count: int
    fail_count: int
    ready_count: int
    running_count: int
    stopped_count: int
    not_existed_count: int
    total_count: int
    success_per: int
    fail_per: int
    ready_per: int
    running_per: int
    stopped_per: int
    not_existed_per: int


class DiscoveryJobRunDatabaseProgress(BaseModel):
    run_database_id: int
    current_table_count: int
    table_count: int
    current_table_count_unstructured: int
    table_count_unstructured: int


class DiscoveryJobRunList(BaseModel):
    id: int
    job_id: int
    state: Optional[str]
    start_time: Optional[datetime.datetime]
    end_time: Optional[datetime.datetime]

    class Config:
        orm_mode = True


class DiscoveryJobRunUpdate(BaseModel):
    state: Optional[str]
    end_time: Optional[datetime.datetime]


class DiscoveryJobRun(DiscoveryJobRunList):
    databases: list[DiscoveryJobRunDatabaseList]
    total: int


class DiscoveryJobDatabaseBase(BaseModel):
    account_id: str
    region: str
    database_type: str
    database_name: Optional[str]
    table_name: Optional[str]


class DiscoveryJobDatabaseCreate(DiscoveryJobDatabaseBase):
    def __eq__(self, other):
        return isinstance(other, self.__class__) and self.account_id == other.account_id and\
               self.region == other.region and self.database_type == other.database_type and\
               self.database_name == other.database_name and self.table_name == other.table_name

    def __hash__(self):
        return hash((self.account_id, self.region, self.database_type, self.database_name, self.table_name))

    class Meta:
        orm_model = models.DiscoveryJobDatabase


class DiscoveryJobDatabase(DiscoveryJobDatabaseBase):
    id: int
    job_id: int

    class Config:
        orm_mode = True


class DiscoveryJobDatabaseBaseTime(BaseModel):
    base_time: datetime.datetime


class DiscoveryJobState(BaseModel):
    state: str


class DiscoveryJobBase(BaseModel):
    name: str
    template_id: int = 1
    schedule: str = "cron(0 12 * * ? *)"
    description: Optional[str]
    range: int = 1
    depth_structured: int = 100
    depth_unstructured: Optional[int] = 10
    detection_threshold: Optional[float] = 0.2
    all_s3: Optional[int]
    all_rds: Optional[int]
    all_ddb: Optional[int]
    all_emr: Optional[int]
    all_glue: Optional[int]
    all_jdbc: Optional[int]
    overwrite: Optional[int]
    exclude_keywords: Optional[str]
    include_keywords: Optional[str]
    exclude_file_extensions: Optional[str]
    include_file_extensions: Optional[str]
    provider_id: Optional[int]
    database_type: Optional[str]


class DiscoveryJobCreate(DiscoveryJobBase):
    databases: list[DiscoveryJobDatabaseCreate]


class DiscoveryJobUpdate(DiscoveryJobBase):
    name: Optional[str]
    template_id: Optional[int] = 1
    schedule: Optional[str] = "cron(0 12 * * ? *)"
    description: Optional[str]
    range: Optional[int] = 1
    depth_structured: Optional[int] = 100
    detection_threshold: Optional[float] = 0.2


class DiscoveryJobList(DiscoveryJobBase):
    id: int
    state: str
    last_start_time: Optional[datetime.datetime]
    last_end_time: Optional[datetime.datetime]

    class Config:
        orm_mode = True


class DiscoveryJob(DiscoveryJobList):
    databases: list[DiscoveryJobDatabase]
