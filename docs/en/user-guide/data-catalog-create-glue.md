# Connect to Data Sources
After adding an AWS account, you can connect to AWS Glue Data Catalogs to scan data sources that use AWS Glue as a data catalog (metadata catalog).

## Connect to AWS Glue Data Source

!!! Info "Supported Big Data Data Types"
    For specific data formats supported by AWS Glue, please refer to [Built-in Classifiers in AWS Glue](https://docs.aws.amazon.com/glue/latest/dg/add-classifier.html).
    
    Additionally, the solution also supports Glue Hudi tables.

1. On the **Connect Data Sources** page, click an account to open its details page.
2. On the **Glue Data Catalogs** tab, select a Glue connection, then choose **Sync to Data Catalog**.
3. You will see the catalog status turn to gray `PENDING`, indicating the connection is starting (about 3 minutes).
4. When you see the catalog status turn to green `ACTIVE`, it means the Glue Data Catalog has been synchronized to the SDP platform's data catalog.

At this point, you have successfully connected to the Glue Data Catalog and can proceed to the next steps.
