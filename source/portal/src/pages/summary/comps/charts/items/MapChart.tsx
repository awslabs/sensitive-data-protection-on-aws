import { Header, Spinner } from '@cloudscape-design/components';
import React, { useState } from 'react';

import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import MapMarker from './MapMarker';
import { IRegionDataType } from 'ts/dashboard/types';
import { formatSize, numberFormat } from 'tools/tools';

export type CoordinateType = {
  markerOffset: number;
  name: string;
  region: string;
  coordinates: number[];
};

interface MapChartProps {
  title: string;
  sourceType: 's3' | 'rds';
  markers: CoordinateType[];
  resRegionData: IRegionDataType[];
  loadingData: boolean;
}

function relativeCoords(event: any) {
  const x = event.nativeEvent.offsetX - 240;
  const y = event.nativeEvent.offsetY + 50;
  return { x: x, y: y };
}

const MapChart: React.FC<MapChartProps> = (props: MapChartProps) => {
  const { title, sourceType, markers, loadingData, resRegionData } = props;
  const [showPopover, setShowPopover] = useState(false);
  const [popoverLeft, setPopoverLeft] = useState(-99999);
  const [popoverTop, setPopoverTop] = useState(-99999);
  const [popoverData, setPopoverData] = useState({
    regionWithName: '',
    totalBuckets: 0,
    totalObjects: 0,
    totalFileSize: 0,
    totalInstances: 0,
    totalDatabases: 0,
    totalTables: 0,
    totalColums: 0,
  });

  console.info('markers:', markers);

  return (
    <div className="dashboard-map">
      <Header variant="h3">{title}</Header>
      <div className="pr">
        {showPopover && (
          <div
            className="map-popover"
            style={{ left: popoverLeft, top: popoverTop }}
          >
            <div className="popover left">
              <div className="arrow"></div>
              <div className="popover-content">
                <div className="data-title">
                  <b>{popoverData.regionWithName}</b>
                </div>
                {sourceType === 's3' && (
                  <>
                    <div className="map-pop-item flex justify-spacebetween">
                      <div>Total buckets</div>
                      <div>{numberFormat(popoverData.totalBuckets)}</div>
                    </div>
                    <div className="map-pop-item flex justify-spacebetween">
                      <div>Total objects</div>
                      <div>{numberFormat(popoverData.totalObjects)}</div>
                    </div>
                    <div className="map-pop-item flex justify-spacebetween">
                      <div>Total file size</div>
                      <div>{formatSize(popoverData.totalFileSize)}</div>
                    </div>
                  </>
                )}

                {sourceType === 'rds' && (
                  <>
                    <div className="map-pop-item flex justify-spacebetween">
                      <div>Total instances</div>
                      <div>{numberFormat(popoverData.totalInstances)}</div>
                    </div>
                    <div className="map-pop-item flex justify-spacebetween">
                      <div>Total tables</div>
                      <div>{numberFormat(popoverData.totalTables)}</div>
                    </div>
                    <div className="map-pop-item flex justify-spacebetween">
                      <div>Total columns</div>
                      <div>{numberFormat(popoverData.totalColums)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {loadingData ? (
          <Spinner />
        ) : (
          <ComposableMap height={500}>
            <Geographies geography="/geo.json">
              {({ geographies }: any) =>
                geographies.map((geo: any) => (
                  <Geography key={geo.rsmKey} geography={geo} />
                ))
              }
            </Geographies>
            {markers.map(
              ({ name, region, coordinates, markerOffset }, index) => (
                <MapMarker
                  key={index}
                  coordinates={coordinates}
                  name={region}
                  markerOffset={markerOffset}
                  showPopover={(show) => {
                    const curRegionData = resRegionData.find(
                      (element) => element.region === region
                    );
                    setPopoverData({
                      regionWithName: name,
                      totalBuckets: curRegionData?.database_total || 0,
                      totalObjects: curRegionData?.object_total || 0,
                      totalFileSize: curRegionData?.size_total || 0,
                      totalDatabases: curRegionData?.database_total || 0,
                      totalTables: curRegionData?.table_total || 0,
                      totalColums: curRegionData?.column_total || 0,
                      totalInstances: curRegionData?.instance_total || 0,
                    });
                    setShowPopover(show);
                  }}
                  markerMouseover={(e) => {
                    const { x, y } = relativeCoords(e);
                    setPopoverTop(y);
                    setPopoverLeft(x);
                  }}
                />
              )
            )}
          </ComposableMap>
        )}
      </div>
    </div>
  );
};

export default MapChart;
