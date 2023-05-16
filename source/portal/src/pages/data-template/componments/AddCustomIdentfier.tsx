import React, { useEffect, useState } from 'react';
import '../style.scss';
import {
  Box,
  Button,
  CollectionPreferences,
  Header,
  Pagination,
  Table,
} from '@cloudscape-design/components';
import { IDENTIFIER_COLUMN_LIST } from 'pages/template-identifiers/types/identifiers_type';
import ResourcesFilter from 'pages/resources-filter';
import {
  addMappingsToTemplate,
  getIdentifiersList,
  getIndentifierInTemplate,
} from 'apis/data-template/api';
import { TABLE_NAME } from 'enum/common_types';
import { alertMsg, useDidUpdateEffect } from 'tools/tools';
import { useTranslation } from 'react-i18next';

const AddCustomIdentfier = (props: any) => {
  const { addCallBack } = props;
  const columnList = IDENTIFIER_COLUMN_LIST;
  const { t } = useTranslation();
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
  const [inUseIdentifiers, setInUseIdentifiers] = useState([] as any);
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

  useEffect(() => {
    Promise.all([getPageData(), getIdentifierInUse()]);
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
      conditions: [] as any,
    };
    query.tokens &&
      query.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          condition: query.operation,
        });
      });
    const result: any = await getIdentifiersList(requestParam);
    setPageData(result.items);
    setTotalCount(result.total);
    setIsLoading(false);
  };

  const clkAdd = async () => {
    if (!selectedItems || selectedItems.length === 0) {
      alertMsg('Please select one', 'error');
      return;
    }
    setIsLoading(true);
    const promiseList: any[] = [];
    selectedItems.forEach((item: { id: any }) => {
      const requestParam = {
        template_id: 1,
        identifier_id: item.id,
        status: 1,
      };
      promiseList.push(addMappingsToTemplate(requestParam));
    });
    Promise.all(promiseList)
      .then((res) => {
        if (res && res.length === promiseList.length) {
          alertMsg('Add successful', 'success');
        } else {
          alertMsg('Not all succeeded', 'warning');
        }

        addCallBack();
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getIdentifierInUse = async () => {
    const result: any = await getIndentifierInTemplate();
    setInUseIdentifiers(result);
  };

  return (
    <Table
      items={pageData}
      selectedItems={selectedItems}
      onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
      resizableColumns
      isItemDisabled={(item) =>
        inUseIdentifiers.filter((inUse: any) => inUse === item.id).length > 0
      }
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
      selectionType="multi"
      columnDefinitions={columnList.map((item) => {
        return {
          id: item.id,
          header: item.label,
          cell: (e: any) => {
            return (e as any)[item.id];
          },
        };
      })}
      header={
        <>
          <Header
            variant="h2"
            actions={
              <Button onClick={clkAdd} disabled={isLoading}>
                {t('button.addToTemplate')}
              </Button>
            }
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
      variant="embedded"
    />
  );
};

export default AddCustomIdentfier;
