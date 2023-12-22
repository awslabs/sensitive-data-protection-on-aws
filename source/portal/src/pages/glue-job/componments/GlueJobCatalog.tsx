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
  // glueJob: GlueJobType;
  databaseName: string;
  databaseType: string;
}

const GlueJobCatalog: React.FC<GlueJobCatalogProps> = (
  props: GlueJobCatalogProps
) => {
  const { databaseName, databaseType, providerId } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loadingData, setLoadingData] = useState(false);
  const [catalogList, setCatalogList] = useState([]);

  const clkCatalog = () => {
    let tmpDatabaseType = databaseType;
    if (tmpDatabaseType.startsWith('jdbc')) {
      tmpDatabaseType = 'jdbc';
    }
    navigate(
      `${RouterEnum.Catalog.path}?provider=${providerId}&tagType=${tmpDatabaseType}&catalogId=${databaseName}`
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
          values: [databaseType],
          condition: 'and',
        },
        {
          column: 'database_name',
          values: [databaseName],
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
    <span className="job-name" onClick={() => clkCatalog()}>
      {t('table.label.dataCatalog')}
    </span>
  );
};

export default GlueJobCatalog;
