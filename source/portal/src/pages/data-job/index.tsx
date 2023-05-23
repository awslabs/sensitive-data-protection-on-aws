import {
  AppLayout,
  Box,
  Button,
  CollectionPreferences,
  ContentLayout,
  Header,
  Pagination,
  Select,
  SpaceBetween,
  Table,
} from '@cloudscape-design/components';
import React, { useEffect, useRef, useState } from 'react';
import { JOB_LIST_COLUMN_LIST } from './types/job_list_type';
import ResourcesFilter from 'pages/resources-filter';
import moment from 'moment';
import { alertMsg, getCronData } from 'tools/tools';
import { OptionDefinition } from '@cloudscape-design/components/internal/components/option/interfaces';
import { useNavigate } from 'react-router-dom';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  CLSAAIFIED_TYPE,
} from 'pages/common-badge/types/badge_type';
import {
  getDiscoveryJobs,
  stopJob,
  disableJob,
  startJob,
  enableJob,
} from 'apis/data-job/api';
import './style.scss';
import { RouterEnum } from 'routers/routerEnum';
import JobDetailModal from './componments/JobDetailModal';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { TABLE_NAME } from 'enum/common_types';
import { useTranslation } from 'react-i18next';

const DataJobHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Header variant="h1" description={t('job:manageJobs')}>
      {t('job:runJobs')}
    </Header>
  );
};

const DataJobContent: React.FC<any> = (props: any) => {
  const columnList = JOB_LIST_COLUMN_LIST;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [totalCount, setTotalCount] = useState(0);
  const [pageData, setPageData] = useState([] as any);
  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
    visibleContent: columnList.map((o) => o.id),
  } as any);
  const [selectedItems, setSelectedItems] = useState([] as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRow, setDetailRow] = useState({});
  const [query, setQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);
  const resourcesFilterProps = {
    totalCount,
    columnList: columnList.filter((i) => i.filter),
    query,
    setQuery,
    tableName: TABLE_NAME.DISCOVERY_JOB,
    filteringPlaceholder: t('job:filterJobs'),
  };

  const clkAddJob = () => {
    navigate(RouterEnum.CreateJob.path);
  };

  const clkOption = async (selectedOption: OptionDefinition) => {
    if (!selectedItems || selectedItems.length === 0) {
      alertMsg(t('selectOneItem'), 'error');
      return;
    }
    if (selectedOption.value === 'pause') {
      const result = await disableJob({ id: selectedItems[0].id });
      result && alertMsg(t('pauseSuccess'), 'success');
    } else if (selectedOption.value === 'cancel') {
      const result = await stopJob({ id: selectedItems[0].id });
      result && alertMsg(t('stopSuccess'), 'success');
    } else if (selectedOption.value === 'copyNew') {
      navigate(RouterEnum.CreateJob.path, {
        state: { oldData: selectedItems[0] },
      });
      return;
    } else if (selectedOption.value === 'execute_once') {
      await startJob({ id: selectedItems[0].id });
      alertMsg(t('startSuccess'), 'success');
      return;
    } else if (selectedOption.value === 'continue') {
      await enableJob({ id: selectedItems[0].id });
      alertMsg(t('continueSuccess'), 'success');
      return;
    }
    getPageData();
  };

  useEffect(() => {
    getPageData();
  }, []);
  const firstUpload = useRef(true); // 记录是否是首次加载页面

  useEffect(() => {
    if (firstUpload.current) {
      firstUpload.current = false;
      return;
    }
    getPageData();
  }, [currentPage, preferences.pageSize]);

  useEffect(() => {
    if (firstUpload.current) {
      firstUpload.current = false;
      return;
    }
    setCurrentPage(1);
    getPageData();
  }, [query]);

  const getPageData = async () => {
    setIsLoading(true);
    try {
      const requestParam = {
        page: currentPage,
        size: preferences.pageSize,
        sort_column: 'create_time',
        asc: false,
        conditions: [] as any,
      };
      query.tokens &&
        query.tokens.forEach((item: any) => {
          requestParam.conditions.push({
            column: item.propertyKey,
            values: [`${item.value}`],
            condition: query.operation,
          });
        });
      const result: any = await getDiscoveryJobs(requestParam);
      if (result && result.items) {
        setPageData(result.items);
        setTotalCount(result.total);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const clkJobName = (rowData: any) => {
    setShowDetailModal(true);
    setDetailRow(rowData);
    return;
  };

  const detailModalProps = {
    showDetailModal,
    setShowDetailModal,
    detailRow,
  };
  return (
    <SpaceBetween direction="vertical" size="xl" className="job-container">
      <Table
        items={pageData}
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems)
        }
        ariaLabels={{
          selectionGroupLabel: t('table.itemsSelection') || '',
          allItemsSelectionLabel: ({ selectedItems }) =>
            `${selectedItems.length} ${
              selectedItems.length === 1 ? t('table.item') : t('table.items')
            } ${t('table.selected')}`,
          itemSelectionLabel: ({ selectedItems }, item) => {
            const isItemSelected = selectedItems.filter(
              (i) =>
                (i as any)[columnList[0].id] === (item as any)[columnList[0].id]
            ).length;
            return `${(item as any)[columnList[0].id]} ${t('table.is')} ${
              isItemSelected ? '' : t('table.not')
            } ${t('table.selected')}`;
          },
        }}
        selectionType="single"
        columnDefinitions={columnList.map((item) => {
          return {
            id: item.id,
            header: t(item.label),
            cell: (e: any) => {
              if (item.id === 'last_start_time') {
                return (e as any)[item.id]
                  ? moment((e as any)[item.id])
                      .add(8, 'h')
                      .format('YYYY-MM-DD HH:mm')
                  : '-';
              }
              if (item.id === 'last_end_time') {
                let runTime = '';
                if ((e as any)['last_start_time'] && (e as any)[item.id]) {
                  const splitTime =
                    +new Date((e as any)[item.id]) -
                    +new Date((e as any)['last_start_time']);
                  if (splitTime) {
                    const min = ((splitTime % 3600000) / 60000).toFixed(0);
                    const hour = (splitTime / 3600000).toFixed(0);
                    runTime = `${min}min`;
                    runTime =
                      splitTime > 3600000
                        ? `(${hour}h${min}min)`
                        : `(${runTime})`;
                  }
                }

                return (e as any)[item.id]
                  ? `${moment((e as any)[item.id])
                      .add(8, 'h')
                      .format('YYYY-MM-DD HH:mm')} ${runTime}`
                  : '-';
              }
              if (item.id === 'name') {
                return (
                  <span className="job-name" onClick={() => clkJobName(e)}>
                    {(e as any)[item.id]}
                  </span>
                );
              }
              if (item.id === 'state') {
                let tempType = CLSAAIFIED_TYPE.Success;
                if ((e as any)[item.id] === 'Active (idle)') {
                  tempType = CLSAAIFIED_TYPE.SystemMark;
                }
                if ((e as any)[item.id] === 'Running') {
                  tempType = CLSAAIFIED_TYPE.System;
                }
                if ((e as any)[item.id] === 'Stopped') {
                  tempType = CLSAAIFIED_TYPE.Stopped;
                }
                if ((e as any)[item.id] === 'Paused') {
                  tempType = CLSAAIFIED_TYPE.Unconnected;
                }
                return (
                  <CommonBadge
                    badgeType={BADGE_TYPE.Classified}
                    badgeLabel={(e as any)[item.id]}
                    labelType={tempType}
                  />
                );
              }
              if (item.id === 'schedule') {
                return getCronData((e as any)[item.id]);
              }
              return (e as any)[item.id];
            },
            width: item.id === 'id' ? 100 : undefined,
          };
        })}
        header={
          <>
            <Header
              variant="h2"
              counter={`(${totalCount})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={getPageData}
                    disabled={isLoading}
                    iconName="refresh"
                  />
                  <Select
                    className="job-ations-select"
                    selectedOption={{}}
                    onChange={({ detail }) => {
                      clkOption(detail.selectedOption);
                    }}
                    options={[
                      {
                        label: t('button.cancel') || '',
                        value: 'cancel',
                        disabled:
                          selectedItems.length === 0 ||
                          selectedItems.filter(
                            (item: { state: string }) =>
                              item.state !== 'Cancel' &&
                              item.state !== 'Completed'
                          ).length === 0,
                      },
                      {
                        label: t('button.pause') || '',
                        value: 'pause',
                        disabled:
                          selectedItems.length === 0 ||
                          selectedItems.filter(
                            (item: { state: string }) =>
                              item.state !== 'Paused' &&
                              item.state !== 'Completed'
                          ).length === 0,
                      },
                      {
                        label: t('button.continue') || '',
                        value: 'continue',
                        disabled:
                          selectedItems.length === 0 ||
                          selectedItems.filter(
                            (item: { state: string }) => item.state === 'Paused'
                          ).length === 0,
                      },
                      {
                        label: t('button.exeOnce') || '',
                        value: 'execute_once',
                        disabled:
                          selectedItems.length === 0 ||
                          selectedItems.filter(
                            (item: { state: string }) => item.state === 'Paused'
                          ).length > 0,
                      },
                      {
                        label: t('button.copyToNew') || '',
                        value: 'copyNew',
                        disabled: selectedItems.length === 0,
                      },
                    ]}
                    selectedAriaLabel="Actions"
                  ></Select>
                  <Button onClick={clkAddJob} disabled={isLoading}>
                    {t('button.createJob')}
                  </Button>
                </SpaceBetween>
              }
            >
              Jobs
            </Header>
            <span className="table-header-info">
              Sensitive data discovery jobs.
            </span>
          </>
        }
        loadingText={t('table.loadingResources') || ''}
        visibleColumns={preferences.visibleContent}
        empty={
          <Box textAlign="center" color="inherit">
            <b>{t('table.noResources')}</b>
            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
              {t('table.noResourcesDisplay')}
            </Box>
          </Box>
        }
        filter={<ResourcesFilter {...resourcesFilterProps} />}
        pagination={
          <Pagination
            currentPageIndex={currentPage}
            onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
            pagesCount={Math.ceil(totalCount / preferences.pageSize)}
            ariaLabels={{
              nextPageLabel: t('table.nextPage') || '',
              previousPageLabel: t('table.previousPage') || '',
              pageLabel: (pageNumber) =>
                `${t('table.pageLabel', { pageNumber: pageNumber })}`,
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
                  options: columnList,
                },
              ],
            }}
          />
        }
        loading={isLoading}
      />
      <JobDetailModal {...detailModalProps} />
    </SpaceBetween>
  );
};

const DataJob: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.runJobs'),
      href: RouterEnum.Datajob.path,
    },
  ];

  return (
    <AppLayout
      contentHeader={<DataJobHeader />}
      content={
        <ContentLayout>
          <DataJobContent />
        </ContentLayout>
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.Datajob.path} />}
      navigationWidth={290}
    />
  );
};

export default DataJob;
