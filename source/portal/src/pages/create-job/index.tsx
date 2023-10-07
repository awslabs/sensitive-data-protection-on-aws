import React, { useState } from 'react';
import './style.scss';
import {
  Button,
  Header,
  Wizard,
  AppLayout,
  Link,
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

  return (
    <div>
      <Wizard
        i18nStrings={{
          stepNumberLabel: (stepNumber) => `${t('step.step')} ${stepNumber}`,
          collapsedStepsLabel: (stepNumber, stepsCount) =>
            `${t('step.step')} ${stepNumber} ${t('step.of')} ${stepsCount}`,
          skipToButtonLabel: (step, stepNumber) =>
            `${t('step.skipTo')} ${step.title}`,
          navigationAriaLabel: t('step.steps') || '',
          cancelButton: t('button.cancel') || '',
          previousButton: t('button.previous') || '',
          nextButton: t('button.next') || '',
          submitButton: t('button.runAJob') || '',
          optional: t('optional') || '',
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
            content: <SelectProvider />,
          },
          {
            title: 'Select existing data catalogs',
            content: (
              <>
                <SelectS3Catalog />
              </>
            ),
          },
          {
            title: 'Job settings',
            content: (
              <>
                <JobSettings />
              </>
            ),
          },
          {
            title: 'Advanced settings: Exclude keywords',
            content: (
              <>
                <AdvancedSettings />
              </>
            ),
          },
          {
            title: 'Job preview',
            content: <JobPreview />,
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
      contentHeader={<CreateJobHeader />}
      content={<CreateJobContent />}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.CreateJob.path} />}
      navigationWidth={290}
    />
  );
};

export default CreateJob;
