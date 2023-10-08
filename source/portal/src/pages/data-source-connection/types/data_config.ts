export const COLUMN_OBJECT_STR = {
  Buckets: 'bucket_name',
  RDSInstances: 'instance_id',
  LastModifyAt: 'creation_date',
  Status: 'status',
  DataCatalog: 'data_catalog',
  RunStatus: 'run_status',
  RdsCreatedTime: 'created_time',
  AWSAccount: 'aws_account',
  GlueState: 'glue_state',
};

export const S3_COLUMN_LIST = [
  {
    id: COLUMN_OBJECT_STR.Buckets,
    label: 'table.label.bucketName',
    filter: true,
  },
  {
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.AWSAccount,
    label: 'table.label.awsAccount',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.GlueState,
    label: 'table.label.catalogStatus',
    filter: true,
  },
  {
    id: 'data_catalog',
    label: 'table.label.dataCatalog',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'table.label.lastUpdateAt',
    filter: false,
  },
];

export const JDBC_COLUMN_LIST = [
  {
    id: 'jdbc_instance_name',
    label: 'table.label.jdbcInstanceName',
    filter: true,
  },
  {
    id: 'connection_status',
    label: 'table.label.connectionStatus',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.GlueState,
    label: 'table.label.glueState',
    filter: true,
  },
  {
    id: 'data_catalog',
    label: 'table.label.dataCatalog',
    filter: false,
  },
  {
    id: 'glue_connection_name',
    label: 'table.label.glueConnectionName',
    filter: true,
  }
];

export const GLUE_COLUMN_LIST = [
  {
    id: 'glue_database_name',
    label: 'table.label.glueDatabaseName',
    filter: true,
  },
  {
    id: 'description',
    label: 'table.label.description',
    filter: true,
  },
  {
    id: 'location_uri',
    label: 'table.label.locationUri',
    filter: true,
  },
  {
    id: 'glue_database_create_time',
    label: 'table.label.glueDatabaseCreateTime',
    filter: true,
  },
];

export const RDS_COLUMN_LIST = [
  {
    id: COLUMN_OBJECT_STR.RDSInstances,
    label: 'table.label.rdsInstanceName',
    filter: true,
  },
  {
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
  {
    id: 'engine',
    label: 'table.label.engineType',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.AWSAccount,
    label: 'table.label.awsAccount',
    filter: true,
  },
  {
    id: 'glue_state',
    label: 'table.label.catalogStatus',
    filter: true,
  },
  {
    id: 'data_catalog',
    label: 'table.label.dataCatalog',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.RdsCreatedTime,
    label: 'table.label.lastUpdateAt',
    filter: false,
  },
];

export const TABLE_HEADER = {
  s3: {
    header: 'datasource:header.s3Title',
    info: 'datasource:header.s3Info',
  },
  rds: {
    header: 'datasource:header.rdsTitle',
    info: 'datasource:header.rdsInfo',
  },
  glue: {
    header: 'datasource:header.glueTitle',
    info: 'datasource:header.glueInfo',
  },
  jdbc: {
    header: 'datasource:header.jdbcTitle',
    info: 'datasource:header.jdbcInfo',
  },
};
