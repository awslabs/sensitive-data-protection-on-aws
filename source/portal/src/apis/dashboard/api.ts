import { apiRequest } from 'tools/apiRequest';

/**
 * Get Accounts Information
 * @param params
 * @returns
 */
const getAccountInfomation = async (params: any) => {
  const result = await apiRequest(
    'get',
    'catalog/dashboard/agg-data-source-summary',
    params
  );
  return result;
};

/**
 * Get Latest Job Time
 * @returns
 */
const getLatestJobTime = async () => {
  const result = await apiRequest('get', 'discovery-jobs/last-job-time', '');
  return result;
};

/**
 * Get Catalog Summary
 * @param params
 * @returns
 */

const getDatacatalogSummary = async (params: any) => {
  const result = await apiRequest(
    'get',
    'catalog/dashboard/agg-catalog-summay',
    params
  );
  return result;
};

const getCatalogSummaryByRegion = async (params: any) => {
  const result = await apiRequest(
    'get',
    'catalog/dashboard/agg-catalog-summay-by-region',
    params
  );
  return result;
};

/**
 * Get catalog summary privacy
 * @param params
 * @returns
 */

const getCatalogSummaryByPrivacy = async (params: any) => {
  const result = await apiRequest(
    'get',
    'catalog/dashboard/agg-catalog-summay-by-privacy',
    params
  );
  return result;
};

/**
 * Get catalog summary by modify
 * @param params
 * @returns
 */
const getCatalogSummaryByModifier = async (params: any) => {
  const result = await apiRequest(
    'get',
    'catalog/dashboard/agg-catalog-summary-by-modifier',
    params
  );
  return result;
};

/**
 * Get catalog top n data
 * @param params
 * @returns
 */
const getCatalogTopNData = async (params: any) => {
  const result = await apiRequest(
    'get',
    'catalog/dashboard/agg-catalog-top-n',
    params
  );
  return result;
};

/**
 * get dashboard data location list
 * @returns
 */
const getSummaryAccountData = async () => {
  const result = await apiRequest(
    'get',
    'data-source/dashboard/agg-data-location-list',
    {}
  );
  return result;
};

/**
 * get dashboard summary providers
 * @returns
 */
const getSummaryProviderList = async () => {
  const result = await apiRequest(
    'get',
    'data-source/dashboard/agg-data-provider-list',
    {}
  );
  return result;
};

/**
 * get dashboard source type list
 * @returns
 */
const getDashboardSourceTypeList = async () => {
  const result = await apiRequest(
    'get',
    'data-source/dashboard/agg-data-source-type-list',
    {}
  );
  return result;
};

export {
  getAccountInfomation,
  getDatacatalogSummary,
  getCatalogSummaryByPrivacy,
  getCatalogSummaryByModifier,
  getCatalogTopNData,
  getLatestJobTime,
  getCatalogSummaryByRegion,
  getSummaryAccountData,
  getSummaryProviderList,
  getDashboardSourceTypeList,
};
