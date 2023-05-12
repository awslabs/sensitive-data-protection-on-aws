export const COLUMN_OBJECT_STR = {
  DataIdent: 'dataIdent',
  Folders: 'folders',
  FolderName: 'table_name',
  Tables: 'tables',
  Privacy: 'privacy',
  Schema: 'schema',
  Classifiedby: 'classifiedby',
  Identifier: 'identifier',
  Identifiers: 'identifiers',
  DatabaseName: 'database_name',
  SampleObjects: 'sampleObjects',
  DataPreview: 'dataPreview',
  Size: 'size_key',
  ObjectCount: 'object_count',
  LastModifyBy: 'modify_by',
  LastModifyAt: 'modify_time',
  Objects: 'objects',
  TableCount: 'table_count',
  ColumnCount: 'column_count',
  RowCount: 'row_count',
  IdentifierScore: 'identifier_score',
  BucketProperties: 'bucketProperties',
  AccountId: 'account_id',
  Labels: 'labels',
};

// S3 catalog column
export const S3_COLUMN_LIST = [
  {
    id: COLUMN_OBJECT_STR.DatabaseName,
    label: 'Bucket name',
  },
  {
    id: COLUMN_OBJECT_STR.ObjectCount,
    label: 'Object',
  },
  {
    id: COLUMN_OBJECT_STR.Size,
    label: 'Size',
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'Privacy',
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'AWS account',
  },
  {
    id: 'region',
    label: 'AWS region',
  },
  {
    id: 'labels',
    label: 'Catalog labels',
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'Last updated at',
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyBy,
    label: 'Last updated by',
  },
];

// catalog data type
export const DATA_TYPE = {
  s3: 'S3 bucket',
  rds: 'RDS instance',
};

// RDS MODAL TABS
export const RDS_MODAL_TABS = [
  {
    id: 'dataIdentifiers',
    label: 'Data identifiers',
    detailDesHeader: '',
    detailDesInfo: '',
  },
  {
    id: COLUMN_OBJECT_STR.Tables,
    label: 'Tables',
    detailDesHeader: '',
    detailDesInfo: '',
  },
  {
    id: COLUMN_OBJECT_STR.BucketProperties,
    label: 'Instance properties',
    detailDesHeader: '',
    detailDesInfo: '',
  },
];

// S3 MODAL TABS
export const S3_MODAL_TABS = [
  {
    id: 'dataIdentifiers',
    label: 'Data identifiers',
    detailDesHeader: '',
    detailDesInfo: '',
  },
  {
    id: COLUMN_OBJECT_STR.Folders,
    label: 'Folders',
    detailDesHeader: '',
    detailDesInfo: '',
  },
  {
    id: 'bucketProperties',
    label: 'Bucket properties',
    detailDesHeader: '',
    detailDesInfo: '',
  },
];

export const DATA_IDENT_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.Identifier,
    label: 'Data identifier',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.TableCount,
    label: 'Folders',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Objects,
    label: 'Objects',
    filter: true,
  },
  {
    id: 'size',
    label: 'Size',
    filter: false,
  },
];

export const RDS_DATA_IDENT_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.Identifier,
    label: 'Data identifier',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.TableCount,
    label: 'Tables',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Objects,
    label: 'Columns',
    filter: true,
  },
];

export const FOLDERS_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.FolderName,
    label: 'Folder name',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.ObjectCount,
    label: 'Objects',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.RowCount,
    label: 'Items',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Size,
    label: 'Size',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'Privacy',
    filter: true,
  },
  {
    id: 'modify_by',
    label: 'Last updated by',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'Last updated at',
    filter: false,
  },
];

export const BUCKET_PROPERTIES_COLUMN = [
  {
    id: 'property',
    label: 'Property',
    filter: false,
  },
  {
    id: 'value',
    label: 'Value',
    filter: false,
  },
];

export const SAMPLE_OBJECT_COLUMN = [
  {
    id: 's3objects',
    label: 'S3 objects',
    filter: true,
  },
  {
    id: 'file_type',
    label: 'File type',
    filter: true,
  },
  {
    id: 'file_size',
    label: 'File size',
    filter: false,
  },
  {
    id: 's3_full_path',
    label: 'S3 full path',
    filter: false,
  },
];

export const SCHEMA_COLUMN = [
  {
    id: 'column_name',
    label: 'Column name',
    filter: true,
  },
  {
    id: 'column_type',
    label: 'Type',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Identifier,
    label: 'Identifier ',
    filter: true,
  },
  {
    id: 'column_value_example',
    label: 'Sample data',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'Privacy',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyBy,
    label: 'Last updated by',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'Last updated at',
    filter: true,
  },
];

export const DATA_PERVIEW_COLUMN = [
  {
    id: 'uuid',
    label: 'uuid',
  },
  {
    id: 'name',
    label: 'name',
  },
  {
    id: 'address',
    label: 'address',
  },
  {
    id: 'orderType',
    label: 'order-type',
  },
  {
    id: 'customerLabel',
    label: 'customer-label',
  },
  {
    id: 'customerLabelId',
    label: 'customer-label-id',
  },
  {
    id: 'timestamp',
    label: 'timestamp',
  },
];

export const RDS_COLUMN_LIST = [
  {
    id: 'database_name',
    label: 'Instance name',
  },
  {
    id: 'table_count',
    label: 'Table',
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'Privacy',
  },
  {
    id: 'storage_location',
    label: 'Engine type',
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'AWS account',
  },
  {
    id: 'region',
    label: 'AWS region',
  },
  {
    id: 'labels',
    label: 'Catalog labels',
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'Last updated at',
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyBy,
    label: 'Last updated by',
  },
];

export const TABLES_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.FolderName,
    label: 'Tables',
    filter: true,
  },
  {
    id: 'column_count',
    label: 'Columns',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.RowCount,
    label: 'Rows',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'Privacy',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyBy,
    label: 'Last updated by',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'Last updated at',
    filter: false,
  },
];

export const S3_FILTER_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.DatabaseName,
    label: 'Bucket name',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.ObjectCount,
    label: 'Object',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'Privacy',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'AWS account',
    filter: true,
  },
  {
    id: 'region',
    label: 'AWS region',
    filter: true,
  },
];

export const RDS_FILTER_COLUMN = [
  {
    id: 'database_name',
    label: 'Instance name',
    filter: true,
  },
  {
    id: 'table_count',
    label: 'Table',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'Privacy',
    filter: true,
  },
  {
    id: 'storage_location',
    label: 'Engine type',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'AWS account',
    filter: true,
  },
  {
    id: 'region',
    label: 'AWS region',
    filter: true,
  },
];

export const COLUMN_WIDTH = {
  [COLUMN_OBJECT_STR.Privacy]: 130,
};

export const UPDATE_FLAG = 'updateByFront';
