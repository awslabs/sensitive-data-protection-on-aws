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

export interface IAccountData {
  account_alias: null | string;
  account_email: null | string;
  account_id: string;
  account_provider_id: number;
  connect_rds_instance: number;
  connected_glue_database: number;
  connected_jdbc_instance: number;
  connected_s3_bucket: number;
  delegated_account_id: string | null;
  detection_role_name: string;
  detection_role_status: number;
  id: number;
  last_updated: string;
  organization_unit_id: string | null;
  region: string;
  stack_id: string | null;
  stack_instance_status: string | null;
  stack_status: string | null;
  stackset_id: string | null;
  stackset_name: string | null;
  status: number;
  total_glue_database: number;
  total_jdbc_instance: number;
  total_rds_instance: number;
  total_s3_bucket: number;
}
