import { Container, Header } from '@cloudscape-design/components';
import React from 'react';
import '../style.scss';
import SourceBadge from './SourceBadge';

const DataSourceInfo: React.FC<any> = ({ accountData }: any) => {
  return (
    <Container
      className="datasource-container"
      header={
        <Header
          variant="h2"
          description="Basic information of this AWS account"
        >
          Basic information
        </Header>
      }
    >
      <div>
        <div className="datasource-container-item">
          <p className="p-title">AWS account</p>
          <span className="datasource-container-account">
            {accountData.aws_account_id}
          </span>
        </div>
        <div className="datasource-container-item">
          <p className="p-title">AWS region</p>
          <span>{accountData.region}</span>
        </div>
        <div className="datasource-container-item">
          <p className="p-title">Authentication status</p>
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
          <p className="p-title">Status reason</p>
          <span>{accountData.stack_status}</span>
        </div>
        <div className="datasource-container-item">
          <p className="p-title">Organization</p>
          <span>{accountData.organization_unit_id}</span>
        </div>
      </div>
    </Container>
  );
};

export default DataSourceInfo;
