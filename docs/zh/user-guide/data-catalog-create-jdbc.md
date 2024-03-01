# 连接到数据源 - JDBC

当您希望对某一种数据库进行敏感数据扫描时，您可以将DB instance或databases作为数据源。

| 支持的数据库类型      |
|-----------------------|
| Amazon Redshift       |
| Amazon Aurora         |
| Microsoft SQL Server  |
| MySQL                 |
| Oracle                |
| PostgreSQL            |
| Snowflake             |
| Amazon RDS for MariaDB|

### 前提条件 - 保持网络连通性
1. 请确认您[添加AWS账户](data-source.md)时，选择的是CloudFormation方式。如果您添加账户时，选择JDBC方式，请转至[通过EC2代理连接数据库](data-catalog-create-jdbc-database-proxy.md)进行操作。
2. 请确保待检测数据库的inbound rule上有所在安全组的自引用, 操作详见[官网文档](https://docs.aws.amazon.com/glue/latest/dg/setup-vpc-for-glue-access.html)。
3. 准备好Redshift的连接凭证（用户名/密码）

!!! Info "如何获得Redshift凭证"
    DBA或业务方创建一个只读的User做安全审计使用。此用户只需要只读（read-only）权限。

## 连接Amazon Redshift数据源
1. 从左侧菜单，选择 **连接数据源** 
2. 选择**AWS Cloud**标签页
3. 单击进入一个AWS帐户，打开详细页面
4. 选择 **自定义数据库（JDBC）** 标签页。
5. 点击**操作**，**添加数据源**
6. 在弹出窗口中，输入Redshift凭证信息。（如果您选择Secret Manager方式，需要提前为此Redshift的用户名/密码托管在Secret Manager。）
 
    | 参数               | 必填项  | 参数描述                                                                                                               |
    |-------------------|--------|--------------------------------------------------------------------------------------------------------------------|
    | 实例名称            | 是      | 数据库名称                                                                                                           |
    | 勾选SSL连接         | 否      | 是否通过SSL连接                                                                                                         |
    | 描述（选填）         | 否      | 实例描述                                                                                                               |
    | JDBC URL（必填）    | 是      | 填写一个database，用于连接和扫描。具体格式请参见下表。|
    | JDBC数据库   | 否      | 如果您希望在一个数据目录展示多个数据库，则填写数据库列表。例如，1个数据目录为1个数据库实例，您可以填写instance下多个数据库。如果您只希望扫描此instance下一个数据库，则保留为空。 |
    | 凭证               | 是      | 选择用户名密码或SecretManager。填写数据库的用户名/密码。 |
    | VPC  | 是      | 选择数据库所在的VPC |                          
    | 子网  | 是      | 选择数据库所在的VPC子网 | 
    | 安全组  | 是      | 选择数据库所在的VPC安全组 |   

7. 点击 **连接**。您可以等待10s关闭此窗口。
8. 您看到目录状态变为灰色`PENDING`，表示连接开始（约3分钟）
9. 您看到目录状态变为蓝色`CRAWLING`。（200张表约15分钟）
10. 您看到目录状态边绿色 `ACTIVE`，则表示已为该Redshift Cluster创建了数据目录。

至此，您已经连接好Redshift数据源了，可以开始下一步操作👉[定义分类分级模版](data-identifiers.md)。


!!! Info "JDBC URL格式以及样例"

    | JDBC URL                                        | Example                                                                                      |
    |-------------------------------------------------|----------------------------------------------------------------------------------------------|
    | Amazon Redshift                                 | `jdbc:redshift://xxx.us-east-1.redshift.amazonaws.com:8192/dev`                              |
    | Amazon RDS for MySQL                            | `jdbc:mysql://xxx-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:3306/employee`             |
    | Amazon RDS for PostgreSQL                       | `jdbc:postgresql://xxx-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:5432/employee`        |
    | Amazon RDS for Oracle                           | `jdbc:oracle:thin://@xxx-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:1521/employee`      |
    | Amazon RDS for Microsoft SQL Server             | `jdbc:sqlserver://xxx-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:1433;databaseName=employee` |
    | Amazon Aurora PostgreSQL                        | `jdbc:postgresql://employee_instance_1.xxxxxxxxxxxx.us-east-2.rds.amazonaws.com:5432/employee` |
    | Amazon RDS for MariaDB                          | `jdbc:mysql://xxx-cluster.cluster-xxx.aws-region.rds.amazonaws.com:3306/employee`            |
    | Snowflake (Standard Connection)                 | `jdbc:snowflake://account_name.snowflakecomputing.com/?user=user_name&db=sample&role=role_name&warehouse=warehouse_name` |
    | Snowflake (AWS PrivateLink Connection)          | `jdbc:snowflake://account_name.region.privatelink.snowflakecomputing.com/?user=user_name&db=sample&role=role_name&warehouse=warehouse_name` |
