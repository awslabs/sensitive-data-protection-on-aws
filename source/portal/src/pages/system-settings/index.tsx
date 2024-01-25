import {
  AppLayout,
  Button,
  Container,
  ContentLayout,
  Form,
  FormField,
  Header,
  Input,
  SpaceBetween,
} from '@cloudscape-design/components';
import React from 'react';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const SettingsHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Header variant="h1" description={t('settings.desc')}>
      {t('settings.title')}
    </Header>
  );
};

const SystemSettingContent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
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
          <Button variant="primary">{t('button.save')}</Button>
        </SpaceBetween>
      }
    >
      <Container
        header={
          <Header variant="h2">{t('settings.rdsDataSourceDiscovery')}</Header>
        }
      >
        <SpaceBetween direction="vertical" size="xl">
          <FormField
            label={t('settings.rdsDetectedConcurrency')}
            description={t('settings.rdsDetectedConcurrencyDesc')}
          >
            <Input value="" placeholder="100" />
          </FormField>

          <FormField
            label={t('settings.rdsSubJobRunNumber')}
            description={t('settings.rdsSubJobRunNumber')}
          >
            <Input value="" placeholder="3" />
          </FormField>

          <FormField>
            <div className="flex gap-10">
              <div className="flex-1">
                <FormField
                  label={t('settings.subnet') + '1'}
                  description={t('settings.subnetNameDesc')}
                >
                  <Input value="100" disabled />
                </FormField>
              </div>
              <div className="flex-1">
                <FormField
                  label={t('settings.subnet') + '2'}
                  description={t('settings.subnetNameDesc')}
                >
                  <Input value="122" disabled />
                </FormField>
              </div>
            </div>
          </FormField>

          <SpaceBetween direction="vertical" size="l">
            <div>{t('settings.subnetDesc')}</div>
            <div>
              <Button>{t('button.estimateIP')}</Button>
              <div className="mt-10">
                {t('settings.estimateResult', {
                  ipCount: 100,
                })}
              </div>
            </div>
          </SpaceBetween>
        </SpaceBetween>
      </Container>
    </Form>
  );
};

const SystemSetting: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.dataSourceConnection'),
      href: RouterEnum.DataSourceConnection.path,
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
