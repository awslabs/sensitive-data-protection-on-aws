# 故障排查

## 关于连接账号及连接数据源

**连接RDS时提示错误信息：```At least one security group must open all ingress ports.```**

给RDS分配所在VPC的default安全组。这个是Glue的要求，详见[https://docs.aws.amazon.com/glue/latest/dg/glue-troubleshooting-errors.html](https://docs.aws.amazon.com/glue/latest/dg/glue-troubleshooting-errors.html)。

当您在RDS配了安全组之后，您需要删除SDP平台上对应数据目录，重新点击“同步至数据目录”。这样操作后台会重新获取一下RDS最新的配置，进而创建数据目录成功。

**连接RDS时，`VPC S3 endpoint validation failed for SubnetId: subnet-000000. VPC: vpc-111111. Reason: Could not find S3 endpoint or NAT gateway for subnetId: subnet-000000 in Vpc`**

程序连接时有检查，一般不会出现该问题。手动删除后NAT Gateway或S3 endpoint(type为Gateway)会报这个错，添加NAT Gateway或S3 endpoint并配置路由后解决。

**删除待检测账号中的Agent CloudFormation后，在main账号删除AWS账号时提示错误：`An error occurred (AccessDenied) when calling the AssumeRole operation: User: arn:aws:sts::5566xxxxxxx:assumed-role/SDPSAPIRole-us-east-1/SDPS-Admin-APIAPIFunction719F975A-yEQ3iOlIYK1F is not authorized to perform: sts:AssumeRole on resource: arn:aws:iam::8614xxxxxxx:role/SDPSRoleForAdmin-us-east-1`**

Agent CloudFormation删除后需要等待5-8分钟，才能在主账号进行删除操作，否则会出现这个错误。出现错误请尝试在10分钟后再对main账号中的AWS账号进行删除。


## 关于敏感数据发现任务

**在中国区域(China Regions)使用解决方案时，无法下载模板快照和报告文件。**

由于模板快照和报告从S3采用预签名方式下载，因此Admin所在账号必须做ICP备案或ICP Exception.
