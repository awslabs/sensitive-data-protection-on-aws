import { Box, Grid, Spinner } from '@cloudscape-design/components';
import { useEffect, useState } from 'react';
import { CounterLink } from 'common/ConterLink';
import { getDatacatalogSummary } from 'apis/dashboard/api';
import { ICatalogSummary } from 'ts/dashboard/types';
import { formatNumber } from 'tools/tools';
import { useTranslation } from 'react-i18next';

const GlueCatalogOverview = () => {
  const [loadingData, setLoadingData] = useState(true);
  const { t } = useTranslation();
  const [catalogSummaryData, setCatalogSummaryData] =
    useState<ICatalogSummary>();

  const getS3DatacatalogSummary = async () => {
    const res = await getDatacatalogSummary({
      database_type: 'glue',
    });
    setCatalogSummaryData(res as ICatalogSummary);
    setLoadingData(false);
  };

  useEffect(() => {
    getS3DatacatalogSummary();
  }, []);

  return (
    <>
      {loadingData ? (
        <Spinner />
      ) : (
        <Grid gridDefinition={[{ colspan: 7 }, { colspan: 5 }]}>
          <Grid
            gridDefinition={[{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }]}
          >
            <div>
              <Box variant="awsui-key-label">{t('summary:rdsIntacnes')}</Box>
              <CounterLink>
                {formatNumber(catalogSummaryData?.instance_total || 0)}
              </CounterLink>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('summary:rdsTables')}</Box>
              <CounterLink>
                {formatNumber(catalogSummaryData?.table_total || 0)}
              </CounterLink>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('summary:rdsColumns')}</Box>
              <CounterLink>
                {formatNumber(catalogSummaryData?.column_total || 0)}
              </CounterLink>
            </div>
          </Grid>
          <div></div>
        </Grid>
      )}
    </>
  );
};

export default GlueCatalogOverview;
