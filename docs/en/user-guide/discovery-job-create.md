You can create and manage jobs for detecting sensitive data. A discovery job consists of one or many AWS Glue jobs for actual data detection. For more information, refer to [View job details](discovery-job-details.md).

## Create a discovery job

1. Sign in to the solution's web portal.
2. Choose **Run sensitive data discovery jobs** in the **Summary** area. Alternatively, from the left navigation pane, choose **Run sensitive data discovery jobs** to open its page. 
3. Choose **Create sensitive data discovery job**. You'll need to go through the following steps to create a new discovery job.

    - **Step 1: Select the S3 data source**
    - **Step 2: Select the RDS data source**
    - **Step 3: Job settings** (see the section *Job setting details*)
    - **Step 4: Job preview**

4. After previewing the job, choose **Run job**.

## Job setting details

| Job setting | Description | Options |
| --- | --- | --- |
| Scan frequency | Refers to the scan frequency of the discovery job. | On-demand run<br> Daily<br> Weekly<br> Monthly |
| Scan depth | Refers to the number of sampled rows. |  1000(recommended)<br> 100 |
| Scan range | Defines the overall scan range for the target data source. <br> "Full scan" means to scan all target data sources.<br>"Incremental scan" means to skip those data sources that were not changed since the last data catalog update. |  Full scan<br> Incremental scan (recommended) |
| Detection threshold | Defines the level of tolerance required for the job. If the scan depth is 1000 rows, a 10% threshold means that if over 100 rows (out of 1000) match the identifier rule, then the column will be labeled as sensitive. A lower threshold indicates that the job is less tolerant of sensitive data. |  10% (recommended)<br> 20%<br> 30%<br> 40%<br> 50%<br> 100% |
| Override privacy labels that are updated manually | Choose whether to allow the job to override the data catalog privacy label with the job result. |  Do not override (recommended)<br> Override |

### About Incremental Scanning:
When the "Incremental Scan" setting is selected in the job, the scanning logic for S3 and RDS is slightly different, as follows:

S3: When there is any change to an S3 object, the incremental scan will scan the Folder level of that path.

- For example: there is 1 bucket with 3 folders, each containing a CSV file with a different schema. When the schema of the files in 1 folder is changed, during incremental scanning, the job will only scan the CSV files in that folder, not the other 2 folders.

- For example: there is 1 bucket with 3 folders, each containing a CSV file with a different schema. When the schema of the files in 1 folder remains the same but the number of rows is increased or the file is updated in any way, during incremental scanning, the job will only scan the CSV files in that folder, not the other 2 folders.

RDS: Only when there is a column-level change to an RDS table will the incremental scan scan that table.

- For example: there is 1 RDS instance with 3 tables. When the schema of 1 table is changed (a column is added or deleted), during incremental scanning, only that table will be scanned, and the other two tables will be skipped.

- For example: there is 1 RDS instance with 3 tables. When the schema of 1 table remains the same but rows are added or deleted, during incremental scanning, none of the 3 tables will be scanned.