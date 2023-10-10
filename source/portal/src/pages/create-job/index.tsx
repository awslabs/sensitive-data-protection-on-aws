import React, { useEffect, useState } from 'react';
import './style.scss';
import {
  Button,
  Header,
  Wizard,
  AppLayout,
  Link,
  ContentLayout,
} from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { useTranslation } from 'react-i18next';
import SelectProvider from './components/SelectProvider';
import SelectS3Catalog from './components/SelectS3Catalog';
import JobSettings from './components/JobSettings';
import AdvancedSettings from './components/AdvancedSettings';
import JobPreview from './components/JobPreview';
import {
  IDataSourceType,
  IJobType,
  INIT_JOB_DATA,
} from 'pages/data-job/types/job_list_type';
import { SOURCE_TYPE } from 'enum/common_types';

export const convertDataSourceListToJobDatabases = (
  dataSources: IDataSourceType[],
  source_type: string
) => {
  return dataSources.map((element) => {
    return {
      account_id: element.account_id,
      region: element.region,
      database_type: source_type,
      database_name: element.database_name,
      table_name: '',
    };
  });
};

const CreateJobHeader: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Header
      variant="h1"
      description=""
      actions={
        <Button onClick={() => navigate(RouterEnum.Datajob.path)}>
          {t('button.backToJobList')}
        </Button>
      }
    >
      {t('job:create.title')}
    </Header>
  );
};

const CreateJobContent = () => {
  const { t } = useTranslation();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [jobData, setJobData] = useState<IJobType>(INIT_JOB_DATA);

  useEffect(() => {
    console.info('jobData:', jobData);
  }, [jobData]);

  return (
    <div>
      <Wizard
        i18nStrings={{
          stepNumberLabel: (stepNumber) => `${t('step.step')} ${stepNumber}`,
          collapsedStepsLabel: (stepNumber, stepsCount) =>
            `${t('step.step')} ${stepNumber} ${t('step.of')} ${stepsCount}`,
          skipToButtonLabel: (step, stepNumber) =>
            `${t('step.skipTo')} ${step.title}`,
          navigationAriaLabel: t('step.steps') ?? '',
          cancelButton: t('button.cancel') ?? '',
          previousButton: t('button.previous') ?? '',
          nextButton: t('button.next') ?? '',
          submitButton: t('button.runAJob') ?? '',
          optional: t('optional') ?? '',
        }}
        onNavigate={({ detail }) =>
          setActiveStepIndex(detail.requestedStepIndex)
        }
        activeStepIndex={activeStepIndex}
        // allowSkipTo
        steps={[
          {
            title: 'Choose cloud provider and data sources',
            info: <Link variant="info">Info</Link>,
            description: 'Select cloud provider and data source',
            content: (
              <SelectProvider
                jobData={jobData}
                changeProvider={(id) => {
                  setJobData((prev) => {
                    return { ...prev, provider_id: id };
                  });
                }}
                changeDataSource={(sId) => {
                  setJobData((prev) => {
                    return {
                      ...prev,
                      database_type: sId,
                      all_s3: '1',
                      all_rds: '1',
                      all_glue: '1',
                      all_jdbc: '1',
                    };
                  });
                }}
              />
            ),
          },
          {
            title: 'Select existing data catalogs',
            content: (
              <>
                {jobData.database_type === SOURCE_TYPE.S3 && (
                  <SelectS3Catalog
                    jobData={jobData}
                    changeSelectType={(type) => {
                      setJobData((prev) => {
                        return { ...prev, all_s3: type };
                      });
                    }}
                    changeSelectDatabases={(databases) => {
                      setJobData((prev) => {
                        return {
                          ...prev,
                          databases: databases,
                        };
                      });
                    }}
                  />
                )}
              </>
            ),
          },
          {
            title: 'Job settings',
            content: (
              <>
                <JobSettings
                  jobData={jobData}
                  changeJobName={(name) => {
                    setJobData((prev) => {
                      return { ...prev, name: name };
                    });
                  }}
                  changeJobDesc={(desc) => {
                    setJobData((prev) => {
                      return { ...prev, description: desc };
                    });
                  }}
                  changeTemplateObj={(option) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        templateObj: option,
                        template_id: option?.value ?? '',
                      };
                    });
                  }}
                  changeScanFrequencyObj={(option) => {
                    setJobData((prev) => {
                      return { ...prev, scanFrequencyObj: option };
                    });
                  }}
                  changeScanDepthObj={(option) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        scanDepthObj: option,
                        depth_structured: option?.value ?? '',
                      };
                    });
                  }}
                  changeUnstructuredDepthObj={(option) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        scanUnstructuredDepthO: option,
                        depth_unstructured: option?.value ?? '',
                      };
                    });
                  }}
                  changeScanRangeObj={(option) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        scanRangeObj: option,
                        range: option?.value ?? '',
                      };
                    });
                  }}
                  changeDetectionThresholdObj={(option) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        detectionThresholdObj: option,
                        detection_threshold: option?.value ?? '',
                      };
                    });
                  }}
                  changeOverrideObj={(option) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        overrideObj: option,
                        overwrite: option?.value ?? '',
                      };
                    });
                  }}
                />
              </>
            ),
          },
          {
            title: 'Advanced settings: Exclude keywords',
            content: (
              <>
                <AdvancedSettings
                  jobData={jobData}
                  changeExcludeFileExtensionEnable={(enable) => {
                    setJobData((prev) => {
                      return { ...prev, excludeExtensionsEnable: enable };
                    });
                  }}
                  changeExcludeFileExtension={(extension) => {
                    setJobData((prev) => {
                      return { ...prev, exclude_file_extensions: extension };
                    });
                  }}
                  changeExcludeKeyword={(keyword) => {
                    setJobData((prev) => {
                      return { ...prev, exclude_keywords: keyword };
                    });
                  }}
                  changeExcludeKeywordEnable={(enable) => {
                    setJobData((prev) => {
                      return { ...prev, excludeKeyWordsEnable: enable };
                    });
                  }}
                  changeIncludeFileExtension={(extension) => {
                    setJobData((prev) => {
                      return { ...prev, include_file_extensions: extension };
                    });
                  }}
                  changeIncludeFileExtensionEnable={(enable) => {
                    setJobData((prev) => {
                      return { ...prev, includeExtensionsEnable: enable };
                    });
                  }}
                  changeIncludeKeyword={(keyword) => {
                    setJobData((prev) => {
                      return { ...prev, include_keywords: keyword };
                    });
                  }}
                  changeIncludeKeywordEnable={(enable) => {
                    setJobData((prev) => {
                      return { ...prev, includeKeyWordsEnable: enable };
                    });
                  }}
                />
              </>
            ),
          },
          {
            title: 'Job preview',
            content: <JobPreview jobData={jobData} />,
          },
        ]}
      />
    </div>
  );
};

const CreateJob: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.runJobs'),
      href: RouterEnum.CreateJob.path,
    },
  ];
  return (
    <AppLayout
      toolsHide
      content={
        <ContentLayout header={<CreateJobHeader />}>
          <CreateJobContent />
        </ContentLayout>
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.CreateJob.path} />}
      navigationWidth={290}
    />
  );
};

export default CreateJob;
