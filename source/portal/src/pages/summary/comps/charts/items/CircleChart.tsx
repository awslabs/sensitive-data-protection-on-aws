import { Header, Spinner } from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import {
  getCatalogSummaryByModifier,
  getCatalogSummaryByPrivacy,
} from 'apis/dashboard/api';
import CommonPieChart, {
  ChartDataType,
  ChartSourceType,
} from './CommonPieChart';
import {
  IModifierChartType,
  IPieChartDataType,
  IPrivacyPieChartType,
} from 'ts/dashboard/types';

interface CircleChartType {
  title: string;
  sourceType: ChartSourceType;
  circleType: 'pie' | 'donut' | undefined;
  dataType?: ChartDataType;
}

const COLOR_CONFIG: any = {
  '-1': '#8D99A8',
  '0': '#89BDEE',
  '1': '#EB6F6F',
};

const CircleChart: React.FC<CircleChartType> = (props: CircleChartType) => {
  const { title, sourceType, circleType, dataType } = props;
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [privacyDataList, setPrivacyDataList] = useState<IPieChartDataType[]>(
    []
  );
  const [sourceTotal, setSourceTotal] = useState(0);

  const [modifierDataList, setModifierDataList] = useState<IPieChartDataType[]>(
    []
  );

  const getTitleByPrivacy = (privacy: number) => {
    switch (privacy) {
      case 0:
        return 'Non-PII';
      case 1:
        return 'Contains PII';
      default:
        return 'N/A';
    }
  };

  const getValueBySourceTypeAndDataType = (
    data: IPrivacyPieChartType,
    sourceType: ChartSourceType,
    dataType?: ChartDataType
  ) => {
    if (sourceType === 's3') {
      switch (dataType) {
        case 'bucket':
          return data.database_total;
        case 'folder':
          return data.table_total;
        case 'file':
          return data.object_total;
        case 'size':
          return data.size_total;
      }
    }
    if (sourceType === 'rds') {
      switch (dataType) {
        case 'instance':
          return data.instance_total;
        case 'table':
          return data.table_total;
        case 'column':
          return data.row_total;
      }
    }
    return 0;
  };

  const calculateSourceTotalBySourceTypeAndDataType = (
    data: IPrivacyPieChartType[],
    sourceType: ChartSourceType,
    dataType?: ChartDataType
  ) => {
    const total = 0;
    if (sourceType === 's3') {
      switch (dataType) {
        case 'bucket':
          return data.reduce((accumulator: number, item) => {
            return accumulator + item.database_total;
          }, 0);
        case 'folder':
          return data.reduce((accumulator: number, item) => {
            return accumulator + item.table_total;
          }, 0);
        case 'file':
          return data.reduce((accumulator: number, item) => {
            return accumulator + item.object_total;
          }, 0);
        case 'size':
          return data.reduce((accumulator: number, item) => {
            return accumulator + item.size_total;
          }, 0);
      }
    }
    if (sourceType === 'rds') {
      switch (dataType) {
        case 'instance':
          return data.reduce((accumulator: number, item) => {
            return accumulator + item.instance_total;
          }, 0);
        case 'table':
          return data.reduce((accumulator: number, item) => {
            return accumulator + item.table_total;
          }, 0);
        case 'column':
          return data.reduce((accumulator: number, item) => {
            return accumulator + item.row_total;
          }, 0);
      }
    }
    return total;
  };

  const getPrivacyDataCatalog = async () => {
    setLoadingPrivacy(true);
    const res = (await getCatalogSummaryByPrivacy({
      database_type: sourceType,
    })) as IPrivacyPieChartType[];
    const tmpDataList: IPieChartDataType[] = [];
    if (res && res.length > 0) {
      res.forEach((element) => {
        tmpDataList.push({
          title: getTitleByPrivacy(element.privacy),
          value: getValueBySourceTypeAndDataType(element, sourceType, dataType),
          color: COLOR_CONFIG[element.privacy],
        });
      });
      const total = calculateSourceTotalBySourceTypeAndDataType(
        res,
        sourceType,
        dataType
      );
      setSourceTotal(total);
    }
    setPrivacyDataList(tmpDataList);
    setLoadingPrivacy(false);
  };

  const getLastUpdateDataCatalog = async () => {
    setLoadingStatus(true);
    const res = (await getCatalogSummaryByModifier({
      database_type: sourceType,
    })) as IModifierChartType[];
    const tmpDataList: IPieChartDataType[] = [];
    if (res && res.length > 0) {
      res.forEach((element) => {
        tmpDataList.push({
          title: element.modifier,
          value: element.data_sources,
          color: element.modifier === 'Manual' ? '#9469D6' : '#8D99A8',
        });
      });
    }
    setModifierDataList(tmpDataList);
    setLoadingStatus(false);
  };

  useEffect(() => {
    if (circleType === 'donut') {
      getPrivacyDataCatalog();
    }
    if (circleType === 'pie') {
      getLastUpdateDataCatalog();
    }
  }, [circleType]);

  return (
    <div>
      {title && <Header variant="h3">{title}</Header>}
      {circleType === 'donut' &&
        (loadingPrivacy ? (
          <Spinner />
        ) : (
          <div>
            <CommonPieChart
              // size="small"
              sourceType={sourceType}
              dataType={dataType}
              chartData={privacyDataList}
              circleType="donut"
              sourceTotal={sourceTotal}
            />
          </div>
        ))}
      {circleType === 'pie' &&
        (loadingStatus ? (
          <Spinner />
        ) : (
          <CommonPieChart
            sourceType={sourceType}
            circleType="pie"
            chartData={modifierDataList}
          />
        ))}
    </div>
  );
};

export default CircleChart;
