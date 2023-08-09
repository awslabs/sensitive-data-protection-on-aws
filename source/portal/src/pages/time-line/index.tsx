import {
  AppLayout,
  Box,
  Cards,
  Button,
  Container,
  Header,
  Tabs,
  ContentLayout,
  SpaceBetween,
  Grid,
} from '@cloudscape-design/components';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'
import './style.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import { RouterEnum } from 'routers/routerEnum';
import CustomBreadCrumb from 'pages/left-menu/CustomBreadCrumb';
import Navigation from 'pages/left-menu/Navigation';
import { useTranslation } from 'react-i18next';
import TopDataCoverage from 'pages/top-data-coverage';




const TimelineHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Header variant="h1" description="">
      {t('timeline:timeline')}
    </Header>
  );
};

const TimelineContent: React.FC = () => {
  const { t } = useTranslation();
  const [gitData, setGitData] = useState([]);
  useEffect(() => {
    fetch('https://api.github.com/repos/awslabs/sensitive-data-protection-on-aws/releases')
       .then((res) => res.json())
       .then((data) => {
          console.log(data);
          setGitData(data);
       })
       .catch((err) => {
          console.log(err.message);
       });
 }, []);



  return (
    <ContentLayout>
      {(gitData||[]).map((item, index)=>{
        let body = "", publishTime = ""
        body = item["body"]
        publishTime = item["created_at"]
        const bodyStr = body.toString().replace("What's Changed","Features")
        const contributorsEndStr = bodyStr.indexOf("New Contributors")
        const fullChangeLogEndStr = bodyStr.indexOf("**Full Changelog")
        const endStr = contributorsEndStr>-1?contributorsEndStr:fullChangeLogEndStr
        return (
        //   <Container
        //   header={<Header variant="h2">{item["name"]}</Header>}
        //   className="fix-mid-screen common-header"
        //   >
        //     <div className="flex-h gap-16">
              
        //       <div
        //         className="flex-v justify-spacebetween"
        //         style={{ minWidth: 1000 }}
        //       >
        //       <ReactMarkdown >
        //       {bodyStr.substring(0, endStr>-1?endStr:bodyStr.length)}
        //       </ReactMarkdown>
        //     </div> 
        //   </div>
        // </Container>
        <SpaceBetween direction="vertical" size="xl" className="account-container">
      <Grid gridDefinition={[{ colspan: 12 }]}>
      <Container
      header={
        <Header variant="h2" description={<div style={{color:"grey"}}>{t('timeline:publishTime')} {publishTime.replace("T"," ").replace("Z","")}</div>} actions={<Button variant="link" onClick={() => {console.log("hahah")}}>
        {t('timeline:exportTemplates')}
      </Button>}>
          {item["name"]}
        </Header>
      }
    >
      <div
                className="flex-v justify-spacebetween"
                style={{ minWidth: 1000 }}
              >
              <ReactMarkdown >
              {bodyStr.substring(0, endStr>-1?endStr:bodyStr.length)}
              </ReactMarkdown>
            </div>


    </Container>
          
      </Grid>
    </SpaceBetween>
         )
      })}
      
    </ContentLayout>
  );
};


const TimeLine: React.FC = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbItems = [
    {
      text: t('breadcrumb.home'),
      href: RouterEnum.Home.path,
    },
    {
      text: t('breadcrumb.timeline'),
      href: RouterEnum.TimeLine.path,
    },
  ];
  return (
    <AppLayout
      toolsHide={true}
      contentHeader={<TimelineHeader />}
      content={<TimelineContent />}
      headerSelector="#header"
      breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
      navigation={<Navigation activeHref={RouterEnum.Home.path} />}
      navigationWidth={290}
    />
  );
};

export default TimeLine;
