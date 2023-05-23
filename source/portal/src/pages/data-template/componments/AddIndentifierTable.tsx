import React, { useEffect, useState } from 'react';
import '../style.scss';
import {
  Box,
  Button,
  CollectionPreferences,
  Header,
  Pagination,
  SelectProps,
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
import PropsSelect from 'common/PropsSelect';
import { Props } from 'common/PropsModal';

const AddIdentfierTable = (props: any) => {
  const { addCallBack, type } = props;
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
  const [searchSelectedCategory, setSearchSelectedCategory] =
    useState<SelectProps.Option | null>(null);
  const [searchSelectedLabel, setSearchSelectedLabel] =
    useState<SelectProps.Option | null>(null);

  const resourcesFilterProps = {
    totalCount,
    // columnList: columnList.filter((i) => i.filter),
    columnList: [],
    query,
    setQuery,
    tableName: TABLE_NAME.TEMPLATE_IDENTIFIER,
    filteringPlaceholder: 'Filter by name or description',
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
  }, [query, searchSelectedCategory, searchSelectedLabel]);

  const getPageData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      conditions: [
        {
          column: 'type',
          values: [type],
          condition: 'and',
          operation: ':',
        },
      ] as any,
    };
    query.tokens &&
      query.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          condition: query.operation,
        });
      });
    if (searchSelectedCategory?.value) {
      requestParam.conditions.push({
        column: 'props',
        values: [`${searchSelectedCategory?.value}`],
        condition: 'and',
        operation: ':',
      });
    }

    if (searchSelectedLabel?.value) {
      requestParam.conditions.push({
        column: 'props',
        values: [`${searchSelectedLabel?.value}`],
        condition: 'and',
        operation: ':',
      });
    }
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
          return `${(item as any)[columnList[0].id]} ${t('table.is')} ${
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
            if (item.id === 'category') {
              return (
                <div>
                  {e.props?.find(
                    (prop: Props) => prop.prop_type?.toString() === '1'
                  )?.prop_name || 'N/A'}
                </div>
              );
            } else if (item.id === 'label') {
              return (
                <div>
                  {e.props?.find(
                    (prop: Props) => prop.prop_type?.toString() === '2'
                  )?.prop_name || 'N/A'}
                </div>
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
            counter={`(${totalCount})`}
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
      filter={
        <div className="flex-1 flex gap-10">
          <div className="flex-2">
            <ResourcesFilter {...resourcesFilterProps} />
          </div>
          <div className="flex-1">
            <PropsSelect
              isSearch
              type="1"
              selectOption={searchSelectedCategory}
              changeSelectValue={(option) => {
                setSearchSelectedCategory(option);
              }}
            />
          </div>
          <div className="flex-1">
            <PropsSelect
              isSearch
              type="2"
              selectOption={searchSelectedLabel}
              changeSelectValue={(option) => {
                setSearchSelectedLabel(option);
              }}
            />
          </div>
        </div>
      }
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

export default AddIdentfierTable;
