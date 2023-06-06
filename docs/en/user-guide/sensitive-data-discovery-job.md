
# Sensitive Data Discovery Job

On the **"Run Sensitive Data Discovery Jobs"** webpage, you can create and manage jobs for discovering sensitive data. A discovery job consists of one or many AWS Glue jobs for actual data inspection.

> Note: The Glue jobs run in the same account as the data source. For instance, if you run a discovery job against an RDS instance (the data source) in Account A, and the solution is installed in Account B, the Glue job runs in Account A and returns results and masked sample data to Account B.

## Create a discovery Job
Click the **"Create sensitive data discovery job"** button. You'll need to go through the job settings to run a new discovery job.

- Step 1: Select the S3 data source
    - All buckets in all AWS accounts
    - All buckets in specific AWS accounts
    - All buckets with created catalogs
    - Specific buckets with created catalogs
    - Skip scanning for S3
- Step 2: Select the RDS data source
    - All RDS instances with created catalogs
    - Specific instances with created catalogs
    - Skip scanning for RDS
- Step 3: Job settings
- Step 4: Job preview

After previewing the job, click **"Run job"** button to start.

## Re-run a discovery Job
Click **"Actions"** and select **"Execute once"**. You can create a new discovery job and run it with the same settings as the previous run.

## Pause/Continue a discovery Job
"Pause"/"Continue" can only be applied to a scheduled job. It does NOT mean to stop/resume a running discovery job.

To pause a scheduled job, click **"Actions"** and select **"Pause"**. For instance, if you scheduled a monthly job on the first day of every month and ran a job once in January, choosing "Pause" will prevent the discovery job from executing in February.

To resume a paused job, click** **"Actions"** and select **"Continue"**.

## Duplicate a Discovery Job
Click **"Actions"** and select **"Duplicate"**. You can duplicate a job setting and modify it to start a new job.

## View job details