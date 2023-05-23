import {
  AppLayout,
  Button,
  Container,
  ContentLayout,
  Header,
} from '@cloudscape-design/components';
import React from 'react';
import Overview from './comps/Overview';
import Charts from './comps/Charts';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { RouterEnum } from 'routers/routerEnum';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
  return (
    <ContentLayout>
      <Container
        header={<Header variant="h2">Get started</Header>}
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
        <Overview />
      </div>
      <div className="mt-20">
        <Charts />
      </div>
    </ContentLayout>
  );
};

const Home: React.FC = () => {
  const { t } = useTranslation();
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
      contentHeader={<HomeHeader />}
      content={<HomeContent />}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.Home.path} />}
      navigationWidth={290}
    />
  );
};

export default Home;
