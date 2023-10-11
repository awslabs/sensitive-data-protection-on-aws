import {
  AppLayout,
  Button,
  Container,
  ContentLayout,
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
import HelpInfo from 'common/HelpInfo';
import { buildDocLink } from 'ts/common';

const TemplateIdentifiersHeader: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Header
      variant="h1"
      description={t('template:manageDataIdentifierDesc')}
      actions={
        <Button onClick={() => navigate(RouterEnum.Datatemplate.path)}>
          {t('button.defineTemplate')}
        </Button>
      }
    >
      {t('template:manageDataIdentifier')}
    </Header>
  );
};

const TemplateIdentifiers: React.FC = () => {
  const { t, i18n } = useTranslation();
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
      tools={
        <HelpInfo
          title={t('breadcrumb.manageIdentifier')}
          description={t('info:identifier.desc')}
          linkItems={[
            {
              text: t('info:identifier.howToCreate'),
              href: buildDocLink(
                i18n.language,
                '/user-guide/data-identifiers/'
              ),
            },
            {
              text: t('info:identifier.builtInList'),
              href: buildDocLink(
                i18n.language,
                '/user-guide/appendix-built-in-identifiers/'
              ),
            },
          ]}
        />
      }
      content={
        <ContentLayout disableOverlap header={<TemplateIdentifiersHeader />}>
          <div className="mt-20">
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
                    label: t('template:builtInIdentifier'),
                    id: 'builtIn',
                    content: (
                      <IdentifierTable
                        title={t('template:builtInIdentifier')}
                        type={0}
                      />
                    ),
                  },
                  {
                    label: t('template:customIdentifier'),
                    id: 'custom',
                    content: (
                      <IdentifierTable
                        title={t('template:customIdentifier')}
                        type={1}
                      />
                    ),
                  },
                ]}
              />
            </Container>
          </div>
        </ContentLayout>
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
