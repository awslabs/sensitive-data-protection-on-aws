export const REGION_TYPE = {
  CN_NORTH1: 'cn-north-1',
  CN_NORTHWEST1: 'cn-northwest-1',
};

export const TAB_LIST = {
  S3: { label: 'Amazon S3', id: 's3' },
  RDS: { label: 'Amazon RDS', id: 'rds' },
  GLUE: { label: 'Glue data catalogs', id: 'glue' },
  JDBC: { label: 'Custom database (JDBC)', id: 'jdbc' },
  CN_NORTH1: { label: REGION_TYPE.CN_NORTH1, id: REGION_TYPE.CN_NORTH1 },
  CN_NORTHWEST1: {
    label: REGION_TYPE.CN_NORTHWEST1,
    id: REGION_TYPE.CN_NORTHWEST1,
  },
};

export const DATA_TYPE_ENUM = {
  s3: 's3',
  rds: 'rds',
  glue: 'glue',
  jdbc: 'jdbc',
};

export const TABLE_NAME = {
  SOURCE_S3_BUCKET: 'source_s3_bucket',
  SOURCE_ACCOUNT: 'source_account',
  SOURCE_RDS_INSTANCE: 'source_rds_instance',
  DISCOVERY_JOB: 'discovery_job',
  DISCOVERY_JOB_DATABASE: 'discovery_job_database',
  CATALOG_TABLE_LEVEL_CLASSIFICATION: 'catalog_table_level_classification',
  CATALOG_DATABASE_LEVEL_CLASSIFICATION:
    'catalog_database_level_classification',
  TEMPLATE_IDENTIFIER: 'template_identifier',
  TEMPLATE_MAPPING: 'template_mapping',
};

export const SOURCE_TYPE = {
  RDS: 'rds',
  S3: 's3',
  S3_UNSTRUCTURED: 'unstructured',
  GLUE: 'glue',
  DDB: 'ddb',
  EMR: 'emr',
  JDBC: 'jdbc',
  JDBC_AWS: 'jdbc-aws',
  JDBC_TENCENT: 'jdbc-tencent',
  JDBC_ALIYUN: 'jdbc-aliyun',
};

export const getSourceTypeByProvider = (providerId: string) => {
  switch (providerId) {
    case '1':
      return [
        {
          label: 'Amazon S3',
          value: SOURCE_TYPE.S3,
        },
        {
          label: 'Amazon RDS',
          value: SOURCE_TYPE.RDS,
        },
        { label: 'Glue data catalogs', value: SOURCE_TYPE.GLUE },
        {
          label: 'Custom databases',
          value: SOURCE_TYPE.JDBC_AWS,
        },
      ];
    case '2':
      return [
        {
          label: 'Custom databases',
          value: SOURCE_TYPE.JDBC_TENCENT,
        },
      ];
    case '3':
      return [
        {
          label: 'Custom databases',
          value: SOURCE_TYPE.JDBC,
        },
      ];
    default:
      return [];
  }
};
