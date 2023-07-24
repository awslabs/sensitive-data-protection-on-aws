import React, { useState } from 'react';
import Tabs from '@cloudscape-design/components/tabs';
import CatalogList from './componments/CatalogList';
import { TAB_LIST } from 'enum/common_types';
import { useSearchParams } from 'react-router-dom';
import { getExportS3Url } from 'apis/data-catalog/api';
import './style.scss';
import {
  AppLayout,
  Button,
  Container,
  ContentLayout,
  Header,
} from '@cloudscape-design/components';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import HelpInfo from 'common/HelpInfo';
import { buildDocLink } from 'ts/common';
import { alertMsg } from 'tools/tools';

const CatalogListHeader: React.FC = () => {
  const { t } = useTranslation();
  // const [isLoading, setIsloading] = useState(false);

  const clkExportDataCatalog = async () => {
    // setIsloading(true);
    try {
      const result: any = await getExportS3Url({});
      // const result ="OOOK";
      if (result) {
        window.open(result, '_blank');
      } else {
        alertMsg(t('noReportFile'), 'error');
      }
    } catch {
      alertMsg(t('noReportFile'), 'error');
    }
    // setIsloading(false);
  };

  return (
    <Header variant="h1" 
      description={t('catalog:browserCatalogDesc')}
      actions={
        <Button onClick={() => clkExportDataCatalog()}>
          {t('button.exportDataCatalogs')}
        </Button>
      }
      >
      {t('catalog:browserCatalog')}
    </Header>
  );
};

const DataCatalogList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();

  const [activeTabId, setActiveTabId] = useState(
    searchParams.get('tagType') || TAB_LIST.S3.id
  );

  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    { text: t('breadcrumb.browserCatalog'), href: RouterEnum.Catalog.path },
  ];

  return (
    <AppLayout
      contentHeader={<CatalogListHeader />}
      tools={
        <HelpInfo
          title={t('breadcrumb.browserCatalog')}
          description={t('info:catalog.desc')}
          linkItems={[
            {
              text: t('info:catalog.catalogSync'),
              href: buildDocLink(
                i18n.language,
                '/user-guide/data-catalog-sync/'
              ),
            },
            {
              text: t('info:catalog.useLabels'),
              href: buildDocLink(
                i18n.language,
                '/user-guide/data-catalog-labels/'
              ),
            },
          ]}
        />
      }
      content={
        <ContentLayout className="catalog-layout">
          <Container disableContentPaddings>
            <Tabs
              activeTabId={activeTabId}
              onChange={({ detail }) => setActiveTabId(detail.activeTabId)}
              tabs={[
                {
                  label: t(TAB_LIST.S3.label),
                  id: TAB_LIST.S3.id,
                  content: <CatalogList catalogType={TAB_LIST.S3.id} />,
                },
                {
                  label: t(TAB_LIST.RDS.label),
                  id: TAB_LIST.RDS.id,
                  content: <CatalogList catalogType={TAB_LIST.RDS.id} />,
                },
              ]}
            />
          </Container>
        </ContentLayout>
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.Catalog.path} />}
      navigationWidth={290}
    />
  );
};

export default DataCatalogList;
