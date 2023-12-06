import { Container, Tabs } from '@cloudscape-design/components';
import AmazonS3 from './charts/AmazonS3';
import { AmazonRDS } from './charts/AmazonRDS';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import { ProviderType } from 'common/ProviderTab';
import { AmazonGlue } from './charts/AmazonGlue';
import { JDBC } from './charts/JDBC';
import RegionSelector from './charts/items/RegionSelector';
import { getJDBCTypeByProviderId } from 'enum/common_types';

interface ChartsProps {
  currentProvider?: ProviderType;
}
const Charts: React.FC<ChartsProps> = (props: ChartsProps) => {
  const { t } = useTranslation();
  const { currentProvider } = props;
  return (
    <Container>
      <div className="flex justify-spacebetween">
        <div>
          {t('summary:chartTips')}
          <a href={RouterEnum.Datajob.path}>{t('here')}</a>{' '}
          {t('summary:toSeeJobDetail')}
        </div>
        <div style={{ width: 350 }}>
          <RegionSelector currentProvider={currentProvider} />
        </div>
      </div>

      <div className="mt-10">
        {currentProvider?.id === 1 ? (
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
              {
                label: t('summary:glue'),
                id: 'glue',
                content: <AmazonGlue />,
              },
              {
                label: t('summary:jdbc'),
                id: 'jdbc',
                content: (
                  <JDBC
                    curProvider={currentProvider}
                    jdbcType={getJDBCTypeByProviderId(currentProvider?.id ?? 0)}
                  />
                ),
              },
            ]}
          />
        ) : (
          <JDBC
            curProvider={currentProvider}
            jdbcType={getJDBCTypeByProviderId(currentProvider?.id ?? 0)}
          />
        )}
      </div>
    </Container>
  );
};

export default Charts;
