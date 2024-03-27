import { apiRequest } from 'tools/apiRequest';

const getSystemConfig = async (params: any) => {
  const result = await apiRequest('get', 'config', params);
  return result;
};

const getSubnetsRunIps = async (params: any) => {
  const result = await apiRequest('get', 'config/subnets', params);
  return result;
};

const updateSystemConfig = async (params: any) => {
  const result = await apiRequest('post', 'config', params);
  return result;
};

export { getSystemConfig, getSubnetsRunIps, updateSystemConfig };
