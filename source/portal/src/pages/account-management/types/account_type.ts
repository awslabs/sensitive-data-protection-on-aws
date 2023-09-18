export const TYPE_COLUMN = {
  TOTAL_RDS_INSTANCE: 'total_rds_instance',
  TOTAL_S3_BUCKET: 'total_s3_bucket',
  S3_CONNECTION: 's3_connection',
  RDS_CONNECTION: 'rds_connection',
  CONNECTED_S3_BUCKET: 'connected_s3_bucket',
  CONNECTED_RDS_INSTANCE: 'connect_rds_instance',
  STACK_INSTANCE_STATUS: 'stack_instance_status',
  STACK_STATUS: 'stack_status',
  STATUS: 'status',
  FRONT_OPERATE: 'front_operate',
};
export const ACCOUNT_COLUMN_LIST = [
  { id: 'account_id', label: 'account:awsAccount', filter: true },
  { id: 'region', label: 'account:region', filter: true },
  { id: TYPE_COLUMN.STATUS, label: 'account:auth', filter: true },
  {
    id: TYPE_COLUMN.S3_CONNECTION,
    label: 'account:s3OfTotal',
    filter: false,
  },
  {
    id: TYPE_COLUMN.RDS_CONNECTION,
    label: 'account:rdsOfTotal',
    filter: false,
  },
  { id: TYPE_COLUMN.FRONT_OPERATE, label: 'account:operate', filter: false },
];
