export const COLUMN_OBJECT_STR = {
  BucketName: 'bucket_name',
  ConnectionName: 'connection_name',
  JDBCTableName: 'jdbc_table_name',
  JDBCTableRow: 'jdbc_table_row',
  DatabaseName: 'database_name',
  FolderName: 'table_name',
  Privacy: 'privacy',
  ColumnCount: 'column_count',
  RowCount: 'row_count',
  AccountId: 'account_id',
  Labels: 'labels',
  Region: 'region',
  LastModifyBy: 'modify_by',
  LastModifyAt: 'modify_time',
};

export const S3_CATALOG_FILTER_COLUMNS = [
  {
    id: 'bucket_name',
    label: 'table.label.bucketName',
    filter: true,
  },
  {
    id: 'account_id',
    label: 'table.label.awsAccount',
    filter: true,
  },

  {
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
];

export const S3_CATALOG_COLUMS = [
  {
    id: COLUMN_OBJECT_STR.BucketName,
    label: 'table.label.bucketName',
    filter: true,
  },
  // {
  //   id: 'object_count',
  //   label: 'table.label.objects',
  //   filter: true,
  // },
  // {
  //   id: 'size_key',
  //   label: 'table.label.size',
  //   filter: false,
  // },
  // {
  //   id: 'privacy',
  //   label: 'table.label.privacy',
  //   filter: true,
  // },
  {
    id: 'account_id',
    label: 'table.label.awsAccount',
    filter: true,
  },

  {
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
];

export const RDS_CATALOG_COLUMS = [
  {
    id: 'database_name',
    label: 'table.label.instanceName',
    filter: true,
  },
  {
    id: 'object_count',
    label: 'table.label.tables',
    filter: true,
  },
  {
    id: 'privacy',
    label: 'table.label.privacy',
    filter: true,
  },
  {
    id: 'account_id',
    label: 'table.label.awsAccount',
    filter: true,
  },
  {
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
];

export const JDBC_INSTANCE_COLUMS = [
  {
    id: COLUMN_OBJECT_STR.ConnectionName,
    label: 'table.label.connectionName',
    filter: true,
  },
  {
    id: 'object_count',
    label: 'table.label.tables',
    filter: true,
  },
  {
    id: 'privacy',
    label: 'table.label.privacy',
    filter: true,
  },
  {
    id: 'account_id',
    label: 'table.label.awsAccount',
    filter: true,
  },
  {
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
];

export const JDBC_TABLE_COLUMS = [
  {
    id: COLUMN_OBJECT_STR.JDBCTableName,
    label: 'table.label.jdbcTableName',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.ConnectionName,
    label: 'table.label.connectionName',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.ColumnCount,
    label: 'table.label.columns',
  },
  {
    id: COLUMN_OBJECT_STR.RowCount,
    label: 'table.label.items',
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'table.label.awsAccount',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Region,
    label: 'table.label.awsRegion',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Labels,
    label: 'table.label.label',
    filter: false,
  },
  {
    id: 'modify_by',
    label: 'table.label.lastUpdateBy',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'table.label.lastUpdateAt',
    filter: false,
  },
];

export const JDBC_ACCOUNT_COLUMS = [
  {
    id: COLUMN_OBJECT_STR.ConnectionName,
    label: 'table.label.connectionName',
    filter: true,
  },
  {
    id: 'object_count',
    label: 'table.label.tables',
    filter: true,
  },
  {
    id: 'privacy',
    label: 'table.label.privacy',
    filter: true,
  },
  {
    id: 'account_id',
    label: 'table.label.awsAccount',
    filter: true,
  },
  {
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
];

export const GLUE_ACCOUNTS_COLUMNS = [
  {
    id: 'account_id',
    label: 'table.label.accountId',
    filter: false,
  },
  {
    id: 'region',
    label: 'table.label.region',
    filter: false,
  },
  {
    id: 'status',
    label: 'table.label.accountStatus',
    filter: false,
  },
];

export const RDS_FOLDER_COLUMS = [
  { id: COLUMN_OBJECT_STR.FolderName, label: 'table.label.table' },
  {
    id: COLUMN_OBJECT_STR.ColumnCount,
    label: 'table.label.columns',
  },
  {
    id: COLUMN_OBJECT_STR.RowCount,
    label: 'table.label.items',
  },
  {
    id: COLUMN_OBJECT_STR.DatabaseName,
    label: 'table.label.instanceName',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'table.label.awsAccount',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Region,
    label: 'table.label.awsRegion',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Labels,
    label: 'table.label.catalogLabels',
    filter: false,
  },
  {
    id: 'modify_by',
    label: 'table.label.lastUpdateBy',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'table.label.lastUpdateAt',
    filter: false,
  },
];

export const S3_CATALOG_COLUMS_OLDDATA = [
  ...S3_CATALOG_COLUMS,
  {
    id: 'operate',
    label: 'table.label.operate',
    filter: false,
  },
];

export const RDS_CATALOG_COLUMS_OLDDATA = [
  ...RDS_CATALOG_COLUMS,
  {
    id: 'operate',
    label: 'table.label.operate',
    filter: false,
  },
];

export const HOUR_OPTIONS = [
  { label: '00:00', value: '0' },
  { label: '01:00', value: '1' },
  { label: '02:00', value: '2' },
  { label: '03:00', value: '3' },
  { label: '04:00', value: '4' },
  { label: '05:00', value: '5' },
  { label: '06:00', value: '6' },
  { label: '07:00', value: '7' },
  { label: '08:00', value: '8' },
  { label: '09:00', value: '9' },
  { label: '10:00', value: '10' },
  { label: '11:00', value: '11' },
  { label: '12:00', value: '12' },
  { label: '13:00', value: '13' },
  { label: '14:00', value: '14' },
  { label: '15:00', value: '15' },
  { label: '16:00', value: '16' },
  { label: '17:00', value: '17' },
  { label: '18:00', value: '18' },
  { label: '19:00', value: '19' },
  { label: '20:00', value: '20' },
  { label: '21:00', value: '21' },
  { label: '22:00', value: '22' },
  { label: '23:00', value: '23' },
];

export const DAY_OPTIONS = [
  { label: 'SUN', value: 'SUN' },
  { label: 'MON', value: 'MON' },
  { label: 'TUE', value: 'TUE' },
  { label: 'WED', value: 'WED' },
  { label: 'THU', value: 'THU' },
  { label: 'FRI', value: 'FRI' },
  { label: 'SAT', value: 'SAT' },
];

export const MONTH_OPTIONS = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '10', value: '10' },
  { label: '11', value: '11' },
  { label: '12', value: '12' },
  { label: '13', value: '13' },
  { label: '14', value: '14' },
  { label: '15', value: '15' },
  { label: '16', value: '16' },
  { label: '17', value: '17' },
  { label: '18', value: '18' },
  { label: '19', value: '19' },
  { label: '20', value: '20' },
  { label: '21', value: '21' },
  { label: '22', value: '22' },
  { label: '23', value: '23' },
  { label: '24', value: '24' },
  { label: '25', value: '25' },
  { label: '26', value: '26' },
  { label: '27', value: '27' },
  { label: '28', value: '28' },
];

export interface DbItemInfo {
  database_type?: any;
  account_id: any;
  region: any;
  database_name: any;
  table_name: any;
}

export interface CombinedRDSDatabase {
  [key: string]: DbItemInfo[];
}

export const SCAN_DEPTH_OPTIONS = [
  { label: 'Sample 10 rows (test scan, fast)', value: '10' },
  { label: 'Sample 30 rows', value: '30' },
  { label: 'Sample 60 rows', value: '60' },
  { label: 'Sample 100 rows (regular scan, recommended)', value: '100' },
  { label: 'Sample 300 rows', value: '300' },
  { label: 'Sample 600 rows', value: '600' },
  { label: 'Sample 1000 rows (deep scan, slow)', value: '1000' },
];

export const SCAN_STRUCTURED_DEPTH_OPTIONS = [
  { label: 'Skip structured data', value: '0' },
  { label: 'Sample 10 rows (test scan, fast)', value: '10' },
  { label: 'Sample 30 rows', value: '30' },
  { label: 'Sample 60 rows', value: '60' },
  { label: 'Sample 100 rows (regular scan, recommended)', value: '100' },
  { label: 'Sample 300 rows', value: '300' },
  { label: 'Sample 600 rows', value: '600' },
  { label: 'Sample 1000 rows (deep scan, slow)', value: '1000' },
];

export const SCAN_UNSTRUCTURED_DEPTH_OPTIONS = [
  { label: 'Skip unstructured data', value: '0' },
  { label: '10 files (recommended)', value: '10' },
  { label: '50 files', value: '50' },
  { label: '100 files', value: '100' },
  { label: 'All files (may take long time)', value: '-1' },
];

export const SCAN_RANGE_OPTIONS = [
  { label: 'Full scan (recommended)', value: '0' },
  { label: 'Incremental scan', value: '1' },
];

export const DETECTION_THRESHOLD_OPTIONS = [
  { label: '5%', value: '0.05' },
  { label: '10% (recommended)', value: '0.1' },
  { label: '20%', value: '0.2' },
  { label: '30%', value: '0.3' },
  { label: '50%', value: '0.5' },
  { label: '100%', value: '1' },
];

export const FREQUENCY_TYPE = {
  on_demand_run: 'On-demand run',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export const OVERRIDE_OPTIONS = [
  {
    label: 'Do not override (recommended)',
    value: '0',
  },
  { label: 'Override', value: '1' },
];
