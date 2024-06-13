You can create and manage jobs for detecting sensitive data. Discovery jobs consist of one or more AWS Glue jobs used for actual data detection. For more information, please see [View Job Details](discovery-job-details.md).

## Create Discovery Job

From the left menu, select **Run Sensitive Data Discovery Job**. Click **Create Sensitive Data Discovery Job**.

**Step 1**: Choose Data Source

| Provider | Data source |
|----------------|--------------------|
| AWS            | S3, RDS, Glue, Custom databases，Proxy databases |
| Tencent        | JDBC               |
| Google         | JDBC               |

!!! Info "What are AWS CustomDB and ProxyDB?"  
    - If you are scanning within your own account and connecting to a JDBC data source, select CustomDB
    - If you added your account using CloudFormation and connected to a JDBC data source, select Custom databases
    - If you added your account using JDBC Only and connected to a JDBC data source, select Proxy databases

**Step 2**: Select specific database to be scanned

**Step 3**: Job Settings

| Job Setting | Description | Options |
| --- | --- | --- |
| Scan Frequency | Indicates the scan frequency of the discovery job. | On-demand<br> Daily<br> Weekly<br> Monthly |
| Sampling Depth | Indicates the number of sampled rows. | 100 (Recommended)<br> 10, 30, 60, 100, 300, 500, 1000 |
| Sampling Depth - Unstructured Data | Applicable only to S3, the number of unstructured files sampled per folder. | Skip, 10 files, 30 files, All files |
| Scan Scope | Defines the overall scan scope of the target data source. <br> "Comprehensive Scan" means scanning all target data sources. <br> "Incremental Scan" means skipping data sources unchanged since the last data directory update. | Comprehensive Scan<br> Incremental Scan (Recommended) |
| Detection Threshold | Defines the tolerance level required for the job. If the sampling depth is 1000 rows, a threshold of 10% means if more than 100 rows (out of 1000 rows) match the identifier rules, the column will be flagged as sensitive. A lower threshold indicates lower tolerance. | 10% (Recommended)<br> 20%<br> 30%<br> 40%<br> 50%<br> 100% |
| Overwrite Privacy Tags Manually Updated | Choose whether to allow the job to overwrite data directory privacy tags with job results. | Do Not Overwrite (Recommended)<br> Overwrite |

**Step 4**: Advanced Configuration Items
**Step 5**: Job Preview
    After previewing the job, select **Run Job**.

---

### About Incremental Scan:
When choosing "Incremental Scan" in the job settings, the scan logic for S3 and RDS differs slightly as follows:

S3: When any changes occur in S3 objects, the incremental scan scans at the folder level.

- Example: With 1 bucket and 3 folders, each containing a CSV file (with different schemas), if the schema of one folder's file changes, the job will only scan the CSV files in that folder during incremental scanning, skipping the other 2 folders.

- Example: With 1 bucket and 3 folders, each containing a CSV file (with different schemas), if there are no schema changes but additional rows are added or any file updates occur in one folder, the job will only scan the CSV files in that folder during incremental scanning, skipping the other 2 folders.

RDS: Only when there are column-level changes in RDS tables does the incremental scan scan the table.

- Example: With 1 RDS instance and 3 tables, if the schema of one table changes (adding or deleting columns), the job will only scan that table during incremental scanning, skipping the other 2 tables.
- Example: With 1 RDS instance and 3 tables, if there are no schema changes but rows are added/deleted, none of these 3 tables will be scanned during incremental scanning.
