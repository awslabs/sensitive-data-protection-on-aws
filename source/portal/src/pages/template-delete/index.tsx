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
import { useTranslation } from 'react-i18next';

const TemplateDelete = (props: any) => {
  const {
    title,
    isShowDelete,
    setIsShowDelete,
    confirmDelete,
    showErrorTips = {},
    confirmText,
  } = props;
  const { t } = useTranslation();
  const [confirmInput, setConfirmInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const clkConfirmDelete = async () => {
    if (!confirmInput || confirmInput !== t('confirm')) {
      alertMsg(t('confirmDelete'), 'warning');
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
      header={<Header variant="h2">{title}</Header>}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="link"
              onClick={() => setIsShowDelete(false)}
              loading={isLoading}
            >
              {t('button.cancel')}
            </Button>
            {!showErrorTips.template && !showErrorTips.catalog && (
              <Button onClick={clkConfirmDelete} loading={isLoading}>
                {confirmText || t('button.delete')}
              </Button>
            )}
          </SpaceBetween>
        </Box>
      }
    >
      <p className="delete-top">{t('template:deleteIdentifierTips')}</p>
      {(showErrorTips.template || showErrorTips.catalog) && (
        <>
          <div className="delete-identifer">
            <Icon name="status-warning" className="delete-identifer-warning" />
            <span className="warning-desc">
              {t('template:identifierBeingUsed')}
            </span>
            <ul>
              {showErrorTips.template && (
                <li>
                  {t('template:classficationTemplate')}
                  <a href={RouterEnum.Datatemplate.path}>{t('here')}</a>
                </li>
              )}
              {showErrorTips.catalog && (
                <li>
                  {t('template:dataCatalog')}
                  <a href={RouterEnum.Datajob.path}>{t('here')}</a>
                </li>
              )}
            </ul>
          </div>
          <span className="confirm-top">
            {t('template:removeTheseAndDelete')}
          </span>
        </>
      )}
      {!showErrorTips.template && !showErrorTips.catalog && (
        <>
          <span className="confirm-top">{t('template:toAvoidTips')}</span>
          <span className="confirm-agree">{t('template:typeConfirm')}</span>
          <Input
            value={confirmInput}
            onChange={({ detail }) => setConfirmInput(detail.value)}
            placeholder={t('confirm') || ''}
            className="confirm-input"
          />
        </>
      )}
    </Modal>
  );
};

export default TemplateDelete;
