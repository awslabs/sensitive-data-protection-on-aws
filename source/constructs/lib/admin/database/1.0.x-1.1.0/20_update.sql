-- source
alter table source_account change column aws_account_id account_id varchar(255);
alter table source_account change column aws_account_alias account_alias varchar(255);
alter table source_account change column aws_account_email account_email varchar(255);
alter table source_account change column delegated_aws_account_id delegated_account_id varchar(64);
alter table source_account add total_jdbc_instance int default 0 after connect_rds_instance;
alter table source_account add connected_jdbc_instance int default 0 after total_jdbc_instance;
alter table source_account add account_provider varchar(64) default 'aws' after id;

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
    account_provider                   varchar(255) null,
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


-- discovery job
alter table discovery_job add depth_structured int null after `range`;
alter table discovery_job add depth_unstructured int null after depth_structured;
update discovery_job set depth_structured = depth;
alter table discovery_job add include_keywords varchar(1000) null after exclude_keywords;
alter table discovery_job add exclude_file_extensions varchar(200) null after include_keywords;
alter table discovery_job add include_file_extensions varchar(200) null after exclude_file_extensions;

alter table discovery_job_run add depth_structured int null after template_snapshot_no;
alter table discovery_job_run add depth_unstructured int null after depth_structured;
alter table discovery_job_run add include_keywords varchar(1000) null after exclude_keywords;
alter table discovery_job_run add exclude_file_extensions varchar(200) null after include_keywords;
alter table discovery_job_run add include_file_extensions varchar(200) null after exclude_file_extensions;