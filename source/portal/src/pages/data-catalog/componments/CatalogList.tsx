import React, { useEffect, useState, memo } from 'react';
import moment from 'moment';
import {
  Table,
  Box,
  Header,
  Pagination,
  CollectionPreferences,
  Popover,
  SegmentedControl,
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
  TABLE_COLUMN,
  CATALOG_TABLE_FILTER_COLUMN,
} from '../types/data_config';
import {
  DATA_TYPE_ENUM,
  GLUE_VIEW,
  JDBC_VIEW,
  RDS_VIEW,
  TABLE_NAME,
} from 'enum/common_types';
import {
  getDataBaseByType,
  getDataBaseByIdentifier,
  // getTablesByDatabase,
  searchCatalogTables,
  getS3TableCount,
} from 'apis/data-catalog/api';
import '../style.scss';
import { formatSize, formatNumber, useDidUpdateEffect } from 'tools/tools';
import { useSearchParams } from 'react-router-dom';
import IdentifierFilterTag from './IdentifierFilterTag';
import { ColumnList, nFormatter } from 'ts/common';
import { useTranslation } from 'react-i18next';
import SchemaModal from './SchemaModal';
import { RDS_FOLDER_COLUMS } from 'pages/create-job/types/create_data_type';

/**
 * S3/RDS CatalogList componment
 */
const CatalogList: React.FC<any> = memo((props: any) => {
  const { catalogType = DATA_TYPE_ENUM.s3 } = props;
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const urlCatalog = searchParams.get('catalogId');
  const urlAccountId = searchParams.get('accountId');
  const urlPrivacy = searchParams.get('privacy');
  const urlIdentifiers = searchParams.get('identifiers');
  const [rdsSelectedView, setRdsSelectedView] = useState<string>(
    RDS_VIEW.RDS_INSTANCE_VIEW
  );
  const [glueSelectedView, setGlueSelectedView] = useState<string>(
    GLUE_VIEW.GLUE_INSTANCE_VIEW
  );
  const [jdbcSelectedView, setJdbcSelectedView] = useState<string>(
    JDBC_VIEW.JDBC_INSTANCE_VIEW
  );
  const [columnList, setColumnList] = useState<any[]>([]);
  const [filterColumns, setFilterColumns] = useState<ColumnList[]>([]);
  const [pageData, setPageData] = useState([] as any);
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
  const tableTitle = `${t('catalog:dataCatalog')} ${t(
    (DATA_TYPE as any)[catalogType] || 'jdbc'
  )}`;
  const [curSortColumn, setCurSortColumn] = useState<any>({
    sortingField: 'database_name',
  });
  const [isDescending, setIsDescending] = useState(false);
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

  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [selectDetailRowData, setSelectDetailRowData] = useState({}); //click row data
  const schemaModalProps = {
    showSchemaModal,
    setShowSchemaModal,
    selectRowData: selectDetailRowData,
    catalogType,
    selectPageRowData: selectRowData,
  };
  // click Forder or database name to schema
  const clickFolderName = (data: any) => {
    const rowData = {
      ...data,
      name: data.table_name,
    };
    setSelectDetailRowData(rowData);
    setShowSchemaModal(true);
  };

  const TableName = TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION;

  const resourcesFilterProps = {
    totalCount,
    columnList: filterColumns.filter((i) => i.filter),
    tableName: TableName,
    query,
    setQuery,
    filteringPlaceholder: t('catalog:list.filterDataCatalog'),
  };

  // onload data
  useEffect(() => {
    if (columnList.length > 0) {
      preferences.visibleContent = columnList.map((o) => o.id);
      getPageData();
    }
  }, [columnList]);

  // change page data
  useDidUpdateEffect(() => {
    getPageData();
  }, [currentPage, preferences.pageSize]);

  useDidUpdateEffect(() => {
    setCurrentPage(1);
    getPageData();
  }, [query, isDescending, curSortColumn]);

  useDidUpdateEffect(() => {
    setCurrentPage(1);
    getPageData();
  }, [showFilter]);

  // click single select show detail
  useDidUpdateEffect(() => {
    if (
      selectedItems.length === 1 &&
      rdsSelectedView === RDS_VIEW.RDS_INSTANCE_VIEW
    ) {
      !showDetailModal && clickRowName(selectedItems[0]);
    }
  }, [selectedItems]);

  const updateFatherPage = () => {
    getPageData();
  };

  const getPageData = async () => {
    setIsLoading(true);
    if (
      catalogType === DATA_TYPE_ENUM.rds &&
      rdsSelectedView === RDS_VIEW.RDS_TABLE_VIEW
    ) {
      getDataFolders();
    } else if (catalogType === DATA_TYPE_ENUM.glue) {
      if (glueSelectedView === GLUE_VIEW.GLUE_INSTANCE_VIEW) {
        getDataBases();
      } else {
        getDataFolders();
      }
    } else if (catalogType.startsWith('jdbc')) {
      if (jdbcSelectedView === JDBC_VIEW.JDBC_INSTANCE_VIEW) {
        getDataBases();
      } else {
        getDataFolders();
      }
    } else {
      try {
        getDataBases();
      } catch (error) {
        setIsLoading(false);
      }
    }
  };

  const getDataBases = async () => {
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: curSortColumn?.sortingField,
      asc: !isDescending,
      conditions: [
        {
          column: 'database_type',
          values: [catalogType],
          condition: 'and',
          operation: ':',
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
          operation: item.operator,
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

  const getDataFolders = async (nameFilter?: string) => {
    try {
      const requestParam: any = {
        page: currentPage,
        size: preferences.pageSize,
        sort_column: curSortColumn?.sortingField,
        asc: !isDescending,
        conditions: [
          {
            column: 'database_type',
            values: [catalogType],
            condition: 'and',
            operation: ':',
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
            operation: item.operator,
          });
        });
      const result = await searchCatalogTables(requestParam);
      // account_id region database_type database_name table_name
      setPageData((result as any)?.items);
      setTotalCount((result as any).total ?? 0);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  // show bucket detail dialog
  const clickRowName = async (selectedRowData: any) => {
    let tempData = {
      ...selectedRowData,
      name: selectedRowData[columnList[0].id],
    };
    if (
      selectedRowData.database_type === 's3' ||
      selectedRowData.database_type === 'unstructured'
    ) {
      // get modal data count
      const data: any = await getS3TableCount({
        bucket_name: selectedRowData.database_name,
      });
      tempData = {
        ...selectedRowData,
        structuredDataCount: data.s3,
        unstructuredDataCount: data.unstructured,
        name: selectedRowData[columnList[0].id],
      };
    }
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

  useEffect(() => {
    if (catalogType === DATA_TYPE_ENUM.s3) {
      setColumnList(S3_COLUMN_LIST);
      setFilterColumns(S3_FILTER_COLUMN);
    }
    if (catalogType === DATA_TYPE_ENUM.rds) {
      if (rdsSelectedView === RDS_VIEW.RDS_INSTANCE_VIEW) {
        setColumnList(RDS_COLUMN_LIST);
        setFilterColumns(RDS_FILTER_COLUMN);
      } else {
        setColumnList(RDS_FOLDER_COLUMS);
        setFilterColumns(CATALOG_TABLE_FILTER_COLUMN);
      }
    }
    if (catalogType === DATA_TYPE_ENUM.glue) {
      if (glueSelectedView === GLUE_VIEW.GLUE_TABLE_VIEW) {
        setColumnList(RDS_FOLDER_COLUMS);
        setFilterColumns(CATALOG_TABLE_FILTER_COLUMN);
      } else {
        setColumnList(RDS_COLUMN_LIST);
        setFilterColumns(RDS_FILTER_COLUMN);
      }
    }
    if (catalogType.startsWith('jdbc')) {
      if (jdbcSelectedView === JDBC_VIEW.JDBC_INSTANCE_VIEW) {
        setColumnList(RDS_COLUMN_LIST);
        setFilterColumns(RDS_FILTER_COLUMN);
      } else {
        setColumnList(TABLE_COLUMN);
        setFilterColumns(CATALOG_TABLE_FILTER_COLUMN);
      }
    }
  }, [catalogType, rdsSelectedView, glueSelectedView, jdbcSelectedView]);

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
            }${t('table.selected')}`;
          },
        }}
        selectionType="single"
        columnDefinitions={
          columnList.map((item) => {
            return {
              id: item.id,
              header: t(item.label),
              sortingField: item.sortingField,
              // different column tag
              cell: (e: any) => {
                if (
                  item.id === COLUMN_OBJECT_STR.DatabaseName &&
                  !item.disableClick
                ) {
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
                if (item.id === COLUMN_OBJECT_STR.RowCount) {
                  return formatNumber((e as any)[item.id]);
                }
                if (item.id === COLUMN_OBJECT_STR.FolderName) {
                  return (
                    <div
                      style={{ cursor: 'pointer' }}
                      className="catalog-detail-row-folders"
                      onClick={() => clickFolderName(e as any)}
                    >
                      {(e as any)[item.id]}
                    </div>
                  );
                }
                return (e as any)[item.id];
              },
              minWidth: COLUMN_WIDTH[item.id],
            };
          }) as any
        }
        items={pageData}
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
          <div
            style={{
              paddingTop:
                catalogType.startsWith('jdbc') && catalogType !== 'jdbc_aws'
                  ? 20
                  : 0,
            }}
          >
            <Header
              counter={`(${totalCount})`}
              className="continer-header"
              actions={
                <>
                  {catalogType === DATA_TYPE_ENUM.rds && (
                    <div style={{ paddingLeft: 20 }}>
                      <SegmentedControl
                        selectedId={rdsSelectedView}
                        options={[
                          {
                            text: 'Instance view',
                            id: RDS_VIEW.RDS_INSTANCE_VIEW,
                          },
                          { text: 'Table view', id: RDS_VIEW.RDS_TABLE_VIEW },
                        ]}
                        onChange={({ detail }) =>
                          setRdsSelectedView(detail.selectedId)
                        }
                      />
                    </div>
                  )}
                  {catalogType === DATA_TYPE_ENUM.glue && (
                    <div style={{ paddingLeft: 20 }}>
                      <SegmentedControl
                        selectedId={glueSelectedView}
                        options={[
                          {
                            text: 'Instance view',
                            id: GLUE_VIEW.GLUE_INSTANCE_VIEW,
                          },
                          { text: 'Table view', id: GLUE_VIEW.GLUE_TABLE_VIEW },
                        ]}
                        onChange={({ detail }) =>
                          setGlueSelectedView(detail.selectedId)
                        }
                      />
                    </div>
                  )}
                  {catalogType.startsWith('jdbc') && (
                    <div style={{ paddingLeft: 20 }}>
                      <SegmentedControl
                        selectedId={jdbcSelectedView}
                        options={[
                          {
                            text: 'Instance view',
                            id: JDBC_VIEW.JDBC_INSTANCE_VIEW,
                          },
                          { text: 'Table view', id: JDBC_VIEW.JDBC_TABLE_VIEW },
                        ]}
                        onChange={({ detail }) =>
                          setJdbcSelectedView(detail.selectedId)
                        }
                      />
                    </div>
                  )}
                </>
              }
            >
              {/* {JSON.stringify(props.label)} */}
              {tableTitle}
              {/* {props.label ?? tableTitle} */}
            </Header>
          </div>
        }
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
        sortingColumn={curSortColumn}
        sortingDescending={isDescending}
        onSortingChange={(e) => {
          setCurSortColumn(e.detail.sortingColumn);
          setIsDescending(e.detail.isDescending || false);
        }}
      />
      {showDetailModal && <DetailModal {...modalProps} />}
      {showSchemaModal && <SchemaModal {...schemaModalProps} />}
    </>
  );
});

export default CatalogList;
