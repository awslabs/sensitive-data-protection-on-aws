import {
  Box,
  Button,
  Header,
  Icon,
  Input,
  Modal,
  SpaceBetween,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import { alertMsg } from 'tools/tools';
import './style.scss';
import { RouterEnum } from 'routers/routerEnum';

const TemplateDelete = (props: any) => {
  const {
    isShowDelete,
    setIsShowDelete,
    confirmDelete,
    showErrorTips = {},
  } = props;
  const [confirmInput, setConfirmInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const clkConfirmDelete = async () => {
    if (!confirmInput || confirmInput.toLowerCase() !== 'confirm') {
      alertMsg('Please confirm delete', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      await confirmDelete();
      setIsShowDelete(false);
    } catch (error) {
      console.warn(error);
    }
    setIsLoading(false);
  };
  useEffect(() => {
    if (!isShowDelete) {
      setConfirmInput('');
    }
  }, [isShowDelete]);
  return (
    <Modal
      visible={isShowDelete}
      onDismiss={() => setIsShowDelete(false)}
      header={<Header variant="h2">Delete a data identifier</Header>}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="link"
              onClick={() => setIsShowDelete(false)}
              loading={isLoading}
            >
              Cancel
            </Button>
            {!showErrorTips.template && !showErrorTips.catalog && (
              <Button onClick={clkConfirmDelete} loading={isLoading}>
                Delete
              </Button>
            )}
          </SpaceBetween>
        </Box>
      }
    >
      <p className="delete-top">
        Delete this data identifier permanently? This action cannot be undone.
      </p>
      {(showErrorTips.template || showErrorTips.catalog) && (
        <>
          <div className="delete-identifer">
            <Icon name="status-warning" className="delete-identifer-warning" />
            <span className="warning-desc">
              This identifier is being used in the following place
            </span>
            <ul>
              {showErrorTips.template && (
                <li>
                  Classification template, click{' '}
                  <a href={RouterEnum.Datatemplate.path}>here</a>
                </li>
              )}
              {showErrorTips.catalog && (
                <li>
                  Data catalogs, click{' '}
                  <a href={RouterEnum.Datajob.path}>here</a>
                </li>
              )}
            </ul>
          </div>
          <span className="confirm-top">
            Please remove these identifier and then delete
          </span>
        </>
      )}
      {!showErrorTips.template && !showErrorTips.catalog && (
        <>
          <span className="confirm-top">
            To avoid accidental deletions we ask you to provide additional
            written consent.
          </span>
          <span className="confirm-agree">Type “Confirm” to agree</span>
          <Input
            value={confirmInput}
            onChange={({ detail }) => setConfirmInput(detail.value)}
            placeholder="Confirm"
            className="confirm-input"
          />
        </>
      )}
    </Modal>
  );
};

export default TemplateDelete;
