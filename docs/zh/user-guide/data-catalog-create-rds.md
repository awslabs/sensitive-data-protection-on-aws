# 连接到数据源 - RDS

### 前提条件 - 保持网络连通性
1. 请确认您[添加AWS账户](data-source.md)时，选择的是CloudFormation方式。如果您添加账户时，选择JDBC方式，请转至[通过EC2代理连接数据库](data-catalog-create-jdbc-rds-proxy.md)进行操作。
2. 请确保待检测RDS的inbound rule上有所在安全组的自引用, 操作详见[官网文档](https://docs.aws.amazon.com/glue/latest/dg/setup-vpc-for-glue-access.html)。
3. 请确保Amazon RDS 实例所在VPC至少要有1个私有子网，
4. 请确保RDS所在VPC满足以下条件之一： 1） 它具有 [VPC NAT 网关](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)。
    2） 它具有 S3 & Glue & KMS & Secret Manager服务的VPC Endpoint。 (操作详见[官网文档](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html) )。
5. 准备好RDS的连接凭证（用户名/密码）

!!! Info "如何获得RDS凭证"
    DBA或业务方创建一个只读的User做安全审计使用。此用户只需要数据库 SELECT（只读权限）。

## 连接Amazon RDS数据源
1. 从左侧菜单，选择 **连接数据源** 
2. 选择**AWS Cloud**标签页
3. 单击进入一个AWS帐户，打开详细页面
4. 选择 **Amazon RDS** 标签页。您可以看到解决方案部署区域中的 RDS 实例列表
5. 选择一个 RDS 实例，点击按钮 **同步至数据目录** 
6. 在弹出窗口中，输入RDS凭证信息。（如果您选择Secret Manager方式，需要提前为此RDS的用户名/密码托管在Secret Manager。）

    | 参数               | 必填项  | 参数描述                |
    |-------------------|--------|------------------------------------------------------|
    | 凭证               | 是      | 选择用户名密码或SecretManager。填写数据库的用户名/密码。                        |


7. 点击 **连接**。您可以等待10s关闭此窗口。
8. 您看到目录状态变为灰色`PENDING`，表示连接开始（约3分钟）
9. 您看到目录状态变为蓝色`CRAWLING`。（200张表约15分钟）
10. 您看到目录状态边绿色 `ACTIVE`，则表示已为 RDS 实例创建了数据目录。

至此，您已经连接好RDS数据源了，可以开始下一步操作👉[定义分类分级模版](data-identifiers.md)。