import { Box, Grid, Table } from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import MapChart, { CoordinateType } from './charts/items/MapChart';
import { useTranslation } from 'react-i18next';
import TableData from './charts/items/TableData';
import {
  getCatalogSummaryByRegion,
  getSummaryAccountData,
} from 'apis/dashboard/api';
import { IRegionDataType } from 'ts/dashboard/types';

type SummaryDataType = {
  source: string;
  region: string;
  account_count: number;
  coordinate: string;
};

const DataLocations = () => {
  const { t } = useTranslation();
  const [dataList, setDataList] = useState<SummaryDataType[]>([]);
  const [markers, setMarkers] = useState<CoordinateType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [resRegionData, setResRegionData] = useState<IRegionDataType[]>([]);

  const getSummaryDataByRegion = async () => {
    setLoadingData(true);
    const res = await getCatalogSummaryByRegion({
      database_type: 's3',
    });
    const resDataAsType = res as IRegionDataType[];
    const hadDataRegions = resDataAsType.map((element) => element.region);
    // setMarkers((prev) => {
    //   return prev.filter((element) => hadDataRegions.includes(element.region));
    // });
    setResRegionData(resDataAsType);
    setLoadingData(false);
  };

  useEffect(() => {
    getSummaryDataByRegion();
  }, []);

  const getSourceTableData = async () => {
    const result = await getSummaryAccountData();
    console.info('result:', result);
    setDataList(result as SummaryDataType[]);
  };

  useEffect(() => {
    getSourceTableData();
  }, []);

  return (
    <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
      <div>
        <MapChart
          sourceType="s3"
          title={t('summary:dataLocation')}
          loadingData={loadingData}
          markers={markers}
          resRegionData={resRegionData}
        />
      </div>
      <div className="max-table-height">
        <Table
          variant="embedded"
          columnDefinitions={[
            {
              id: 'region',
              header: 'Region/Location',
              cell: (item) => item.region || '-',
              sortingField: 'name',
            },

            {
              id: 'source',
              header: 'Source',
              cell: (item) => {
                return item.source;
              },
            },
            {
              id: 'totalAccounts',
              header: 'Total accounts',
              cell: (item) => {
                return (
                  (
                    <span
                      onClick={() => {
                        // clkCount(item.name);
                      }}
                      className="source-count"
                    >
                      {item.account_count || '-'}
                    </span>
                  ) || '-'
                );
              },
              sortingField: 'data_source_count',
            },
          ]}
          items={dataList}
          loadingText={t('table.loadingResources') || ''}
          sortingDisabled
          empty={
            <Box textAlign="center" color="inherit">
              <b>{t('table.noResources')}</b>
              <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                {t('table.noResourcesDisplay')}
              </Box>
            </Box>
          }
        />
      </div>
    </Grid>
  );
};

export default DataLocations;
