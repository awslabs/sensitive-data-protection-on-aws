# Cost 

You will be responsible for the cost of the AWS services used when running the solution. We recommend using the AWS Cost Explorer feature in the solution to help manage costs. Prices are subject to change. For full details, refer to the pricing webpage for each AWS service used in this solution.

The cost for running the Sensitive Data Protection solution varies based on the following factors:

- Number and size of datasets
- Number and complexity of data structures
- Frequency of discovery job updates

For example, a large datasets that is running discovery job with fully scan range will result in higher costs than smaller datasets with increased scan range and limited scan depth that are run on demand.

## Cost breakdown


As of June 2023, the cost for main AWS account running this solution with the default settings in China (Ningxia) Region Operated by NWCD is approximately ¥901.82 CNY a month.

- **Base cost for Infra (in admin account)**

| Service                                                        | Usage Type                                                                                                                    | Usage Quantity   | Monthly cost (CNY) | Billing Type |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------ | ------------ |
| Amazon Relational Database Service for MySQL Community Edition | CNY 0.8 per db.t3.medium Multi-AZ instance hour (or partial hour) running MySQL                                               | 720 Hrs          | 576                | Reserved     |
| Amazon Relational Database Service Provisioned Storage         | CNY 1.5308 per GB-month of provisioned gp2 storage for Multi-AZ deployments running MySQL                                       | 20 GB-Mo         | 30.616             | On Demand    |
| Amazon Elastic Compute Cloud NatGateway                        | 0.37 CNY per GB Data Processed by NAT Gateways                                                                                 | 30 GB-Mo         | 11.1               | On Demand    |
| Amazon Elastic Compute Cloud NatGateway                        | 0.37 CNY per NAT Gateway Hour                                                                                                  | 720 Hrs          | 266.4              | Reserved     |
| Athena                                                         | CNY34.34 per Terabytes for DataScannedInTB in China (Ningxia)                                                                 | 0.010 Terabytes  | 0.34               | On Demand    |
| CloudWatch                                                     | First 5GB-mo per month of logs storage is free. CNY 0.244 per GB archived per month                                             | 0.100 GB-Mo      | 0.244              | On Demand    |
| EC2 Container Registry (ECR)                                   | 500MB-month Free Tier, CNY 0.69 per GB-month                                                                                  | 0.003 GB-Mo      | 0.69               | Reserved     |
| Elastic Load Balancing - Application                           | 0.0 CNY per Application LoadBalancer-hour (or partial hour) under monthly free tier. CNY 0.156 per Application load balancer-hour | 10 Hrs           | 1.56               | On Demand    |
| Elastic Load Balancing - Application                           | 0.0 CNY per used Application load balancer capacity unit-hour (or partial hour) under monthly free tier. CNY 0.072 per LCU-hour | 0.105 LCU-Hrs    | 0                  | On Demand    |
| Lambda                                                         | CNY 0 for first 400K GB-second usage of AWS Lambda - Total Compute - China (Ningxia), CNY 0.0000001135 Price per 1ms (Ningxia)   | 100,000.000 Lambda-GB-Second | 11.35 | On Demand    |
| Lambda                                                         | CNY 0 for first 1M usage of AWS Lambda - Total Requests - China (Ningxia), CNY 1.36 per million requests                            | 10,000 Requests  | 0                  | On Demand    |
| Simple Queue Service                                           | First 1,000,000 Amazon SQS Requests per month are free, CNY 3.33 (per Million requests)                                        | 100,000 Requests | 3.33               | On Demand    |
| Simple Storage Service                                         | First 2,000 PUTs free under free tier, CNY 0.00405 PUT, COPY, POST, LIST requests (per 1,000 requests)                          | 2,000 Requests   | 0.0081             | On Demand    |
| Simple Storage Service                                         | First 20,000 GETs free under free tier, CNY 0.0135 per 10,000 requests                                                         | 4,000 Requests   | 0.0054             | On Demand    |
| Simple Storage Service                                         | First 5 GB free under free tier, CNY 0.1755 per GB                                                                            | 0.032 GB-Mo      | 0.1755             | On Demand    |
| Simple Storage Service                                         | CNY 0.00                                                                                                                      |                  | 0.1755             | On Demand    |
| Total                                                          |                                                                                                                               |                  | 901.819            |              |

- **Base cost for Infra (in monitored account)**

The AWS services listed in the example cost tables below are billed on a monthly basis in a monitored account. Glue Crawler minimum cost is 0.5035 (CNY), the crawler will be launched in data source connection creation and PII detection job execution, below cost table includes both of the connection creation and job execution cost with the example data sources.

| Service | Usage Type                                                                                                                         | Billing Type |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Glue    | 3.021 CNY per DPU-Hour, billed per second, with a 10-minute minimum per crawler run                                                 | On Demand    |
| Glue    | 3.021 CNY per Data Processing Unit-Hour for Amazon Glue ETL job                                                                     | On Demand    |
| Glue    | 6.866 CNY per 1,000,000 requests for Amazon Glue Data Catalog request                                                               | On Demand    |
| Step Functions | CNY 0.00 for first 4,000 state transitions, CNY 0.0002102 per state transition thereafter                                              | On Demand    |
| CloudWatch     | First 5GB-mo per month of logs storage is free. CNY 0.244 per GB archived per month                                                  | On Demand    |

## Example 

Based on typical usage patterns, we have indicated a few scenarios to provide an estimation of monthly costs. The AWS services listed in the example cost tables below are billed on a monthly basis.

Here is a cost estimate with sample dataset:

| Scenarios | Service | Running Cost (CNY) | Monthly Cost (CNY) |
| --------- | ------- | ------------------ | ------------------ |
| Account 1, scan frequency monthly, scan depth 1000 | S3 Bucket A: 10000 CSV files, 1000 rows, 10 columns, total size 1.7GiB<br>S3 Bucket B: 10000 JSON files, 1000 rows, 10 fields, total size 2.5GiB<br>S3 Bucket C: 1000 PARQUET files, 1000 rows, 10 fields, total size 212Mb | Glue Crawler: 1.007<br>Glue Job: 2.3161 | 3.3231 |
| Account 2, scan frequency weekly, scan depth 1000 | RDS Aurora MySQL A: 10 tables, 10000 rows, 10 columns, instance type: db.r5.large(8vCPUs, 64GiB RAM Network: 4,750 Mbps)<br>RDS MySQL B: 10 tables, 1,000,000 rows, 10 columns, instance type: db.m5.12xlarge(48 vCPU 192 GiB RAM Network:9500 Mbps) | Glue Crawler: 2.5175<br>Glue Job: 2.8196 | 5.3371 |
| Account 3, scan frequency daily, scan depth 1000 | S3 Bucket A: 10000 CSV files, 1000 rows, 10 columns, total size 1.7GiB<br>S3 Bucket B: 10000 JSON files, 1000 rows, 10 fields, total size 2.5GiB<br>S3 Bucket C: 1000 PARQUET files, 1000 rows, 10 fields, total size 212Mb<br>RDS Aurora MySQL A: 10 tables, 10000 rows, 10 columns, instance type: db.r5.large(8vCPUs, 64GiB RAM Network: 4,750 Mbps) | Glue Crawler: 15.6085<br>Glue Job: 70.9935 | 86.602 |
| Total monthly cost in the above three accounts with different frequency (CNY) | | | 95.2622 |


