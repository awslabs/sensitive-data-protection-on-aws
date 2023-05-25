import {
  Box,
  Button,
  CollectionPreferences,
  Header,
  Icon,
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
  getIdentifiersList,
  updateIdentifiers,
} from 'apis/data-template/api';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import { alertMsg, useDidUpdateEffect } from 'tools/tools';
import TemplateDelete from 'pages/template-delete';
import { TABLE_NAME } from 'enum/common_types';
import { useTranslation } from 'react-i18next';
import PropsModal, { Props } from 'common/PropsModal';
import PropsSelect from 'common/PropsSelect';

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
  const [showErrorTips, setShowErrorTips] = useState({
    template: false,
    catalog: false,
  });

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

  const [curSortColumn, setCurSortColumn] = useState<any>('');
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

  const confirmDelete = async () => {
    const requestParam = {
      id: selectedItems[0].id,
    };
    try {
      await deleteIdentifiers(requestParam);
      setIsShowDelete(false);
      alertMsg(t('deleteSuccess'), 'success');
      getPageData();
    } catch (error: any) {
      if (error) {
        if (!error.ref || error.ref.length === 0) {
          alertMsg(error.message, 'error');
          return;
        }
        setShowErrorTips({
          template: error.ref.filter((i: any) => i === 'template').length > 0,
          catalog:
            error.ref.filter((i: any) => i === 's3' || i === 'rds').length > 0,
        });
      }
    }
    return;
  };

  useEffect(() => {
    isShowDelete &&
      setShowErrorTips({
        template: false,
        catalog: false,
      });
  }, [isShowDelete]);

  const deleteModalProps = {
    isShowDelete,
    setIsShowDelete,
    confirmDelete,
    showErrorTips,
    title: t('template:deleteDataIdentifier'),
  };

  const clkDelete = async () => {
    if (!selectedItems || selectedItems.length === 0) {
      alertMsg(t('selectOneItem'), 'error');
      return;
    }
    setIsShowDelete(true);
  };

  const clkCreate = () => {
    navigate(RouterEnum.CreateIdentifiers.path);
    return;
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
  ]);

  const getPageData = async () => {
    setIsLoading(true);
    try {
      const requestParam = {
        page: currentPage,
        size: preferences.pageSize,
        sort_column: curSortColumn.id,
        asc: !isDescending,
        conditions: [
          {
            column: 'type',
            values: [type],
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
      <TemplateDelete {...deleteModalProps} />
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
