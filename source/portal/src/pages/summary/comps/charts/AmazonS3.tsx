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
import Pagination from './items/Pagination';

const AmazonS3: React.FC<any> = memo(() => {
  const navigate = useNavigate();
  const [loadingTableData, setLoadingTableData] = useState(true);
  // const [conatainsPIIData, setConatainsPIIData] = useState<
  //   ITableListKeyValue[]
  // >([]);
  // const [identifierData, setIdentifierData] = useState<ITableListKeyValue[]>(
  //   []
  // );

  const [currentPagePII, setCurrentPagePII] = useState(1);
  const [pageSizePII] = useState(5);
  const [allConatainsPIIDataData, setAllConatainsPIIDataData] = useState<
    ITableListKeyValue[]
  >([]);
  // const piiStart = (currentPagePII - 1) * pageSizePII;
  // const piiEnd = piiStart + pageSizePII;
  // const containsPIIDataToShow = allConatainsPIIDataData.slice(piiStart, piiEnd);
  const handlePageChangePII = (page: number) => {
    setCurrentPagePII(page);
  };

  const [currentPageIDF, setCurrentPageIDF] = useState(1);
  const [pageSizeIDF] = useState(5);
  const [allIdentifierData, setAllIdentifierData] = useState<
    ITableListKeyValue[]
  >([]);
  // const idfStart = (currentPageIDF - 1) * pageSizeIDF;
  // const idfEnd = idfStart + pageSizeIDF;
  // const containsIDFDataToShow = allIdentifierData.slice(idfStart, idfEnd);

  const handlePageChangeIDF = (page: number) => {
    setCurrentPageIDF(page);
  };

  const getTopNTableData = async () => {
    setLoadingTableData(true);
    const tableData = (await getCatalogTopNData({
      database_type: 's3',
      top_n: 99999,
    })) as ITableDataType;
    // setConatainsPIIData(tableData.account_top_n);
    setAllConatainsPIIDataData(tableData.account_top_n);
    // setIdentifierData(tableData.identifier_top_n);
    setAllIdentifierData(tableData.identifier_top_n);

    // setAllData(tableData.identifier_top_n);
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
            <>
              <TableData
                dataList={allConatainsPIIDataData}
                keyLable="AWS account"
                valueLable="S3 buckets"
                title="Top AWS accounts contain PII"
              />
              {allConatainsPIIDataData.length > 0 && (
                <Pagination
                  currentPage={currentPagePII}
                  pageSize={pageSizePII}
                  totalData={allConatainsPIIDataData.length}
                  onPageChange={handlePageChangePII}
                />
              )}
            </>
          )}
        </div>
        <div className="mt-20 pd-10">
          {loadingTableData ? (
            <Spinner />
          ) : (
            <>
              <TableData
                dataList={allIdentifierData}
                keyLable="Data identifier"
                valueLable="Total buckets"
                title="Top data identifiers"
              />
              {allIdentifierData.length > 0 && (
                <Pagination
                  currentPage={currentPageIDF}
                  pageSize={pageSizeIDF}
                  totalData={allIdentifierData.length}
                  onPageChange={handlePageChangeIDF}
                />
              )}
            </>
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
