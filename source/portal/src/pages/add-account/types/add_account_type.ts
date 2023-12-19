export const TAB_LIST = {
  via: { id: 'via', label: 'account:add.org.via' },
  proxy: { id: 'proxy', label: 'account:add.proxy.via' },
  individual: { id: 'individual', label: 'account:add.account.via' },
};

const TEMPLATE_VERSION = '@TEMPLATE_SOLUTION_VERSION@';

export const ADMIN_TEMPLATE_URL = `https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/${TEMPLATE_VERSION}/cn/Admin.template.json`;
export const AGENT_TEMPLATE_URL = `https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/${TEMPLATE_VERSION}/cn/Agent.template.json`;
export const IT_TEMPLATE_URL = `https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/${TEMPLATE_VERSION}/cn/IT.template.json`;

export const ADMIN_TEMPLATE_URL_GLOBAL = `https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/${TEMPLATE_VERSION}/default/Admin.template.json`;
export const AGENT_TEMPLATE_URL_GLOBAL = `https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/${TEMPLATE_VERSION}/default/Agent.template.json`;
export const IT_TEMPLATE_URL_GLOBAL = `https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/${TEMPLATE_VERSION}/default/IT.template.json`;
