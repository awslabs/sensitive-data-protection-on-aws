import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Header,
  ColumnLayout,
  Grid,
  Spinner,
} from '@cloudscape-design/components';
import { CounterLink } from '../../../common/ConterLink';
import { getAccountInfomation } from 'apis/dashboard/api';
import { IAccountInfo, ISourceCoverage } from 'ts/dashboard/types';
import { getSourceCoverage } from 'apis/data-source/api';

const Overview: React.FC = () => {
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingCoverage, setLoadingCoverage] = useState(true);
  const [accountInfo, setAccountInfo] = useState<IAccountInfo>();
  const [coverageInfo, setCoverageInfo] = useState<ISourceCoverage>();

  const getOverviewData = async () => {
    setLoadingOverview(true);
    const res = await getAccountInfomation();
    setAccountInfo(res as IAccountInfo);
    setLoadingOverview(false);
  };

  const getDashbaordSourceCoverage = async () => {
    setLoadingCoverage(true);
    const res = await getSourceCoverage();
    setCoverageInfo(res as ISourceCoverage);
    setLoadingCoverage(false);
  };

  useEffect(() => {
    getOverviewData();
    getDashbaordSourceCoverage();
  }, []);

  return (
    <Grid gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}>
      <div>
        <Container
          header={
            <Header
              variant="h2"
              description="AWS accounts that are tracked in this platform."
            >
              AWS accounts information
            </Header>
          }
        >
          {loadingOverview ? (
            <Spinner />
          ) : (
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Total AWS accounts</Box>
                <CounterLink>{accountInfo?.account_total}</CounterLink>
              </div>
              <div>
                <Box variant="awsui-key-label">AWS regions</Box>
                <CounterLink>{accountInfo?.region_total}</CounterLink>
              </div>
            </ColumnLayout>
          )}
        </Container>
      </div>
      <div>
        <Container
          header={
            <Header
              variant="h2"
              description="Data source that discovered in AWS accounts."
            >
              Data source connection
            </Header>
          }
        >
          {loadingCoverage ? (
            <Spinner />
          ) : (
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Total S3 buckets</Box>
                <CounterLink>{coverageInfo?.s3_total}</CounterLink>
              </div>
              <div>
                <Box variant="awsui-key-label">Total RDS instances</Box>
                <CounterLink>{coverageInfo?.rds_total}</CounterLink>
              </div>
            </ColumnLayout>
          )}
        </Container>
      </div>
    </Grid>
  );
};

export default Overview;
