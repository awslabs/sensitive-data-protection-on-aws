import {
  Alert,
  Box,
  Button,
  CollectionPreferences,
  Header,
  Icon,
  Input,
  Modal,
  Pagination,
  SelectProps,
  SpaceBetween,
  Table,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import '../style.scss';
import ResourcesFilter from 'pages/resources-filter';
import { IDENTIFIER_COLUMN_LIST } from '../types/identifiers_type';
import {
  deleteIdentifiers,
  deleteIdentifierReport,
  exportIdentify,
  getIdentifiersList,
  updateIdentifiers,
} from 'apis/data-template/api';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import { alertMsg, useDidUpdateEffect } from 'tools/tools';
import { TABLE_NAME } from 'enum/common_types';
import { useTranslation } from 'react-i18next';
import PropsModal, { Props } from 'common/PropsModal';
import PropsSelect from 'common/PropsSelect';
import IdentifierTypeSelect from 'common/IdentifierTypeSelect';
import { format } from 'date-fns';

interface IdentifierTableProps {
  title: string;
  type: number;
}

const IdentifierTable: React.FC<IdentifierTableProps> = (
  props: IdentifierTableProps
) => {
  const { title, type } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const columnList = IDENTIFIER_COLUMN_LIST;

  const [totalCount, setTotalCount] = useState(0);
  const [pageData, setPageData] = useState([] as any);
  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
    visibleContent: columnList.map((o) => o.id),
  } as any);
  const [selectedItems, setSelectedItems] = useState([] as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isShowDelete, setIsShowDelete] = useState(false);
  const [s3ConflictCount, setS3ConflictCount] = useState(0);
  const [rdsConflictCount, setrdsConflictCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const timeStr = format(new Date(), 'yyyyMMddHHmmss');
  const batchExport = async () => {
    setDownloading(true);
    const url: any = await exportIdentify({key: timeStr});
    setDownloading(false);
    if (url) {
      window.open(url, '_blank');
      setTimeout(() => {
        deleteIdentifierReport({key: timeStr});
      }, 2000);
    } else {
      alertMsg(t('noReportFile'), 'error');
    }
  }

  const [query, setQuery] = useState({
    tokens: [],
    operation: 'and',
  } as any);
  const resourcesFilterProps = {
    totalCount,
    // columnList: columnList.filter((i) => i.filter),
    columnList: [],
    query,
    setQuery,
    tableName: TABLE_NAME.TEMPLATE_IDENTIFIER,
    filteringPlaceholder: t('template:filterByNameOrDesc'),
  };

  const [curSortColumn, setCurSortColumn] = useState<any>({
    sortingField: 'name',
  });
  const [isDescending, setIsDescending] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [currentIdentifier, setCurrentIdentifier] = useState<any>();
  const [modalType, setModalType] = useState('');
  const [loadingSave, setLoadingSave] = useState(false);
  const showEditCategoryLabelModal = (curType: string, item: any) => {
    setModalType(curType);
    setCurrentIdentifier(item);
    setShowModal(true);
  };
  const [searchSelectedCategory, setSearchSelectedCategory] =
    useState<SelectProps.Option | null>(null);
  const [searchSelectedLabel, setSearchSelectedLabel] =
    useState<SelectProps.Option | null>(null);
  const [cleanData, setCleanData] = useState(1);
  const [identifierTypeParam, setIdentifierTypeParam] =
    useState<SelectProps.Option | null>(null);

  const [confirmInput, setConfirmInput] = useState('');
  const [showErrorTips, setShowErrorTips] = useState({
    template: false,
    s3: false,
    rds: false,
  });
  const [loadingDelete, setLoadingDelete] = useState(false);

  const confirmDelete = async () => {
    const requestParam = {
      id: selectedItems[0].id,
    };

    try {
      setLoadingDelete(true);
      await deleteIdentifiers(requestParam);
      setIsShowDelete(false);
      alertMsg(t('deleteSuccess'), 'success');
      setSelectedItems([]);
      getPageData();
      setLoadingDelete(false);
    } catch (error: any) {
      setLoadingDelete(false);
      if (error) {
        if (!error.ref || error.ref.length === 0) {
          alertMsg(error.message, 'error');
          return;
        } else {
          const templateConflictStr = error.ref.find((i: string) =>
            i.startsWith('template')
          );
          const s3ConflictStr = error.ref.find((i: string) =>
            i.startsWith('s3')
          );
          const rdsConflictStr = error.ref.find((i: string) =>
            i.startsWith('rds')
          );
          if (s3ConflictStr) {
            const s3CountSplit = s3ConflictStr.split(':');
            if (s3CountSplit.length > 1) {
              setS3ConflictCount(s3CountSplit[1]);
            }
          }
          if (rdsConflictStr) {
            const rdsCountSplit = rdsConflictStr.split(':');
            if (rdsCountSplit.length > 1) {
              setrdsConflictCount(rdsCountSplit[1]);
            }
          }
          setShowErrorTips({
            template: templateConflictStr ? true : false,
            s3: s3ConflictStr ? true : false,
            rds: rdsConflictStr ? true : false,
          });
        }
      }
    }
  };

  const clkConfirmDelete = async () => {
    if (!confirmInput || confirmInput !== t('confirm')) {
      alertMsg(t('confirmDelete'), 'warning');
      return;
    }
    try {
      await confirmDelete();
    } catch (error) {
      console.warn(error);
    }
  };

  const clkDelete = async () => {
    if (!selectedItems || selectedItems.length === 0) {
      alertMsg(t('selectOneItem'), 'error');
      return;
    }
    setConfirmInput('');
    setShowErrorTips({
      template: false,
      rds: false,
      s3: false,
    });
    setIsShowDelete(true);
  };

  const clkCreate = () => {
    navigate(RouterEnum.CreateIdentifiers.path);
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
  }, [
    query,
    isDescending,
    curSortColumn,
    searchSelectedCategory,
    searchSelectedLabel,
    identifierTypeParam,
  ]);

  const buildTypeParam = () => {
    if (type === 0) {
      if (identifierTypeParam?.value === 'text') {
        return [0, 2];
      }
      if (identifierTypeParam?.value === 'image') {
        return [3];
      }
      return [0, 2, 3];
    }
    if (type === 1) {
      return [1];
    }
    return [];
  };

  const getPageData = async () => {
    setIsLoading(true);
    try {
      const requestParam = {
        page: currentPage,
        size: preferences.pageSize,
        sort_column: curSortColumn?.sortingField,
        asc: !isDescending,
        conditions: [
          {
            column: 'type',
            values: buildTypeParam(),
            condition: 'and',
            operation: ':',
          },
        ] as any,
      };
      query.tokens &&
        query.tokens.forEach((item: any) => {
          requestParam.conditions.push({
            column: item.propertyKey,
            values: [`${item.value}`],
            condition: 'and',
            operation: item.operator,
          });
        });

      if (searchSelectedCategory?.value) {
        requestParam.conditions.push({
          column: 'props',
          values: [`${searchSelectedCategory?.value}`],
          condition: 'and',
          operation: ':',
        });
      }

      if (searchSelectedLabel?.value) {
        requestParam.conditions.push({
          column: 'props',
          values: [`${searchSelectedLabel?.value}`],
          condition: 'and',
          operation: ':',
        });
      }
      const result: any = await getIdentifiersList(requestParam);
      setPageData(result.items);
      setTotalCount(result.total);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };
  const clkIdentifier = (rowData: any) => {
    navigate(RouterEnum.CreateIdentifiers.path, {
      state: { oldData: rowData },
    });
    return;
  };

  const saveIdentifierWithLabelCategory = async (props: Props[]) => {
    if (props.length <= 0) {
      alertMsg(t('selectCategoryLabel'), 'error');
      return;
    }
    setLoadingSave(true);
    const requestParam: any = currentIdentifier;
    const existsCategory = currentIdentifier.props?.find(
      (element: Props) => element?.prop_type?.toString() === '1'
    );
    const existsLabel = currentIdentifier.props?.find(
      (element: Props) => element?.prop_type?.toString() === '2'
    );
    let newProps: any = [];
    // caculate the props attribute
    if (modalType === '1') {
      // is category
      if (existsLabel) {
        newProps = [props[0]?.id, existsLabel.id];
      } else {
        newProps = [props[0]?.id];
      }
    }
    if (modalType === '2') {
      // is label
      if (existsCategory) {
        newProps = [props[0]?.id, existsCategory.id];
      } else {
        newProps = [props[0]?.id];
      }
    }
    requestParam.props = newProps;
    try {
      const result: any = await updateIdentifiers(requestParam);
      setLoadingSave(false);
      if (result && result.id >= 0) {
        alertMsg('Update success', 'success');
        setCleanData((prev) => {
          return prev + 1;
        });
        setShowModal(false);
        getPageData();
      } else {
        alertMsg('Create error', 'error');
      }
    } catch {
      setLoadingSave(false);
    }
  };

  const buildTypeDisplay = (e: any) => {
    return (
      <div>
        {e.type === 3 ? t('identifier:imageBased') : t('identifier:textBased')}
      </div>
    );
  };

  return (
    <SpaceBetween
      direction="vertical"
      size="xl"
      className="identifier-container"
    >
      <Table
        variant="embedded"
        items={pageData}
        selectedItems={selectedItems}
        resizableColumns
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems)
        }
        isItemDisabled={(item) => item.type === '0' || item.type === 0}
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
        selectionType={type === 1 ? 'single' : undefined}
        columnDefinitions={columnList.map((item) => {
          return {
            id: item.id,
            header: t(item.label),
            maxWidth: '45%',
            sortingField: item.sortingField,
            cell: (e: any) => {
              if (item.id === 'name') {
                return type === 1 ? (
                  <span
                    onClick={() => clkIdentifier(e)}
                    className="identifier-name"
                  >
                    {(e as any)[item.id]}
                  </span>
                ) : (
                  (e as any)[item.id]
                );
              } else if (item.id === 'type') {
                return buildTypeDisplay(e);
              } else if (item.id === 'category') {
                return (
                  <div>
                    {e.props?.find(
                      (prop: Props) => prop.prop_type?.toString() === '1'
                    )?.prop_name || 'N/A'}
                    <span
                      onClick={() => {
                        showEditCategoryLabelModal('1', e);
                      }}
                      className="hander ml-5"
                    >
                      <Icon name="edit" />
                    </span>
                  </div>
                );
              } else if (item.id === 'label') {
                return (
                  <div>
                    {e.props?.find(
                      (prop: Props) => prop.prop_type?.toString() === '2'
                    )?.prop_name || 'N/A'}
                    <span
                      onClick={() => {
                        showEditCategoryLabelModal('2', e);
                      }}
                      className="hander ml-5"
                    >
                      <Icon name="edit" />
                    </span>
                  </div>
                );
              } else {
                return (e as any)[item.id];
              }
            },
          };
        })}
        sortingColumn={curSortColumn}
        sortingDescending={isDescending}
        onSortingChange={(e) => {
          setCurSortColumn(e.detail.sortingColumn);
          setIsDescending(e.detail.isDescending || false);
        }}
        header={
          <>
            <Header
              variant="h2"
              actions={
                <>
                  {type === 1 && (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                    onClick={() => {
                      getPageData();
                    }}
                    disabled={isLoading}
                    iconName="refresh"
                      />
                      <Button onClick={() => batchExport()} disabled={downloading}>
                        {t('button.batchExportIdentify')}
                      </Button>
                      <Button onClick={() => navigate(`${RouterEnum.BatchOperation.base}/identifier`)}>
                        {t('button.batchCreate')}
                      </Button>
                      <Button
                        onClick={clkDelete}
                        disabled={selectedItems.length === 0}
                        loading={isLoading}
                      >
                        {t('button.delete')}
                      </Button>
                      <Button onClick={clkCreate} disabled={isLoading}>
                        {t('button.createIdentifier')}
                      </Button>
                    </SpaceBetween>
                  )}
                </>
              }
              counter={`(${totalCount})`}
            >
              {title}
            </Header>
          </>
        }
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
          <div className="flex-1 flex gap-10">
            <div className="flex-2">
              <ResourcesFilter {...resourcesFilterProps} />
            </div>
            <div className="flex-1">
              <PropsSelect
                isSearch
                type="1"
                selectOption={searchSelectedCategory}
                changeSelectValue={(option) => {
                  setSearchSelectedCategory(option);
                }}
              />
            </div>
            <div className="flex-1">
              <PropsSelect
                isSearch
                type="2"
                selectOption={searchSelectedLabel}
                changeSelectValue={(option) => {
                  setSearchSelectedLabel(option);
                }}
              />
            </div>
            {type !== 1 && (
              <IdentifierTypeSelect
                typeValue={identifierTypeParam}
                changeType={(type) => {
                  setIdentifierTypeParam(type);
                }}
              />
            )}
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
                  options: columnList.map((element) => {
                    return { ...element, label: t(element.label) };
                  }),
                },
              ],
            }}
          />
        }
        loading={isLoading}
      />
      <Modal
        visible={isShowDelete}
        onDismiss={() => setIsShowDelete(false)}
        header={
          <Header variant="h2">{t('template:deleteDataIdentifier')}</Header>
        }
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                disabled={loadingDelete}
                variant="link"
                onClick={() => setIsShowDelete(false)}
                loading={isLoading}
              >
                {t('button.cancel')}
              </Button>
              {!showErrorTips.template &&
                !showErrorTips.s3 &&
                !showErrorTips.rds && (
                  <Button onClick={clkConfirmDelete} loading={loadingDelete}>
                    {t('button.delete')}
                  </Button>
                )}
            </SpaceBetween>
          </Box>
        }
      >
        <p className="delete-top">{t('template:deleteIdentifierTips')}</p>
        {(showErrorTips.template || showErrorTips.s3 || showErrorTips.rds) && (
          <>
            <div className="delete-identifer">
              <Icon
                name="status-warning"
                className="delete-identifer-warning"
              />
              <span className="warning-desc">
                {t('template:identifierBeingUsed')}
              </span>
              <ul>
                {showErrorTips.template && (
                  <li>
                    {t('template:classficationTemplate')}
                    <a
                      target="_blank"
                      href={RouterEnum.Datatemplate.path}
                      rel="noreferrer"
                    >
                      {t('here')}
                    </a>
                  </li>
                )}
                {showErrorTips.s3 && (
                  <li>
                    {t('template:dataS3')}(
                    <a
                      target="_blank"
                      href={`/catalog?tagType=s3&identifiers=${selectedItems?.[0].name}`}
                      rel="noreferrer"
                    >
                      {s3ConflictCount}
                    </a>
                    )
                  </li>
                )}
                {showErrorTips.rds && (
                  <li>
                    {t('template:dataRDS')}(
                    <a
                      target="_blank"
                      href={`/catalog?tagType=rds&identifiers=${selectedItems?.[0].name}`}
                      rel="noreferrer"
                    >
                      {rdsConflictCount}
                    </a>
                    )
                  </li>
                )}
              </ul>
            </div>
            <span className="confirm-top">
              {t('template:removeTheseAndDelete')}
            </span>
          </>
        )}
        {!showErrorTips.template && !showErrorTips.s3 && !showErrorTips.rds && (
          <>
            <Alert type="info">{t('identifier:deleteAlert')}</Alert>
            <div className="confirm-top">{t('template:toAvoidTips')}</div>
            <div className="confirm-agree">{t('template:typeConfirm')}</div>
            <Input
              value={confirmInput}
              onChange={({ detail }) => setConfirmInput(detail.value)}
              placeholder={t('confirm') || ''}
              className="confirm-input"
            />
          </>
        )}
      </Modal>
      <PropsModal
        propsType={modalType}
        showModal={showModal}
        defaultSelectPropss={currentIdentifier?.props || []}
        clickHideModal={() => {
          setShowModal(false);
        }}
        saveLoading={loadingSave}
        cleanData={cleanData}
        savePropsToResource={(props) => {
          saveIdentifierWithLabelCategory(props);
        }}
      />
    </SpaceBetween>
  );
};

export default IdentifierTable;
