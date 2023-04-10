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

const JobDetailModal = (props: any) => {
  const { showDetailModal, setShowDetailModal, detailRow } = props;
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
      header="Job details"
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
            label: 'Job history',
            content: <JobHistory detailRow={detailRow} />,
          },
          {
            id: 'jobProperties',
            label: 'Job properties',
            content: <JobProperties detailRow={detailRow} />,
          },
          {
            id: 'dataCatalogs',
            label: 'Data catalogs',
            content: <JobCatalogs detailRow={detailRow} />,
          },
        ]}
      />
    </RightModal>
  );
};

export default JobDetailModal;
