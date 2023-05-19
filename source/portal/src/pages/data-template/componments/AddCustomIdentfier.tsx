import React from 'react';
import '../style.scss';
import { Tabs } from '@cloudscape-design/components';
import AddIdentfierTable from './AddIndentifierTable';

const AddCustomIdentfier: React.FC<any> = (props: any) => {
  const { addCallBack } = props;
  return (
    <Tabs
      tabs={[
        {
          label: 'Built-in data identifiers',
          id: 'builtIn',
          content: (
            <AddIdentfierTable
              addCallBack={addCallBack}
              title="Built-in data identifiers"
              type={0}
            />
          ),
        },
        {
          label: 'Custom data identifiers',
          id: 'custom',
          content: (
            <AddIdentfierTable
              addCallBack={addCallBack}
              title="Custom data identifiers"
              type={1}
            />
          ),
        },
      ]}
    />
  );
};

export default AddCustomIdentfier;
