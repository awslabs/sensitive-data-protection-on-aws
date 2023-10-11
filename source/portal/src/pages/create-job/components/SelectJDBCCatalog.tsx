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
} from '@cloudscape-design/components';
import {
  RDS_CATALOG_COLUMS,
  RDS_FOLDER_COLUMS,
  S3_CATALOG_COLUMS,
} from '../types/create_data_type';
import { getDataBaseByType, searchCatalogTables } from 'apis/data-catalog/api';
import { formatSize } from 'tools/tools';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  PRIVARY_TYPE_INT_DATA,
} from 'pages/common-badge/types/badge_type';
import ResourcesFilter from 'pages/resources-filter';
import { TABLE_NAME } from 'enum/common_types';
import { useTranslation } from 'react-i18next';
import { IDataSourceType, IJobType } from 'pages/data-job/types/job_list_type';
import {
  convertDataSourceListToJobDatabases,
  convertTableSourceToJobDatabases,
} from '../index';

interface SelectJDBCCatalogProps {
  jobData: IJobType;
  changeSelectType: (type: string) => void;
  changeRDSSelectView: (view: any) => void;
  changeSelectDatabases: (databases: any) => void;
}

const SelectJDBCCatalog: React.FC<SelectJDBCCatalogProps> = (
  props: SelectJDBCCatalogProps
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
    columnList: RDS_CATALOG_COLUMS.filter((i) => i.filter),
    tableName: TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION,
    filteringPlaceholder: t('job:filterInstances'),
  };

  const getRdsCatalogData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: '',
      asc: true,
      conditions: [
        {
          column: 'database_type',
          values: ['rds'],
          condition: 'and',
        },
      ] as any,
    };
    rdsQuery.tokens &&
      rdsQuery.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          condition: rdsQuery.operation,
        });
      });
    const dataResult = await getDataBaseByType(requestParam);
    setRdsCatalogData((dataResult as any)?.items);
    setRdsTotal((dataResult as any)?.total);
    setIsLoading(false);
  };

  const getRdsFolderData = async (nameFilter?: string) => {
    try {
      const requestParam: any = {
        page: currentPage,
        size: preferences.pageSize,
      };

      const result = await searchCatalogTables(requestParam);
      setRdsFolderData((result as any)?.items);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobData.all_rds === '0') {
      if (jobData.rdsSelectedView === 'rds-instance-view') {
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
    if (jobData.rdsSelectedView === 'rds-instance-view') {
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
                  text: 'Instance view',
                  id: 'rds-instance-view',
                },
                { text: 'Table view', id: 'rds-table-view' },
              ]}
              onChange={({ detail }) => changeRDSSelectView(detail.selectedId)}
            />
            {jobData.rdsSelectedView === 'rds-instance-view' && (
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

export default SelectJDBCCatalog;
