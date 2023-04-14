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
} from '@cloudscape-design/components';
import { useLocation, useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import {
  COLUMN_OBJECT_STR,
  DETECTION_THRESHOLD_OPTIONS,
  DbItemInfo,
  FREQUENCY_TYPE,
  OVERRIDE_OPTIONS,
  RDS_CATALOG_COLUMS,
  RDS_CATALOG_COLUMS_OLDDATA,
  S3_CATALOG_COLUMS,
  S3_CATALOG_COLUMS_OLDDATA,
  SCAN_DEPTH_OPTIONS,
  SCAN_RANGE_OPTIONS,
} from './types/create_data_type';
import { getDataBaseByType } from 'apis/data-catalog/api';
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
  return (
    <Header
      variant="h1"
      description=""
      actions={
        <Button onClick={() => navigate(RouterEnum.Datajob.path)}>
          Back to job list
        </Button>
      }
    >
      Create sensitive data discovery job
    </Header>
  );
};

const CreateJobContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { oldData } = location.state || {};
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [s3CatalogType, setS3CatalogType] = useState('');
  const [rdsCatalogType, setRdsCatalogType] = useState('');
  const [s3CatalogData, setS3CatalogData] = useState([] as any);
  const [rdsCatalogData, setRdsCatalogData] = useState([] as any);
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
  const hasOldData = oldData && Object.keys(oldData).length > 0;

  const s3FilterProps = {
    totalCount: s3Total,
    query: s3Query,
    setQuery: setS3Query,
    columnList: S3_CATALOG_COLUMS.filter((i) => i.filter),
    tableName: TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION,
    filteringPlaceholder: 'Filter buskets',
  };

  const rdsFilterProps = {
    totalCount: rdsTotal,
    query: rdsQuery,
    setQuery: setRdsQuery,
    columnList: RDS_CATALOG_COLUMS.filter((i) => i.filter),
    tableName: TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION,
    filteringPlaceholder: 'Filter instances',
  };

  useEffect(() => {
    if (s3CatalogType === SELECT_S3 && activeStepIndex === 0 && !hasOldData) {
      getS3CatalogData();
    }
    if (rdsCatalogType === SELECT_RDS && activeStepIndex === 1 && !hasOldData) {
      getRdsCatalogData();
    }
  }, [
    rdsCatalogType,
    rdsQuery,
    s3CatalogType,
    s3Query,
    currentPage,
    preferences.pageSize,
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
  }, [frequencyType]);

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
      alertMsg('Please select one item!', 'error');
      return false;
    }
    if (
      rdsCatalogType === SELECT_RDS &&
      selectedRdsItems.length === 0 &&
      requestedStepIndex !== 1
    ) {
      alertMsg('Please select one item!', 'error');
      return false;
    }
    if (
      rdsCatalogType === NONE_RDS &&
      s3CatalogType === NONE_S3 &&
      requestedStepIndex >= 2
    ) {
      alertMsg('You must selected one catalog at least!', 'error');
      return false;
    }
    if (requestedStepIndex !== 0 && !s3CatalogType) {
      alertMsg('Please select one item!', 'error');
      return false;
    }
    if (
      requestedStepIndex !== 1 &&
      requestedStepIndex !== 0 &&
      !rdsCatalogType
    ) {
      alertMsg('Please select one item!', 'error');
      return false;
    }
    if (requestedStepIndex === 3) {
      if (!jobName) {
        alertMsg('Please input job name', 'error');
        return false;
      }
      const trimFrequency: any = frequency ? frequency.trim() : frequency;
      if (!trimFrequency) {
        alertMsg('Frequency type error', 'error');
        return false;
      }

      if (!scanDepth) {
        alertMsg('Please select scan depth', 'error');
        return false;
      }
      if (!scanRange) {
        alertMsg('Please select scan range', 'error');
        return false;
      }
      if (!detectionThreshold) {
        alertMsg('Please select detection threshold', 'error');
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
        alertMsg('Please select hour of day', 'error');
        return;
      }
      setFrequency(`Daily, start time: ${frequencyStart.value}`);
    }
    if (tempType === 'weekly') {
      if (!frequencyStart) {
        alertMsg('Please select day of week', 'error');
        return;
      }
      setFrequency(`Weekly, start day: ${frequencyStart.value}`);
    }
    if (tempType === 'monthly') {
      if (!frequencyStart) {
        alertMsg('Please select day of month', 'error');
        return;
      }
      setFrequency(`Monthly, start day: ${frequencyStart.value}`);
    }
  };

  const submitCreateJob = async () => {
    if (rdsCatalogType === NONE_RDS && s3CatalogType === NONE_S3) {
      alertMsg('You must selected one catalog at least!', 'error');
      return;
    }
    if (
      (s3CatalogType === SELECT_S3 && selectedS3Items.length === 0) ||
      (rdsCatalogType === SELECT_RDS && selectedRdsItems.length === 0)
    ) {
      alertMsg('You must selected one catalog at least!', 'error');
      return;
    }
    setIsLoading(true);
    let tempFrequency =
      frequencyType === 'on_demand_run' ? 'OnDemand' : frequency;

    if (frequencyType === 'daily') {
      const tempTime = parseInt(frequencyStart?.value as any);
      tempFrequency = `0 ${
        tempTime >= 8 ? tempTime - 8 : tempTime + 16
      } * * ? *`;
    }
    if (frequencyType === 'weekly') {
      const tempTime =
        frequencyStart?.value === DAY_OPTIONS[0].value
          ? 'L'
          : SUB_WEEK_CONFIG[frequencyStart?.value as any];
      tempFrequency = `0 16 ? * ${tempTime} *`;
    }
    if (frequencyType === 'monthly') {
      const tempTime =
        frequencyStart?.value === MONTH_OPTIONS[0].value
          ? 'L'
          : parseInt(frequencyStart?.value as any) - 1;
      tempFrequency = `0 16 * ${tempTime} ? *`;
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
    if (rdsCatalogType === SELECT_RDS) {
      const rdsCatalogList = selectedRdsItems.map((item: DbItemInfo) => {
        return {
          account_id: item.account_id,
          region: item.region,
          database_type: 'rds',
          database_name: item.database_name,
        };
      });
      requestParamJob.databases =
        requestParamJob.databases.concat(rdsCatalogList);
    }
    try {
      const result: any = await createJob(requestParamJob);
      if (result && result.id && frequencyType === 'on_demand_run') {
        await startJob(result);
      }
      setIsLoading(true);
      alertMsg('Submit success', 'success');
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
    const re = /[^0-9a-zA-Z,\- |-]/g;
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

  return (
    <div>
      <Wizard
        className="job-wizard"
        i18nStrings={{
          stepNumberLabel: (stepNumber) => `Step ${stepNumber}`,
          collapsedStepsLabel: (stepNumber, stepsCount) =>
            `Step ${stepNumber} of ${stepsCount}`,
          skipToButtonLabel: (step, stepNumber) => `Skip to ${step.title}`,
          navigationAriaLabel: 'Steps',
          cancelButton: 'Cancel',
          previousButton: 'Previous',
          nextButton: 'Next',
          submitButton: 'Run job',
          optional: 'optional',
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
            title: 'Select data catalogs (S3)',
            content: (
              <Container
                header={
                  <Header variant="h2">Select scan target for Amazon S3</Header>
                }
              >
                {!hasOldData && (
                  <SpaceBetween direction="vertical" size="l">
                    <Tiles
                      onChange={({ detail }) => setS3CatalogType(detail.value)}
                      value={s3CatalogType}
                      items={[
                        { label: 'All data catalogs', value: 'allS3' },
                        { label: 'Specific data catalogs', value: SELECT_S3 },
                        { label: 'Skip scan Amazon S3', value: NONE_S3 },
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
                          selectionGroupLabel: 'Items selection',
                          allItemsSelectionLabel: ({ selectedItems }) =>
                            `${selectedItems.length} ${
                              selectedItems.length === 1 ? 'item' : 'items'
                            } selected`,
                          itemSelectionLabel: ({ selectedItems }, item) => {
                            const isItemSelected = selectedItems.filter(
                              (i) =>
                                (i as any)[S3_CATALOG_COLUMS[0].id] ===
                                (item as any)[S3_CATALOG_COLUMS[0].id]
                            ).length;
                            return `${
                              (item as any)[S3_CATALOG_COLUMS[0].id]
                            } is ${isItemSelected ? '' : 'not'} selected`;
                          },
                        }}
                        items={s3CatalogData}
                        filter={<ResourcesFilter {...s3FilterProps} />}
                        columnDefinitions={S3_CATALOG_COLUMS.map((item) => {
                          return {
                            id: item.id,
                            header: item.label,
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
                              nextPageLabel: 'Next page',
                              previousPageLabel: 'Previous page',
                              pageLabel: (pageNumber) =>
                                `Page ${pageNumber} of all pages`,
                            }}
                          />
                        }
                        preferences={
                          <CollectionPreferences
                            onConfirm={({ detail }) => setPreferences(detail)}
                            preferences={preferences}
                            title="Preferences"
                            confirmLabel="Confirm"
                            cancelLabel="Cancel"
                            pageSizePreference={{
                              title: 'Select page size',
                              options: [
                                { value: 10, label: '10 resources' },
                                { value: 20, label: '20 resources' },
                                { value: 50, label: '50 resources' },
                                { value: 100, label: '100 resources' },
                              ],
                            }}
                            visibleContentPreference={{
                              title: 'Select visible content',
                              options: [
                                {
                                  label: 'Main distribution properties',
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
                        header: item.label,
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
                                Remove
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
                  <span>Skip S3 catalog</span>
                )}
              </Container>
            ),
          },
          {
            title: 'Select data catalogs (RDS)',
            content: (
              <>
                <Container
                  header={
                    <Header variant="h2">
                      Select scan target for Amazon RDS
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
                          { label: 'All data catalogs', value: 'allRds' },
                          {
                            label: 'Specific data catalogs',
                            value: SELECT_RDS,
                          },
                          {
                            label: 'Skip scan for Amazon RDS',
                            value: NONE_RDS,
                          },
                        ]}
                      />
                      {rdsCatalogType === SELECT_RDS && (
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
                            selectionGroupLabel: 'Items selection',
                            allItemsSelectionLabel: ({ selectedItems }) =>
                              `${selectedItems.length} ${
                                selectedItems.length === 1 ? 'item' : 'items'
                              } selected`,
                            itemSelectionLabel: ({ selectedItems }, item) => {
                              const isItemSelected = selectedItems.filter(
                                (i) =>
                                  (i as any)[S3_CATALOG_COLUMS[0].id] ===
                                  (item as any)[S3_CATALOG_COLUMS[0].id]
                              ).length;
                              return `${
                                (item as any)[S3_CATALOG_COLUMS[0].id]
                              } is ${isItemSelected ? '' : 'not'} selected`;
                            },
                          }}
                          items={rdsCatalogData}
                          filter={<ResourcesFilter {...rdsFilterProps} />}
                          columnDefinitions={RDS_CATALOG_COLUMS.map((item) => {
                            return {
                              id: item.id,
                              header: item.label,
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
                                rdsTotal / preferences.pageSize
                              )}
                              ariaLabels={{
                                nextPageLabel: 'Next page',
                                previousPageLabel: 'Previous page',
                                pageLabel: (pageNumber) =>
                                  `Page ${pageNumber} of all pages`,
                              }}
                            />
                          }
                          preferences={
                            <CollectionPreferences
                              onConfirm={({ detail }) => setPreferences(detail)}
                              preferences={preferences}
                              title="Preferences"
                              confirmLabel="Confirm"
                              cancelLabel="Cancel"
                              pageSizePreference={{
                                title: 'Select page size',
                                options: [
                                  { value: 10, label: '10 resources' },
                                  { value: 20, label: '20 resources' },
                                  { value: 50, label: '50 resources' },
                                  { value: 100, label: '100 resources' },
                                ],
                              }}
                              visibleContentPreference={{
                                title: 'Select visible content',
                                options: [
                                  {
                                    label: 'Main distribution properties',
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
                  {hasOldData && selectedRdsItems.length > 0 && (
                    <Table
                      items={selectedRdsItems}
                      resizableColumns
                      variant="embedded"
                      columnDefinitions={RDS_CATALOG_COLUMS_OLDDATA.map(
                        (item) => {
                          return {
                            id: item.id,
                            header: item.label,
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
                                    Remove
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
                      <span>Skip RDS catalog</span>
                    )}
                </Container>
              </>
            ),
          },
          {
            title: 'Job settings',
            content: (
              <div>
                <SpaceBetween direction="vertical" size="l">
                  <Container
                    header={<Header variant="h2">Job basic information</Header>}
                  >
                    <SpaceBetween direction="vertical" size="l">
                      <FormField
                        label="Name"
                        description="The name can be up to 60 characters long. Valid characters are a-z, A-Z, 0-9, _ / ' '"
                      >
                        <Input
                          value={jobName}
                          onChange={({ detail }) =>
                            detail.value.length <= 60 &&
                            checkChar(detail.value) &&
                            setJobName(detail.value)
                          }
                          placeholder="Job name"
                        />
                      </FormField>
                      <FormField label="Description - Optional">
                        <Input
                          value={jobDescription}
                          onChange={({ detail }) =>
                            detail.value.length <= 60 &&
                            setJobDescriptio(detail.value)
                          }
                          placeholder="Description"
                        />
                      </FormField>
                    </SpaceBetween>
                  </Container>
                  <Container
                    header={
                      <Header variant="h2">Data classification template</Header>
                    }
                  >
                    <FormField
                      label="Data classification template"
                      info={
                        <Popover
                          dismissButton={false}
                          position="right"
                          size="large"
                          content={
                            <StatusIndicator type="info">
                              Define data classification template used in this
                              job. The job will use the data identifiers (rules)
                              in the template to detect sensitive data.
                              <p>
                                If a data matches the rule, then it will be
                                labeled as sensitive (e.g. Contains PII).{' '}
                              </p>
                              <p>
                                The job will apply the latest template at the
                                moment of each job run. For example, if you have
                                a monthly job scheduled on 1st day of the month,
                                you change the template during the month, when
                                the job on the 1st of the next month, it will
                                apply the updated template.
                              </p>
                            </StatusIndicator>
                          }
                        >
                          <b className="titel-info">Info</b>
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
                        selectedAriaLabel="Selected"
                        placeholder="Classification template for privacy"
                      ></Select>
                    </FormField>
                  </Container>

                  <Container
                    header={<Header variant="h2">Job settings</Header>}
                  >
                    <SpaceBetween direction="vertical" size="l">
                      <FormField label="Scan frequency">
                        <Select
                          triggerVariant="option"
                          selectedAriaLabel="Selected"
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
                          <FormField label="Start hour of day">
                            <Select
                              selectedOption={frequencyStart}
                              triggerVariant="option"
                              options={HOUR_OPTIONS}
                              selectedAriaLabel="Selected"
                              onChange={(select) => {
                                setFrequencyStart(select.detail.selectedOption);
                              }}
                              onBlur={clkFrequencyApply}
                            ></Select>
                          </FormField>
                        )}
                        {frequencyType === 'weekly' && (
                          <FormField label="Start day of week">
                            <Select
                              selectedOption={frequencyStart}
                              triggerVariant="option"
                              options={DAY_OPTIONS}
                              selectedAriaLabel="Selected"
                              onChange={(select) => {
                                setFrequencyStart(select.detail.selectedOption);
                              }}
                              onBlur={clkFrequencyApply}
                            ></Select>
                          </FormField>
                        )}
                        {frequencyType === 'monthly' && (
                          <FormField
                            label="Start day of month"
                            description="If a month has fewer than 30 days, this platform won’t run the job that month. ‘
            To run the job every month, choose a value that’s less than 29."
                          >
                            <Select
                              selectedOption={frequencyStart}
                              triggerVariant="option"
                              options={MONTH_OPTIONS}
                              selectedAriaLabel="Selected"
                              onChange={(select) => {
                                setFrequencyStart(select.detail.selectedOption);
                              }}
                              onBlur={clkFrequencyApply}
                            ></Select>
                          </FormField>
                        )}
                      </div>

                      <FormField
                        label="Scan depth"
                        info={
                          <Popover
                            dismissButton={false}
                            position="right"
                            size="large"
                            content={
                              <StatusIndicator type="info">
                                The sample rate for data scanning.
                                <p>
                                  1000 means 1000 rows, for instance, a RDS
                                  table may contains 10000 rows, select 1000
                                  means, the job will randomly pick 1000 rows
                                  and examine these data with data identifiers.
                                </p>
                              </StatusIndicator>
                            }
                          >
                            <b className="titel-info">Info</b>
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
                          selectedAriaLabel="Selected"
                          placeholder="Sample 1000 entries (recommended)"
                        ></Select>
                      </FormField>
                      <FormField
                        label="Scan range"
                        info={
                          <Popover
                            dismissButton={false}
                            position="right"
                            size="large"
                            content={
                              <StatusIndicator type="info">
                                The sample rate for data scanning.
                                <p>
                                  Full scan: Scan all selected data catalogs.
                                  Incremental scan: Incremental scan means the
                                  job will only crawl databases or S3 folders
                                  that has schema added/changed since the last
                                  run.
                                </p>
                              </StatusIndicator>
                            }
                          >
                            <b className="titel-info">Info</b>
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
                          selectedAriaLabel="Selected"
                          placeholder="Incremental (recommended)"
                        ></Select>
                      </FormField>
                      <FormField
                        label="Detection threshold"
                        info={
                          <Popover
                            dismissButton={false}
                            position="right"
                            size="large"
                            content={
                              <StatusIndicator type="info">
                                The detection threshold defines the sensitivity.
                                <p>
                                  If scan depth is 1000 (rows), 10% threshold
                                  means, if over 100 rows (in 1000) matches the
                                  identifier rule, then the column will be
                                  labeled as sensitive. A lower threshold
                                  percentage, means the job is more restrict
                                  about data sensitivity.
                                </p>
                              </StatusIndicator>
                            }
                          >
                            <b className="titel-info">Info</b>
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
                          selectedAriaLabel="Selected"
                          placeholder="10% (recommended)"
                        ></Select>
                      </FormField>
                      <FormField label="Overwrite">
                        <Select
                          selectedOption={overwrite}
                          onChange={(select) => {
                            setOverwrite(select.detail.selectedOption);
                          }}
                          triggerVariant="option"
                          options={[
                            { label: 'Yes', value: '1' },
                            { label: 'No', value: '0' },
                          ]}
                          selectedAriaLabel="Selected"
                        ></Select>
                      </FormField>
                    </SpaceBetween>
                  </Container>
                </SpaceBetween>
              </div>
            ),
          },
          {
            title: 'Job preview',
            content: (
              <Container header={<Header variant="h2">Job preview</Header>}>
                <SpaceBetween direction="vertical" size="l">
                  <FormField label="Target data catalogs">
                    <span className="sources-title">
                      S3 bucket: {S3_OPTION[s3CatalogType]}
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
                    <span className="sources-title">
                      RDS instance: {RDS_OPTION[rdsCatalogType]}
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
                            <span
                              className="sources-title-detail"
                              key={SELECT_RDS + index}
                            >
                              {item.database_name}
                            </span>
                          );
                        }
                      )}
                  </FormField>
                  <FormField label="Job name">
                    <span>{jobName}</span>
                  </FormField>
                  <FormField label="Description">
                    <span>{jobDescription}</span>
                  </FormField>
                  <FormField label="Data classification template">
                    <span>{selectTemplate ? selectTemplate.label : ''}</span>
                  </FormField>
                  <FormField label="Scan frequency">
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
                  <FormField label="Scan depth">
                    <span>{scanDepth ? scanDepth.label : ''}</span>
                  </FormField>
                  <FormField label="Scan range">
                    <span>{scanRange ? scanRange.label : ''}</span>
                  </FormField>
                  <FormField label="Detection threshold">
                    <span>
                      {detectionThreshold ? detectionThreshold.label : ''}
                    </span>
                  </FormField>
                  <FormField label="Overwrite">
                    <span>{overwrite ? overwrite.label : ''}</span>
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
  const breadcrumbItems = [
    { text: 'Sensitive Data Protection Solution', href: RouterEnum.Home.path },
    {
      text: 'Run sensitive data discovery jobs',
      href: RouterEnum.CreateJob.path,
    },
  ];
  return (
    <AppLayout
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
