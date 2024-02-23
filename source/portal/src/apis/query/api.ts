import axios from 'axios';
import download from 'downloadjs';
import { User } from 'oidc-client-ts';
import { apiRequest } from 'tools/apiRequest';
import { AMPLIFY_CONFIG_JSON } from 'ts/common';
import { AmplifyConfigType } from 'ts/types';

/**
 * 获取筛选项信息
 * @param params
 * @returns
 */
const getPropertyValues = async (
  params: string | { table: string; column: string; condition: any }
) => {
  const result = await apiRequest(
    'get',
    '/query/property_values',
    params as any
  );
  return result;
};

/**
 * 通用查询
 * @param params
 * @returns
 */
const sendQuery = async (params: Record<string, any> | undefined) => {
  const result = await apiRequest('post', '/query/', params);
  return result;
};

/**
 * Download debug logs
 * @param params
 * @returns
 */
const downloadLogAsZip = async () => {
  const configJSONObj: AmplifyConfigType = localStorage.getItem(
    AMPLIFY_CONFIG_JSON
  )
    ? JSON.parse(localStorage.getItem(AMPLIFY_CONFIG_JSON) || '')
    : {};
  const token =
    process.env.REACT_APP_ENV === 'local' ||
      process.env.REACT_APP_ENV === 'development'
      ? ''
      : User.fromStorageString(
        localStorage.getItem(
          `oidc.user:${configJSONObj.aws_oidc_issuer}:${configJSONObj.aws_oidc_client_id}`
        ) || ''
      )?.id_token;
  const response = await axios.get('/query/download-logs', {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: token ? `Bearer ${token}` : undefined,
    },
    responseType: 'blob'
  });
  download(response.data, 'aws_sdps_cloudwatch_logs.zip', 'application/zip');
};

export { downloadLogAsZip, getPropertyValues, sendQuery };

