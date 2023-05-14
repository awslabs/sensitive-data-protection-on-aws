import React, { useEffect, useState, memo } from 'react';
import moment from 'moment';
import {
  Table,
  Box,
  Header,
  Pagination,
  CollectionPreferences,
  Popover,
} from '@cloudscape-design/components';
import CommonBadge from 'pages/common-badge';
import DetailModal from './DetailModal';
import {
  BADGE_TYPE,
  CLSAAIFIED_TYPE,
  PRIVARY_TYPE_INT_DATA,
} from 'pages/common-badge/types/badge_type';
import ResourcesFilter from 'pages/resources-filter';
import {
  S3_COLUMN_LIST,
  DATA_TYPE,
  RDS_COLUMN_LIST,
  COLUMN_OBJECT_STR,
  S3_FILTER_COLUMN,
  RDS_FILTER_COLUMN,
  COLUMN_WIDTH,
} from '../types/data_config';
import { DATA_TYPE_ENUM, TABLE_NAME } from 'enum/common_types';
import {
  getDataBaseByType,
  getDataBaseByIdentifier,
} from 'apis/data-catalog/api';
import '../style.scss';
import { formatSize, useDidUpdateEffect } from 'tools/tools';
import { useSearchParams } from 'react-router-dom';
import IdentifierFilterTag from './IdentifierFilterTag';
import { nFormatter } from 'ts/common';

/**
 * S3/RDS CatalogList componment
 */
const CatalogList: React.FC<any> = memo((props: any) => {
  const { catalogType = DATA_TYPE_ENUM.s3 } = props;
  const [searchParams] = useSearchParams();
  const urlCatalog = searchParams.get('catalogId');
  const urlAccountId = searchParams.get('accountId');
  const urlPrivacy = searchParams.get('privacy');
  const urlIdentifiers = searchParams.get('identifiers');
  const columnList =
    catalogType === DATA_TYPE_ENUM.s3 ? S3_COLUMN_LIST : RDS_COLUMN_LIST;
  const [pageData, setPageData] = useState([] as any);
  // by page config
  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
    visibleContent: columnList.map((o) => o.id),
  } as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedItems, setSelectedItems] = useState([] as any);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectRowData, setSelectRowData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(!urlIdentifiers);
  const tableTitle = `Data catalog: ${
    (DATA_TYPE as any)[catalogType] || DATA_TYPE.rds
  }`;

  const getDefaultSearchParam = () => {
    const resultList = [];
    if (urlCatalog) {
      resultList.push({
        propertyKey: COLUMN_OBJECT_STR.DatabaseName,
        value: urlCatalog,
        operator: '=',
      });
    }
    if (urlAccountId) {
      resultList.push({
        propertyKey: COLUMN_OBJECT_STR.AccountId,
        value: urlAccountId,
        operator: '=',
      });
    }
    if (urlPrivacy) {
      resultList.push({
        propertyKey: COLUMN_OBJECT_STR.Privacy,
        value: PRIVARY_TYPE_INT_DATA[urlPrivacy],
        operator: '=',
      });
    }

    return resultList;
  };

  const [query, setQuery] = useState({
    tokens: getDefaultSearchParam(),
    operation: 'and',
  } as any);

  const TableName = TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION;

  const filterColumn =
    catalogType === DATA_TYPE_ENUM.s3 ? S3_FILTER_COLUMN : RDS_FILTER_COLUMN;

  const resourcesFilterProps = {
    totalCount,
    columnList: filterColumn.filter((i) => i.filter),
    tableName: TableName,
    query,
    setQuery,
    filteringPlaceholder: 'Filter data catalogs',
  };

  // onload data
  useEffect(() => {
    getPageData();
  }, []);

  // change page data
  useDidUpdateEffect(() => {
    getPageData();
  }, [currentPage, preferences.pageSize]);

  useDidUpdateEffect(() => {
    setCurrentPage(1);
    getPageData();
  }, [query]);

  useDidUpdateEffect(() => {
    setCurrentPage(1);
    getPageData();
  }, [showFilter]);

  // click single select show detail
  useDidUpdateEffect(() => {
    if (selectedItems.length === 1) {
      !showDetailModal && clickRowName(selectedItems[0]);
    }
  }, [selectedItems]);

  const updateFatherPage = () => {
    getPageData();
  };

  const getPageData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: '',
      asc: true,
      conditions: [
        {
          column: 'database_type',
          values: [catalogType],
          condition: 'and',
        },
      ] as any,
    };
    query.tokens &&
      query.tokens.forEach((item: any) => {
        const searchValues =
          item.propertyKey === COLUMN_OBJECT_STR.Privacy
            ? PRIVARY_TYPE_INT_DATA[item.value]
            : item.value;
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${searchValues}`],
          condition: query.operation,
        });
      });

    if (urlIdentifiers && !showFilter) {
      requestParam.conditions.push({
        column: COLUMN_OBJECT_STR.Identifiers,
        values: [urlIdentifiers],
        condition: 'and',
      });
    }
    const queryResult =
      urlIdentifiers && !showFilter
        ? await getDataBaseByIdentifier(requestParam)
        : await getDataBaseByType(requestParam);

    setPageData((queryResult as any)?.items);
    setTotalCount(queryResult ? (queryResult as any).total : 0);
    setIsLoading(false);
  };

  // show bucket detail dialog
  const clickRowName = (selectedRowData: any) => {
    const tempData = {
      ...selectedRowData,
      name: selectedRowData[columnList[0].id],
    };
    setSelectedItems([selectedRowData]);
    setSelectRowData(tempData);
    setShowDetailModal(true);
    return;
  };

  const modalProps = {
    showDetailModal,
    setShowDetailModal,
    catalogType,
    selectRowData,
    setSelectRowData,
    updateFatherPage,
  };

  return (
    <>
      <Table
        variant="embedded"
        className="no-shadow-list"
        // resizableColumns
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems)
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
        selectionType="single"
        columnDefinitions={
          columnList.map((item) => {
            return {
              id: item.id,
              header: item.label,
              // different column tag
              cell: (e: any) => {
                if (item.id === COLUMN_OBJECT_STR.DatabaseName) {
                  return (
                    <div
                      className="bucket-name"
                      onClick={() => clickRowName(e)}
                    >
                      {(e as any)[item.id]}
                    </div>
                  );
                }
                if (item.id === COLUMN_OBJECT_STR.ObjectCount) {
                  return <div> {nFormatter((e as any)[item.id], 2)}</div>;
                }
                if (item.id === COLUMN_OBJECT_STR.Privacy) {
                  if (
                    (!(e as any)[item.id] && (e as any)[item.id] !== 0) ||
                    (e as any)[item.id] === 'N/A' ||
                    ((e as any)[item.id] &&
                      (e as any)[item.id].toString() ===
                        PRIVARY_TYPE_INT_DATA['N/A'])
                  ) {
                    return 'N/A';
                  }
                  return (
                    <CommonBadge
                      badgeType={BADGE_TYPE.Privacy}
                      badgeLabel={(e as any)[item.id]}
                    />
                  );
                }

                if (item.id === COLUMN_OBJECT_STR.Labels) {
                  let hasMore = false;
                  if (e.labels?.length > 1) {
                    hasMore = true;
                  }
                  return e.labels?.length > 0 ? (
                    <div className="flex">
                      <span className="custom-badge label mr-5">
                        {e.labels?.[0]?.label_name}
                      </span>
                      {hasMore && (
                        <Popover
                          dismissButton={false}
                          position="top"
                          size="small"
                          triggerType="custom"
                          content={
                            <div>
                              {e.labels.map((label: any) => {
                                return (
                                  <span
                                    key={label.id}
                                    className="custom-badge label mr-5 mb-2"
                                  >
                                    {label.label_name}
                                  </span>
                                );
                              })}
                            </div>
                          }
                        >
                          <span className="custom-badge more">{`+${
                            e.labels?.length - 1
                          }`}</span>
                        </Popover>
                      )}
                    </div>
                  ) : (
                    ''
                  );
                }

                if (item.id === COLUMN_OBJECT_STR.LastModifyBy) {
                  if ((e as any)[item.id] === 'SDPS') {
                    return 'System';
                  }
                  return (e as any)[item.id];
                }
                if (item.id === COLUMN_OBJECT_STR.Classifiedby) {
                  return (
                    <CommonBadge
                      badgeType={BADGE_TYPE.Classified}
                      badgeLabel={
                        (e as any)[COLUMN_OBJECT_STR.LastModifyBy]
                          ? (e as any)[COLUMN_OBJECT_STR.LastModifyBy] ===
                            CLSAAIFIED_TYPE.System
                            ? CLSAAIFIED_TYPE.System
                            : CLSAAIFIED_TYPE.Manual
                          : CLSAAIFIED_TYPE.SystemMark
                      }
                    />
                  );
                }
                if (item.id === COLUMN_OBJECT_STR.LastModifyAt) {
                  return moment((e as any)[item.id])
                    .add(8, 'h')
                    .format('YYYY-MM-DD HH:mm');
                }
                if (item.id === COLUMN_OBJECT_STR.Size) {
                  return formatSize((e as any)[item.id]);
                }

                return (e as any)[item.id];
              },
              minWidth: COLUMN_WIDTH[item.id],
            };
          }) as any
        }
        items={pageData}
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
          <>
            {(!urlIdentifiers || showFilter) && (
              <ResourcesFilter {...resourcesFilterProps} />
            )}
            {urlIdentifiers && !showFilter && (
              <IdentifierFilterTag
                identifiers={urlIdentifiers}
                setShowFilter={setShowFilter}
              />
            )}
          </>
        }
        header={
          <Header counter={`(${totalCount})`} className="continer-header">
            {tableTitle}
          </Header>
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
      />
      {showDetailModal && <DetailModal {...modalProps} />}
    </>
  );
});

export default CatalogList;
