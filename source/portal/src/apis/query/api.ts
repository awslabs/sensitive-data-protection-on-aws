import { apiRequest } from 'tools/apiRequest';

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
  try {
    const downloadLink = document.createElement('a');
    downloadLink.href = '/query/download-logs';
    downloadLink.download = 'aws_sdps_cloudwatch_logs.zip';
    downloadLink.click();
    window.URL.revokeObjectURL('/query/download-logs');
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

export { getPropertyValues, sendQuery, downloadLogAsZip };
