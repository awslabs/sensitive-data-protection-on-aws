import React from 'react';
import '../style.scss';
import { SpaceBetween, Tabs } from '@cloudscape-design/components';
import AddIdentfierTable from './AddIndentifierTable';
import { useTranslation } from 'react-i18next';

const AddCustomIdentfier: React.FC<any> = (props: any) => {
  const { addCallBack } = props;
  const { t } = useTranslation();
  return (
    <SpaceBetween direction="vertical" size="l">
      <Tabs
        tabs={[
          {
            label: t('template:builtInIdentifier'),
            id: 'builtIn',
            content: (
              <AddIdentfierTable
                addCallBack={addCallBack}
                title={t('template:builtInIdentifier')}
                type={0}
              />
            ),
          },
          {
            label: t('template:customIdentifier'),
            id: 'custom',
            content: (
              <AddIdentfierTable
                addCallBack={addCallBack}
                title={t('template:customIdentifier')}
                type={1}
              />
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
};

export default AddCustomIdentfier;
