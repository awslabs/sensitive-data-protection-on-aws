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
import { deleteDSReport, downloadDataSourceBatchFiles, queryBatchStatus } from 'apis/data-source/api';
import { deleteIdentifierReport, downloadIdentifierBatchFiles, queryIdentifierBatchStatus } from 'apis/data-template/api';
import { alertMsg } from 'tools/tools';
import { User } from 'oidc-client-ts';
import { AmplifyConfigType } from 'ts/types';
import { useParams } from 'react-router-dom';
import { TFunction } from 'i18next';

enum BatchOperationStatus {
  NotStarted = 'NotStarted',
  Inprogress = 'Inprogress',
  Completed = 'Completed',
  Error = 'Error',
}
interface BatchOperationContentProps {
  type: string,
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

const genTypeDesc = (type: string|undefined, t: TFunction) => {
  if(type === "identifier"){
    return t('common:batch.nameDescIdentifier')
  }  
  return t('common:batch.nameDescDataSource')
}


const AddBatchOperationHeader: React.FC<any> = (props:any) => {
  const { t } = useTranslation();
  const { type } = props
  return (
    <Header variant="h1" description={genTypeDesc(type, t)}>
      {t('common:batch.name')}
    </Header>
  );
};
let statusInterval: any;

const BatchOperationContent: React.FC<BatchOperationContentProps> = (
  props: BatchOperationContentProps
) => {
  const { t, i18n } = useTranslation();
  const { updateStatus,type } = props;
  const [uploadDisabled, setUploadDisabled] = useState(false);
  const [files, setFiles] = useState([] as any);
  const [errors, setErrors] = useState([] as any);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);

  const queryStatus = async (fileId: string, type:string) => {

    try {
      let status:any
      if(type==="identifier"){
        status = await queryIdentifierBatchStatus({
          batch: fileId,
        });
      } else {
        status = await queryBatchStatus({
          batch: fileId,
        });
      }
      // 0: Inprogress
      // data {success: 0, failed: 1, warning: 2}a
      if (status?.success > 0 || status?.warning > 0 || status?.failed > 0) {
        clearInterval(statusInterval);
        if (status.failed > 0 || status.warning > 0) {
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
        setErrors([t('common:batch.fileExtensionError')]);
        setUploadDisabled(true);
      }
    }
    setFiles(file);
  };

  const handleUpload = async (type:string) => {
    const formData = new FormData();
    let questDomain = 'data-source/batch-create';
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
      if(type==="identifier"){
        questDomain="template/batch-create"
      }
      const response = await axios.post(
        `${BASE_URL}/${questDomain}`,
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
          queryStatus(fileId, type);
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

  const downloadTemplate = async (type:string) => {
    console.log('download template');
    setLoadingDownload(true);
    let url:any
    if(type==="identifier"){
      url = await downloadIdentifierBatchFiles({
        filename: `identifier-template-${i18n.language}`,
      });
    } else {
      url = await downloadDataSourceBatchFiles({
        filename: `template-${i18n.language}`,
      });
    }
    setLoadingDownload(false);
    startDownload(url);
  };

  useEffect(() => {
    const fileId = localStorage.getItem(BATCH_SOURCE_ID);
    if (fileId) {
      queryStatus(fileId, type);
      statusInterval = setInterval(() => {
        queryStatus(fileId, type);
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
          <Header variant="h2" description={t('common:batch.step1Desc')}>
            {t('common:batch.step1Title')}
          </Header>
        }
      >
        <p className="flex gap-5">
          {/* <Icon name="download" /> */}
          <Button
            iconName="download"
            onClick={() => {
              downloadTemplate(type);
              
            }}
            variant="link"
            loading={loadingDownload}
          >
            {t('common:batch.step1Download')}
          </Button>
        </p>
      </Container>
      <Container
        header={
          <Header variant="h2" description={t('common:batch.step2Desc')}>
            {t('common:batch.step2Title')}
          </Header>
        }
      >
        <ul>
          <li>{t('common:batch.step2Tips1')}</li>
        </ul>
      </Container>
      <Container
        header={
          <Header variant="h2">{t('common:batch.step3Title')}</Header>
        }
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField label={t('common:batch.uploadTitle')}>
            <FileUpload
              onChange={({ detail }) => {
                changeFile(detail.value);
              }}
              value={files}
              i18nStrings={{
                uploadButtonText: (e) =>
                  e
                    ? t('common:batch.chooseFiles')
                    : t('common:batch.chooseFile'),
                dropzoneText: (e) =>
                  e
                    ? t('common:batch.dropFilesUpload')
                    : t('common:batch.dropFileUpload'),
                removeFileAriaLabel: (e) =>
                  `${t('common:batch.removeFile')} ${e + 1}`,
                limitShowFewer: t('common:batch.showFewer'),
                limitShowMore: t('common:batch.showMore'),
                errorIconAriaLabel: t('common:batch.error'),
              }}
              invalid
              fileErrors={errors}
              accept=".xlsx"
              showFileLastModified
              showFileSize
              showFileThumbnail
              tokenLimit={1}
              constraintText={t('common:batch.only')}
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
            onClick={()=>handleUpload(type)}
          >
            {t('button.upload')}
          </Button>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
};

const genBreadcrumbItem = (type: string|undefined, t: TFunction) => {
  if(type === "identifier"){
    return  {
      text: t('breadcrumb.manageIdentifier'),
      href: RouterEnum.TemplateIdentifiers.path,
    }
  }
  return  {
    text: t('breadcrumb.dataSourceConnection'),
    href: RouterEnum.DataSourceConnection.path,
  }
}


const BatchOperation: React.FC = () => {
  const {type}: any = useParams();
  const { t, i18n } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    genBreadcrumbItem(type, t),
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

  useEffect(()=>{
    console.log("clear flash")
  },[flashBar])

  const downloadReport = async (type: string) => {
    console.log('download report');
    setLoadingDownload(true);
    const fileName = localStorage.getItem(BATCH_SOURCE_ID);
    let url:any;
    if (fileName) {
      if(type==="identifier"){
        url = await downloadIdentifierBatchFiles({
          filename: fileName,
        });
      } else {
        url = await downloadDataSourceBatchFiles({
          filename: fileName,
        });
      }
      setLoadingDownload(false);
      startDownload(url);
    }
    setTimeout(() => {
      if(type==="identifier"){
        deleteIdentifierReport({key: localStorage.getItem(BATCH_SOURCE_ID)});
        localStorage.removeItem(BATCH_SOURCE_ID);
      } else {
        deleteDSReport({key: localStorage.getItem(BATCH_SOURCE_ID)});
        localStorage.removeItem(BATCH_SOURCE_ID);
      }
      setFlashBar([]);
    }, 2000);
  };

  const confirmDismissNotification = (type:string) => {
    if(type==="identifier"){
      deleteIdentifierReport({key: localStorage.getItem(BATCH_SOURCE_ID)})
      localStorage.removeItem(BATCH_SOURCE_ID);
    } else {
      deleteDSReport({key: localStorage.getItem(BATCH_SOURCE_ID)})
      localStorage.removeItem(BATCH_SOURCE_ID);
    }
    setFlashBar([]);
    setShowConfirm(false);
  };

  const genTabName = (type:string, t:TFunction) => {
    if(type==="identifier"){
      return t('common:batch.tabIdentifier')
    }
    return t('common:batch.tabDataSource')
  }

  const onDismissNotification = () => {
    setShowConfirm(true);
  };

  useEffect(() => {
    if (status === BatchOperationStatus.Completed) {
      setFlashBar([
        {
          header: t('common:batch.successTitle'),
          type: 'success',
          dismissible: true,
          content: t('common:batch.successDesc', {
            successCount: successCount,
            warningCount: warningCount,
          }),
          id: 'success',
          action: (
            <Button onClick={()=>downloadReport(type)} loading={loadingDownload}>
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
          header: t('common:batch.failedTitle'),
          type: 'error',
          dismissible: true,
          content: t('common:batch.failedDesc', {
            successCount: successCount,
            warningCount: warningCount,
            failedCount: failedCount,
          }),
          id: 'error',
          action: (
            <Button onClick={()=>downloadReport(type)} loading={loadingDownload}>
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
          header: t('common:batch.inProgress'),
          type: 'info',
          dismissible: false,
          content: type==="identifier"?t('common:batch.inProgressIdentifierDesc'):t('common:batch.inProgressDesc'),
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
        <ContentLayout disableOverlap header={<AddBatchOperationHeader type={type}/>}>
          <Tabs
            tabs={[
              {
                label: genTabName(type, t),
                id: 'title',
                content: (
                  <BatchOperationContent
                    type={type}
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
                      confirmDismissNotification(type);
                    }}
                  >
                    {t('confirm')}
                  </Button>
                </SpaceBetween>
              </Box>
            }
            header={t('confirm')}
          >
            {t('common:batch.dismissAlert')}
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
