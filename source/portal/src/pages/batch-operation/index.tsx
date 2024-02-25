import {
  AppLayout,
  Box,
  Button,
  Container,
  ContentLayout,
  FileUpload,
  Flashbar,
  FlashbarProps,
  FormField,
  Header,
  Modal,
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
import { AMPLIFY_CONFIG_JSON, BATCH_SOURCE_ID, buildDocLink } from 'ts/common';
import axios from 'axios';
import { BASE_URL } from 'tools/apiRequest';
import { downloadBatchFiles, queryBatchStatus } from 'apis/data-source/api';
import { alertMsg } from 'tools/tools';
import { User } from 'oidc-client-ts';
import { AmplifyConfigType } from 'ts/types';

enum BatchOperationStatus {
  NotStarted = 'NotStarted',
  Inprogress = 'Inprogress',
  Completed = 'Completed',
  Error = 'Error',
}
interface BatchOperationContentProps {
  updateStatus: (
    status: BatchOperationStatus,
    success?: number,
    warning?: number,
    failed?: number
  ) => void;
}

const startDownload = (url: string) => {
  const link = document.createElement('a');
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

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
  const [loadingDownload, setLoadingDownload] = useState(false);

  const queryStatus = async (fileId: string) => {
    try {
      const status: any = await queryBatchStatus({
        batch: fileId,
      });

      // 0: Inprogress
      // data {success: 0, failed: 1, warning: 2}a
      if (status?.success > 0 || status?.warning > 0 || status?.failed > 0) {
        clearInterval(statusInterval);
        if (status.failed > 0) {
          updateStatus(
            BatchOperationStatus.Error,
            status.success,
            status.warning,
            status.failed
          );
        } else {
          updateStatus(
            BatchOperationStatus.Completed,
            status.success,
            status.warning,
            status.failed
          );
        }
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
    if (file && file.length > 0) {
      if (file[0].name.endsWith('.xlsx') === true) {
        setErrors([]);
        setUploadDisabled(false);
      } else {
        setErrors([t('datasource:batch.fileExtensionError')]);
        setUploadDisabled(true);
      }
    }
    setFiles(file);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('files', files[0]);
    setLoadingUpload(true);
    try {
      const configJSONObj: AmplifyConfigType = localStorage.getItem(
        AMPLIFY_CONFIG_JSON
      )
        ? JSON.parse(localStorage.getItem(AMPLIFY_CONFIG_JSON) || '')
        : {};
      const token =
        process.env.REACT_APP_ENV === 'local' ||
        process.env.REACT_APP_ENV === 'development'
          ? ''
          : User.fromStorageString(
              localStorage.getItem(
                `oidc.user:${configJSONObj.aws_oidc_issuer}:${configJSONObj.aws_oidc_client_id}`
              ) || ''
            )?.id_token;
      const response = await axios.post(
        `${BASE_URL}/data-source/batch-create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: token ? `Bearer ${token}` : undefined,
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
    setLoadingDownload(true);
    const fileName = `template-${i18n.language}`;
    if (fileName) {
      const url: any = await downloadBatchFiles({
        filename: fileName,
      });
      setLoadingDownload(false);
      startDownload(url);
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
            loading={loadingDownload}
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
          <FormField label={t('datasource:batch.uploadTitle')}>
            <FileUpload
              onChange={({ detail }) => {
                changeFile(detail.value);
              }}
              value={files}
              i18nStrings={{
                uploadButtonText: (e) =>
                  e
                    ? t('datasource:batch.chooseFiles')
                    : t('datasource:batch.chooseFile'),
                dropzoneText: (e) =>
                  e
                    ? t('datasource:batch.dropFilesUpload')
                    : t('datasource:batch.dropFileUpload'),
                removeFileAriaLabel: (e) =>
                  `${t('datasource:batch.removeFile')} ${e + 1}`,
                limitShowFewer: t('datasource:batch.showFewer'),
                limitShowMore: t('datasource:batch.showMore'),
                errorIconAriaLabel: t('datasource:batch.error'),
              }}
              invalid
              fileErrors={errors}
              accept=".xlsx"
              showFileLastModified
              showFileSize
              showFileThumbnail
              tokenLimit={1}
              constraintText={t('datasource:batch.only')}
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

  const [successCount, setSuccessCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [status, setStatus] = useState(BatchOperationStatus.NotStarted);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const downloadReport = async () => {
    console.log('download report');
    setLoadingDownload(true);
    const fileName = localStorage.getItem(BATCH_SOURCE_ID);
    if (fileName) {
      const url: any = await downloadBatchFiles({
        filename: fileName,
      });
      setLoadingDownload(false);
      startDownload(url);
    }
  };

  const confirmDismissNotification = () => {
    localStorage.removeItem(BATCH_SOURCE_ID);
    setFlashBar([]);
    setShowConfirm(false);
  };

  const onDismissNotification = () => {
    setShowConfirm(true);
  };

  useEffect(() => {
    if (status === BatchOperationStatus.Completed) {
      setFlashBar([
        {
          header: t('datasource:batch.successTitle'),
          type: 'success',
          dismissible: true,
          content: t('datasource:batch.successDesc', {
            successCount: successCount,
            warningCount: warningCount,
          }),
          id: 'success',
          action: (
            <Button onClick={downloadReport} loading={loadingDownload}>
              {t('button.downloadReport')}
            </Button>
          ),
          onDismiss: () => {
            onDismissNotification();
          },
        },
      ]);
    }
    if (status === BatchOperationStatus.Error) {
      setFlashBar([
        {
          header: t('datasource:batch.failedTitle'),
          type: 'error',
          dismissible: true,
          content: t('datasource:batch.failedDesc', {
            successCount: successCount,
            warningCount: warningCount,
            failedCount: failedCount,
          }),
          id: 'error',
          action: (
            <Button onClick={downloadReport} loading={loadingDownload}>
              {t('button.downloadReport')}
            </Button>
          ),
          onDismiss: () => {
            onDismissNotification();
          },
        },
      ]);
    }
    if (status === BatchOperationStatus.Inprogress) {
      setFlashBar([
        {
          loading: true,
          header: t('datasource:batch.inProgress'),
          type: 'info',
          dismissible: false,
          content: t('datasource:batch.inProgressDesc'),
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
                content: (
                  <BatchOperationContent
                    updateStatus={(
                      status,
                      successCount,
                      warningCount,
                      failedCount
                    ) => {
                      setStatus(status);
                      setSuccessCount(successCount ?? 0);
                      setWarningCount(warningCount ?? 0);
                      setFailedCount(failedCount ?? 0);
                    }}
                  />
                ),
              },
            ]}
          />
          <Modal
            onDismiss={() => setShowConfirm(false)}
            visible={showConfirm}
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="link"
                    onClick={() => {
                      setShowConfirm(false);
                    }}
                  >
                    {t('button.cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      confirmDismissNotification();
                    }}
                  >
                    {t('confirm')}
                  </Button>
                </SpaceBetween>
              </Box>
            }
            header={t('confirm')}
          >
            {t('datasource:batch.dismissAlert')}
          </Modal>
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
