import { BarChart } from '@cloudscape-design/components';
import React from 'react';
import { ColumnChartData } from 'ts/dashboard/types';

interface HorizontalBarChartProps {
  chartData: ColumnChartData[];
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = (
  props: HorizontalBarChartProps
) => {
  const { chartData } = props;
  return (
    <div className="horizon-bar-chart">
      <BarChart
        hideFilter
        series={chartData}
        xDomain={['']}
        yDomain={[0, 1]}
        errorText="Error loading data."
        height={30}
        horizontalBars
        loadingText="Loading chart"
        recoveryText="Retry"
        stackedBars
        xScaleType="categorical"
      />
    </div>
  );
};

export default HorizontalBarChart;
