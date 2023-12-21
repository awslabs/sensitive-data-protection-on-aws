import { Spinner } from '@cloudscape-design/components';
import { getDataBaseByType } from 'apis/data-catalog/api';
import { getJDBCTypeByProviderId } from 'enum/common_types';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';

interface GlueJobCatalogProps {
  glueState: string;
  providerId: number;
  catalogName: string;
  catalogType: string;
}

const DataSourceCatalog: React.FC<GlueJobCatalogProps> = (
  props: GlueJobCatalogProps
) => {
  const { glueState, catalogName, catalogType, providerId } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loadingData, setLoadingData] = useState(false);
  const [catalogList, setCatalogList] = useState([]);

  const clkCatalog = () => {
    navigate(
      `${RouterEnum.Catalog.path}?provider=${providerId}&tagType=${catalogType}&catalogId=${catalogName}`
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
          values: [
            catalogType.startsWith('jdbc')
              ? getJDBCTypeByProviderId(providerId)
              : catalogType,
          ],
          condition: 'and',
        },
        {
          column: 'database_name',
          values: [catalogName],
          condition: 'and',
        },
      ] as any,
    };
    const dataResult = await getDataBaseByType(requestParam);
    setCatalogList((dataResult as any)?.items);
    setLoadingData(false);
  };

  useEffect(() => {
    if (glueState === 'ACTIVE') {
      getS3CatalogData();
    }
  }, [glueState]);

  if (glueState !== 'ACTIVE') {
    return <div>-</div>;
  }

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

export default DataSourceCatalog;
