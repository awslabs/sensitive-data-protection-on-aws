import { Spinner } from '@cloudscape-design/components';
import { getDataBaseByType } from 'apis/data-catalog/api';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';

export interface GlueJobType {
  account_id: string;
  base_time: string;
  database_name: string;
  database_type: string;
  end_time: string;
  error_log: string;
  id: number;
  region: string;
  run_id: number;
  start_time: string;
  state: string;
  table_name: string;
}

interface GlueJobCatalogProps {
  providerId: string | number;
  glueJob: GlueJobType;
}

const GlueJobCatalog: React.FC<GlueJobCatalogProps> = (
  props: GlueJobCatalogProps
) => {
  const { glueJob, providerId } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loadingData, setLoadingData] = useState(false);
  const [catalogList, setCatalogList] = useState([]);

  const clkCatalog = (rowData: GlueJobType) => {
    let databaseType = rowData.database_type;
    if (databaseType.startsWith('jdbc')) {
      databaseType = 'jdbc';
    }
    navigate(
      `${RouterEnum.Catalog.path}?provider=${providerId}&tagType=${databaseType}&catalogId=${rowData.database_name}`
    );
  };

  const getS3CatalogData = async () => {
    setLoadingData(true);
    const requestParam = {
      page: 1,
      size: 10,
      sort_column: '',
      asc: true,
      conditions: [
        {
          column: 'database_type',
          values: [glueJob.database_type],
          condition: 'and',
        },
        {
          column: 'database_name',
          values: [glueJob.database_name],
          condition: 'and',
        },
      ] as any,
    };
    const dataResult = await getDataBaseByType(requestParam);
    setCatalogList((dataResult as any)?.items);
    setLoadingData(false);
  };

  useEffect(() => {
    getS3CatalogData();
  }, []);

  if (loadingData) {
    return <Spinner />;
  }
  if (catalogList.length <= 0) {
    return <span>N/A</span>;
  }
  return (
    <span className="job-name" onClick={() => clkCatalog(glueJob)}>
      {t('table.label.dataCatalog')}
    </span>
  );
};

export default GlueJobCatalog;
