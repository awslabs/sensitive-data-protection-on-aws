import React from 'react';
import '../style.scss';
import { useTranslation } from 'react-i18next';

const RunStatusPercent = (props: any) => {
  const {
    success = 0.2,
    running = 0.35,
    failed = 0.1,
    ready = 0.2,
    other = 0.15,
  } = props;
  const { t } = useTranslation();
  return (
    <div className="run-status">
      <div className="run-status-percent">
        <div
          className="run-status-basic run-status-success"
          style={{ width: `${success * 95}%` }}
        ></div>
        <div
          className="run-status-basic run-status-running"
          style={{ width: `${running * 95}%` }}
        ></div>
        <div
          className="run-status-basic run-status-failed"
          style={{ width: `${failed * 95}%` }}
        ></div>
        <div
          className="run-status-basic run-status-ready"
          style={{ width: `${ready * 95}%` }}
        ></div>
        <div
          className="run-status-basic run-status-other"
          style={{ width: `${other * 95}%` }}
        ></div>
      </div>
      <div className="run-status-color">
        <div className="color-item">
          <div className="success-color color-basic"></div>
          <span>{t('SUCCEEDED')}</span>
        </div>
        <div className="color-item">
          <div className="running-color color-basic"></div>
          <span>{t('RUNNING')}</span>
        </div>
        <div className="color-item">
          <div className="failed-color color-basic"></div>
          <span>{t('FAILED')}</span>
        </div>
        <div className="color-item">
          <div className="ready-color color-basic"></div>
          <span>{t('READY')}</span>
        </div>
        <div className="color-item">
          <div className="other-color color-basic"></div>
          <span>{t('OTHERS')}</span>
        </div>
      </div>
    </div>
  );
};

export default RunStatusPercent;
