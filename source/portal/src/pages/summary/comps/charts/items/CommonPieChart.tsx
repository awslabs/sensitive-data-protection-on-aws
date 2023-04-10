import React from 'react';
import { PieChart } from '@cloudscape-design/components';
import { IPieChartDataType } from 'ts/dashboard/types';

interface CommonPieChartProps {
  sourceType: 's3' | 'rds';
  circleType: 'pie' | 'donut' | undefined;
  chartData: IPieChartDataType[];
  sourceTotal?: number;
}

export const percentageFormatter = (value: any) =>
  `${(value * 100).toFixed(0)}%`;

const CommonPieChart: React.FC<CommonPieChartProps> = (
  props: CommonPieChartProps
) => {
  const { sourceType, sourceTotal, circleType, chartData } = props;
  return (
    <PieChart
      variant={circleType}
      size="medium"
      innerMetricDescription={sourceType === 's3' ? 'Bucket(s)' : 'Instance(s)'}
      innerMetricValue={sourceTotal?.toString()}
      data={chartData}
      hideFilter={true}
      segmentDescription={(datum, sum) =>
        `${datum.value} ${
          sourceType === 's3' ? 'Buckets' : 'RDS instances'
        }, ${percentageFormatter(datum.value / sum)}`
      }
      detailPopoverContent={(datum, sum) => [
        {
          key: sourceType === 's3' ? 'Buckets' : 'RDS instances',
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
