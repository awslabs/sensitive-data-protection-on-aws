create table discovery_job
(
    id                      int auto_increment
        primary key,
    name                    varchar(100)  not null,
    state                   varchar(20)   not null,
    template_id             int           not null,
    schedule                varchar(100)  not null,
    description             varchar(1000) null,
    last_start_time         datetime      null,
    last_end_time           datetime      null,
    `range`                 int           not null,
    depth_structured        int           null,
    depth_unstructured      int           null,
    detection_threshold     decimal(3, 2) null,
    all_s3                  int           null,
    all_rds                 int           null,
    all_ddb                 int           null,
    all_emr                 int           null,
    all_glue                int           null,
    all_jdbc                int           null,
    overwrite               int           null,
    exclude_keywords        varchar(1000) null,
    include_keywords        varchar(1000) null,
    exclude_file_extensions varchar(200)  null,
    include_file_extensions varchar(200)  null,
    provider_id             int           null,
    database_type           varchar(20)   null,
    version                 int           null,
    create_by               varchar(255)  null,
    create_time             datetime      null,
    modify_by               varchar(255)  null,
    modify_time             datetime      null
);

create table discovery_job_database
(
    id            int auto_increment
        primary key,
    job_id        int           not null,
    account_id    varchar(20)   null,
    region        varchar(20)   null,
    database_type varchar(20)   null,
    database_name varchar(255)  null,
    table_name    varchar(1000) null,
    base_time     datetime      null,
    version       int           null,
    create_by     varchar(255)  null,
    create_time   datetime      null,
    modify_by     varchar(255)  null,
    modify_time   datetime      null,
    constraint discovery_job_database_uindex
        unique (job_id, account_id, region, database_type, database_name)
);

create index job_id
    on discovery_job_database (job_id);

create table discovery_job_run
(
    id                      int auto_increment
        primary key,
    job_id                  int           not null,
    template_id             int           null,
    template_snapshot_no    varchar(32)   null,
    depth_structured        int           null,
    depth_unstructured      int           null,
    exclude_keywords        varchar(1000) null,
    include_keywords        varchar(1000) null,
    exclude_file_extensions varchar(200)  null,
    include_file_extensions varchar(200)  null,
    state                   varchar(10)   null,
    start_time              datetime      null,
    end_time                datetime      null,
    version                 int           null,
    create_by               varchar(255)  null,
    create_time             datetime      null,
    modify_by               varchar(255)  null,
    modify_time             datetime      null
);

create index job_id
    on discovery_job_run (job_id);

create table discovery_job_run_database
(
    id                       int auto_increment
        primary key,
    run_id                   int           not null,
    account_id               varchar(20)   not null,
    region                   varchar(20)   not null,
    database_type            varchar(20)   null,
    database_name            varchar(255)  null,
    table_name               varchar(1000) null,
    base_time                datetime      null,
    start_time               datetime      null,
    end_time                 datetime      null,
    state                    varchar(10)   null,
    error_log                text          null,
    uuid                     varchar(32)   null,
    table_count              int           null,
    table_count_unstructured int           null,
    version                  int           null,
    create_by                varchar(255)  null,
    create_time              datetime      null,
    modify_by                varchar(255)  null,
    modify_time              datetime      null
);

create index run_id
    on discovery_job_run_database (run_id);

