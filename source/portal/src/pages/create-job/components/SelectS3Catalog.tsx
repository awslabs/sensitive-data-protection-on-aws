import { useEffect, useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tiles,
  Table,
  Pagination,
  CollectionPreferences,
} from '@cloudscape-design/components';
import { useLocation } from 'react-router-dom';
import {
  RDS_CATALOG_COLUMS,
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

const SELECT_S3 = 'selectS3';
const SELECT_RDS = 'selectRds';

const SelectS3Catalog = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { oldData } = location.state || {};
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [s3CatalogType, setS3CatalogType] = useState('');
  const [rdsCatalogType, setRdsCatalogType] = useState('');
  const [s3CatalogData, setS3CatalogData] = useState([] as any);
  const [rdsCatalogData, setRdsCatalogData] = useState([] as any);
  const [rdsFolderData, setRdsFolderData] = useState([] as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [s3Total, setS3Total] = useState(0);
  const [rdsTotal, setRdsTotal] = useState(0);
  const [selectedS3Items, setSelectedS3Items] = useState([] as any);
  const [selectedRdsItems, setSelectedRdsItems] = useState([] as any);

  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
    visibleContent:
      activeStepIndex === 0
        ? S3_CATALOG_COLUMS.map((o) => o.id)
        : RDS_CATALOG_COLUMS.map((o) => o.id),
  } as any);
  const [isLoading, setIsLoading] = useState(false);
  const [s3Query, setS3Query] = useState({
    tokens: [],
    operation: 'and',
  } as any);

  const [rdsQuery, setRdsQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);

  const hasOldData = oldData && Object.keys(oldData).length > 0;

  const s3FilterProps = {
    totalCount: s3Total,
    query: s3Query,
    setQuery: setS3Query,
    columnList: S3_CATALOG_COLUMS.filter((i) => i.filter),
    tableName: TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION,
    filteringPlaceholder: t('job:filterBuckets'),
  };

  const [rdsSelectedView, setRdsSelectedView] = useState('rds-instance-view');

  useEffect(() => {
    if (s3CatalogType === SELECT_S3 && activeStepIndex === 0 && !hasOldData) {
      getS3CatalogData();
    }
    if (
      rdsCatalogType === SELECT_RDS &&
      activeStepIndex === 1 &&
      !hasOldData &&
      rdsSelectedView === 'rds-instance-view'
    ) {
      setSelectedRdsItems([]);
      getRdsCatalogData();
    }
    if (
      rdsCatalogType === SELECT_RDS &&
      activeStepIndex === 1 &&
      !hasOldData &&
      rdsSelectedView === 'rds-table-view'
    ) {
      setSelectedRdsItems([]);
      getRdsFolderData();
    }
  }, [
    rdsCatalogType,
    rdsQuery,
    s3CatalogType,
    s3Query,
    currentPage,
    preferences.pageSize,
    rdsSelectedView,
  ]);

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

  const getS3CatalogData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: '',
      asc: true,
      conditions: [
        {
          column: 'database_type',
          values: ['s3'],
          condition: 'and',
        },
      ] as any,
    };
    s3Query.tokens &&
      s3Query.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          condition: s3Query.operation,
        });
      });
    const dataResult = await getDataBaseByType(requestParam);
    setS3CatalogData((dataResult as any)?.items);
    setS3Total((dataResult as any)?.total);
    setIsLoading(false);
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

  return (
    <Container
      header={<Header variant="h2">Select scan target for Amazon S3</Header>}
    >
      <SpaceBetween direction="vertical" size="l">
        <Tiles
          onChange={({ detail }) => setS3CatalogType(detail.value)}
          value={s3CatalogType}
          items={[
            { label: t('job:cataLogOption.all'), value: 'allS3' },
            {
              label: t('job:cataLogOption.specify'),
              value: SELECT_S3,
            },
            // {
            //   label: t('job:cataLogOption.skipScanS3'),
            //   value: NONE_S3,
            // },
          ]}
        />
        {s3CatalogType === SELECT_S3 && (
          <Table
            className="job-table-width"
            selectionType="multi"
            resizableColumns
            selectedItems={selectedS3Items}
            onSelectionChange={({ detail }) =>
              setSelectedS3Items(detail.selectedItems)
            }
            variant="embedded"
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
            items={s3CatalogData}
            filter={<ResourcesFilter {...s3FilterProps} />}
            columnDefinitions={S3_CATALOG_COLUMS.map((item) => {
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
                pagesCount={Math.ceil(s3Total / preferences.pageSize)}
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
                      options: S3_CATALOG_COLUMS,
                    },
                  ],
                }}
              />
            }
          />
        )}
      </SpaceBetween>
    </Container>
  );
};

export default SelectS3Catalog;
