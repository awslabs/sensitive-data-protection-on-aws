import Home from 'pages/summary';
import DataCatalogList from '../pages/data-catalog';
import DataJob from 'pages/data-job';
import DataTemplate from 'pages/data-template';
import DataTag from 'pages/data-tag';
import AccountManagement from 'pages/account-management';
import DataSourceConnection from 'pages/data-source-connection';
import AddAccount from 'pages/add-account';
import TemplateIdentifiers from 'pages/template-identifiers';
import CreateIdentifier from 'pages/create-identifier';
import CreateJob from 'pages/create-job';
import GlueJob from 'pages/glue-job';
import LoginCallback from 'pages/login-callback';
import TimeLine from 'pages/time-line';
import AddJDBCConnection from 'pages/data-source-connection/add/AddJDBCConnection';

interface RouterEnumType {
  path: string;
  element: JSX.Element;
}

export const RouterEnum: Record<string, RouterEnumType> = {
  Home: { path: '/', element: <Home /> },
  Catalog: { path: '/catalog', element: <DataCatalogList /> },
  Datajob: { path: '/datajob', element: <DataJob /> },
  Datatemplate: { path: '/datatemplate', element: <DataTemplate /> },
  Datatag: { path: '/datatag', element: <DataTag /> },
  AccountManagement: {
    path: '/accountmanagement',
    element: <AccountManagement />,
  },
  DataSourceConnection: {
    path: '/sourceconnection',
    element: <DataSourceConnection />,
  },
  AddJDBCConnection: {
    path: '/addjdbcconnection',
    element: <AddJDBCConnection />,
  },
  AddAccount: {
    path: '/addaccount',
    element: <AddAccount />,
  },
  TemplateIdentifiers: {
    path: '/templateidentifiers',
    element: <TemplateIdentifiers />,
  },
  CreateIdentifiers: {
    path: '/createidentifiers',
    element: <CreateIdentifier />,
  },
  CreateJob: {
    path: '/createjob',
    element: <CreateJob />,
  },
  GlueJob: {
    path: '/gluejob',
    element: <GlueJob />,
  },
  LoginCallback: {
    path: '/logincallback',
    element: <LoginCallback />,
  },
  TimeLine: {
    path: '/time-line',
    element: <TimeLine />,
  },
};
