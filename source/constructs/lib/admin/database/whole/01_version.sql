create table version
(
    id          int auto_increment
        primary key,
    value       varchar(100)  not null,
    description varchar(1000) null,
    version     int           null,
    create_by   varchar(255)  null,
    create_time datetime      null,
    modify_by   varchar(255)  null,
    modify_time datetime      null
);

