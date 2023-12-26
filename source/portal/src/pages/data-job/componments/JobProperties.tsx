import { Box, Table } from '@cloudscape-design/components';
import { getJobDetail } from 'apis/data-job/api';
import moment from 'moment';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  CLSAAIFIED_TYPE,
} from 'pages/common-badge/types/badge_type';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime, getCronData } from 'tools/tools';

const PROPERTY_COLUMN_LIST = [
  { id: 'property', label: 'table.label.property' },
  { id: 'value', label: 'table.label.value' },
];

const JobProperties: React.FC<any> = memo((props: any) => {
  const { detailRow } = props;
  const { t } = useTranslation();
  const [isLoading, setIsloading] = useState(false);
  const [dataList, setDataList] = useState([] as any);

  const columnList = PROPERTY_COLUMN_LIST;

  useEffect(() => {
    getDetailData();
  }, []);

  const getDetailData = async () => {
    setIsloading(true);
    const { id } = detailRow;
    const result: any = await getJobDetail({ id });
    setIsloading(false);
    if (!result) {
      return;
    }
    const dataKeys = Object.keys(result);
    const tempData:
      | ((prevState: never[]) => never[])
      | { property: string; value: any }[] = [];
    dataKeys.forEach((item) => {
      let value = result[item];

      if ((item === 'last_start_time' || item === 'last_end_time') && value) {
        value = formatTime(value);
      }

      if (item === 'databases') {
        return;
      }

      if (item === 'state') {
        let tempType = CLSAAIFIED_TYPE.Success;
        if (result[item] === 'Active (idle)') {
          tempType = CLSAAIFIED_TYPE.SystemMark;
        }
        if (result[item] === 'Running') {
          tempType = CLSAAIFIED_TYPE.System;
        }
        if (result[item] === 'Stopped') {
          tempType = CLSAAIFIED_TYPE.Stopped;
        }
        if (result[item] === 'Paused') {
          tempType = CLSAAIFIED_TYPE.Unconnected;
        }
        value = (
          <CommonBadge
            badgeType={BADGE_TYPE.Classified}
            badgeLabel={result[item]}
            labelType={tempType}
          />
        );
      }
      tempData.push({ property: item, value: value });
    });
    setDataList(tempData);
  };

  return (
    <>
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
                if (e['property'] === 'schedule' && item.id === 'value') {
                  return getCronData(e[item.id]);
                }
                return <>{(e as any)[item.id]}</>;
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
      />
    </>
  );
});

export default JobProperties;
