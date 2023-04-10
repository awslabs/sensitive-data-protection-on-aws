import {
  AppLayout,
  Box,
  Button,
  CollectionPreferences,
  Header,
  Pagination,
  SpaceBetween,
  Table,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import './style.scss';
import ResourcesFilter from 'pages/resources-filter';
import { IDENTIFIER_COLUMN_LIST } from './types/identifiers_type';
import { deleteIdentifiers, getIdentifiersList } from 'apis/data-template/api';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import { alertMsg, useDidUpdateEffect } from 'tools/tools';
import TemplateDelete from 'pages/template-delete';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { TABLE_NAME } from 'enum/common_types';

const TemplateIdentifiersHeader: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Header
      variant="h1"
      description="Data identifiers are the rules to discover sensitive data. "
      actions={
        <Button onClick={() => navigate(RouterEnum.Datatemplate.path)}>
          Define classification template
        </Button>
      }
    >
      Manage data identifiers
    </Header>
  );
};

const TemplateIdentifiersContent = () => {
  const navigate = useNavigate();

  const columnList = IDENTIFIER_COLUMN_LIST;

  const [totalCount, setTotalCount] = useState(0);
  const [pageData, setPageData] = useState([] as any);
  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
    visibleContent: columnList.map((o) => o.id),
  } as any);
  const [selectedItems, setSelectedItems] = useState([] as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isShowDelete, setIsShowDelete] = useState(false);
  const [showErrorTips, setShowErrorTips] = useState({
    template: false,
    catalog: false,
  });
  const [query, setQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);
  const resourcesFilterProps = {
    totalCount,
    columnList: columnList.filter((i) => i.filter),
    query,
    setQuery,
    tableName: TABLE_NAME.TEMPLATE_IDENTIFIER,
    filteringPlaceholder: 'Filter data identifiers',
  };

  const confirmDelete = async () => {
    const requestParam = {
      id: selectedItems[0].id,
    };
    try {
      await deleteIdentifiers(requestParam);
      setIsShowDelete(false);
      alertMsg('Delete success', 'success');
      getPageData();
    } catch (error: any) {
      if (error) {
        if (!error.ref || error.ref.length === 0) {
          alertMsg(error.message, 'error');
          return;
        }
        setShowErrorTips({
          template: error.ref.filter((i: any) => i === 'template').length > 0,
          catalog:
            error.ref.filter((i: any) => i === 's3' || i === 'rds').length > 0,
        });
      }
    }
    return;
  };

  useEffect(() => {
    isShowDelete &&
      setShowErrorTips({
        template: false,
        catalog: false,
      });
  }, [isShowDelete]);

  const deleteModalProps = {
    isShowDelete,
    setIsShowDelete,
    confirmDelete,
    showErrorTips,
  };

  const clkDelete = async () => {
    if (!selectedItems || selectedItems.length === 0) {
      alertMsg('Please select one', 'error');
      return;
    }
    setIsShowDelete(true);
  };

  const clkCreate = () => {
    navigate(RouterEnum.CreateIdentifiers.path);
    return;
  };

  useEffect(() => {
    getPageData();
  }, []);

  useDidUpdateEffect(() => {
    getPageData();
  }, [currentPage, preferences.pageSize]);

  useDidUpdateEffect(() => {
    setCurrentPage(1);
    getPageData();
  }, [query]);

  const getPageData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: '',
      asc: false,
      conditions: [] as any,
    };
    query.tokens &&
      query.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          condition: 'and',
        });
      });
    const result: any = await getIdentifiersList(requestParam);
    setPageData(result.items);
    setTotalCount(result.total);
    setIsLoading(false);
  };
  const clkIdentifier = (rowData: any) => {
    navigate(RouterEnum.CreateIdentifiers.path, {
      state: { oldData: rowData },
    });
    return;
  };

  return (
    <SpaceBetween
      direction="vertical"
      size="xl"
      className="identifier-container"
    >
      <Table
        items={pageData}
        selectedItems={selectedItems}
        resizableColumns
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems)
        }
        isItemDisabled={(item) => item.type === '0' || item.type === 0}
        ariaLabels={{
          selectionGroupLabel: 'Items selection',
          allItemsSelectionLabel: ({ selectedItems }) =>
            `${selectedItems.length} ${
              selectedItems.length === 1 ? 'item' : 'items'
            } selected`,
          itemSelectionLabel: ({ selectedItems }, item) => {
            const isItemSelected = selectedItems.filter(
              (i) =>
                (i as any)[columnList[0].id] === (item as any)[columnList[0].id]
            ).length;
            return `${(item as any)[columnList[0].id]} is ${
              isItemSelected ? '' : 'not'
            } selected`;
          },
        }}
        selectionType="single"
        columnDefinitions={columnList.map((item) => {
          return {
            id: item.id,
            header: item.label,
            maxWidth: '45%',
            cell: (e: any) => {
              if (item.id === 'name') {
                return (
                  <span
                    onClick={() => clkIdentifier(e)}
                    className="identifier-name"
                  >
                    {(e as any)[item.id]}
                  </span>
                );
              } else {
                return (e as any)[item.id];
              }
            },
          };
        })}
        header={
          <>
            <Header
              variant="h2"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={clkDelete}
                    disabled={selectedItems.length === 0}
                    loading={isLoading}
                  >
                    Delete
                  </Button>
                  <Button onClick={clkCreate} disabled={isLoading}>
                    Create data identifier
                  </Button>
                </SpaceBetween>
              }
              counter={`(${totalCount})`}
            >
              Data identifiers
            </Header>
          </>
        }
        loadingText="Loading resources"
        visibleColumns={preferences.visibleContent}
        empty={
          <Box textAlign="center" color="inherit">
            <b>No resources</b>
            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
              No resources to display.
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
              nextPageLabel: 'Next page',
              previousPageLabel: 'Previous page',
              pageLabel: (pageNumber) => `Page ${pageNumber} of all pages`,
            }}
          />
        }
        preferences={
          <CollectionPreferences
            onConfirm={({ detail }) => setPreferences(detail)}
            preferences={preferences}
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            pageSizePreference={{
              title: 'Select page size',
              options: [
                { value: 10, label: '10 resources' },
                { value: 20, label: '20 resources' },
                { value: 50, label: '50 resources' },
                { value: 100, label: '100 resources' },
              ],
            }}
            visibleContentPreference={{
              title: 'Select visible content',
              options: [
                {
                  label: 'Main distribution properties',
                  options: columnList,
                },
              ],
            }}
          />
        }
        loading={isLoading}
      />
      <TemplateDelete {...deleteModalProps} />
    </SpaceBetween>
  );
};

const TemplateIdentifiers: React.FC = () => {
  const breadcrumbItems = [
    { text: 'Sensitive Data Protection Solution', href: RouterEnum.Home.path },
    {
      text: 'Manage data identifiers',
      href: RouterEnum.TemplateIdentifiers.path,
    },
  ];
  return (
    <AppLayout
      contentHeader={<TemplateIdentifiersHeader />}
      content={<TemplateIdentifiersContent />}
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
