import { SelectProps } from '@cloudscape-design/components';
import { GLUE_VIEW, JDBC_VIEW, RDS_VIEW } from 'enum/common_types';
import {
  DETECTION_THRESHOLD_OPTIONS,
  FREQUENCY_TYPE,
  OVERRIDE_OPTIONS,
  SCAN_DEPTH_OPTIONS,
  SCAN_RANGE_OPTIONS,
  SCAN_UNSTRUCTURED_DEPTH_OPTIONS,
} from 'pages/create-job/types/create_data_type';
import { DEFAULT_TEMPLATE } from 'pages/data-template/types/template_type';

export const JOB_LIST_COLUMN_LIST = [
  {
    id: 'id',
    label: 'table.label.jobId',
    filter: true,
  },
  {
    id: 'name',
    label: 'table.label.jobName',
    filter: true,
  },
  {
    id: 'dataSource',
    label: 'table.label.dataSource',
    filter: true,
  },
  {
    id: 'provider',
    label: 'table.label.provider',
    filter: true,
  },
  // {
  //   id: 'description',
  //   label: 'table.label.description',
  //   filter: true,
  // },
  {
    id: 'schedule',
    label: 'table.label.jobFrequency',
    filter: false,
  },
  {
    id: 'state',
    label: 'table.label.jobStatus',
    filter: true,
  },
  {
    id: 'last_start_time',
    label: 'table.label.lastJobStartedAt',
    filter: false,
  },
  {
    id: 'last_end_time',
    label: 'table.label.lastJobFinishedAt',
    filter: false,
  },
];

export const SCAN_FREQUENCY: any[] = [
  { value: 'on_demand_run', label: FREQUENCY_TYPE.on_demand_run },
  { value: 'daily', label: FREQUENCY_TYPE.daily },
  { value: 'weekly', label: FREQUENCY_TYPE.weekly },
  { value: 'monthly', label: FREQUENCY_TYPE.monthly },
];

export type DataBaseType = {
  account_id: string;
  region: string;
  database_type: string;
  database_name: string;
  table_name: string;
};

export interface IDataSourceType {
  object_count: number;
  manual_tag: string;
  account_id: string;
  size_key: number;
  state: string;
  id: number;
  table_count: number;
  version: number;
  region: string;
  column_count: number;
  create_by: string;
  database_type: string;
  row_count: number;
  create_time: string;
  database_name: string;
  storage_location: string;
  modify_by: string;
  privacy: number;
  label_ids: null;
  modify_time: string;
  sensitivity: string;
  labels: Array<any>;
  table_name: string;
}
export interface IDataSourceS3BucketType {
  bucket_name: string;
  size: string;
  account_id: string;
  region: string;
  aws_account: string;
}

export interface IJobType {
  provider_id: string;
  database_type: string;
  name: string;
  template_id: string;
  schedule: string;
  description: string;
  range: string;
  depth_structured: string;
  depth_unstructured: string;
  detection_threshold: string;
  all_s3: string;
  all_rds: string;
  all_ddb: string;
  all_emr: string;
  all_glue: string;
  all_jdbc: string;
  overwrite: string;
  exclude_keywords: string;
  include_keywords: string;
  exclude_file_extensions: string;
  include_file_extensions: string;
  databases: DataBaseType[];
  // Temporary Variables
  templateObj: SelectProps.Option | null;
  scanFrequencyObj: SelectProps.Option | null;
  scanDepthObj: SelectProps.Option | null;
  scanUnstructuredDepthObj: SelectProps.Option | null;
  scanRangeObj: SelectProps.Option | null;
  detectionThresholdObj: SelectProps.Option | null;
  overrideObj: SelectProps.Option | null;
  excludeKeyWordsEnable: boolean;
  includeKeyWordsEnable: boolean;
  excludeExtensionsEnable: boolean;
  includeExtensionsEnable: boolean;
  frequency: string;
  frequencyType: string;
  frequencyStart: SelectProps.Option | null;
  frequencyTimeStart: SelectProps.Option | null;
  rdsSelectedView: RDS_VIEW;
  jdbcSelectedView: JDBC_VIEW;
  glueSelectedView: GLUE_VIEW;
}

export const INIT_JOB_DATA: IJobType = {
  provider_id: '1',
  database_type: '',
  name: '',
  template_id: '1',
  schedule: '',
  description: '',
  range: '1',
  depth_structured: '1000',
  depth_unstructured: '0',
  detection_threshold: '0.2',
  all_s3: '0',
  all_rds: '0',
  all_ddb: '0',
  all_emr: '0',
  all_glue: '0',
  all_jdbc: '0',
  overwrite: '0',
  exclude_keywords: '',
  include_keywords: '',
  exclude_file_extensions: '',
  include_file_extensions: '',
  databases: [],
  templateObj: DEFAULT_TEMPLATE,
  scanFrequencyObj: SCAN_FREQUENCY[0],
  scanDepthObj: SCAN_DEPTH_OPTIONS[0],
  scanUnstructuredDepthObj: SCAN_UNSTRUCTURED_DEPTH_OPTIONS[0],
  scanRangeObj: SCAN_RANGE_OPTIONS[1],
  detectionThresholdObj: DETECTION_THRESHOLD_OPTIONS[1],
  overrideObj: OVERRIDE_OPTIONS[0],
  excludeKeyWordsEnable: false,
  includeKeyWordsEnable: false,
  excludeExtensionsEnable: false,
  includeExtensionsEnable: false,
  frequency: 'On-demand run',
  frequencyType: 'on_demand_run',
  frequencyStart: null,
  frequencyTimeStart: { label: '00:00', value: '0' },
  rdsSelectedView: RDS_VIEW.RDS_INSTANCE_VIEW,
  jdbcSelectedView: JDBC_VIEW.JDBC_INSTANCE_VIEW,
  glueSelectedView: GLUE_VIEW.GLUE_INSTANCE_VIEW,
};
