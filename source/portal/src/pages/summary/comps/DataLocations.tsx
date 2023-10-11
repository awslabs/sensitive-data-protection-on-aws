import { Box, Grid, Table } from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import MapChart, { CoordinateType } from './charts/items/MapChart';
import { useTranslation } from 'react-i18next';
import {
  getCatalogSummaryByRegion,
  getSummaryAccountData,
} from 'apis/dashboard/api';
import { IRegionDataType } from 'ts/dashboard/types';

type SummaryDataType = {
  source: string;
  region: string;
  account_count: number;
  region_name: string;
  provider_id: number;
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
    setResRegionData(resDataAsType);
    setLoadingData(false);
  };

  useEffect(() => {
    getSummaryDataByRegion();
  }, []);

  const getSourceTableData = async () => {
    const result = await getSummaryAccountData();
    console.info('result:', result);
    const resData = result as SummaryDataType[];
    if (resData && resData.length > 0) {
      const tmpCoordList: CoordinateType[] = [];
      resData.forEach((element) => {
        if (element.coordinate) {
          tmpCoordList.push({
            markerOffset: 25,
            name: `${element.region_name ?? ''}(${element.region})`,
            region: element.region,
            coordinates: element.coordinate
              ?.split(',')
              .map((str) => parseFloat(str.trim())),
          });
        }
      });
      setMarkers(tmpCoordList);
    }
    setDataList(resData);
  };

  useEffect(() => {
    getSourceTableData();
  }, []);

  const totalAccountItem = (item: any) => {
    return (
      (
        <span
          onClick={() => {
            // Redirect to account page
            // TODO
          }}
          className="source-count"
        >
          {item.account_count || '-'}
        </span>
      ) || '-'
    );
  };

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
      <div className="mt-20 max-table-height-map">
        <Table
          variant="embedded"
          columnDefinitions={[
            {
              id: 'region',
              header: t('summary:regionLocation'),
              cell: (item) => item.region || '-',
              sortingField: 'name',
            },

            {
              id: 'source',
              header: t('summary:source'),
              cell: (item) => {
                return item.source;
              },
            },
            {
              id: 'totalAccounts',
              header: t('summary:totalAccounts'),
              cell: (item) => totalAccountItem(item),
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
