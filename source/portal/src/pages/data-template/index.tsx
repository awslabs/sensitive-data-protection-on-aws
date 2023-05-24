import {
  AppLayout,
  Box,
  Button,
  CollectionPreferences,
  Container,
  Header,
  Pagination,
  SpaceBetween,
  Table,
  Tabs,
  Toggle,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import './style.scss';
import CommonBadge from 'pages/common-badge';
import { BADGE_TYPE, PRIVARY_TYPE } from 'pages/common-badge/types/badge_type';
import { TEMPLATE_COLUMN_LIST } from './types/template_type';
import ResourcesFilter from 'pages/resources-filter';
import {
  getTemplateMappingList,
  deleteTemplateMapping,
  updateTemplateMapping,
  getTemplateUpdateTime,
} from 'apis/data-template/api';
import {
  alertMsg,
  deepClone,
  showHideSpinner,
  useDidUpdateEffect,
} from 'tools/tools';
import { OptionDefinition } from '@cloudscape-design/components/internal/components/option/interfaces';
import TemplateDelete from 'pages/template-delete';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import RightModal from 'pages/right-modal';
import AddCustomIdentfier from './componments/AddCustomIdentfier';
import { TABLE_NAME } from 'enum/common_types';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';

const DataTemplateHeader: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Header
      variant="h1"
      description={t('template:defineClassificationDesc')}
      actions={
        <Button onClick={() => navigate(RouterEnum.TemplateIdentifiers.path)}>
          {t('button.manageDataIdentifiers')}
        </Button>
      }
    >
      {t('template:defineClassification')}
    </Header>
  );
};

const DEFAULT_QUERY = {
  tokens: [],
  operation: 'and',
};

const buildTimeFormat = (dateString: string) => {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  const hour = dateString.substring(8, 10);
  const minute = dateString.substring(10, 12);
  const second = dateString.substring(12, 14);
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const DataTemplateContent: React.FC<any> = (props: any) => {
  const columnList = TEMPLATE_COLUMN_LIST;
  const { t } = useTranslation();
  const [totalCount, setTotalCount] = useState(0);
  const [pageData, setPageData] = useState([] as any);
  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
    visibleContent: columnList.map((o) => o.id),
  } as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([] as any[]);
  const [toggleEnable, setToggleEnable] = useState({} as any);
  const [query, setQuery] = useState(DEFAULT_QUERY as any);
  const [isShowDelete, setIsShowDelete] = useState(false);
  const [showAddCustomIdentfier, setShowAddCustomIdentfier] = useState(false);
  const resourcesFilterProps = {
    totalCount,
    columnList: columnList.filter((i) => i.filter),
    query,
    setQuery,
    tableName: TABLE_NAME.TEMPLATE_IDENTIFIER,
    filteringPlaceholder: t('template:filterDataIndentifier'),
  };

  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [curSortColumn, setCurSortColumn] = useState<any>('');
  const [isDescending, setIsDescending] = useState(false);

  useEffect(() => {
    getPageData();
  }, []);

  useDidUpdateEffect(() => {
    getPageData();
  }, [currentPage, preferences.pageSize]);

  useDidUpdateEffect(() => {
    setCurrentPage(1);
    getPageData();
  }, [query, isDescending, curSortColumn]);

  const getPageData = async () => {
    setIsLoading(true);
    try {
      getUpdateTime();
      const requestParam = {
        page: currentPage,
        size: preferences.pageSize,
        sort_column: curSortColumn.id,
        asc: !isDescending,
        conditions: [
          {
            column: 'template_id',
            values: ['1'],
            condition: 'and',
          },
        ] as any,
      };
      query.tokens &&
        query.tokens.forEach((item: any) => {
          requestParam.conditions.push({
            column: item.propertyKey,
            values: [`${item.value}`],
            operation: item.operator,
            condition: 'and',
          });
        });
      const result: any = await getTemplateMappingList(requestParam);
      setPageData(result.items);
      const tempTogData: any = {};
      result.items.forEach((itemData: { id: string | number; status: any }) => {
        tempTogData[itemData.id] = !!itemData.status;
      });
      setSelectedItems([]);
      setToggleEnable(tempTogData);
      setTotalCount(result.total);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const getUpdateTime = async () => {
    try {
      const result: any = await getTemplateUpdateTime();
      if (result && result.length > 10) {
        setLastUpdateTime(buildTimeFormat(result));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const setToggleChecked = async (checked: boolean, rowData: any) => {
    const tempToggle = deepClone(toggleEnable);
    tempToggle[rowData.id] = checked;
    setToggleEnable(tempToggle);
    const requestParam = {
      id: rowData.id,
      template_id: 1,
      identifier_id: rowData.identifier_id,
      status: checked ? 1 : 0,
    };
    const result = await updateTemplateMapping(requestParam);
    if (!result) {
      alertMsg(t('changeEnableError'), 'error');
    }
  };

  const confirmDelete = async () => {
    const requestParam = {
      id: selectedItems[0].id,
    };
    showHideSpinner(true);
    try {
      await deleteTemplateMapping(requestParam);
      alertMsg(t('deleteSuccess'), 'success');
      showHideSpinner(false);
      getPageData();
    } catch (error) {
      showHideSpinner(false);
    }
  };

  const deleteModalProps = {
    isShowDelete,
    setIsShowDelete,
    confirmDelete,
    title: t('template:removeDataIdentifier'),
    confirmText: t('button.remove'),
  };

  const clkDelete = async (selectedOption: string | OptionDefinition) => {
    if (selectedOption !== 'delete') {
      return;
    }
    if (!selectedItems || selectedItems.length === 0) {
      alertMsg(t('selectOneItem'), 'error');
      return;
    }
    setIsShowDelete(true);
  };

  const clkAddDataIdentifier = () => {
    setShowAddCustomIdentfier(true);
    return;
  };

  const addCallBack = () => {
    setShowAddCustomIdentfier(false);
    setQuery(DEFAULT_QUERY);
    setCurrentPage(1);
    getPageData();
  };

  return (
    <SpaceBetween direction="vertical" size="xl" className="mapping-container">
      <Container
        header={<Header variant="h2">{t('template:howItWorks')}</Header>}
        className="template-container"
      >
        <span className="template-container-title">
          {t('template:defineTmplPrivacy')}
        </span>
        <br></br>
        <p>
          {t('template:platFormWillLabel')}&nbsp;&nbsp;
          <CommonBadge
            badgeType={BADGE_TYPE.Privacy}
            badgeLabel={PRIVARY_TYPE.ContainsPII}
          />
          &nbsp;&nbsp;{t('template:dataMatches')}
        </p>
        <p>
          {t('template:platFormWillLabel')}&nbsp;&nbsp;
          <CommonBadge
            badgeType={BADGE_TYPE.Privacy}
            badgeLabel={PRIVARY_TYPE.NonPII}
          />
          &nbsp;&nbsp; {t('template:dataScaned')}
        </p>
        <p> {t('template:dataNeverScanned')}</p>
      </Container>
      <Table
        className="template-table"
        selectionType="single"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems)
        }
        resizableColumns
        ariaLabels={{
          selectionGroupLabel: t('table.itemsSelection') || '',
          allItemsSelectionLabel: ({ selectedItems }) =>
            `${selectedItems.length} ${
              selectedItems.length === 1 ? t('table.item') : t('table.items')
            } ${t('table.selected')}`,
          itemSelectionLabel: ({ selectedItems }, item) => {
            const isItemSelected = selectedItems.filter(
              (i) =>
                (i as any)[columnList[0].id] === (item as any)[columnList[0].id]
            ).length;
            return `${(item as any)[columnList[0].id]} ${t('table.is')} ${
              isItemSelected ? '' : t('table.not')
            } ${t('table.selected')}`;
          },
        }}
        items={pageData}
        sortingColumn={curSortColumn}
        sortingDescending={isDescending}
        onSortingChange={(e) => {
          setCurSortColumn(e.detail.sortingColumn);
          setIsDescending(e.detail.isDescending || false);
        }}
        columnDefinitions={columnList.map((item) => {
          return {
            id: item.id,
            header: t(item.label),
            sortingField: item.sortingField,
            cell: (e: any) => {
              if (item.id === 'type') {
                if ((e as any)[item.id] === 0) {
                  return 'Built-in';
                } else {
                  return 'Custom';
                }
              }
              if (item.id === 'enabled') {
                return (
                  <Toggle
                    onChange={({ detail }) =>
                      setToggleChecked(detail.checked, e)
                    }
                    checked={!!toggleEnable[e.id]}
                  ></Toggle>
                );
              }
              return (e as any)[item.id];
            },
          };
        })}
        header={
          <>
            <Header
              variant="h2"
              description={t('template:dataIdentifierInThisTmplDesc')}
              counter={`(${totalCount})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <span className="description">
                    <b>
                      {t('template:lastUpdated')}
                      <br />
                      {lastUpdateTime}
                    </b>
                  </span>
                  <Button
                    onClick={getPageData}
                    loading={isLoading}
                    iconName="refresh"
                  />
                  <Button
                    onClick={() => clkDelete('delete')}
                    loading={isLoading}
                    disabled={selectedItems.length === 0}
                  >
                    {t('button.remove')}
                  </Button>
                  <Button onClick={clkAddDataIdentifier}>
                    {t('button.addDataIdentifier')}
                  </Button>
                </SpaceBetween>
              }
            >
              {t('template:dataIdentifierInThisTmpl')}
            </Header>
          </>
        }
        loadingText={t('table.loadingResources') || ''}
        visibleColumns={preferences.visibleContent}
        empty={
          <Box textAlign="center" color="inherit">
            <b>{t('table.noResources')}</b>
            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
              {t('table.noResourcesDisplay')}
            </Box>
          </Box>
        }
        filter={<ResourcesFilter {...resourcesFilterProps} />}
        pagination={
          <Pagination
            currentPageIndex={currentPage}
            onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
            pagesCount={Math.ceil(totalCount / preferences.pageSize)}
            ariaLabels={{
              nextPageLabel: t('table.nextPage') || '',
              previousPageLabel: t('table.previousPage') || '',
              pageLabel: (pageNumber) =>
                `${t('table.pageLabel', { pageNumber: pageNumber })}`,
            }}
          />
        }
        preferences={
          <CollectionPreferences
            onConfirm={({ detail }) => setPreferences(detail)}
            preferences={preferences}
            title={t('table.preferences')}
            confirmLabel={t('table.confirm')}
            cancelLabel={t('table.cancel')}
            pageSizePreference={{
              title: t('table.selectPageSize'),
              options: [
                { value: 10, label: t('table.pageSize10') },
                { value: 20, label: t('table.pageSize20') },
                { value: 50, label: t('table.pageSize50') },
                { value: 100, label: t('table.pageSize100') },
              ],
            }}
            visibleContentPreference={{
              title: t('table.selectVisibleContent'),
              options: [
                {
                  label: t('table.mainDistributionProp'),
                  options: columnList,
                },
              ],
            }}
          />
        }
        loading={isLoading}
      />
      <TemplateDelete {...deleteModalProps} />
      <RightModal
        setShowModal={setShowAddCustomIdentfier}
        showModal={showAddCustomIdentfier}
        header={t('template:addDataIdentifier')}
        showFolderIcon={false}
      >
        <div className="add-identfier-modal">
          <AddCustomIdentfier addCallBack={addCallBack} />
        </div>
      </RightModal>
    </SpaceBetween>
  );
};

const DataTemplate: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.defineTemplate'),
      href: RouterEnum.Datatemplate.path,
    },
  ];

  return (
    <AppLayout
      contentHeader={<DataTemplateHeader />}
      content={
        <Tabs
          className="privacy-tab"
          tabs={[
            {
              label: t('privacy') || '',
              id: 'Privacy',
              content: <DataTemplateContent />,
            },
          ]}
        />
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.Datatemplate.path} />}
      navigationWidth={290}
    />
  );
};

export default DataTemplate;
