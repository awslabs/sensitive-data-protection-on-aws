import { Box, Button, Icon, Table } from '@cloudscape-design/components';
import { getJobRunHistory, getReportS3Url } from 'apis/data-job/api';
import moment from 'moment';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  CLSAAIFIED_TYPE,
} from 'pages/common-badge/types/badge_type';
import React, { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import { alertMsg } from 'tools/tools';

const JobHistory: React.FC<any> = memo((props: any) => {
  const { detailRow } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsloading] = useState(false);
  const [dataList, setDataList] = useState([] as any[]);
  const [hasMoreData, setHasMoreData] = useState(dataList.length > 0);
  const [currentPage, setCurrentPage] = useState(1);
  const HISTORY_COLUMN_LIST = [
    { id: 'state', label: 'table.label.jobStatus' },
    { id: 'start_time', label: 'table.label.jobStartedAt' },
    { id: 'end_time', label: 'table.label.jobCompletedAt' },
    { id: 'report', label: 'table.label.report' },
    { id: 'id', label: 'table.label.jobRunDetails' },
  ];
  const columnList = HISTORY_COLUMN_LIST;

  useEffect(() => {
    getPageData();
  }, []);

  useEffect(() => {
    getPageData();
  }, [currentPage]);

  const getPageData = async () => {
    setIsloading(true);
    const { id } = detailRow;
    const requestParam = {
      page: currentPage,
      id,
      size: 50,
    };
    const result: any = await getJobRunHistory(requestParam);
    setIsloading(false);
    if (!result || !result.items) {
      return;
    }
    setHasMoreData(result.total > result.items.length + dataList.length);
    let cloneList: any[] = dataList.concat(result.items);
    cloneList = cloneList.sort(
      (a, b) =>
        new Date(b.start_time).valueOf() - new Date(a.start_time).valueOf()
    );
    setDataList(cloneList);
  };

  const clkDownloadReport = async (runId: any, jobId: any) => {
    setIsloading(true);
    try {
      const result: any = await getReportS3Url({
        id: jobId,
        runId,
      });

      if (result) {
        window.open(result, '_blank');
      } else {
        alertMsg(t('noReportFile'), 'error');
      }
    } catch {
      alertMsg(t('noReportFile'), 'error');
    }
    setIsloading(false);
  };

  const clkJobId = (jobDetailData: any) => {
    navigate(RouterEnum.GlueJob.path, {
      state: { jobDetailData, jobData: detailRow },
    });
  };

  return (
    <Table
      className="no-shadow"
      variant="embedded"
      loading={isLoading}
      resizableColumns
      columnDefinitions={
        columnList.map((item) => {
          return {
            id: item.id,
            header: t(item.label),
            cell: (e: any) => {
              if (
                (item.id === 'start_time' || item.id === 'end_time') &&
                (e as any)[item.id]
              ) {
                return moment((e as any)[item.id])
                  .add(8, 'h')
                  .format('YYYY-MM-DD HH:mm');
              }
              if (item.id === 'id' && (e as any)[item.id]) {
                return (
                  <span className="job-name" onClick={() => clkJobId(e)}>
                    {t('button.jobRunDetails')}
                  </span>
                );
              }
              if (item.id === 'report') {
                return (
                  <>
                    {(e as any)['state'] === 'Completed' && (
                      <>
                        <Icon name="download" />
                        &nbsp;&nbsp;
                        <span
                          className="job-name"
                          onClick={() => clkDownloadReport(e.id, e.job_id)}
                        >
                          {t('button.downloadReport')}
                        </span>
                      </>
                    )}
                  </>
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
                  tempType = CLSAAIFIED_TYPE.Failed;
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
              return (e as any)[item.id];
            },
          };
        }) as any
      }
      items={dataList}
      loadingText={t('table.loadingResources') || ''}
      visibleColumns={columnList.map((i) => i.id)}
      empty={
        <Box textAlign="center" color="inherit">
          <b>{t('table.noResources')}</b>
          <Box padding={{ bottom: 's' }} variant="p" color="inherit">
            {t('table.noResourcesDisplay')}
          </Box>
        </Box>
      }
      footer={
        hasMoreData && (
          <Box textAlign="center">
            <Button
              variant="link"
              onClick={() => {
                setCurrentPage(currentPage + 1);
              }}
            >
              {t('button.viewMore')}
            </Button>
          </Box>
        )
      }
    />
  );
});

export default JobHistory;
