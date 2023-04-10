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

const HomeHeader: React.FC = () => {
  return (
    <Header variant="h1" description="">
      Summary
    </Header>
  );
};

const HomeContent: React.FC = () => {
  const navigate = useNavigate();

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
            <div>
              STEP1: Connect to data source. Onboard AWS accounts and create
              data catalogs for data source (e.g. S3, RDS).
            </div>
            <div className="mt-20">
              <Button
                onClick={() => navigate(RouterEnum.AccountManagement.path)}
              >
                Connect to data source
              </Button>
            </div>
          </div>
          <div
            className="flex-v justify-spacebetween"
            style={{ minWidth: 220 }}
          >
            <div>
              STEP2: Browse data catalogs. Data catalog is a repository of
              metadata of data source.
            </div>
            <div className="mt-20">
              <Button onClick={() => navigate(RouterEnum.Catalog.path)}>
                Browse data catalogs
              </Button>
            </div>
          </div>
          <div
            className="flex-v justify-spacebetween"
            style={{ minWidth: 250 }}
          >
            <div>
              STEP3: Define classification template by selecting a collection of
              data identifiers. Data identifiers are rules to inspect data.
            </div>
            <div className="mt-20">
              <Button onClick={() => navigate(RouterEnum.Datatemplate.path)}>
                Define classification template
              </Button>
            </div>
          </div>
          <div
            className="flex-v justify-spacebetween"
            style={{ minWidth: 270 }}
          >
            <div>
              STEP4: Create and run discovery jobs using defined classification
              template. The job automatically labels sensitive data in data
              catalog.
            </div>
            <div className="mt-20">
              <Button onClick={() => navigate(RouterEnum.Datajob.path)}>
                Run sensitive data discovery jobs
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
  const breadcrumbItems = [
    {
      text: 'Sensitive Data Protection Solution',
      href: RouterEnum.Home.path,
    },
    {
      text: 'Summary',
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
