Sensitive data discovery jobs consist of Glue jobs running in monitored AWS accounts (the same accounts as the data sources).

* Return to the list of sensitive data tasks, you can see the job status as `Running`.
* To view task progress: Click on the task, in the sidebar, click **Task Run Details**.
![edit-icon](docs/../../images/cn-job-status.png) 

* Initially, the progress may remain at 0%. Do not worry, as the system is checking for any changes in the data structure. The progress will update once the actual data scan begins.
    ![edit-icon](docs/../../images/cn-job-status-progress.png) 
!!! Info "Run Duration"
    The duration depends on the sampling rate, the tables to be scanned, and the number of identifiers in the template. 
    For example: For one instance with 400 tables, a scan depth of 30, and 21 rules in the template, it might take approximately 25 minutes.
    Different S3 buckets/database instances are scanned in parallel by the backend.

* Wait for the Glue job status to change to `SUCCEEDED`. This indicates that the scanning task is complete.
* If the Glue job fails, you can click on the `FAILED` status to view its error logs.

## Download Classification Template Snapshot
You can download a snapshot of the template as it was at the start of the job. The snapshot shows which data identifiers the job was using.

On the **Job Details** page, select **Download Snapshot** to download the template snapshot in JSON format (.json).
