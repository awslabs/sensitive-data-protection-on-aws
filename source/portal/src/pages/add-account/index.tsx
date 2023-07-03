import { AppLayout, Header, Tabs } from '@cloudscape-design/components';
import React from 'react';
import { TAB_LIST } from './types/add_account_type';
import AddAccountInfo from './componments/AddAccountInfo';
import './style.scss';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import HelpInfo from 'common/HelpInfo';
import { buildDocLink } from 'ts/common';

const AddAccountHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Header variant="h1" description={t('account:add.addAWSAccountDesc')}>
      {t('account:add.addAWSAccount')}
    </Header>
  );
};

const AddAccountContent = () => {
  const { t } = useTranslation();
  return (
    <div style={{ background: '#fff', marginTop: 40 }}>
      <Tabs
        tabs={[
          {
            label: t(TAB_LIST.individual.label),
            id: TAB_LIST.individual.id,
            content: <AddAccountInfo tagType={TAB_LIST.individual.id} />,
          },
          {
            label: t(TAB_LIST.via.label),
            id: TAB_LIST.via.id,
            content: <AddAccountInfo tagType={TAB_LIST.via.id} />,
          },
        ]}
      />
    </div>
  );
};

const AddAccount: React.FC = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.awsAccount'),
      href: RouterEnum.AccountManagement.path,
    },
  ];
  return (
    <AppLayout
      contentHeader={<AddAccountHeader />}
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
      content={<AddAccountContent />}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.AddAccount.path} />}
      navigationWidth={290}
    />
  );
};

export default AddAccount;
