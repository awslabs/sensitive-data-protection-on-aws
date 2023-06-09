最后更新时间：2023/06/05

在宁夏（cn-northwest-1）区域使用默认设置运行此解决方案的主 AWS 账户的成本约为 **每月 901.82 元人民币**。

## 成本估算

根据典型的使用模式，我们提供了一些场景，以提供每月成本的估算。下面的示例成本表中列出的 AWS 服务按**每月**计费。

>运行敏感数据保护解决方案的成本取决于多种因素，例如数据集的数量和大小、数据结构的数量和复杂度以及发现作业更新的频率。例如，在全面扫描范围内对大型数据集运行发现作业将产生比在增量扫描范围和有限扫描深度下按需运行较小数据集的作业更高的成本。

### 基础设施成本（主账户）

|**服务**	|使用类型	|**使用量**	|每月成本（人民币）	|	|
|---	|---	|---	|---	|---	|
|Amazon Relational Database Service for MySQL Community Edition	|每小时（或部分小时）运行 MySQL 的 db.t3.medium 多可用区实例 0.8 元人民币	|720 小时	|576	|预留实例	|
|Amazon Relational Database Service Provisioned Storage	|每 GB-月为运行 MySQL 的多可用区部署提供 gp2 存储 1.5308 元人民币	|20 GB-月	|30.616	|按需付费	|
|Amazon Elastic Compute Cloud NatGateway	|NAT 网关处理的每 GB 数据 0.37 元人民币	|30 GB-月	|11.1	|按需付费。平均每天 80 次 URL 请求。|
|每 NAT 网关小时 0.37 元人民币	|720 小时	|266.4	|预留实例。|
|Athena	|中国（宁夏） DataScannedInTB 每 TB 34.34 元人民币。	|0.010 TB。	|0.34。	|按需付费。|
|CloudWatch |每月前 5GB-mo 日志存储免费。每 GB 每月归档 0.244 元人民币。 |0.100 GB-月 |0.244 |按需付费 |
EC2 Container Registry (ECR) |500MB-月免费套餐，每 GB-月 0.69 元人民币 |0.003 GB-月 |0.69 |预留实例 |
Elastic Load Balancing - Application |每月免费套餐下每 Application LoadBalancer 小时（或部分小时） 0.0 元人民币。每 Application load balancer 小时（或部分小时） 0.156 元人民币 |10 小时 |1.56 |按需付费 |
每月免费套餐下每个使用的 Application load balancer 容量单位小时（或部分小时） 0.0 元人民币。每 LCU 小时（或部分小时） 0.072 元人民币 |0.105 LCU-小时 |0 |按需付费 |
Lambda |AWS Lambda - Total Compute - China (Ningxia) 前 400K GB-秒使用量 CNY 0，(Ningxia) 每毫秒 CNY 0.0000001135 的价格 |100,000.000 Lambda-GB-Second |11.35 |按需付费 |
AWS Lambda - Total Requests - China (Ningxia) 前 1M 使用量 CNY 0，每百万次请求 CNY 1.36 |10,000 次请求 |0 |按需付费 |
Simple Queue Service |每月前 1,000,000 次 Amazon SQS 请求免费，每百万次请求 CNY 3.33 |100,000 次请求 |3.33 |按需付费 |
Simple Storage Service |免费套餐下前 2,000 次 PUT 免费，每 1,000 次 PUT、COPY、POST、LIST 请求 CNY 0.00405 |2,000 次请求 |0.0081 |按需付费 |
免费套餐下前 20,000 次 GET 免费，每 10,000 次请求 CNY 0.0135 |4,000 次请求 |0.0054 |按需付费 |
免费套餐下前 5 GB 免费，每 GB CNY 0.1755 |0.032 GB-月
CNY 0.00 |0.1755 |按需付费 |
|**总计**	|	|	|901.819	|	|

### 基础设施成本（监控账户）

|**服务**	|使用类型	|	|
|---	|---	|---	|
|Glue	|每 DPU 小时（或部分小时）3.021 元人民币，按秒计费，每次爬虫运行最少 10 分钟。	|按需付费。|
|Amazon Glue ETL 作业每数据处理单元小时（或部分小时）3.021 元人民币。	|按需付费。|
|Amazon Glue Data Catalog 请求每百万次请求 6.866 元人民币。	|按需付费。|
|Step Functions	|US 0.00 前 4,000 次状态转换，此后每次状态转换 CNY 0.0002102。	|按需付费。|
CloudWatch |每月前 5GB-mo 日志存储免费。每 GB 每月归档 0.244 元人民币。 |按需付费 |

下面的示例成本表中列出的 AWS 服务在监控账户中按月计费。Glue 爬虫最低成本为 0.5035（元人民币），爬虫将在数据源连接创建和 PII 检测作业执行时启动，下面的成本表包括连接创建和作业执行成本以及示例数据源。

|**场景**	|服务运行成本（人民币）	|每月成本 **（人民币）**	|
|---	|---	|---	|
|**账户1，扫描频率为每月一次，扫描深度为1000**
S3 存储桶 A：10000 CSV 文件，1000 行，10 列，总大小为1.7GiB
S3 存储桶 B：10000 JSON 文件，1000 行，10 字段，总大小为2.5GiB
S3 存储桶 C：1000 PARQUET 文件，1000 行，10 字段，总大小为212Mb。	|Glue 爬虫：1.007
Glue Job：2.3161。	|3.3231。|
|**账户2，扫描频率为每周一次，扫描深度为1000**
RDS Aurora MySQL A：10 张表，10000 行，10 列，实例类型：db.r5.large(8vCPUs,64GiB RAM 网络：4,750 Mbps)
RDS MySQL B：10 张表，1,000,000 行，10 列，实例类型：db.m5.12xlarge(48 vCPU 192 GiB RAM 网络：9500 Mbps)。	|Glue 爬虫：2.5175
Glue Job：2.8196。	|5.3371。|

|**账户3，扫描频率为每天一次，扫描深度为1000**
S3 存储桶 A：10000 CSV 文件，1000 行，10 列，总大小为1.7GiB
S3 存储桶 B：10000 JSON 文件，1000 行，10 字段，总大小为2.5GiB
S3 存储桶 C：1000 PARQUET 文件，1000 行，10 字段，总大小为212Mb
RDS Aurora MySQL A：10 张表，10000 行，10 列，实例类型：db.r5.large(8vCPUs, 64GiB RAM 网络：4,750 Mbps)	|Glue 爬虫：15.6085
Glue Job：70.9935	|86.602	|
|以上三个账户不同频率的总月成本（人民币）	|	|95.2622	|

我们建议在解决方案中使用 [AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/) 功能来帮助管理成本。价格可能会发生变化。有关完整详细信息，请参阅此解决方案中每个 AWS 服务的定价网页。

### 美国东部-1 区域成本

|**服务**	|使用类型	|**使用量**	|每月成本（美元）	|	|
|---	|---	|---	|---	|---	|
|Amazon Relational Database Service for MySQL Community Edition	|每小时（或部分小时）运行 MySQL 的 db.t3.medium 多可用区实例 0.136 美元。	|720 小时。	|576。	|预留实例。|
|Amazon Relational Database Service Provisioned Storage	|每 GB-月为运行 MySQL 的多可用区部署提供 gp2 存储 0.23 美元。	|20 GB-月。	|30.616。	|按需付费。|
|Amazon Elastic Compute Cloud NatGateway |NAT 网关处理的每 GB 数据 0.045 美元 |30 GB-月 |11.1 |按需付费。平均每天 80 次 URL 请求 |
USD 0.045 per NAT Gateway Hour |720 小时 |266.4 |预留实例 |
Athena |中国（宁夏） DataScannedInTB 每 TB 34.34 元人民币 |0.010 TB |0.34 |按需付费 |
CloudWatch |每月前 5GB-mo 日志存储免费。每 GB 每月归档 0.244 元人民币 |0.100 GB-月 |0.244 |按需付费 |
EC2 Container Registry (ECR) |500MB-月免费套餐，每 GB-月 0.69 元人民币 |0.003 GB-月 |0.69 |预留实例 |
Elastic Load Balancing - Application |每月免费套餐下每 Application LoadBalancer 小时（或部分小时） 0.0 元人民币。每 Application load balancer 小时（或部分小时） 0.156 元人民币 |10 小时 |1.56 |按需付费 |
每月免费套餐下每个使用的 Application load balancer 容量单位小时（或部分小时） 0.0 元人民币。每 LCU 小时（或部分小时） 0.072 元人民币 |0.105 LCU-小时 |0 |按需付费 |
Lambda |AWS Lambda - Total Compute - China (Ningxia) 前 400K GB-秒使用量 CNY 0，(Ningxia) 每毫秒 CNY 0.0000001135 的价格 |100,000.000 Lambda-GB-Second |11.35 |按需付费 |
AWS Lambda - Total Requests - China (Ningxia) 前 1M 使用量 CNY 0，每百万次请求 CNY 1.36 |10,000 次请求 |0 |按需付费 |
Simple Queue Service |每月前 1,000,000 次 Amazon SQS 请求免费，每百万次请求 CNY 3.33 |100,000 次请求 |3.33 |按需付费 |
Simple Storage Service |免费套餐下前 2,000 次 PUT 免费，每 1,000 次 PUT、COPY、POST、LIST 请求 CNY 0.00405 |2,000 次请求 |0.0081 |按需付费 |
免费套餐下前 20,000 次 GET 免费，每 10,000 次请求 CNY 0.0135 |4,000 次请求 |0.0054 |按需付费 |
免费套餐下前 5 GB 免费，每 GB CNY 0.1755 |0.032 GB-月
CNY 0.00 |0.1755 |按需付费 |
|**总计**	|	|	|901.819	|	|

|**服务**	|使用类型	|	|
|---	|---	|---	|
|Glue	|$0.44 per DPU-Hour, billed per second, with a 10-minute minimum per crawler run。	|按需付费。|
|$0.44 per Data Processing Unit-Hour for Amazon Glue ETL job。	|按需付费。|
|$1 per 1,000,000 requests for Amazon Glue Data Catalog request。	|按需付费。|
|Step Functions	|US 0.00 前 4,000 次状态转换，此后每次状态转换 CNY 0.0002102。	|按需付费。|
CloudWatch |每月前 5GB-mo 日志存储免费。每 GB 每月归档 0.244 元人民币。 |按需付费 |