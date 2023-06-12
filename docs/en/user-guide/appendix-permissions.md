# Appendix: Permissions for agent CloudFormation stack

The solution follows the least privilege principle to grant permissions to monitored account(s) when deploying Agent CloudFormation template.
The Agent CloudFormation Stack basically set AWS roles and policies setup necessary permissions in target accounts to authorize the SDP solution. 

The permissions can be described at a high-level:

- (Data source) Amazon S3: read only permission for data source scanning.
- (Data source) Amazon RDS: read only permission for data source scanning. 
- AWS SecretsManager: read only permission. If RDS database is secured with Secrets, the solution will read credentials from Secret Manager.
- AWS Glue: write permission. Glue data catalog, Glue crawler, Glue job are used. Glue is triggered by Step Functions.
- AWS StepFunctions: resource created. Step Function is used to orchestrate Glue jobs for data discovery.
- AWS Lambda: resource created.
- Amazon CloudWatch: write permission. Lambda logs will be stored in CloudWatch.


!!! Info "For more information"
    You can view specific permission details in [Template for Monitored account (Agent template)](template.md)