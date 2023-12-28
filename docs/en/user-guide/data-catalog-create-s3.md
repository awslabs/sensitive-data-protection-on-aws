# Connect to Data Sources - S3
After adding a cloud account, you can connect to S3 data sources for sensitive data scanning, which also involves an authorization process.

!!! Info "Supported Data/File Types for Scanning"
    Please refer to [Appendix: Supported Data Types for Scanning](appendix-built-in-supported-datatypes.md).

### Prerequisites
If you need to scan unstructured data (such as documents, code, emails, images, etc.), please increase the Service quota.

* **Global regions**: Increase the SageMaker Processing Job instance quota for the region to be scanned through the [Service Quota service](https://console.aws.amazon.com/servicequotas/home).
* **China regions**: Please contact AWS sales to open a "Quota Increase Ticket" with the following content: 'Hello, please increase the parallel running number of SageMaker Processing Job ml.m5.2xlarge instances in this account's certain region (e.g., cn-northwest-1) to 100'.

## Connect to S3 Data Source
1. From the left menu, select **Connect Data Source**
2. Choose the **AWS Cloud** tab
3. Click to enter an AWS account and open its detail page.
4. In the **Amazon S3** tab, view the list of S3 buckets in the solution deployment region.
5. Choose an S3 bucket and click **Authorize**. Alternatively, you can also select **Bulk Authorize** from the **Action** list to quickly authorize all S3 buckets.
![edit-icon](docs/../../images/cn-s3-authorize.png) 
6. About half a minute later, you will see the **Authorization Status** turn green `ACTIVE`.

At this point, you have successfully connected to the S3 data source and can proceed to the next step 👉 [Define Classification and Grading Templates](data-identifiers.md).
