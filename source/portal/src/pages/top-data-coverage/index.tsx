import React from 'react';
import { TopDataCoverageProps } from 'ts/top-data-coverage/types';
import './style.scss';
import {
  Box,
  ColumnLayout,
  Container,
  Grid,
  Header,
} from '@cloudscape-design/components';
import { CounterLink } from 'common/ConterLink';
import { useTranslation } from 'react-i18next';
import { identity } from 'lodash';

const TopDataCoverage: React.FC<TopDataCoverageProps> = (
  props: TopDataCoverageProps
) => {
  const { header, description, col, dataList } = props;
  const { t } = useTranslation();

  return (
    <Container
      header={
        <Header variant="h2" description={description}>
          {header}
        </Header>
      }
    >
      <ColumnLayout variant="text-grid">
        <Grid
          gridDefinition={Array(col ?? 2)
            .fill(null)
            .map(() => ({ colspan: 12 / (col ?? 2) }))}
        >
          {dataList?.map((element, index) => {
            return (
              <div key={identity(index)}>
                <Box variant="awsui-key-label">{element.label}</Box>
                <CounterLink>{element.value ?? 0}</CounterLink>{' '}
                {element.total && `(${t('ofTotal')} ${element.total})`}
              </div>
            );
          })}
        </Grid>
      </ColumnLayout>
    </Container>
  );
};

export default TopDataCoverage;
