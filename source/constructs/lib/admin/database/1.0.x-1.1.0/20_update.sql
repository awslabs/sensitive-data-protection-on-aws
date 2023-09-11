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
    id                        int auto_increment primary key,
    instance_id               varchar(255) null,
    instance_class            varchar(255) null,
    engine                    varchar(255) null,
    instance_status           varchar(255) null,
    address                   varchar(255) null,
    port                      int          null,
    account_provider          varchar(64) null,
    account_id                varchar(255) null,
    region                    varchar(255) null,
    master_username           varchar(255) null,
    created_time              datetime     null,
    data_source_id            int          null,
    detection_history_id      int          null,
    glue_database             varchar(255) null,
    glue_connection           varchar(255) null,
    glue_vpc_endpoint         varchar(255) null,
    glue_crawler              varchar(255) null,
    glue_crawler_last_updated datetime     null,
    glue_state                varchar(255) null,
    create_type               int          null comment '1: ADD, 0: IMPORT',
    jdbc_driver_class         varchar(255) null,
    jdbc_driver_S3_path       varchar(255) null,
    version                   int          null,
    create_by                 varchar(255) null,
    create_time               timestamp    null,
    modify_by                 varchar(255) null,
    modify_time               timestamp    null
);
