create table label
(
    id               int auto_increment primary key,
    label_name       varchar(40)   not null,
    classification   varchar(20)   not null,
    type             varchar(20)   not null,
    style_type       varchar(20)   not null,
    style_value      varchar(20)   not null,
    state            varchar(20)   not null,
    version          int           null,
    create_by        varchar(255)  null,
    create_time      datetime      null,
    modify_by        varchar(255)  null,
    modify_time      datetime      null,
    UNIQUE KEY unq_idx(classification,type,label_name),
    key sort_idx(modify_time)
);

