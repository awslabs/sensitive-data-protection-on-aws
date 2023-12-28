# Connect to Data Sources - JDBC (Redshift)

When you wish to perform a sensitive data scan on a Redshift Cluster, you can use Redshift's database as a data source.

### Prerequisites - Maintain Network Connectivity
1. Please confirm that when you [add an AWS account](data-source.md), you choose the CloudFormation method. If you added an account using the JDBC method, please proceed to [Connect via EC2 Proxy](data-catalog-create-jdbc-rds-proxy.md) for operations.
2. Prepare Redshift connection credentials (username/password).

!!! Info "How to Obtain Redshift Credentials"
    DBAs or business teams create a read-only user for security audits. This user only needs read-only permissions.

## Connect to Amazon Redshift Data Source
1. From the left menu, select **Connect Data Source**
2. Choose the **AWS Cloud** tab
3. Click to enter an AWS account and open its detail page
4. Select the **Custom Database (JDBC)** tab
5. Click **Action**, **Add Data Source**
6. In the popup window, enter Redshift credential information. (If you choose the Secret Manager method, you need to manage the username/password for this Redshift in Secret Manager in advance.)

    | Parameter        | Required | Description                                                                                     |
    |------------------|----------|-------------------------------------------------------------------------------------------------|
    | Instance Name    | Yes      | Name of the database in the cluster                                                              |
    | Check SSL Connection | No   | Whether to connect via SSL                                                                       |
    | Description (Optional) | No | Description                                                                                     |
    | JDBC URL (Required) | Yes    | Fill in a Redshift database for connection and scanning. Format: `jdbc:redshift://url:port/databasename`. For example: `jdbc:redshift://sdp-uat-redshift.xxxxxxxxxx.us-east-1.redshift.amazonaws.com.cn:5439/dev`|
    | JDBC Databases   | No       | Keep empty                                                                                      |
    | Credentials      | Yes      | Choose username and password or SecretManager. Fill in the database username/password. The credentials can be obtained by a read-only user created by the DBA or business teams for the security team. This user only needs SELECT (read-only) permissions. |
    | VPC              | Yes      | Select the VPC where Redshift is located                                                        |
    | Subnet           | Yes      | Select the subnet in the VPC where Redshift is located                                          |
    | Security Group   | Yes      | Select the security group in the VPC where Redshift is located                                  |

7. Click **Connect**. You can wait 10s before closing this window.
8. You will see the catalog status turn to gray `PENDING`, indicating the connection is starting (about 3 minutes)
9. You will see the catalog status turn to blue `CRAWLING`. (about 15 minutes for 200 tables)
10. When you see the catalog status turn green `ACTIVE`, it means a data catalog has been created for the Redshift Cluster.

At this point, you have successfully connected the Redshift data source and can proceed to the next step 👉 [Define Classification and Grading Templates](data-identifiers.md).
