# Frequently Asked Questions

For specific UI error messages, please refer to the [Troubleshooting section](troubleshooting.md).

## About Solution Installation/Upgrade/Uninstallation
**After installing the solution, it uses an ALB address. Can I use a custom domain name?**

Yes, you can configure a custom domain name (such as a company's second-level domain) by configuring DNS. Specifically, you need to ask the DNS administrator to point the CName of the custom domain to the ALB address, and then update the parameters of CloudFormation by filling in the custom domain name.

**Why does the Admin CloudFormation of the solution need a NAT Gateway in the VPC?**

The Admin program is in Lambda, which has no public IP. Lambda needs to access services such as S3, StepFunction, and Glue, so a NAT Gateway is needed.

## About Connecting to AWS Accounts and Data Sources
**What data types/file types does the solution support? Is there a specific list?**

The solution currently supports structured/semi-structured data mainly using the native capabilities of AWS Glue. For a specific list, please refer to [Built-in classifiers in AWS Glue](https://docs.aws.amazon.com/glue/latest/dg/add-classifier.html).

**I want to scan an RDS instance that is publicly accessible. How do I operate it?**

By default, the solution does not support scanning databases that are publicly accessible because production databases are usually not publicly accessible. To do so, you need to change the solution code. 

Open the *Service.py* file in the Lambda function with prefix `Sdp-admin` in the Lambda console and comment out the following code. This code change will allows the SDPS solution to access publicly accessible databases.

    ```
    if public_access:
      raise BizException(...)
    ```

**Why do I need a NAT Gateway or Endpoint when connecting to RDS?**

When using the solution, the following operations need to be automated:

- Read secret information from SecretsManager during Glue Job execution (when using Secret to save RDS password);
- Read catalog information from Glue;
- Write the result to S3 after the check is completed.

Because RDS is usually in a private subnet in the VPC, a NAT gateway or Glue endpoint, S3 endpoint, and SecretsManager endpoint are required (all three endpoints are required at the same time). If connecting to the database using a username and password, only the first two endpoints are needed. If Secrets are encrypted using KMS, the KMS endpoint is also required.

## About Data Catalog
**How the incremental scanning works? Will new tables be scanned? Will changes to fields be scanned?**

Please refer to the "About Incremental Scanning" section in the [Create Job](user-guide/discovery-job-create.md) document.

**If one of the fields in a table is changed, will the other fields be rescanned? Will the previous identification be overwritten?**

Yes. If any field changes (i.e., the schema changes), the entire table will be rescanned by the job. After the job is completed, the overwrite is done at the column level (field). There are two cases:

- If a column has been manually marked with an identifier (last updated by is not System), and the "Do not overwrite manual marks" setting is selected in the job, the previous identification will not be overwritten.

- If a column has not been modified by an identifier (last updated by is System), the previous identification will not be overwritten.

**If a data field is not encrypted and is later encrypted, will it no longer be identified as sensitive data?**

In general, if a field is encrypted and does not contain plaintext sensitive data, it will not be identified as sensitive data, which means job will not mark any identifiers after scanning. 

There is only one exception: if the field has previously been manually marked with an identifier (last updated by is not System), and the "Do not overwrite manual marks" setting is selected in the job, the job will not modify the field after scanning, and the identifier will still exist.

## About Data Classification Templates


## About Sensitive Data Discovery Jobs
**What does the "score" in the exported data mean? Does it represent the proportion of sensitive data to 1000 records?**

Yes. The score is defined as the number of rows in which the identifier appears divided by the total number of rows (default is 1000 rows). Only fields with a score greater than the sensitivity threshold (default is 10%) in the job setting are defined as sensitive data.