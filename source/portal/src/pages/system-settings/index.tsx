import {
  Alert,
  AppLayout,
  Button,
  Container,
  ContentLayout,
  Form,
  FormField,
  Header,
  Input,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  getSubnetsRunIps,
  getSystemConfig,
  updateSystemConfig,
} from 'apis/config/api';
import { ConfigItem, ConfigSubnet } from './typs/config-typs';
import { alertMsg } from 'tools/tools';

const SettingsHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Header variant="h1" description={t('settings.desc')}>
      {t('nav.systemSettings')}
    </Header>
  );
};

const SystemSettingContent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [concurrentRunJobNumber, setConcurrentRunJobNumber] = useState('');
  const [subJobNumberRDS, setSubJobNumberRDS] = useState('');
  const [subnetItems, setSubnetItems] = useState<ConfigSubnet[]>([]);

  const [ipError, setIpError] = useState(false);
  const [ipSuccess, setIpSuccess] = useState(false);

  const getConfigValue = (configs: ConfigItem[], key: string) => {
    const config = configs.find((config) => config.config_key === key);
    return config ? config.config_value : '';
  };

  const getSystemSettingsConfig = async () => {
    setLoadingConfig(true);
    const configList: any = await getSystemConfig({});
    setConcurrentRunJobNumber(
      getConfigValue(configList, 'ConcurrentRunJobNumber')
    );
    setSubJobNumberRDS(getConfigValue(configList, 'SubJobNumberRds'));
    const ipList: any = await getSubnetsRunIps({});
    setSubnetItems(ipList);
    setLoadingConfig(false);
  };

  const updateSystemSettingsConfig = async () => {
    if (ipError) {
      return;
    }
    if (!ipSuccess) {
      alertMsg(t('settings.estimateFirst'), 'error');
      return;
    }
    setLoadingUpdate(true);
    await updateSystemConfig([
      {
        config_key: 'ConcurrentRunJobNumber',
        config_value: concurrentRunJobNumber,
      },
      {
        config_key: 'SubJobNumberRds',
        config_value: subJobNumberRDS,
      },
    ]);
    alertMsg(t('updateSuccess'), 'success');
    setIpError(false);
    setIpSuccess(false);
    setLoadingUpdate(false);
  };

  const findMinimumAvailableIP = (configs: ConfigSubnet[]) => {
    const minAvailableIP = configs.reduce((min, current) => {
      return min.available_ip_address_count < current.available_ip_address_count
        ? min
        : current;
    }, configs[0]);
    return minAvailableIP.available_ip_address_count;
  };

  const calculateEstimateRestIPs = () => {
    return 3 + parseInt(subJobNumberRDS) * 2;
  };

  const estimateIPs = () => {
    if (calculateEstimateRestIPs() > findMinimumAvailableIP(subnetItems) - 50) {
      setIpSuccess(false);
      setIpError(true);
    } else {
      setIpSuccess(true);
      setIpError(false);
    }
  };

  useEffect(() => {
    getSystemSettingsConfig();
  }, []);

  return (
    <>
      {loadingConfig ? (
        <Form>
          <Container>
            <Spinner />
          </Container>
        </Form>
      ) : (
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="m">
              <Button
                variant="link"
                onClick={() => {
                  navigate(-1);
                }}
              >
                {t('button.cancel')}
              </Button>
              <Button
                variant="primary"
                loading={loadingUpdate}
                onClick={() => {
                  updateSystemSettingsConfig();
                }}
              >
                {t('button.save')}
              </Button>
            </SpaceBetween>
          }
        >
          <Container
            header={
              <Header variant="h2">
                {t('settings.rdsDataSourceDiscovery')}
              </Header>
            }
          >
            <SpaceBetween direction="vertical" size="xl">
              <FormField
                label={t('settings.rdsDetectedConcurrency')}
                description={t('settings.rdsDetectedConcurrencyDesc')}
              >
                <Input
                  value={concurrentRunJobNumber}
                  placeholder="100"
                  onChange={(e) => {
                    setConcurrentRunJobNumber(e.detail.value);
                  }}
                />
              </FormField>

              <FormField
                label={t('settings.rdsSubJobRunNumber')}
                description={t('settings.rdsSubJobRunNumber')}
              >
                <Input
                  value={subJobNumberRDS}
                  placeholder="3"
                  onChange={(e) => {
                    setIpError(false);
                    setIpSuccess(false);
                    setSubJobNumberRDS(e.detail.value);
                  }}
                />
              </FormField>

              <FormField>
                <div className="flex gap-10">
                  {subnetItems.map((item) => {
                    return (
                      <div className="flex-1">
                        <FormField
                          label={item.name}
                          description={
                            t('settings.subnetNameDesc') + ': ' + item.subnet_id
                          }
                        >
                          <Input
                            value={item.available_ip_address_count.toString()}
                            disabled
                          />
                        </FormField>
                      </div>
                    );
                  })}
                </div>
              </FormField>

              <SpaceBetween direction="vertical" size="l">
                <div>{t('settings.subnetDesc')}</div>
                <div>
                  <Button
                    onClick={() => {
                      estimateIPs();
                    }}
                  >
                    {t('button.estimateIP')}
                  </Button>
                  <div className="mt-10">
                    {t('settings.estimateResult', {
                      ipCount: calculateEstimateRestIPs(),
                    })}
                  </div>
                </div>
              </SpaceBetween>
              {ipError && (
                <Alert type="error">{t('settings.estimateError')}</Alert>
              )}
              {ipSuccess && (
                <Alert type="success">{t('settings.estimateSuccess')}</Alert>
              )}
            </SpaceBetween>
          </Container>
        </Form>
      )}
    </>
  );
};

const SystemSetting: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('nav.systemSettings'),
      href: '',
    },
  ];
  return (
    <AppLayout
      content={
        <ContentLayout header={<SettingsHeader />}>
          <SystemSettingContent />
        </ContentLayout>
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.SystemSettings.path} />}
      navigationWidth={290}
    />
  );
};

export default SystemSetting;
