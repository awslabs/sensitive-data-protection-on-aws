You can create and manage jobs to detect sensitive data. Discovery jobs consist of one or more AWS Glue jobs for actual data detection. For more information, see [Viewing Job Details](discovery-job-details.md).

## Create Discovery Jobs

1. In the left menu, select **Run Sensitive Data Discovery Job**.
2. Choose **Create Sensitive Data Discovery Job**.
![edit-icon](docs/../../images/job-list-cn.png)

    - **Step 1: Select Data Source**

        | Provider | Data source |
        |----------|-------------|
        | AWS      | S3, RDS, Glue, JDBC |
        | Tencent  | JDBC        |
        | Google   | JDBC        |

    - **Step 2: Job Settings**

        | Job Setting              | Description | Options |
        |--------------------------|-------------|---------|
        | Scan Frequency           | Indicates the scan frequency of the discovery job. | On-demand<br> Daily<br> Weekly<br> Monthly |
        | Scan Depth               | Indicates the number of sample rows. | 100 (Recommended)<br> 10, 30, 60, 100, 300, 500, 1000 |
        | Scan Depth - Unstructured Data | Applies only to S3, samples the number of unstructured files in different folders. | Can Skip, 10 files, 30 files, All files |
        | Scan Scope               | Defines the overall scan scope of the target data source.<br> "Full Scan" scans all target data sources.<br> "Incremental Scan" skips data sources unchanged since the last data catalog update. | Full Scan<br> Incremental Scan (Recommended) |
        | Detection Threshold      | Defines the job's tolerance level required. If the scan depth is 1000 rows, a 10% threshold means that if more than 100 rows (out of 1000) match the identifier rules, the column will be marked as sensitive. A lower threshold indicates lower tolerance for sensitive data. | 10% (Recommended)<br> 20%<br> 30%<br> 40%<br> 50%<br> 100% |
        | Override Manual Privacy Labels | Choose whether to allow this job to use job results to override privacy labels in the data catalog. | Do Not Override (Recommended)<br> Override |

    - **Step 3: Advanced Configuration**
    
    - **Step 4: Job Preview**

3. After previewing the job, select **Run Job**.

### About Incremental Scanning:
When the "Incremental Scan" setting is selected in the job, the scanning logic for S3 and RDS is slightly different, as follows:

S3: When there is any change to an S3 object, the incremental scan will scan the Folder level of that path.

- For example: there is 1 bucket with 3 folders, each containing a CSV file with a different schema. When the schema of the files in 1 folder is changed, during incremental scanning, the job will only scan the CSV files in that folder, not the other 2 folders.

- For example: there is 1 bucket with 3 folders, each containing a CSV file with a different schema. When the schema of the files in 1 folder remains the same but the number of rows is increased or the file is updated in any way, during incremental scanning, the job will only scan the CSV files in that folder, not the other 2 folders.

RDS: Only when there is a column-level change to an RDS table will the incremental scan scan that table.

- For example: there is 1 RDS instance with 3 tables. When the schema of 1 table is changed (a column is added or deleted), during incremental scanning, only that table will be scanned, and the other two tables will be skipped.

- For example: there is 1 RDS instance with 3 tables. When the schema of 1 table remains the same but rows are added or deleted, during incremental scanning, none of the 3 tables will be scanned.