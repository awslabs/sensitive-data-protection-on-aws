import { Container, Tabs } from '@cloudscape-design/components';
import AmazonS3 from './charts/AmazonS3';
import { AmazonRDS } from './charts/AmazonRDS';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';

const Charts = () => {
  const { t } = useTranslation();
  return (
    <Container>
      <div>
        {t('summary:chartTips')}
        <a href={RouterEnum.Datajob.path}>{t('here')}</a>{' '}
        {t('summary:toSeeJobDetail')}
      </div>
      <div className="mt-10">
        <Tabs
          tabs={[
            {
              label: t('summary:amazonS3'),
              id: 's3',
              content: <AmazonS3 />,
            },
            {
              label: t('summary:amazonRDS'),
              id: 'rds',
              content: <AmazonRDS />,
            },
          ]}
        />
      </div>
    </Container>
  );
};

export default Charts;
