import {
  Header,
  SpaceBetween,
  Button,
  Grid,
  Spinner,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import CircleChart from './items/CircleChart';
import TableData from './items/TableData';
import { getCatalogTopNData } from 'apis/dashboard/api';
import { ITableListKeyValue, ITableDataType } from 'ts/dashboard/types';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import IdentifierTableData from './items/IdentifierTable';
import { Props } from 'common/PropsModal';
import JDBCCatalogOverview from './items/JDBCCatalogOvervie';
import { ProviderType } from 'common/ProviderTab';
import { SOURCE_TYPE } from 'enum/common_types';

interface JDBCProps {
  curProvider?: ProviderType;
}

export const JDBC: React.FC<JDBCProps> = (props: JDBCProps) => {
  const { curProvider } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loadingTableData, setLoadingTableData] = useState(true);
  const [conatainsPIIData, setConatainsPIIData] = useState<
    ITableListKeyValue[]
  >([]);
  const [identifierData, setIdentifierData] = useState<ITableListKeyValue[]>(
    []
  );

  const getTopNTableData = async () => {
    setLoadingTableData(true);
    let dbType = 'jdbc';
    if (curProvider?.id === 1) {
      dbType = SOURCE_TYPE.JDBC_AWS;
    } else if (curProvider?.id === 2) {
      dbType = SOURCE_TYPE.JDBC_TENCENT;
    } else if (curProvider?.id === 3) {
      dbType = SOURCE_TYPE.JDBC_GOOGLE;
    }
    try {
      const tableData = (await getCatalogTopNData({
        database_type: dbType,
        top_n: 99999,
      })) as ITableDataType;
      setConatainsPIIData(tableData.account_top_n);
      if (tableData.identifier_top_n && tableData.identifier_top_n.length > 0) {
        tableData.identifier_top_n.forEach((element) => {
          element.category =
            element?.props?.find(
              (prop: Props) => prop.prop_type?.toString() === '1'
            )?.prop_name || 'N/A';
          element.identifierLabel =
            element?.props?.find(
              (prop: Props) => prop.prop_type?.toString() === '2'
            )?.prop_name || 'N/A';
        });
      }
      setIdentifierData(tableData.identifier_top_n);
      setLoadingTableData(false);
    } catch (error) {
      setLoadingTableData(false);
    }
  };

  useEffect(() => {
    if (curProvider) {
      getTopNTableData();
    }
  }, [curProvider]);

  return (
    <div>
      <Header
        variant="h2"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              onClick={() =>
                navigate(
                  `${RouterEnum.Catalog.path}?provider=${curProvider?.id}&tagType=jdbc`
                )
              }
            >
              {t('button.browserCatalog')}
            </Button>
          </SpaceBetween>
        }
      >
        {t('summary:dataCatalogs')}
      </Header>
      <JDBCCatalogOverview />
      <Grid
        gridDefinition={[
          { colspan: 12 },
          { colspan: 6 },
          { colspan: 6 },
          { colspan: 12 },
        ]}
      >
        <div className="mt-20 pd-10">
          <Header variant="h3">{t('summary:privacyTagging')}</Header>
          <Grid
            gridDefinition={[{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }]}
          >
            <div>
              <CircleChart
                title=""
                circleType="donut"
                sourceType="jdbc"
                dataType="instance"
              />
            </div>
            <div>
              <CircleChart
                title=""
                circleType="donut"
                sourceType="jdbc"
                dataType="table"
              />
            </div>
            <div>
              <CircleChart
                title=""
                circleType="donut"
                sourceType="jdbc"
                dataType="column"
              />
            </div>
          </Grid>
        </div>
        <div className="mt-20 pd-10">
          <CircleChart
            title={t('summary:lastUpdatedStatus')}
            circleType="pie"
            sourceType="jdbc"
          />
        </div>

        <div className="mt-20 pd-10">
          {loadingTableData ? (
            <Spinner />
          ) : (
            <TableData
              dataList={conatainsPIIData}
              keyLable={t('summary:awsAccount')}
              valueLable={t('summary:rdsIntacnes')}
              title={t('summary:topAccountsContainPII')}
            />
          )}
        </div>

        <div className="mt-20 pd-10">
          {loadingTableData ? (
            <Spinner />
          ) : (
            <IdentifierTableData
              dataList={identifierData}
              keyLable={t('summary:dataIdentifier')}
              valueLable={t('summary:jdbcDatabase')}
              title={t('summary:topDataIdentifier')}
            />
          )}
        </div>
      </Grid>
    </div>
  );
};
