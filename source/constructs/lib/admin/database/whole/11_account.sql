create table account
(
    id          int auto_increment primary key,
    source_id   int,
    name        varchar(32) null,
    version     int          null,
    create_by   varchar(255) null,
    create_time timestamp    null,
    modify_by   varchar(255) null,
    modify_time timestamp    null
);
