import {
  AppLayout,
  Button,
  Container,
  ContentLayout,
  Header,
} from '@cloudscape-design/components';
import React, { useState } from 'react';
import Overview from './comps/Overview';
import Charts from './comps/Charts';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { RouterEnum } from 'routers/routerEnum';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HelpInfo from 'common/HelpInfo';
import { buildDocLink } from 'ts/common';
import DataLocations from './comps/DataLocations';
import ProviderTab, { ProviderType } from 'common/ProviderTab';

const HomeHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Header variant="h1" description="">
      {t('summary:summary')}
    </Header>
  );
};

const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentProvider, setCurrentProvider] = useState<ProviderType>();
  const [loadingProvider, setLoadingProvider] = useState(false);
  return (
    <ContentLayout header={<HomeHeader />}>
      <Container
        header={<Header variant="h2">{t('summary:getStarted')}</Header>}
        className="fix-mid-screen common-header"
      >
        <div className="flex-h gap-16">
          <div
            className="flex-v justify-spacebetween"
            style={{ minWidth: 250 }}
          >
            <div>{t('summary:step1')}</div>
            <div className="mt-20">
              <Button
                onClick={() => navigate(RouterEnum.AccountManagement.path)}
              >
                {t('button.connectToDataSource')}
              </Button>
            </div>
          </div>
          <div
            className="flex-v justify-spacebetween"
            style={{ minWidth: 220 }}
          >
            <div>{t('summary:step2')}</div>
            <div className="mt-20">
              <Button onClick={() => navigate(RouterEnum.Catalog.path)}>
                {t('button.browserCatalog')}
              </Button>
            </div>
          </div>
          <div
            className="flex-v justify-spacebetween"
            style={{ minWidth: 250 }}
          >
            <div>{t('summary:step3')}</div>
            <div className="mt-20">
              <Button onClick={() => navigate(RouterEnum.Datatemplate.path)}>
                {t('button.defineTemplate')}
              </Button>
            </div>
          </div>
          <div
            className="flex-v justify-spacebetween"
            style={{ minWidth: 270 }}
          >
            <div>{t('summary:step4')}</div>
            <div className="mt-20">
              <Button onClick={() => navigate(RouterEnum.Datajob.path)}>
                {t('button.runJob')}
              </Button>
            </div>
          </div>
        </div>
      </Container>
      <div className="mt-20">
        <DataLocations />
      </div>
      <div>
        <ProviderTab
          changeProvider={(provider) => {
            setCurrentProvider(provider);
          }}
          loadingProvider={(loading) => {
            setLoadingProvider(loading);
          }}
        />
      </div>
      <div className="mt-20">
        <Overview
          currentProvider={currentProvider}
          loadingProvider={loadingProvider}
        />
      </div>
      <div className="mt-20">
        <Charts currentProvider={currentProvider} />
      </div>
    </ContentLayout>
  );
};

const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbItems = [
    {
      text: t('breadcrumb.home'),
      href: RouterEnum.Home.path,
    },
    {
      text: t('breadcrumb.summary'),
      href: RouterEnum.Home.path,
    },
  ];
  return (
    <AppLayout
      tools={
        <HelpInfo
          title={t('breadcrumb.summary')}
          description={t('info:summary.desc')}
          linkItems={[
            {
              text: t('info:summary.solutionDo'),
              href: buildDocLink(i18n.language),
            },
            {
              text: t('info:summary.getStarted'),
              href: buildDocLink(i18n.language, '/user-guide/get-started/'),
            },
            {
              text: t('info:summary.archOfSolution'),
              href: buildDocLink(
                i18n.language,
                '/architecture-overview/architecture/'
              ),
            },
          ]}
        />
      }
      content={<HomeContent />}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.Home.path} />}
      navigationWidth={290}
    />
  );
};

export default Home;
