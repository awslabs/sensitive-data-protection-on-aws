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
  Textarea,
  Toggle,
} from '@cloudscape-design/components';
import { useLocation } from 'react-router-dom';
import {
  DETECTION_THRESHOLD_OPTIONS,
  FREQUENCY_TYPE,
  OVERRIDE_OPTIONS,
  SCAN_DEPTH_OPTIONS,
  SCAN_RANGE_OPTIONS,
} from '../types/create_data_type';
import { alertMsg } from 'tools/tools';
import {
  HOUR_OPTIONS,
  DAY_OPTIONS,
  MONTH_OPTIONS,
} from '../types/create_data_type';
import { useTranslation } from 'react-i18next';

const DEFAULT_TEMPLATE = {
  label: 'Current data classification template',
  value: '1',
};

const SCAN_FREQUENCY: any[] = [
  { value: 'on_demand_run', label: FREQUENCY_TYPE.on_demand_run },
  { value: 'daily', label: FREQUENCY_TYPE.daily },
  { value: 'weekly', label: FREQUENCY_TYPE.weekly },
  { value: 'monthly', label: FREQUENCY_TYPE.monthly },
];

const JobSettings = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { oldData } = location.state || {};

  const [jobName, setJobName] = useState(oldData ? oldData.name : '');
  const [jobDescription, setJobDescriptio] = useState(
    oldData ? oldData.description : ''
  );
  const [selectTemplate, setSelectTemplate] = useState(DEFAULT_TEMPLATE as any);
  const [frequency, setFrequency] = useState('On-demand run');
  const [scanFrequency, setScanFrequency] = useState(
    SCAN_FREQUENCY[0] as SelectProps.Option | null
  );
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
  const [frequencyTimeStart, setFrequencyTimeStart] =
    useState<SelectProps.Option>({ label: '00:00', value: '0' });

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
    const re = /[^0-9a-zA-Z_.\- |-]/g;
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
              value={jobName}
              onChange={({ detail }) =>
                detail.value.length <= 60 &&
                checkChar(detail.value) &&
                setJobName(detail.value)
              }
              placeholder={t('job:create.jobNamePlaceholder') || ''}
            />
          </FormField>
          <FormField label={t('job:create.desc')}>
            <Input
              value={jobDescription}
              onChange={({ detail }) =>
                detail.value.length <= 60 && setJobDescriptio(detail.value)
              }
              placeholder={t('job:create.descPlaceholder') || ''}
            />
          </FormField>
        </SpaceBetween>
      </Container>
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
              <b className="titel-info">{t('info')}</b>
            </Popover>
          }
        >
          <Select
            selectedOption={selectTemplate}
            onChange={(select) => {
              setSelectTemplate(select.detail.selectedOption);
            }}
            triggerVariant="option"
            options={[DEFAULT_TEMPLATE]}
            placeholder={t('job:create.classifyTmplForPrivacy') || ''}
          ></Select>
        </FormField>
      </Container>

      <Container
        header={<Header variant="h2">{t('job:create.jobSettings')}</Header>}
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField label={t('job:create.scanFreq')}>
            <Select
              triggerVariant="option"
              selectedAriaLabel={t('selected') || ''}
              onChange={({ detail }) => {
                setFrequencyType(detail.selectedOption.value as any);
                setScanFrequency(detail.selectedOption);
                if (detail.selectedOption.value === 'on_demand_run') {
                  clkFrequencyApply(detail.selectedOption.value);
                }
              }}
              options={SCAN_FREQUENCY}
              selectedOption={scanFrequency}
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
                  selectedAriaLabel={t('selected') || ''}
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
                  selectedAriaLabel={t('selected') || ''}
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
                  selectedAriaLabel={t('selected') || ''}
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
                  selectedAriaLabel={t('selected') || ''}
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
                  selectedAriaLabel={t('selected') || ''}
                  options={HOUR_OPTIONS}
                  onChange={(select) => {
                    setFrequencyTimeStart(select.detail.selectedOption);
                  }}
                  onBlur={clkFrequencyApply}
                ></Select>
              </FormField>
            )}
          </div>

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
                <b className="titel-info">{t('info')}</b>
              </Popover>
            }
          >
            <Select
              selectedOption={scanDepth}
              onChange={(select) => {
                setScanDepth(select.detail.selectedOption);
              }}
              triggerVariant="option"
              options={SCAN_DEPTH_OPTIONS}
              selectedAriaLabel={t('selected') || ''}
              placeholder={t('job:create.scanDepthPlaceholder') || ''}
            ></Select>
          </FormField>
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
                <b className="titel-info">{t('info')}</b>
              </Popover>
            }
          >
            <Select
              selectedOption={scanRange}
              onChange={(select) => {
                setScanRange(select.detail.selectedOption);
              }}
              triggerVariant="option"
              options={SCAN_RANGE_OPTIONS}
              selectedAriaLabel={t('selected') || ''}
              placeholder={t('job:create.scanRangePlaceholder') || ''}
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
                <b className="titel-info">{t('info')}</b>
              </Popover>
            }
          >
            <Select
              selectedOption={detectionThreshold}
              onChange={(select) => {
                setDetectionThreshold(select.detail.selectedOption);
              }}
              triggerVariant="option"
              options={DETECTION_THRESHOLD_OPTIONS}
              selectedAriaLabel={t('selected') || ''}
              placeholder={t('job:create.detectionThresholdPlaceholder') || ''}
            ></Select>
          </FormField>
          <FormField label={t('job:create.override')}>
            <Select
              selectedOption={overwrite}
              onChange={(select) => {
                setOverwrite(select.detail.selectedOption);
              }}
              triggerVariant="option"
              options={OVERRIDE_OPTIONS}
              selectedAriaLabel={t('selected') || ''}
            ></Select>
          </FormField>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
};

export default JobSettings;
