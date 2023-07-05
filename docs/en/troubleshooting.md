# Troubleshooting

## About Connecting to AWS Accounts and Data Sources

**When connecting to RDS, an error occurred: ```At least one security group must open all ingress ports.```**

Assign the default security group of the VPC where the RDS is located. This is a requirement of Glue, see details at [https://docs.aws.amazon.com/glue/latest/dg/glue-troubleshooting-errors.html](https://docs.aws.amazon.com/glue/latest/dg/glue-troubleshooting-errors.html).

After assigning the security group to the RDS, you need to delete the corresponding data catalog in SDP, and then click "Sync to Data Catalog" again. This operation will allow the backend to retrieve the latest configuration of the RDS and create the data catalog successfully.

**When connecting to RDS, an error occurred ```VPC S3 endpoint validation failed for SubnetId: subnet-000000. VPC: vpc-111111. Reason: Could not find S3 endpoint or NAT gateway for subnetId: subnet-000000 in Vpc```**

This error occurs after manually deleting the NAT Gateway or S3 endpoint (type is Gateway). To fix it, try to add a NAT Gateway or S3 endpoint and configure the route to resolve the issue.

**After deleting the Agent CloudFormation in the monitored, an error occurred when trying to delete the AWS account in the main account: `An error occurred (AccessDenied) when calling the AssumeRole operation: User: arn:aws:sts::5566xxxxxxx:assumed-role/SDPSAPIRole-us-east-1/SDPS-Admin-APIAPIFunction719F975A-yEQ3iOlIYK1F is not authorized to perform: sts:AssumeRole on resource: arn:aws:iam::8614xxxxxxx:role/SDPSRoleForAdmin-us-east-1`**

You need to wait for 5-8 minutes after deleting the Agent CloudFormation before attempting to delete the AWS account in SDP UI, otherwise this error may occur. If the error occurs, please re-try to delete the AWS account on UI after 10 minutes.

## About Sensitive data discovery jobs
**When using the solution in China Regions, it is not possible to download the template snapshot and report files.**

This is because the template snapshot and report are downloaded from S3 using pre-signed URLs, so the account where Admin is located must have ICP filing or ICP Exception.