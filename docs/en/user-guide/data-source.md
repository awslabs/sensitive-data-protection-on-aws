# Connect to Data Sources

## Add AWS Account

1. In the left menu, select **Connect Data Source**.
2. Choose the AWS Cloud tab.
3. Click the button **Add New Account**.
  ![edit-icon](docs/../../images/account-list-cn.png)
4. Choose one of the following methods to add an account:

    #### Method 1: Authorization via CloudFormation (Applicable for the same AWS region, automatically discovers S3, RDS, AWS Glue)
    1. Open the **Standalone AWS Account** tab
    2. Follow the instructions in **Step 1** and **Step 2** on this page to install the Agent CloudFormation stack (about 3 mins), which is used for authorizing the account to be scanned. For detailed permission information, please refer to [Appendix: Permissions of the Agent CloudFormation Stack](./appendix-permissions.md)
    3. Fill in the AWS account ID to be scanned and select the region where the data source is located.
    4. Click the button **Add This Account**.

    #### Method 2: Connect to Databases via JDBC (Applicable for multiple AWS regions, manually add databases, such as Redshift, EC2 self-built databases, multi-cloud databases)
    5. Open the **JDBC Only** tab.
    6. Select regions
    7. Fill in the AWS account ID
    8. Click the button **Add This Account**

    #### Method 3: Batch Add via CloudFormation Authorization (Applicable for the same AWS region, automatically discovers S3, RDS, AWS Glue. Manage accounts in bulk through AWS Organization)
    9. Open the **JDBC Only** tab
    10. Follow the instructions in **Step 1**, **Step 2**, and **Step 3** on this page to install the Agent CloudFormation stack. For more information, see [Appendix: Adding AWS Accounts via Organization](appendix-organization.md).
    11. Fill in the AWS Organization's agent account ID
    12. Click the button **Add This Account**

## Add Other Cloud Accounts

1. In the left menu, select **Connect Data Source**.
2. Choose the tab for the Cloud Provider you need to add (such as Tencent, Google).
3. Click the button **Add New Account**.
  
    #### Connect to Databases via JDBC (Applicable for multi-cloud or IDC, manually add databases)
    1. Fill in the account ID
    2. Select regions
    3. Click the button **Add This Account**
