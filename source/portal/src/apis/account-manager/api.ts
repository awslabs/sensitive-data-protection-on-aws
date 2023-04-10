import { apiRequest } from 'tools/apiRequest';

// 获取Account list
const getAccountList = async (params: any) => {
  const result = await apiRequest('post', 'data-source/list-account', params);
  return result;
};

// 添加账号
const addAccount = async (params: any) => {
  const result = await apiRequest('post', 'data-source/add_account', params);
  return result;
};

// 添加账号
const deleteAccount = async (params: any) => {
  const result = await apiRequest('post', 'data-source/delete_account', params);
  return result;
};

export { getAccountList, addAccount, deleteAccount };
