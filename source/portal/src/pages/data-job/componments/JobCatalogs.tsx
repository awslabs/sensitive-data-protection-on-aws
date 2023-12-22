import { Box, Table } from '@cloudscape-design/components';
import { getJobDetail } from 'apis/data-job/api';
import GlueJobCatalog from 'pages/glue-job/componments/GlueJobCatalog';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';

const JobCatalogs = (props: any) => {
  const { detailRow } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsloading] = useState(false);
  const [providerId, setProviderId] = useState('0');
  const [dataList, setDataList] = useState([]);
  const DATABASE_COLUMN_LIST = [
    { id: 'job_id', label: t('table.label.jobId') },
    { id: 'database_name', label: t('table.label.dataCatalogName') },
    { id: 'account_id', label: t('table.label.awsAccount') },
    { id: 'region', label: t('table.label.awsRegion') },
    { id: 'database_type', label: t('table.label.dataSourceType') },
  ];
  const columnList = DATABASE_COLUMN_LIST;

  useEffect(() => {
    getDetailData();
  }, []);

  const getDetailData = async () => {
    setIsloading(true);
    const { id } = detailRow;
    const result: any = await getJobDetail({ id });
    setIsloading(false);
    if (!result) {
      return;
    }
    setDataList(result['databases']);
    setProviderId(result['provider_id']);
  };

  return (
    <Table
      className="no-shadow"
      variant="embedded"
      loading={isLoading}
      columnDefinitions={
        columnList.map((item) => {
          return {
            id: item.id,
            header: item.label,
            cell: (e: any) => {
              if (item.id === 'database_name') {
                return (
                  <GlueJobCatalog
                    providerId={providerId}
                    databaseName={e.database_name}
                    databaseType={e.database_type}
                  />
                );
              }
              return <>{(e as any)[item.id]}</>;
            },
          };
        }) as any
      }
      items={dataList}
      loadingText={t('table.loadingResources') || ''}
      visibleColumns={columnList.map((i) => i.id)}
      empty={
        <Box textAlign="center" color="inherit">
          <b>{t('table.noResources')}</b>
          <Box padding={{ bottom: 's' }} variant="p" color="inherit">
            {t('table.noResourcesDisplay')}
          </Box>
        </Box>
      }
    />
  );
};
export default JobCatalogs;
