import React, { useEffect, useState } from 'react';
import {
  Icon,
  Tabs,
  Select,
  SelectProps,
  Button,
} from '@cloudscape-design/components';
import CommonBadge from 'pages/common-badge';
import CatalogDetailList from './CatalogDetailList';
import RightModal from 'pages/right-modal';
import {
  S3_MODAL_TABS,
  RDS_MODAL_TABS,
  DATA_IDENT_COLUMN,
  FOLDERS_COLUMN,
  BUCKET_PROPERTIES_COLUMN,
  TABLES_COLUMN,
  COLUMN_OBJECT_STR,
  RDS_DATA_IDENT_COLUMN,
} from '../types/data_config';
import {
  BADGE_TYPE,
  PRIVARY_TYPE_DATA,
  PRIVARY_TYPE_INT_DATA,
} from 'pages/common-badge/types/badge_type';
import { CatalogDetailListProps } from '../../../ts/data-catalog/types';
import { DATA_TYPE_ENUM } from 'enum/common_types';
import { updateCatalogDatabase } from 'apis/data-catalog/api';
import '../style.scss';
import { alertMsg } from 'tools/tools';
import {
  NA_OPTION,
  CONTAINS_PII_OPTION,
  NON_PII_OPTION,
} from 'pages/common-badge/componments/Options';

const DetailModal: React.FC<any> = (props: any) => {
  const {
    showDetailModal,
    setShowDetailModal,
    catalogType,
    selectRowData,
    setSelectRowData,
    updateFatherPage,
  } = props;

  const modalTabs =
    catalogType === DATA_TYPE_ENUM.s3 ? S3_MODAL_TABS : RDS_MODAL_TABS;

  const [clickIdentifiers, setClickIdentifiers] = useState('');
  const [activeTabId, setActiveTabId] = useState(modalTabs[0].id);
  const [isShowEditSelect, setIsShowEditSelect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    null as SelectProps.Option | null
  );
  useEffect(() => {
    if (
      typeof selectRowData.privacy !== 'number' &&
      typeof selectRowData.privacy !== 'string'
    ) {
      return;
    }
    if (selectRowData.privacy.toString() === PRIVARY_TYPE_INT_DATA['N/A']) {
      setSelectedOption(NA_OPTION as any);
    }
    if (selectRowData.privacy.toString() === PRIVARY_TYPE_DATA.ContainsPII) {
      setSelectedOption(CONTAINS_PII_OPTION as any);
    }
    if (selectRowData.privacy === PRIVARY_TYPE_DATA.NonPII) {
      setSelectedOption(NON_PII_OPTION as any);
    }
  }, []);

  const clickTableCountProp = (clickRowData: any) => {
    setClickIdentifiers(clickRowData.identifier);
    if (catalogType === DATA_TYPE_ENUM.s3) {
      setActiveTabId(COLUMN_OBJECT_STR.Folders);
    } else {
      setActiveTabId(COLUMN_OBJECT_STR.Tables);
    }
  };

  const clkCheckIcon = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const requestParam = {
      ...selectRowData,
    };
    requestParam[BADGE_TYPE.Privacy] = selectedOption?.value;
    const result = await updateCatalogDatabase(requestParam);
    setIsLoading(false);
    if (result) {
      alertMsg('Update Success', 'success');
      setIsShowEditSelect(false);
      setSelectRowData(requestParam);
      updateFatherPage();
    } else {
      alertMsg('Update Error', 'error');
    }
  };

  const tabsContent = modalTabs.map((item) => {
    let tempProps: CatalogDetailListProps = {
      columnList: DATA_IDENT_COLUMN,
      catalogType,
      tagId: item.id,
      selectRowData,
    };
    if (item.id === 'dataIdentifiers' && catalogType === DATA_TYPE_ENUM.s3) {
      tempProps = {
        columnList: DATA_IDENT_COLUMN,
        catalogType,
        tagId: item.id,
        detailDesInfo: item.detailDesInfo,
        detailDesHeader: item.detailDesHeader,
        selectRowData,
        clickTableCountProp,
      };
    }
    if (item.id === 'dataIdentifiers' && catalogType === DATA_TYPE_ENUM.rds) {
      tempProps = {
        columnList: RDS_DATA_IDENT_COLUMN,
        catalogType,
        tagId: item.id,
        detailDesInfo: item.detailDesInfo,
        detailDesHeader: item.detailDesHeader,
        selectRowData,
        clickTableCountProp,
      };
    }
    if (item.id === COLUMN_OBJECT_STR.Folders) {
      tempProps = {
        columnList: FOLDERS_COLUMN,
        catalogType,
        tagId: item.id,
        needSchemaModal: true,
        detailDesInfo: item.detailDesInfo,
        detailDesHeader: item.detailDesHeader,
        selectRowData,
        needByPage: true,
        clickIdentifiers,
      };
    }
    if (item.id === COLUMN_OBJECT_STR.Tables) {
      tempProps = {
        columnList: TABLES_COLUMN,
        catalogType,
        tagId: item.id,
        needSchemaModal: true,
        detailDesInfo: item.detailDesInfo,
        detailDesHeader: item.detailDesHeader,
        selectRowData,
      };
    }
    if (item.id === 'bucketProperties') {
      tempProps = {
        columnList: BUCKET_PROPERTIES_COLUMN,
        catalogType,
        tagId: item.id,
        detailDesInfo: item.detailDesInfo,
        detailDesHeader: item.detailDesHeader,
        selectRowData,
      };
    }

    return {
      id: item.id,
      label: item.label,
      content: <CatalogDetailList {...tempProps} />,
    };
  });

  return (
    <RightModal
      className="detail-modal"
      setShowModal={setShowDetailModal}
      showModal={showDetailModal}
      header={
        catalogType === DATA_TYPE_ENUM.s3
          ? 'S3 bucket details'
          : 'RDS instance details'
      }
      showFolderIcon={true}
    >
      <div className="modal-body-header">
        <span className="modal-body-span">{selectRowData.name}</span>
        {!isShowEditSelect && (
          <CommonBadge
            badgeType={BADGE_TYPE.Privacy}
            badgeLabel={selectRowData[BADGE_TYPE.Privacy]}
          />
        )}
        {(selectRowData[BADGE_TYPE.Privacy] ||
          selectRowData[BADGE_TYPE.Privacy] >= -1) &&
          !isShowEditSelect && (
            <div
              onClick={() => setIsShowEditSelect(true)}
              className="modal-badge-edit"
            >
              <Icon name="edit" />
            </div>
          )}
        {isShowEditSelect && (
          <div className="edit-privary">
            <div className="edit-privary-select">
              <Select
                onChange={(e) => {
                  setSelectedOption(e.detail.selectedOption as any);
                }}
                selectedOption={selectedOption}
                triggerVariant="option"
                options={[CONTAINS_PII_OPTION, NON_PII_OPTION, NA_OPTION]}
                selectedAriaLabel="Selected"
              ></Select>
            </div>
            <div className="check-icon">
              {/* <Icon name="check" size="medium" /> */}
              <Button onClick={clkCheckIcon} iconName="check"></Button>
            </div>
          </div>
        )}
      </div>
      <Tabs
        className="modal-body-tabs"
        tabs={tabsContent}
        onChange={({ detail }) => {
          setActiveTabId(detail.activeTabId);
          setClickIdentifiers('');
        }}
        activeTabId={activeTabId}
      />
    </RightModal>
  );
};

export default DetailModal;
