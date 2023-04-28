import { Icon } from '@cloudscape-design/components';
import React from 'react';
import './style.scss';
const ErrorBadge = (props: any) => {
  const { badgeLabel = '' } = props;
  return (
    <div className="info-badge">
      <Icon name="status-info" />
      <span className="info-badge-span">{badgeLabel}</span>
    </div>
  );
};

export default ErrorBadge;
