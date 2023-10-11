import { Container, Header } from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import '../style.scss';
import SourceBadge from './SourceBadge';
import { useTranslation } from 'react-i18next';

const DataSourceInfo: React.FC<any> = ({ accountData }: any) => {
  const { t } = useTranslation();
  useEffect(()=>{
    console.log("accountData is",accountData)
  })

  const [providerType, setProviderType] = useState('AWS')
  // genProvider(accountData.account_provider_id)

  useEffect(()=>{
    let type = 'AWS'
    if(accountData.account_provider_id === 2){
      type = "TENCENT CLOUD"
    }
    else if(accountData.provider_id === 3){
      type = "GOOGLE CLOUD"
    }
    setProviderType(type)

  },[])
  const genProvider = (provider_id: number): string=>{
    if(provider_id == 2){
      return "TENCENT CLOUD"
    }
    else if(provider_id == 3){
      return "GOOGLE CLOUD"
    } else {
      return "AWS CLOUD"
    }
  }
  return (
    <Container
      className="datasource-container"
      header={
        <Header variant="h2" description={t('datasource:basicInfoDesc2', {providerType})}>
          {t('datasource:basicInfo')}
        </Header>
      }
    >
      <div>
      {accountData.account_provider_id !== 1 && (
      <div className="datasource-container-item">
          <p className="p-title">{t('table.label.provider')}</p>
          <span className="datasource-container-account">
            {genProvider(accountData.account_provider_id)}
          </span>
        </div>)}
        <div className="datasource-container-item">
          <p className="p-title">{t('table.label.awsAccount')}</p>
          <span className="datasource-container-account">
            {accountData.account_id}
          </span>
        </div>
        <div className="datasource-container-item">
          <p className="p-title">{t('table.label.awsRegion')}</p>
          <span>{accountData.region}</span>
        </div>
        {accountData.account_provider_id === 1 && (<><div className="datasource-container-item">
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
        </div></>)}
        
      </div>
    </Container>
  );
};

export default DataSourceInfo;
