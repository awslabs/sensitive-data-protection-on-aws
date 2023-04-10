import { Header, LineChart } from '@cloudscape-design/components';
import React from 'react';
import Box from '@cloudscape-design/components/box';

interface CustomLineChartProps {
  title: string;
}

const CustomLineChart: React.FC<CustomLineChartProps> = (
  props: CustomLineChartProps
) => {
  const { title } = props;
  return (
    <div>
      <Header variant="h3">{title}</Header>
      <div className="mt-20">
        <LineChart
          series={[]}
          xDomain={undefined}
          yDomain={[0, 500000]}
          i18nStrings={{
            filterLabel: 'Filter displayed data',
            filterPlaceholder: 'Filter data',
            filterSelectedAriaLabel: 'selected',
            detailPopoverDismissAriaLabel: 'Dismiss',
            legendAriaLabel: 'Legend',
            chartAriaRoleDescription: 'line chart',
          }}
          ariaLabel="Single data series line chart"
          errorText="Error loading data."
          height={300}
          hideFilter
          loadingText="Loading chart"
          recoveryText="Retry"
          xScaleType="time"
          empty={
            <Box textAlign="center" color="inherit">
              <b>No data available</b>
              <Box variant="p" color="inherit">
                There is no data available
              </Box>
            </Box>
          }
        />
      </div>
    </div>
  );
};

export default CustomLineChart;
