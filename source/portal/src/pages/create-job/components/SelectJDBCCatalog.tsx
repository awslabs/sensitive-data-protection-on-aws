import { useEffect, useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tiles,
  Table,
  Pagination,
  CollectionPreferences,
  SegmentedControl,
  Popover,
} from '@cloudscape-design/components';
import {
  JDBC_INSTANCE_COLUMS,
  JDBC_TABLE_COLUMS,
  COLUMN_OBJECT_STR,
} from '../types/create_data_type';
import { getDataBaseByType, searchCatalogTables } from 'apis/data-catalog/api';
import { formatNumber, formatSize } from 'tools/tools';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  PRIVARY_TYPE_INT_DATA,
} from 'pages/common-badge/types/badge_type';
import ResourcesFilter from 'pages/resources-filter';
import { JDBC_VIEW, TABLE_NAME } from 'enum/common_types';
import { useTranslation } from 'react-i18next';
import { IDataSourceType, IJobType } from 'pages/data-job/types/job_list_type';
import {
  convertDataSourceListToJobDatabases,
  convertTableSourceToJobDatabases,
} from '../index';
import {
  CATALOG_TABLE_FILTER_COLUMN,
  RDS_FILTER_COLUMN,
} from 'pages/data-catalog/types/data_config';

interface SelectJDBCCatalogProps {
  jobData: IJobType;
  changeSelectType: (type: string) => void;
  changeJDBCSelectView: (view: any) => void;
  changeSelectDatabases: (databases: any) => void;
}

const SelectJDBCCatalog: React.FC<SelectJDBCCatalogProps> = (
  props: SelectJDBCCatalogProps
) => {
  const {
    jobData,
    changeSelectType,
    changeJDBCSelectView,
    changeSelectDatabases,
  } = props;
  const { t } = useTranslation();
  const [jdbcCatalogData, setJdbcCatalogData] = useState<IDataSourceType[]>([]);
  const [jdbcFolderData, setJdbcFolderData] = useState([] as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [jdbcTotal, setJdbcTotal] = useState(0);
  const [selectedJdbcItems, setSelectedJdbcItems] = useState<IDataSourceType[]>(
    []
  );

  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
  } as any);
  const [isLoading, setIsLoading] = useState(false);
  const [jdbcQuery, setJdbcQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);

  const jdbcFilterProps = {
    totalCount: jdbcTotal,
    query: jdbcQuery,
    setQuery: setJdbcQuery,
    columnList: (jobData.jdbcSelectedView === JDBC_VIEW.JDBC_INSTANCE_VIEW
      ? RDS_FILTER_COLUMN
      : CATALOG_TABLE_FILTER_COLUMN
    ).filter((i) => i.filter),
    tableName: TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION,
    filteringPlaceholder: t('job:filterInstances'),
  };

  const getJdbcCatalogData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: '',
      asc: true,
      conditions: [
        {
          column: 'database_type',
          values: [jobData.database_type],
          condition: 'and',
        },
      ] as any,
    };
    jdbcQuery.tokens &&
      jdbcQuery.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          condition: jdbcQuery.operation,
        });
      });
    const dataResult = await getDataBaseByType(requestParam);
    setJdbcCatalogData((dataResult as any)?.items);
    setJdbcTotal((dataResult as any)?.total);
    setIsLoading(false);
  };

  const getJdbcFolderData = async (nameFilter?: string) => {
    try {
      const requestParam: any = {
        page: currentPage,
        size: preferences.pageSize,
        conditions: [
          {
            column: 'database_type',
            values: [jobData.database_type],
            condition: 'and',
            operation: ':',
          },
        ] as any,
      };
      jdbcQuery.tokens &&
        jdbcQuery.tokens.forEach((item: any) => {
          requestParam.conditions.push({
            column: item.propertyKey,
            values: [`${item.value}`],
            condition: jdbcQuery.operation,
          });
        });
      const result = await searchCatalogTables(requestParam);
      setJdbcFolderData((result as any)?.items);
      setJdbcTotal((result as any)?.total);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobData.all_jdbc === '0') {
      if (jobData.jdbcSelectedView === JDBC_VIEW.JDBC_INSTANCE_VIEW) {
        getJdbcCatalogData();
      } else {
        getJdbcFolderData();
      }
    }
  }, [
    jobData.all_jdbc,
    jobData.jdbcSelectedView,
    jdbcQuery,
    currentPage,
    preferences.pageSize,
  ]);

  useEffect(() => {
    if (jobData.jdbcSelectedView === JDBC_VIEW.JDBC_INSTANCE_VIEW) {
      changeSelectDatabases(
        convertDataSourceListToJobDatabases(
          selectedJdbcItems,
          jobData.database_type
        )
      );
    } else {
      changeSelectDatabases(
        convertTableSourceToJobDatabases(
          selectedJdbcItems,
          jobData.database_type
        )
      );
    }
  }, [selectedJdbcItems]);

  useEffect(() => {
    setSelectedJdbcItems([]);
  }, [jobData.jdbcSelectedView]);

  return (
    <Container
      header={<Header variant="h2">Select scan target for JDBC</Header>}
    >
      <SpaceBetween direction="vertical" size="l">
        <Tiles
          onChange={({ detail }) => changeSelectType(detail.value)}
          value={jobData.all_jdbc}
          items={[
            {
              label: t('job:cataLogOption.all'),
              value: '1',
            },
            {
              label: t('job:cataLogOption.specify'),
              value: '0',
            },
          ]}
        />
        {jobData.all_jdbc === '0' && (
          <>
            <SegmentedControl
              selectedId={jobData.jdbcSelectedView}
              options={[
                {
                  text: 'Instance view',
                  id: JDBC_VIEW.JDBC_INSTANCE_VIEW,
                },
                { text: 'Table view', id: JDBC_VIEW.JDBC_TABLE_VIEW },
              ]}
              onChange={({ detail }) => changeJDBCSelectView(detail.selectedId)}
            />
            {jobData.jdbcSelectedView === JDBC_VIEW.JDBC_INSTANCE_VIEW && (
              <Table
                className="job-table-width"
                resizableColumns
                variant="embedded"
                selectionType="multi"
                selectedItems={selectedJdbcItems}
                onSelectionChange={({ detail }) =>
                  setSelectedJdbcItems(detail.selectedItems)
                }
                ariaLabels={{
                  selectionGroupLabel: t('table.itemsSelection') || '',
                  allItemsSelectionLabel: ({ selectedItems }) =>
                    `${selectedItems.length} ${
                      selectedItems.length === 1
                        ? t('table.item')
                        : t('table.items')
                    } ${t('table.selected')}`,
                  itemSelectionLabel: ({ selectedItems }, item) => {
                    const isItemSelected = selectedItems.filter(
                      (i) =>
                        (i as any)[JDBC_INSTANCE_COLUMS[0].id] ===
                        (item as any)[JDBC_INSTANCE_COLUMS[0].id]
                    ).length;
                    return `${(item as any)[JDBC_INSTANCE_COLUMS[0].id]} ${t(
                      'table.is'
                    )} ${isItemSelected ? '' : t('table.not')} ${t(
                      'table.selected'
                    )}`;
                  },
                }}
                items={jdbcCatalogData}
                filter={<ResourcesFilter {...jdbcFilterProps} />}
                columnDefinitions={JDBC_INSTANCE_COLUMS.map((item: any) => {
                  return {
                    id: item.id,
                    header: t(item.label),
                    cell: (e: any) => {
                      if (item.id === COLUMN_OBJECT_STR.ConnectionName) {
                        return e['database_name'];
                      }
                      if (item.id === 'size_key') {
                        return formatSize((e as any)[item.id]);
                      }
                      if (item.id === 'privacy') {
                        if (
                          (e as any)[item.id] &&
                          ((e as any)[item.id] === 'N/A' ||
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
                      return e[item.id];
                    },
                  };
                })}
                loading={isLoading}
                pagination={
                  <Pagination
                    currentPageIndex={currentPage}
                    onChange={({ detail }) =>
                      setCurrentPage(detail.currentPageIndex)
                    }
                    pagesCount={Math.ceil(jdbcTotal / preferences.pageSize)}
                    ariaLabels={{
                      nextPageLabel: t('table.nextPage') || '',
                      previousPageLabel: t('table.previousPage') || '',
                      pageLabel: (pageNumber) =>
                        `${t('table.pageLabel', {
                          pageNumber: pageNumber,
                        })}`,
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
                        {
                          value: 10,
                          label: t('table.pageSize10'),
                        },
                        {
                          value: 20,
                          label: t('table.pageSize20'),
                        },
                        {
                          value: 50,
                          label: t('table.pageSize50'),
                        },
                        {
                          value: 100,
                          label: t('table.pageSize100'),
                        },
                      ],
                    }}
                    visibleContentPreference={{
                      title: t('table.selectVisibleContent'),
                      options: [
                        {
                          label: t('table.mainDistributionProp'),
                          options: JDBC_INSTANCE_COLUMS,
                        },
                      ],
                    }}
                  />
                }
              />
            )}
            {jobData.jdbcSelectedView === JDBC_VIEW.JDBC_TABLE_VIEW && (
              <Table
                className="job-table-width"
                resizableColumns
                variant="embedded"
                selectionType="multi"
                selectedItems={selectedJdbcItems}
                onSelectionChange={({ detail }) =>
                  setSelectedJdbcItems(detail.selectedItems)
                }
                ariaLabels={{
                  selectionGroupLabel: t('table.itemsSelection') || '',
                  allItemsSelectionLabel: ({ selectedItems }) =>
                    `${selectedItems.length} ${
                      selectedItems.length === 1
                        ? t('table.item')
                        : t('table.items')
                    } ${t('table.selected')}`,
                  itemSelectionLabel: ({ selectedItems }, item) => {
                    const isItemSelected = selectedItems.filter(
                      (i) =>
                        (i as any)[JDBC_TABLE_COLUMS[0].id] ===
                        (item as any)[JDBC_TABLE_COLUMS[0].id]
                    ).length;
                    return `${(item as any)[JDBC_TABLE_COLUMS[0].id]} ${t(
                      'table.is'
                    )} ${isItemSelected ? '' : t('table.not')} ${t(
                      'table.selected'
                    )}`;
                  },
                }}
                items={jdbcFolderData}
                filter={<ResourcesFilter {...jdbcFilterProps} />}
                columnDefinitions={JDBC_TABLE_COLUMS.map((item) => {
                  return {
                    id: item.id,
                    header: t(item.label),
                    cell: (e: any) => {
                      if (item.id === COLUMN_OBJECT_STR.JDBCTableName) {
                        return e['table_name'];
                      }
                      if (item.id === COLUMN_OBJECT_STR.ConnectionName) {
                        return e['database_name'];
                      }
                      if (item.id === COLUMN_OBJECT_STR.JDBCTableRow) {
                        return e['row_count'];
                      }
                      if (item.id === 'size_key') {
                        return formatSize((e as any)[item.id]);
                      }
                      if (item.id === 'privacy') {
                        if (
                          (e as any)[item.id] &&
                          ((e as any)[item.id] === 'N/A' ||
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
                      if (item.id === COLUMN_OBJECT_STR.RowCount) {
                        return formatNumber((e as any)[item.id]);
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
                      return e[item.id];
                    },
                  };
                })}
                loading={isLoading}
                pagination={
                  <Pagination
                    currentPageIndex={currentPage}
                    onChange={({ detail }) =>
                      setCurrentPage(detail.currentPageIndex)
                    }
                    pagesCount={Math.ceil(jdbcTotal / preferences.pageSize)}
                    ariaLabels={{
                      nextPageLabel: t('table.nextPage') || '',
                      previousPageLabel: t('table.previousPage') || '',
                      pageLabel: (pageNumber) =>
                        `${t('table.pageLabel', {
                          pageNumber: pageNumber,
                        })}`,
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
                        {
                          value: 10,
                          label: t('table.pageSize10'),
                        },
                        {
                          value: 20,
                          label: t('table.pageSize20'),
                        },
                        {
                          value: 50,
                          label: t('table.pageSize50'),
                        },
                        {
                          value: 100,
                          label: t('table.pageSize100'),
                        },
                      ],
                    }}
                    visibleContentPreference={{
                      title: t('table.selectVisibleContent'),
                      options: [
                        {
                          label: t('table.mainDistributionProp'),
                          options: JDBC_TABLE_COLUMS,
                        },
                      ],
                    }}
                  />
                }
              />
            )}
          </>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default SelectJDBCCatalog;
