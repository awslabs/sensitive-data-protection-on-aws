import { Popover, StatusIndicator } from '@cloudscape-design/components';
import CommonBadge from 'pages/common-badge';
import {
  CLSAAIFIED_TYPE,
  BADGE_TYPE,
} from 'pages/common-badge/types/badge_type';

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
        content={
          <StatusIndicator
            type={instanceStatus.length > 10 ? 'error' : 'info'}
            colorOverride={instanceStatus.length > 10 ? 'red' : 'grey'}
          >
            {instanceStatus}
          </StatusIndicator>
        }
      >
        <CommonBadge
          badgeType={BADGE_TYPE.Classified}
          badgeLabel={
            instanceStatus.length > 15
              ? instanceStatus.substr(0, 15) + '.....'
              : instanceStatus
          }
          labelType={labelType}
        />
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
