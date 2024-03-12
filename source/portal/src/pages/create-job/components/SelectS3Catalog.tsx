import { useEffect, useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Table,
  Pagination,
  CollectionPreferences,
  Tiles,
} from '@cloudscape-design/components';
import {
  COLUMN_OBJECT_STR,
  S3_CATALOG_COLUMS,
  S3_CATALOG_FILTER_COLUMNS,
} from '../types/create_data_type';
import { getDataSourceS3ByPage } from 'apis/data-source/api';
import { alertMsg, formatSize } from 'tools/tools';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  PRIVARY_TYPE_INT_DATA,
} from 'pages/common-badge/types/badge_type';
import ResourcesFilter from 'pages/resources-filter';
import { TABLE_NAME } from 'enum/common_types';
import { useTranslation } from 'react-i18next';
import {
  IJobType,
  IDataSourceS3BucketType,
} from 'pages/data-job/types/job_list_type';
import { convertS3BucketDataSourceListToJobDatabases } from '../index';

interface SelectS3CatalogProps {
  jobData: IJobType;
  changeSelectType: (type: string) => void;
  changeSelectDatabases: (databases: any) => void;
}

const SelectS3Catalog: React.FC<SelectS3CatalogProps> = (
  props: SelectS3CatalogProps
) => {
  const { jobData, changeSelectType, changeSelectDatabases } = props;
  const { t } = useTranslation();
  const [s3CatalogData, setS3CatalogData] = useState<IDataSourceS3BucketType[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [s3Total, setS3Total] = useState(0);
  const [selectedS3Items, setSelectedS3Items] = useState<
    IDataSourceS3BucketType[]
  >([]);

  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
  } as any);
  const [isLoading, setIsLoading] = useState(false);
  const [s3Query, setS3Query] = useState({
    tokens: [],
    operation: 'and',
  } as any);

  const s3FilterProps = {
    totalCount: s3Total,
    query: s3Query,
    setQuery: setS3Query,
    columnList: S3_CATALOG_FILTER_COLUMNS.filter((i) => i.filter),
    tableName: TABLE_NAME.CATALOG_DATABASE_LEVEL_CLASSIFICATION,
    filteringPlaceholder: t('job:filterBuckets'),
  };

  useEffect(() => {
    if (jobData.all_s3 === '0') {
      getS3CatalogData();
    }
  }, [jobData.all_s3, s3Query, currentPage, preferences.pageSize]);

  const getS3CatalogData = async () => {
    setIsLoading(true);
    // setSelectedItems([]);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: COLUMN_OBJECT_STR.LastModifyAt,
      asc: false,
      conditions: [] as any,
    };

    s3Query.tokens?.forEach((item: any) => {
      requestParam.conditions.push({
        column: item.propertyKey,
        values: [`${item.value}`],
        condition: 'and',
        operation: item.operator,
      });
    });
    // requestParam.conditions.push({
    //   column: COLUMN_OBJECT_STR.,
    //   values: [(selectedCrawler as any).value === 'connected' ? 'ACTIVE' : ''],
    //   condition: s3Query.operation,
    // });
    const result: any = await getDataSourceS3ByPage(requestParam);
    console.info('result:', result);
    setIsLoading(false);
    if (!result?.items) {
      alertMsg(t('loadDataError'), 'error');
      return;
    }
    setS3CatalogData(result.items);
    setS3Total(result.total);
  };

  const buildPrivacyColumn = (item: any, e: any) => {
    if (item.id === 'size_key') {
      return formatSize(e[item.id]);
    }
    if (item.id === 'privacy') {
      if (
        e[item.id] &&
        (e[item.id] === 'N/A' ||
          e[item.id].toString() === PRIVARY_TYPE_INT_DATA['N/A'])
      ) {
        return 'N/A';
      }
      return (
        <CommonBadge badgeType={BADGE_TYPE.Privacy} badgeLabel={e[item.id]} />
      );
    }
    return e[item.id];
  };

  useEffect(() => {
    changeSelectDatabases(
      convertS3BucketDataSourceListToJobDatabases(
        selectedS3Items,
        jobData.database_type
      )
    );
  }, [selectedS3Items]);

  return (
    <Container
      header={<Header variant="h2">{t('job:create.selectScanS3')}</Header>}
    >
      <SpaceBetween direction="vertical" size="l">
        <Tiles
          onChange={({ detail }) => changeSelectType(detail.value)}
          value={jobData.all_s3}
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
        {jobData.all_s3 === '0' && (
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
                    i[S3_CATALOG_COLUMS[0].id] === item[S3_CATALOG_COLUMS[0].id]
                ).length;
                return `${item[S3_CATALOG_COLUMS[0].id]} ${t('table.is')} ${
                  isItemSelected ? '' : t('table.not')
                } ${t('table.selected')}`;
              },
            }}
            items={s3CatalogData}
            filter={<ResourcesFilter {...s3FilterProps} />}
            columnDefinitions={S3_CATALOG_COLUMS.map((item) => {
              return {
                id: item.id,
                header: t(item.label),
                cell: (e: any) => buildPrivacyColumn(item, e),
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
