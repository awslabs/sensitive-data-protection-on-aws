-- source
alter table source_account change column aws_account_id account_id varchar(255);
alter table source_account change column aws_account_alias account_alias varchar(255);
alter table source_account change column aws_account_email account_email varchar(255);
alter table source_account change column delegated_aws_account_id delegated_account_id varchar(64);
alter table source_account add total_glue_database int default 0 after connect_rds_instance;
alter table source_account add connected_glue_database int default 0 after total_glue_database;
alter table source_account add total_jdbc_instance int default 0 after connected_glue_database;
alter table source_account add connected_jdbc_instance int default 0 after total_jdbc_instance;
alter table source_account add account_provider_id int default 1 after id;
alter table template_identifier add max_distance int default null after exclude_keywords;
alter table template_identifier add min_occurrence int default null after exclude_keywords;

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
    account_provider_id                   int null,
    account_id                         varchar(255) null,
    region                             varchar(255) null,
    data_source_id                     int          null,
    detection_history_id               int          null,
    connection_status                      varchar(16) null,
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

create table source_glue_database
(
    id                        int auto_increment primary key,
    glue_database_name               varchar(255) null,
    glue_database_description            varchar(255) null,
    glue_database_location_uri                    varchar(255) null,
    glue_database_create_time          varchar(255) null,
    glue_database_catalog_id                   varchar(255) null,
    data_lake_principal_identifier   varchar(255) null,
    permissions varchar(255) null,
    glue_state                varchar(255) null,
    account_id                varchar(255) null,
    region                    varchar(255) null,
    detection_history_id               int          null,
    version                   int          null,
    create_by                 varchar(255) null,
    create_time               timestamp    null,
    modify_by                 varchar(255) null,
    modify_time               timestamp    null
);



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

INSERT INTO source_provider (id, provider_name) VALUES (1, 'AWS Cloud');
INSERT INTO source_provider (id, provider_name) VALUES (2, 'Tencent Cloud');
INSERT INTO source_provider (id, provider_name) VALUES (3, 'Google Cloud');
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-east-1','Northern Virginia (US East)','-77.0469,38.8048',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-east-2','Ohio (US East)','-83.0007,39.9623',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-west-1','Northern California (US West)','-122.4194,37.7749',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-west-2','Oregon (US West)','-123.0351,44.9429',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-east-1','Hong Kong (Asia Pacific)','114.1694,22.3193',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-south-1','Mumbai (Asia Pacific)','72.8777,19.076',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-northeast-3','Osaka (Asia Pacific)','135.5023,34.6937',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-northeast-2','Seoul (Asia Pacific)','126.978,37.5665',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-southeast-1','Singapore (Asia Pacific)','103.8198,1.3521',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-southeast-2','Sydney (Asia Pacific)','151.2093,-33.8688',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-northeast-1','Tokyo (Asia Pacific)','139.6503,35.6762',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ca-central-1','Montreal (Canada Central)','-73.5673,45.5017',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('eu-central-1','Frankfurt (EU Central)','8.6821,50.1109',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('eu-west-1','Dublin (EU West)','-6.2603,53.3498',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('eu-west-2','London (EU West)','-0.1278,51.5074',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('eu-south-1','Milan (EU South)','9.19,45.4642',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('eu-west-3','Paris (EU West)','2.3522,48.8566',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('eu-north-1','Stockholm (EU North)','18.0686,59.3293',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('me-south-1','Bahrain (Middle East)','50.5577,26.0667',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('sa-east-1','Sao Paulo (South America)','-46.6333,-23.5505',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('cn-north-1','Beijing (China North)','116.4074,39.9042',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('cn-northwest-1','Ningxia (China Northwest)','106.1581,37.1987',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('af-south-1','Africa (Cape Town)','18.4241, -33.9249',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-south-2','Asia Pacific (Hyderabad)','72.8777, 19.0760',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-southeast-3','Asia Pacific (Jakarta)','',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-southeast-4','Asia Pacific (Melbourne)','',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('eu-south-2','Europe (Spain)','',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('eu-central-2','Europe (Zurich)','50.1109, 8.6821',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('il-central-1','Israel (Tel Aviv)','',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('me-central-1','Middle East (UAE)','',1);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-guangzhou', '华南地区（广州）','23.1291,113.2644',2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-shanghai', '华东地区（上海）','31.2304,121.4737',2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-beijing', '华北地区（北京）','39.9042,116.4074',2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-chongqing', '西南地区（重庆）','29.5581,106.5516',2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-chengdu', '西南地区（成都）','30.5728,104.0668',2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-tianjin', '华北地区（天津）','39.0837,117.2176',2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-hongkong', '港澳台地区（中国香港）','22.3193,114.1694',2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-singapore', '亚太东南地区（新加坡）','1.3521,103.8198',2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('na-toronto', '北美地区（多伦多）','43.651070,79.347015',2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-mumbai', '亚太东南地区（孟买）','19.0760,72.8777',2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-central1', '美国中部（Iowa）','41.8781,87.6298',3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-east1', '美国东部（South Carolina）','33.9164,80.2991',3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-east4', '美国东部（Virginia）','37.4316,78.6569',3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-west1', '美国西部（Oregon）','44.06,121.31',3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-west4', '欧洲西部（Netherlands）','52.1326,5.2913',3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-northeast1','亚太东北（Tokyo）','35.682839,139.759455' ,3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-southeast1','亚太东南（Singapore）','1.3521,103.8198' ,3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-south1', '亚太南部（Mumbai）','19.0760,72.8777',3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('southamerica-east1', '南美洲东部（Sao Paulo）','23.5505,46.6333',3);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('S3', 1);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('RDS', 1);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('GlueData', 1);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('CustomJDBC', 1);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('CustomJDBC', 2);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('CustomJDBC', 3);

INSERT INTO template_identifier (description, type, name, create_by) VALUES ('Face identifier for image detecting (Built-in)',3,'FACE','SDPS');
INSERT INTO template_identifier (description, type, name, create_by) VALUES ('Business license identifier for image detecting (Built-in)',3,'Business License','SDPS');
INSERT INTO template_identifier (description, type, name, create_by) VALUES ('Car license identifier for image detecting (Built-in)',3,'Car_License','SDPS');
INSERT INTO template_identifier (description, type, name, create_by) VALUES ('ID card identifier for image detecting (Built-in)',3,'ID_Card','SDPS');


-- discovery job
alter table discovery_job add all_glue int null after all_emr;
alter table discovery_job add all_jdbc int null after all_glue;
alter table discovery_job add provider_id int null after include_file_extensions;
alter table discovery_job add database_type varchar(20) null after provider_id;
alter table discovery_job add depth_structured int null after `range`;
alter table discovery_job add depth_unstructured int null after depth_structured;
update discovery_job set depth_structured = depth;
alter table discovery_job add include_keywords varchar(1000) null after exclude_keywords;
alter table discovery_job add exclude_file_extensions varchar(200) null after include_keywords;
alter table discovery_job add include_file_extensions varchar(200) null after exclude_file_extensions;

alter table discovery_job_database modify account_id varchar(20) not null;
alter table discovery_job_database modify database_type varchar(20) not null;

alter table discovery_job_run add depth_structured int null after template_snapshot_no;
alter table discovery_job_run add depth_unstructured int null after depth_structured;
alter table discovery_job_run add include_keywords varchar(1000) null after exclude_keywords;
alter table discovery_job_run add exclude_file_extensions varchar(200) null after include_keywords;
alter table discovery_job_run add include_file_extensions varchar(200) null after exclude_file_extensions;

alter table discovery_job_run_database modify account_id varchar(20) not null;
alter table discovery_job_run_database modify database_type varchar(20) null;
alter table discovery_job_run_database add table_count_unstructured int null after table_count;
