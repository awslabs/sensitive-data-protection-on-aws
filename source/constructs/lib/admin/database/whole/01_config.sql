create table config
(
    id           int auto_increment
        primary key,
    config_key   varchar(50)   not null,
    config_value varchar(1000) null,
    version      int           null,
    create_by    varchar(255)  null,
    create_time  datetime      null,
    modify_by    varchar(255)  null,
    modify_time  datetime      null,
    constraint config_key_uindex
        unique (config_key)
);