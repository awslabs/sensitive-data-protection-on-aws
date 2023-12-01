import { ColumnList } from 'ts/common';

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
  Comments: 'comments',
  Category: 'category',
  IdentifierLabel: 'ident_label',
  Region: 'region',
  StructuredData: 's3',
  UnstructuredData: 'unstructured',
  FolderDetail: 'folderDetail',
  TableDetail: 'tableDetail',
  Download: 'file_download',
  Classification: 'classification',
};

// S3 catalog column
export const S3_COLUMN_LIST: ColumnList[] = [
  {
    id: COLUMN_OBJECT_STR.DatabaseName,
    label: 'table.label.bucketName',
    sortingField: COLUMN_OBJECT_STR.DatabaseName,
  },
  {
    id: COLUMN_OBJECT_STR.ObjectCount,
    label: 'table.label.objects',
    sortingField: COLUMN_OBJECT_STR.ObjectCount,
  },
  {
    id: COLUMN_OBJECT_STR.Size,
    label: 'table.label.size',
    sortingField: COLUMN_OBJECT_STR.Size,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    sortingField: COLUMN_OBJECT_STR.Privacy,
  },
  {
    id: COLUMN_OBJECT_STR.Identifier,
    label: 'table.label.identifier',
    sortingField: COLUMN_OBJECT_STR.Identifier,
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'table.label.awsAccount',
    sortingField: COLUMN_OBJECT_STR.AccountId,
  },
  {
    id: COLUMN_OBJECT_STR.Region,
    label: 'table.label.awsRegion',
    sortingField: COLUMN_OBJECT_STR.Region,
  },
  {
    id: COLUMN_OBJECT_STR.Labels,
    label: 'table.label.catalogLabels',
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'table.label.lastUpdateAt',
    sortingField: COLUMN_OBJECT_STR.LastModifyAt,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyBy,
    label: 'table.label.lastUpdateBy',
    sortingField: COLUMN_OBJECT_STR.LastModifyBy,
  },
];

// catalog data type
export const DATA_TYPE = {
  s3: 's3Bucket',
  rds: 'rdsInstance',
  jdbc: 'JDBC',
};

// RDS MODAL TABS
export const RDS_MODAL_TABS = [
  {
    id: 'dataIdentifiers',
    label: 'tab.dataIdentifiers',
    detailDesHeader: '',
    detailDesInfo: '',
  },
  {
    id: COLUMN_OBJECT_STR.Tables,
    label: 'tab.tables',
    detailDesHeader: '',
    detailDesInfo: '',
  },
  {
    id: COLUMN_OBJECT_STR.BucketProperties,
    label: 'tab.instanceProperties',
    detailDesHeader: '',
    detailDesInfo: '',
  },
];

// S3 MODAL TABS
export const S3_MODAL_TABS = [
  {
    id: 'dataIdentifiers',
    label: 'tab.dataIdentifiers',
    detailDesHeader: '',
    detailDesInfo: '',
  },
  {
    id: COLUMN_OBJECT_STR.StructuredData,
    label: 'tab.structuredData',
    detailDesHeader: '',
    detailDesInfo: '',
  },
  {
    id: COLUMN_OBJECT_STR.UnstructuredData,
    label: 'tab.unstructuredData',
    detailDesHeader: '',
    detailDesInfo: '',
  },
  {
    id: 'bucketProperties',
    label: 'tab.s3Properties',
    detailDesHeader: '',
    detailDesInfo: '',
  },
];

export const DATA_IDENT_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.Identifier,
    label: 'table.label.dataIdentifiers',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.TableCount,
    label: 'table.label.folders',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Objects,
    label: 'table.label.objects',
    filter: true,
  },
  {
    id: 'size',
    label: 'table.label.size',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.Category,
    label: 'table.label.category',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.IdentifierLabel,
    label: 'table.label.identifierLabel',
    filter: false,
  },
];

export const RDS_DATA_IDENT_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.Identifier,
    label: 'table.label.dataIdentifiers',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.TableCount,
    label: 'table.label.tables',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Objects,
    label: 'table.label.columns',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Category,
    label: 'table.label.category',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.IdentifierLabel,
    label: 'table.label.identifierLabel',
    filter: false,
  },
];

export const TABLE_COLUMN: ColumnList[] = [
  {
    id: COLUMN_OBJECT_STR.FolderName,
    label: 'table.label.table',
    sortingField: COLUMN_OBJECT_STR.FolderName,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.Privacy,
  },
  {
    id: COLUMN_OBJECT_STR.ColumnCount,
    label: 'table.label.columns',
  },
  {
    id: COLUMN_OBJECT_STR.RowCount,
    label: 'table.label.items',
    sortingField: COLUMN_OBJECT_STR.RowCount,
  },
  {
    id: COLUMN_OBJECT_STR.DatabaseName,
    label: 'table.label.instanceName',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.DatabaseName,
    disableClick: true,
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'table.label.awsAccount',
    sortingField: COLUMN_OBJECT_STR.AccountId,
  },
  {
    id: COLUMN_OBJECT_STR.Region,
    label: 'table.label.awsRegion',
    sortingField: COLUMN_OBJECT_STR.Region,
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
    sortingField: COLUMN_OBJECT_STR.LastModifyBy,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'table.label.lastUpdateAt',
    filter: false,
    sortingField: COLUMN_OBJECT_STR.LastModifyAt,
  },
];

export const FOLDERS_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.FolderName,
    label: 'table.label.folderName',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.FolderName,
  },
  {
    id: COLUMN_OBJECT_STR.ObjectCount,
    label: 'table.label.objects',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.ObjectCount,
  },
  {
    id: COLUMN_OBJECT_STR.RowCount,
    label: 'table.label.items',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.RowCount,
  },
  {
    id: COLUMN_OBJECT_STR.Size,
    label: 'table.label.size',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.Size,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.Privacy,
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
    sortingField: COLUMN_OBJECT_STR.LastModifyBy,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'table.label.lastUpdateAt',
    filter: false,
    sortingField: COLUMN_OBJECT_STR.LastModifyAt,
  },
];

export const S3_UNSTRUCTURED_FOLDERS_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.FolderName,
    label: 'table.label.folderName',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.FolderName,
  },
  {
    id: COLUMN_OBJECT_STR.ObjectCount,
    label: 'table.label.objects',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.ObjectCount,
  },
  {
    id: COLUMN_OBJECT_STR.Classification,
    label: 'table.label.type',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.Classification,
  },
  {
    id: COLUMN_OBJECT_STR.Size,
    label: 'table.label.size',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.Size,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.Privacy,
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
    sortingField: COLUMN_OBJECT_STR.LastModifyBy,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'table.label.lastUpdateAt',
    filter: false,
    sortingField: COLUMN_OBJECT_STR.LastModifyAt,
  },
];

export const BUCKET_PROPERTIES_COLUMN = [
  {
    id: 'property',
    label: 'table.label.property',
    filter: false,
  },
  {
    id: 'value',
    label: 'table.label.value',
    filter: false,
  },
];

export const SAMPLE_OBJECT_COLUMN = [
  {
    id: 's3objects',
    label: 'table.label.s3Objects',
    filter: true,
  },
  {
    id: 'file_type',
    label: 'table.label.fileType',
    filter: true,
  },
  {
    id: 'file_size',
    label: 'table.label.fileSize',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.Download,
    label: 'table.label.download',
    filter: false,
  },
  {
    id: 's3_full_path',
    label: 'table.label.s3FullPath',
    filter: false,
  },
];

export const UNSTRUCTURED_SAMPLE_OBJECT_COLUMN = [
  {
    id: 's3objects',
    label: 'table.label.s3Objects',
    filter: true,
  },
  {
    id: 'file_type',
    label: 'table.label.fileType',
    filter: true,
  },
  {
    id: 'file_size',
    label: 'table.label.fileSize',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Identifier,
    label: 'table.label.identifier',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Download,
    label: 'table.label.download',
    filter: false,
  },
  {
    id: 's3_full_path',
    label: 'table.label.s3FullPath',
    filter: false,
  },
];

export const SCHEMA_COLUMN = [
  {
    id: 'column_name',
    label: 'table.label.columnName',
    filter: true,
  },
  {
    id: 'column_type',
    label: 'table.label.type',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Identifier,
    label: 'table.label.identifier',
    filter: true,
  },
  {
    id: 'column_value_example',
    label: 'table.label.sampleData',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Comments,
    label: 'table.label.comments',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyBy,
    label: 'table.label.lastUpdateBy',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'table.label.lastUpdateAt',
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

export const RDS_COLUMN_LIST: ColumnList[] = [
  {
    id: COLUMN_OBJECT_STR.DatabaseName,
    label: 'table.label.instanceName',
    sortingField: COLUMN_OBJECT_STR.DatabaseName,
  },
  {
    id: COLUMN_OBJECT_STR.TableCount,
    label: 'table.label.table',
    sortingField: COLUMN_OBJECT_STR.TableCount,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    sortingField: COLUMN_OBJECT_STR.Privacy,
  },
  {
    id: 'storage_location',
    label: 'table.label.engineType',
    sortingField: 'storage_location',
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'table.label.awsAccount',
    sortingField: COLUMN_OBJECT_STR.AccountId,
  },
  {
    id: COLUMN_OBJECT_STR.Region,
    label: 'table.label.awsRegion',
    sortingField: COLUMN_OBJECT_STR.Region,
  },
  {
    id: 'labels',
    label: 'table.label.catalogLabels',
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'table.label.lastUpdateAt',
    sortingField: COLUMN_OBJECT_STR.LastModifyAt,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyBy,
    label: 'table.label.lastUpdateBy',
    sortingField: COLUMN_OBJECT_STR.LastModifyBy,
  },
];

export const TABLES_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.FolderName,
    label: 'table.label.tables',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.FolderName,
  },
  {
    id: COLUMN_OBJECT_STR.ColumnCount,
    label: 'table.label.columns',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.ColumnCount,
  },
  {
    id: COLUMN_OBJECT_STR.RowCount,
    label: 'table.label.rows',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.RowCount,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.Privacy,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyBy,
    label: 'table.label.lastUpdateBy',
    filter: true,
    sortingField: COLUMN_OBJECT_STR.LastModifyBy,
  },
  {
    id: COLUMN_OBJECT_STR.LastModifyAt,
    label: 'table.label.lastUpdateAt',
    filter: false,
    sortingField: COLUMN_OBJECT_STR.LastModifyAt,
  },
];

export const S3_FILTER_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.DatabaseName,
    label: 'table.label.bucketName',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.ObjectCount,
    label: 'table.label.objects',
    filter: false,
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
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
];

export const RDS_TABLE_FILTER_COLUMN = [
  {
    id: COLUMN_OBJECT_STR.FolderName,
    label: 'table.label.tables',
    filter: true,
  },
  {
    id: 'table_count',
    label: 'table.label.table',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    filter: true,
  },
  {
    id: 'storage_location',
    label: 'table.label.engineType',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'table.label.awsAccount',
    filter: true,
  },
  {
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
];

export const CATALOG_TABLE_FILTER_COLUMN = [
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
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
];

export const RDS_FILTER_COLUMN = [
  {
    id: 'database_name',
    label: 'table.label.instanceName',
    filter: true,
  },
  {
    id: 'table_count',
    label: 'table.label.table',
    filter: false,
  },
  {
    id: COLUMN_OBJECT_STR.Privacy,
    label: 'table.label.privacy',
    filter: true,
  },
  {
    id: 'storage_location',
    label: 'table.label.engineType',
    filter: true,
  },
  {
    id: COLUMN_OBJECT_STR.AccountId,
    label: 'table.label.awsAccount',
    filter: true,
  },
  {
    id: 'region',
    label: 'table.label.awsRegion',
    filter: true,
  },
];

export const COLUMN_WIDTH = {
  [COLUMN_OBJECT_STR.Privacy]: 130,
};

export const UPDATE_FLAG = 'updateByFront';
