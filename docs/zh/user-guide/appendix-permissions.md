# 附录：代理 CloudFormation 堆栈的权限

本解决方案在部署代理 CloudFormation 模板时，遵循最小权限原则为受监控帐户授予权限。代理 CloudFormation 堆栈基本上会设置 AWS 角色和策略，以授权 SDP 在目标帐户中获取必要的权限。

这些权限可以简要地描述如下：

- (数据源) Amazon S3：对于数据源扫描，只有读取权限。
- (数据源) Amazon RDS：对于数据源扫描，只有读取权限。
- AWS SecretsManager：只有读取权限。如果 RDS 数据库受 Secrets 保护，该解决方案将从 Secret Manager 读取凭据。
- AWS Glue：具有写入权限。使用 Glue 数据目录、Glue 爬虫和 Glue 作业。Glue 由 Step Functions 触发。
- AWS StepFunctions：创建资源。使用 Step Function 编排 Glue 作业进行数据发现。
- AWS Lambda：创建资源。
- Amazon CloudWatch：具有写入权限。Lambda 日志将存储在 CloudWatch 中。

!!! Info "获取更多信息"
    要了解所需的受监控帐户具体权限，请在 [受监控帐户模板（代理模板）](template.md) 中查找详细信息（例如策略、角色）。