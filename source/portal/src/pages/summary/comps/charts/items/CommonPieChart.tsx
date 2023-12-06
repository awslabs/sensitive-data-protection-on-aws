import React from 'react';
import { PieChart } from '@cloudscape-design/components';
import { IPieChartDataType } from 'ts/dashboard/types';
import { useTranslation } from 'react-i18next';
import { formatNumber, formatSize } from 'tools/tools';

export type ChartSourceType = 's3' | 'rds' | 'glue' | 'jdbc' | string;
export type ChartDataType =
  | 'bucket'
  | 'folder'
  | 'file'
  | 'size'
  | 'instance'
  | 'table'
  | 'column';
interface CommonPieChartProps {
  sourceType: ChartSourceType;
  dataType?: ChartDataType;
  circleType: 'pie' | 'donut' | undefined;
  chartData: IPieChartDataType[];
  sourceTotal?: number;
  size?: 'small' | 'medium' | 'large';
}

export const percentageFormatter = (value: any) =>
  `${(value * 100).toFixed(0)}%`;

const CommonPieChart: React.FC<CommonPieChartProps> = (
  props: CommonPieChartProps
) => {
  const { size, sourceType, dataType, sourceTotal, circleType, chartData } =
    props;
  const { t } = useTranslation();

  const formattedValue =
    sourceType === 's3' && dataType === 'size'
      ? formatSize(sourceTotal ?? 0)
      : formatNumber(sourceTotal ?? 0).toString();

  const buildLabelBySourceTypeAndDataType = (
    sourceType: ChartSourceType,
    dataType?: ChartDataType
  ) => {
    if (sourceType === 's3') {
      switch (dataType) {
        case 'bucket':
          return t('summary:s3Buckets');
        case 'folder':
          return t('summary:folders');
        case 'file':
          return t('summary:objects');
        case 'size':
          return t('summary:size');
      }
    }
    if (sourceType !== 's3') {
      switch (dataType) {
        case 'instance':
          return t('summary:databases');
        case 'table':
          return t('summary:tables');
        case 'column':
          return t('summary:columns');
      }
    }
    return '';
  };

  return (
    <PieChart
      variant={circleType}
      size={size ?? 'medium'}
      innerMetricDescription={buildLabelBySourceTypeAndDataType(
        sourceType,
        dataType
      )}
      innerMetricValue={formattedValue}
      data={chartData}
      hideFilter={true}
      segmentDescription={(datum, sum) =>
        `${datum.value} ${buildLabelBySourceTypeAndDataType(
          sourceType,
          dataType
        )}, ${percentageFormatter(datum.value / sum)}`
      }
      detailPopoverContent={(datum, sum) => [
        {
          key: buildLabelBySourceTypeAndDataType(sourceType, dataType),
          value: datum.value,
        },
        {
          key: 'Percentage',
          value: percentageFormatter(datum.value / sum),
        },
      ]}
    />
  );
};

export default CommonPieChart;
