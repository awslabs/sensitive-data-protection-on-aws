!!! Important "Important"

    The following cost estimations are examples and may vary depending on your environment.

You will be responsible for the cost of the AWS services used when running the solution. As of this revision, the following examples are cost estimations for running this solution with default configurations in the US East (N. Virginia) Region and and the China (Ningxia) Region Operated by NWCD. The total cost includes the fees for [**sensitive data detection**](#sensitive-data-detections) and [**solution console**](#cost-of-the-web-based-console).

## Sensitive data detection

The solution cost is mainly composed of the sensitive data detection jobs, which may vary depending on the duration of the detection jobs and each specific task. The longer a detection job runs, the higher the costs are. There are three primary factors that influence the duration of the detection jobs:

- **Number of identifiers for sensitive information detection**: The solution detects sensitive information using predefined detection identifiers. Before performing the detection, you need to select the required detection identifiers. The more identifiers you load, the longer the sensitive information detection process will take, resulting in an increased overall runtime and higher costs.

- **Connected data source types**: The efficiency of sensitive information detection jobs is influenced by the throughput or network bandwidth of different data sources. For example, the detection task may be affected by the network bandwidth of an RDS database. Data sources with higher performance typically lead to faster completion of sensitive information detection jobs.

- **Data volume and content**: Larger data volumes generally require more time for processing. In addition to the data volume in the data source, factors such as data format, sampling size, and detection depth within the detection task also impact the task duration.

The following examples illustrate cost estimations in two scenarios for a single detection task, with monthly billing for AWS services. In case of a periodic automatic execution of detection jobs without significant changes in data volume, the resulting costs will accumulate based on the actual number of executions per month.

### Detecting sensitive data in the database (Amazon RDS)

- US East (N. Virginia) Region (us-east-1)

| Database Type                   | Data Volume                                      | Identifier Count | Detection Time | Detection Data Cost (USD) | Scan Data Cost (USD) | Total Cost (USD) |
| ------------------------------- | ------------------------------------------------ | ---------------- | -------------- | ------------------------- | -------------------- | ---------------- |
| Amazon RDS Aurora db.r5.large   | 10 tables, each with 10 columns, 5000 rows of text data | 10               | Approximately 6 minutes | $0.07                 | $0.05               | $0.12             |
| Amazon RDS MySQL db.m5.xlarge   | 1000 tables, each with 100 columns, 1000 rows of text data | 10               | Approximately 11 hours | $0.07                 | $4.84               | $4.91             |

- China (Ningxia) Region Operated by NWCD (cn-northwest-1)

| Database Type                   | Data Volume                                      | Identifier Count | Detection Time | Detection Data Cost (CNY) | Scan Data Cost (CNY) | Total Cost (CNY) |
| ------------------------------- | ------------------------------------------------ | ---------------- | -------------- | ------------------------ | -------------------- | ---------------- |
| Amazon RDS Aurora db.r5.large   | 10 tables, each with 10 columns, 5000 rows of text data | 10               | Approximately 6 minutes | $0.5                  | $0.3                | $0.8              |
| Amazon RDS MySQL db.m5.xlarge   | 1000 tables, each with 100 columns, 1000 rows of text data | 10               | Approximately 11 hours | $0.5                  | $33.23              | $33.73            |


### Detecting sensitive data in the S3 bucket

- US East (N. Virginia) Region (us-east-1)

| File                                                                                   | Total Size | Identifier Count | Detection Time | Detection Data Cost (USD) | Scan Data Cost (USD) | Total Cost (USD) |
| -------------------------------------------------------------------------------------- | ---------- | ---------------- | -------------- | ------------------------ | -------------------- | ---------------- |
| Total 5,000 files, including PDF, WORD, JPG, TXT, etc.                                | 4GB        | 10               | Approximately 8 hours | $0.10                      | $1.29                 | $1.39             |
| Total 1,000 files, log files                                                         | 24GB       | 13               | Approximately 22 hours | $0.1                      | 9.97                 | 9.98             |
| Total 20,000 files, structured data such as CSV, JSON, etc.                           | 5GB        | 20               | Approximately 1 hour | $0.15                     | $0.34                 | $0.39             |

- China (Ningxia) Region Operated by NWCD (cn-northwest-1)

| File                                                                                   | Total Size | Identifier Count | Detection Time | Detection Data Cost (CNY) | Scan Data Cost (CNY) | Total Cost (CNY) |
| -------------------------------------------------------------------------------------- | ---------- | ---------------- | -------------- | ------------------------ | -------------------- | ---------------- |
| Total 5,000 files, including PDF, WORD, JPG, TXT, etc.                                | 4GB        | 10               | Approximately 8 hours | $0.61                     | $23.80                 | $24.41            |
| Total 1,000 files, log files                                                         | 24GB       | 13               | Approximately 22 hours | $0.42                     | $68.43                | $68.85            |
| Total 20,000 files, structured data such as CSV, JSON, etc.                           | 5GB        | 20               | Approximately 1 hour | $1                        | $2.32                 | $3.32             |

### AWS service pricing

Sensitive data detection jobs utilize [AWS Glue](https://aws.amazon.com/cn/glue/) and [Amazon SageMaker](https://www.amazonaws.cn/sagemaker/) services together to perform sensitive information detection. Therefore, the primary cost of sensitive data detection jobs comes from the runtime costs of these two services. You can refer to the following links to view the specific pricing of these two services in your Region.

- [Amazon SageMaker Pricing](https://www.amazonaws.cn/sagemaker/pricing/?nc1=h_ls)

- [Amazon Glue Pricing](https://www.amazonaws.cn/glue/pricing/?nc1=h_ls)


## Solution console

The deployment of the solution automatically creates a web-based console accessible through a browser. As of this revision, with default settings and an estimated access count of 1000, the following costs will be incurred:

- US East (N. Virginia) Region (us-east-1) for one month (calculated as 30 days):

| Service                                                       | Usage               | Monthly Cost (USD) |
| ------------------------------------------------------------- | -------------------- | ------------------ |
| Amazon Relational Database Service for MySQL Community Edition | 720 hours           | $97.92              |
| Amazon Relational Database Service Provisioned Storage         | 20 GB-month         | $4.6                |
| Amazon Elastic Compute Cloud NatGateway                        | 30 GB-month         | $1.35               |
|                                                               | 720 hours           | $32.4               |
| Athena                                                        | 0.010 TB            | $0.05               |
| CloudWatch                                                    | 0.100 GB-month      | $0.05               |
| Elastic Load Balancing - Application                          | 10 hours            | 0                  |
|                                                               | 0.105 LCU-hours     | 0                  |
| Lambda                                                        | 50000 Lambda-GB-sec | $0.08333            |
|                                                               | 10000 requests      | 0                  |
| Simple Queue Service (SQS)                                    | 100000 requests     | $0.04               |
| Simple Storage Service (S3)                                   | 2000 requests       | $0.01               |
|                                                               | 4000 requests       | $0.0002             |
|                                                               | 1 GB                | $0.023              |
| **Total**                                                     |                      | $136.53             |

- China (Ningxia) Region Operated by NWCD (cn-northwest-1) for one month (calculated as 30 days):

| Service                                                       | Usage                        | Monthly Cost (CNY) |
| ------------------------------------------------------------- | ----------------------------- | ------------------ |
| Amazon Relational Database Service for MySQL Community Edition | 720 hours                     | $576                |
| Amazon Relational Database Service Provisioned Storage         | 20 GB-Month                   | $30.62              |
| Amazon Elastic Compute Cloud NatGateway                        | 30 GB-Month                   | $11.1               |
|                                                               | 720 hours                     | $266.4              |
| Athena                                                        | 0.010 TB                      | $0.34               |
| CloudWatch                                                    | 0.100 GB-Month                | $0.24               |
| EC2 Container Registry (ECR)                                  | 0.003 GB-Month                | $0.69               |
| Elastic Load Balancing - Application                          | 10 hours                      | $1.56               |
|                                                               | 0.105 LCU-Hours               | 0                  |
| Lambda                                                        | 100,000.000 Lambda-GB-Second  | $11.35              |
|                                                               | 10,000 requests               | 0                  |
| Simple Queue Service                                          | 100,000 requests              | $3.33               |
| Simple Storage Service                                        | 2,000 requests                | $0.01               |
|                                                               | 4,000 requests                | $0.01               |
|                                                               | 0.032 GB-Month                | $0.176              |
| **Total**                                                     |                               | $901.82             |

## Cost Optimization Recommendations

The basic cost of performing detection jobs is billed on-demand, which means you only pay for the resources you actually use without needing to purchase or reserve any capacity in advance. Additionally, AWS provides some free usage credits to help you understand and evaluate your service usage. Therefore, we recommend using the [AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/) feature in the solution to help manage costs. All resources in this solution include a **tag** with the name *Owner* and the value *SDPS*. You can query the costs generated by the solution by applying [user-defined cost allocation tags](https://docs.aws.amazon.com/zh_cn/awsaccountbilling/latest/aboutv2/custom-tags.html#allocation-how). Prices may vary. For more information, please refer to the pricing pages for each AWS service used in this solution. Here are some cost optimization recommendations that you can implement when creating sensitive data detection jobs to reduce costs:

- Before performing sensitive information detection jobs, carefully select appropriate identifiers for sensitive information instead of selecting all.
  Having too many detection identifiers typically requires more time to complete the sensitive information detection. Before executing the detection task, adjust the identifiers using the add/remove sensitive information identifiers feature in the detection template to reduce the execution time of the detection task.

- Set an appropriate detection depth and sample size based on the actual data volume to accurately detect sensitive information.
  In detection scenarios with large data volumes and primarily structured information, such as RDS databases, selecting a smaller sample size can detect sensitive information and achieve cost optimization.

- Adjust the execution frequency of scheduled detection jobs based on the actual situation.
  The frequency of detection task execution has a significant impact on costs. If the data changes are not significant, you can choose on-demand scanning instead of scheduled scanning when creating sensitive information detection jobs to reduce the frequency of task execution.