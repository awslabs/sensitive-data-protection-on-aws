You will be responsible for the cost of the AWS services used when running the solution. The main factors affecting the solution cost include:

- the number and size of datasets
- the number and complexity of data structure
- the frequency of discovery job updates

For example, running a discovery job on a large dataset with a fully scanned range will result in higher costs than running the job on smaller datasets with increased scan range and limited scan depth that are run on demand.

As of June 2023, the cost for main AWS account running this solution with the default settings in the AWS China Ningxia Region operated by NWCD (cn-northwest-1) is approximately **901.82 CNY a month.**


## Cost estimation

Based on typical usage patterns, the following list a few scenarios to provide an estimation of monthly costs. The AWS services listed are billed on a monthly basis.


### China Ningxia Region Cost

- Base cost for Infra (in Admin account)

|**Service**	|Usage type	|**Usage quantity**	|Monthly cost (CNY)	|Type	|
|---	|---	|---	|---	|---	|
|Amazon Relational Database Service for MySQL Community Edition	|CNY 0.8 per db.t3.medium Multi-AZ instance hour (or partial hour) running MySQL	|720 Hrs	|576	|Reserved	|
|Amazon Relational Database Service Provisioned Storage	|CNY 1.5308 per GB-month of provisioned gp2 storage for Multi-AZ deployments running MySQL	|20 GB-Mo	|30.616	|On Demand	|
|Amazon Elastic Compute Cloud NatGateway	|CNY 0.37 per GB Data Processed by NAT Gateways	|30 GB-Mo	|11.1	|On Demand. Avg 80 url requests per day	|
||0.37 CNY per NAT Gateway Hour	|720 Hrs	|266.4	|Reserved	|
|Athena	|CNY 34.34 per Terabytes for DataScannedInTB in China (Ningxia)	|0.010 Terabytes	|0.34	|On Demand	|
|CloudWatch	|First 5GB-mo per month of logs storage is free. CNY 0.244 per GB archived per month	|0.100 GB-Mo	|0.244	|On Demand	|
|EC2 Container Registry (ECR)	|500MB-month Free Tier, CNY 0.69 per GB-month	|0.003 GB-Mo	|0.69	|Reserved	|
|Elastic Load Balancing - Application	|0.0 CNY per Application LoadBalancer-hour (or partial hour) under monthly free tier. CNY 0.156 per Application load balancer-hour (or partial hour)	|10 Hrs	|1.56	|On Demand	|
||0.0 CNY per used Application load balancer capacity unit-hour (or partial hour) under monthly free tier. CNY 0.072 per LCU-hour (or partial hour)	|0.105 LCU-Hrs	|0	|On Demand	|
|Lambda	|CNY 0 for first 400K GB-second usage of AWS Lambda - Total Compute - China (Ningxia), CNY 0.0000001135 Price per 1ms  (Ningxia)	|100,000.000 Lambda-GB-Second	|11.35	|On Demand	|
||CNY 0 for first 1M usage of AWS Lambda - Total Requests - China (Ningxia), CNY 1.36 per million requests	|10,000 Request	|0	|On Demand	|
|Simple Queue Service	|First 1,000,000 Amazon SQS Requests per month are free, CNY 3.33 (per Million requests)	|100,000 Requests	|3.33	|On Demand	|
|Simple Storage Service	|First 2,000 PUTs free under free tier, CNY 0.00405 PUT, COPY, POST, LIST requests (per 1,000 requests)	|2,000 Requests	|0.0081	|On Demand	|
||First 20,000 GETs free under free tier, CNY 0.0135 per 10,000 requests	|4,000 Requests	|0.0054	|On Demand	|
||First 5 GB free under free tier, CNY 0.1755 per GB	|0.032 GB-Mo CNY 0.00	|0.1755	|On Demand	|
|**Total**	|	|	|901.819	|	|

- Base cost for Infra (in monitored account)

|**Service**	|Usage Type	|	|
|---	|---	|---	|
|Glue	|3.021 CNY per DPU-Hour, billed per second, with a 10-minute minimum per crawler run 	|On Demand	|
||3.021 CNY per Data Processing Unit-Hour for Amazon Glue ETL job	|On Demand	|
||6.866 CNY per 1,000,000 requests for Amazon Glue Data Catalog request	|On Demand	|
|Step Functions	|CNY 0.00 for first 4,000 state transitions, CNY 0.0002102 per state transition thereafter	|On Demand	|
|CloudWatch	|First 5GB-mo per month of logs storage is free. CNY 0.244 per GB archived per month	|On Demand	|

- Cost Example

The AWS services listed in the example cost tables below are billed on a monthly basis in a monitored account. Glue Crawler minimum cost is 0.5035 (CNY), the crawler will be launched in data source connection creation and PII detection job execution, below cost table includes both of the connection creation and job execution cost with the example data sources.

|**Scenarios**	|Service Running Cost (CNY)	|Monthly Cost **(CNY)**	|
|---	|---	|---	|
|**Account 1, scan frequency monthly, scan depth 1000**
|<li>S3 Bucket A: 10000 CSV files, 1000 rows, 10 columns, total size 1.7GiB</li><li>S3 Bucket B: 10000 JSON files, 1000 rows, 10 fields, total size 2.5GiB</li><li>S3 Bucket C: 1000 PARQUET files, 1000 rows, 10 fields, total size 212Mb</li>|<li>Glue Crawler: 1.007</li><li>Glue Job: 2.3161</li>|3.3231	|
|**Account 2, scan frequency weekly, scan depth 1000**
|<li>RDS Aurora MySQL A: 10 tables, 10000 rows, 10 columns, instance type: db.r5.large(8vCPUs, 64GiB RAM Network: 4,750 Mbps)</li><li>RDS MySQL B: 10 tables, 1,000,000 rows, 10 columns, instance type: db.m5.12xlarge(48 vCPU 192 GiB RAM Network:9500 Mbps)</li>|<li>Glue Crawler: 2.5175</li><li>Glue Job: 2.8196</li>|5.3371	|
|**Account 3, scan frequency daily, scan depth 1000**
|<li>S3 Bucket A: 10000 CSV files, 1000 rows, 10 columns, total size 1.7GiB</li><li>S3 Bucket B: 10000 JSON files, 1000 rows, 10 fields, total size 2.5GiB</li><li>S3 Bucket C: 1000 PARQUET files, 1000 rows, 10 fields, total size 212Mb</li><li>RDS Aurora MySQL A: 10 tables, 10000 rows, 10 columns, instance type: db.r5.large(8vCPUs, 64GiB RAM Network: 4,750 Mbps)</li>|<li>Glue Crawler: 15.6085</li><li>Glue Job: 70.9935</li>|86.602	|
|Total monthly cost in the above three accounts with different frequency (CNY)	|	|95.2622	|


### US East-1 Region Cost

- Base cost for Infra (in Admin account)

|**Service**	|Usage Type	|**Usage Quantity**	|Monthly cost (USD)	|	|
|---	|---	|---	|---	|---	|
|Amazon Relational Database Service for MySQL Community Edition	|USD 0.136 per db.t3.medium Multi-AZ instance hour (or partial hour) running MySQL	|720 Hrs	|97.92	|Reserved	|
|Amazon Relational Database Service Provisioned Storage	|USD 0.23 per GB-month of provisioned gp2 storage for Multi-AZ deployments running MySQL	|20 GB-Mo	|4.6	|On Demand	|
|Amazon Elastic Compute Cloud NatGateway	|USD 0.045 per GB Data Processed by NAT Gateways	|30 GB-Mo	|1.35	|On Demand. Avg 80 url requests per day	|
||USD 0.045 per NAT Gateway Hour	|720 Hrs	|32.4	|Reserved	|
|Athena	|5.00 USD per Terabytes for DataScannedInTB in US East (N. Virginia)	|0.010 Terabytes	|0.05	|On Demand	|
|CloudWatch	|First 5GB per month of log data ingested is free. USD 0.5 per GB archived per month	|0.100 GB-Mo	|0.05	|On Demand	|
|Elastic Load Balancing - Application	|$0.0 per used Application load balancer capacity unit-hour (or partial hour) under monthly free tier	|10 Hrs	|0	|On Demand	|
||$0.00 per Application LoadBalancer-hour (or partial hour) under monthly free tier	|0.105 LCU-Hrs	|0	|On Demand	|
|Lambda	|AWS Lambda - Compute Free Tier - 400,000 GB-Seconds - US East (Northern Virginia), after free tier $0.0000166667 for every GB-second	|5,0000 Lambda-GB-Second	|0.08333	|On Demand	|
||AWS Lambda - Ephemeral Storage - US East (N. Virginia), after free tier $0.0000000309 for every GB-second	|10,000 Request	|0	|On Demand	|
|Simple Queue Service	|First 1,000,000 Amazon SQS Requests per month are free, after free tier $0.40 (per Million requests)	|100,000 Requests	|0.04	|On Demand	|
|Simple Storage Service	|First 2,000 PUTs free under free tier, CNY $0.005 per 1,000 PUT, COPY, POST, or LIST requests	|2,000 Requests	|0.01	|On Demand	|
||First 20,000 GETs free under free tier, $0.0004 per 10,000 requests	|4,000 Requests	|0.0002	|On Demand	|
||First 5 GB free under free tier, $0.023 per GB	|1 GB	|0.023	|On Demand	|
|**Total**	|	|	|136.52653	|	|


- Base cost for Infra (in monitored account)

|**Service**	|Usage Type	|	|
|---	|---	|---	|
|Glue	|$0.44 per DPU-Hour, billed per second, with a 10-minute minimum per crawler run 	|On Demand	|
||$0.44 per Data Processing Unit-Hour for Amazon Glue ETL job	|On Demand	|
||$1 per 1,000,000 requests for Amazon Glue Data Catalog request	|On Demand	|
|Step Functions	|US 0.00 for first 4,000 state transitions, $0.025 per 1,000 state transitions	|On Demand	|
|CloudWatch	|First 5GB per month of log data ingested is free. USD 0.5 per GB archived per month	|On Demand	|

The basic cost of infrastructure in a monitored account is charged on a pay-as-you-go basis. This means that you only pay for the actual resources that you use, without having to purchase or reserve any capacity in advance. Additionally, AWS provides some free usage tiers to help you understand and evaluate the usage of the service.

We recommend using the [AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/) feature in the solution to help manage costs. Prices are subject to change. For full details, refer to the pricing webpage for each AWS service used in this solution. 