import RightModal from 'pages/right-modal';
import React from 'react';
import '../style.scss';
import CommonBadge from 'pages/common-badge';
import {
  BADGE_TYPE,
  CLSAAIFIED_TYPE,
} from 'pages/common-badge/types/badge_type';
import { Tabs } from '@cloudscape-design/components';
import JobHistory from './JobHistory';
import JobProperties from './JobProperties';
import JobCatalogs from './JobCatalogs';
import { useTranslation } from 'react-i18next';

const JobDetailModal = (props: any) => {
  const { showDetailModal, setShowDetailModal, detailRow } = props;
  const { t } = useTranslation();
  let tempType = CLSAAIFIED_TYPE.Success;
  if (detailRow.state === 'Active (idle)') {
    tempType = CLSAAIFIED_TYPE.SystemMark;
  }
  if (detailRow.state === 'Running') {
    tempType = CLSAAIFIED_TYPE.System;
  }
  if (detailRow.state === 'Stopped') {
    tempType = CLSAAIFIED_TYPE.Stopped;
  }
  if (detailRow.state === 'Paused') {
    tempType = CLSAAIFIED_TYPE.Unconnected;
  }

  return (
    <RightModal
      className="job-detail"
      setShowModal={setShowDetailModal}
      showModal={showDetailModal}
      header={t('job:detail.name')}
      showFolderIcon={true}
    >
      <div className="modal-body-header">
        <span className="modal-body-span">{detailRow.name}</span>
        <CommonBadge
          badgeType={BADGE_TYPE.Classified}
          badgeLabel={detailRow.state}
          labelType={tempType}
        />
      </div>
      <Tabs
        className="modal-body-tabs"
        tabs={[
          {
            id: 'jobHistory',
            label: t('tab.jobHistory'),
            content: (
              <div className="pd-10">
                <JobHistory detailRow={detailRow} />
              </div>
            ),
          },
          {
            id: 'jobProperties',
            label: t('tab.jobProperties'),
            content: (
              <div className="pd-10">
                <JobProperties detailRow={detailRow} />
              </div>
            ),
          },
          {
            id: 'dataCatalogs',
            label: t('tab.dataCatalogs'),
            content: (
              <div className="pd-10">
                <JobCatalogs detailRow={detailRow} />
              </div>
            ),
          },
        ]}
      />
    </RightModal>
  );
};

export default JobDetailModal;
