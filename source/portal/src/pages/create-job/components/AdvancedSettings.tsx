import { Container, Header, SpaceBetween } from '@cloudscape-design/components';
import React from 'react';

const AdvancedSettings = () => {
  return (
    <SpaceBetween direction="vertical" size="l">
      <Container
        header={
          <Header
            variant="h2"
            description={
              <div>
                <div>Exclude:</div>
                <div>Include:</div>
                <div>This rules applies to all</div>
              </div>
            }
          >
            Advanced rules: Key words for this job
          </Header>
        }
      ></Container>
      <Container
        header={
          <Header
            variant="h2"
            description={
              <div>
                <div>Exclude:</div>
                <div>Include:</div>
              </div>
            }
          >
            Advanced rules: File extensions for this job
          </Header>
        }
      ></Container>
    </SpaceBetween>
  );
};

export default AdvancedSettings;
