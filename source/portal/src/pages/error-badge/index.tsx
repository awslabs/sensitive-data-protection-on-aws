import { Icon } from '@cloudscape-design/components';
import React from 'react';
import './style.scss';
const ErrorBadge = (props: any) => {
  const { badgeLabel = '' } = props;
  return (
    <div className="error-badge">
      <Icon name="status-negative" />
      <span className="error-badge-span">{badgeLabel}</span>
    </div>
  );
};

export default ErrorBadge;
