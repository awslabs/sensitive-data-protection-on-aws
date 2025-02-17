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
  IDataSourceS3BucketType,
  IJobType,
  INIT_JOB_DATA,
} from 'pages/data-job/types/job_list_type';
import { CACHE_CONDITION_KEY, SOURCE_TYPE } from 'enum/common_types';
import { createJob, startJob } from 'apis/data-job/api';
import { SUB_WEEK_CONFIG, alertMsg } from 'tools/tools';
import {
  CombinedRDSDatabase,
  DAY_OPTIONS,
  DbItemInfo,
  MONTH_OPTIONS,
} from './types/create_data_type';
import SelectRDSCatalog from './components/SelectRDSCatalog';
import SelectGlueCatalog from './components/SelectGlueCatalog';
import SelectJDBCCatalog from './components/SelectJDBCCatalog';
import { IAccountData } from 'pages/account-management/types/account_type';
import moment from 'moment';

export const convertAccountListToJobDatabases = (
  accountList: IAccountData[],
  source_type: string
) => {
  return accountList.map((element) => {
    return {
      account_id: element.account_id,
      region: element.region,
      database_type: source_type,
      database_name: '',
      table_name: '',
    };
  });
};

export const convertDataSourceListToJobDatabases = (
  dataSources: IDataSourceType[],
  source_type: string
) => {
  return dataSources.map((element) => {
    return {
      account_id: element.account_id,
      region: element.region,
      database_type: source_type,
      database_name: element.instance_id,
      table_name: '',
    };
  });
};

export const convertGlueDataSourceListToJobDatabases = (
  dataSources: IDataSourceType[],
  source_type: string
) => {
  return dataSources.map((element) => {
    return {
      account_id: element.account_id,
      region: element.region,
      database_type: source_type,
      database_name: element.glue_database_name,
      table_name: '',
    };
  });
};

export const convertS3BucketDataSourceListToJobDatabases = (
  dataSources: IDataSourceS3BucketType[],
  source_type: string
) => {
  return dataSources.map((element) => {
    return {
      account_id: element.account_id,
      region: element.region,
      database_type: source_type,
      database_name: element.bucket_name,
      table_name: '',
    };
  });
};

export const convertTableSourceToJobDatabases = (
  dataSources: IDataSourceType[],
  source_type: string
) => {
  const combined: CombinedRDSDatabase = {};

  dataSources.forEach((item: DbItemInfo) => {
    if (Object.prototype.hasOwnProperty.call(combined, item.database_name)) {
      combined[item.database_name].push(item);
    } else {
      combined[item.database_name] = [item];
    }
  });

  const rdsCatalogList: any = Object.entries(combined).map(
    ([database_name, table_items]) => {
      const table_names = Array.from(
        new Set(table_items.map((item) => item.table_name))
      ).join(',');
      return {
        account_id: table_items[0].account_id,
        region: table_items[0].region,
        database_type: table_items[0].database_type,
        database_name: database_name,
        table_name: table_names,
      };
    }
  );
  return rdsCatalogList;
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

const checkSameItem = (text1: string, text2: string) => {
  const linesOne = text1.split('\n');
  const linesTwo = text2.split('\n');

  const commonLines = linesOne.filter((line) => linesTwo.includes(line));
  return commonLines.length > 0;
};

const CreateJobContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [jobData, setJobData] = useState<IJobType>(INIT_JOB_DATA);
  const [isLoading, setIsLoading] = useState(false);

  const checkMustData = (requestedStepIndex: number) => {
    if (requestedStepIndex < activeStepIndex) {
      return true;
    }
    if (
      requestedStepIndex !== 1 &&
      ((jobData.database_type === SOURCE_TYPE.S3 &&
        jobData.all_s3 === '0' &&
        jobData.databases.length === 0) ||
        (jobData.database_type === SOURCE_TYPE.RDS &&
          jobData.all_rds === '0' &&
          jobData.databases.length === 0) ||
        (jobData.database_type === SOURCE_TYPE.GLUE &&
          jobData.all_glue === '0' &&
          jobData.databases.length === 0) ||
        (jobData.database_type.startsWith('jdbc') &&
          jobData.all_jdbc === '0' &&
          jobData.databases.length === 0))
    ) {
      alertMsg(t('job:selectOnCatalog'), 'error');
      return false;
    }

    if (
      jobData.database_type === SOURCE_TYPE.RDS &&
      jobData.all_rds === '0' &&
      jobData.databases.length > 50 &&
      requestedStepIndex !== 1
    ) {
      alertMsg(t('job:selectLessItems'), 'error');
      return false;
    }

    if (requestedStepIndex === 3) {
      if (!jobData.name) {
        alertMsg(t('job:inputJobName'), 'error');
        return false;
      }
      const trimFrequency: any = jobData.frequency
        ? jobData.frequency.trim()
        : jobData.frequency;
      if (!trimFrequency) {
        alertMsg(t('job:freqTypeError'), 'error');
        return false;
      }

      if (
        jobData.depth_structured.toString() === '0' &&
        jobData.depth_unstructured.toString() === '0'
      ) {
        alertMsg(t('job:selectScanDepth'), 'error');
        return false;
      }
      if (!jobData.range) {
        alertMsg(t('job:selectScanRange'), 'error');
        return false;
      }
      if (!jobData.detection_threshold) {
        alertMsg(t('job:selectDetection'), 'error');
        return false;
      }
    }

    // check keywords duplicated in exclude an include
    if (jobData.includeKeyWordsEnable && jobData.excludeKeyWordsEnable) {
      if (
        jobData.include_keywords &&
        jobData.exclude_keywords &&
        checkSameItem(jobData.include_keywords, jobData.exclude_keywords)
      ) {
        alertMsg(t('job:keywordDuplicated'), 'error');
        return false;
      }
    }

    // check extensions duplicated in exclude an include
    if (jobData.includeExtensionsEnable && jobData.excludeExtensionsEnable) {
      if (
        jobData.include_file_extensions &&
        jobData.exclude_file_extensions &&
        checkSameItem(
          jobData.include_file_extensions,
          jobData.exclude_file_extensions
        )
      ) {
        alertMsg(t('job:extensionDuplicated'), 'error');
        return false;
      }
    }
    return true;
  };

  const cronGeneratorForGlueDaily = (time: string) => {
    const timeMoment = moment(time, 'HH:mm');
    timeMoment.subtract(8, 'hours');
    const hours = timeMoment.format('H');
    const minutes = timeMoment.format('m');
    return `${minutes} ${hours} * * ? *`;
  };

  const clkFrequencyApply = () => {
    const tempType = jobData.frequencyType;
    if (tempType === 'on_demand_run') {
      return true;
    }
    if (tempType === 'daily') {
      if (!jobData.frequencyTimeStart) {
        alertMsg(t('job:selectHourOfDay'), 'error');
        return false;
      }
    }
    if (tempType === 'weekly') {
      if (!jobData.frequencyTimeStart) {
        alertMsg(t('job:selectDayOfWeek'), 'error');
        return false;
      }
    }
    if (tempType === 'monthly') {
      if (!jobData.frequencyTimeStart) {
        alertMsg(t('job:selectDayOfMonth'), 'error');
        return false;
      }
    }
    return true;
  };

  const submitCreateJob = async () => {
    setIsLoading(true);
    let tempFrequency =
      jobData.frequencyType === 'on_demand_run'
        ? 'OnDemand'
        : jobData.frequency;

    let utcHourString = '0';
    if (jobData?.frequencyTimeStart?.value != null) {
      const [hour] = jobData.frequencyTimeStart.value.split(':');
      const localDate = new Date();
      const localOffset = localDate.getTimezoneOffset() / 60;
      const utcHour = parseInt(hour) - localOffset;

      // Ensure the UTC hour is within the range 0-23
      const utcHourNormalized = (utcHour + 24) % 24;

      // Format the UTC hour as a string
      utcHourString = utcHourNormalized.toString().padStart(2, '0');
    }
    console.info('jobData.frequencyType:', jobData.frequencyType);
    if (jobData.frequencyType === 'daily') {
      tempFrequency = cronGeneratorForGlueDaily(
        jobData.frequencyTimeStart?.value ?? ''
      );
    }
    if (jobData.frequencyType === 'weekly') {
      const tempTime =
        jobData.frequencyStart?.value === DAY_OPTIONS[0].value
          ? 'L'
          : SUB_WEEK_CONFIG[jobData.frequencyStart?.value as any];
      tempFrequency = `0 ${utcHourString} ? * ${tempTime} *`;
    }
    if (jobData.frequencyType === 'monthly') {
      const tempTime =
        jobData.frequencyStart?.value === MONTH_OPTIONS[0].value
          ? 'L'
          : parseInt(jobData.frequencyStart?.value as any) - 1;
      tempFrequency = `0 ${utcHourString} * ${tempTime} ? *`;
    }

    const requestParamJob = {
      provider_id: parseInt(jobData.provider_id),
      database_type: jobData.database_type,
      name: jobData.name.trim(),
      template_id: parseInt(jobData.template_id),
      schedule:
        tempFrequency === 'OnDemand' ? tempFrequency : `cron(${tempFrequency})`,
      description: jobData.description,
      range: parseInt(jobData.range || '0'),
      depth_structured: parseInt(jobData.depth_structured || '0'),
      depth_unstructured: parseInt(jobData.depth_unstructured || '0'),
      detection_threshold: parseFloat(jobData.detection_threshold || '0'),
      all_s3: parseInt(jobData.all_s3),
      all_rds: parseInt(jobData.all_rds),
      all_glue: parseInt(jobData.all_glue),
      all_jdbc: parseInt(jobData.all_jdbc),
      all_ddb: 0,
      all_emr: 0,
      overwrite: parseInt(jobData.overwrite || '0'),
      // exclude_keywords: exclusiveText.replace(/(\r\n|\r|\n)/g, ','),
      exclude_keywords: jobData.exclude_keywords.replace(/(\r\n|\r|\n)/g, ','),
      include_keywords: jobData.include_keywords.replace(/(\r\n|\r|\n)/g, ','),
      exclude_file_extensions: jobData.exclude_file_extensions.replace(
        /(\r\n|\r|\n)/g,
        ','
      ),
      include_file_extensions: jobData.include_file_extensions.replace(
        /(\r\n|\r|\n)/g,
        ','
      ),
      databases: jobData.databases,
    };

    try {
      const result: any = await createJob(requestParamJob);
      if (result && result.id && jobData.frequencyType === 'on_demand_run') {
        startJob(result);
      }
      setIsLoading(true);
      alertMsg(t('submitSuccess'), 'success');
      navigate(RouterEnum.Datajob.path);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const cancelCreateJob = () => {
    navigate(RouterEnum.Datajob.path);
  };

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
        isLoadingNextStep={isLoading}
        onSubmit={submitCreateJob}
        onCancel={cancelCreateJob}
        onNavigate={({ detail }) => {
          console.info(detail);
          if (detail.requestedStepIndex === 3) {
            if (!clkFrequencyApply()) {
              return;
            }
          }
          const checkResult = checkMustData(detail.requestedStepIndex);
          checkResult && setActiveStepIndex(detail.requestedStepIndex);
        }}
        activeStepIndex={activeStepIndex}
        // allowSkipTo
        steps={[
          {
            title: t('job:create.chooseProviderSource'),
            info: <Link variant="info">Info</Link>,
            description: t('job:create.chooseProviderSourceDesc'),
            content: (
              <SelectProvider
                jobData={jobData}
                changeProvider={(id) => {
                  setJobData((prev) => {
                    return { ...prev, provider_id: id };
                  });
                }}
                changeDataSource={(sId) => {
                  sessionStorage[CACHE_CONDITION_KEY] = JSON.stringify({
                    column: 'database_type',
                    condition: 'and',
                    operation: 'in',
                    values: [sId],
                  });
                  setJobData((prev) => {
                    return {
                      ...prev,
                      database_type: sId,
                      all_s3: '0',
                      all_rds: '0',
                      all_glue: '0',
                      all_jdbc: '0',
                    };
                  });
                }}
              />
            ),
          },
          {
            title: t('job:create.selectDataCatalog'),
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
                {jobData.database_type === SOURCE_TYPE.RDS && (
                  <SelectRDSCatalog
                    jobData={jobData}
                    changeSelectType={(type) => {
                      setJobData((prev) => {
                        return { ...prev, all_rds: type };
                      });
                    }}
                    changeRDSSelectView={(view) => {
                      setJobData((prev) => {
                        return {
                          ...prev,
                          rdsSelectedView: view,
                          databases: [],
                        };
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
                {jobData.database_type === SOURCE_TYPE.GLUE && (
                  <SelectGlueCatalog
                    jobData={jobData}
                    changeSelectType={(type) => {
                      setJobData((prev) => {
                        return { ...prev, all_glue: type };
                      });
                    }}
                    changeGlueSelectView={(view) => {
                      setJobData((prev) => {
                        return {
                          ...prev,
                          glueSelectedView: view,
                          databases: [],
                        };
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
                {jobData.database_type.startsWith(SOURCE_TYPE.JDBC) && (
                  <SelectJDBCCatalog
                    jobData={jobData}
                    changeSelectType={(type) => {
                      setJobData((prev) => {
                        return { ...prev, all_jdbc: type };
                      });
                    }}
                    changeJDBCSelectView={(view) => {
                      setJobData((prev) => {
                        return {
                          ...prev,
                          jdbcSelectedView: view,
                          databases: [],
                        };
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
            title: t('job:create.jobSettings'),
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
                        depth_structured: option?.value ?? '0',
                      };
                    });
                  }}
                  changeUnstructuredDepthObj={(option) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        scanUnstructuredDepthObj: option,
                        depth_unstructured: option?.value ?? '0',
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
                  changeFrequency={(frequency) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        frequency: frequency,
                      };
                    });
                  }}
                  changeFrequencyType={(type) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        frequencyType: type,
                      };
                    });
                  }}
                  changeFrequencyStart={(option) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        frequencyStart: option,
                      };
                    });
                  }}
                  changeFrequencyTimeStart={(option) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        frequencyTimeStart: option,
                      };
                    });
                  }}
                />
              </>
            ),
          },
          {
            title: t('job:create.advancedSettings'),
            content: (
              <>
                <AdvancedSettings
                  jobData={jobData}
                  changeExcludeFileExtensionEnable={(enable) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        excludeExtensionsEnable: enable,
                        exclude_file_extensions: enable
                          ? prev.exclude_file_extensions
                          : '',
                      };
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
                      return {
                        ...prev,
                        excludeKeyWordsEnable: enable,
                        exclude_keywords: enable ? prev.exclude_keywords : '',
                      };
                    });
                  }}
                  changeIncludeFileExtension={(extension) => {
                    setJobData((prev) => {
                      return { ...prev, include_file_extensions: extension };
                    });
                  }}
                  changeIncludeFileExtensionEnable={(enable) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        includeExtensionsEnable: enable,
                        include_file_extensions: enable
                          ? prev.include_file_extensions
                          : '',
                      };
                    });
                  }}
                  changeIncludeKeyword={(keyword) => {
                    setJobData((prev) => {
                      return { ...prev, include_keywords: keyword };
                    });
                  }}
                  changeIncludeKeywordEnable={(enable) => {
                    setJobData((prev) => {
                      return {
                        ...prev,
                        includeKeyWordsEnable: enable,
                        include_keywords: enable ? prev.include_keywords : '',
                      };
                    });
                  }}
                />
              </>
            ),
          },
          {
            title: t('job:create.jobPreview'),
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
