import React, { useEffect, useState } from 'react';
import {
  Container,
  FormField,
  Header,
  SpaceBetween,
  SelectProps,
} from '@cloudscape-design/components';
import { useLocation } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import {
  DETECTION_THRESHOLD_OPTIONS,
  OVERRIDE_OPTIONS,
  SCAN_DEPTH_OPTIONS,
  SCAN_RANGE_OPTIONS,
} from '../types/create_data_type';
import { useTranslation } from 'react-i18next';

const DEFAULT_TEMPLATE = {
  label: 'Current data classification template',
  value: '1',
};

const SELECT_S3 = 'selectS3';
const NONE_S3 = 'noneS3';

const SELECT_RDS = 'selectRds';
const NONE_RDS = 'noneRds';

const S3_OPTION: any = {
  allS3: 'All data catalogs',
  [SELECT_S3]: 'Specific data catalogs',
  [NONE_S3]: 'Skip scan Amazon S3',
};

const RDS_OPTION: any = {
  allRds: 'All data catalogs',
  [SELECT_RDS]: 'Specific data catalogs',
  [NONE_RDS]: 'Skip scan for Amazon RDS',
};

const JobPreview = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { oldData } = location.state || {};
  const [s3CatalogType, setS3CatalogType] = useState('');
  const [rdsCatalogType, setRdsCatalogType] = useState('');

  const [selectedS3Items, setSelectedS3Items] = useState([] as any);
  const [selectedRdsItems, setSelectedRdsItems] = useState([] as any);
  const [jobName, setJobName] = useState(oldData ? oldData.name : '');
  const [jobDescription, setJobDescriptio] = useState(
    oldData ? oldData.description : ''
  );
  const [selectTemplate, setSelectTemplate] = useState(DEFAULT_TEMPLATE as any);

  const [scanDepth, setScanDepth] = useState(
    SCAN_DEPTH_OPTIONS[0] as SelectProps.Option | null
  );
  const [scanRange, setScanRange] = useState(
    SCAN_RANGE_OPTIONS[1] as SelectProps.Option | null
  );
  const [detectionThreshold, setDetectionThreshold] = useState(
    DETECTION_THRESHOLD_OPTIONS[1] as SelectProps.Option | null
  );
  const [overwrite, setOverwrite] = useState(
    OVERRIDE_OPTIONS[0] as SelectProps.Option | null
  );

  const [frequencyType, setFrequencyType] = useState('on_demand_run');

  const [frequencyStart, setFrequencyStart] = useState(
    null as SelectProps.Option | null
  );
  const [exclusiveToggle, setExclusiveToggle] = useState(false);
  const [exclusiveText, setExclusiveText] = useState('');

  useEffect(() => {
    if (!exclusiveToggle) {
      setExclusiveText('');
    }
  }, [exclusiveToggle]);

  const [rdsSelectedView, setRdsSelectedView] = useState('rds-instance-view');

  const jumpToCatalog = (rowData: any) => {
    window.open(
      `${RouterEnum.Catalog.path}?tagType=${rowData.database_type}&catalogId=${rowData.database_name}`,
      '_blank'
    );
  };

  return (
    <Container
      header={<Header variant="h2">{t('job:create.jobPreview')}</Header>}
    >
      <SpaceBetween direction="vertical" size="l">
        <FormField label={t('job:create.targetDataCatalogs')}>
          <span className="sources-title">
            {t('job:create.s3Bucket')} ({S3_OPTION[s3CatalogType]}) :
          </span>
          {s3CatalogType === SELECT_S3 && (
            <ul>
              {selectedS3Items.map(
                (
                  item: {
                    database_name:
                      | string
                      | number
                      | boolean
                      | React.ReactElement<
                          any,
                          string | React.JSXElementConstructor<any>
                        >
                      | React.ReactFragment
                      | React.ReactPortal
                      | null
                      | undefined;
                  },
                  index: string | number
                ) => {
                  return (
                    <li
                      className="job-name"
                      key={SELECT_S3 + index}
                      onClick={() => jumpToCatalog(item)}
                    >
                      {item.database_name}
                    </li>
                  );
                }
              )}
            </ul>
          )}
          <br></br>
          {rdsSelectedView === 'rds-instance-view' && (
            <>
              <span className="sources-title">
                {t('job:create.rdsInstance')} ({RDS_OPTION[rdsCatalogType]}) :
              </span>
              {rdsCatalogType === SELECT_RDS &&
                selectedRdsItems.map(
                  (
                    item: {
                      database_name:
                        | string
                        | number
                        | boolean
                        | React.ReactElement<
                            any,
                            string | React.JSXElementConstructor<any>
                          >
                        | React.ReactFragment
                        | React.ReactPortal
                        | null
                        | undefined;
                    },
                    index: string
                  ) => {
                    return (
                      <li
                        className="sources-title-detail"
                        key={SELECT_RDS + index}
                      >
                        {item.database_name}
                      </li>
                    );
                  }
                )}
            </>
          )}
          {rdsSelectedView === 'rds-table-view' && (
            <>
              <span className="sources-title">
                {t('job:create.rdsTable')} ({RDS_OPTION[rdsCatalogType]}) :
              </span>
              {rdsCatalogType === SELECT_RDS &&
                selectedRdsItems.map(
                  (
                    item: {
                      table_name:
                        | string
                        | number
                        | boolean
                        | React.ReactElement<
                            any,
                            string | React.JSXElementConstructor<any>
                          >
                        | React.ReactFragment
                        | React.ReactPortal
                        | null
                        | undefined;
                    },
                    index: string
                  ) => {
                    return (
                      <li
                        className="sources-title-detail"
                        key={SELECT_RDS + index}
                      >
                        {item.table_name}
                      </li>
                    );
                  }
                )}
            </>
          )}
        </FormField>
        <FormField label={t('job:create.name')}>
          <span>{jobName}</span>
        </FormField>
        <FormField label={t('job:create.desc')}>
          <span>{jobDescription}</span>
        </FormField>
        <FormField label={t('job:create.dataClassfiyTmpl')}>
          <span>{selectTemplate ? selectTemplate.label : ''}</span>
        </FormField>
        <FormField label={t('job:create.scanFreq')}>
          <span>
            {frequencyType.toUpperCase()}{' '}
            {frequencyStart && (
              <>
                - Start hours/day:
                {frequencyStart?.value}
              </>
            )}
          </span>
        </FormField>
        <FormField label={t('job:create.scanDepth')}>
          <span>{scanDepth ? scanDepth.label : ''}</span>
        </FormField>
        <FormField label={t('job:create.scanRange')}>
          <span>{scanRange ? scanRange.label : ''}</span>
        </FormField>
        <FormField label={t('job:create.detectionThreshold')}>
          <span>{detectionThreshold ? detectionThreshold.label : ''}</span>
        </FormField>
        <FormField label={t('job:create.override')}>
          <span>{overwrite ? overwrite.label : ''}</span>
        </FormField>
        <FormField label={t('job:create.exclusives')}>
          <span>
            <pre>{exclusiveText ? exclusiveText : ''}</pre>
          </span>
        </FormField>
      </SpaceBetween>
    </Container>
  );
};

export default JobPreview;
