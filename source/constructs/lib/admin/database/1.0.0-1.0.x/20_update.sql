alter table discovery_job
    add exclude_keywords varchar(1000) null after overwrite;

alter table discovery_job_database
    add table_name varchar(1000) null after database_name;

alter table discovery_job_run
    add exclude_keywords varchar(1000) null after template_snapshot_no;

alter table discovery_job_run_database
    add table_name varchar(1000) null after database_name;

alter table template_identifier
    add exclude_keywords varchar(1024) null after header_keywords;