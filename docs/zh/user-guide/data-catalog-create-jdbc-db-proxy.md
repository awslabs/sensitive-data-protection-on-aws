# 连接到数据源 - JDBC（数据库代理)
当您的RDS/数据库在私有网络，且对于IP有严格的限制（只允许固定IP进行接入），您需要通过这种方式进行数据源连接。

### 前提条件 - 保持网络连通性
1. 请确认您[添加AWS账户](data-source.md)时，选择JDBC方式，请转至[连接到数据源 - RDS](data-catalog-create-jdbc-rds-proxy.md)进行操作。
2. 创建数据库代理（Proxy）：在方案所在VPC创建EC2作为代理机器，参考步骤详见：[附录:创建数据库代理](appendix-database-proxy.md)。
3. 添加RDS访问白名单：将EC2的IP添加至待检测数据库的Security Group的Inbound Rule。

## 通过EC2数据库代理（DB Proxy）连接数据库
1. 在左侧菜单，选择 **连接数据源** 
2. 选择您所需要扫描的云账户，单击进入帐户，打开详细页面
3. 单击进入一个云帐户，打开详细页面
4. 选择 **自定义数据库（JDBC）** 标签页
5. 点击**操作**，**添加数据源**

    | 参数               | 必填项  | 参数描述                                                                                                               |
    |-------------------|--------|--------------------------------------------------------------------------------------------------------------------|
    | 实例名称            | 是      | 数据库实例名称                                                                                                            |
    | 勾选SSL连接         | 否      | 是否通过SSL连接                                                                                                         |
    | 描述（选填）         | 否      | 实例描述                                                                                                               |
    | JDBC URL（必填）    | 是      | 至少填写一个数据库实例下的database，用于连接和扫描。具体格式：`jdbc:mysql://ec2_public_ip:port/databasename` |
    | JDBC数据库   | 否      | 填写此实例（instance）中所有需要扫描的数据库（databases）列表（包含上面必填的database）。点击按钮，“自动查询数据库列表” |
    | 凭证               | 是      | 选择用户名密码或SecretManager。填写数据库的用户名/密码。            |
    | VPC  | 是      | 选择Proxy所在的VPC |                          
    | 子网  | 是      | 选择Proxy所在的VPC子网 | 
    | 安全组  | 是      | 选择Proxy所在的VPC安全组 |   
    !!! Info "自动获取数据库按钮"
        方案目前支持自动获取MySQL数据库。

6. 选择数据库实例，点击按钮 **同步至数据目录**
7. 您看到目录状态变为灰色`PENDING`，表示连接开始（约3分钟）
8. 您看到目录状态变为蓝色`CRAWLING`。（200张表约15分钟）
9. 您看到目录状态边绿色 `ACTIVE`，则表示已为 RDS 实例创建了数据目录。此时您可以点击对应 数据目录 的连接进行初步查看，以及后续扫描工作。

至此，您已经通过JDBC方式建立好的RDS代理的数据源连接，可以开始下一步操作了。