-- create table source_account
-- (
--     id                       int auto_increment primary key,
--     aws_account_id          varchar(255)  null,
--     aws_account_alias        varchar(255)  null,
--     aws_account_email        varchar(255)  null,
--     delegated_aws_account_id varchar(64)   null,
--     region                   varchar(64)   null,
--     organization_unit_id     varchar(255)  null,
--     stack_id                 varchar(255)  null,
--     stackset_id              varchar(255)  null,
--     stackset_name            varchar(255)  null,
--     status                   int           null,
--     stack_status             varchar(255)  null,
--     stack_instance_status    varchar(128)  null,
--     detection_role_name      varchar(255)  null,
--     detection_role_status    int           null,
--     total_s3_bucket          int default 0 null,
--     connected_s3_bucket      int default 0 null,
--     total_rds_instance       int default 0 null,
--     connect_rds_instance     int default 0 null,
--     last_updated             datetime      null,
--     version                  int           null,
--     create_by                varchar(255)  null,
--     create_time              timestamp     null,
--     modify_by                varchar(255)  null,
--     modify_time              timestamp     null
-- );

create table source_provider
(
    id          int auto_increment primary key,
    provider_name varchar(255) null,
    description varchar(255) null,
    status      int          default 1 comment '1: enabled, 0: disabled',
    version     int          null,
    create_by   varchar(255) null,
    create_time timestamp    null,
    modify_by   varchar(255) null,
    modify_time timestamp    null
);

create table source_region
(
    id          int auto_increment primary key,
    region_name varchar(255) null,
    region_alias varchar(255) null,
    region_cord varchar(255) null,
    provider_id int          null,
    description varchar(255) null,
    status      int          default 1 comment '1: enabled, 0: disabled',
    version     int          null,
    create_by   varchar(255) null,
    create_time timestamp    null,
    modify_by   varchar(255) null,
    modify_time timestamp    null
);

create table source_resource
(
    id          int auto_increment primary key,
    resource_name varchar(255) null,
    resource_alias varchar(255) null,
    provider_id    int          null,
    apply_region_ids varchar(1000) default 'all',
    description varchar(255) null,
    status      int          default 1 comment '1: enabled, 0: disabled',
    version     int          null,
    create_by   varchar(255) null,
    create_time timestamp    null,
    modify_by   varchar(255) null,
    modify_time timestamp    null
);

create table source_account
(
    id                       int auto_increment primary key,
    account_id          varchar(255)  null,
    account_alias        varchar(255)  null,
    account_email        varchar(255)  null,
    account_provider_id      int  null,
    delegated_account_id varchar(64)   null,
    region                   varchar(64)   null,
    organization_unit_id     varchar(255)  null,
    stack_id                 varchar(255)  null,
    stackset_id              varchar(255)  null,
    stackset_name            varchar(255)  null,
    status                   int           null,
    stack_status             varchar(255)  null,
    stack_instance_status    varchar(128)  null,
    detection_role_name      varchar(255)  null,
    detection_role_status    int           null,
    total_s3_bucket          int default 0 null,
    connected_s3_bucket      int default 0 null,
    total_rds_instance       int default 0 null,
    connect_rds_instance     int default 0 null,
    total_jdbc_instance          int default 0 null,
    connected_jdbc_instance      int default 0 null,
    last_updated             datetime      null,
    version                  int           null,
    create_by                varchar(255)  null,
    create_time              timestamp     null,
    modify_by                varchar(255)  null,
    modify_time              timestamp     null
);

create table source_account_compare
(
    id                  int auto_increment primary key,
    aws_account_id      varchar(255) null,
    aws_account_alias   varchar(255) null,
    status              int          null,
    detection_role_name varchar(255) null,
    version             int          null,
    create_by           varchar(255) null,
    create_time         timestamp    null,
    modify_by           varchar(255) null,
    modify_time         timestamp    null
);

create table source_data_source
(
    id          int auto_increment primary key,
    source_type varchar(255) null,
    status      int          null,
    source_id   int          null,
    version     int          null,
    create_by   varchar(255) null,
    create_time timestamp    null,
    modify_by   varchar(255) null,
    modify_time timestamp    null
);

create table source_detection_history
(
    id             int auto_increment primary key,
    detect_uuid    varchar(255) null,
    detection_time datetime     null,
    account_id     int          null,
    source_type    varchar(255) null,
    state          int          null,
    aws_account    varchar(255) null,
    version        int          null,
    create_by      varchar(255) null,
    create_time    timestamp    null,
    modify_by      varchar(255) null,
    modify_time    timestamp    null
);

create table source_dynamodb_table
(
    id                        int auto_increment primary key,
    account_id                int          null,
    table_name                varchar(255) null,
    region                    varchar(255) null,
    data_source_id            int          null,
    detection_history_id      int          null,
    aws_account               varchar(255) null,
    glue_database             varchar(255) null,
    glue_crawler              varchar(255) null,
    glue_crawler_last_updated datetime     null,
    version                   int          null,
    create_by                 varchar(255) null,
    create_time               timestamp    null,
    modify_by                 varchar(255) null,
    modify_time               timestamp    null
);

create index detection_history_id
    on source_dynamodb_table (detection_history_id);

create table source_rds_instance
(
    id                        int auto_increment primary key,
    instance_id               varchar(255) null,
    instance_class            varchar(255) null,
    engine                    varchar(255) null,
    instance_status           varchar(255) null,
    address                   varchar(255) null,
    port                      int          null,
    master_username           varchar(255) null,
    created_time              datetime     null,
    account_id                varchar(255) null,
    region                    varchar(255) null,
    data_source_id            int          null,
    detection_history_id      int          null,
    aws_account               varchar(255) null,
    glue_database             varchar(255) null,
    glue_connection           varchar(255) null,
    glue_vpc_endpoint         varchar(255) null,
    glue_crawler              varchar(255) null,
    glue_crawler_last_updated datetime     null,
    glue_state                varchar(255) null comment '1: RUNNING, 0: IDLE',
    version                   int          null,
    create_by                 varchar(255) null,
    create_time               timestamp    null,
    modify_by                 varchar(255) null,
    modify_time               timestamp    null
);

create table source_glue_database
(
    id                        int auto_increment primary key,
    glue_database_name               varchar(255) null,
    glue_database_description            varchar(255) null,
    glue_database_location_uri                    varchar(255) null,
    glue_database_create_time          varchar(255) null,
    glue_database_catalog_id                   varchar(255) null,
    account_id                varchar(255) null,
    region                    varchar(255) null,
    version                   int          null,
    create_by                 varchar(255) null,
    create_time               timestamp    null,
    modify_by                 varchar(255) null,
    modify_time               timestamp    null
);

create table source_jdbc_instance
(
    id                                 int auto_increment primary key,
    instance_id                        varchar(255) null,
    description                        varchar(2056) null,
    jdbc_connection_url                varchar(1024) null,
    jdbc_enforce_ssl                   varchar(16) null,
    kafka_ssl_enabled                  varchar(16) null,
    master_username                    varchar(255) null,
    skip_custom_jdbc_cert_validation   varchar(16) null,
    custom_jdbc_cert                   varchar(1024) null,
    custom_jdbc_cert_string            varchar(1024) null,
    network_availability_zone          varchar(255) null,
    network_subnet_id                  varchar(255) null,
    network_sg_id                      varchar(255) null,
    jdbc_driver_class_name             varchar(2048) null,
    jdbc_driver_jar_uri                varchar(2048) null,
    instance_class                     varchar(255) null,
    instance_status                    varchar(255) null,
    account_provider_id                int null,
    account_id                         varchar(255) null,
    region                             varchar(255) null,
    data_source_id                     int          null,
    detection_history_id               int          null,
    glue_database                      varchar(255) null,
    glue_crawler                       varchar(255) null,
    glue_connection                    varchar(255) null,
    glue_vpc_endpoint                  varchar(255) null,
    glue_crawler_last_updated          datetime null,
    glue_state                         varchar(255) null,
    create_type                        int          null comment '1: ADD, 0: IMPORT',
    version                            int          null,
    create_by                          varchar(255) null,
    create_time                        timestamp    null,
    modify_by                          varchar(255) null,
    modify_time                        timestamp    null
);

create index detection_history_id
    on source_jdbc_instance (detection_history_id);

create table source_s3_bucket
(
    id                        int auto_increment primary key,
    bucket_name               varchar(255) null,
    size                      int          null,
    account_id                int          null,
    region                    varchar(255) null,
    creation_date             datetime     null,
    data_source_id            int          null,
    detection_history_id      int          null,
    aws_account               varchar(255) null,
    glue_database             varchar(255) null,
    glue_connection           varchar(255) null,
    glue_vpc_endpoint         varchar(255) null,
    glue_crawler              varchar(255) null,
    glue_crawler_last_updated datetime     null,
    glue_state                varchar(255) null,
    version                   int          null,
    create_by                 varchar(255) null,
    create_time               timestamp    null,
    modify_by                 varchar(255) null,
    modify_time               timestamp    null
);

create index detection_history_id
    on source_s3_bucket (detection_history_id);

