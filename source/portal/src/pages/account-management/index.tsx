import React, { useEffect, useState } from 'react';
import './style.scss';
import TopDataCoverage from 'pages/top-data-coverage';
import AccountList from './componments/AccountList';
import { getSourceCoverage } from 'apis/data-source/api';
import {
  AppLayout,
  ContentLayout,
  Grid,
  Header,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { getAccountInfomation } from 'apis/dashboard/api';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import HelpInfo from 'common/HelpInfo';
import { buildDocLink } from 'ts/common';
import ProviderTab, { ProviderType } from 'common/ProviderTab';

const AccountManagementHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Header variant="h1" description={t('account:connectToDataSourceDesc')}>
      {t('account:connectToDataSource')}
    </Header>
  );
};

const OVERALL_INIT_DATA = {
  rds_connected: 0,
  rds_total: 0,
  s3_connected: 0,
  s3_total: 0,
  jdbc_connected: 0,
  jdbc_total: 0,
  glue_connected: 0,
  glue_total: 0,
};

const AccountManagementContent: React.FC = () => {
  const { t } = useTranslation();
  const [coverageData, setCoverageData] = useState(OVERALL_INIT_DATA);
  const [totalAccount, setTotalAccount] = useState(0);
  const [totalRegion, setTotalRegion] = useState(0);
  const [currentProvider, setCurrentProvider] = useState<ProviderType>();
  const [providerIsLoading, setProviderIsLoading] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    if (currentProvider) {
      getSourceCoverageData(currentProvider.id);
    }
  }, [currentProvider]);

  const getSourceCoverageData = async (providerId: number | string) => {
    try {
      setLoadingAccounts(true);
      setCoverageData(OVERALL_INIT_DATA);
      const result: any = await getSourceCoverage({
        provider_id: providerId,
      });
      if (result) {
        setCoverageData(result);
      }
      const accountData: any = await getAccountInfomation({
        provider_id: providerId,
      });
      if (accountData) {
        setTotalAccount(accountData.account_total);
        setTotalRegion(accountData.region_total);
      }
      setLoadingAccounts(false);
    } catch (error) {
      setLoadingAccounts(false);
      console.error(error);
    }
  };

  return (
    <SpaceBetween direction="vertical" size="xxl">
      <ProviderTab
        loadingProvider={(loading) => {
          setProviderIsLoading(loading);
        }}
        changeProvider={(provider) => {
          setCurrentProvider(provider);
        }}
      />
      {providerIsLoading || loadingAccounts ? (
        <Spinner />
      ) : (
        <SpaceBetween direction="vertical" size="xxl">
          <Grid
            gridDefinition={
              currentProvider?.id === 1
                ? [{ colspan: 4 }, { colspan: 8 }]
                : [{ colspan: 6 }, { colspan: 6 }]
            }
          >
            <TopDataCoverage
              header={t('account:awsAccountInfo', {
                PROVIDER: currentProvider?.provider_name,
              })}
              description={t('account:awsAccountInfoDesc', {
                PROVIDER: currentProvider?.provider_name,
              })}
              col={2}
              dataList={[
                {
                  label: t('account:totalAWSAccount', {
                    PROVIDER: currentProvider?.provider_name,
                  }),
                  value: totalAccount.toString(),
                },
                {
                  label: t('account:awsRegions', {
                    PROVIDER: currentProvider?.provider_name,
                  }),
                  value: totalRegion.toString(),
                },
              ]}
            />
            <TopDataCoverage
              header={t('account:dataSourceConnection')}
              description={
                <span className="coverage-small">
                  {t('account:dataSourceDiscoverInAWSAccount', {
                    PROVIDER: currentProvider?.provider_name ?? '',
                  })}
                </span>
              }
              col={currentProvider?.id === 1 ? 4 : 2}
              dataList={
                currentProvider?.id === 1
                  ? [
                      {
                        label: t('account:totalS3Bucket'),
                        value: coverageData?.s3_connected,
                        total: coverageData?.s3_total,
                      },
                      {
                        label: t('account:totalRDSInstance'),
                        value: coverageData?.rds_connected,
                        total: coverageData?.rds_total,
                      },
                      {
                        label: t('account:awsGlue'),
                        value: coverageData?.glue_connected,
                        total: coverageData?.glue_total,
                      },
                      {
                        label: t('account:customDB'),
                        value: coverageData?.jdbc_connected,
                        total: coverageData?.jdbc_total,
                      },
                    ]
                  : [
                      {
                        label: t('account:totalJDBCConn'),
                        value: coverageData?.jdbc_connected,
                        total: coverageData?.jdbc_total,
                      },
                    ]
              }
            />
          </Grid>
          <AccountList
            setTotalAccount={setTotalAccount}
            provider={currentProvider}
          />
        </SpaceBetween>
      )}
    </SpaceBetween>
  );
};

const AccountManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.connectSource'),
      href: RouterEnum.AccountManagement.path,
    },
  ];
  return (
    <AppLayout
      tools={
        <HelpInfo
          title={t('breadcrumb.connectSource')}
          description={t('info:connect.desc')}
          linkItems={[
            {
              text: t('info:connect.addAWSAccount'),
              href: buildDocLink(i18n.language, '/user-guide/data-source/'),
            },
          ]}
        />
      }
      content={
        <ContentLayout header={<AccountManagementHeader />} disableOverlap>
          <AccountManagementContent />
        </ContentLayout>
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.AccountManagement.path} />}
      navigationWidth={290}
    />
  );
};

export default AccountManagement;
