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
  Tabs,
} from '@cloudscape-design/components';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { getAccountInfomation } from 'apis/dashboard/api';
import { getSourceProviders } from 'apis/data-source/api';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';
import HelpInfo from 'common/HelpInfo';
import { buildDocLink } from 'ts/common';

const AccountManagementHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Header variant="h1" description={t('account:connectToDataSourceDesc')}>
      {t('account:connectToDataSource')}
    </Header>
  );
};

const AccountManagementContent: React.FC = () => {
  const { t } = useTranslation();
  const [coverageData, setCoverageData] = useState({
    rds_connected: 0,
    rds_total: 0,
    s3_connected: 0,
    s3_total: 0,
  });
  const [totalAccount, setTotalAccount] = useState(0);
  const [totalRegion, setTotalRegion] = useState(0);
  const [providers, setProviders] = useState([]);
  const [currentProvider, setCurrentProvider] = useState('1');

  useEffect(() => {
    getProviders();
  }, []);

  useEffect(() => {
    getSourceCoverageData(currentProvider);
  }, [currentProvider]);

  const getProviders = async () => {
    const providers: any = await getSourceProviders({});
    setProviders(providers)
  }

  const getSourceCoverageData = async (currentProvider: string) => {
    try {
      const result: any = await getSourceCoverage({"provider_id":currentProvider});
      if (result) {
        setCoverageData(result);
      }
      const accountData: any = await getAccountInfomation({"provider_id":currentProvider});
      if (accountData) {
        setTotalAccount(accountData.account_total);
        setTotalRegion(accountData.region_total);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const changeProvider =(tabId:any)=>{
    setCurrentProvider(tabId);
  }
  const genTabs = () => {
    const tabs:any = [];
    providers.forEach(item=> {
        tabs.push({
          label: item['provider_name'],
          id: item['id']+'',
          content: (
          <SpaceBetween direction="vertical" size="l" className="account-container">
            <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
             <TopDataCoverage {...topLeftCoverageData} />
             <TopDataCoverage {...topRightCoverageData} />
            </Grid>
            <AccountList setTotalAccount={setTotalAccount} provider={currentProvider}/>
          </SpaceBetween>
          )
        }) 
    })
    return tabs;
  }

  const topLeftCoverageData = {
    header: t('account:awsAccountInfo'),
    description: t('account:awsAccountInfoDesc'),
    leftChildHeader: t('account:totalAWSAccount'),
    leftChildData: totalAccount.toString(),
    rightChildHeader: t('account:awsRegions'),
    rightChildData: totalRegion.toString(),
    isRowMore: false,
  };

  const topRightCoverageData = {
    header: t('account:dataSourceConnection'),
    description: (
      <span className="coverage-small">
        {t('account:dataSourceDiscoverInAWSAccount')}
      </span>
    ),
    leftChildHeader: t('account:totalS3Bucket'),
    leftChildData: `${coverageData?.s3_total || 0}`,
    // leftChildTotal: `${coverageData?.s3_total || 0}`,
    rightChildHeader: t('account:totalRDSInstance'),
    rightChildData: `${coverageData?.rds_total || 0}`,
    // rightChildTotal: `${coverageData?.rds_total || 0}`,
    isRowMore: true,
  };

   



  return (
    <div style={{marginTop:30}}>
    <SpaceBetween direction="vertical" size="xxl" className="account-container">
      <Tabs tabs={genTabs()} onChange={({detail})=>changeProvider(detail.activeTabId)} activeTabId={currentProvider}/>
    </SpaceBetween>
    </div>
  );
};

const AccountManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbItems = [
    { text: t('breadcrumb.home'), href: RouterEnum.Home.path },
    {
      text: t('breadcrumb.connectSource'),
      href: RouterEnum.AccountManagement.path,
    },
  ];
  return (
    <AppLayout
      tools={
        <HelpInfo
          title={t('breadcrumb.connectSource')}
          description={t('info:connect.desc')}
          linkItems={[
            {
              text: t('info:connect.addAWSAccount'),
              href: buildDocLink(i18n.language, '/user-guide/data-source/'),
            },
          ]}
        />
      }
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
