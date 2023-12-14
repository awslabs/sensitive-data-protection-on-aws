export const REGION_TYPE = {
  CN_NORTH1: 'cn-north-1',
  CN_NORTHWEST1: 'cn-northwest-1',
};

export enum RDS_VIEW {
  RDS_INSTANCE_VIEW = 'rds-instance-view',
  RDS_TABLE_VIEW = 'rds-table-view',
}

export enum GLUE_VIEW {
  GLUE_INSTANCE_VIEW = 'glue-instance-view',
  GLUE_TABLE_VIEW = 'glue-table-view',
  GLUE_ACCOUNT_VIEW = 'glue-account-view',
}

export enum JDBC_VIEW {
  JDBC_INSTANCE_VIEW = 'jdbc-instance-view',
  JDBC_TABLE_VIEW = 'jdbc-table-view',
}

export const TAB_LIST = {
  S3: { label: '', id: 's3' },
  RDS: { label: '', id: 'rds' },
  GLUE: { label: '', id: 'glue' },
  JDBC: { label: '', id: 'jdbc' },
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
  JDBC_AWS: 'jdbc_aws',
  JDBC_TENCENT: 'jdbc_tencent',
  JDBC_ALIYUN: 'jdbc_aliyun',
  JDBC_GOOGLE: 'jdbc_google',
  JDBC_PROXY: 'jdbc_proxy',
};

export const getProviderByProviderId = (providerId: number | string) => {
  if (typeof providerId === 'string') {
    providerId = parseInt(providerId);
  }
  switch (providerId) {
    case 1:
      return { name: 'AWS' };
    case 2:
      return { name: 'Tencent Cloud' };
    case 3:
      return { name: 'Google Cloud' };
    case 4:
      return { name: 'AWS' };
    default:
      return { name: '-' };
  }
};

export const getSourceByJob = (jobData: any) => {
  if (jobData?.database_type?.startsWith(SOURCE_TYPE.JDBC)) {
    return 'JDBC';
  } else if (jobData?.database_type) {
    return jobData?.database_type?.toUpperCase();
  } else {
    return '-';
  }
};

export const getJDBCTypeByProviderId = (providerId: number) => {
  switch (providerId) {
    case 1:
      return SOURCE_TYPE.JDBC_AWS;
    case 2:
      return SOURCE_TYPE.JDBC_TENCENT;
    case 3:
      return SOURCE_TYPE.JDBC_GOOGLE;
    case 4:
      return SOURCE_TYPE.JDBC_PROXY;
    default:
      return SOURCE_TYPE.JDBC;
  }
};

export const getSourceTypeByProvider = (providerId: string | number) => {
  const providerIdStr = providerId.toString();
  switch (providerIdStr) {
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
          value: SOURCE_TYPE.JDBC_GOOGLE,
        },
      ];
    case '4':
      return [
        {
          label: 'Custom databases',
          value: SOURCE_TYPE.JDBC_PROXY,
        },
      ];
    default:
      return [];
  }
};
