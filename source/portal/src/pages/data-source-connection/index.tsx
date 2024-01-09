import React, { useEffect } from 'react';
import {
  AppLayout,
  Button,
  Container,
  ContentLayout,
  Header,
  SpaceBetween,
  Tabs,
} from '@cloudscape-design/components';
import { CACHE_CONDITION_KEY, TAB_LIST } from 'enum/common_types';
import DataSourceList from './componments/DataSourceList';
import './style.scss';
import DataSourceInfo from './componments/DataSourceInfo';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from 'pages/left-menu/Navigation';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

const DataSourceConnectionHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    accountData = {
      account_id: '',
      account_provider_id: '',
    },
  } = location.state || {};
  return (
    <Header
      variant="h1"
      description={t('datasource:connectToDataSourceForAccountDesc')}
      actions={
        <Button
          onClick={() =>
            navigate(
              `${RouterEnum.AccountManagement.path}?provider=${accountData.account_provider_id}`
            )
          }
        >
          {t('button.backToAWSAccount')}
        </Button>
      }
    >
      {t('datasource:connectToDataSourceForAccount')} {accountData.account_id}
    </Header>
  );
};

const genTabs = (
  accountData: any,
  t: TFunction<'translation', undefined, 'translation'>
) => {
  const res_aws = [
    {
      label: t(TAB_LIST.S3.id),
      id: TAB_LIST.S3.id,
      content: (
        <DataSourceList tagType={TAB_LIST.S3.id} accountData={accountData} />
      ),
    },
    {
      label: t(TAB_LIST.RDS.id),
      id: TAB_LIST.RDS.id,
      content: (
        <DataSourceList tagType={TAB_LIST.RDS.id} accountData={accountData} />
      ),
    },
    {
      label: t(TAB_LIST.GLUE.id),
      id: TAB_LIST.GLUE.id,
      content: (
        <DataSourceList tagType={TAB_LIST.GLUE.id} accountData={accountData} />
      ),
    },
    {
      label: t(TAB_LIST.JDBC.id),
      id: TAB_LIST.JDBC.id,
      content: (
        <DataSourceList tagType={TAB_LIST.JDBC.id} accountData={accountData} />
      ),
    },
  ];
  const res = [
    {
      label: t(TAB_LIST.JDBC.id),
      id: TAB_LIST.JDBC.id,
      content: (
        <DataSourceList tagType={TAB_LIST.JDBC.id} accountData={accountData} />
      ),
    },
  ];
  if (accountData.account_provider_id === 1) return res_aws;
  return res;
};

const DataSourceConnectionContent: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const {
    accountData = {
      account_email: '',
      account_id: '',
      region: '',
      stack_instance_status: '',
      stack_status: '',
      organization_unit_id: '',
    },
  } = location.state || {};

useEffect(() => {
  sessionStorage[CACHE_CONDITION_KEY] = JSON.stringify({
    column: "account_id",
    condition: "and",
    operation: "in",
    values: [accountData.account_id]
  })
}, []);

  return (
    <SpaceBetween direction="vertical" size="xl" className="connect-container">
      <div>
        {accountData && accountData.account_id && (
          <DataSourceInfo accountData={accountData} />
        )}
      </div>
      <Container disableContentPaddings>
        <Tabs tabs={genTabs(accountData, t)} />
      </Container>
    </SpaceBetween>
  );
};

const DataSourceConnection: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.dataSourceConnection'),
      href: RouterEnum.DataSourceConnection.path,
    },
  ];


  return (
    <AppLayout
      toolsHide
      content={
        <ContentLayout header={<DataSourceConnectionHeader />}>
          <DataSourceConnectionContent />
        </ContentLayout>
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={
        <Navigation activeHref={RouterEnum.DataSourceConnection.path} />
      }
      navigationWidth={290}
    />
  );
};

export default DataSourceConnection;
