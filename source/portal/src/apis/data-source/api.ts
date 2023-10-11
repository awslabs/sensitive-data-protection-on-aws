import { apiRequest } from 'tools/apiRequest';

const queryRegions = async (params: any) => {
  const result = await apiRequest(
    'post',
    'data-source/query-regions-by-provider',
    params
  );
  return result;
};

const queryProviders = async () => {
  const result = await apiRequest(
    'post',
    'data-source/query-full-provider-infos',
    ''
  );
  return result;
};

const queryGlueConns = async (params: any) => {
  const result = await apiRequest(
    'post',
    'data-source/query-glue-connections',
    params
  );
  return result;
};

const testGlueConns = async (params: any) => {
  const result = await apiRequest('post', 'data-source/test-glue-conn', params);
  return result;
};

const addGlueConn = async (params: any) => {
  const result = await apiRequest('post', 'data-source/add-jdbc-conn', params);
  return result;
};

// 分页获取DataSource S3列表
const getDataSourceS3ByPage = async (params: any) => {
  const result = await apiRequest('post', 'data-source/list-s3', params);
  return result;
};

// 分页获取DataSource RDS列表
const getDataSourceRdsByPage = async (params: any) => {
  const result = await apiRequest('post', 'data-source/list-rds', params);
  return result;
};

// 分页获取DataSource Glue列表
const getDataSourceGlueByPage = async (params: any) => {
  const result = await apiRequest('post', 'data-source/list-glue-database', params);
  return result;
};

// 分页获取DataSource JDBC列表
const getDataSourceJdbcByPage = async (params: any, provider_id: number) => {
  const result = await apiRequest('post', `data-source/list-jdbc?provider_id=${provider_id}`, params);
  return result;
};

// S3连接
const connectDataSourceS3 = async (params: any) => {
  const result = await apiRequest('post', 'data-source/sync-s3', params);
  return result;
};

// rds连接
const connectDataSourceRDS = async (params: any) => {
  const result = await apiRequest('post', 'data-source/sync-rds', params);
  return result;
};

// 取消Rds连接
const disconnectDataSourceRDS = async (params: any) => {
  const result = await apiRequest('post', 'data-source/delete_rds', params);
  return result;
};

// 取消S3连接
const disconnectDataSourceS3 = async (params: any) => {
  const result = await apiRequest('post', 'data-source/delete_s3', params);
  return result;
};

// 获取SourceCoverage
const getSourceCoverage = async (params: any) => {
  const result = await apiRequest('get', 'data-source/coverage', params);
  return result;
};

const refreshDataSource = async (params: any) => {
  const result = await apiRequest('post', 'data-source/refresh', params);
  return result;
};

const getSecrets = async (params: any) => {
  const result = await apiRequest('get', 'data-source/secrets', params);
  return result;
};

const getSourceProviders = async () => {
  const result = await apiRequest('post', 'data-source/list-providers', {});
  return result;
};

const testConnect = async (params: any) => {
  const result = await apiRequest('post', 'data-source/test-jdbc-conn', params);
  return result;
};

const connectDataSourceJDBC = async (params: any) => {
  const result = await apiRequest('post', 'data-source/sync-jdbc', params);
  return result;
};

export {
  getDataSourceS3ByPage,
  getDataSourceRdsByPage,
  connectDataSourceS3,
  connectDataSourceRDS,
  disconnectDataSourceRDS,
  disconnectDataSourceS3,
  getSourceCoverage,
  refreshDataSource,
  getSecrets,
  queryGlueConns,
  testGlueConns,
  addGlueConn,
  queryRegions,
  queryProviders,
  getSourceProviders,
  getDataSourceGlueByPage,
  getDataSourceJdbcByPage,
  testConnect,
  connectDataSourceJDBC
};
