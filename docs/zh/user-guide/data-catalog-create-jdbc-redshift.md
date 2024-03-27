# 连接到数据源 - JDBC（Redshift）

当您希望对某个Redshift Cluster进行敏感数据扫描时，您可以将Redshift的database作为数据源。

### 前提条件 - 保持网络连通性
1. 请确认您[添加AWS账户](data-source.md)时，选择的是CloudFormation方式。如果您添加账户时，选择JDBC方式，请转至[通过EC2代理连接数据库](data-catalog-create-jdbc-database-proxy.md)进行操作。
2. 准备好Redshift的连接凭证（用户名/密码）

!!! Info "如何获得Redshift凭证"
    DBA或业务方创建一个只读的用户（User）做安全审计使用。授予此用户只读权限：`GRANT SHOW VIEW, SELECT ON *.* TO 'reader'@'%'`;

## 连接Amazon Redshift数据源
1. 从左侧菜单，选择 **连接数据源** 
2. 选择**AWS Cloud**标签页
3. 单击进入一个AWS帐户，打开详细页面
4. 选择 **自定义数据库（JDBC）** 标签页。
5. 点击**操作**，**添加数据源**
6. 在弹出窗口中，输入Redshift凭证信息。（如果您选择Secret Manager方式，需要提前为此Redshift的用户名/密码托管在Secret Manager。）
 
    | 参数               | 必填项  | 参数描述                                                                                                               |
    |-------------------|--------|--------------------------------------------------------------------------------------------------------------------|
    | 实例名称            | 是      | Cluster中database名称                                                                                                           |
    | 勾选SSL连接         | 否      | 是否通过SSL连接                                                                                                         |
    | 描述（选填）         | 否      | 描述                                                                                                               |
    | JDBC URL（必填）    | 是      | 填写一个Redshift的database，用于连接和扫描。具体格式：`jdbc:redshift://url:port/databasename` 。例如：`jdbc:redshift://sdp-uat-redshift.xxxxxxxxxx.us-east-1.redshift.amazonaws.com.cn:5439/dev`|
    | JDBC数据库   | 否      | 保持为空 |
    | 凭证               | 是      | 选择用户名密码或SecretManager。填写数据库的用户名/密码。参数获取途径：DBA或业务方为安全团队创建一个只读的User。此用户只需要数据库 SELECT（只读权限）   |
    | VPC  | 是      | 选择Redshift所在的VPC |                          
    | 子网  | 是      | 选择Redshift所在的VPC子网 | 
    | 安全组  | 是      | 选择Redshift所在的VPC安全组 |   

7. 点击 **连接**。您可以等待10s关闭此窗口。
8. 您看到目录状态变为灰色`PENDING`，表示连接开始（约3分钟）
9. 您看到目录状态变为蓝色`CRAWLING`。（200张表约15分钟）
10. 您看到目录状态边绿色 `ACTIVE`，则表示已为该Redshift Cluster创建了数据目录。

至此，您已经连接好Redshift数据源了，可以开始下一步操作👉[定义分类分级模版](data-identifiers.md)。