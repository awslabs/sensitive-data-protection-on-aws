此解决方案采用了 [AWS Well-Architected Framework][well-architected-framework] 的最佳实践，帮助客户在云中设计和运行可靠、安全、高效且具有成本效益的工作负载。

本节介绍了在构建此解决方案时如何应用 Well-Architected Framework 的设计原则和最佳实践。

## 运营卓越

本节介绍了在设计此解决方案时如何应用 [运营卓越支柱][operational-excellence-pillar] 的原则和最佳实践。

AWS 上的敏感数据保护解决方案在各个阶段将指标、日志和跟踪推送到 Amazon CloudWatch，以提供对基础设施、弹性负载均衡器、Lambda 函数、Step Function 工作流和解决方案其他组件的可观察性。

## 安全

本节介绍了在设计此解决方案时如何应用 [安全支柱][security-pillar] 的原则和最佳实践。

- AWS 上的敏感数据保护解决方案 Web 控制台用户使用 Amazon Cognito 或 OpenID Connect 进行身份验证和授权。
- 所有服务间通信使用 AWS IAM 角色。
- 解决方案使用的所有角色都遵循最小权限访问。也就是说，它只包含服务正常运行所需的最小权限。

## 可靠性

本节介绍了在设计此解决方案时如何应用 [可靠性支柱][reliability-pillar] 的原则和最佳实践。

- 尽可能使用 AWS 无服务器服务（例如 Lambda、Step Functions、Amazon S3 和 Amazon SQS）以确保高可用性并从服务故障中恢复。
- 扫描结果元数据存储在具有多个可用区（AZ）的 Amazon RDS 中。

## 性能效率

本节介绍了在设计此解决方案时如何应用 [性能效率支柱][performance-efficiency-pillar] 的原则和最佳实践。

- 能够在任何支持此解决方案中 AWS 服务（例如：Amazon S3、弹性负载均衡器）的区域启动此解决方案。
- 使用无服务器架构消除了您运行和维护传统计算活动的物理服务器的需求。
- 每天自动测试和部署此解决方案。由解决方案架构师和主题专家审查此解决方案，寻找实验和改进的领域。

## 成本优化

本节介绍了在设计此解决方案时如何应用 [成本优化支柱][cost-optimization-pillar] 的原则和最佳实践。

- 使用自动缩放组，使计算成本仅与摄取和处理的数据量相关。
- 使用无服务器服务（例如 Amazon S3、Amazon Kinesis Data Streams、Amazon EMR Serverless 和 Amazon Redshift Serverless），使客户只需为所使用的内容付费。

## 可持续性

本节介绍了在设计此解决方案时如何应用 [可持续性支柱][sustainability-pillar] 的原则和最佳实践。

- 解决方案对托管服务（例如 Amazon Glue、Amazon Step Functions、Amazon Lambda）的使用旨在减少碳足迹，与持续运行本地服务器相比。
- 解决方案通过 Amazon SQS 解耦异步消息的发送者和接收者。

[well-architected-framework]:https://aws.amazon.com/architecture/well-architected/?wa-lens-whitepapers.sort-by=item.additionalFields.sortDate&wa-lens-whitepapers.sort-order=desc&wa-guidance-whitepapers.sort-by=item.additionalFields.sortDate&wa-guidance-whitepapers.sort-order=desc
[operational-excellence-pillar]:https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/welcome.html
[security-pillar]:https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html
[reliability-pillar]:https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html
[performance-efficiency-pillar]:https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html
[cost-optimization-pillar]:https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html
[sustainability-pillar]:https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sustainability-pillar.html