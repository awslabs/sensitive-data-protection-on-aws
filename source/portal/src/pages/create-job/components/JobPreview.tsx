import React from 'react';
import {
  Container,
  FormField,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import { IJobType } from 'pages/data-job/types/job_list_type';
import { SOURCE_TYPE } from 'enum/common_types';

const SELECT_S3 = 'selectS3';
const SELECT_RDS = 'selectRds';

interface JobPreviewProps {
  jobData: IJobType;
}

const JobPreview: React.FC<JobPreviewProps> = (props: JobPreviewProps) => {
  const { t } = useTranslation();
  const { jobData } = props;
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
        <FormField label="Provider">
          <span>{jobData.provider_id}</span>
        </FormField>
        <FormField label="Data sources">
          <span>{jobData.database_type}</span>
        </FormField>
        <FormField label={t('job:create.targetDataCatalogs')}>
          {jobData.database_type === SOURCE_TYPE.S3 && (
            <>
              <span className="sources-title">
                {t('job:create.s3Bucket')} (
                {jobData.all_s3 === '1'
                  ? 'All data catalogs'
                  : 'Specific data catalogs'}
                ) :
                <ul>
                  {jobData.databases.map((item: any, index: number) => {
                    return (
                      <li
                        className="job-name"
                        key={SELECT_S3 + index}
                        onClick={() => jumpToCatalog(item)}
                      >
                        {item.database_name}
                      </li>
                    );
                  })}
                </ul>
              </span>
            </>
          )}
          <br></br>
          {jobData.database_type === SOURCE_TYPE.RDS &&
            jobData.rdsSelectedView === 'rds-instance-view' && (
              <>
                <span className="sources-title">
                  {t('job:create.rdsInstance')} (
                  {jobData.all_rds === '1'
                    ? 'All data catalogs'
                    : 'Specific data catalogs'}
                  )) :
                </span>
                {jobData.all_rds === '0' &&
                  jobData.databases.map((item: any, index: number) => {
                    return (
                      <li
                        className="sources-title-detail"
                        key={SELECT_RDS + index}
                      >
                        {item.database_name}
                      </li>
                    );
                  })}
              </>
            )}
          {jobData.database_type === SOURCE_TYPE.RDS &&
            jobData.rdsSelectedView === 'rds-table-view' && (
              <>
                <span className="sources-title">
                  {t('job:create.rdsTable')} (
                  {jobData.all_rds === '1'
                    ? 'All data catalogs'
                    : 'Specific data catalogs'}
                  )) :
                </span>
                {jobData.all_rds === '0' &&
                  jobData.databases.map((item: any, index: number) => {
                    return (
                      <li
                        className="sources-title-detail"
                        key={SELECT_RDS + index}
                      >
                        {item.table_name}
                      </li>
                    );
                  })}
              </>
            )}
        </FormField>
        <FormField label={t('job:create.name')}>
          <span>{jobData.name}</span>
        </FormField>
        <FormField label={t('job:create.desc')}>
          <span>{jobData.description}</span>
        </FormField>
        <FormField label={t('job:create.dataClassfiyTmpl')}>
          <span>{jobData.templateObj?.label}</span>
        </FormField>
        <FormField label={t('job:create.scanFreq')}>
          <span>
            {jobData.frequencyType.toUpperCase()}{' '}
            {jobData.frequencyStart && (
              <>
                - Start hours/day:
                {jobData.frequencyStart?.value}
              </>
            )}
          </span>
        </FormField>
        <FormField label={t('job:create.scanDepth')}>
          <span>{jobData.scanDepthObj?.label}</span>
        </FormField>
        <FormField label={t('job:create.scanRange')}>
          <span>{jobData.scanRangeObj?.label}</span>
        </FormField>
        <FormField label={t('job:create.detectionThreshold')}>
          <span>{jobData.detectionThresholdObj?.label}</span>
        </FormField>
        <FormField label={t('job:create.override')}>
          <span>{jobData?.overrideObj?.label}</span>
        </FormField>
        <FormField label={t('job:create.excludeKeywords')}>
          <span>
            <pre>{jobData.exclude_keywords}</pre>
          </span>
        </FormField>
        <FormField label={t('job:create.includeKeywords')}>
          <span>
            <pre>{jobData.include_keywords}</pre>
          </span>
        </FormField>
        {jobData.database_type === SOURCE_TYPE.S3 && (
          <>
            <FormField label={t('job:create.excludeFile')}>
              <span>
                <pre>{jobData.exclude_file_extensions}</pre>
              </span>
            </FormField>
            <FormField label={t('job:create.includeFile')}>
              <span>
                <pre>{jobData.include_file_extensions}</pre>
              </span>
            </FormField>
          </>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default JobPreview;
