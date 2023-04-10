import {
  Box,
  ColumnLayout,
  Grid,
  Spinner,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import { CounterLink } from 'common/ConterLink';
import HorizontalBarChart from './HorizontalBarChart';
import { getDatacatalogSummary } from 'apis/dashboard/api';
import { ColumnChartData, ICatalogSummary } from 'ts/dashboard/types';
import { formatNumber, formatSize } from 'tools/tools';

const S3CatalogOverview = () => {
  const [loadingData, setLoadingData] = useState(true);
  const [catalogSummaryData, setCatalogSummaryData] =
    useState<ICatalogSummary>();
  const [columChartData, setColumChartData] = useState<ColumnChartData[]>([]);

  const getS3DatacatalogSummary = async () => {
    const res = await getDatacatalogSummary({
      database_type: 's3',
    });
    setCatalogSummaryData(res as ICatalogSummary);
    const tmpData = res as ICatalogSummary;
    const tmpColumnChartData: ColumnChartData[] = [];
    tmpData.column_chart.forEach((element) => {
      element.total_count = tmpData.column_chart.reduce(
        (accumulator: number, item: any) => {
          return accumulator + item.table_total;
        },
        0
      );
      tmpColumnChartData.push({
        title: element.classification,
        type: 'bar',
        valueFormatter: (e: any) => `${(100 * e).toFixed(0)}%`,
        data: [{ x: '', y: element.table_total / element.total_count }],
      });
    });
    setColumChartData(tmpColumnChartData);
    setLoadingData(false);
  };

  useEffect(() => {
    getS3DatacatalogSummary();
  }, []);

  return (
    <Grid
      gridDefinition={
        loadingData ? [{ colspan: 12 }] : [{ colspan: 7 }, { colspan: 5 }]
      }
    >
      {loadingData ? (
        <Spinner />
      ) : (
        <>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">S3 buckets</Box>
              <CounterLink>
                {formatNumber(catalogSummaryData?.database_total || 0)}
              </CounterLink>
            </div>
            <div>
              <Box variant="awsui-key-label">S3 objects</Box>
              <CounterLink>
                {formatNumber(catalogSummaryData?.object_total || 0)}
              </CounterLink>
            </div>
            <div>
              <Box variant="awsui-key-label">S3 object size</Box>
              <CounterLink>
                {formatSize(catalogSummaryData?.size_total || 0)}
              </CounterLink>
            </div>
          </ColumnLayout>
          <div>
            <Box variant="awsui-key-label">Object types</Box>
            <HorizontalBarChart chartData={columChartData} />
          </div>
        </>
      )}
    </Grid>
  );
};

export default S3CatalogOverview;
