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
