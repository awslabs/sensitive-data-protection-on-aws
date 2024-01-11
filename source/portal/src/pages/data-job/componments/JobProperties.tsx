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

const PROPERTY_LIST = [
  { id: 'name', label: 'table.label.propertyValue.jobName' },
  { id: 'template_id', label: 'table.label.value' },
  { id: 'schedule', label: 'table.label.propertyValue.schedule' },
  { id: 'description', label: 'table.label.propertyValue.description' },
  { id: 'range', label: 'table.label.propertyValue.range' },
  { id: 'depth_structured', label: 'table.label.propertyValue.depthStructured' },
  { id: 'depth_unstructured', label: 'table.label.propertyValue.depthUnstructured' },
  { id: 'detection_threshold', label: 'table.label.propertyValue.detectionThreshold' },
  { id: 'all_s3', label: 'table.label.propertyValue.allS3' },
  { id: 'all_rds', label: 'table.label.propertyValue.allRDS' },
  { id: 'all_ddb', label: 'table.label.propertyValue.allDDB' },
  { id: 'all_emr', label: 'table.label.propertyValue.allEMR' },
  { id: 'all_glue', label: 'table.label.propertyValue.allGlue' },
  { id: 'all_jdbc', label: 'table.label.propertyValue.allJDBC' },
  { id: 'overwrite', label: 'table.label.propertyValue.overwrite' },
  { id: 'exclude_keywords', label: 'table.label.propertyValue.excludeKeywords' },
  { id: 'include_keywords', label: 'table.label.propertyValue.includeKeywords' },
  { id: 'exclude_file_extensions', label: 'table.label.propertyValue.excludeFileExtensions' },
  { id: 'include_file_extensions', label: 'table.label.propertyValue.includeFileExtensions' },
  { id: 'provider_id', label: 'table.label.propertyValue.providerId' },
  { id: 'database_type', label: 'table.label.propertyValue.databaseType' },
  { id: 'id', label: 'table.label.propertyValue.id' },
  { id: 'state', label: 'table.label.propertyValue.state' },
  { id: 'last_start_time', label: 'table.label.propertyValue.lastStartTime' },
  { id: 'last_end_time', label: 'table.label.propertyValue.lastEndTime' }
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
                const property = (e as any)[item.id];
                const foundItem = PROPERTY_LIST.find(item => item.id === property)
                return foundItem ? t(foundItem.label):(e as any)[item.id]
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
