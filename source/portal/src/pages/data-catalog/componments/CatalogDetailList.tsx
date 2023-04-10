import React, { memo, useEffect, useState } from 'react';
import {
  Table,
  Box,
  Icon,
  Pagination,
  CollectionPreferences,
  Select,
  SelectProps,
  Popover,
  StatusIndicator,
} from '@cloudscape-design/components';
import CommonBadge from 'pages/common-badge';
import SchemaModal from './SchemaModal';
import {
  BADGE_TYPE,
  CLSAAIFIED_TYPE,
} from 'pages/common-badge/types/badge_type';
import { COLUMN_OBJECT_STR, UPDATE_FLAG } from '../types/data_config';
import { CatalogDetailListProps } from '../../../ts/data-catalog/types';
import '../style.scss';
import ResourcesFilter from 'pages/resources-filter';
import {
  getDatabaseIdentifiers,
  getTablesByDatabase,
  getTablesByDatabaseIdentifier,
  getColumnsByTable,
  getS3SampleObjects,
  getBucketProperties,
} from 'apis/data-catalog/api';
import { alertMsg, formatSize, toJSON } from 'tools/tools';
import moment from 'moment';
import {
  CONTAINS_PII_OPTION,
  NA_OPTION,
  NON_PII_OPTION,
} from 'pages/common-badge/componments/Options';
import { deepClone } from 'tools/tools';
import { TABLE_NAME } from 'enum/common_types';
import { getIdentifiersList } from 'apis/data-template/api';

const CatalogDetailList: React.FC<CatalogDetailListProps> = memo(
  (props: CatalogDetailListProps) => {
    const {
      catalogType,
      selectRowData,
      columnList,
      needFilter = false,
      needByPage = false,
      detailDesHeader,
      detailDesInfo,
      needSchemaModal = false,
      tagId,
      clickTableCountProp,
      clickIdentifiers,
      selectPageRowData,
      setUpdateData,
      previewDataList,
      setSaveLoading,
      setSaveDisabled,
    } = props;

    const [currentPage, setCurrentPage] = useState(1);

    const [selectDetailRowData, setSelectDetailRowData] = useState({}); //click row data
    const [isLoading, setIsLoading] = useState(false);
    const [showSchemaModal, setShowSchemaModal] = useState(false);
    const [dataList, setDataList] = useState([] as any);
    const [totalCount, setTotalCount] = useState(0);
    const [identifiersFilter, setIdentifiersFilter] =
      useState(clickIdentifiers);
    const [editIndentifier, setEditIndentifier] = useState(null as any);
    const [editPrivacy, setEditPrivacy] = useState(null as any);
    const [selectIndentOption, setSelectIndentOption] = useState(
      null as SelectProps.Option | null
    );
    const [selectPrivacyOption, setSelectPrivacyOption] = useState(
      null as SelectProps.Option | null
    );
    const [preferences, setPreferences] = useState({
      pageSize: 20,
      wrapLines: true,
      visibleContent: columnList.map((o) => o.id),
    } as any);
    const [query, setQuery] = useState({
      tokens: [],
      operation: 'and',
    } as any);
    const [identifierOptions, setIdentifierOptions] = useState([] as any);
    const resourcesFilterProps = {
      totalCount,
      query,
      setQuery,
      tableName: TABLE_NAME.CATALOG_TABLE_LEVEL_CLASSIFICATION,
      columnList: columnList.filter((i) => i.filter),
      filteringPlaceholder: 'Filter catalogs',
    };

    // click Forder or database name to schema
    const clickFolderName = (data: any) => {
      const rowData = {
        ...data,
        name: data.table_name,
      };
      setSelectDetailRowData(rowData);
      setShowSchemaModal(true);
      return;
    };

    const updateFatherPage = () => {
      getPageData();
    };

    const schemaModalProps = {
      showSchemaModal,
      setShowSchemaModal,
      selectRowData: selectDetailRowData,
      catalogType,
      selectPageRowData: selectRowData,
      setSelectRowData: setSelectDetailRowData,
      updateFatherPage,
    };

    const clickEditIcon = (rowData: any, type: string) => {
      setSaveDisabled && setSaveDisabled(false);
      if (type === COLUMN_OBJECT_STR.Identifier) {
        setEditIndentifier(rowData);
        setEditPrivacy(null);
        setSelectIndentOption(null);
      }
      if (type === COLUMN_OBJECT_STR.Privacy) {
        setEditPrivacy(rowData);
        setEditIndentifier(null);
        setSelectPrivacyOption(null);
      }
      return;
    };

    useEffect(() => {
      getPageData();
    }, []);

    useEffect(() => {
      getPageData();
    }, [currentPage, preferences.pageSize]);

    const getPageData = async () => {
      setIsLoading(true);
      switch (tagId) {
        case 'dataIdentifiers':
          await getDataIdentifiers();
          break;
        case COLUMN_OBJECT_STR.Folders:
          await getDataFolders();
          break;
        case COLUMN_OBJECT_STR.Tables:
          await getDataFolders();
          break;
        case COLUMN_OBJECT_STR.Schema:
          setSaveLoading(true);
          await Promise.all([getDataSchema(), getIdentifierOptions()]);
          setSaveLoading(false);
          break;
        case COLUMN_OBJECT_STR.SampleObjects:
          await getDataSampleObjects();
          break;
        case COLUMN_OBJECT_STR.DataPreview:
          await getDataPreview();
          break;
        case COLUMN_OBJECT_STR.BucketProperties:
          await getPropertiesData();
          break;
        default:
          break;
      }
      setIsLoading(false);
    };

    const getIdentifierOptions = async () => {
      const requestParam = {
        page: currentPage,
        size: preferences.pageSize,
        sort_column: '',
        asc: false,
        conditions: [] as any,
      };
      const optList: any = await getIdentifiersList(requestParam);
      if (!optList || !optList.items) {
        return;
      }
      const setOptList = optList.items.map(
        (item: { id: any; name: string }) => {
          return {
            label: '',
            value: '',
            iconSvg: (
              <CommonBadge
                badgeType={BADGE_TYPE.DataIndf}
                badgeLabel={item.name}
                className="fit-select"
              />
            ),
          };
        }
      );
      setOptList.push({
        label: '',
        value: 'N/A',
        labelTag: 'N/A',
      });
      setIdentifierOptions(setOptList);
    };

    const getPropertiesData = async () => {
      const requestParam = {
        account_id: selectRowData.account_id,
        region: selectRowData.region,
        database_type: selectRowData.database_type,
        database_name: selectRowData.database_name,
      };
      const result: any = await getBucketProperties(requestParam);
      if (result && result.length >= 0) {
        const tempPropertiesData = [] as any[];
        result.forEach((item: any[]) => {
          if (item[0] === 'CreationDate') {
            tempPropertiesData.push({
              property: item[0],
              value: item[1]
                ? moment(item[1]).add(8, 'h').format('YYYY-MM-DD HH:mm')
                : item[1],
            });
          } else {
            tempPropertiesData.push({
              property: item[0],
              value:
                item[1] !== undefined && item[1] !== null
                  ? item[1].toString()
                  : item[1],
            });
          }
        });
        setDataList(tempPropertiesData);
      }
      return;
    };

    const getDataPreview = () => {
      setDataList(previewDataList);
    };

    const getDataSampleObjects = async () => {
      const requestParam = {
        account_id: selectRowData.account_id,
        region: selectRowData.region,
        s3_location: selectRowData.storage_location,
        limit: 10,
      };
      const result = await getS3SampleObjects(requestParam);
      if (typeof result !== 'object') {
        alertMsg(result as any, 'error');
        return;
      }
      setDataList(result);
    };

    const getDataIdentifiers = async () => {
      const requestParam = {
        account_id: selectRowData.account_id,
        region: selectRowData.region,
        database_type: selectRowData.database_type,
        database_name: selectRowData.database_name,
        page: currentPage,
        size: preferences.pageSize,
      };
      const result = await getDatabaseIdentifiers(requestParam);
      if (typeof result !== 'object') {
        alertMsg(result as any, 'error');
        return;
      }
      setDataList(result);
    };

    const clearIdentifiersFilter = () => {
      setIdentifiersFilter('');
      getPageData();
    };

    const getDataFolders = async () => {
      const requestParam: any = {
        account_id: selectRowData.account_id,
        region: selectRowData.region,
        database_type: selectRowData.database_type,
        database_name: selectRowData.database_name,
        page: currentPage,
        size: preferences.pageSize,
      };
      let result: any;
      if (identifiersFilter) {
        requestParam.identifier = identifiersFilter;
        result = await getTablesByDatabaseIdentifier(requestParam);
      } else {
        result = await getTablesByDatabase(requestParam);
      }
      if (result && result.items) {
        setDataList(result.items);
        setTotalCount(result.total);
      }
    };

    const getDataSchema = async () => {
      const requestParam = {
        account_id: selectPageRowData.account_id,
        region: selectPageRowData.region,
        database_type: catalogType,
        database_name: selectPageRowData.database_name,
        table_name: selectRowData.table_name,
        page: currentPage,
        size: preferences.pageSize,
      };
      const result: any = await getColumnsByTable(requestParam);
      setTotalCount(result.total);
      setDataList(result.items);
    };

    const clickTableCount = (rowData: any) => {
      clickTableCountProp && clickTableCountProp(rowData);
    };

    const updateSelectChange = (
      tempOption: SelectProps.Option | null | any,
      tempRowData: any,
      editType: string
    ) => {
      let tempDataList;
      if (editType === COLUMN_OBJECT_STR.Privacy) {
        setSelectPrivacyOption(tempOption);
        tempDataList = deepClone(dataList);
        const tempData = tempDataList.filter(
          (item: { id: any }) => item.id === tempRowData.id
        );
        if (tempData && tempData.length > 0) {
          tempData[0][COLUMN_OBJECT_STR.Privacy] = tempOption?.value;
          tempData[0][UPDATE_FLAG] = true;
        }
        setDataList(tempDataList);
      } else {
        setSelectIndentOption(tempOption);
        tempDataList = deepClone(dataList);
        const tempData = tempDataList.filter(
          (item: { id: any }) => item.id === tempRowData.id
        );
        if (tempData && tempData.length > 0) {
          tempData[0][COLUMN_OBJECT_STR.Identifier] =
            tempOption?.iconSvg.props.badgeLabel;
          tempData[0][UPDATE_FLAG] = true;
        }
        setDataList(tempDataList);
      }
      setUpdateData(tempDataList);
    };

    return (
      <div className="catalog-detail-list">
        {identifiersFilter && (
          <div className="filter-identifiers">
            <span className="title-identifiers">
              Identifiers: {identifiersFilter}
            </span>
            <div className="clear-identifiers" onClick={clearIdentifiersFilter}>
              <Icon name="close" alt="clear" size="small" />
            </div>
          </div>
        )}
        <Table
          className="no-shadow"
          variant="embedded"
          loading={isLoading}
          columnDefinitions={
            columnList.map((item) => {
              return {
                id: item.id,
                header: item.label,
                // different column tag
                cell: (e: any) => {
                  if (item.id === 's3objects') {
                    if (!(e as any)['s3_full_path']) {
                      return '';
                    }
                    const pathList = (e as any)['s3_full_path'].split('/');
                    return pathList[pathList.length - 1];
                  }
                  if (
                    item.id === 'size' ||
                    item.id === COLUMN_OBJECT_STR.Size ||
                    item.id === 'file_size'
                  ) {
                    return formatSize((e as any)[item.id]);
                  }
                  if (item.id === COLUMN_OBJECT_STR.DataIdent) {
                    return (
                      <CommonBadge
                        badgeType={BADGE_TYPE.DataIndf}
                        badgeLabel={(e as any)[item.id]}
                      />
                    );
                  }
                  if (item.id === COLUMN_OBJECT_STR.TableCount) {
                    return (
                      <span
                        className="catalog-detail-row-folders hander"
                        onClick={() => clickTableCount(e)}
                      >
                        {(e as any)[item.id]}
                      </span>
                    );
                  }
                  if (item.id === COLUMN_OBJECT_STR.FolderName) {
                    return (
                      <span
                        className="catalog-detail-row-folders hander"
                        onClick={() => clickFolderName(e as any)}
                      >
                        {(e as any)[item.id]}
                      </span>
                    );
                  }
                  if (item.id === COLUMN_OBJECT_STR.Privacy) {
                    if (editPrivacy && editPrivacy.id === (e as any).id) {
                      return (
                        <div className="detail-edit-icon-width">
                          <div>
                            <Select
                              selectedOption={selectPrivacyOption}
                              onChange={(select) => {
                                updateSelectChange(
                                  select.detail.selectedOption,
                                  e as any,
                                  COLUMN_OBJECT_STR.Privacy
                                );
                              }}
                              triggerVariant="option"
                              options={[
                                CONTAINS_PII_OPTION,
                                NON_PII_OPTION,
                                NA_OPTION,
                              ]}
                              selectedAriaLabel="Selected"
                              onBlur={() => {
                                setEditPrivacy(null);
                              }}
                            ></Select>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="detail-edit-icon">
                          <CommonBadge
                            badgeType={BADGE_TYPE.Privacy}
                            badgeLabel={(e as any)[item.id]}
                          />
                          {tagId === COLUMN_OBJECT_STR.Schema && (
                            <div
                              onClick={() =>
                                clickEditIcon(
                                  e as any,
                                  COLUMN_OBJECT_STR.Privacy
                                )
                              }
                            >
                              <Icon name="edit" className="modal-badge-edit" />
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  if (item.id === COLUMN_OBJECT_STR.Identifier) {
                    if (
                      editIndentifier &&
                      editIndentifier.id === (e as any).id
                    ) {
                      return (
                        <div className="detail-edit-icon-max-width">
                          <div className="detail-edit-icon-max-height">
                            <Select
                              selectedOption={selectIndentOption}
                              onChange={(select) => {
                                updateSelectChange(
                                  select.detail.selectedOption,
                                  e as any,
                                  COLUMN_OBJECT_STR.Identifier
                                );
                              }}
                              triggerVariant="option"
                              options={identifierOptions}
                              selectedAriaLabel="Selected"
                              onBlur={() => {
                                setEditIndentifier(null);
                              }}
                            ></Select>
                          </div>
                        </div>
                      );
                    } else {
                      if (tagId === COLUMN_OBJECT_STR.Schema) {
                        const showIdentifierObj = toJSON(
                          (e as any)[item.id]
                        ) || { 'N/A': 1 };
                        const identifierList = Object.keys(showIdentifierObj);
                        const showTxt = showIdentifierObj[identifierList[0]]
                          ? identifierList[0]
                          : 'N/A';
                        return (
                          <div className="detail-edit-icon">
                            <CommonBadge
                              badgeType={BADGE_TYPE.DataIndf}
                              badgeLabel={showTxt}
                            />
                            <div
                              onClick={() =>
                                clickEditIcon(
                                  e as any,
                                  COLUMN_OBJECT_STR.Identifier
                                )
                              }
                            >
                              <Icon name="edit" className="modal-badge-edit" />
                            </div>
                          </div>
                        );
                      }
                      const showIdentifier =
                        !(e as any)[item.id] ||
                        (e as any)[item.id].indexOf('N/A') > -1
                          ? 'N/A'
                          : (e as any)[item.id];
                      return (
                        <CommonBadge
                          badgeType={BADGE_TYPE.DataIndf}
                          badgeLabel={showIdentifier}
                        />
                      );
                    }
                  }
                  if (item.id === COLUMN_OBJECT_STR.IdentifierScore) {
                    return (
                      <span>
                        {parseFloat((e as any)[item.id]) > 0
                          ? `${parseFloat((e as any)[item.id]) * 100}%`
                          : '0'}
                      </span>
                    );
                  }
                  if (item.id === COLUMN_OBJECT_STR.Classifiedby) {
                    return (
                      <CommonBadge
                        badgeType={BADGE_TYPE.Classified}
                        badgeLabel={
                          (e as any)[COLUMN_OBJECT_STR.LastModifyBy]
                            ? (e as any)[COLUMN_OBJECT_STR.LastModifyBy] ===
                              CLSAAIFIED_TYPE.System
                              ? CLSAAIFIED_TYPE.System
                              : CLSAAIFIED_TYPE.Manual
                            : CLSAAIFIED_TYPE.SystemMark
                        }
                      />
                    );
                  }
                  if (
                    item.id === COLUMN_OBJECT_STR.LastModifyBy &&
                    (e as any)[item.id] === 'SDPS'
                  ) {
                    return 'System';
                  }
                  if (item.id === COLUMN_OBJECT_STR.LastModifyAt) {
                    return moment((e as any)[item.id])
                      .add(8, 'h')
                      .format('YYYY-MM-DD HH:mm');
                  }
                  if (
                    item.id === 'column_value_example' ||
                    item.id === 'column_type'
                  ) {
                    if (!(e as any)[item.id]) {
                      return '';
                    }
                    if ((e as any)[item.id].length > 90) {
                      return (
                        <Popover
                          dismissButton={false}
                          position="top"
                          size={
                            item.id === 'column_value_example'
                              ? 'large'
                              : 'small'
                          }
                          content={
                            <StatusIndicator type="info">
                              {(e as any)[item.id]}
                            </StatusIndicator>
                          }
                        >
                          {(e as any)[item.id].substr(0, 90)}...
                        </Popover>
                      );
                    }
                    return (e as any)[item.id];
                  }
                  return (e as any)[item.id];
                },
                sortingField: item.sortingField,
                minWidth: item.id === 'column_value_example' ? 300 : undefined,
              };
            }) as any
          }
          // resizableColumns
          items={dataList}
          loadingText="Loading resources"
          visibleColumns={preferences.visibleContent}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No data identfiers</b>
              <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                No data in this catalog was identfied as sensitive data.
              </Box>
            </Box>
          }
          filter={needFilter && <ResourcesFilter {...resourcesFilterProps} />}
          header={
            detailDesHeader && (
              <div className="deatil-desc-body">
                <span className="deatil-desc-header">{detailDesHeader}</span>
                {detailDesInfo && (
                  <span className="deatil-desc-info">{detailDesInfo}</span>
                )}
              </div>
            )
          }
          pagination={
            needByPage && (
              <Pagination
                currentPageIndex={currentPage}
                onChange={({ detail }) =>
                  setCurrentPage(detail.currentPageIndex)
                }
                pagesCount={Math.ceil(totalCount / preferences.pageSize)}
                ariaLabels={{
                  nextPageLabel: 'Next page',
                  previousPageLabel: 'Previous page',
                  pageLabel: (pageNumber) => `Page ${pageNumber} of all pages`,
                }}
              />
            )
          }
          preferences={
            needByPage && (
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
            )
          }
        />
        {needSchemaModal && showSchemaModal && (
          <SchemaModal {...schemaModalProps} />
        )}
      </div>
    );
  }
);

export default CatalogDetailList;
