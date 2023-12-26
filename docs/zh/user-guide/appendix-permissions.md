# 附录 部署 CloudFormation 堆栈的权限

本解决方案在部署 CloudFormation 模板时，遵循最小权限原则为受监控帐户授予权限。

这些权限可以简要地描述如下：

- (数据源) Amazon S3：对于数据源扫描，只有读取权限。
- (数据源) Amazon RDS：对于数据源扫描，只有读取权限。
- AWS SecretsManager：只有读取权限。如果 RDS 数据库受 Secrets 保护，该解决方案将从 Secret Manager 读取凭据。
- AWS Glue：具有写入权限。使用 Glue 数据目录、Glue 爬虫和 Glue 作业。Glue 由 Step Functions 触发。
- AWS StepFunctions：创建资源。使用 Step Function 编排 Glue 作业进行数据发现。
- AWS Lambda：创建资源。
- Amazon CloudWatch：具有写入权限。Lambda 日志将存储在 CloudWatch 中。

如需提前指定 IAM 角色以部署 CloudFormation 模板，请按如下步骤操作：

1. [打开 IAM 控制台](https://console.aws.amazon.com/iam/) 并选择 **角色**, 然后点击 **创建角色**。
2. 在**可信实体类型**中选择 **亚马逊云科技 服务**. 在下面**服务或使用案例**列表中, 选择 **CloudFormation**。
3. 点击 **下一步**，并输入角色名称，点击 **创建角色**
4. 在创建好后回到角色列表中打开该角色，选择 **添加权限**，然后点击 **创建内联策略**，点击 **JSON** 切换到JSON编辑器并将如下JSON内容完整复制到 **策略编辑器** 中，点击下一步。
5. 点击 **创建策略** 完成。之后在部署 CloudFormation 模板的时候就可以在 **权限** 部分选择该IAM角色进行部署了。

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "cognito-idp:*",
                "acm:*",
                "ec2:*",
                "events:*",
                "glue:*",
                "lakeformation:*",
                "ecr:BatchGetImage",
                "ecr:GetDownloadUrlForLayer",
                "elasticloadbalancing:*",
                "lambda:*",
                "logs:*",
                "rds:*",
                "secretsmanager:*",
                "iam:PassRole",
                "iam:CreateServiceLinkedRole",
                "iam:DeleteServiceLinkedRole",
                "iam:AttachRolePolicy",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:DeleteRolePolicy",
                "iam:DetachRolePolicy",
                "iam:GetRole",
                "iam:GetRolePolicy",
                "iam:ListAttachedRolePolicies",
                "iam:ListRolePolicies",
                "iam:PutRolePolicy",
                "iam:ListRoles",
                "kms:*",
                "s3:*",
                "sqs:*",
                "serverlessrepo:*",
                "states:*",
                "sagemaker:CreateProcessingJob",
                "sagemaker:ListProcessingJobs",
                "sagemaker:DescribeProcessingJob",
                "sagemaker:AddTags",
                "sagemaker:ListTags",
                "ssm:PutParameter",
                "ssm:DescribeParameters",
                "ssm:GetParameter",
                "ssm:DeleteParameter",
                "cloudformation:*",
                "sns:ListTopics",
                "codestar-connections:GetSyncConfiguration"
            ],
            "Resource": "*",
            "Effect": "Allow"
        }
    ]
}
```

!!! Info "获取更多信息"
    要了解所需的受监控帐户具体权限，请在 [受监控帐户模板（代理模板）](../deployment/template.md) 中查找详细信息（例如策略、角色）。