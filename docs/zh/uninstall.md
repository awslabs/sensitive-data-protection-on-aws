要卸载解决方案，您必须删除 AWS CloudFormation 堆栈。

您可以使用 AWS 管理控制台或 AWS 命令行界面（AWS CLI）删除 CloudFormation 堆栈。

## 使用 AWS 管理控制台卸载堆栈

1. 登录 AWS CloudFormation 控制台。
1. 选择此解决方案的安装父堆栈。
1. 选择 **删除**。

## 使用 AWS 命令行界面卸载堆栈

确定您的环境中是否可用 AWS 命令行界面（AWS CLI）。有关安装说明，请参阅 *AWS CLI 用户指南* 中的 [什么是 AWS 命令行界面][aws-cli]。确认 AWS CLI 可用后，运行以下命令。

```bash
aws cloudformation delete-stack --stack-name <installation-stack-name> --region <aws-region>
```

[cloudformation-console]: https://console.aws.amazon.com/cloudformation/home
[aws-cli]: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html