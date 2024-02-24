# Connect to Data Sources - JDBC

When you want to scan a specific type of database for sensitive data, you can use the DB instance or databases as a data source.

| Supported Database Types        |
|---------------------------------|
| Amazon Redshift                 |
| Amazon Aurora                   |
| Microsoft SQL Server            |
| MySQL                           |
| Oracle                          |
| PostgreSQL                      |
| Snowflake                       |
| Amazon RDS for MariaDB          |

### Prerequisites - Maintain Network Connectivity
1. Please confirm that when you [add an AWS account](data-source.md), you choose the CloudFormation method. If you added the account using the JDBC method, please go to [Connect via EC2 Proxy](data-catalog-create-jdbc-db-proxy.md) for operations.
2. Ensure that the inbound rule of the database to be scanned includes a self-reference of its security group. See [official documentation](https://docs.aws.amazon.com/glue/latest/dg/setup-vpc-for-glue-access.html) for details.
3. Prepare Redshift connection credentials (username/password).

!!! Info "How to Obtain Database Credentials"
    DBAs or business teams create a read-only user for security audits. This user only needs read-only permissions: `GRANT SHOW VIEW, SELECT ON *.* TO 'reader'@'%'`
    
## Connect to Amazon Redshift Data Source
1. From the left menu, select **Connect Data Source**
2. Choose the **AWS Cloud** tab
3. Click to enter an AWS account and open its detail page
4. Select the **Custom Database (JDBC)** tab
5. Click **Action**, **Add Data Source**
6. In the popup window, enter Redshift credential information. (If you choose Secret Manager, you need to manage the username/password for this Redshift in Secret Manager in advance.)

    | Parameter        | Required | Description                                                                                     |
    |------------------|----------|-------------------------------------------------------------------------------------------------|
    | Instance Name    | Yes      | Database name                                                                                   |
    | Check SSL Connection | No   | Whether to connect via SSL                                                                      |
    | Description (Optional) | No | Instance description                                                                            |
    | JDBC URL (Required) | Yes    | Fill in a database for connection and scanning. See the table below for the specific format.    |
    | JDBC Databases   | No       | If you want to display multiple databases in a data catalog, fill in the database list. For example, for one data catalog per database instance, you can fill in multiple databases under the instance. If you only want to scan one database under this instance, leave it empty. |
    | Credentials      | Yes      | Choose username and password or SecretManager. Enter the database username/password.            |
    | VPC              | Yes      | Select the VPC where the database is located                                                    |
    | Subnet           | Yes      | Select the subnet in the VPC where the database is located                                      |
    | Security Group   | Yes      | Select the security group in the VPC where the database is located                              |

7. Click **Connect**. You can wait 10 seconds before closing this window.
8. You will see the catalog status turn to gray `PENDING`, indicating the connection is starting (about 3 minutes).
9. You will see the catalog status turn to blue `CRAWLING`. (about 15 minutes for 200 tables)
10. When you see the catalog status turn green `ACTIVE`, it means a data catalog has been created for the Redshift Cluster.

At this point, you have successfully connected the Redshift data source and can proceed to the next step 👉 [Define Classification and Grading Templates](data-identifiers.md).

!!! Info "JDBC URL Formats and Examples"

    | JDBC URL                                        | Example                                                                                      |
    |-------------------------------------------------|----------------------------------------------------------------------------------------------|
    | Amazon Redshift                                 | `jdbc:redshift://xxx.us-east-1.redshift.amazonaws.com:8192/dev`                              |
    | Amazon RDS for MySQL                            | `jdbc:mysql://xxx-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:3306/employee`             |
    | Amazon RDS for PostgreSQL                       | `jdbc:postgresql://xxx-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:5432/employee`        |
    | Amazon RDS for Oracle                           | `jdbc:oracle:thin://@xxx-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:1521/employee`      |
    | Amazon RDS for Microsoft SQL Server             | `jdbc:sqlserver://xxx-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:1433;databaseName=employee` |
    | Amazon Aurora PostgreSQL                        | `jdbc:postgresql://employee_instance_1.xxxxxxxxxxxx.us-east-2.rds.amazonaws.com:5432/employee` |
    | Amazon RDS for MariaDB                          | `jdbc:mysql://xxx-cluster.cluster-xxx.aws-region.rds.amazonaws.com:3306/employee`            |
    | Snowflake (Standard Connection)                 | `jdbc:snowflake://account_name.snowflakecomputing.com/?user=user_name&db=sample&role=role_name&warehouse=warehouse_name` |
    | Snowflake (AWS PrivateLink Connection)          | `jdbc:snowflake://account_name.region.privatelink.snowflakecomputing.com/?user=user_name&db=sample&role=role_name&warehouse=warehouse_name` |
