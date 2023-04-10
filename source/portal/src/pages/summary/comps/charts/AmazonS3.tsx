import {
  Button,
  Grid,
  Header,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components';
import React, { memo, useEffect, useState } from 'react';
import S3CatalogOverview from './items/S3CatalogOverview';
// import CustomLineChart from './items/CustomLineChart';
import MapChart from './items/MapChart';
import CircleChart from './items/CircleChart';
import TableData from './items/TableData';
import { getCatalogTopNData } from 'apis/dashboard/api';
import { ITableDataType, ITableListKeyValue } from 'ts/dashboard/types';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';

const AmazonS3: React.FC<any> = memo(() => {
  const navigate = useNavigate();
  const [loadingTableData, setLoadingTableData] = useState(true);
  const [conatainsPIIData, setConatainsPIIData] = useState<
    ITableListKeyValue[]
  >([]);
  const [identifierData, setIdentifierData] = useState<ITableListKeyValue[]>(
    []
  );

  const getTopNTableData = async () => {
    setLoadingTableData(true);
    const tableData = (await getCatalogTopNData({
      database_type: 's3',
      top_n: 10,
    })) as ITableDataType;
    setConatainsPIIData(tableData.account_top_n);
    setIdentifierData(tableData.identifier_top_n);
    setLoadingTableData(false);
  };

  useEffect(() => {
    getTopNTableData();
  }, []);

  return (
    <div>
      <Header
        variant="h2"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => navigate(RouterEnum.Catalog.path)}>
              Browse data catalogs
            </Button>
          </SpaceBetween>
        }
      >
        Data catalogs
      </Header>
      <S3CatalogOverview />
      <Grid
        gridDefinition={[
          { colspan: 6 },
          { colspan: 6 },
          { colspan: 6 },
          { colspan: 6 },
          { colspan: 6 },
        ]}
      >
        {/* <div className="mt-20 pd-10">
          <CustomLineChart title="Data catalogs trend" />
        </div> */}
        <div className="mt-20 pd-10">
          <MapChart sourceType="s3" title="Data location" />
        </div>
        <div className="mt-20 pd-10">
          <CircleChart
            title="Privacy tagging for data catalogs"
            circleType="donut"
            sourceType="s3"
          />
        </div>
        <div className="mt-20 pd-10">
          {loadingTableData ? (
            <Spinner />
          ) : (
            <TableData
              dataList={conatainsPIIData}
              keyLable="AWS account"
              valueLable="S3 buckets"
              title="Top 10 AWS accounts contains PII"
            />
          )}
        </div>
        <div className="mt-20 pd-10">
          {loadingTableData ? (
            <Spinner />
          ) : (
            <TableData
              dataList={identifierData}
              keyLable="Data identifier"
              valueLable="Total buckets"
              title="Top 10 data identifiers"
            />
          )}
        </div>
        <div className="mt-20 pd-10">
          <CircleChart
            title="Last updated status"
            circleType="pie"
            sourceType="s3"
          />
        </div>
      </Grid>
    </div>
  );
});

export default AmazonS3;
