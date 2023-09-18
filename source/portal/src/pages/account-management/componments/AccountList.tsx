import {
  Box,
  Button,
  CollectionPreferences,
  Header,
  Icon,
  IconProps,
  Pagination,
  SpaceBetween,
  Table,
} from '@cloudscape-design/components';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  CLSAAIFIED_TYPE,
} from 'pages/common-badge/types/badge_type';
import ResourcesFilter from 'pages/resources-filter';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import { getAccountList, deleteAccount } from 'apis/account-manager/api';
import { ACCOUNT_COLUMN_LIST, TYPE_COLUMN } from '../types/account_type';
import { TABLE_NAME } from 'enum/common_types';
import '../style.scss';
import { refreshDataSource } from 'apis/data-source/api';
import { alertMsg, useDidUpdateEffect } from 'tools/tools';
import { useTranslation } from 'react-i18next';

const AccountList: React.FC<any> = (props: any) => {
  const { setTotalAccount, provider } = props;
  const columnList = ACCOUNT_COLUMN_LIST;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [totalCount, setTotalCount] = useState(0);
  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
    visibleContent: columnList.map((o) => o.id),
  } as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pageData, setPageData] = useState([] as any);
  const [sortDetail, setSortDetail] = useState({});
  const [selectedItems, setSelectedItems] = useState([] as any);
  const [query, setQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);
  const resFilterProps = {
    totalCount,
    columnList: [...columnList.filter((i) => i.filter)] as any,
    query,
    setQuery,
    tableName: TABLE_NAME.SOURCE_ACCOUNT,
    filteringPlaceholder: t('account:filterAWSAccounts'),
  };

  useEffect(() => {
    getPageData();
  }, []);

  useDidUpdateEffect(() => {
    getPageData();
  }, [currentPage, preferences.pageSize]);

  useDidUpdateEffect(() => {
    setCurrentPage(1);
    getPageData();
  }, [query]);

  const refreshAllAccountData = async (accountData: any) => {
    try {
      // call refresh all account api
      const requestRefreshAccountParam = {
        provider: provider,
        accounts: accountData?.map((element: any) => element.account_id),
        type: 'all',
      };
      await refreshDataSource(requestRefreshAccountParam);
    } catch (error) {
      console.error(error);
    }
  };

  const getPageData = async () => {
    setIsLoading(true);
    try {
      const requestParam = {
        page: currentPage,
        size: preferences.pageSize,
        conditions: [] as any,
      };
      query.tokens &&
        query.tokens.forEach((item: any) => {
          requestParam.conditions.push({
            column: item.propertyKey,
            values: [
              item.propertyKey === 'status'
                ? item.value === 'SUCCEEDED'
                  ? 1
                  : 0
                : `${item.value}`,
            ],
            operation: item.operator,
            condition: query.operation,
          });

          

        });
        requestParam.conditions.push({
          column: 'account_provider_id',
          values:[Number(provider)],
          operation: '=',
          condition: 'and',

        });
      const getAccountListresult: any = await getAccountList(requestParam);
      if (getAccountListresult?.items?.length > 0) {
        await refreshAllAccountData(getAccountListresult.items);
      }
      const result: any = await getAccountList(requestParam);
      setSelectedItems([]);
      setPageData(result.items);
      setTotalAccount(result.total);
      setTotalCount(result.total);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
    return;
  };

  const clkAddNew = () => {
    navigate(RouterEnum.AddAccount.path);
    return;
  };

  const clkAccountName = (e: any) => {
    navigate(RouterEnum.DataSourceConnection.path, {
      state: { accountData: e },
    });
    return;
  };

  const clkRefreshDatasource = async (rowData: any) => {
    setIsLoading(true);
    const requestParam = {
      accounts: [rowData.account_id],
      type: 'all',
    };
    try {
      await refreshDataSource(requestParam);
      await getPageData();
      alertMsg(t('account:filterAWSAccounts'), 'success');
    } catch (e) {
      console.warn('Refresh Data Error:', e);
    }
    setIsLoading(false);
  };

  const clkDeleteAccount = async () => {
    if (!selectedItems || selectedItems.length === 0) {
      alertMsg(t('selectOneItem'), 'error');
      return;
    }
    setDeleteLoading(true);
    const requestParam = { account_id: selectedItems[0].account_id };
    await deleteAccount(requestParam);
    alertMsg(t('account:deleteSuccess'), 'success');
    setDeleteLoading(false);
    return;
  };

  return (
    <Table
      // sortingColumn
      onSortingChange={({ detail }) => {
        setSortDetail(detail);
      }}
      sortingColumn={(sortDetail as any)?.sortingColumn}
      sortingDescending={(sortDetail as any)?.isDescending}
      resizableColumns
      selectedItems={selectedItems}
      onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
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
          } ${t('table.selected')}`;
        },
      }}
      selectionType="single"
      columnDefinitions={
        columnList.map((item) => {
          return {
            id: item.id,
            header: t(item.label),
            // different column tag
            cell: (e: any) => {
              if (item.id === TYPE_COLUMN.STATUS) {
                let labelType = CLSAAIFIED_TYPE.Unconnected;
                let badgeLabelData = (e as any)[TYPE_COLUMN.STATUS];
                switch ((e as any)[TYPE_COLUMN.STATUS]) {
                  case 1:
                    labelType = CLSAAIFIED_TYPE.Success;
                    badgeLabelData = 'SUCCEEDED';
                    break;
                  case null:
                    badgeLabelData = (e as any)[TYPE_COLUMN.STACK_STATUS];
                    if ((e as any)[TYPE_COLUMN.STACK_STATUS] === 'SUCCEEDED') {
                      labelType = CLSAAIFIED_TYPE.Success;
                    } else if (
                      (e as any)[TYPE_COLUMN.STACK_STATUS] === 'CURRENT'
                    ) {
                      labelType = CLSAAIFIED_TYPE.SystemMark;
                    } else if (
                      (e as any)[TYPE_COLUMN.STACK_STATUS] === 'PENDING'
                    ) {
                      labelType = CLSAAIFIED_TYPE.Unconnected;
                    }
                    break;
                  default:
                    labelType = CLSAAIFIED_TYPE.Unconnected;
                    badgeLabelData = 'PENDING';
                    break;
                }
                return (
                  <CommonBadge
                    badgeType={BADGE_TYPE.Classified}
                    badgeLabel={badgeLabelData}
                    labelType={labelType}
                  />
                );
              }

              if (item.id === 'account_id') {
                return (
                  <span
                    className="account-id"
                    onClick={() => clkAccountName(e)}
                  >
                    {(e as any)[item.id]}
                  </span>
                );
              }

              if (
                item.id === TYPE_COLUMN.S3_CONNECTION ||
                item.id === TYPE_COLUMN.RDS_CONNECTION
              ) {
                let showText = '';
                let percentCls = 'progress-percent';
                let percentIcon: IconProps.Name = 'status-in-progress';
                if (item.id === TYPE_COLUMN.S3_CONNECTION) {
                  if (
                    !e[TYPE_COLUMN.TOTAL_S3_BUCKET] ||
                    e[TYPE_COLUMN.TOTAL_S3_BUCKET] === 0
                  ) {
                    return (
                      <div className="progress-percent">
                        <Icon name="status-in-progress" />
                        &nbsp;&nbsp;
                        <span>0</span>
                      </div>
                    );
                  }
                  showText = `${e[TYPE_COLUMN.CONNECTED_S3_BUCKET]} (${t(
                    'table.ofTotal'
                  )} ${e[TYPE_COLUMN.TOTAL_S3_BUCKET]})`;
                }
                if (item.id === TYPE_COLUMN.RDS_CONNECTION) {
                  if (
                    !e[TYPE_COLUMN.TOTAL_RDS_INSTANCE] ||
                    e[TYPE_COLUMN.TOTAL_RDS_INSTANCE] === 0
                  ) {
                    return (
                      <div className="progress-percent">
                        <Icon name="status-in-progress" />
                        &nbsp;&nbsp;
                        <span>0</span>
                      </div>
                    );
                  }
                  showText = `${
                    e[TYPE_COLUMN.CONNECTED_RDS_INSTANCE]
                  } (of total ${e[TYPE_COLUMN.TOTAL_RDS_INSTANCE]})`;
                }

                if (
                  // rds count
                  (e[TYPE_COLUMN.STACK_STATUS] === 'SUCCEEDED' ||
                    e[TYPE_COLUMN.CONNECTED_RDS_INSTANCE] ===
                      e[TYPE_COLUMN.TOTAL_RDS_INSTANCE]) &&
                  item.id === TYPE_COLUMN.RDS_CONNECTION
                ) {
                  percentCls = 'success-percent';
                  percentIcon = 'status-positive';
                } else if (
                  // s3 count
                  (e[TYPE_COLUMN.STACK_STATUS] === 'SUCCEEDED' ||
                    e[TYPE_COLUMN.CONNECTED_S3_BUCKET] ===
                      e[TYPE_COLUMN.TOTAL_S3_BUCKET]) &&
                  item.id === TYPE_COLUMN.S3_CONNECTION
                ) {
                  percentCls = 'success-percent';
                  percentIcon = 'status-positive';
                } else if (e[TYPE_COLUMN.STACK_STATUS] === 'FAILED') {
                  // FAILED
                  percentCls = 'failed-percent';
                  percentIcon = 'status-negative';
                } else if (e[TYPE_COLUMN.STACK_STATUS] !== 'CURRENT') {
                  percentCls = 'info-percent';
                  percentIcon = 'status-info';
                }

                return (
                  <div className={percentCls}>
                    <Icon name={percentIcon} />
                    &nbsp;&nbsp;
                    <span>{showText}</span>
                  </div>
                );
              }

              if (item.id === TYPE_COLUMN.FRONT_OPERATE) {
                return (
                  <span
                    onClick={() => clkRefreshDatasource(e as any)}
                    className="clk-refresh"
                  >
                    <Icon
                      name="refresh"
                      size="small"
                      className="small-icon"
                    ></Icon>{' '}
                    {t('button.refreshDataSource')}
                  </span>
                );
              }

              return (e as any)[item.id];
            },
            sortingField:
              item.id === 'buckets' || item.id === 'rds_instances'
                ? item.id
                : undefined,
          };
        }) as any
      }
      header={
        <>
          <Header
            counter={`(${totalCount})`}
            description={t('account:awsAccountsDesc')}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={getPageData}
                  loading={isLoading || deleteLoading}
                  iconName="refresh"
                />
                <Button
                  onClick={clkDeleteAccount}
                  loading={isLoading || deleteLoading}
                  disabled={selectedItems.length === 0}
                >
                  {t('button.delete')}
                </Button>
                <Button onClick={clkAddNew}>
                  {t('button.addNewAccounts')}
                </Button>
              </SpaceBetween>
            }
          >
            {t('account:awsAccounts')}
          </Header>
        </>
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
      filter={<ResourcesFilter {...resFilterProps} />}
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
    />
  );
};

export default AccountList;
