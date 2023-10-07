import { Tabs } from '@cloudscape-design/components';
import React from 'react';

const TextImageTab: React.FC = () => {
  return (
    <Tabs
      disableContentPaddings
      tabs={[
        {
          label: 'Text-based data identifiers',
          id: 'text',
          content: '',
        },
        {
          label: 'Image-based data identifiers',
          id: 'image',
          content: '',
        },
      ]}
    />
  );
};

export default TextImageTab;
