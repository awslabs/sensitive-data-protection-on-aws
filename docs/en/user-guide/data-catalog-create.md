# Connect to data source
After onboarding AWS accounts, you can create data catalogs for the data source.

## Create data catalogs for S3 (manual)

1. On the **Connect to data source** page, click one account to open its details page.
2. In the **Amazon S3** tab, view a list of S3 buckets in the region where the solution is deployed. 
3. Select a S3 bucket, and choose **Connect** to create data catalog. 

After several minutes, you can see **Catalog status** is `ACTIVE`, which indicates data catalogs are created for the S3 bucket. 

You can also choose **Connect All** to quickly create data catalogs for all S3 buckets of this AWS account.

## Create data catalogs for S3 (automatic)

In case you have no knowledge about the content stored in data source, you can skip the manual catalog creation step, and rely on sensitive data discovery job to create the data catalogs for you.

When creating the job, you can choose either **All buckets in all AWS accounts** or **All buckets in specific AWS accounts** as the target for scanning. It will automatically create data catalogs at AWS account level (not for specific bucket). For more details, please refer to [sensitive-data-discovery-job](discovery-job-create.md).


## Create data catalogs for RDS (manual)

!!! important "Important"
        A RDS instance must meet one of the conditions to be successfully connected:
        
        - It has [VPC NAT Gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html).
        - It has both [VPC Endpoints for S3](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html) and Glue Endpoint.

1. On the **Connect to data source** page, click one account to open its details page.
2. Choose the **Amazon RDS** tab. You can see a list of RDS instances in the region where the solution is deployed. 
3. Select a RDS instance, and choose **Connect** to open a pop-up window asking for credentials. There are two options to enter the credentials:
    - Choose **Username/Password** and enter the username and password of the RDS instance.
    - Choose **Secret Manager** and select the Secret of the RDS. It will list all the Secrets in Secret Manager of the same account of the RDS.

4. Choose **Connect**. The solution will start testing connection, and it could take several minutes.

Once you see catalog status is `Active`, it indicates that data catalogs are created for the RDS instance. 


