import {
  AppLayout,
  Box,
  Button,
  CollectionPreferences,
  Container,
  Header,
  Pagination,
  SpaceBetween,
  Table,
  Tabs,
  Toggle,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import './style.scss';
import CommonBadge from 'pages/common-badge';
import { BADGE_TYPE, PRIVARY_TYPE } from 'pages/common-badge/types/badge_type';
import { TEMPLATE_COLUMN_LIST } from './types/template_type';
import ResourcesFilter from 'pages/resources-filter';
import {
  getTemplateMappingList,
  deleteTemplateMapping,
  updateTemplateMapping,
  getTemplateUpdateTime,
} from 'apis/data-template/api';
import {
  alertMsg,
  deepClone,
  showHideSpinner,
  useDidUpdateEffect,
} from 'tools/tools';
import { OptionDefinition } from '@cloudscape-design/components/internal/components/option/interfaces';
import TemplateDelete from 'pages/template-delete';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import RightModal from 'pages/right-modal';
import AddCustomIdentfier from './componments/AddCustomIdentfier';
import { TABLE_NAME } from 'enum/common_types';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';

const DataTemplateHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Header
      variant="h1"
      description="A classification template contains a set of data identifiers. Sensitive data discovery job uses a classification template to identify sensitive data. "
      actions={
        <Button onClick={() => navigate(RouterEnum.TemplateIdentifiers.path)}>
          Manage data identfiers
        </Button>
      }
    >
      Define classification template
    </Header>
  );
};

const DEFAULT_QUERY = {
  tokens: [],
  operation: 'and',
};

const buildTimeFormat = (dateString: string) => {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  const hour = dateString.substring(8, 10);
  const minute = dateString.substring(10, 12);
  const second = dateString.substring(12, 14);
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const DataTemplateContent: React.FC<any> = (props: any) => {
  const columnList = TEMPLATE_COLUMN_LIST;

  const [totalCount, setTotalCount] = useState(0);
  const [pageData, setPageData] = useState([] as any);
  const [preferences, setPreferences] = useState({
    pageSize: 20,
    wrapLines: true,
    visibleContent: columnList.map((o) => o.id),
  } as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([] as any[]);
  const [toggleEnable, setToggleEnable] = useState({} as any);
  const [query, setQuery] = useState(DEFAULT_QUERY as any);
  const [isShowDelete, setIsShowDelete] = useState(false);
  const [showAddCustomIdentfier, setShowAddCustomIdentfier] = useState(false);
  const resourcesFilterProps = {
    totalCount,
    columnList: columnList.filter((i) => i.filter),
    query,
    setQuery,
    tableName: TABLE_NAME.TEMPLATE_IDENTIFIER,
    filteringPlaceholder: 'Filter data identifiers',
  };

  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [curSortColumn, setCurSortColumn] = useState<any>('');
  const [isDescending, setIsDescending] = useState(false);

  useEffect(() => {
    getPageData();
  }, []);

  useDidUpdateEffect(() => {
    getPageData();
  }, [currentPage, preferences.pageSize]);

  useDidUpdateEffect(() => {
    setCurrentPage(1);
    getPageData();
  }, [query, isDescending, curSortColumn]);

  const getPageData = async () => {
    setIsLoading(true);
    getUpdateTime();
    const requestParam = {
      page: currentPage,
      size: preferences.pageSize,
      sort_column: curSortColumn.id,
      asc: !isDescending,
      conditions: [
        {
          column: 'template_id',
          values: ['1'],
          condition: 'and',
        },
      ] as any,
    };
    query.tokens &&
      query.tokens.forEach((item: any) => {
        requestParam.conditions.push({
          column: item.propertyKey,
          values: [`${item.value}`],
          operation: item.operator,
          condition: 'and'
        });
      });
    const result: any = await getTemplateMappingList(requestParam);
    setPageData(result.items);
    const tempTogData: any = {};
    result.items.forEach((itemData: { id: string | number; status: any }) => {
      tempTogData[itemData.id] = !!itemData.status;
    });
    setSelectedItems([]);
    setToggleEnable(tempTogData);
    setTotalCount(result.total);
    setIsLoading(false);
  };

  const getUpdateTime = async () => {
    const result: any = await getTemplateUpdateTime();
    console.info('result:', result);
    if (result && result.length > 10) {
      setLastUpdateTime(buildTimeFormat(result));
    }
  };

  const setToggleChecked = async (checked: boolean, rowData: any) => {
    const tempToggle = deepClone(toggleEnable);
    tempToggle[rowData.id] = checked;
    setToggleEnable(tempToggle);
    const requestParam = {
      id: rowData.id,
      template_id: 1,
      identifier_id: rowData.identifier_id,
      status: checked ? 1 : 0,
    };
    const result = await updateTemplateMapping(requestParam);
    if (!result) {
      alertMsg('Change enable error', 'error');
    }
  };

  const confirmDelete = async () => {
    const requestParam = {
      id: selectedItems[0].id,
    };
    showHideSpinner(true);
    try {
      await deleteTemplateMapping(requestParam);
      alertMsg('Delete success', 'success');
      showHideSpinner(false);
      getPageData();
    } catch (error) {
      showHideSpinner(false);
    }
  };

  const deleteModalProps = { isShowDelete, setIsShowDelete, confirmDelete };

  const clkDelete = async (selectedOption: string | OptionDefinition) => {
    if (selectedOption !== 'delete') {
      return;
    }
    if (!selectedItems || selectedItems.length === 0) {
      alertMsg('Please select one', 'error');
      return;
    }
    setIsShowDelete(true);
  };

  const clkAddDataIdentifier = () => {
    setShowAddCustomIdentfier(true);
    return;
  };

  const addCallBack = () => {
    setShowAddCustomIdentfier(false);
    setQuery(DEFAULT_QUERY);
    setCurrentPage(1);
    getPageData();
  };

  return (
    <SpaceBetween direction="vertical" size="xl" className="mapping-container">
      <Container
        header={<Header variant="h2">How it works</Header>}
        className="template-container"
      >
        <span className="template-container-title">
          Define classification template for privacy.
        </span>
        <br></br>
        <p>
          The platform will label data catalog with privacy tag &nbsp;&nbsp;
          <CommonBadge
            badgeType={BADGE_TYPE.Privacy}
            badgeLabel={PRIVARY_TYPE.ContainsPII}
          />
          &nbsp;&nbsp; if data matches the enabled data identifier’s rule.
        </p>
        <p>
          The platform will label data catalog with privacy tag &nbsp;&nbsp;
          <CommonBadge
            badgeType={BADGE_TYPE.Privacy}
            badgeLabel={PRIVARY_TYPE.NonPII}
          />
          &nbsp;&nbsp; if data is scanned, but not matched with any of enabled
          data identifiers.
        </p>
        <p>If a data is never scanned, the privacy tag shows “N/A”</p>
      </Container>
      <Table
        className="template-table"
        selectionType="single"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems)
        }
        resizableColumns
        ariaLabels={{
          selectionGroupLabel: 'Items selection',
          allItemsSelectionLabel: ({ selectedItems }) =>
            `${selectedItems.length} ${
              selectedItems.length === 1 ? 'item' : 'items'
            } selected`,
          itemSelectionLabel: ({ selectedItems }, item) => {
            const isItemSelected = selectedItems.filter(
              (i) =>
                (i as any)[columnList[0].id] === (item as any)[columnList[0].id]
            ).length;
            return `${(item as any)[columnList[0].id]} is ${
              isItemSelected ? '' : 'not'
            } selected`;
          },
        }}
        items={pageData}
        sortingColumn={curSortColumn}
        sortingDescending={isDescending}
        onSortingChange={(e) => {
          setCurSortColumn(e.detail.sortingColumn);
          setIsDescending(e.detail.isDescending || false);
        }}
        columnDefinitions={columnList.map((item) => {
          return {
            id: item.id,
            header: item.label,
            sortingField: item.sortingField,
            cell: (e: any) => {
              if (item.id === 'type') {
                if ((e as any)[item.id] === 0) {
                  return 'Built-in';
                } else {
                  return 'Custom';
                }
              }
              if (item.id === 'enabled') {
                return (
                  <Toggle
                    onChange={({ detail }) =>
                      setToggleChecked(detail.checked, e)
                    }
                    checked={!!toggleEnable[e.id]}
                  ></Toggle>
                );
              }
              return (e as any)[item.id];
            },
          };
        })}
        header={
          <>
            <Header
              variant="h2"
              description="The identifiers in this template will be used in sensitive data discovery job."
              counter={`(${totalCount})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <span className="description">
                    <b>
                      Last updated <br />
                      {lastUpdateTime}
                    </b>
                  </span>
                  <Button
                    onClick={getPageData}
                    loading={isLoading}
                    iconName="refresh"
                  />
                  <Button
                    onClick={() => clkDelete('delete')}
                    loading={isLoading}
                    disabled={selectedItems.length === 0}
                  >
                    Remove
                  </Button>
                  <Button onClick={clkAddDataIdentifier}>
                    Add data identifier
                  </Button>
                </SpaceBetween>
              }
            >
              Data identifiers in this template
            </Header>
          </>
        }
        loadingText="Loading resources"
        visibleColumns={preferences.visibleContent}
        empty={
          <Box textAlign="center" color="inherit">
            <b>No resources</b>
            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
              No resources to display.
            </Box>
          </Box>
        }
        filter={<ResourcesFilter {...resourcesFilterProps} />}
        pagination={
          <Pagination
            currentPageIndex={currentPage}
            onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
            pagesCount={Math.ceil(totalCount / preferences.pageSize)}
            ariaLabels={{
              nextPageLabel: 'Next page',
              previousPageLabel: 'Previous page',
              pageLabel: (pageNumber) => `Page ${pageNumber} of all pages`,
            }}
          />
        }
        preferences={
          <CollectionPreferences
            onConfirm={({ detail }) => setPreferences(detail)}
            preferences={preferences}
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            pageSizePreference={{
              title: 'Select page size',
              options: [
                { value: 10, label: '10 resources' },
                { value: 20, label: '20 resources' },
                { value: 50, label: '50 resources' },
                { value: 100, label: '100 resources' },
              ],
            }}
            visibleContentPreference={{
              title: 'Select visible content',
              options: [
                {
                  label: 'Main distribution properties',
                  options: columnList,
                },
              ],
            }}
          />
        }
        loading={isLoading}
      />
      <TemplateDelete {...deleteModalProps} />
      <RightModal
        setShowModal={setShowAddCustomIdentfier}
        showModal={showAddCustomIdentfier}
        header="Add data identifiers"
        showFolderIcon={false}
      >
        <div className="add-identfier-modal">
          <AddCustomIdentfier addCallBack={addCallBack} />
        </div>
      </RightModal>
    </SpaceBetween>
  );
};

const DataTemplate: React.FC = () => {
  const breadcrumbItems = [
    { text: 'Sensitive Data Protection Solution', href: RouterEnum.Home.path },
    {
      text: 'Define classification template',
      href: RouterEnum.Datatemplate.path,
    },
  ];

  return (
    <AppLayout
      contentHeader={<DataTemplateHeader />}
      content={
        <Tabs
          className="privacy-tab"
          tabs={[
            {
              label: 'Privacy',
              id: 'Privacy',
              content: <DataTemplateContent />,
            },
          ]}
        />
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.Datatemplate.path} />}
      navigationWidth={290}
    />
  );
};

export default DataTemplate;
