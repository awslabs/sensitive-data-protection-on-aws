# Connect to data source
After onboarding AWS accounts to this platform, you can create data catalogs for the data source (a.k.a connect to data source).

## Create data catalogs for S3 (manual)
On the AWS account details page, in the **S3** tab, you can see a list of S3 buckets (of the region where the solution is deployed). 

Select a S3 bucket, click **"Connect"** to create data catalog for it. It could takes 2-5 mins, once you see catalog status is Active, this means the SDPS had created data catalogs for the RDS instance. 

You can also click **"Connect All"** to quickly create data catalogs for all S3 bucket of this AWS account.

## Create data catalogs for S3 (automatic)
In case you don't know about the content stored in data source, you can skip the manual catalog creation step, and rely the on sensitive data discovery job to create the data catalogs for you.

When creating job, you can choose either of the following options as S3 target for scanning. These options will automatically create data catalogs at AWS account level (not for specific bucket). For more details, please refer to [sensitive-data-discovery-job](discovery-job-create.md).

- All buckets in all AWS accounts
- All buckets in specific AWS accounts

## Create data catalogs for RDS (manual)

On the AWS account details page, in the **RDS** tab, you can see a list of RDS instances (of the region where the solution is deployed). 

Select a RDS instance, click **"Connect"**, there will be a pop-up window asking for credentials. There are two options to input the credentials:

- Choose "Username/Password" and type in the username and password of the RDS instance
- Choose "Secret Manager". The SDPS will list all the Secrets in Secret Manager of the same account of the RDS. You can select the Secret of the RDS.

Then click **"Connect"** in the pop-up window, the solution will start testing connection, it could takes 2-5 mins. Once you see catalog status is Active, this means the SDPS had created data catalogs for the RDS instance. 

> A RDS instance must meet one of the conditions to be successfully connected:
- It has [VPC NAT Gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- It has both [VPC Endpoints for S3](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html) and Glue Endpoint.
