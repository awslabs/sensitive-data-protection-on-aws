create table template
(
    id          int auto_increment
        primary key,
    name        varchar(255) null,
    snapshot_no varchar(32) null,
    status      smallint     null comment '0: enabled 1:disabled',
    version     int          null,
    create_by   varchar(255) null,
    create_time timestamp    null,
    modify_by   varchar(255) null,
    modify_time timestamp    null
);

create table template_identifier
(
    id              int auto_increment
        primary key,
    description     varchar(255)                null,
    type            smallint                    null comment '0: built 1:custom',
    version         int                         null,
    name            varchar(255)                not null,
    category        smallint                    null comment '0: ML 1:REGEX',
    privacy         smallint                    null comment '0: Non-PII 1:PII',
    rule            varchar(1024)               null,
    header_keywords varchar(255)                null,
    create_by       varchar(255)                null,
    modify_by       varchar(255)                null,
    modify_time     timestamp                   null,
    create_time     timestamp                   null
);


create table template_mapping
(
    id            int auto_increment
        primary key,
    template_id   int          null,
    identifier_id int          null,
    status        smallint     null comment '0: disabled 1:enabled',
    version       int          null,
    create_by     varchar(255) null,
    create_time   timestamp    null,
    modify_by     varchar(255) null,
    modify_time   timestamp    null
);