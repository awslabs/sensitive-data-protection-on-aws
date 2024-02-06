INSERT INTO config (config_key, config_value) VALUES ('ConcurrentRunJobNumber','1');
INSERT INTO config (config_key, config_value) VALUES ('SubJobNumberS3','10');
INSERT INTO config (config_key, config_value) VALUES ('SubJobNumberRds','3');

alter table discovery_job_database modify account_id varchar(20) null;
alter table discovery_job_database modify region varchar(20) null;
alter table discovery_job_database modify database_type varchar(20) null;
alter table discovery_job_database modify database_name varchar(255) null;
