import React from 'react';
import { TopDataCoverageProps } from 'ts/top-data-coverage/types';
import './style.scss';
import {
  Box,
  ColumnLayout,
  Container,
  Header,
} from '@cloudscape-design/components';
import { CounterLink } from 'common/ConterLink';
import { useTranslation } from 'react-i18next';

const TopDataCoverage: React.FC<TopDataCoverageProps> = (
  props: TopDataCoverageProps
) => {
  const {
    header,
    description,
    leftChildHeader,
    rightChildHeader,
    leftChildData,
    rightChildData,
    leftChildTotal,
    rightChildTotal,
  } = props;
  const { t } = useTranslation();

  return (
    <Container
      header={
        <Header variant="h2" description={description}>
          {header}
        </Header>
      }
    >
      <ColumnLayout columns={2} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">{leftChildHeader}</Box>
          <CounterLink>{leftChildData || '-'}</CounterLink>{' '}
          {leftChildTotal && `(${t('ofTotal')} ${leftChildTotal})`}
        </div>
        <div>
          <Box variant="awsui-key-label">{rightChildHeader}</Box>
          <CounterLink>{rightChildData || '-'}</CounterLink>{' '}
          {rightChildTotal && `(${t('ofTotal')} ${rightChildTotal})`}
        </div>
      </ColumnLayout>
    </Container>
  );
};

export default TopDataCoverage;
