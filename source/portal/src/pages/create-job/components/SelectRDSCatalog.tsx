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
  COLUMN_OBJECT_STR,
  RDS_CATALOG_COLUMS,
  RDS_FOLDER_COLUMS,
  S3_CATALOG_COLUMS,
} from '../types/create_data_type';
import { getDataBaseByType, searchCatalogTables } from 'apis/data-catalog/api';
import { alertMsg, formatNumber, formatSize } from 'tools/tools';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  PRIVARY_TYPE_INT_DATA,
} from 'pages/common-badge/types/badge_type';
import ResourcesFilter from 'pages/resources-filter';
import { RDS_VIEW, TABLE_NAME } from 'enum/common_types';
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
import { getDataSourceRdsByPage } from 'apis/data-source/api';

interface SelectRDSCatalogProps {
  jobData: IJobType;
  changeSelectType: (type: string) => void;
  changeRDSSelectView: (view: any) => void;
  changeSelectDatabases: (databases: any) => void;
}

const SelectRDSCatalog: React.FC<SelectRDSCatalogProps> = (
  props: SelectRDSCatalogProps
) => {
  const {
    jobData,
    changeSelectType,
    changeRDSSelectView,
    changeSelectDatabases,
  } = props;
  const { t } = useTranslation();
  const [rdsCatalogData, setRdsCatalogData] = useState<IDataSourceType[]>([]);
  const [rdsFolderData, setRdsFolderData] = useState([] as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [rdsTotal, setRdsTotal] = useState(0);
  const [selectedRdsItems, setSelectedRdsItems] = useState<IDataSourceType[]>(
    []
  );

  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
  } as any);
  const [isLoading, setIsLoading] = useState(false);
  const [rdsQuery, setRdsQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);

  const rdsFilterProps = {
    totalCount: rdsTotal,
    query: rdsQuery,
    setQuery: setRdsQuery,
    columnList: (jobData.rdsSelectedView === RDS_VIEW.RDS_INSTANCE_VIEW
      ? RDS_FILTER_COLUMN
      : CATALOG_TABLE_FILTER_COLUMN
    ).filter((i) => i.filter),
    tableName: TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION,
    filteringPlaceholder: t('job:filterInstances'),
  };

  const getRdsCatalogData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: COLUMN_OBJECT_STR.RdsCreatedTime,
      asc: false,
      conditions: [] as any,
    };
    requestParam.conditions.push({
      column: COLUMN_OBJECT_STR.GlueState,
      values: ['UNCONNECTED'],
      condition: rdsQuery.operation,
      operation: '!=',
    });
    const result: any = await getDataSourceRdsByPage(requestParam);
    console.info('result:', result);
    setIsLoading(false);
    if (!result?.items) {
      alertMsg(t('loadDataError'), 'error');
      return;
    }
    setRdsCatalogData(result.items);
    setRdsTotal(result.total);
    setIsLoading(false);
  };

  const getRdsFolderData = async (nameFilter?: string) => {
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
      const result = await searchCatalogTables(requestParam);
      setRdsFolderData((result as any)?.items);
      setRdsTotal((result as any)?.total);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobData.all_rds === '0') {
      if (jobData.rdsSelectedView === RDS_VIEW.RDS_INSTANCE_VIEW) {
        getRdsCatalogData();
      } else {
        getRdsFolderData();
      }
    }
  }, [
    jobData.all_rds,
    jobData.rdsSelectedView,
    rdsQuery,
    currentPage,
    preferences.pageSize,
  ]);

  useEffect(() => {
    if (jobData.rdsSelectedView === RDS_VIEW.RDS_INSTANCE_VIEW) {
      changeSelectDatabases(
        convertDataSourceListToJobDatabases(
          selectedRdsItems,
          jobData.database_type
        )
      );
    } else {
      changeSelectDatabases(
        convertTableSourceToJobDatabases(
          selectedRdsItems,
          jobData.database_type
        )
      );
    }
  }, [selectedRdsItems]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRdsItems([]);
  }, [jobData.rdsSelectedView]);

  return (
    <Container
      header={<Header variant="h2">{t('job:create.selectScanRDS')}</Header>}
    >
      <SpaceBetween direction="vertical" size="l">
        <Tiles
          onChange={({ detail }) => changeSelectType(detail.value)}
          value={jobData.all_rds}
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
        {jobData.all_rds === '0' && (
          <>
            <SegmentedControl
              selectedId={jobData.rdsSelectedView}
              options={[
                {
                  text: t('view.instanceView') ?? '',
                  id: RDS_VIEW.RDS_INSTANCE_VIEW,
                },
                {
                  text: t('view.tableView') ?? '',
                  id: RDS_VIEW.RDS_TABLE_VIEW,
                },
              ]}
              onChange={({ detail }) => changeRDSSelectView(detail.selectedId)}
            />
            {jobData.rdsSelectedView === RDS_VIEW.RDS_INSTANCE_VIEW && (
              <Table
                className="job-table-width"
                resizableColumns
                variant="embedded"
                selectionType="multi"
                selectedItems={selectedRdsItems}
                onSelectionChange={({ detail }) =>
                  setSelectedRdsItems(detail.selectedItems)
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
                        (i as any)[S3_CATALOG_COLUMS[0].id] ===
                        (item as any)[S3_CATALOG_COLUMS[0].id]
                    ).length;
                    return `${(item as any)[S3_CATALOG_COLUMS[0].id]} ${t(
                      'table.is'
                    )} ${isItemSelected ? '' : t('table.not')} ${t(
                      'table.selected'
                    )}`;
                  },
                }}
                items={rdsCatalogData}
                filter={<ResourcesFilter {...rdsFilterProps} />}
                columnDefinitions={RDS_CATALOG_COLUMS.map((item) => {
                  return {
                    id: item.id,
                    header: t(item.label),
                    cell: (e: any) => {
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
                    pagesCount={Math.ceil(rdsTotal / preferences.pageSize)}
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
                          options: S3_CATALOG_COLUMS,
                        },
                      ],
                    }}
                  />
                }
              />
            )}
            {jobData.rdsSelectedView === 'rds-table-view' && (
              <Table
                className="job-table-width"
                resizableColumns
                variant="embedded"
                selectionType="multi"
                selectedItems={selectedRdsItems}
                onSelectionChange={({ detail }) =>
                  setSelectedRdsItems(detail.selectedItems)
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
                        (i as any)[S3_CATALOG_COLUMS[0].id] ===
                        (item as any)[S3_CATALOG_COLUMS[0].id]
                    ).length;
                    return `${(item as any)[S3_CATALOG_COLUMS[0].id]} ${t(
                      'table.is'
                    )} ${isItemSelected ? '' : t('table.not')} ${t(
                      'table.selected'
                    )}`;
                  },
                }}
                items={rdsFolderData}
                filter={<ResourcesFilter {...rdsFilterProps} />}
                columnDefinitions={RDS_FOLDER_COLUMS.map((item) => {
                  return {
                    id: item.id,
                    header: t(item.label),
                    cell: (e: any) => {
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
                    pagesCount={Math.ceil(rdsTotal / preferences.pageSize)}
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
                          options: S3_CATALOG_COLUMS,
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

export default SelectRDSCatalog;
