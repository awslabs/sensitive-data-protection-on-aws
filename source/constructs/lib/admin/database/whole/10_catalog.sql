create table catalog_column_level_classification
(
    id                   int auto_increment primary key,
    account_id           varchar(20)   not null,
    region               varchar(20)   not null,
    database_type        varchar(20)   not null,
    database_name        varchar(255)  not null,
    table_name           varchar(255)  not null,
    column_name          varchar(255)  not null,
    column_type          varchar(255)  not null,
    column_order_num     integer       not null,
    column_value_example text          null,
    identifier           varchar(2048) null,
    identifier_score     decimal(3, 2) null,
    privacy              smallint      null,
    sensitivity          varchar(255)  not null,
    comments             varchar(255)  null,
    manual_tag           varchar(20)   null,
    job_keyword          varchar(255)  null,
    state                varchar(20)   null,
    version              int           null,
    create_by            varchar(255)  null,
    create_time          datetime      null,
    modify_by            varchar(255)  null,
    modify_time          datetime      null
);

create index catalog_column_name_index
    on catalog_column_level_classification (account_id, region, database_type, database_name, table_name);

create index catalog_column_database_type_index
    on catalog_column_level_classification (database_type);


create table catalog_table_level_classification
(
    id               int auto_increment primary key,
    account_id       varchar(20)   not null,
    region           varchar(20)   not null,
    database_type    varchar(20)   not null,
    database_name    varchar(255)  not null,
    table_name       varchar(255)  not null,
    privacy          smallint      null,
    sensitivity      varchar(255)  null,
    object_count     bigint        null,
    size_key         bigint        null,
    column_count     int           null,
    row_count        int           null,
    storage_location varchar(2048) null,
    identifiers      varchar(2048) null,
    label_ids        varchar(255)  null,
    manual_tag       varchar(20)   null,
    state            varchar(20)   null,
    classification   varchar(255)  null,
    struct_type      varchar(20)   null,
    detected_time    datetime      null,
    version          int           null,
    create_by        varchar(255)  null,
    create_time      datetime      null,
    modify_by        varchar(255)  null,
    modify_time      datetime      null
);
create index catalog_table_name_index
    on catalog_table_level_classification (account_id, region, database_type, database_name, table_name);


create table catalog_database_level_classification
(
    id               int auto_increment primary key,
    account_id       varchar(20)   not null,
    region           varchar(20)   not null,
    database_type    varchar(20)   not null,
    database_name    varchar(255)  not null,
    privacy          smallint      null,
    sensitivity      varchar(255)  not null,
    object_count     bigint        null,
    size_key         bigint        null,
    table_count      int           null,
    column_count     int           null,
    row_count        int           null,
    storage_location varchar(2048) null,
    label_ids        varchar(255)  null,
    manual_tag       varchar(20)   null,
    state            varchar(20)   null,
    version          int           null,
    create_by        varchar(255)  null,
    create_time      datetime      null,
    modify_by        varchar(255)  null,
    modify_time      datetime      null
);

create index catalog_database_name_index
    on catalog_database_level_classification (account_id, region, database_type, database_name);
