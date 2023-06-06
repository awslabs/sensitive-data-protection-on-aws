# Appendix: Permissions for agent CloudFormation stack

The solution follows the least privilege principle to only create needed permissions. High level concept for permission:

# Solution Stack

# Agent Stack

The Agent CloudFormation Stack automatically set AWS roles and policies to read data sources and setup necessary permissions in target accounts to authorize SDPS. 

- (Data source) Amazon S3: read only permission for data source scanning.
- (Data source) Amazon RDS: read only permission for data source scanning. 
- AWS SecretsManager: read only permission. If RDS database is secured with Secrets, we will read credentials from Secret Manager.
- AWS Glue: write permission. Glue data catalog, Glue crawler, Glue job are used. Glue is triggered by Step Functions.
- AWS StepFunctions: resource created. Step Function is used to orchestrate Glue jobs for data discovery.
- AWS Lambda: resource created.
- Amazon CloudWatch: write permission. Lambda logs will be stored in Cloudwatch.
Note: AWS will provide the file of detailed IAM policy. [!!! TODO]

# Organization Stack
