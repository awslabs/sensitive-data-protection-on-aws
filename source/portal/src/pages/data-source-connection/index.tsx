import React from 'react';
import {
  AppLayout,
  Button,
  Container,
  Header,
  SpaceBetween,
  Tabs,
} from '@cloudscape-design/components';
import { TAB_LIST } from 'enum/common_types';
import DataSourceList from './componments/DataSourceList';
import './style.scss';
import DataSourceInfo from './componments/DataSourceInfo';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from 'pages/left-menu/Navigation';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';

const DataSourceConnectionHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    accountData = {
      account_id: '',
    },
  } = location.state || {};
  return (
    <Header
      variant="h1"
      description={t('datasource:connectToDataSourceForAccountDesc')}
      actions={
        <Button onClick={() => navigate(RouterEnum.AccountManagement.path)}>
          {t('button.backToAWSAccount')}
        </Button>
      }
    >
      {t('datasource:connectToDataSourceForAccount')} {accountData.account_id}
    </Header>
  );
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

  return (
    <SpaceBetween direction="vertical" size="xl" className="connect-container">
      <div>
        {accountData && accountData.account_id && (
          <DataSourceInfo accountData={accountData} />
        )}
      </div>
      <Container disableContentPaddings>
        <Tabs
          tabs={[
            {
              label: t(TAB_LIST.S3.label),
              id: TAB_LIST.S3.id,
              content: (
                <DataSourceList
                  tagType={TAB_LIST.S3.id}
                  accountData={accountData}
                />
              ),
            },
            {
              label: t(TAB_LIST.RDS.label),
              id: TAB_LIST.RDS.id,
              content: (
                <DataSourceList
                  tagType={TAB_LIST.RDS.id}
                  accountData={accountData}
                />
              ),
            },
            {
              label: t(TAB_LIST.GLUE.label),
              id: TAB_LIST.GLUE.id,
              content: (
                <DataSourceList
                  tagType={TAB_LIST.GLUE.id}
                  accountData={accountData}
                />
              ),
            },
            {
              label: t(TAB_LIST.JDBC.label),
              id: TAB_LIST.JDBC.id,
              content: (
                <DataSourceList
                  tagType={TAB_LIST.JDBC.id}
                  accountData={accountData}
                />
              ),
            },
          ]}
        />
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
      contentHeader={<DataSourceConnectionHeader />}
      content={<DataSourceConnectionContent />}
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
