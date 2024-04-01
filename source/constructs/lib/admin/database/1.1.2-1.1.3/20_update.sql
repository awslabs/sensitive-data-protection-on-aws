alter table discovery_job_database add prefix varchar(1000) null after table_name;
alter table discovery_job_run_database add prefix varchar(1000) null after table_name;

