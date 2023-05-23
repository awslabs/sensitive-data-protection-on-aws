import { Container, Header } from '@cloudscape-design/components';
import React from 'react';
import '../style.scss';
import SourceBadge from './SourceBadge';
import { useTranslation } from 'react-i18next';

const DataSourceInfo: React.FC<any> = ({ accountData }: any) => {
  const { t } = useTranslation();
  return (
    <Container
      className="datasource-container"
      header={
        <Header variant="h2" description={t('datasource:basicInfoDesc')}>
          {t('datasource:basicInfo')}
        </Header>
      }
    >
      <div>
        <div className="datasource-container-item">
          <p className="p-title">{t('table.label.awsAccount')}</p>
          <span className="datasource-container-account">
            {accountData.aws_account_id}
          </span>
        </div>
        <div className="datasource-container-item">
          <p className="p-title">{t('table.label.awsRegion')}</p>
          <span>{accountData.region}</span>
        </div>
        <div className="datasource-container-item">
          <p className="p-title">{t('datasource:authStatus')}</p>
          <SourceBadge
            instanceStatus={
              accountData.stack_instance_status
                ? accountData.stack_instance_status
                : accountData.status
                ? 'SUCCEEDED'
                : 'CURRENT'
            }
          />
        </div>
        <div className="datasource-container-item">
          <p className="p-title">{t('datasource:statusReason')}</p>
          <span>{accountData.stack_status}</span>
        </div>
        <div className="datasource-container-item">
          <p className="p-title">{t('datasource:organization')}</p>
          <span>{accountData.organization_unit_id}</span>
        </div>
      </div>
    </Container>
  );
};

export default DataSourceInfo;
