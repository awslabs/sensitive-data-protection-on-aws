import {
  AppLayout,
  Button,
  Container,
  ContentLayout,
  FileUpload,
  Flashbar,
  FlashbarProps,
  FormField,
  Header,
  Icon,
  ProgressBar,
  SpaceBetween,
  StatusIndicator,
  Tabs,
} from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import HelpInfo from 'common/HelpInfo';
import { BATCH_SOURCE_ID, buildDocLink } from 'ts/common';
import axios from 'axios';
import { BASE_URL } from 'tools/apiRequest';
import { downloadBatchFiles, queryBatchStatus } from 'apis/data-source/api';
import { alertMsg } from 'tools/tools';

enum BatchOperationStatus {
  NotStarted = 'NotStarted',
  Inprogress = 'Inprogress',
  Completed = 'Completed',
  Error = 'Error',
}
interface BatchOperationContentProps {
  updateStatus: (status: BatchOperationStatus) => void;
}

const AddAccountHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Header variant="h1" description={t('datasource:batch.nameDesc')}>
      {t('datasource:batch.name')}
    </Header>
  );
};
let statusInterval: any;

const BatchOperationContent: React.FC<BatchOperationContentProps> = (
  props: BatchOperationContentProps
) => {
  const { t, i18n } = useTranslation();
  const { updateStatus } = props;
  const [uploadDisabled, setUploadDisabled] = useState(false);
  const [files, setFiles] = useState([] as any);
  const [errors, setErrors] = useState([] as any);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const queryStatus = async (fileId: string) => {
    try {
      const response: any = await queryBatchStatus({
        batch: fileId,
      });
      const status = response.data; // 0: Inprogress, 1: Error, 2: Completed
      if (status === 1 || status === 2) {
        clearInterval(statusInterval);
      }
      if (status === 1) {
        updateStatus(BatchOperationStatus.Error);
      } else if (status === 2) {
        updateStatus(BatchOperationStatus.Completed);
      } else {
        updateStatus(BatchOperationStatus.Inprogress);
      }
    } catch (error) {
      console.error('error:', error);
      clearInterval(statusInterval);
    }
  };

  const changeFile = (file: any) => {
    setUploadProgress(0);
    if (file[0].name.endsWith('.xlsx') === true) {
      setErrors([]);
      setUploadDisabled(false);
    } else {
      setErrors(['Uploaded file must have an xlsx extension.']);
      setUploadDisabled(true);
    }
    setFiles(file);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('files', files[0]);
    setLoadingUpload(true);
    try {
      const response = await axios.post(
        `${BASE_URL}data-source/batch-create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent: any) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.info('percentCompleted:', percentCompleted);
            setUploadProgress(percentCompleted);
            setFiles([]);
          },
        }
      );
      console.log(response.data);
      setLoadingUpload(false);
      if (response.data.status === 'success') {
        const fileId = response.data.data;
        localStorage.setItem(BATCH_SOURCE_ID, fileId);
        updateStatus(BatchOperationStatus.Inprogress);
        statusInterval = setInterval(() => {
          queryStatus(fileId);
        }, 5000);
      } else {
        setUploadProgress(0);
        alertMsg(response.data.message ?? '', 'error');
      }
    } catch (error) {
      setLoadingUpload(false);
      console.error(error);
    }
  };

  const downloadReport = async () => {
    console.log('download template');
    const fileName = `template-${i18n.language}`;
    if (fileName) {
      const response: any = await downloadBatchFiles({
        filename: fileName,
      });
      window.open(response.data);
    }
  };

  useEffect(() => {
    const fileId = localStorage.getItem(BATCH_SOURCE_ID);
    if (fileId) {
      queryStatus(fileId);
      statusInterval = setInterval(() => {
        queryStatus(fileId);
      }, 5000);
    }
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <SpaceBetween direction="vertical" size="xl">
      <Container
        header={
          <Header variant="h2" description={t('datasource:batch.step1Desc')}>
            {t('datasource:batch.step1Title')}
          </Header>
        }
      >
        <p className="flex gap-5">
          {/* <Icon name="download" /> */}
          <Button
            iconName="download"
            onClick={() => {
              downloadReport();
            }}
            variant="link"
            download
          >
            {t('datasource:batch.step1Download')}
          </Button>
        </p>
      </Container>
      <Container
        header={
          <Header variant="h2" description={t('datasource:batch.step2Desc')}>
            {t('datasource:batch.step2Title')}
          </Header>
        }
      >
        <ul>
          <li>{t('datasource:batch.step2Tips1')}</li>
        </ul>
      </Container>
      <Container
        header={
          <Header variant="h2">{t('datasource:batch.step3Title')}</Header>
        }
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField
            label={t('datasource:batch.uploadTitle')}
            description="Description"
          >
            <FileUpload
              onChange={({ detail }) => {
                changeFile(detail.value);
              }}
              value={files}
              i18nStrings={{
                uploadButtonText: (e) => (e ? 'Choose files' : 'Choose file'),
                dropzoneText: (e) =>
                  e ? 'Drop files to upload' : 'Drop file to upload',
                removeFileAriaLabel: (e) => `Remove file ${e + 1}`,
                limitShowFewer: 'Show fewer files',
                limitShowMore: 'Show more files',
                errorIconAriaLabel: 'Error',
              }}
              invalid
              fileErrors={errors}
              accept=".xlsx"
              showFileLastModified
              showFileSize
              showFileThumbnail
              tokenLimit={1}
              constraintText=".xlsx files only"
            />
          </FormField>
          {uploadProgress > 0 && (
            <FormField>
              <ProgressBar value={uploadProgress} label="" />
              {uploadProgress >= 100 && (
                <StatusIndicator>{t('uploadSuccess')}</StatusIndicator>
              )}
            </FormField>
          )}
          <Button
            variant="primary"
            loading={loadingUpload}
            disabled={uploadDisabled || files.length <= 0 || loadingUpload}
            onClick={handleUpload}
          >
            {t('button.upload')}
          </Button>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
};

const BatchOperation: React.FC = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.dataSourceConnection'),
      href: RouterEnum.DataSourceConnection.path,
    },
  ];
  const [flashBar, setFlashBar] = useState<FlashbarProps.MessageDefinition[]>(
    []
  );

  const [status, setStatus] = useState(BatchOperationStatus.NotStarted);

  const downloadReport = async () => {
    console.log('download report');
    const fileName = localStorage.getItem(BATCH_SOURCE_ID);
    if (fileName) {
      const response: any = await downloadBatchFiles({
        // filename: 'batch_1705900337.8425026',
        filename: fileName,
      });
      console.info('response:', response);
      window.open(response.data);
    }
  };

  useEffect(() => {
    if (status === BatchOperationStatus.Completed) {
      setFlashBar([
        {
          header: 'Successfully create data sources',
          type: 'success',
          dismissible: true,
          content: 'Please download the report and check the result.',
          id: 'success',
          action: (
            <Button onClick={downloadReport}>
              {t('button.downloadReport')}
            </Button>
          ),
          onDismiss: () => {
            setFlashBar([]);
          },
        },
      ]);
    }
    if (status === BatchOperationStatus.Error) {
      setFlashBar([
        {
          header: 'Failed create data sources in batch',
          type: 'error',
          dismissible: true,
          content:
            'Please download the report and fix the data to upload again to retry.',
          id: 'error',
          action: (
            <Button onClick={downloadReport}>
              {t('button.downloadReport')}
            </Button>
          ),
          onDismiss: () => {
            setFlashBar([]);
          },
        },
      ]);
    }
    if (status === BatchOperationStatus.Inprogress) {
      setFlashBar([
        {
          loading: true,
          header: 'In progress',
          type: 'info',
          dismissible: false,
          content:
            'Creating databases, Please do not close this window. It will takes less than 15 minutes.',
          id: 'info',
        },
      ]);
    }
  }, [status]);

  return (
    <AppLayout
      notifications={<Flashbar items={flashBar} />}
      tools={
        <HelpInfo
          title={t('breadcrumb.awsAccount')}
          description={t('info:account.desc')}
          linkItems={[
            {
              text: t('info:account.manualAdd'),
              href: buildDocLink(i18n.language, '/user-guide/data-source/'),
            },
            {
              text: t('info:account.batchAdd'),
              href: buildDocLink(
                i18n.language,
                '/user-guide/appendix-organization/'
              ),
            },
          ]}
        />
      }
      content={
        <ContentLayout disableOverlap header={<AddAccountHeader />}>
          <Tabs
            tabs={[
              {
                label: t('datasource:batch.tab'),
                id: 'title',
                content: <BatchOperationContent updateStatus={setStatus} />,
              },
            ]}
          />
        </ContentLayout>
      }
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.AddAccount.path} />}
      navigationWidth={290}
    />
  );
};

export default BatchOperation;
