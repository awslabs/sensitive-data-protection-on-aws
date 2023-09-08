alter table discovery_job_run_database
    add error_log text null after log;

update discovery_job_run_database set error_log = log;