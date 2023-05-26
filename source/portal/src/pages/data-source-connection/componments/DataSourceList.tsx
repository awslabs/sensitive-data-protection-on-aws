import React, { useEffect, useState, memo } from 'react';
import {
  Box,
  Button,
  CollectionPreferences,
  Header,
  Icon,
  Pagination,
  SpaceBetween,
  Table,
  Select,
  Modal,
  Grid,
  Input,
  FormField,
  Tiles,
  ButtonDropdown,
  ButtonDropdownProps,
} from '@cloudscape-design/components';
import { DATA_TYPE_ENUM, TABLE_NAME } from 'enum/common_types';
import {
  RDS_COLUMN_LIST,
  S3_COLUMN_LIST,
  TABLE_HEADER,
  COLUMN_OBJECT_STR,
} from '../types/data_config';
import '../style.scss';
import '../../public_style.scss';
import ResourcesFilter from 'pages/resources-filter';
import moment from 'moment';
import {
  BADGE_TYPE,
  CLSAAIFIED_TYPE,
} from 'pages/common-badge/types/badge_type';
import CommonBadge from 'pages/common-badge';
import {
  getDataSourceS3ByPage,
  getDataSourceRdsByPage,
  connectDataSourceS3,
  connectDataSourceRDS,
  disconnectDataSourceRDS,
  disconnectDataSourceS3,
  getSecrets,
} from 'apis/data-source/api';
import { alertMsg, showHideSpinner } from 'tools/tools';
import SourceBadge from './SourceBadge';
import ErrorBadge from 'pages/error-badge';
import { useTranslation } from 'react-i18next';

const DataSourceList: React.FC<any> = memo((props: any) => {
  const { tagType, accountData } = props;
  const { t } = useTranslation();
  const columnList =
    tagType === DATA_TYPE_ENUM.s3 ? S3_COLUMN_LIST : RDS_COLUMN_LIST;
  const [totalCount, setTotalCount] = useState(0);
  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
    visibleContent: columnList.map((o) => o.id),
  } as any);
  const [selectedItems, setSelectedItems] = useState([] as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pageData, setPageData] = useState([] as any);
  const [selectedCrawler] = useState(null);
  const [sortDetail, setSortDetail] = useState({});
  const [rdsUser, setRdsUser] = useState('');
  const [rdsUserPwd, setRdsUserPwd] = useState('');
  const [showRdsPwdModal, setShowRdsPwdModal] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [secretSelect, setSecretSelect] = useState(null as any);
  const [secretOption, setSecretOption] = useState([] as any);
  const [query, setQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);
  const [cedentialType, setCedentialType] = useState('');
  const filterTableName =
    tagType === DATA_TYPE_ENUM.s3
      ? TABLE_NAME.SOURCE_S3_BUCKET
      : TABLE_NAME.SOURCE_RDS_INSTANCE;
  const resFilterProps = {
    totalCount,
    columnList: columnList.filter((i) => i.filter),
    query,
    setQuery,
    tableName: filterTableName,
    filteringPlaceholder:
      tagType === DATA_TYPE_ENUM.s3
        ? t('datasource:filterBuckets')
        : t('datasource:filterInstances'),
  };

  useEffect(() => {
    getPageData();
  }, []);

  useEffect(() => {
    getPageData();
  }, [currentPage, preferences.pageSize]);

  useEffect(() => {
    setCurrentPage(1);
    getPageData();
  }, [query, selectedCrawler]);

  useEffect(() => {
    if (showRdsPwdModal) {
      setRdsUser('');
      setRdsUserPwd('');
    }
  }, [showRdsPwdModal]);

  const getPageData = async () => {
    setIsLoading(true);
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column:
        tagType === DATA_TYPE_ENUM.s3
          ? COLUMN_OBJECT_STR.LastModifyAt
          : COLUMN_OBJECT_STR.RdsCreatedTime,
      asc: false,
      conditions: [] as any,
    };
    accountData &&
      accountData.aws_account_id &&
      requestParam.conditions.push({
        column: COLUMN_OBJECT_STR.AWSAccount,
        values: [`${accountData.aws_account_id}`], // accountData.aws_account_id,
        condition: query.operation,
      });
    query.tokens &&
      query.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          condition: 'and',
          operation: item.operator
        });
      });
    if (selectedCrawler) {
      requestParam.conditions.push({
        column: COLUMN_OBJECT_STR.GlueState,
        values: [
          (selectedCrawler as any).value === 'connected' ? 'ACTIVE' : '',
        ],
        condition: query.operation,
      });
    }
    const result: any =
      tagType === DATA_TYPE_ENUM.s3
        ? await getDataSourceS3ByPage(requestParam)
        : await getDataSourceRdsByPage(requestParam);
    setIsLoading(false);
    if (!result || !result.items) {
      alertMsg(t('loadDataError'), 'error');
      return;
    }
    setPageData(result.items);
    setTotalCount(result.total);
  };

  useEffect(() => {
    getPageData();
  }, [sortDetail]);

  useEffect(() => {
    if (cedentialType === 'secret_manager') {
      loadAccountSecrets();
    }
  }, [cedentialType]);

  const clkAllS3Connected = async () => {
    if (tagType === DATA_TYPE_ENUM.s3) {
      const requestParam = {
        account_id: accountData.aws_account_id,
        region: accountData.region,
        bucket: '*',
      };
      showHideSpinner(true);
      try {
        await connectDataSourceS3(requestParam);
        showHideSpinner(false);
        alertMsg(t('startConnectAllS3'), 'success');
        getPageData();
      } catch (error) {
        showHideSpinner(false);
      }
    } else {
      setShowRdsPwdModal(true);
    }
  };

  const clkConnected = async () => {
    if (!selectedItems || selectedItems.length === 0) {
      alertMsg(t('selectOneItem'), 'error');
      return;
    }
    if (tagType === DATA_TYPE_ENUM.s3) {
      const requestParam = {
        account_id: selectedItems[0].aws_account,
        region: selectedItems[0].region,
        bucket: selectedItems[0].bucket_name,
      };
      showHideSpinner(true);
      try {
        await connectDataSourceS3(requestParam);
        showHideSpinner(false);
        alertMsg(t('startConnect'), 'success');
        getPageData();
      } catch (error) {
        showHideSpinner(false);
      }
    } else {
      setShowRdsPwdModal(true);
    }
  };

  const connectRDS = async () => {
    if (cedentialType === 'username_pwd') {
      if (!rdsUser || !rdsUserPwd) {
        alertMsg(t('inputRDSUserOrPassword'), 'error');
        return;
      }
      setBtnDisabled(true);
      const requestParam = {
        account_id: selectedItems[0].aws_account,
        region: selectedItems[0].region,
        instance: selectedItems[0].instance_id,
        rds_user: rdsUser,
        rds_password: rdsUserPwd,
      };
      try {
        await connectDataSourceRDS(requestParam);
        alertMsg(t('startConnect'), 'success');
        setBtnDisabled(false);
        getPageData();
      } catch {
        setBtnDisabled(false);
      }
    } else if (cedentialType === 'secret_manager') {
      if (!secretSelect || !secretSelect.value) {
        alertMsg(t('selectSecretManage'), 'error');
        return;
      }
      setBtnDisabled(true);
      const requestParam = {
        account_id: selectedItems[0].aws_account,
        region: selectedItems[0].region,
        instance: selectedItems[0].instance_id,
        rds_secret: secretSelect.value,
      };
      try {
        await connectDataSourceRDS(requestParam);
        alertMsg(t('startConnect'), 'success');
        setBtnDisabled(false);
        getPageData();
      } catch {
        alertMsg(t('connectFailed'), 'error');
        setBtnDisabled(false);
      }
    }
  };

  const clkDisconnectDataSource = async (
    selectedOption: ButtonDropdownProps.ItemClickDetails
  ) => {
    if (!selectedItems || selectedItems.length === 0) {
      alertMsg(t('selectOneItem'), 'error');
      return;
    }
    if (!selectedOption || selectedOption.id !== 'disconnect') {
      return;
    }
    const requestParam: any = {
      account_id: selectedItems[0].aws_account,
      region: selectedItems[0].region,
    };
    if (tagType === DATA_TYPE_ENUM.s3) {
      requestParam.bucket = selectedItems[0].bucket_name;
    } else {
      requestParam.instance = selectedItems[0].instance_id;
    }
    showHideSpinner(true);
    try {
      tagType === DATA_TYPE_ENUM.s3
        ? await disconnectDataSourceS3(requestParam)
        : await disconnectDataSourceRDS(requestParam);
      showHideSpinner(false);
      alertMsg(t('disconnectSuccess'), 'success');
      getPageData();
      return;
    } catch (error) {
      showHideSpinner(false);
    }
  };

  const loadAccountSecrets = async () => {
    const requestParam = {
      account: selectedItems[0].aws_account,
      region: selectedItems[0].region,
    };
    const secretsResult: any = await getSecrets(requestParam);
    if (secretsResult && secretsResult.length > 0) {
      const tempOptList = secretsResult.map((item: { Name: any; ARN: any }) => {
        return {
          label: item.Name,
          value: item.Name,
          tags: [item.ARN],
        };
      });
      setSecretOption(tempOptList);
    } else {
      setSecretOption([]);
    }
  };

  return (
    <>
      <Table
        variant="embedded"
        className="no-shadow-list"
        onSortingChange={({ detail }) => {
          setSortDetail(detail);
        }}
        resizableColumns
        sortingColumn={(sortDetail as any)?.sortingColumn}
        sortingDescending={(sortDetail as any)?.isDescending}
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
            } ${t('table.selected')}`;
          },
        }}
        columnDefinitions={
          columnList.map((item) => {
            return {
              id: item.id,
              header: t(item.label),
              // different column tag
              cell: (e: any) => {
                if (
                  item.id === COLUMN_OBJECT_STR.LastModifyAt ||
                  item.id === COLUMN_OBJECT_STR.RdsCreatedTime
                ) {
                  return moment((e as any)[item.id])
                    .add(8, 'h')
                    .format('YYYY-MM-DD HH:mm');
                }
                if (item.id === 'glue_state') {
                  let tempLabel = CLSAAIFIED_TYPE.Unconnected.toUpperCase();
                  let tempType = CLSAAIFIED_TYPE.SystemMark;
                  switch ((e as any)[item.id]) {
                    case 'PENDING':
                      tempLabel = 'PENDING';
                      tempType = CLSAAIFIED_TYPE.SystemMark;
                      break;
                    case 'ACTIVE':
                      tempLabel = 'ACTIVE';
                      tempType = CLSAAIFIED_TYPE.Success;
                      break;
                    case 'ERROR':
                      tempLabel = CLSAAIFIED_TYPE.Failed;
                      tempType = CLSAAIFIED_TYPE.Failed;
                      break;
                    case 'CRAWLING':
                      tempLabel = 'CRAWLING';
                      tempType = CLSAAIFIED_TYPE.System;
                      break;
                    case '':
                      tempLabel = CLSAAIFIED_TYPE.Unconnected.toUpperCase();
                      tempType = CLSAAIFIED_TYPE.Unconnected;
                      break;
                    case null:
                      tempLabel = CLSAAIFIED_TYPE.Unconnected.toUpperCase();
                      tempType = CLSAAIFIED_TYPE.Unconnected;
                      break;
                    default:
                      tempLabel = CLSAAIFIED_TYPE.Failed;
                      tempType = CLSAAIFIED_TYPE.Failed;
                      break;
                  }
                  if (tempType === CLSAAIFIED_TYPE.Failed) {
                    return (
                      <div
                        onClick={() => alertMsg((e as any)[item.id], 'error')}
                        style={{ cursor: 'pointer' }}
                      >
                        <ErrorBadge badgeLabel={(e as any)[item.id]} />
                      </div>
                    );
                  }
                  return (
                    <CommonBadge
                      badgeType={BADGE_TYPE.Classified}
                      badgeLabel={tempLabel}
                      labelType={tempType}
                    />
                  );
                }
                if (item.id === COLUMN_OBJECT_STR.DataCatalog) {
                  if (e.glue_state !== 'ACTIVE') {
                    return '-';
                  }
                  return (
                    <>
                    {t('button.dataCatalogs')}
                    <a
                      href={`/catalog?catalogId=${
                        (e as any)[COLUMN_OBJECT_STR.Buckets] ||
                        (e as any)[COLUMN_OBJECT_STR.RDSInstances]
                      }&tagType=${tagType}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{marginLeft:5}}
                    >
                      <Icon name="external" variant="link"/>
                    </a>
                    </>
                  );
                }

                return (e as any)[item.id];
              },
              minWidth:
                item.id === COLUMN_OBJECT_STR.Status ||
                item.id === COLUMN_OBJECT_STR.RunStatus
                  ? 200
                  : undefined,
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
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={getPageData}
                    disabled={isLoading}
                    iconName="refresh"
                  />
                  {tagType === DATA_TYPE_ENUM.s3 && accountData && (
                    <Button disabled={isLoading} onClick={clkAllS3Connected}>
                      <Icon name="view-full" className="btn-icon" />
                      {t('button.connectAll')}
                    </Button>
                  )}
                  <Button
                    disabled={isLoading || selectedItems.length === 0}
                    onClick={clkConnected}
                  >
                    <Icon name="share" className="btn-icon" />
                    {t('button.connect')}
                  </Button>
                  <ButtonDropdown
                    onItemClick={({ detail }) => {
                      clkDisconnectDataSource(detail);
                    }}
                    items={[{ text: t('disconnect') || '', id: 'disconnect' }]}
                  >
                    {t('button.actions')}
                  </ButtonDropdown>
                </SpaceBetween>
              }
            >
              {t((TABLE_HEADER as any)[tagType]['header'])}
            </Header>
            <div className="description">
              {t((TABLE_HEADER as any)[tagType]['info'])}
            </div>
          </>
        }
        items={pageData}
        selectionType="single"
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
          <div className="source-filter">
            <ResourcesFilter
              {...resFilterProps}
              className="source-filter-input"
            />
            {/* {tagType === DATA_TYPE_ENUM.rds && (
              <Select
                className="source-filter-select"
                selectedOption={selectedCrawler}
                onChange={({ detail }) => {
                  if (detail.selectedOption.value) {
                    setSelectedCrawler(detail.selectedOption as any);
                  } else {
                    setSelectedCrawler(null);
                  }
                }}
                options={[
                  { label: '-', value: undefined },
                  { label: 'Connected', value: 'connected' },
                  { label: 'Un Connected', value: 'UnConnected' },
                ]}
                selectedAriaLabel="Crawler status"
                placeholder="Crawler status"
              />
            )} */}
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
      />
      <Modal
        visible={showRdsPwdModal}
        onDismiss={() => setShowRdsPwdModal(false)}
        header={t('datasource:connectToRDSDataSource')}
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowRdsPwdModal(false)}>
                {t('button.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={connectRDS}
                loading={btnDisabled}
              >
                {t('button.connect')}
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Header variant="h2">
          {selectedItems[0]?.instance_id || t('datasource:rdsInstances')}
        </Header>
        <SpaceBetween size={'s'}>
          <Grid
            gridDefinition={[
              { colspan: 3 },
              { colspan: 3 },
              { colspan: 4 },
              { colspan: 2 },
            ]}
          >
            <div className="datasource-container-item datasource-width">
              <p className="p-title">{t('table.label.awsAccount')}</p>
              <span className="datasource-container-account">
                {selectedItems[0]?.aws_account}
              </span>
            </div>
            <div className="datasource-container-item datasource-width left-line">
              <p className="p-title">{t('table.label.awsRegion')}</p>
              <span>{selectedItems[0]?.region}</span>
            </div>
            <div className="datasource-container-item datasource-width left-line">
              <p className="p-title">{t('table.label.endpoint')}</p>
              <span>{`${selectedItems[0]?.engine}:${selectedItems[0]?.address}`}</span>
            </div>
            <div className="datasource-container-item datasource-width left-line">
              <p className="p-title">{t('table.label.port')}</p>
              <span>{selectedItems[0]?.port}</span>
            </div>
          </Grid>
          <Grid gridDefinition={[{ colspan: 3 }, { colspan: 3 }]}>
            <div className="datasource-container-item datasource-width">
              <p className="p-title">{t('table.label.connectionStatus')}</p>
              <SourceBadge
                instanceStatus={
                  selectedItems[0]?.glue_state ||
                  CLSAAIFIED_TYPE.Unconnected.toUpperCase()
                }
                needInfo
              />
            </div>
            <div className="datasource-container-item datasource-width left-line">
              <p className="p-title">{t('table.label.lastUpdateAt')}</p>
              <span>
                {accountData.last_updated
                  ? moment(accountData.last_updated)
                      .add(8, 'h')
                      .format('YYYY-MM-DD HH:mm')
                  : '-'}
              </span>
            </div>
          </Grid>
          <br></br>

          <FormField label="Credential">
            <Tiles
              onChange={({ detail }) => setCedentialType(detail.value)}
              value={cedentialType}
              items={[
                {
                  label: t('datasource:credentialOption.secretManager'),
                  value: 'secret_manager',
                },
                {
                  label: t('datasource:credentialOption.userNamePWD'),
                  value: 'username_pwd',
                },
              ]}
            />
          </FormField>
          {cedentialType === 'username_pwd' && (
            <>
              <FormField label="Username">
                <Input
                  value={rdsUser}
                  onChange={({ detail }) => setRdsUser(detail.value)}
                />
              </FormField>

              <FormField label="Password">
                <Input
                  value={rdsUserPwd}
                  onChange={({ detail }) => setRdsUserPwd(detail.value)}
                  type="password"
                />
              </FormField>
            </>
          )}
          {cedentialType === 'secret_manager' && (
            <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
              <Select
                selectedOption={secretSelect}
                onChange={({ detail }) =>
                  setSecretSelect(detail.selectedOption)
                }
                options={secretOption}
                selectedAriaLabel={t('selected') || ''}
              />
              <div></div>
            </Grid>
          )}

          <span className="connection-tips">
            {t('datasource:connectionTips')}
          </span>
        </SpaceBetween>
      </Modal>
    </>
  );
});

export default DataSourceList;
