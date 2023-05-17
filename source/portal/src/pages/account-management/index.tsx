import React, { useEffect, useState } from 'react';
import './style.scss';
import TopDataCoverage from 'pages/top-data-coverage';
import AccountList from './componments/AccountList';
import { getSourceCoverage } from 'apis/data-source/api';
import {
  AppLayout,
  Grid,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { getAccountInfomation } from 'apis/dashboard/api';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';

const AccountManagementHeader: React.FC = () => {
  return (
    <Header
      variant="h1"
      description="Onboard AWS accounts to this platform. Connect/disconnect to the data source to create/remove data catalogs."
    >
      Connect to data source
    </Header>
  );
};

const AccountManagementContent: React.FC = () => {
  const [coverageData, setCoverageData] = useState({
    rds_connected: 0,
    rds_total: 0,
    s3_connected: 0,
    s3_total: 0,
  });
  const [totalAccount, setTotalAccount] = useState(0);
  const [totalRegion, setTotalRegion] = useState(0);

  useEffect(() => {
    getSourceCoverageData();
  }, []);

  const getSourceCoverageData = async () => {
    try {
      const result: any = await getSourceCoverage();
      if (result) {
        setCoverageData(result);
      }
      const accountData: any = await getAccountInfomation();
      if (accountData) {
        setTotalAccount(accountData.account_total);
        setTotalRegion(accountData.region_total);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const topLeftCoverageData = {
    header: 'AWS account information',
    description: 'The AWS accounts tracked by this platform.',
    leftChildHeader: 'Total AWS accounts',
    leftChildData: totalAccount.toString(),
    rightChildHeader: 'AWS regions',
    rightChildData: totalRegion.toString(),
    isRowMore: false,
  };

  const topRightCoverageData = {
    header: 'Data source connection',
    description: (
      <span className="coverage-small">
        Data source that discovered in AWS accounts.
      </span>
    ),
    leftChildHeader: 'Total S3 buckets',
    leftChildData: `${coverageData?.s3_total || 0}`,
    // leftChildTotal: `${coverageData?.s3_total || 0}`,
    rightChildHeader: 'Total RDS instances',
    rightChildData: `${coverageData?.rds_total || 0}`,
    // rightChildTotal: `${coverageData?.rds_total || 0}`,
    isRowMore: true,
  };

  return (
    <SpaceBetween direction="vertical" size="xl" className="account-container">
      <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
        <TopDataCoverage {...topLeftCoverageData} />
        <TopDataCoverage {...topRightCoverageData} />
      </Grid>
      <AccountList setTotalAccount={setTotalAccount} />
    </SpaceBetween>
  );
};

const AccountManagement: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.connectSource'),
      href: RouterEnum.AccountManagement.path,
    },
  ];
  return (
    <AppLayout
      contentHeader={<AccountManagementHeader />}
      content={<AccountManagementContent />}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.AccountManagement.path} />}
      navigationWidth={290}
    />
  );
};

export default AccountManagement;
