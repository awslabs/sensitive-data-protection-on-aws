import { Popover } from '@cloudscape-design/components';
import CommonBadge from 'pages/common-badge';
import {
  CLSAAIFIED_TYPE,
  BADGE_TYPE,
} from 'pages/common-badge/types/badge_type';
import ErrorBadge from 'pages/error-badge';

const SourceBadge = (props: any) => {
  const { instanceStatus, needInfo = false } = props;
  let labelType = CLSAAIFIED_TYPE.Unconnected;
  switch (instanceStatus) {
    case 'ACTIVE':
      labelType = CLSAAIFIED_TYPE.Success;
      break;
    case 'SUCCEEDED':
      labelType = CLSAAIFIED_TYPE.Success;
      break;
    case 'CURRENT':
      labelType = CLSAAIFIED_TYPE.SystemMark;
      break;
    case 'PENDING':
      labelType = CLSAAIFIED_TYPE.Unconnected;
      break;
    case 'UNCONNECTED':
      labelType = CLSAAIFIED_TYPE.Unconnected;
      break;
    case 'CRAWLING':
      labelType = CLSAAIFIED_TYPE.System;
      break;
    case 'FAILED':
      labelType = CLSAAIFIED_TYPE.Failed;
      break;
    default:
      labelType =
        instanceStatus.length > 10
          ? CLSAAIFIED_TYPE.Failed
          : CLSAAIFIED_TYPE.Unconnected;
      break;
  }
  if (needInfo) {
    return (
      <Popover
        dismissButton={false}
        position="top"
        size="medium"
        content={<div>{instanceStatus}</div>}
      >
        {instanceStatus.length > 15?( <ErrorBadge badgeLabel={instanceStatus} />):(<CommonBadge
          badgeType={BADGE_TYPE.Classified}
          badgeLabel={instanceStatus}
          labelType={labelType}
        />)}
       
      </Popover>
    );
  }
  return (
    <CommonBadge
      badgeType={BADGE_TYPE.Classified}
      badgeLabel={instanceStatus}
      labelType={labelType}
    />
  );
};
export default SourceBadge;
