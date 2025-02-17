import {
  Button,
  Grid,
  Header,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import S3CatalogOverview from './items/S3CatalogOverview';
import CircleChart from './items/CircleChart';
import TableData from './items/TableData';
import { getCatalogTopNData } from 'apis/dashboard/api';
import { ITableDataType, ITableListKeyValue } from 'ts/dashboard/types';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import Pagination from './items/Pagination';
import { useTranslation } from 'react-i18next';
import IdentifierTableData from './items/IdentifierTable';
import { Props } from 'common/PropsModal';

const AmazonS3: React.FC<any> = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loadingTableData, setLoadingTableData] = useState(true);

  const [currentPagePII, setCurrentPagePII] = useState(1);
  const [pageSizePII] = useState(5);
  const [allConatainsPIIDataData, setAllConatainsPIIDataData] = useState<
    ITableListKeyValue[]
  >([]);
  const handlePageChangePII = (page: number) => {
    setCurrentPagePII(page);
  };

  const [allIdentifierData, setAllIdentifierData] = useState<
    ITableListKeyValue[]
  >([]);

  const getTopNTableData = async () => {
    setLoadingTableData(true);
    try {
      const tableData = (await getCatalogTopNData({
        database_type: 's3',
        top_n: 99999,
      })) as ITableDataType;
      setAllConatainsPIIDataData(tableData.account_top_n);
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
      setAllIdentifierData(tableData.identifier_top_n);
      setLoadingTableData(false);
    } catch (error) {
      setLoadingTableData(false);
    }
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
              {t('button.browserCatalog')}
            </Button>
          </SpaceBetween>
        }
      >
        {t('summary:dataCatalogs')}
      </Header>
      <S3CatalogOverview />
      <Grid
        gridDefinition={[
          { colspan: 12 },
          { colspan: 12 },
          { colspan: 6 },
          { colspan: 6 },
          // { colspan: 12 },
          // { colspan: 6 },
        ]}
      >
        {/* <div className="mt-20 pd-10">
          <MapChart sourceType="s3" title={t('summary:dataLocation')} />
        </div> */}

        <div className="mt-20 pd-10">
          <Header variant="h3">{t('summary:privacyTagging')} </Header>
          <Grid
            gridDefinition={[{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }]}
          >
            <div>
              <CircleChart
                title=""
                circleType="donut"
                sourceType="s3"
                dataType="bucket"
              />
            </div>
            <div>
              <CircleChart
                title=""
                circleType="donut"
                sourceType="s3"
                dataType="file"
              />
            </div>
            <div>
              <CircleChart
                title=""
                circleType="donut"
                sourceType="s3"
                dataType="size"
              />
            </div>
          </Grid>
        </div>

        <div className="mt-20 pd-10">
          {loadingTableData ? (
            <Spinner />
          ) : (
            <>
              <IdentifierTableData
                dataList={allIdentifierData}
                keyLable={t('summary:dataIdentifier')}
                valueLable={t('summary:totalBuckets')}
                title={t('summary:topDataIdentifier')}
              />
            </>
          )}
        </div>

        <div className="mt-20 pd-10">
          <CircleChart
            title={t('summary:lastUpdatedStatus')}
            circleType="pie"
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
                keyLable={t('summary:awsAccount')}
                valueLable={t('summary:s3Bucket')}
                title={t('summary:topAccountsContainPII')}
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
      </Grid>
    </div>
  );
};

export default AmazonS3;
