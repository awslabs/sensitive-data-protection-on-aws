为了自动化部署，此解决方案使用以下 AWS CloudFormation 模板，您可以在部署前下载：

要使用该解决方案，您需要在管理员帐户上部署Admin模板，并在一个或多个被监控的账户上部署Agent模板。只有使用Agent模板部署的账户才能被监控，这些账户也被称为被监控的账户。

如果您的所有账户都在AWS Organizations中，您需要在一个IT账户上部署IT模板。AWS组织的根用户需要首先将该IT账户注册为（delegated administrator）委派管理员。

## 亚马逊云科技全球区域

- [在新 VPC 中启动带身份提供商的管理员帐户模板 (Admin template)](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/AdminWithIdP.template.json)
- [在现有 VPC 中启动带身份提供商的管理员帐户模板 (Admin template)](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/AdminExistVpcWithIdP.template.json)
- [在新 VPC 中启动管理员帐户模板 (Admin template)](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/Admin.template.json)
- [在现有 VPC 中启动管理员帐户模板 (Admin template)](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/AdminExistVpc.template.json)
- [被监控帐户的模板 (Agent template)](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/Agent.template.json)
- [IT 帐户的模板 (IT template)](https://aws-gcr-solutions.s3.amazonaws.com/aws-sensitive-data-protection/latest/default/IT.template.json)

## 亚马逊云科技中国区域

- [在新 VPC 中启动管理员帐户模板 (Admin template)](https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/latest/cn/Admin.template.json)
- [在现有 VPC 中启动管理员帐户模板 (Admin template)](https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/latest/cn/AdminExistVpc.template.json)
- [被监控帐户的模板 (Agent template)](https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/latest/cn/Agent.template.json)
- [IT 帐户的模板 (IT template)](https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/aws-sensitive-data-protection/latest/cn/IT.template.json)


