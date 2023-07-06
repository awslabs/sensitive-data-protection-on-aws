# Connect to data source

After onboarding AWS accounts, you can create data catalogs for the data source.

!!! Info "Supported data types" - **Structured data and Semi-structured data are supported.**The solution uses AWS Glue to crawl these data into data catalogs. For specific data format supported by AWS Glue, please refer to [Built-in classifiers in AWS Glue](https://docs.aws.amazon.com/glue/latest/dg/add-classifier.html). - **Unstructured data (such as Image and PDF) is not supported.**

## Create data catalogs for S3 (manual)

1. On the **Connect to data source** page, click one account to open its details page.
2. In the **Amazon S3** tab, view a list of S3 buckets in the region where the solution is deployed.
3. Select a S3 bucket, and choose **Sync to data catalog** to create or update data catalog.

After several minutes, you can see **Catalog status** is `ACTIVE`, which indicates data catalogs are created for the S3 bucket.

You can also choose **Sync ALL to data catalog** from the **Actions** list to quickly create data catalogs for all S3 buckets of this AWS account.

## Create data catalogs for RDS (manual)

!!! Note "Prerequisite"
A RDS instance must at least 1 private subnet and also meet one of the conditions to be successfully connected:

        - It has [VPC NAT Gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html).
        - It has both [VPC Endpoints for S3](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html) and Glue Endpoint.
        - It has granted select permission to the database operation user corresponding to the solution.

1. On the **Connect to data source** page, click one account to open its details page.
2. Choose the **Amazon RDS** tab. You can see a list of RDS instances in the region where the solution is deployed.
3. Select a RDS instance, and choose **Sync to data catalog** to open a pop-up window asking for credentials. There are two options to enter the credentials:

   - Choose **Username/Password** and enter the username and password of the RDS instance.
   - Choose **Secret Manager** and select the Secret of the RDS. It will list all the Secrets in Secret Manager of the same account of the RDS.

4. Choose **Connect**. The solution will start testing connection, and it could take several minutes.

Once you see catalog status is `Active`, it indicates that data catalog is created for the RDS instance.
