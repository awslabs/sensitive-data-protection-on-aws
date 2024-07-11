import { useEffect, useState } from 'react';
import {
  Container,
  FormField,
  Header,
  Input,
  SpaceBetween,
  Select,
  SelectProps,
  Popover,
  StatusIndicator,
} from '@cloudscape-design/components';
import {
  DETECTION_THRESHOLD_OPTIONS,
  OVERRIDE_OPTIONS,
  SCAN_DEPTH_OPTIONS,
  SCAN_RANGE_OPTIONS,
  SCAN_STRUCTURED_DEPTH_OPTIONS,
  SCAN_UNSTRUCTURED_DEPTH_OPTIONS,
  HOUR_OPTIONS,
  DAY_OPTIONS,
  MONTH_OPTIONS,
} from '../types/create_data_type';
import { alertMsg } from 'tools/tools';
import { useTranslation } from 'react-i18next';
import { IJobType, SCAN_FREQUENCY } from 'pages/data-job/types/job_list_type';
import { DEFAULT_TEMPLATE } from 'pages/data-template/types/template_type';
import { SOURCE_TYPE } from 'enum/common_types';

interface JobSettingsProps {
  jobData: IJobType;
  changeJobName: (name: string) => void;
  changeJobDesc: (desc: string) => void;
  changeTemplateObj: (template: SelectProps.Option | null) => void;
  changeScanFrequencyObj: (option: SelectProps.Option | null) => void;
  changeScanDepthObj: (option: SelectProps.Option | null) => void;
  changeUnstructuredDepthObj: (option: SelectProps.Option | null) => void;
  changeScanRangeObj: (option: SelectProps.Option | null) => void;
  changeDetectionThresholdObj: (option: SelectProps.Option | null) => void;
  changeOverrideObj: (option: SelectProps.Option | null) => void;
  changeFrequency: (frq: string) => void;
  changeFrequencyType: (type: string) => void;
  changeFrequencyStart: (option: SelectProps.Option | null) => void;
  changeFrequencyTimeStart: (option: SelectProps.Option | null) => void;
}

const JobSettings: React.FC<JobSettingsProps> = (props: JobSettingsProps) => {
  const {
    jobData,
    changeJobName,
    changeJobDesc,
    changeTemplateObj,
    changeScanFrequencyObj,
    changeScanDepthObj,
    changeUnstructuredDepthObj,
    changeScanRangeObj,
    changeDetectionThresholdObj,
    changeOverrideObj,
    changeFrequency,
    changeFrequencyType,
    changeFrequencyStart,
    changeFrequencyTimeStart,
  } = props;
  const { t } = useTranslation();
  const [frequency, setFrequency] = useState(jobData.frequency);
  const [frequencyType, setFrequencyType] = useState(jobData.frequencyType);
  const [frequencyStart, setFrequencyStart] = useState(jobData.frequencyStart);
  const [frequencyTimeStart, setFrequencyTimeStart] =
    useState<SelectProps.Option | null>(jobData.frequencyTimeStart);
  const [timezone, setTimezone] = useState('');

  const clkFrequencyApply = (type: any) => {
    const tempType = typeof type === 'string' ? type : frequencyType;
    if (tempType === 'on_demand_run') {
      setFrequency('On-demand run');
    }
    if (tempType === 'daily') {
      if (!frequencyStart) {
        alertMsg(t('job:selectHourOfDay'), 'error');
        return;
      }
      setFrequency(`Daily, start time: ${frequencyStart.value}`);
    }
    if (tempType === 'weekly') {
      if (!frequencyStart) {
        alertMsg(t('job:selectDayOfWeek'), 'error');
        return;
      }
      setFrequency(`${t('job:weeklyStartDay')} ${frequencyStart.value}`);
    }
    if (tempType === 'monthly') {
      if (!frequencyStart) {
        alertMsg(t('job:selectDayOfMonth'), 'error');
        return;
      }
      setFrequency(`${t('job:monthlyStartDay')} ${frequencyStart.value}`);
    }
  };

  const checkChar = (name: string) => {
    const re = /[^0-9a-zA-Z_.-]/g;
    if (!re?.test(name)) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    const getTimezone = () => {
      const offset = new Date().getTimezoneOffset();
      const hours = Math.abs(Math.floor(offset / 60));
      const offsetString = `UTC${offset < 0 ? '+' : '-'}${hours}`;
      setTimezone(offsetString);
    };
    getTimezone();
  }, []);

  useEffect(() => {
    changeFrequency(frequency);
  }, [frequency]);

  useEffect(() => {
    changeFrequencyType(frequencyType);
  }, [frequencyType]);

  useEffect(() => {
    changeFrequencyStart(frequencyStart);
  }, [frequencyStart]);

  useEffect(() => {
    changeFrequencyTimeStart(frequencyTimeStart);
  }, [frequencyTimeStart]);

  return (
    <SpaceBetween direction="vertical" size="l">
      <Container
        header={<Header variant="h2">{t('job:create.jobBasicInfo')}</Header>}
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField
            label={t('job:create.name')}
            description={t('job:create.nameDesc')}
          >
            <Input
              value={jobData.name}
              onChange={({ detail }) =>
                detail.value.length <= 60 &&
                checkChar(detail.value) &&
                changeJobName(detail.value)
              }
              placeholder={t('job:create.jobNamePlaceholder') ?? ''}
            />
          </FormField>
          <FormField label={t('job:create.desc')}>
            <Input
              value={jobData.description}
              onChange={({ detail }) =>
                detail.value.length <= 60 && changeJobDesc(detail.value)
              }
              placeholder={t('job:create.descPlaceholder') ?? ''}
            />
          </FormField>
        </SpaceBetween>
      </Container>

      {jobData.database_type !== SOURCE_TYPE.S3_BANK_CARD && (
        <Container
          header={
            <Header variant="h2">{t('job:create.dataClassfiyTmpl')}</Header>
          }
        >
          <FormField
            label={t('job:create.dataClassfiyTmpl')}
            info={
              <Popover
                dismissButton={false}
                position="right"
                size="large"
                content={
                  <StatusIndicator type="info">
                    {t('job:create.dataClassfiyTmplPop1')}
                    <p>{t('job:create.dataClassfiyTmplPop2')}</p>
                    <p>{t('job:create.dataClassfiyTmplPop3')}</p>
                  </StatusIndicator>
                }
              >
                <b className="title-info">{t('info')}</b>
              </Popover>
            }
          >
            <Select
              selectedOption={jobData.templateObj}
              onChange={(select) => {
                changeTemplateObj(select.detail.selectedOption);
              }}
              triggerVariant="option"
              options={[DEFAULT_TEMPLATE]}
              placeholder={t('job:create.classifyTmplForPrivacy') ?? ''}
            ></Select>
          </FormField>
        </Container>
      )}

      <Container
        header={<Header variant="h2">{t('job:create.jobSettings')}</Header>}
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField label={t('job:create.scanFreq')}>
            <Select
              triggerVariant="option"
              selectedAriaLabel={t('selected') ?? ''}
              onChange={({ detail }) => {
                setFrequencyType(detail.selectedOption.value as any);
                changeScanFrequencyObj(detail.selectedOption);
                if (detail.selectedOption.value === 'on_demand_run') {
                  clkFrequencyApply(detail.selectedOption.value);
                }
              }}
              options={SCAN_FREQUENCY}
              selectedOption={jobData.scanFrequencyObj}
            ></Select>
          </FormField>
          <div>
            {frequencyType === 'daily' && (
              <FormField
                label={t('job:create.startHourOfDay') + ' (' + timezone + ')'}
              >
                <Select
                  selectedOption={frequencyTimeStart}
                  triggerVariant="option"
                  selectedAriaLabel={t('selected') ?? ''}
                  options={HOUR_OPTIONS}
                  onChange={(select) => {
                    setFrequencyTimeStart(select.detail.selectedOption);
                  }}
                  onBlur={clkFrequencyApply}
                ></Select>
              </FormField>
            )}
            {frequencyType === 'weekly' && (
              <FormField label={t('job:create.startDayOfWeek')}>
                <Select
                  selectedOption={frequencyStart}
                  triggerVariant="option"
                  options={DAY_OPTIONS}
                  selectedAriaLabel={t('selected') ?? ''}
                  onChange={(select) => {
                    setFrequencyStart(select.detail.selectedOption);
                  }}
                  onBlur={clkFrequencyApply}
                ></Select>
                <p />
              </FormField>
            )}
            {frequencyType === 'weekly' && (
              <FormField
                label={t('job:create.startHourOfDay') + ' (' + timezone + ')'}
              >
                <Select
                  selectedOption={frequencyTimeStart}
                  triggerVariant="option"
                  selectedAriaLabel={t('selected') ?? ''}
                  options={HOUR_OPTIONS}
                  onChange={(select) => {
                    setFrequencyTimeStart(select.detail.selectedOption);
                  }}
                  onBlur={clkFrequencyApply}
                ></Select>
              </FormField>
            )}
            {frequencyType === 'monthly' && (
              <FormField
                label={t('job:create.startDayOfMonth')}
                description={t('job:create.startDayOfMonthDesc')}
              >
                <Select
                  selectedOption={frequencyStart}
                  triggerVariant="option"
                  options={MONTH_OPTIONS}
                  selectedAriaLabel={t('selected') ?? ''}
                  onChange={(select) => {
                    setFrequencyStart(select.detail.selectedOption);
                  }}
                  onBlur={clkFrequencyApply}
                ></Select>
                <p />
              </FormField>
            )}
            {frequencyType === 'monthly' && (
              <FormField
                label={t('job:create.startHourOfDay') + ' (' + timezone + ')'}
              >
                <Select
                  selectedOption={frequencyTimeStart}
                  triggerVariant="option"
                  selectedAriaLabel={t('selected') ?? ''}
                  options={HOUR_OPTIONS}
                  onChange={(select) => {
                    setFrequencyTimeStart(select.detail.selectedOption);
                  }}
                  onBlur={clkFrequencyApply}
                ></Select>
              </FormField>
            )}
          </div>

          {jobData.database_type === SOURCE_TYPE.S3 ? (
            <>
              <FormField
                label={t('job:create.scanDepthForStructured')}
                info={
                  <Popover
                    dismissButton={false}
                    position="right"
                    size="large"
                    content={
                      <StatusIndicator type="info">
                        {t('job:create.scanDepthForStructuredInfo')}
                      </StatusIndicator>
                    }
                  >
                    <b className="title-info">{t('info')}</b>
                  </Popover>
                }
              >
                <Select
                  selectedOption={jobData.scanDepthObj}
                  onChange={(select) => {
                    changeScanDepthObj(select.detail.selectedOption);
                  }}
                  triggerVariant="option"
                  options={SCAN_STRUCTURED_DEPTH_OPTIONS}
                  selectedAriaLabel={t('selected') ?? ''}
                  placeholder={t('job:create.scanDepthPlaceholder') ?? ''}
                ></Select>
              </FormField>

              <FormField
                label={t('job:create.scanDepthForUnstructured')}
                info={
                  <Popover
                    dismissButton={false}
                    position="right"
                    size="large"
                    content={
                      <StatusIndicator type="info">
                        {t('job:create.scanDepthForUnstructuredInfo')}
                      </StatusIndicator>
                    }
                  >
                    <b className="title-info">{t('info')}</b>
                  </Popover>
                }
              >
                <Select
                  selectedOption={jobData.scanUnstructuredDepthObj}
                  onChange={(select) => {
                    changeUnstructuredDepthObj(select.detail.selectedOption);
                  }}
                  triggerVariant="option"
                  options={SCAN_UNSTRUCTURED_DEPTH_OPTIONS}
                  selectedAriaLabel={t('selected') ?? ''}
                  placeholder={t('job:create.scanDepthPlaceholder') ?? ''}
                ></Select>
              </FormField>
            </>
          ) : (
            <>
              {jobData.database_type !== SOURCE_TYPE.S3_BANK_CARD && (
                <FormField
                  label={t('job:create.scanDepth')}
                  info={
                    <Popover
                      dismissButton={false}
                      position="right"
                      size="large"
                      content={
                        <StatusIndicator type="info">
                          {t('job:create.scanDepthPop1')}
                          <p>{t('job:create.scanDepthPop2')}</p>
                        </StatusIndicator>
                      }
                    >
                      <b className="title-info">{t('info')}</b>
                    </Popover>
                  }
                >
                  <Select
                    selectedOption={jobData.scanDepthObj}
                    onChange={(select) => {
                      changeScanDepthObj(select.detail.selectedOption);
                    }}
                    triggerVariant="option"
                    options={SCAN_DEPTH_OPTIONS}
                    selectedAriaLabel={t('selected') ?? ''}
                    placeholder={t('job:create.scanDepthPlaceholder') ?? ''}
                  ></Select>
                </FormField>
              )}
            </>
          )}

          {jobData.database_type !== SOURCE_TYPE.S3_BANK_CARD && (
            <>
              <FormField
                label={t('job:create.scanRange')}
                info={
                  <Popover
                    dismissButton={false}
                    position="right"
                    size="large"
                    content={
                      <StatusIndicator type="info">
                        {t('job:create.scanRangePop1')}
                        <p>{t('job:create.scanRangePop2')}</p>
                      </StatusIndicator>
                    }
                  >
                    <b className="title-info">{t('info')}</b>
                  </Popover>
                }
              >
                <Select
                  selectedOption={jobData.scanRangeObj}
                  onChange={(select) => {
                    changeScanRangeObj(select.detail.selectedOption);
                  }}
                  triggerVariant="option"
                  options={SCAN_RANGE_OPTIONS}
                  selectedAriaLabel={t('selected') ?? ''}
                  placeholder={t('job:create.scanRangePlaceholder') ?? ''}
                ></Select>
              </FormField>
              <FormField
                label={t('job:create.detectionThreshold')}
                info={
                  <Popover
                    dismissButton={false}
                    position="right"
                    size="large"
                    content={
                      <StatusIndicator type="info">
                        {t('job:create.detectionThresholdPop1')}
                        <p>{t('job:create.detectionThresholdPop2')}</p>
                      </StatusIndicator>
                    }
                  >
                    <b className="title-info">{t('info')}</b>
                  </Popover>
                }
              >
                <Select
                  selectedOption={jobData.detectionThresholdObj}
                  onChange={(select) => {
                    changeDetectionThresholdObj(select.detail.selectedOption);
                  }}
                  triggerVariant="option"
                  options={DETECTION_THRESHOLD_OPTIONS}
                  selectedAriaLabel={t('selected') ?? ''}
                  placeholder={
                    t('job:create.detectionThresholdPlaceholder') ?? ''
                  }
                ></Select>
              </FormField>
              <FormField label={t('job:create.override')}>
                <Select
                  selectedOption={jobData.overrideObj}
                  onChange={(select) => {
                    changeOverrideObj(select.detail.selectedOption);
                  }}
                  triggerVariant="option"
                  options={OVERRIDE_OPTIONS}
                  selectedAriaLabel={t('selected') ?? ''}
                ></Select>
              </FormField>
            </>
          )}
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
};

export default JobSettings;
