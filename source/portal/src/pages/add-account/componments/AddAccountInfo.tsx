import {
  Container,
  Header,
  Icon,
  Button,
  SpaceBetween,
  FormField,
  Input,
} from '@cloudscape-design/components';
import React, { memo, useState } from 'react';
import {
  ADMIN_TEMPLATE_URL,
  ADMIN_TEMPLATE_URL_GLOBAL,
  AGENT_TEMPLATE_URL,
  AGENT_TEMPLATE_URL_GLOBAL,
  IT_TEMPLATE_URL,
  IT_TEMPLATE_URL_GLOBAL,
  TAB_LIST,
} from '../types/add_account_type';
import { useNavigate } from 'react-router-dom';
import { alertMsg } from 'tools/tools';
import { addAccount, addOrgAccount } from 'apis/account-manager/api';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';

const AddAccountInfo: React.FC<any> = memo((props: any) => {
  const { tagType } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [inputAccount, setInputAccount] = useState('');
  const [inputOrgAccount, setInputOrgAccount] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const backNavigate = () => {
    navigate(-1);
  };

  const clkDownload = async () => {
    await navigator.clipboard.writeText(ADMIN_TEMPLATE_URL);
    alertMsg(t('copied'), 'success');
  };

  const clkDownloadGlobal = async () => {
    await navigator.clipboard.writeText(ADMIN_TEMPLATE_URL_GLOBAL);
    alertMsg(t('copied'), 'success');
  };

  const clkAgentDownload = async () => {
    await navigator.clipboard.writeText(AGENT_TEMPLATE_URL);
    alertMsg(t('copied'), 'success');
  };

  const clkAgentDownloadGlobal = async () => {
    await navigator.clipboard.writeText(AGENT_TEMPLATE_URL_GLOBAL);
    alertMsg(t('copied'), 'success');
  };

  const clkItDownload = async () => {
    await navigator.clipboard.writeText(IT_TEMPLATE_URL);
    alertMsg(t('copied'), 'success');
  };

  const clkItDownloadGlobal = async () => {
    await navigator.clipboard.writeText(IT_TEMPLATE_URL_GLOBAL);
    alertMsg(t('copied'), 'success');
  };

  const addAwsAccount = async () => {
    if (!inputAccount) {
      alertMsg(t('account:inputAccountId'), 'error');
      return;
    }
    setIsLoading(true);
    try {
      // account_provider: int
      // account_id: str
      // region: str
      await addAccount({
        account_provider: 1, 
        account_id: inputAccount,
        region: ""
       });
      setIsLoading(false);
      alertMsg(t('account:addSuccess'), 'success');
      setInputAccount('');
      navigate(RouterEnum.AccountManagement.path);
    } catch {
      setIsLoading(false);
    }
  };

  const addAwsOrgAccount = async () => {
    if (!inputOrgAccount) {
      alertMsg(t('account:inputAccountId'), 'error');
      return;
    }
    setIsLoading(true);
    try {
      await addOrgAccount({
        organization_management_account_id: inputOrgAccount,
      });
      setIsLoading(false);
      alertMsg(t('account:addSuccess'), 'success');
      setInputOrgAccount('');
      navigate(RouterEnum.AccountManagement.path);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <SpaceBetween direction="vertical" size="xl">
      {tagType === TAB_LIST.via.id && (
        <>
          <Container
            header={
              <Header
                variant="h2"
                description={<b>{t('account:add.org.stepDesc')}</b>}
              >
                {t('account:add.org.step1')}
              </Header>
            }
          >
            <ul>
              <li>{t('account:add.org.step1list1')}</li>
              <li>{t('account:add.org.step1list2')}</li>
              <li>{t('account:add.org.step1list3')}</li>
              <li>{t('account:add.org.step1list4')}</li>
            </ul>
            <span>
                {t('account:add.org.step1check')}
              </span>
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                description={<b>{t('account:add.org.step2Desc')}</b>}
              >
                {t('account:add.org.step2')}
              </Header>
            }
          >
            <div className="pointer-icon" onClick={clkItDownload}>
              <Icon name="copy" />
              &nbsp;&nbsp;
              <span>
                {t('account:add.org.step1Copy')} ({t('account:forChina')})
              </span>
            </div>
            <div className="pointer-icon" onClick={clkItDownloadGlobal}>
              <Icon name="copy" />
              &nbsp;&nbsp;
              <span>
                {t('account:add.org.step1Copy')} ({t('account:forGlobal')})
              </span>
            </div>
            <ul>
              <li>{t('account:add.org.step2list1')}</li>
              <li>{t('account:add.org.step2list2')}</li>

              <li>
                {t('account:add.org.step2list3_1')}{' '}
                <b>{t('account:add.org.step2list3_2')}</b>{' '}
                {t('account:add.org.step2list3_3')}
                <b>{t('account:add.org.step2list3_4')}</b>.
              </li>
              <li>
                {t('account:add.org.step2list4_1')}
              </li>

              <li>{t('account:add.org.step2list5')}</li>
              <li>
                {t('account:add.org.step2list6_1')}
                <b>{t('account:add.org.step2list6_2')}</b>
                {t('account:add.org.step2list6_3')}
              </li>
            </ul>
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                description={<b>{t('account:add.org.step2DescStep3')}</b>}
              >
                {t('account:add.org.step3')}
              </Header>
            }
          >
            <div className="pointer-icon" onClick={clkAgentDownload}>
              <Icon name="copy" />
              &nbsp;&nbsp;
              <span>
                {t('account:add.org.step3Copy')} ({t('account:forChina')})
              </span>
            </div>

            <div className="pointer-icon" onClick={clkAgentDownloadGlobal}>
              <Icon name="copy" />
              &nbsp;&nbsp;
              <span>
                {t('account:add.org.step3Copy')} ({t('account:forGlobal')})
              </span>
            </div>
          </Container>
          <Container
            header={<Header variant="h2">{t('account:add.org.step5')}</Header>}
          >
            <FormField label="AWS account id">
              <Input
                value={inputOrgAccount}
                placeholder="AWS account id"
                onChange={(e) => setInputOrgAccount(e.detail.value)}
              />
            </FormField>
          </Container>
        </>
      )}
      {tagType === TAB_LIST.individual.id && (
        <>
          <Container
            header={
              <Header
                variant="h2"
                description={<b>{t('account:add.account.step1Desc')}</b>}
              >
                {t('account:add.account.step1')}
              </Header>
            }
          >
            <div className="pointer-icon" onClick={clkAgentDownload}>
              <Icon name="copy" />
              &nbsp;&nbsp;
              <span>
                {t('account:add.account.step1Copy')} ({t('account:forChina')})
              </span>
            </div>
            <div className="pointer-icon" onClick={clkAgentDownloadGlobal}>
              <Icon name="copy" />
              &nbsp;&nbsp;
              <span>
                {t('account:add.account.step1Copy')} ({t('account:forGlobal')})
              </span>
            </div>
          </Container>
          <Container
            header={
              <Header
                variant="h2"
                description={<b>{t('account:add.account.step2Desc')}</b>}
              >
                {t('account:add.account.step2')}
              </Header>
            }
          >
            <ul>
              <li>{t('account:add.account.step2list1')}</li>
              <li>
                {t('account:add.account.step2list2_1')}{' '}
                <b>{t('account:add.account.step2list2_2')}</b>
                {t('account:add.account.step2list2_3')}
                <b>{t('account:add.account.step2list2_4')}</b>
                {t('account:add.account.step2list2_5')}
                <b>{t('account:add.account.step2list2_6')}</b>.
              </li>

              <li>
                {t('account:add.account.step2list3_1')}
                <b>{t('account:add.account.step2list3_2')}</b>
                {t('account:add.account.step2list3_3')}
              </li>
              <li>{t('account:add.account.step2list4')}</li>

              <li>{t('account:add.account.step2list5')}</li>
            </ul>
          </Container>
          <Container
            header={
              <Header variant="h2">{t('account:add.account.step3')}</Header>
            }
          >
            <FormField label={t('account:add.account.awsAccountId')}>
              <Input
                value={inputAccount}
                placeholder={t('account:add.account.awsAccountId') || ''}
                onChange={(e) => setInputAccount(e.detail.value)}
              />
            </FormField>
          </Container>
        </>
      )}
      <div className="account-back-btn">
        <Button onClick={backNavigate} loading={isLoading}>
          {t('button.back')}
        </Button>
        {tagType === TAB_LIST.individual.id && (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              onClick={addAwsAccount}
              loading={isLoading}
              disabled={!inputAccount}
            >
              {t('button.addThisAccount')}
            </Button>
          </>
        )}
        {tagType === TAB_LIST.via.id && (
          <>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              onClick={addAwsOrgAccount}
              loading={isLoading}
              disabled={!inputOrgAccount}
            >
              {t('button.addOrgMember')}
            </Button>
          </>
        )}
      </div>
    </SpaceBetween>
  );
});

export default AddAccountInfo;
