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
    label: 'Bucket name',
    filter: true,
  },
  {
    id: 'region',
    label: 'AWS region',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.AWSAccount,
    label: 'AWS account',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.GlueState,
    label: 'Catalog status',
    filter: true,
  },
  {
    id: 'data_catalog',
    label: 'Data catalog',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'Last updated at',
    filter: false,
  },
];

export const RDS_COLUMN_LIST = [
  {
    id: COLUMN_OBJECT_STR.RDSInstances,
    label: 'RDS instances name',
    filter: true,
  },
  {
    id: 'region',
    label: 'AWS region',
    filter: true,
  },
  {
    id: 'engine',
    label: 'Engine type',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.AWSAccount,
    label: 'AWS account',
    filter: true,
  },
  {
    id: 'glue_state',
    label: 'Catalog status',
    filter: true,
  },
  {
    id: 'data_catalog',
    label: 'Data catalog',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.RdsCreatedTime,
    label: 'Last updated at',
    filter: false,
  },
];

export const TABLE_HEADER = {
  s3: {
    header: 'Data source: S3 buckets',
    info: 'The S3 buckets that are discovered in this AWS account. Connect to S3 buckets to create data catalogs.',
  },
  rds: {
    header: 'Data source: RDS instances',
    info: 'The RDS instances that are discovered in this AWS account. Connect to RDS instances to create data catalogs.',
  },
};
