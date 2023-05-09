Deploying this solution with the default parameters builds the following environment in the AWS Cloud.

The solution uses the AWS Glue service as a core for building data catalog in the monitored account(s) and for invoking the Glue Job for sensitive data PII (Personal Identifiable Information) detection. The distributed Glue job runs in each monitored account, and the admin account contains a centralized data catalog of data stores across AWS accounts. This is an implementation of the Data Mesh concept recommended by AWS.

![architecture](docs/../../images/arch.png)
*Figure 1: SDPS architecture*

To be more specific, the solution introduced an event-driven process and uses AWS IAM roles to trigger and communicate between the admin account and the monitored account(s) for sensitive data discovery jobs. All monitored AWS accounts are permitted to be connected to the admin account, which is able to distinguish and access the monitored accounts. For example, the admin account can start PII detection jobs and retrieve data catalogs.

1. The Application Load Balancer distributes the solution's frontend web UI assets hosted in AWS Lambda. 
2. Okta (or other Identity provider, IdP) provides user authentication. 
3. The Lambda function is packaged as Docker images and stored in the Amazon Elastic Container Registry. 
4. The backend Lambda function is a target for the Application Load Balancer. 
5. The backend Lambda function invokes AWS Step Functions in monitored accounts for sensitive data detection. 
6. The AWS Glue Crawler runs to take inventory of the data stores and is stored in the Glue Database as metadata tables. 
7. The Glue Job tags sensitive data (PII) detection results to the Glue Database. 
8. The Step Functions send Amazon SQS messages to the detection job queue after the Glue Job has run. 
9. The Amazon SQS queue serves as an event source for the Lambda function. 
10. The Lambda function stores detection results to an Aurora MySQL instance in Amazon RDS.