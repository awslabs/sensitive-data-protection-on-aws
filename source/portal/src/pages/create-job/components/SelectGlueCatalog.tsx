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

interface SelectS3CatalogProps {
  jobData: IJobType;
  changeSelectType: (type: string) => void;
  changeGlueSelectView: (view: any) => void;
  changeSelectDatabases: (databases: any) => void;
}

const SelectGlueCatalog: React.FC<SelectS3CatalogProps> = (
  props: SelectS3CatalogProps
) => {
  const {
    jobData,
    changeSelectType,
    changeGlueSelectView,
    changeSelectDatabases,
  } = props;
  const { t } = useTranslation();
  const [glueCatalogData, setGlueCatalogData] = useState<IDataSourceType[]>([]);
  const [glueFolderData, setGlueFolderData] = useState([] as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [glueTotal, setGlueTotal] = useState(0);
  const [selectedGlueItems, setSelectedGlueItems] = useState<IDataSourceType[]>(
    []
  );

  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
  } as any);
  const [isLoading, setIsLoading] = useState(false);
  const [glueQuery, setGlueQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);

  const glueFilterProps = {
    totalCount: glueTotal,
    query: glueQuery,
    setQuery: setGlueQuery,
    columnList: RDS_CATALOG_COLUMS.filter((i) => i.filter),
    tableName: TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION,
    filteringPlaceholder: t('job:filterInstances'),
  };

  const getGlueCatalogData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: '',
      asc: true,
      conditions: [
        {
          column: 'database_type',
          values: ['glue'],
          condition: 'and',
        },
      ] as any,
    };
    glueQuery.tokens &&
      glueQuery.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          condition: glueQuery.operation,
        });
      });
    const dataResult = await getDataBaseByType(requestParam);
    setGlueCatalogData((dataResult as any)?.items);
    setGlueTotal((dataResult as any)?.total);
    setIsLoading(false);
  };

  const getGlueFolderData = async (nameFilter?: string) => {
    try {
      const requestParam: any = {
        page: currentPage,
        size: preferences.pageSize,
      };

      const result = await searchCatalogTables(requestParam);
      setGlueFolderData((result as any)?.items);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobData.all_glue === '0') {
      if (jobData.glueSelectedView === 'glue-instance-view') {
        getGlueCatalogData();
      } else if (jobData.glueSelectedView === 'glue-table-view') {
        getGlueFolderData();
      } else {
        // Account view
        // TODO
      }
    }
  }, [
    jobData.all_glue,
    jobData.glueSelectedView,
    glueQuery,
    currentPage,
    preferences.pageSize,
  ]);

  useEffect(() => {
    if (jobData.glueSelectedView === 'glue-instance-view') {
      changeSelectDatabases(
        convertDataSourceListToJobDatabases(
          selectedGlueItems,
          jobData.database_type
        )
      );
    } else if (jobData.glueSelectedView === 'glue-table-view') {
      changeSelectDatabases(
        convertTableSourceToJobDatabases(
          selectedGlueItems,
          jobData.database_type
        )
      );
    } else {
      // account view
      //TODO
    }
  }, [selectedGlueItems]);

  useEffect(() => {
    setSelectedGlueItems([]);
  }, [jobData.glueSelectedView]);

  return (
    <Container
      header={<Header variant="h2">Select scan target for AWS Glue</Header>}
    >
      <SpaceBetween direction="vertical" size="l">
        <Tiles
          onChange={({ detail }) => changeSelectType(detail.value)}
          value={jobData.all_glue}
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
        {jobData.all_glue === '0' && (
          <>
            <SegmentedControl
              selectedId={jobData.glueSelectedView}
              options={[
                {
                  text: 'Instance view',
                  id: 'glue-instance-view',
                },
                { text: 'Table view', id: 'glue-table-view' },
                { text: 'Account view', id: 'glue-account-view' },
              ]}
              onChange={({ detail }) => changeGlueSelectView(detail.selectedId)}
            />
            {jobData.glueSelectedView === 'glue-instance-view' && (
              <Table
                className="job-table-width"
                resizableColumns
                variant="embedded"
                selectionType="multi"
                selectedItems={selectedGlueItems}
                onSelectionChange={({ detail }) =>
                  setSelectedGlueItems(detail.selectedItems)
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
                items={glueCatalogData}
                filter={<ResourcesFilter {...glueFilterProps} />}
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
                    pagesCount={Math.ceil(glueTotal / preferences.pageSize)}
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
            {jobData.glueSelectedView === 'glue-table-view' && (
              <Table
                className="job-table-width"
                resizableColumns
                variant="embedded"
                selectionType="multi"
                selectedItems={selectedGlueItems}
                onSelectionChange={({ detail }) =>
                  setSelectedGlueItems(detail.selectedItems)
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
                items={glueFolderData}
                filter={<ResourcesFilter {...glueFilterProps} />}
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
                    pagesCount={Math.ceil(glueTotal / preferences.pageSize)}
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

export default SelectGlueCatalog;