import React, { useEffect, useState } from 'react';
import './style.scss';
import {
  AppLayout,
  Button,
  CollectionPreferences,
  Container,
  Header,
  Icon,
  Modal,
  Pagination,
  SpaceBetween,
  Spinner,
  Table,
} from '@cloudscape-design/components';
import { useNavigate, useLocation } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  CLSAAIFIED_TYPE,
} from 'pages/common-badge/types/badge_type';
import moment from 'moment';
import {
  getGuleJobDetailList,
  getGuleJobStatus,
  getJobTemplateUrl,
} from 'apis/data-job/api';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { ColumnChartData } from 'ts/dashboard/types';
import HorizontalBarChart from 'pages/summary/comps/charts/items/HorizontalBarChart';
import ResourcesFilter from 'pages/resources-filter';
import { alertMsg, useDidUpdateEffect } from 'tools/tools';
import { useTranslation } from 'react-i18next';
import GlueJobProgress from './componments/GlueJobProgress';
import HelpInfo from 'common/HelpInfo';
import { buildDocLink } from 'ts/common';

const GULE_JOB_COLUMN = [
  {
    id: 'id',
    label: 'table.label.glueJobId',
    filter: false,
  },
  {
    id: 'state',
    label: 'table.label.glueJobStatus',
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
  {
    id: 'database_name',
    label: 'table.label.dataCatalog',
    filter: true,
  },
  {
    id: 'progress',
    label: 'table.label.jobProgress',
    filter: false,
  },
  {
    id: 'start_time',
    label: 'table.label.createdAt',
    filter: false,
  },
  {
    id: 'end_time',
    label: 'table.label.finishedAt',
    filter: false,
  },
];

const HomeHeader: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { jobData } = location.state;
  return (
    <Header
      variant="h1"
      description={t('job:detail.detailForJobDesc')}
      actions={
        <Button onClick={() => navigate(RouterEnum.Datajob.path)}>
          {t('button.backToJobList')}
        </Button>
      }
    >
      {t('job:detail.detailForJob')} {jobData.name}
    </Header>
  );
};

const GlueJobContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { jobDetailData, jobData } = location.state;
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pageData, setPageData] = useState([]);
  const [errlogModal, setErrlogModal] = useState(false);
  const [errrowData, setErrrowData] = useState({} as any);
  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
  } as any);
  const [currentPage, setCurrentPage] = useState(1);

  const [processData, setProcessData] = useState<ColumnChartData[]>([]);
  const [query, setQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);

  const resourcesFilterProps = {
    totalCount,
    columnList: GULE_JOB_COLUMN.filter((i) => i.filter),
    tableName: 'discovery_job_run_database',
    query,
    setQuery,
    filteringPlaceholder: t('job:filterJobs'),
  };

  const Badge = ({ jobRowData, needToUpper }: any) => {
    let tempType = CLSAAIFIED_TYPE.Success;
    if (jobRowData.state === 'Active (idle)') {
      tempType = CLSAAIFIED_TYPE.SystemMark;
    }
    if (jobRowData.state === 'Running') {
      tempType = CLSAAIFIED_TYPE.System;
    }
    if (jobRowData.state === 'Stopped') {
      tempType = CLSAAIFIED_TYPE.Stopped;
    }
    if (jobRowData.state === 'Paused') {
      tempType = CLSAAIFIED_TYPE.Unconnected;
    }
    if (jobRowData.state === 'Failed') {
      tempType = CLSAAIFIED_TYPE.Failed;
    }
    return (
      <CommonBadge
        badgeType={BADGE_TYPE.Classified}
        badgeLabel={
          needToUpper ? jobRowData.state.toUpperCase() : jobRowData.state
        }
        labelType={tempType}
      />
    );
  };

  useEffect(() => {
    getPageData();
    getStatusData();
  }, []);

  useDidUpdateEffect(() => {
    setCurrentPage(1);
    getPageData();
  }, [query]);

  useDidUpdateEffect(() => {
    getPageData();
  }, [currentPage, preferences.pageSize]);

  const getPageData = async () => {
    setLoading(true);
    const requestParam = {
      id: jobData.id,
      runId: jobDetailData.id,
      page: currentPage,
      size: preferences.pageSize,
      sort_column: 'start_time',
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
    const detailResult: any = await getGuleJobDetailList(requestParam);
    if (detailResult && detailResult.items) {
      setPageData(detailResult.items);
      setTotalCount(detailResult.total);
    }

    setLoading(false);
  };

  const getStatusData = async () => {
    const requestParam = {
      id: jobData.id,
      runId: jobDetailData.id,
    };
    const result: any = await getGuleJobStatus(requestParam);
    result && Object.keys(result).length > 0 && getProcessData(result);
  };

  const getProcessData = (processData: any) => {
    const totalJobCount =
      processData.success_count +
      processData.running_count +
      processData.fail_count +
      processData.ready_count +
      processData.stopped_count +
      processData.not_existed_count;
    const tmpColumnChartData: ColumnChartData[] = [
      {
        title: t('SUCCEEDED'),
        type: 'bar',
        valueFormatter: (e: any) =>
          `${processData.success_count} (${(100 * e).toFixed(0)}%)`,
        data: [{ x: '', y: processData.success_count / totalJobCount }],
        color: '#037F0C',
      },
      {
        title: t('RUNNING'),
        type: 'bar',
        valueFormatter: (e: any) =>
          `${processData.running_count} (${(100 * e).toFixed(0)}%)`,
        data: [{ x: '', y: processData.running_count / totalJobCount }],
        color: '#0972D3',
      },
      {
        title: t('FAILED'),
        type: 'bar',
        valueFormatter: (e: any) =>
          `${processData.fail_count} (${(100 * e).toFixed(0)}%)`,
        data: [{ x: '', y: processData.fail_count / totalJobCount }],
        color: '#D91515',
      },
      {
        title: t('READY'),
        type: 'bar',
        valueFormatter: (e: any) =>
          `${processData.ready_count} (${(100 * e).toFixed(0)}%)`,
        data: [{ x: '', y: processData.ready_count / totalJobCount }],
        color: '#2EA597',
      },
      {
        title: t('OTHERS'),
        type: 'bar',
        valueFormatter: (e: any) =>
          `${processData.stopped_count + processData.not_existed_count} (${(
            100 * e
          ).toFixed(0)}%)`,
        data: [
          {
            x: '',
            y:
              (processData.stopped_count + processData.not_existed_count) /
              totalJobCount,
          },
        ],
        color: '#9BA7B6',
      },
    ];
    setProcessData(tmpColumnChartData);
  };

  const showErrlogModal = (rowData: any) => {
    if (!rowData.log) {
      return;
    }
    setErrlogModal(true);
    setErrrowData(rowData);
  };

  const clkCatalog = (rowData: any) => {
    navigate(
      `${RouterEnum.Catalog.path}?tagType=${rowData.database_type}&catalogId=${rowData.database_name}`
    );
  };

  const clkDownloadTemplate = async (runId: any, jobId: any) => {
    setDownloading(true);
    try {
      const result: any = await getJobTemplateUrl({
        id: jobId,
        runId,
      });
      if (result) {
        window.open(result, '_blank');
      } else {
        alertMsg(t('noTemplateFile'), 'error');
      }
    } catch {
      alertMsg(t('noTemplateFile'), 'error');
    }
    setDownloading(false);
  };

  const getTimeDiff = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) {
      return '-';
    }
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diff = end - start;

    if (diff < 0) {
      return null; // 结束时间早于开始时间，返回 null
    }

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) {
      return seconds + t('Sec');
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return minutes + t('Min') + remainingSeconds + t('Sec');
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
      return hours + t('Hours') + remainingMinutes + t('Min');
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return days + t('Days') + remainingHours + t('Hours');
  };

  return (
    <>
      <SpaceBetween direction="vertical" size="xl">
        <Container
          header={
            <Header variant="h2" description={t('job:detail.jobInfoDesc')}>
              {t('job:detail.jobInfo')}
            </Header>
          }
          className="glue-job-container"
        >
          <div className="glue-job-header">
            <div className="job-header-id">
              <p className="p-title">{t('job:detail.jobId')}</p>
              <p>{jobDetailData.job_id}</p>
            </div>
            <div className="job-header-status">
              <p className="p-title">{t('job:detail.jobStatus')}</p>
              <Badge jobRowData={jobDetailData} />
            </div>
            <div className="job-header-status">
              <p className="p-title">{t('job:detail.jobStartedAt')}</p>
              <p>
                {moment(jobDetailData.start_time)
                  .add(8, 'h')
                  .format('YYYY-MM-DD HH:mm:ss')}
              </p>
              <p className="p-title">{t('job:detail.jobFinishedAt')}</p>
              <p>
                {moment(jobDetailData.end_time)
                  .add(8, 'h')
                  .format('YYYY-MM-DD HH:mm:ss')}{' '}
                ({getTimeDiff(jobDetailData.start_time, jobDetailData.end_time)}
                )
              </p>
            </div>
            <div className="job-header-run">
              <p className="p-title">
                {t('job:detail.classificationSnapshot')}
              </p>
              <p>
                {downloading ? (
                  <Spinner />
                ) : (
                  <>
                    <Icon name="download" />
                    &nbsp;&nbsp;
                    <span
                      className="job-name"
                      onClick={() =>
                        clkDownloadTemplate(
                          jobDetailData.id,
                          jobDetailData.job_id
                        )
                      }
                    >
                      {t('button.downloadSnapshot')}
                    </span>
                  </>
                )}
              </p>
              <p className="p-title">{t('job:detail.glueJobStatus')}</p>
              <HorizontalBarChart chartData={processData} />
            </div>
          </div>
        </Container>
        <div className="glue-job-table">
          <Table
            loading={loading}
            items={pageData}
            columnDefinitions={GULE_JOB_COLUMN.map((item) => {
              return {
                id: item.id,
                header: t(item.label),
                cell: (e) => {
                  if (
                    (item.id === 'start_time' || item.id === 'end_time') &&
                    (e as any)[item.id]
                  ) {
                    return moment((e as any)[item.id])
                      .add(8, 'h')
                      .format('YYYY-MM-DD HH:mm');
                  }

                  if (item.id === 'state') {
                    return (
                      <div onClick={() => showErrlogModal(e)} className="h">
                        <Badge jobRowData={e as any} needToUpper />
                      </div>
                    );
                  }
                  if (item.id === 'id') {
                    return `${jobDetailData.id}-${(e as any)[item.id]}`;
                  }
                  if (item.id === 'progress') {
                    return (
                      <GlueJobProgress
                        jobRowData={e}
                        jobDetailData={jobDetailData}
                      />
                    );
                  }
                  if (item.id === 'database_name') {
                    return (
                      <span className="job-name" onClick={() => clkCatalog(e)}>
                        {(e as any)[item.id]}
                      </span>
                    );
                  }
                  return (e as any)[item.id];
                },
                width: item.id === 'id' ? 100 : undefined,
              };
            })}
            filter={<ResourcesFilter {...resourcesFilterProps} />}
            pagination={
              <Pagination
                currentPageIndex={currentPage}
                onChange={({ detail }) =>
                  setCurrentPage(detail.currentPageIndex)
                }
                pagesCount={Math.ceil(totalCount / preferences.pageSize)}
                ariaLabels={{
                  nextPageLabel: t('table.nextPage') || '',
                  previousPageLabel: t('table.previousPage') || '',
                  pageLabel: (pageNumber) =>
                    `${t('table.pageLabel', { pageNumber: pageNumber })}`,
                }}
              />
            }
            header={
              <Header
                actions={
                  <Button
                    iconName="refresh"
                    onClick={() => {
                      getPageData();
                    }}
                  />
                }
                counter={`(${totalCount})`}
                variant="h2"
                description={t('job:detail.glueJobsDesc')}
              >
                {t('job:detail.glueJobs')}
              </Header>
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
                      options: GULE_JOB_COLUMN,
                    },
                  ],
                }}
              />
            }
          />
        </div>
      </SpaceBetween>
      <Modal
        visible={errlogModal}
        onDismiss={() => setErrlogModal(false)}
        header={<Header variant="h2">{t('job:detail.errorLog')}</Header>}
      >
        {errrowData.log}
      </Modal>
    </>
  );
};

const GlueJob: React.FC = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    { text: t('breadcrumb.sensitiveJobs'), href: RouterEnum.Datajob.path },
  ];
  return (
    <AppLayout
      contentHeader={<HomeHeader />}
      tools={
        <HelpInfo
          title={t('breadcrumb.sensitiveJobs')}
          description={t('info:jobDetail.desc')}
          linkItems={[
            {
              text: t('info:jobDetail.jobDetailPages'),
              href: buildDocLink(
                i18n.language,
                '/user-guide/discovery-job-details/'
              ),
            },
          ]}
        />
      }
      content={<GlueJobContent />}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.GlueJob.path} />}
      navigationWidth={290}
    />
  );
};

export default GlueJob;
