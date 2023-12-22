# 安全信息
在AWS基础设施上构建系统时，您和AWS共同承担安全责任。这种[责任共担模式](https://aws.amazon.com/compliance/shared-responsibility-model/)减轻了您的运营负担，因为AWS操作、管理和控制组件，包括主机操作系统、虚拟化层和服务所在设施的物理安全。有关AWS安全的更多信息，请访问[AWS 云安全性](http://aws.amazon.com/security/)。

## IAM角色

AWS身份和访问管理(IAM)角色允许客户将细粒度的访问策略和权限分配给AWS上的服务和用户。此解决方案创建授予解决方案组件之间访问权限的IAM角色。

## 使用Amazon CloudWatch警报监控服务

您可以在Amazon CloudWatch的[警报仪表板](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)上设置警报，以监控并接收有关您的AWS资源的警报。通常，我们建议配置您的警报，以在指标开始过度或低于使用特定资源（如高CPU或内存使用率）时通知您。这可能表明您的服务正在遭受DoS-style攻击。此外，当您的数据存储容器（如RDS）接近100％的容量利用时，设置警报也是必要的，因为这表明可能存在资源耗尽或枯竭式攻击。

!!! Warning "提醒"
    
    使用[CloudWatch alarms](https://aws.amazon.com/cloudwatch/pricing/)可能会产生额外费用。

在AWS中国区域（cn-north-1和cn-northwest-1）中，您可以在警报中创建[RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/monitoring-cloudwatch.html)和[NAT网关](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway-cloudwatch.html)的指标。

在AWS区域中，您可以启用更多服务的指标，例如[Lambda](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics.html)、[SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-monitoring-using-cloudwatch.html)和[应用程序负载均衡器](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html)。

例如，如果您想要创建警报以监控NAT网关中的ActiveConnectionCount，可以使用CloudWatch控制台按照以下步骤操作。

1. 登录[AWS管理控制台](https://console.amazonaws.cn/cloudwatch/)。
2. 访问CloudWatch控制台。
3. 在导航窗格中，在**警报**下选择**所有警报**，然后选择**创建警报**。
4. 选择**选择指标**，在指标中选择**NATGateway**。
5. 搜索指标**ActiveConnectionCount**，单击并选择它。
6. 选择**选择指标**。
7. 在**条件**中，定义当ActiveConnectionCount大于100时的警报条件。然后选择**下一步**。
8. 在**通知**中，配置CloudWatch在触发警报状态时向您发送电子邮件。
9. 选择**下一步**。
10. 为警报输入名称和描述，然后选择**创建警报**。


## 启用Admin账户S3存储桶的访问日志记录

在部署解决方案后，您可以启用Admin账户的S3存储桶的访问日志记录，以便检测和防止安全问题。启用日志记录使Amazon S3能够将访问日志传送到您选择的目标存储桶。目标存储桶必须位于与Admin账户S3存储桶相同的AWS区域和AWS账户中。

如果您想通过S3控制台为Admin账户S3存储桶启用访问日志记录，请按照以下步骤操作。

1. 登录AWS管理控制台。
2. 进入S3控制台。
3. 在部署CloudFormation堆栈后找到相应的S3存储桶，存储桶名称以CloudFormation堆栈名称开头。
4. 点击“属性”选项卡。
5. 滚动到“服务器访问日志记录”部分，然后点击“编辑”。
6. 选择“启用”选项以启用S3存储桶的访问日志记录。
7. 在“目标桶”字段中，选择存储访问日志的目标存储桶。
8. 点击“保存”以启用S3存储桶的访问日志记录。
