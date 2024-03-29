import React, { useEffect, useState } from 'react';
import './style.scss';
import {
  Button,
  Container,
  FormField,
  Header,
  Input,
  SpaceBetween,
  Tiles,
  Wizard,
  Table,
  Pagination,
  CollectionPreferences,
  Select,
  SelectProps,
  AppLayout,
  Icon,
  Popover,
  StatusIndicator,
  Textarea,
  Toggle,
  SegmentedControl,
} from '@cloudscape-design/components';
import { useLocation, useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import {
  COLUMN_OBJECT_STR,
  DETECTION_THRESHOLD_OPTIONS,
  DbItemInfo,
  CombinedRDSDatabase,
  FREQUENCY_TYPE,
  OVERRIDE_OPTIONS,
  RDS_CATALOG_COLUMS,
  RDS_CATALOG_COLUMS_OLDDATA,
  S3_CATALOG_COLUMS,
  S3_CATALOG_COLUMS_OLDDATA,
  SCAN_DEPTH_OPTIONS,
  SCAN_RANGE_OPTIONS,
  RDS_FOLDER_COLUMS,
} from './types/create_data_type';
import { getDataBaseByType, searchCatalogTables } from 'apis/data-catalog/api';
import { createJob, getJobDetail, startJob } from 'apis/data-job/api';
import { SUB_WEEK_CONFIG, alertMsg, formatSize } from 'tools/tools';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  PRIVARY_TYPE_INT_DATA,
} from 'pages/common-badge/types/badge_type';
import ResourcesFilter from 'pages/resources-filter';
import {
  HOUR_OPTIONS,
  DAY_OPTIONS,
  MONTH_OPTIONS,
} from './types/create_data_type';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { TABLE_NAME } from 'enum/common_types';
import { useTranslation } from 'react-i18next';

const DEFAULT_TEMPLATE = {
  label: 'Current data classification template',
  value: '1',
};

const SELECT_S3 = 'selectS3';
const NONE_S3 = 'noneS3';

const SELECT_RDS = 'selectRds';
const NONE_RDS = 'noneRds';

const S3_OPTION: any = {
  allS3: 'All data catalogs',
  [SELECT_S3]: 'Specific data catalogs',
  [NONE_S3]: 'Skip scan Amazon S3',
};

const RDS_OPTION: any = {
  allRds: 'All data catalogs',
  [SELECT_RDS]: 'Specific data catalogs',
  [NONE_RDS]: 'Skip scan for Amazon RDS',
};

const SCAN_FREQUENCY: any[] = [
  { value: 'on_demand_run', label: FREQUENCY_TYPE.on_demand_run },
  { value: 'daily', label: FREQUENCY_TYPE.daily },
  { value: 'weekly', label: FREQUENCY_TYPE.weekly },
  { value: 'monthly', label: FREQUENCY_TYPE.monthly },
];

const CreateJobHeader: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Header
      variant="h1"
      description=""
      actions={
        <Button onClick={() => navigate(RouterEnum.Datajob.path)}>
          {t('button.backToJobList')}
        </Button>
      }
    >
      {t('job:create.title')}
    </Header>
  );
};

const CreateJobContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { oldData } = location.state || {};
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [s3CatalogType, setS3CatalogType] = useState('');
  const [rdsCatalogType, setRdsCatalogType] = useState('');
  const [s3CatalogData, setS3CatalogData] = useState([] as any);
  const [rdsCatalogData, setRdsCatalogData] = useState([] as any);
  const [rdsFolderData, setRdsFolderData] = useState([] as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [s3Total, setS3Total] = useState(0);
  const [rdsTotal, setRdsTotal] = useState(0);
  const [selectedS3Items, setSelectedS3Items] = useState([] as any);
  const [selectedRdsItems, setSelectedRdsItems] = useState([] as any);
  const [jobName, setJobName] = useState(oldData ? oldData.name : '');
  const [jobDescription, setJobDescriptio] = useState(
    oldData ? oldData.description : ''
  );
  const [selectTemplate, setSelectTemplate] = useState(DEFAULT_TEMPLATE as any);
  const [frequency, setFrequency] = useState('On-demand run');
  const [scanFrequency, setScanFrequency] = useState(
    SCAN_FREQUENCY[0] as SelectProps.Option | null
  );
  const [scanDepth, setScanDepth] = useState(
    SCAN_DEPTH_OPTIONS[0] as SelectProps.Option | null
  );
  const [scanRange, setScanRange] = useState(
    SCAN_RANGE_OPTIONS[1] as SelectProps.Option | null
  );
  const [detectionThreshold, setDetectionThreshold] = useState(
    DETECTION_THRESHOLD_OPTIONS[1] as SelectProps.Option | null
  );
  const [overwrite, setOverwrite] = useState(
    OVERRIDE_OPTIONS[0] as SelectProps.Option | null
  );
  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
    visibleContent:
      activeStepIndex === 0
        ? S3_CATALOG_COLUMS.map((o) => o.id)
        : RDS_CATALOG_COLUMS.map((o) => o.id),
  } as any);
  const [isLoading, setIsLoading] = useState(false);
  const [s3Query, setS3Query] = useState({
    tokens: [],
    operation: 'and',
  } as any);

  const [rdsQuery, setRdsQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);

  const [frequencyType, setFrequencyType] = useState('on_demand_run');

  const [frequencyStart, setFrequencyStart] = useState(
    null as SelectProps.Option | null
  );
  const [frequencyTimeStart, setFrequencyTimeStart] =
    useState<SelectProps.Option>({ label: '00:00', value: '0' });

  const [timezone, setTimezone] = useState('');

  const [exclusiveToggle, setExclusiveToggle] = useState(false);
  const [exclusiveText, setExclusiveText] = useState('');

  const hasOldData = oldData && Object.keys(oldData).length > 0;

  const s3FilterProps = {
    totalCount: s3Total,
    query: s3Query,
    setQuery: setS3Query,
    columnList: S3_CATALOG_COLUMS.filter((i) => i.filter),
    tableName: TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION,
    filteringPlaceholder: t('job:filterBuckets'),
  };

  const rdsFilterProps = {
    totalCount: rdsTotal,
    query: rdsQuery,
    setQuery: setRdsQuery,
    columnList: RDS_CATALOG_COLUMS.filter((i) => i.filter),
    tableName: TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION,
    filteringPlaceholder: t('job:filterInstances'),
  };

  useEffect(() => {
    if (!exclusiveToggle) {
      setExclusiveText('');
    }
  }, [exclusiveToggle]);

  const [rdsSelectedView, setRdsSelectedView] = useState('rds-instance-view');

  useEffect(() => {
    if (s3CatalogType === SELECT_S3 && activeStepIndex === 0 && !hasOldData) {
      getS3CatalogData();
    }
    if (
      rdsCatalogType === SELECT_RDS &&
      activeStepIndex === 1 &&
      !hasOldData &&
      rdsSelectedView === 'rds-instance-view'
    ) {
      setSelectedRdsItems([]);
      getRdsCatalogData();
    }
    if (
      rdsCatalogType === SELECT_RDS &&
      activeStepIndex === 1 &&
      !hasOldData &&
      rdsSelectedView === 'rds-table-view'
    ) {
      setSelectedRdsItems([]);
      getRdsFolderData();
    }
  }, [
    rdsCatalogType,
    rdsQuery,
    s3CatalogType,
    s3Query,
    currentPage,
    preferences.pageSize,
    rdsSelectedView,
  ]);

  useEffect(() => {
    if (hasOldData) {
      getCopyPropsData();
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeStepIndex]);

  useEffect(() => {
    setFrequencyStart(null);
    setFrequencyTimeStart({ label: '00:00', value: '0' });
  }, [frequencyType]);

  const getRdsFolderData = async (nameFilter?: string) => {
    try {
      const requestParam: any = {
        page: currentPage,
        size: preferences.pageSize,
      };

      const result = await searchCatalogTables(requestParam);
      setRdsFolderData((result as any)?.items);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const getCopyPropsData = async () => {
    setIsLoading(true);
    const { id } = oldData;
    const result: any = await getJobDetail({ id });
    if (!result) {
      return;
    }
    // set copy database(catalog)
    if (result.databases && result.databases.length > 0) {
      const requestList: any[] = [];
      result.databases.forEach(
        (itemDb: { database_type: any; database_name: any }) => {
          const requestParam = {
            page: currentPage,
            size: preferences.pageSize,
            sort_column: '',
            asc: true,
            conditions: [
              {
                column: 'database_type',
                values: [itemDb.database_type],
                condition: 'and',
              },
              {
                column: COLUMN_OBJECT_STR.DatabaseName,
                values: [itemDb.database_name],
                condition: 'and',
              },
            ] as any,
          };
          requestList.push(getDataBaseByType(requestParam));
        }
      );
      const allDBInfo = await Promise.all(requestList);

      const tempCatalogList: any[] = [];

      const pushS3List: any[] = [];
      const pushRdsList: any[] = [];

      allDBInfo.forEach((itemCatalog) => {
        itemCatalog.items.length > 0 &&
          tempCatalogList.push(itemCatalog.items[0]);
      });
      result.databases.forEach((itemDb: DbItemInfo) => {
        const tempItemCatalog = tempCatalogList.filter(
          (itemInfo) =>
            itemInfo.database_name === itemDb.database_name &&
            itemInfo.database_type === itemDb.database_type
        );
        if (itemDb.database_type === 's3') {
          pushS3List.push(
            tempItemCatalog && tempItemCatalog.length > 0
              ? tempItemCatalog[0]
              : {
                  account_id: itemDb.account_id,
                  region: itemDb.region,
                  database_name: itemDb.database_name,
                }
          );
        } else {
          pushRdsList.push(
            tempItemCatalog && tempItemCatalog.length > 0
              ? tempItemCatalog[0]
              : {
                  account_id: itemDb.account_id,
                  region: itemDb.region,
                  database_name: itemDb.database_name,
                }
          );
        }
      });

      pushS3List.length > 0 && setS3CatalogType(SELECT_S3);
      pushS3List.length === 0 && setS3CatalogType(NONE_S3);
      pushRdsList.length > 0 && setRdsCatalogType(SELECT_RDS);
      pushRdsList.length === 0 && setRdsCatalogType(NONE_RDS);
      setSelectedS3Items(pushS3List);
      setSelectedRdsItems(pushRdsList);
    }
    const filterRange = SCAN_RANGE_OPTIONS.filter(
      (item) => parseInt(item.value) === result.range
    );
    setScanRange(filterRange[0]);
    const filterDepth = SCAN_DEPTH_OPTIONS.filter(
      (item) => parseInt(item.value) === result.depth
    );
    setScanDepth(filterDepth[0]);

    const filterThreshold = DETECTION_THRESHOLD_OPTIONS.filter(
      (item) =>
        parseFloat(item.value) === parseFloat(result.detection_threshold)
    );
    setDetectionThreshold(filterThreshold[0]);

    setFrequency(result.schedule.replace('cron(', '').replace(')', ''));
    setIsLoading(false);
  };

  const getS3CatalogData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: '',
      asc: true,
      conditions: [
        {
          column: 'database_type',
          values: ['s3'],
          condition: 'and',
        },
      ] as any,
    };
    s3Query.tokens &&
      s3Query.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          condition: s3Query.operation,
        });
      });
    const dataResult = await getDataBaseByType(requestParam);
    setS3CatalogData((dataResult as any)?.items);
    setS3Total((dataResult as any)?.total);
    setIsLoading(false);
  };

  const getRdsCatalogData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: '',
      asc: true,
      conditions: [
        {
          column: 'database_type',
          values: ['rds'],
          condition: 'and',
        },
      ] as any,
    };
    rdsQuery.tokens &&
      rdsQuery.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          condition: rdsQuery.operation,
        });
      });
    const dataResult = await getDataBaseByType(requestParam);
    setRdsCatalogData((dataResult as any)?.items);
    setRdsTotal((dataResult as any)?.total);
    setIsLoading(false);
  };
  const checkMustData = (requestedStepIndex: number) => {
    if (
      s3CatalogType === SELECT_S3 &&
      selectedS3Items.length === 0 &&
      requestedStepIndex !== 0
    ) {
      alertMsg(t('selectOneItem'), 'error');
      return false;
    }
    if (
      rdsCatalogType === SELECT_RDS &&
      selectedRdsItems.length === 0 &&
      requestedStepIndex !== 1
    ) {
      alertMsg(t('selectOneItem'), 'error');
      return false;
    }
    if (
      rdsCatalogType === SELECT_RDS &&
      selectedRdsItems.length > 50 &&
      requestedStepIndex !== 1
    ) {
      alertMsg(t('job:selectLessItems'), 'error');
      return false;
    }
    if (
      rdsCatalogType === NONE_RDS &&
      s3CatalogType === NONE_S3 &&
      requestedStepIndex >= 2
    ) {
      alertMsg(t('job:selectOnCatalog'), 'error');
      return false;
    }
    if (requestedStepIndex !== 0 && !s3CatalogType) {
      alertMsg(t('selectOneItem'), 'error');
      return false;
    }
    if (
      requestedStepIndex !== 1 &&
      requestedStepIndex !== 0 &&
      !rdsCatalogType
    ) {
      alertMsg(t('selectOneItem'), 'error');
      return false;
    }
    if (requestedStepIndex === 3) {
      if (!jobName) {
        alertMsg(t('job:inputJobName'), 'error');
        return false;
      }
      const trimFrequency: any = frequency ? frequency.trim() : frequency;
      if (!trimFrequency) {
        alertMsg(t('job:freqTypeError'), 'error');
        return false;
      }

      if (!scanDepth) {
        alertMsg(t('job:selectScanDepth'), 'error');
        return false;
      }
      if (!scanRange) {
        alertMsg(t('job:selectScanRange'), 'error');
        return false;
      }
      if (!detectionThreshold) {
        alertMsg(t('job:selectDetection'), 'error');
        return false;
      }
    }
    return true;
  };

  const clkFrequencyApply = (type: any) => {
    const tempType = typeof type === 'string' ? type : frequencyType;
    if (tempType === 'on_demand_run') {
      setFrequency('On-demand run');
    }
    if (tempType === 'daily') {
      if (!frequencyStart) {
        alertMsg(t('job:selectHourOfDay'), 'error');
        return;
      }
      setFrequency(`Daily, start time: ${frequencyStart.value}`);
    }
    if (tempType === 'weekly') {
      if (!frequencyStart) {
        alertMsg(t('job:selectDayOfWeek'), 'error');
        return;
      }
      setFrequency(`${t('job:weeklyStartDay')} ${frequencyStart.value}`);
    }
    if (tempType === 'monthly') {
      if (!frequencyStart) {
        alertMsg(t('job:selectDayOfMonth'), 'error');
        return;
      }
      setFrequency(`${t('job:monthlyStartDay')} ${frequencyStart.value}`);
    }
  };

  const submitCreateJob = async () => {
    if (rdsCatalogType === NONE_RDS && s3CatalogType === NONE_S3) {
      alertMsg(t('job:selectOnCatalog'), 'error');
      return;
    }
    if (
      (s3CatalogType === SELECT_S3 && selectedS3Items.length === 0) ||
      (rdsCatalogType === SELECT_RDS && selectedRdsItems.length === 0)
    ) {
      alertMsg(t('job:selectOnCatalog'), 'error');
      return;
    }
    setIsLoading(true);
    let tempFrequency =
      frequencyType === 'on_demand_run' ? 'OnDemand' : frequency;

    let utcHourString = '0';
    if (frequencyTimeStart.value != null) {
      const [hour] = frequencyTimeStart.value.split(':');
      const localDate = new Date();
      const localOffset = localDate.getTimezoneOffset() / 60;
      const utcHour = parseInt(hour) - localOffset;

      // Ensure the UTC hour is within the range 0-23
      const utcHourNormalized = (utcHour + 24) % 24;

      // Format the UTC hour as a string
      utcHourString = utcHourNormalized.toString().padStart(2, '0');
    }

    if (frequencyType === 'daily') {
      tempFrequency = `0 ${utcHourString} * * ? *`;
    }
    if (frequencyType === 'weekly') {
      const tempTime =
        frequencyStart?.value === DAY_OPTIONS[0].value
          ? 'L'
          : SUB_WEEK_CONFIG[frequencyStart?.value as any];
      tempFrequency = `0 ${utcHourString} ? * ${tempTime} *`;
    }
    if (frequencyType === 'monthly') {
      const tempTime =
        frequencyStart?.value === MONTH_OPTIONS[0].value
          ? 'L'
          : parseInt(frequencyStart?.value as any) - 1;
      tempFrequency = `0 ${utcHourString} * ${tempTime} ? *`;
    }

    const requestParamJob = {
      name: jobName.trim(),
      template_id: parseInt(selectTemplate.value),
      schedule:
        tempFrequency === 'OnDemand' ? tempFrequency : `cron(${tempFrequency})`,
      description: jobDescription,
      range: parseInt(scanRange?.value || '0'),
      depth: parseInt(scanDepth?.value || '0'),
      detection_threshold: parseFloat(detectionThreshold?.value || '0'),
      all_s3: s3CatalogType === 'allS3' ? 1 : 0,
      all_rds: rdsCatalogType === 'allRds' ? 1 : 0,
      all_ddb: 0,
      all_emr: 0,
      overwrite: parseInt(overwrite?.value || '0'),
      exclude_keywords: exclusiveText.replace(/(\r\n|\r|\n)/g, ','),
      databases: [],
    };
    if (s3CatalogType === SELECT_S3) {
      const s3CatalogList = selectedS3Items.map((item: DbItemInfo) => {
        return {
          account_id: item.account_id,
          region: item.region,
          database_type: 's3',
          database_name: item.database_name,
        };
      });
      requestParamJob.databases =
        requestParamJob.databases.concat(s3CatalogList);
    }
    if (
      rdsCatalogType === SELECT_RDS &&
      rdsSelectedView === 'rds-instance-view'
    ) {
      const rdsCatalogList = selectedRdsItems.map((item: DbItemInfo) => {
        return {
          account_id: item.account_id,
          region: item.region,
          database_type: 'rds',
          database_name: item.database_name,
          table_name: '',
        };
      });
      requestParamJob.databases =
        requestParamJob.databases.concat(rdsCatalogList);
    }
    if (rdsCatalogType === SELECT_RDS && rdsSelectedView === 'rds-table-view') {
      const combined: CombinedRDSDatabase = {};

      selectedRdsItems.forEach((item: DbItemInfo) => {
        if (
          Object.prototype.hasOwnProperty.call(combined, item.database_name)
        ) {
          combined[item.database_name].push(item);
        } else {
          combined[item.database_name] = [item];
        }
      });

      const rdsCatalogList: any = Object.entries(combined).map(
        ([database_name, table_items]) => {
          const table_names = Array.from(
            new Set(table_items.map((item) => item.table_name))
          ).join(',');
          return {
            account_id: table_items[0].account_id,
            region: table_items[0].region,
            database_type: 'rds',
            database_name: database_name,
            table_name: table_names,
          };
        }
      );
      requestParamJob.databases =
        requestParamJob.databases.concat(rdsCatalogList);
    }
    try {
      const result: any = await createJob(requestParamJob);
      if (result && result.id && frequencyType === 'on_demand_run') {
        await startJob(result);
      }
      setIsLoading(true);
      alertMsg(t('submitSuccess'), 'success');
      navigate(RouterEnum.Datajob.path);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const cancelCreateJob = () => {
    navigate(RouterEnum.Datajob.path);
  };

  const deleteS3OldItem = (rowData: any) => {
    const tempList = selectedS3Items.filter(
      (i: { id: any }) => i.id !== rowData.id
    );
    setS3CatalogType(tempList.length === 0 ? NONE_S3 : SELECT_S3);
    setSelectedS3Items(tempList);
    return;
  };

  const deleteRDSOldItem = (rowData: any) => {
    const tempList = selectedRdsItems.filter(
      (i: { id: any }) => i.id !== rowData.id
    );
    setRdsCatalogType(tempList.length === 0 ? NONE_RDS : SELECT_RDS);
    setSelectedRdsItems(tempList);
    return;
  };

  const checkChar = (name: string) => {
    const re = /[^0-9a-zA-Z_.\- |-]/g;
    if (!re?.test(name)) {
      return true;
    }
    return false;
  };

  const jumpToCatalog = (rowData: any) => {
    window.open(
      `${RouterEnum.Catalog.path}?tagType=${rowData.database_type}&catalogId=${rowData.database_name}`,
      '_blank'
    );
  };

  useEffect(() => {
    const getTimezone = () => {
      const offset = new Date().getTimezoneOffset();
      const hours = Math.abs(Math.floor(offset / 60));
      const offsetString = `UTC${offset < 0 ? '+' : '-'}${hours}`;
      setTimezone(offsetString);
    };
    getTimezone();
  }, []);

  return (
    <div>
      <Wizard
        className="job-wizard"
        i18nStrings={{
          stepNumberLabel: (stepNumber) => `${t('step.step')} ${stepNumber}`,
          collapsedStepsLabel: (stepNumber, stepsCount) =>
            `${t('step.step')} ${stepNumber} ${t('step.of')} ${stepsCount}`,
          skipToButtonLabel: (step, stepNumber) =>
            `${t('step.skipTo')} ${step.title}`,
          navigationAriaLabel: t('step.steps') || '',
          cancelButton: t('button.cancel') || '',
          previousButton: t('button.previous') || '',
          nextButton: t('button.next') || '',
          submitButton: t('button.runAJob') || '',
          optional: t('optional') || '',
        }}
        isLoadingNextStep={isLoading}
        onSubmit={submitCreateJob}
        onCancel={cancelCreateJob}
        onNavigate={({ detail }) => {
          const checkResult = checkMustData(detail.requestedStepIndex);
          checkResult && setActiveStepIndex(detail.requestedStepIndex);
        }}
        activeStepIndex={activeStepIndex}
        allowSkipTo
        steps={[
          {
            title: t('job:create.seelctS3DataCatalog'),
            content: (
              <Container
                header={
                  <Header variant="h2">{t('job:create.selectScanS3')}</Header>
                }
              >
                {!hasOldData && (
                  <SpaceBetween direction="vertical" size="l">
                    <Tiles
                      onChange={({ detail }) => setS3CatalogType(detail.value)}
                      value={s3CatalogType}
                      items={[
                        { label: t('job:cataLogOption.all'), value: 'allS3' },
                        {
                          label: t('job:cataLogOption.specify'),
                          value: SELECT_S3,
                        },
                        {
                          label: t('job:cataLogOption.skipScanS3'),
                          value: NONE_S3,
                        },
                      ]}
                    />
                    {s3CatalogType === SELECT_S3 && (
                      <Table
                        className="job-table-width"
                        selectionType="multi"
                        resizableColumns
                        selectedItems={selectedS3Items}
                        onSelectionChange={({ detail }) =>
                          setSelectedS3Items(detail.selectedItems)
                        }
                        variant="embedded"
                        ariaLabels={{
                          selectionGroupLabel: t('table.itemsSelection') || '',
                          allItemsSelectionLabel: ({ selectedItems }) =>
                            `${selectedItems.length} ${
                              selectedItems.length === 1
                                ? t('table.item')
                                : t('table.items')
                            } ${t('table.selected')}`,
                          itemSelectionLabel: ({ selectedItems }, item) => {
                            const isItemSelected = selectedItems.filter(
                              (i) =>
                                (i as any)[S3_CATALOG_COLUMS[0].id] ===
                                (item as any)[S3_CATALOG_COLUMS[0].id]
                            ).length;
                            return `${
                              (item as any)[S3_CATALOG_COLUMS[0].id]
                            } ${t('table.is')} ${
                              isItemSelected ? '' : t('table.not')
                            } ${t('table.selected')}`;
                          },
                        }}
                        items={s3CatalogData}
                        filter={<ResourcesFilter {...s3FilterProps} />}
                        columnDefinitions={S3_CATALOG_COLUMS.map((item) => {
                          return {
                            id: item.id,
                            header: t(item.label),
                            cell: (e: any) => {
                              if (item.id === 'size_key') {
                                return formatSize((e as any)[item.id]);
                              }
                              if (item.id === 'privacy') {
                                if (
                                  (e as any)[item.id] &&
                                  ((e as any)[item.id] === 'N/A' ||
                                    (e as any)[item.id].toString() ===
                                      PRIVARY_TYPE_INT_DATA['N/A'])
                                ) {
                                  return 'N/A';
                                }
                                return (
                                  <CommonBadge
                                    badgeType={BADGE_TYPE.Privacy}
                                    badgeLabel={(e as any)[item.id]}
                                  />
                                );
                              }

                              return e[item.id];
                            },
                          };
                        })}
                        loading={isLoading}
                        pagination={
                          <Pagination
                            currentPageIndex={currentPage}
                            onChange={({ detail }) =>
                              setCurrentPage(detail.currentPageIndex)
                            }
                            pagesCount={Math.ceil(
                              s3Total / preferences.pageSize
                            )}
                            ariaLabels={{
                              nextPageLabel: t('table.nextPage') || '',
                              previousPageLabel: t('table.previousPage') || '',
                              pageLabel: (pageNumber) =>
                                `${t('table.pageLabel', {
                                  pageNumber: pageNumber,
                                })}`,
                            }}
                          />
                        }
                        preferences={
                          <CollectionPreferences
                            onConfirm={({ detail }) => setPreferences(detail)}
                            preferences={preferences}
                            title={t('table.preferences')}
                            confirmLabel={t('table.confirm')}
                            cancelLabel={t('table.cancel')}
                            pageSizePreference={{
                              title: t('table.selectPageSize'),
                              options: [
                                { value: 10, label: t('table.pageSize10') },
                                { value: 20, label: t('table.pageSize20') },
                                { value: 50, label: t('table.pageSize50') },
                                { value: 100, label: t('table.pageSize100') },
                              ],
                            }}
                            visibleContentPreference={{
                              title: t('table.selectVisibleContent'),
                              options: [
                                {
                                  label: t('table.mainDistributionProp'),
                                  options: S3_CATALOG_COLUMS,
                                },
                              ],
                            }}
                          />
                        }
                      />
                    )}
                  </SpaceBetween>
                )}
                {hasOldData && selectedS3Items.length > 0 && (
                  <Table
                    items={selectedS3Items}
                    resizableColumns
                    variant="embedded"
                    columnDefinitions={S3_CATALOG_COLUMS_OLDDATA.map((item) => {
                      return {
                        id: item.id,
                        header: t(item.label),
                        cell: (e: any) => {
                          if (item.id === 'size_key') {
                            return formatSize((e as any)[item.id]);
                          }
                          if (item.id === 'privacy') {
                            if (
                              (e as any)[item.id] &&
                              ((e as any)[item.id] === 'N/A' ||
                                (e as any)[item.id].toString() ===
                                  PRIVARY_TYPE_INT_DATA['N/A'])
                            ) {
                              return 'N/A';
                            }
                            return (
                              <CommonBadge
                                badgeType={BADGE_TYPE.Privacy}
                                badgeLabel={(e as any)[item.id]}
                              />
                            );
                          }
                          if (item.id === 'operate') {
                            return (
                              <span
                                onClick={() => deleteS3OldItem(e as any)}
                                className="clk-remove"
                              >
                                <Icon
                                  name="close"
                                  size="small"
                                  className="small-icon"
                                ></Icon>{' '}
                                {t('button.remove')}
                              </span>
                            );
                          }

                          return e[item.id];
                        },
                      };
                    })}
                    loading={isLoading}
                  />
                )}
                {!isLoading && hasOldData && selectedS3Items.length === 0 && (
                  <span>{t('job:create.skipS3Catalog')}</span>
                )}
              </Container>
            ),
          },
          {
            title: t('job:create.selectCatalogRDS'),
            content: (
              <>
                <Container
                  header={
                    <Header variant="h2">
                      {t('job:create.selectScanRDS')}
                    </Header>
                  }
                >
                  {!hasOldData && (
                    <SpaceBetween direction="vertical" size="l">
                      <Tiles
                        onChange={({ detail }) =>
                          setRdsCatalogType(detail.value)
                        }
                        value={rdsCatalogType}
                        items={[
                          {
                            label: t('job:cataLogOption.all'),
                            value: 'allRds',
                          },
                          {
                            label: t('job:cataLogOption.specify'),
                            value: SELECT_RDS,
                          },
                          {
                            label: t('job:cataLogOption.skipScanRDS'),
                            value: NONE_RDS,
                          },
                        ]}
                      />
                      {rdsCatalogType === SELECT_RDS && (
                        <>
                          <SegmentedControl
                            selectedId={rdsSelectedView}
                            options={[
                              {
                                text: 'Instance view',
                                id: 'rds-instance-view',
                              },
                              { text: 'Table view', id: 'rds-table-view' },
                            ]}
                            onChange={({ detail }) =>
                              setRdsSelectedView(detail.selectedId)
                            }
                          />
                          {rdsSelectedView === 'rds-instance-view' && (
                            <Table
                              className="job-table-width"
                              resizableColumns
                              variant="embedded"
                              selectionType="multi"
                              selectedItems={selectedRdsItems}
                              onSelectionChange={({ detail }) =>
                                setSelectedRdsItems(detail.selectedItems)
                              }
                              ariaLabels={{
                                selectionGroupLabel:
                                  t('table.itemsSelection') || '',
                                allItemsSelectionLabel: ({ selectedItems }) =>
                                  `${selectedItems.length} ${
                                    selectedItems.length === 1
                                      ? t('table.item')
                                      : t('table.items')
                                  } ${t('table.selected')}`,
                                itemSelectionLabel: (
                                  { selectedItems },
                                  item
                                ) => {
                                  const isItemSelected = selectedItems.filter(
                                    (i) =>
                                      (i as any)[S3_CATALOG_COLUMS[0].id] ===
                                      (item as any)[S3_CATALOG_COLUMS[0].id]
                                  ).length;
                                  return `${
                                    (item as any)[S3_CATALOG_COLUMS[0].id]
                                  } ${t('table.is')} ${
                                    isItemSelected ? '' : t('table.not')
                                  } ${t('table.selected')}`;
                                },
                              }}
                              items={rdsCatalogData}
                              filter={<ResourcesFilter {...rdsFilterProps} />}
                              columnDefinitions={RDS_CATALOG_COLUMS.map(
                                (item) => {
                                  return {
                                    id: item.id,
                                    header: t(item.label),
                                    cell: (e: any) => {
                                      if (item.id === 'size_key') {
                                        return formatSize((e as any)[item.id]);
                                      }
                                      if (item.id === 'privacy') {
                                        if (
                                          (e as any)[item.id] &&
                                          ((e as any)[item.id] === 'N/A' ||
                                            (e as any)[item.id].toString() ===
                                              PRIVARY_TYPE_INT_DATA['N/A'])
                                        ) {
                                          return 'N/A';
                                        }
                                        return (
                                          <CommonBadge
                                            badgeType={BADGE_TYPE.Privacy}
                                            badgeLabel={(e as any)[item.id]}
                                          />
                                        );
                                      }
                                      return e[item.id];
                                    },
                                  };
                                }
                              )}
                              loading={isLoading}
                              pagination={
                                <Pagination
                                  currentPageIndex={currentPage}
                                  onChange={({ detail }) =>
                                    setCurrentPage(detail.currentPageIndex)
                                  }
                                  pagesCount={Math.ceil(
                                    rdsTotal / preferences.pageSize
                                  )}
                                  ariaLabels={{
                                    nextPageLabel: t('table.nextPage') || '',
                                    previousPageLabel:
                                      t('table.previousPage') || '',
                                    pageLabel: (pageNumber) =>
                                      `${t('table.pageLabel', {
                                        pageNumber: pageNumber,
                                      })}`,
                                  }}
                                />
                              }
                              preferences={
                                <CollectionPreferences
                                  onConfirm={({ detail }) =>
                                    setPreferences(detail)
                                  }
                                  preferences={preferences}
                                  title={t('table.preferences')}
                                  confirmLabel={t('table.confirm')}
                                  cancelLabel={t('table.cancel')}
                                  pageSizePreference={{
                                    title: t('table.selectPageSize'),
                                    options: [
                                      {
                                        value: 10,
                                        label: t('table.pageSize10'),
                                      },
                                      {
                                        value: 20,
                                        label: t('table.pageSize20'),
                                      },
                                      {
                                        value: 50,
                                        label: t('table.pageSize50'),
                                      },
                                      {
                                        value: 100,
                                        label: t('table.pageSize100'),
                                      },
                                    ],
                                  }}
                                  visibleContentPreference={{
                                    title: t('table.selectVisibleContent'),
                                    options: [
                                      {
                                        label: t('table.mainDistributionProp'),
                                        options: S3_CATALOG_COLUMS,
                                      },
                                    ],
                                  }}
                                />
                              }
                            />
                          )}
                          {rdsSelectedView === 'rds-table-view' && (
                            <Table
                              className="job-table-width"
                              resizableColumns
                              variant="embedded"
                              selectionType="multi"
                              selectedItems={selectedRdsItems}
                              onSelectionChange={({ detail }) =>
                                setSelectedRdsItems(detail.selectedItems)
                              }
                              ariaLabels={{
                                selectionGroupLabel:
                                  t('table.itemsSelection') || '',
                                allItemsSelectionLabel: ({ selectedItems }) =>
                                  `${selectedItems.length} ${
                                    selectedItems.length === 1
                                      ? t('table.item')
                                      : t('table.items')
                                  } ${t('table.selected')}`,
                                itemSelectionLabel: (
                                  { selectedItems },
                                  item
                                ) => {
                                  const isItemSelected = selectedItems.filter(
                                    (i) =>
                                      (i as any)[S3_CATALOG_COLUMS[0].id] ===
                                      (item as any)[S3_CATALOG_COLUMS[0].id]
                                  ).length;
                                  return `${
                                    (item as any)[S3_CATALOG_COLUMS[0].id]
                                  } ${t('table.is')} ${
                                    isItemSelected ? '' : t('table.not')
                                  } ${t('table.selected')}`;
                                },
                              }}
                              items={rdsFolderData}
                              filter={<ResourcesFilter {...rdsFilterProps} />}
                              columnDefinitions={RDS_FOLDER_COLUMS.map(
                                (item) => {
                                  return {
                                    id: item.id,
                                    header: t(item.label),
                                    cell: (e: any) => {
                                      if (item.id === 'size_key') {
                                        return formatSize((e as any)[item.id]);
                                      }
                                      if (item.id === 'privacy') {
                                        if (
                                          (e as any)[item.id] &&
                                          ((e as any)[item.id] === 'N/A' ||
                                            (e as any)[item.id].toString() ===
                                              PRIVARY_TYPE_INT_DATA['N/A'])
                                        ) {
                                          return 'N/A';
                                        }
                                        return (
                                          <CommonBadge
                                            badgeType={BADGE_TYPE.Privacy}
                                            badgeLabel={(e as any)[item.id]}
                                          />
                                        );
                                      }
                                      return e[item.id];
                                    },
                                  };
                                }
                              )}
                              loading={isLoading}
                              pagination={
                                <Pagination
                                  currentPageIndex={currentPage}
                                  onChange={({ detail }) =>
                                    setCurrentPage(detail.currentPageIndex)
                                  }
                                  pagesCount={Math.ceil(
                                    rdsTotal / preferences.pageSize
                                  )}
                                  ariaLabels={{
                                    nextPageLabel: t('table.nextPage') || '',
                                    previousPageLabel:
                                      t('table.previousPage') || '',
                                    pageLabel: (pageNumber) =>
                                      `${t('table.pageLabel', {
                                        pageNumber: pageNumber,
                                      })}`,
                                  }}
                                />
                              }
                              preferences={
                                <CollectionPreferences
                                  onConfirm={({ detail }) =>
                                    setPreferences(detail)
                                  }
                                  preferences={preferences}
                                  title={t('table.preferences')}
                                  confirmLabel={t('table.confirm')}
                                  cancelLabel={t('table.cancel')}
                                  pageSizePreference={{
                                    title: t('table.selectPageSize'),
                                    options: [
                                      {
                                        value: 10,
                                        label: t('table.pageSize10'),
                                      },
                                      {
                                        value: 20,
                                        label: t('table.pageSize20'),
                                      },
                                      {
                                        value: 50,
                                        label: t('table.pageSize50'),
                                      },
                                      {
                                        value: 100,
                                        label: t('table.pageSize100'),
                                      },
                                    ],
                                  }}
                                  visibleContentPreference={{
                                    title: t('table.selectVisibleContent'),
                                    options: [
                                      {
                                        label: t('table.mainDistributionProp'),
                                        options: S3_CATALOG_COLUMS,
                                      },
                                    ],
                                  }}
                                />
                              }
                            />
                          )}
                        </>
                      )}
                    </SpaceBetween>
                  )}
                  {hasOldData && selectedRdsItems.length > 0 && (
                    <Table
                      items={selectedRdsItems}
                      resizableColumns
                      variant="embedded"
                      columnDefinitions={RDS_CATALOG_COLUMS_OLDDATA.map(
                        (item) => {
                          return {
                            id: item.id,
                            header: t(item.label),
                            cell: (e: any) => {
                              if (item.id === 'size_key') {
                                return formatSize((e as any)[item.id]);
                              }
                              if (item.id === 'privacy') {
                                if (
                                  (e as any)[item.id] &&
                                  ((e as any)[item.id] === 'N/A' ||
                                    (e as any)[item.id].toString() ===
                                      PRIVARY_TYPE_INT_DATA['N/A'])
                                ) {
                                  return 'N/A';
                                }
                                return (
                                  <CommonBadge
                                    badgeType={BADGE_TYPE.Privacy}
                                    badgeLabel={(e as any)[item.id]}
                                  />
                                );
                              }
                              if (item.id === 'operate') {
                                return (
                                  <span
                                    onClick={() => deleteRDSOldItem(e as any)}
                                    className="clk-remove"
                                  >
                                    <Icon
                                      name="close"
                                      size="small"
                                      className="small-icon"
                                    ></Icon>{' '}
                                    {t('button.remove')}
                                  </span>
                                );
                              }
                              return e[item.id];
                            },
                          };
                        }
                      )}
                      loading={isLoading}
                    />
                  )}
                  {!isLoading &&
                    hasOldData &&
                    selectedRdsItems.length === 0 && (
                      <span>{t('job:create.skipRDSCatalog')}</span>
                    )}
                </Container>
              </>
            ),
          },
          {
            title: t('job:create.jobSettings'),
            content: (
              <div>
                <SpaceBetween direction="vertical" size="l">
                  <Container
                    header={
                      <Header variant="h2">
                        {t('job:create.jobBasicInfo')}
                      </Header>
                    }
                  >
                    <SpaceBetween direction="vertical" size="l">
                      <FormField
                        label={t('job:create.name')}
                        description={t('job:create.nameDesc')}
                      >
                        <Input
                          value={jobName}
                          onChange={({ detail }) =>
                            detail.value.length <= 60 &&
                            checkChar(detail.value) &&
                            setJobName(detail.value)
                          }
                          placeholder={t('job:create.jobNamePlaceholder') || ''}
                        />
                      </FormField>
                      <FormField label={t('job:create.desc')}>
                        <Input
                          value={jobDescription}
                          onChange={({ detail }) =>
                            detail.value.length <= 60 &&
                            setJobDescriptio(detail.value)
                          }
                          placeholder={t('job:create.descPlaceholder') || ''}
                        />
                      </FormField>
                    </SpaceBetween>
                  </Container>
                  <Container
                    header={
                      <Header variant="h2">
                        {t('job:create.dataClassfiyTmpl')}
                      </Header>
                    }
                  >
                    <FormField
                      label={t('job:create.dataClassfiyTmpl')}
                      info={
                        <Popover
                          dismissButton={false}
                          position="right"
                          size="large"
                          content={
                            <StatusIndicator type="info">
                              {t('job:create.dataClassfiyTmplPop1')}
                              <p>{t('job:create.dataClassfiyTmplPop2')}</p>
                              <p>{t('job:create.dataClassfiyTmplPop3')}</p>
                            </StatusIndicator>
                          }
                        >
                          <b className="title-info">{t('info')}</b>
                        </Popover>
                      }
                    >
                      <Select
                        selectedOption={selectTemplate}
                        onChange={(select) => {
                          setSelectTemplate(select.detail.selectedOption);
                        }}
                        triggerVariant="option"
                        options={[DEFAULT_TEMPLATE]}
                        placeholder={
                          t('job:create.classifyTmplForPrivacy') || ''
                        }
                      ></Select>
                    </FormField>
                  </Container>

                  <Container
                    header={
                      <Header variant="h2">
                        {t('job:create.jobSettings')}
                      </Header>
                    }
                  >
                    <SpaceBetween direction="vertical" size="l">
                      <FormField label={t('job:create.scanFreq')}>
                        <Select
                          triggerVariant="option"
                          selectedAriaLabel={t('selected') || ''}
                          onChange={({ detail }) => {
                            setFrequencyType(
                              detail.selectedOption.value as any
                            );
                            setScanFrequency(detail.selectedOption);
                            if (
                              detail.selectedOption.value === 'on_demand_run'
                            ) {
                              clkFrequencyApply(detail.selectedOption.value);
                            }
                          }}
                          options={SCAN_FREQUENCY}
                          selectedOption={scanFrequency}
                        ></Select>
                      </FormField>
                      <div>
                        {frequencyType === 'daily' && (
                          <FormField
                            label={
                              t('job:create.startHourOfDay') +
                              ' (' +
                              timezone +
                              ')'
                            }
                          >
                            <Select
                              selectedOption={frequencyTimeStart}
                              triggerVariant="option"
                              selectedAriaLabel={t('selected') || ''}
                              options={HOUR_OPTIONS}
                              onChange={(select) => {
                                setFrequencyTimeStart(
                                  select.detail.selectedOption
                                );
                              }}
                              onBlur={clkFrequencyApply}
                            ></Select>
                          </FormField>
                        )}
                        {frequencyType === 'weekly' && (
                          <FormField label={t('job:create.startDayOfWeek')}>
                            <Select
                              selectedOption={frequencyStart}
                              triggerVariant="option"
                              options={DAY_OPTIONS}
                              selectedAriaLabel={t('selected') || ''}
                              onChange={(select) => {
                                setFrequencyStart(select.detail.selectedOption);
                              }}
                              onBlur={clkFrequencyApply}
                            ></Select>
                            <p />
                          </FormField>
                        )}
                        {frequencyType === 'weekly' && (
                          <FormField
                            label={
                              t('job:create.startHourOfDay') +
                              ' (' +
                              timezone +
                              ')'
                            }
                          >
                            <Select
                              selectedOption={frequencyTimeStart}
                              triggerVariant="option"
                              selectedAriaLabel={t('selected') || ''}
                              options={HOUR_OPTIONS}
                              onChange={(select) => {
                                setFrequencyTimeStart(
                                  select.detail.selectedOption
                                );
                              }}
                              onBlur={clkFrequencyApply}
                            ></Select>
                          </FormField>
                        )}
                        {frequencyType === 'monthly' && (
                          <FormField
                            label={t('job:create.startDayOfMonth')}
                            description={t('job:create.startDayOfMonthDesc')}
                          >
                            <Select
                              selectedOption={frequencyStart}
                              triggerVariant="option"
                              options={MONTH_OPTIONS}
                              selectedAriaLabel={t('selected') || ''}
                              onChange={(select) => {
                                setFrequencyStart(select.detail.selectedOption);
                              }}
                              onBlur={clkFrequencyApply}
                            ></Select>
                            <p />
                          </FormField>
                        )}
                        {frequencyType === 'monthly' && (
                          <FormField
                            label={
                              t('job:create.startHourOfDay') +
                              ' (' +
                              timezone +
                              ')'
                            }
                          >
                            <Select
                              selectedOption={frequencyTimeStart}
                              triggerVariant="option"
                              selectedAriaLabel={t('selected') || ''}
                              options={HOUR_OPTIONS}
                              onChange={(select) => {
                                setFrequencyTimeStart(
                                  select.detail.selectedOption
                                );
                              }}
                              onBlur={clkFrequencyApply}
                            ></Select>
                          </FormField>
                        )}
                      </div>

                      <FormField
                        label={t('job:create.scanDepth')}
                        info={
                          <Popover
                            dismissButton={false}
                            position="right"
                            size="large"
                            content={
                              <StatusIndicator type="info">
                                {t('job:create.scanDepthPop1')}
                                <p>{t('job:create.scanDepthPop2')}</p>
                              </StatusIndicator>
                            }
                          >
                            <b className="title-info">{t('info')}</b>
                          </Popover>
                        }
                      >
                        <Select
                          selectedOption={scanDepth}
                          onChange={(select) => {
                            setScanDepth(select.detail.selectedOption);
                          }}
                          triggerVariant="option"
                          options={SCAN_DEPTH_OPTIONS}
                          selectedAriaLabel={t('selected') || ''}
                          placeholder={
                            t('job:create.scanDepthPlaceholder') || ''
                          }
                        ></Select>
                      </FormField>
                      <FormField
                        label={t('job:create.scanRange')}
                        info={
                          <Popover
                            dismissButton={false}
                            position="right"
                            size="large"
                            content={
                              <StatusIndicator type="info">
                                {t('job:create.scanRangePop1')}
                                <p>{t('job:create.scanRangePop2')}</p>
                              </StatusIndicator>
                            }
                          >
                            <b className="title-info">{t('info')}</b>
                          </Popover>
                        }
                      >
                        <Select
                          selectedOption={scanRange}
                          onChange={(select) => {
                            setScanRange(select.detail.selectedOption);
                          }}
                          triggerVariant="option"
                          options={SCAN_RANGE_OPTIONS}
                          selectedAriaLabel={t('selected') || ''}
                          placeholder={
                            t('job:create.scanRangePlaceholder') || ''
                          }
                        ></Select>
                      </FormField>
                      <FormField
                        label={t('job:create.detectionThreshold')}
                        info={
                          <Popover
                            dismissButton={false}
                            position="right"
                            size="large"
                            content={
                              <StatusIndicator type="info">
                                {t('job:create.detectionThresholdPop1')}
                                <p>{t('job:create.detectionThresholdPop2')}</p>
                              </StatusIndicator>
                            }
                          >
                            <b className="title-info">{t('info')}</b>
                          </Popover>
                        }
                      >
                        <Select
                          selectedOption={detectionThreshold}
                          onChange={(select) => {
                            setDetectionThreshold(select.detail.selectedOption);
                          }}
                          triggerVariant="option"
                          options={DETECTION_THRESHOLD_OPTIONS}
                          selectedAriaLabel={t('selected') || ''}
                          placeholder={
                            t('job:create.detectionThresholdPlaceholder') || ''
                          }
                        ></Select>
                      </FormField>
                      <FormField label={t('job:create.override')}>
                        <Select
                          selectedOption={overwrite}
                          onChange={(select) => {
                            setOverwrite(select.detail.selectedOption);
                          }}
                          triggerVariant="option"
                          options={OVERRIDE_OPTIONS}
                          selectedAriaLabel={t('selected') || ''}
                        ></Select>
                      </FormField>
                    </SpaceBetween>
                  </Container>
                  <Container
                    header={
                      <Header
                        variant="h2"
                        description={t('job:create.exclusiveRulesDesc')}
                      >
                        {t('job:create.exclusiveRules')}
                      </Header>
                    }
                  >
                    <Toggle
                      onChange={({ detail }) =>
                        setExclusiveToggle(detail.checked)
                      }
                      checked={exclusiveToggle}
                    >
                      <b>{t('job:create.exclusiveRulesToggle')}</b>
                    </Toggle>
                    {exclusiveToggle && (
                      <>
                        <Textarea
                          value={exclusiveText}
                          onChange={({ detail }) => {
                            setExclusiveText(detail.value);
                          }}
                          placeholder=""
                          rows={6}
                        />
                      </>
                    )}
                  </Container>
                </SpaceBetween>
              </div>
            ),
          },
          {
            title: t('job:create.jobPreview'),
            content: (
              <Container
                header={
                  <Header variant="h2">{t('job:create.jobPreview')}</Header>
                }
              >
                <SpaceBetween direction="vertical" size="l">
                  <FormField label={t('job:create.targetDataCatalogs')}>
                    <span className="sources-title">
                      {t('job:create.s3Bucket')} ({S3_OPTION[s3CatalogType]}) :
                    </span>
                    {s3CatalogType === SELECT_S3 && (
                      <ul>
                        {selectedS3Items.map(
                          (
                            item: {
                              database_name:
                                | string
                                | number
                                | boolean
                                | React.ReactElement<
                                    any,
                                    string | React.JSXElementConstructor<any>
                                  >
                                | React.ReactFragment
                                | React.ReactPortal
                                | null
                                | undefined;
                            },
                            index: string | number
                          ) => {
                            return (
                              <li
                                className="job-name"
                                key={SELECT_S3 + index}
                                onClick={() => jumpToCatalog(item)}
                              >
                                {item.database_name}
                              </li>
                            );
                          }
                        )}
                      </ul>
                    )}
                    <br></br>
                    {rdsSelectedView === 'rds-instance-view' && (
                      <>
                        <span className="sources-title">
                          {t('job:create.rdsInstance')} (
                          {RDS_OPTION[rdsCatalogType]}) :
                        </span>
                        {rdsCatalogType === SELECT_RDS &&
                          selectedRdsItems.map(
                            (
                              item: {
                                database_name:
                                  | string
                                  | number
                                  | boolean
                                  | React.ReactElement<
                                      any,
                                      string | React.JSXElementConstructor<any>
                                    >
                                  | React.ReactFragment
                                  | React.ReactPortal
                                  | null
                                  | undefined;
                              },
                              index: string
                            ) => {
                              return (
                                <li
                                  className="sources-title-detail"
                                  key={SELECT_RDS + index}
                                >
                                  {item.database_name}
                                </li>
                              );
                            }
                          )}
                      </>
                    )}
                    {rdsSelectedView === 'rds-table-view' && (
                      <>
                        <span className="sources-title">
                          {t('job:create.rdsTable')} (
                          {RDS_OPTION[rdsCatalogType]}) :
                        </span>
                        {rdsCatalogType === SELECT_RDS &&
                          selectedRdsItems.map(
                            (
                              item: {
                                table_name:
                                  | string
                                  | number
                                  | boolean
                                  | React.ReactElement<
                                      any,
                                      string | React.JSXElementConstructor<any>
                                    >
                                  | React.ReactFragment
                                  | React.ReactPortal
                                  | null
                                  | undefined;
                              },
                              index: string
                            ) => {
                              return (
                                <li
                                  className="sources-title-detail"
                                  key={SELECT_RDS + index}
                                >
                                  {item.table_name}
                                </li>
                              );
                            }
                          )}
                      </>
                    )}
                  </FormField>
                  <FormField label={t('job:create.name')}>
                    <span>{jobName}</span>
                  </FormField>
                  <FormField label={t('job:create.desc')}>
                    <span>{jobDescription}</span>
                  </FormField>
                  <FormField label={t('job:create.dataClassfiyTmpl')}>
                    <span>{selectTemplate ? selectTemplate.label : ''}</span>
                  </FormField>
                  <FormField label={t('job:create.scanFreq')}>
                    <span>
                      {frequencyType.toUpperCase()}{' '}
                      {frequencyStart && (
                        <>
                          - Start hours/day:
                          {frequencyStart?.value}
                        </>
                      )}
                    </span>
                  </FormField>
                  <FormField label={t('job:create.scanDepth')}>
                    <span>{scanDepth ? scanDepth.label : ''}</span>
                  </FormField>
                  <FormField label={t('job:create.scanRange')}>
                    <span>{scanRange ? scanRange.label : ''}</span>
                  </FormField>
                  <FormField label={t('job:create.detectionThreshold')}>
                    <span>
                      {detectionThreshold ? detectionThreshold.label : ''}
                    </span>
                  </FormField>
                  <FormField label={t('job:create.override')}>
                    <span>{overwrite ? overwrite.label : ''}</span>
                  </FormField>
                  <FormField label={t('job:create.exclusives')}>
                    <span>
                      <pre>{exclusiveText ? exclusiveText : ''}</pre>
                    </span>
                  </FormField>
                </SpaceBetween>
              </Container>
            ),
          },
        ]}
      />
    </div>
  );
};

const CreateJob: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.runJobs'),
      href: RouterEnum.CreateJob.path,
    },
  ];
  return (
    <AppLayout
      toolsHide
      contentHeader={<CreateJobHeader />}
      content={<CreateJobContent />}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.CreateJob.path} />}
      navigationWidth={290}
    />
  );
};

export default CreateJob;
