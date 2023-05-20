import {
  AppLayout,
  Button,
  Container,
  Header,
  Tabs,
} from '@cloudscape-design/components';
import React, { useState } from 'react';
import './style.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { useTranslation } from 'react-i18next';
import IdentifierTable from './tables/IdentifierTable';

const TemplateIdentifiersHeader: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Header
      variant="h1"
      description="Data identifiers are the rules to discover sensitive data. "
      actions={
        <Button onClick={() => navigate(RouterEnum.Datatemplate.path)}>
          {t('button.defineTemplate')}
        </Button>
      }
    >
      Manage data identifiers
    </Header>
  );
};

const TemplateIdentifiers: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    tabState = {
      active: 'builtIn',
    },
  } = location.state || {};
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.manageIdentifier'),
      href: RouterEnum.TemplateIdentifiers.path,
    },
  ];
  const [activeTab, setActiveTab] = useState(tabState.active);
  return (
    <AppLayout
      contentHeader={<TemplateIdentifiersHeader />}
      content={
        <Container>
          <Tabs
            activeTabId={activeTab}
            onChange={(e) => {
              // Clear the state after
              navigate(location.pathname, { replace: true });
              setActiveTab(e.detail.activeTabId);
            }}
            tabs={[
              {
                label: 'Built-in data identifiers',
                id: 'builtIn',
                content: (
                  <IdentifierTable title="Built-in data identifiers" type={0} />
                ),
              },
              {
                label: 'Custom data identifiers',
                id: 'custom',
                content: (
                  <IdentifierTable title="Custom data identifiers" type={1} />
                ),
              },
            ]}
          />
        </Container>
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={
        <Navigation activeHref={RouterEnum.TemplateIdentifiers.path} />
      }
      navigationWidth={290}
    />
  );
};

export default TemplateIdentifiers;
