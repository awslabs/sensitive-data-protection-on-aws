import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Header,
  Grid,
  Spinner,
} from '@cloudscape-design/components';
import { CounterLink } from '../../../common/ConterLink';
import { getAccountInfomation } from 'apis/dashboard/api';
import { IAccountInfo, ISourceCoverage } from 'ts/dashboard/types';
import { getSourceCoverage } from 'apis/data-source/api';
import { useTranslation } from 'react-i18next';
import { ProviderType } from 'common/ProviderTab';

interface OverViewProps {
  currentProvider?: ProviderType;
  loadingProvider: boolean;
}

const Overview: React.FC<OverViewProps> = (props: OverViewProps) => {
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingCoverage, setLoadingCoverage] = useState(true);
  const [accountInfo, setAccountInfo] = useState<IAccountInfo>();
  const [coverageInfo, setCoverageInfo] = useState<ISourceCoverage>();
  const { t } = useTranslation();
  const { currentProvider } = props;
  const getOverviewData = async () => {
    setLoadingOverview(true);
    const res = await getAccountInfomation({
      provider_id: currentProvider?.id,
    });
    setAccountInfo(res as IAccountInfo);
    setLoadingOverview(false);
  };

  const getDashboardSourceCoverage = async () => {
    setLoadingCoverage(true);
    try {
      const res = await getSourceCoverage({ provider_id: currentProvider?.id });
      setCoverageInfo(res as ISourceCoverage);
      setLoadingCoverage(false);
    } catch (error) {
      setLoadingCoverage(false);
    }
  };

  useEffect(() => {
    if (currentProvider) {
      getOverviewData();
      getDashboardSourceCoverage();
    }
  }, [currentProvider]);

  const buildSummaryDataByProvider = () => {
    if (currentProvider?.id === 1) {
      return (
        <Grid
          gridDefinition={[
            { colspan: 3 },
            { colspan: 3 },
            { colspan: 3 },
            { colspan: 3 },
          ]}
        >
          <div>
            <Box variant="awsui-key-label">{t('summary:totalS3Buckets')}</Box>
            <CounterLink>{coverageInfo?.s3_total}</CounterLink>
          </div>
          <div>
            <Box variant="awsui-key-label">
              {t('summary:totalRDSInstances')}
            </Box>
            <CounterLink>{coverageInfo?.rds_total}</CounterLink>
          </div>
          <div>
            <Box variant="awsui-key-label">{t('summary:totalGlue')}</Box>
            <CounterLink>{coverageInfo?.glue_total}</CounterLink>
          </div>
          <div>
            <Box variant="awsui-key-label">{t('summary:totalJDBC')}</Box>
            <CounterLink>{coverageInfo?.jdbc_total}</CounterLink>
          </div>
        </Grid>
      );
    }
    return (
      <div>
        <Box variant="awsui-key-label">{t('summary:totalJDBC')}</Box>
        <CounterLink>{coverageInfo?.jdbc_total}</CounterLink>
      </div>
    );
  };

  return (
    <Grid
      gridDefinition={
        currentProvider?.id === 1
          ? [{ colspan: 4 }, { colspan: 8 }]
          : [{ colspan: 6 }, { colspan: 6 }]
      }
    >
      <div>
        <Container
          header={
            <Header
              variant="h2"
              description={t('summary:awsAccountInfoDesc', {
                PROVIDER: currentProvider?.provider_name,
              })}
            >
              {t('summary:awsAccountInfo', {
                PROVIDER: currentProvider?.provider_name,
              })}
            </Header>
          }
        >
          {loadingOverview ? (
            <Spinner />
          ) : (
            <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
              <div>
                <Box variant="awsui-key-label">
                  {t('summary:totalAWSAccount', {
                    PROVIDER: currentProvider?.provider_name,
                  })}
                </Box>
                <CounterLink>{accountInfo?.account_total}</CounterLink>
              </div>
              <div>
                <Box variant="awsui-key-label">{t('summary:awsRegions')}</Box>
                <CounterLink>{accountInfo?.region_total}</CounterLink>
              </div>
            </Grid>
          )}
        </Container>
      </div>
      <div>
        <Container
          header={
            <Header
              variant="h2"
              description={t('summary:dataSourceConnectionDesc', {
                PROVIDER: currentProvider?.provider_name,
              })}
            >
              {t('summary:dataSourceConnection')}
            </Header>
          }
        >
          {loadingCoverage ? <Spinner /> : <>{buildSummaryDataByProvider()}</>}
        </Container>
      </div>
    </Grid>
  );
};

export default Overview;
