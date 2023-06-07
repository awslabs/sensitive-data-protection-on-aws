# 附录：Agent CloudFormation 堆栈的权限

解决方案遵循最小权限原则，仅创建所需权限。权限的高级概念：

# Agent 堆栈

Agent CloudFormation 堆栈自动设置 AWS 角色和策略以读取数据源并在目标帐户中设置必要的权限以授权 SDPS。

- （数据源）Amazon S3：仅读取数据源扫描的权限。
- （数据源）Amazon RDS：仅读取数据源扫描的权限。
- AWS SecretsManager：只读权限。如果 RDS 数据库使用 Secrets 进行保护，我们将从 Secret Manager 中读取凭据。
- AWS Glue：写入权限。使用 Glue 数据目录、Glue 爬虫、Glue 作业。Glue 由 Step Functions 触发。
- AWS StepFunctions：创建资源。Step Function 用于编排 Glue 作业进行数据发现。
- AWS Lambda：创建资源。
- Amazon CloudWatch：写入权限。Lambda 日志将存储在 Cloudwatch 中。
注意：AWS 将提供详细 IAM 策略的文件。