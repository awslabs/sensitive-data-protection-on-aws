-- source
alter table source_detection_history drop column account_id;
alter table source_detection_history change column aws_account account_id varchar(255);
alter table source_rds_instance drop column account_id;
alter table source_rds_instance change column aws_account account_id varchar(255);
alter table source_s3_bucket drop column account_id;
alter table source_s3_bucket change column aws_account account_id varchar(255);
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
alter table source_detection_history add provider varchar(255) default null after detection_time;

create table source_jdbc_instance
(
    id                                 int auto_increment primary key,
    instance_id                        varchar(255) null,
    description                        varchar(2056) null,
    jdbc_connection_url                varchar(1024) null,
    jdbc_connection_schema             varchar(1024) null,
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
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-guangzhou-1', '广州一区', '113.2644,23.1291', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-guangzhou-2', '广州二区', '113.2644,23.1291', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-guangzhou-3', '广州三区', '113.2644,23.1291', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-guangzhou-4', '广州四区', '113.2644,23.1291', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-guangzhou-6', '广州六区', '113.2644,23.1291', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-guangzhou-7', '广州七区', '113.2644,23.1291', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-shanghai-1', '上海一区', '121.4737,31.2304', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-shanghai-2', '上海二区', '121.4737,31.2304', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-shanghai-3', '上海三区', '121.4737,31.2304', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-shanghai-4', '上海四区', '121.4737,31.2304', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-shanghai-5', '上海五区', '121.4737,31.2304', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-shanghai-8', '上海八区', '121.4737,31.2304', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-nanjing-1', '南京一区', '118.7969,32.0603', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-nanjing-2', '南京二区', '118.7969,32.0603', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-nanjing-3', '南京三区', '118.7969,32.0603', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-beijing-1', '北京一区', '116.4074,39.9042', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-beijing-2', '北京二区', '116.4074,39.9042', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-beijing-3', '北京三区', '116.4074,39.9042', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-beijing-4', '北京四区', '116.4074,39.9042', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-beijing-5', '北京五区', '116.4074,39.9042', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-beijing-6', '北京六区', '116.4074,39.9042', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-beijing-7', '北京七区', '116.4074,39.9042', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-chengdu-1', '成都一区', '104.0668,30.5728', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-chengdu-2', '成都二区', '104.0668,30.5728', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-chongqing-1', '重庆一区', '106.9123,29.4316', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-hongkong-1', '香港一区', '114.1694,22.3193', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-hongkong-2', '香港二区', '114.1694,22.3193', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-hongkong-3', '香港三区', '114.1694,22.3193', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-singapore-1', '新加坡一区', '103.8198,1.3521', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-singapore-2', '新加坡二区', '103.8198,1.3521', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-singapore-3', '新加坡三区', '103.8198,1.3521', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-singapore-4', '新加坡四区', '103.8198,1.3521', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-jakarta-1', '雅加达一区', '106.8456,-6.2088', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-jakarta-2', '雅加达二区', '106.8456,-6.2088', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-seoul-1', '首尔一区', '126.9780,37.5665', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-seoul-2', '首尔二区', '126.9780,37.5665', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-tokyo-1', '东京一区', '139.6917,35.6895', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-tokyo-2', '东京二区', '139.6917,35.6895', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-mumbai-1', '孟买一区', '72.8777,19.0760', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-mumbai-2', '孟买二区', '72.8777,19.0760', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-bangkok-1', '曼谷一区', '100.5018,13.7563', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('ap-bangkok-2', '曼谷二区', '100.5018,13.7563', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('na-toronto-1', '多伦多一区', '280.6530,43.651070', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('sa-saopaulo-1', '圣保罗一区', '-46.6333,-23.5505', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('na-siliconvalley-1', '硅谷一区', '237.5806,37.7749', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('na-siliconvalley-2', '硅谷二区', '237.5806,37.7749', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('na-ashburn-1', '弗吉尼亚一区', '282.5126, 39.0438', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('na-ashburn-2', '弗吉尼亚二区', '282.5126, 39.0438', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('eu-frankfurt-1', '法兰克福一区', '8.6821,50.1109', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('eu-frankfurt-2', '法兰克福二区', '8.6821,50.1109', 2);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-east1', 'Taiwan China', '120.9605, 23.6978', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-east2', 'HongKong China', '114.1694, 22.3193', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-northeast1', 'Tokyo Japan', '139.6917, 35.6895', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-northeast2', 'Osaka Japan', '135.5023, 34.6937', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-northeast3', 'Seoul South Korea', '126.9780, 37.5665', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-south1', 'Mumbai India', '72.8777, 19.0760', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-south2', 'Delhi India', '77.2090, 28.6139', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-southeast1', 'Jurong West Singapore', '103.7072, 1.3397', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('asia-southeast2', 'Jakarta Indonesia', '106.8456, 6.2088', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('australia-southeast1', 'Sydney Australia', '151.2093, 33.8688', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('australia-southeast2', 'Melbourne Australia', '144.9631, 37.8136', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-central2', 'Warsaw Poland', '21.0122, 52.2297', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-north1', 'Hamina Finland', '27.1878, 60.5695', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-southwest1', 'Madrid Spain', '3.7038, 40.4168', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-west1', 'St. Ghislain Belgium', '3.8183, 50.4748', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-west10', 'Berlin Germany', '13.4050, 52.5200', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-west12', 'Turin Italy', '7.6869, 45.0703', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-west2', 'London England', '0.1180, 51.5099', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-west3', 'Frankfurt Germany', '8.6821, 50.1109', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-west4', 'Eemshaven Netherlands', '6.8244, 53.4484', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-west6', 'Zurich Switzerland', '8.5417, 47.3769', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-west8', 'Milan Italy', '9.1900, 45.4642', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('europe-west9', 'Paris France', '2.3522, 48.8566', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('me-central1', 'Doha Qatar', '51.5201, 25.2769', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('me-central2', 'Dammam Saudi Arabia', '49.9777, 26.3927', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('me-west1', 'Tel Aviv (Israel)', '34.7818, 32.0853', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('northamerica-northeast1', 'Montréal Québec (North America)', '73.5673, 45.5017', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('northamerica-northeast2', 'Toronto Ontario (North America)', '79.3832, 43.6532', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('southamerica-east1', 'Osasco São Paulo (Brazil),', '-46.7925, -23.5329', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-central1', 'Santiago Chile (South America)', '-70.6693, -33.4489', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-east1', 'Moncks Corner South Carolina', '279.9912, 33.1960', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-east4', 'Ashburn Virginia ', '282.5126, 39.0438', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-east5', 'Columbus Ohio', '277.0012, 39.9612', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-south1', 'Dallas Texas', '263.203, 32.7767', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-west1', 'The Dalles Oregon', '238.8144, 45.6016', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-west2', 'Los Angeles California', '241.7563, 34.0522', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-west3', 'Salt Lake City Utah', '248.1090, 40.7608', 3);
INSERT INTO source_region (region_name, region_alias, region_cord, provider_id) VALUES ('us-west4', 'Las Vegas Nevada', '244.8602, 36.1699', 3);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('S3', 1);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('RDS', 1);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('GlueData', 1);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('CustomJDBC', 1);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('CustomJDBC', 2);
INSERT INTO source_resource (resource_name, provider_id) VALUES ('CustomJDBC', 3);

INSERT INTO template_identifier (id, description, type, name, rule, create_by) VALUES (274,'Face identifier for image detecting (Built-in)',3,'FACE_IMAGE','FACE_IMAGE','SDPS');
INSERT INTO template_identifier (id, description, type, name, rule, create_by) VALUES (275,'Business license identifier for image detecting (Built-in)',3,'BUSINESS_LICENSE_IMAGE','BUSINESS_LICENSE_IMAGE','SDPS');
INSERT INTO template_identifier (id, description, type, name, rule, create_by) VALUES (276,'Car license identifier for image detecting (Built-in)',3,'CAR_LICENSE_IMAGE','CAR_LICENSE_IMAGE','SDPS');
INSERT INTO template_identifier (id, description, type, name, rule, create_by) VALUES (277,'ID card identifier for image detecting (Built-in)',3,'CHINESE_ID_IMAGE','CHINESE_ID_IMAGE','SDPS');


-- discovery job
alter table discovery_job add all_glue int null after all_emr;
alter table discovery_job add all_jdbc int null after all_glue;
alter table discovery_job add depth_structured int null after `range`;
alter table discovery_job add depth_unstructured int null after depth_structured;
update discovery_job set depth_structured = depth where depth_structured is null;
update discovery_job set depth_unstructured = 0 where depth_unstructured is null;
alter table discovery_job add include_keywords varchar(1000) null after exclude_keywords;
alter table discovery_job add exclude_file_extensions varchar(200) null after include_keywords;
alter table discovery_job add include_file_extensions varchar(200) null after exclude_file_extensions;
alter table discovery_job add provider_id int null after include_file_extensions;
update discovery_job set provider_id = 1 where provider_id is null;
alter table discovery_job add database_type varchar(20) null after provider_id;

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

alter table catalog_column_level_classification add job_keyword varchar(255) null after manual_tag;
alter table catalog_column_level_classification add column_path varchar(255) null after job_keyword;

alter table catalog_table_level_classification add struct_type varchar(20) null after classification;
alter table catalog_table_level_classification add detected_time datetime null after struct_type;
alter table catalog_table_level_classification add serde_info varchar(255) null after detected_time;
alter table catalog_table_level_classification add table_properties varchar(1024) null after serde_info;


alter table catalog_database_level_classification add origin_obj_count bigint null after size_key;
alter table catalog_database_level_classification add origin_size_key bigint null after origin_obj_count;
alter table catalog_database_level_classification add access_type varchar(20) null after manual_tag;

