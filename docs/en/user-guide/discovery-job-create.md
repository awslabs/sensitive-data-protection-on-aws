# Sensitive Data Discovery Job
You can create and manage jobs for discovering sensitive data. A discovery job consists of one or many AWS Glue jobs for actual data inspection. For more information, refer to [View job details](discovery-job-details.md).

## Create a discovery job
On the **Run Sensitive Data Discovery Jobs** webpage, click the **Create sensitive data discovery job** button. You'll need to go through the job settings to run a new discovery job.

- **Step 1: Select the S3 data source**
    - All buckets in all AWS accounts
    - All buckets in specific AWS accounts
    - All buckets (existing catalogs)
    - Specific buckets (existing catalogs)
    - Skip scanning for S3
- **Step 2: Select the RDS data source**
    - All RDS instances (existing catalogs)
    - Specific instances (existing catalogs)
    - Skip scanning for RDS
- **Step 3: Job settings**
    - Job name
    - Job description
    - Classification template 
    - Job settings (see job setting details below)
- **Step 4: Job preview**

After previewing the job, click the **Run job** button to start.

## Job setting details

| Job setting | Description | Options |
| --- | --- | --- |
| Scan frequency | Refers to the frequency of the discovery job. | - On-demand run<br>- Daily<br>- Weekly<br>- Monthly |
| Scan depth | Refers to the number of sampled rows. | - 1000 (recommended)<br>- 100 |
| Scan range | Defines the overall scan range for the target data source. <br>"Full scan" scans all target data sources.<br>"Only scan changed" will skip those data sources that were not changed since the last data catalog update. | - Full scan<br>- Only scan changed (recommended) |
| Detection threshold | Defines the level of tolerance required for the job. If the scan depth is 1000 rows, a 10% threshold means that if over 100 rows (out of 1000) match the identifier rule, then the column will be labeled as sensitive. A lower threshold indicates that the job is less tolerant of sensitive data. | - 10% (recommended)<br>- 20%<br>- 30%<br>- 40%<br>- 50%<br>- 100% |
| Override privacy labels that are updated manually | Choose whether to allow the job to override the data catalog privacy label with the job result. | - Do not override (recommended)<br>- Override |