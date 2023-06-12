在运行此解决方案时，您将负责支付所使用的AWS服务的费用。影响解决方案费用的主要因素包括：

- 数据集的数量和大小
- 数据结构的数量和复杂程度
- 发现作业更新的频率

例如，对大型数据集进行完全扫描范围的发现作业将比在按需运行、扫描范围增加和扫描深度有限的较小数据集上运行的发现作业产生更高的成本。

截至2023年6月，使用默认设置在由NWCD运营的AWS中国宁夏区域(cn-northwest-1)运行此解决方案的主要AWS账户每月的费用约为**901.82人民币**。


## 成本估算

根据典型的使用模式，以下列出了几个场景，以提供每月成本的估算。列出的AWS服务按月计费。
 

### 基础设施的基本费用（在管理帐户中）

| **服务**                                                     | **使用类型**                                                 | **使用数量** | **每月费用（人民币）** | **类型**     |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------ | ---------------------- | ------------ |
| Amazon Relational Database Service for MySQL Community Edition | 运行MySQL的CNY 0.8每个db.t3.medium Multi-AZ实例小时（或部分小时） | 720小时      | 576                    | 预留         |
| Amazon Relational Database Service Provisioned Storage        | 用于运行MySQL的Multi-AZ部署的CNY 1.5308每GB-month的预 provisioned gp2存储 | 20 GB-Mo     | 30.616                 | 按需         |
| Amazon Elastic Compute Cloud NatGateway                       | NAT网关处理的CNY 0.37每GB数据                              | 30 GB-Mo     | 11.1                   | 按需 |
| 0.37 CNY每个NAT网关小时                                     | 720小时      | 266.4                  | 预留         |
| Athena                                                       | 在中国（宁夏）每TB的DataScannedInTB为CNY 34.34             | 0.010 TB      | 0.34                   | 按需         |
| CloudWatch                                                   | 每月前5GB日志存储免费。每月归档的CNY 0.244每GB                | 0.100 GB-Mo  | 0.244                  | 按需         |
| EC2 Container Registry (ECR)                                 | 500MB每月免费，CNY 0.69每GB-month                          | 0.003 GB-Mo  | 0.69                   | 预留         |
| Elastic Load Balancing - Application                         | 每月免费套餐下的每个Application LoadBalancer-hour（或部分小时）为0.0 CNY。每个Application load balancer-hour（或部分小时）为CNY 0.156 | 10小时       | 1.56                   | 按需         |
|| 每月免费套餐下的每个使用的Application load balancer容量单位-hour（或部分小时）为0.0 CNY。每个LCU-hour（或部分小时）为CNY 0.072 | 0.105 LCU-Hrs | 0                      | 按需         |
| Lambda                                                       | AWS Lambda - Total Compute - China (Ningxia)的前400K GB-second使用免费，Ningxia的每1ms价格为CNY 0.0000001135 | 100,000.000 Lambda-GB-Second | 11.35 | 按需        |
|| AWS Lambda - Total Requests - China (Ningxia)的前1M使用免费，CNY 1.36每百万请求 | 10,000请求   | 0                      | 按需         |
| Simple Queue Service                                         | 每月前1,000,000个Amazon SQS请求免费，CNY 3.33（每百万请求） | 100,000请求  | 3.33                   | 按需         |
| Simple Storage Service                                       | 免费套餐下的前2,000个PUTs，CNY 0.00405 PUT，COPY，POST，LIST请求（每1,000个请求） | 2,000请求    | 0.0081                 | 按需         |
|| 免费套餐下的前20,000个GETs，CNY 0.0135每10,000个请求        | 4,000请求    | 0.0054                 | 按需         |
|| 免费套餐下的前5GB，CNY 0.1755每GB                           | 0.032 GB-Mo  | 0.1755                 | 按需         |
| **总计**                                                     |              |              | 901.819                |              |

### 基础设施的基本费用（在受监控的帐户中）

| **服务**                                                 | **使用类型**                                                 | **费用类型** |
| -------------------------------------------------------- | ------------------------------------------------------------ | ------------ |
| Glue                                                     | 每秒3.021元的DPU-Hour，每个爬网程序运行的最低时间为10分钟 | 按需         |
|| 用于Amazon Glue ETL作业的每个数据处理单位小时的3.021元 | 按需         |
|| 用于Amazon Glue数据目录请求的每1,000,000个请求数的6.866元 | 按需         |
| Step Functions                                          | 前4,000次状态转换为0元，此后每个状态转换为0.0002102元      | 按需         |
| CloudWatch                                              | 每月前5GB日志存储免费。每月归档的CNY 0.244每GB                | 按需         |

以下示例成本表中列出的AWS服务按月在受监控的帐户中计费。Glue爬网程序的最低费用为0.5035元人民币，爬网程序将在数据源连接创建和PII检测作业执行时启动，下面的成本表包括连接创建和作业执行的费用以及示例数据源。

| **场景**                                                   | **服务运行成本（CNY）** | **每月费用（CNY）** |
| ---------------------------------------------------------- | ------------------------ | ------------------- |
| **帐户1，扫描频率每月，扫描深度1000**                    |                          |                     |
| S3 Bucket A: 10000 CSV文件，1000行，10列，总大小1.7GiB      | Glue爬网程序：1.007      | 3.3231              |
| S3 Bucket B: 10000 JSON文件，1000行，10个字段，总大小2.5GiB | Glue作业：2.3161        |                     |
| S3 Bucket C: 1000 PARQUET文件，1000行，10个字段，总大小212Mb |                          |                     |
| **帐户2，扫描频率每周，扫描深度1000**                    |                          |                     |
| RDS Aurora MySQL A: 10个表，10000行，10列，实例类型：db.r5.large（8vCPUs，64GiB RAM，网络：4,750 Mbps） | Glue爬网程序：2.5175     | 5.3371              |
| RDS MySQL B: 10个表，1000000行，10列，实例类型：db.m5.12xlarge（48 vCPU，192 GiB RAM，网络：9500 Mbps） | Glue作业：2.8196        |                     |
| **帐户3，扫描频率每天，扫描深度1000**                    |                          |                     |
| S3 Bucket A: 10000 CSV文件，1000行，10列，总大小1.7GiB      | Glue爬网程序：15.6085    | 86.602              |
| S3 Bucket B: 10000 JSON文件，1000行，10个字段，总大小2.5GiB | Glue作业：70.9935       |                     |
| S3 Bucket C: 1000 PARQUET文件，1000行，10个字段，总大小212Mb |                          |                     |
| RDS Aurora MySQL A: 10个表，10000行，10列，实例类型：db.r5.large（8vCPUs，64GiB RAM，网络：4,750 Mbps） |                          |                     |
| **上述三个帐户不同频率的每月总费用（CNY）**              |                          | 95.2622             |

我们建议使用解决方案中的[AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/)功能来帮助管理成本。价格可能会有所变化。有关详细信息，请参阅本解决方案中使用的每个AWS服务的定价网页。


### 美国东部1区域成本

| **服务**                                 | **使用类型**                                             | **使用数量** | **每月费用（美元）** |     |
| ---------------------------------------- | -------------------------------------------------------- | ------------ | ------------------ | --- |
| Amazon Relational Database Service for MySQL Community Edition | 运行MySQL的USD 0.136每个db.t3.medium Multi-AZ实例小时（或部分小时） | 720小时       | 576                | 预留 |
| Amazon Relational Database Service Provisioned Storage | 运行MySQL的每个Multi-AZ部署USD 0.23每GB-month的提供gp2存储 | 20 GB-Mo     | 30.616             | 按需 |
| Amazon Elastic Compute Cloud NatGateway  | NAT网关处理的每GB数据的USD 0.045 | 30 GB-Mo     | 11.1               | 按需 |
|| USD 0.045每NAT网关小时 | 720小时       | 266.4              | 预留 |
| Athena                                   | 在中国（宁夏）扫描的每TB数据的CNY34.34 | 0.010 TB      | 0.34               | 按需 |
| CloudWatch                               | 每月前5GB日志存储免费。每月存档的每GB USD 0.244 | 0.100 GB-Mo  | 0.244              | 按需 |
| EC2容器注册表（ECR）                     | 500MB月免费套餐，每GB-month的CNY 0.69 | 0.003 GB-Mo  | 0.69               | 预留 |
| Elastic Load Balancing - Application     | 每月免费套餐下的每个应用程序负载均衡器小时（或部分小时）为0.0 CNY。每个应用程序负载均衡器小时（或部分小时）为CNY 0.156 | 10小时       | 1.56               | 按需 |
|| 每个使用的应用程序负载均衡器容量单位小时（或部分小时）在每月免费套餐下为0.0 CNY。每个LCU小时（或部分小时）为CNY 0.072 | 0.105 LCU-Hrs | 0                  | 按需 |
| Lambda                                   | AWS Lambda-总计算-CNY 0前400K GB-second使用量 - 中国（宁夏），每1ms的CNY 0.0000001135价格 | 100,000.000 Lambda-GB-Second | 11.35              | 按需 |
|| AWS Lambda-总请求-CNY 0前1M使用量 - 中国（宁夏），每百万请求的CNY 1.36 | 10,000请求  | 0                  | 按需 |
| Simple Queue Service                     | 每月前1,000,000个Amazon SQS请求免费，CNY 3.33（每百万请求） | 100,000请求  | 3.33               | 按需 |
| Simple Storage Service                   | 免费套餐下的前2,000个PUT，CNY 0.00405 PUT，COPY，POST，LIST请求（每1,000个请求） | 2,000请求   | 0.0081             | 按需 |
|| 免费套餐下的前20,000个GET，CNY 0.0135每10,000个请求 | 4,000请求   | 0.0054             | 按需 |
|| 免费套餐下的前5GB，CNY 0.1755每GB | 0.032 GB-Mo  | 0.1755             | 按需 |
| **总计**                                 |            |              | 901.819            |     |



| **服务**    | **使用类型**                                               |     |
| ----------- | ---------------------------------------------------------- | --- |
| Glue        | Amazon Glue每DPU-Hour收费$0.44，按秒计费，每个爬行运行最少10分钟 | 按需 |
|             | Amazon Glue ETL作业的每个数据处理单元-小时收费0.44美元     | 按需 |
|             | Amazon Glue数据目录请求每1,000,000个请求收费1美元           | 按需 |
| Step Functions | 前4,000个状态转换免费，之后每个状态转换CNY 0.0002102美元 | 按需 |
| CloudWatch  | 每月前5GB日志存储免费。每月存档的每GB USD 0.244            | 按需 |

