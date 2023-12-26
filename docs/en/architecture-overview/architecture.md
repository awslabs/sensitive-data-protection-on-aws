Deploying this solution with the default parameters builds the following environment in the AWS Cloud.

![architecture](docs/../../images/arch.png)
**Sensitive Data Protection on AWS architecture**

1. The [Application Load Balancer](https://aws.amazon.com/alb/) distributes the solution's frontend web UI assets hosted in [AWS Lambda](https://aws.amazon.com/lambda/). 
2. Identity provider for user authentication. 
3. The AWS Lambda function is packaged as Docker images and stored in the [Amazon ECR (Elastic Container Registry)](https://aws.amazon.com/ecr/). 
4. The backend Lambda function is a target for the Application Load Balancer. 
5. The backend Lambda function invokes [AWS Step Functions](https://aws.amazon.com/step-functions/) in monitored accounts for sensitive data detection. 
6. In [AWS Step Functions](https://aws.amazon.com/step-functions/) workflow, the [AWS Glue](https://aws.amazon.com/glue/) Crawler runs to take inventory of the structured data sources and is stored in the Glue Database as metadata tables.[Amazon SageMaker](https://aws.amazon.com/sagemaker/) processing job is used to preprocess unstructured file in S3 buckets, and store metadata in the Glue database.AWS Glue Job is used to detect sensitive data.
7. The Step Functions send [Amazon SQS](https://aws.amazon.com/sqs/) messages to the detection job queue after the Glue job has run. 
8. Lambda function processes messages from Amazon SQS.
9. The [Amazon Athena](https://aws.amazon.com/athena/) query detection results and save to MySQL instance in [Amazon RDS](https://aws.amazon.com/rds/).

The solution uses the AWS Glue service as a core for building data catalog in the monitored account(s) and for invoking the Glue Job to detect sensitive data Personal Identifiable Information (PII). The distributed Glue job runs in each monitored account, and the admin account contains a centralized data catalog of data sources across AWS accounts. This is an implementation of the Data Mesh concept recommended by AWS.

To be more specific, the solution introduces an event-driven process and uses AWS IAM roles to trigger and communicate between the admin account and the monitored account(s) for sensitive data discovery jobs. The admin account can start PII detection jobs and retrieve data catalogs. All monitored AWS accounts are permitted to be connected to the admin account, which is able to distinguish and access the monitored accounts.