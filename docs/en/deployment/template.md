To automate deployment, this solution uses the following AWS CloudFormation templates, which you can download before deployment:

To use the solution, you need to deploy the Admin template on an admin account and the Agent template on one or multiple monitored accounts. Only the accounts which are deployed with the Agent template can be monitored, which are also called monitored account.

If all your accounts are within AWS Organizations, you need to deploy the IT template on an IT account. The AWS organization root user needs to first register the IT account as a delegated administrator.


## AWS Global Regions

- [Template for Admin account with IdP (Admin template) in New VPC](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/AdminWithIdP.template.json)
- [Template for Admin account With IdP (Admin template) in Existing VPC](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/AdminExistVpcWithIdP.template.json)
- [Template for Admin account With IdP (Admin template) in Only Private Subnets Existing VPC](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/AdminOnlyPrivateSubnetsWithIdP.template.json)
- [Template for Admin account (Admin template) in New VPC](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/Admin.template.json)
- [Template for Admin account (Admin template) in Existing VPC](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/AdminExistVpc.template.json)
- [Template for Admin account (Admin template) in Only Private Subnets Existing VPC](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/AdminOnlyPrivateSubnets.template.json)
- [Template for Monitored account (Agent template)](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/Agent.template.json)
- [Template for IT account (IT template)](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/IT.template.json)

## AWS China Regions

- [Template for Admin account (Admin template) in New VPC](https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/latest/cn/Admin.template.json)
- [Template for Admin account (Admin template) in Existing VPC](https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/latest/cn/AdminExistVpc.template.json)
- [Template for Monitored account (Agent template)](https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/latest/cn/Agent.template.json)
- [Template for IT account (IT template)](https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/latest/cn/IT.template.json)



