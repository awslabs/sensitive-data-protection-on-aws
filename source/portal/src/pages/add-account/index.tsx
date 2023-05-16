import { AppLayout, Header, Tabs } from '@cloudscape-design/components';
import React from 'react';
import { TAB_LIST } from './types/add_account_type';
import AddAccountInfo from './componments/AddAccountInfo';
import './style.scss';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';

const AddAccountHeader: React.FC = () => {
  return (
    <Header
      variant="h1"
      description="Setup and manage the AWS accounts that you want the platform to discover sensitive data."
    >
      Add AWS accounts
    </Header>
  );
};

const AddAccountContent = () => {
  return (
    <div style={{ background: '#fff', marginTop: 40 }}>
      <Tabs
        tabs={[
          {
            label: TAB_LIST.individual.label,
            id: TAB_LIST.individual.id,
            content: <AddAccountInfo tagType={TAB_LIST.individual.id} />,
          },
          {
            label: TAB_LIST.via.label,
            id: TAB_LIST.via.id,
            content: <AddAccountInfo tagType={TAB_LIST.via.id} />,
          },
        ]}
      />
    </div>
  );
};

const AddAccount: React.FC = () => {
  const { t } = useTranslation();
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
      content={<AddAccountContent />}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.AddAccount.path} />}
      navigationWidth={290}
    />
  );
};

export default AddAccount;
