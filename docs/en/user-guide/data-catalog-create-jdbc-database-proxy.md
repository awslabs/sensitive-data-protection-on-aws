# Connect to Data Sources - JDBC (Database Proxy)
When your RDS/database is in a private network and there are strict IP restrictions (only fixed IPs are allowed for access), you need to connect to the data source in this way.

### Prerequisites - Maintain Network Connectivity
1. Please ensure when you [add an AWS account](data-source.md), choose the JDBC method, then proceed to [Connect to Data Source - RDS](data-catalog-create-jdbc-database-proxy.md) for operations.
2. Create a Database Proxy: Create an EC2 in the VPC where the solution resides to act as a proxy machine. Refer to the steps in: [Appendix: Creating a Database Proxy](appendix-database-proxy.md).
3. Add RDS to the whitelist: Add the EC2 IP to the Inbound Rule of the Security Group for the database to be scanned.

## Connect to the Database Through EC2 Database Proxy (DB Proxy)
1. In the left menu, select **Connect Data Source**
2. Choose the cloud account you wish to scan, click to enter the account, and open the details page
3. Click to enter a cloud account, open the details page
4. Select the **Custom Database (JDBC)** tab
5. Click **Action**, **Add Data Source**

    | Parameter        | Required | Description                                                                                      |
    |------------------|----------|--------------------------------------------------------------------------------------------------|
    | Instance Name    | Yes      | Database instance name                                                                           |
    | Check SSL Connection | No   | Whether to connect via SSL                                                                       |
    | Description (Optional) | No | Instance description                                                                             |
    | JDBC URL (Required) | Yes    | Fill in at least one database under the database instance for connection and scanning. Format: `jdbc:mysql://ec2_public_ip:port/databasename` |
    | JDBC Databases   | No       | List all databases in this instance that need to be scanned, including the required database above. Click the button to "Auto Query Database List" |
    | Credentials      | Yes      | Choose username and password or SecretManager. Enter the database username/password.             |
    | VPC              | Yes      | Select the VPC where the Proxy resides                                                           |
    | Subnet           | Yes      | Select the subnet in the VPC where the Proxy resides                                             |
    | Security Group   | Yes      | Select the security group in the VPC where the Proxy resides                                     |
    !!! Info "Auto Retrieve Database Button"
        The solution currently supports auto-retrieval of MySQL databases.

6. Choose the database instance, click the button **Sync to Data Catalog**
7. You will see the catalog status turn to gray `PENDING`, indicating the connection is starting (about 3 minutes)
8. You will see the catalog status turn to blue `CRAWLING` (about 15 minutes for 200 tables)
9. When you see the catalog status turn to green `ACTIVE`, it means a data catalog has been created for the RDS instance. At this point, you can click on the corresponding data catalog link for a preliminary view and subsequent scanning tasks.

At this point, you have established a connection to the RDS proxy's data source via JDBC and can proceed to the next steps.
