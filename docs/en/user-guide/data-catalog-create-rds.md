# Connect to Data Sources - RDS

### Prerequisites - Maintain Network Connectivity
1. Please confirm that when you [add an AWS account](data-source.md), you choose the CloudFormation method. If you added the account using the JDBC method, please go to [Connect via EC2 Proxy](data-catalog-create-jdbc-rds-proxy.md) for operations.
2. Ensure that the inbound rule of the RDS to be scanned includes a self-reference of its security group. See [official documentation](https://docs.aws.amazon.com/glue/latest/dg/setup-vpc-for-glue-access.html) for details.
3. Ensure that the Amazon RDS instance's VPC has at least one private subnet.
4. Ensure that the RDS's VPC meets one of the following conditions: 1) It has a [VPC NAT Gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html). 2) It has VPC Endpoints for S3, Glue, KMS, and Secret Manager services. (See [official documentation](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html)).
5. Prepare RDS connection credentials (username/password).

!!! Info "How to Obtain RDS Credentials"
    DBAs or business teams create a read-only user for security audits. This user only needs database SELECT (read-only) permissions.

## Connect to Amazon RDS Data Source
1. From the left menu, select **Connect Data Source**
2. Choose the **AWS Cloud** tab
3. Click to enter an AWS account and open its detail page
4. Select the **Amazon RDS** tab. You can see the list of RDS instances in the solution deployment region
5. Choose an RDS instance and click the button **Sync to Data Catalog**
6. In the popup window, enter RDS credential information. (If you choose the Secret Manager method, you need to manage the username/password for this RDS in Secret Manager in advance.)

    | Parameter        | Required | Description                                                       |
    |------------------|----------|-------------------------------------------------------------------|
    | Credentials      | Yes      | Choose username and password or SecretManager. Enter the database username/password.        |

7. Click **Connect**. You can wait 10 seconds before closing this window.
8. You will see the catalog status turn to gray `PENDING`, indicating the connection is starting (about 3 minutes).
9. You will see the catalog status turn to blue `CRAWLING`. (about 15 minutes for 200 tables)
10. When you see the catalog status turn green `ACTIVE`, it means a data catalog has been created for the RDS instance.

At this point, you have successfully connected the RDS data source and can proceed to the next step 👉 [Define Classification and Grading Templates](data-identifiers.md).
