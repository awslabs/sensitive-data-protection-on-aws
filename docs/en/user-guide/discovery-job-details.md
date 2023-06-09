A sensitive data discovery job consists of Glue jobs that run in monitored AWS accounts (the same account as the data source). 

For instance, if you run a discovery job for a RDS instance (the data source) in Account A, and the solution is installed in Account B, the Glue job runs in Account A and returns results and masked sample data to Account B.

## View job details

1. Sign in to the solution's web portal.
2. Choose **Run sensitive data discovery jobs** in the **Summary** area. Alternatively, from the left navigation pane, choose **Run sensitive data discovery jobs** to open its page. 
3. Click the job that you want to view details. A window pops up. 
4. In the **Job history** tab, choose a specific job. If needed, you can choose **Download report** to download a report. For details, refer to [discovery job report](discovery-job-report.md).
5. Click **Job run details**. You will be redirected to **job details** page, where you can see the job information and a list of Glue jobs. 

    !!! Note "Note"
        In case a Glue job failed, you can click the FAILED status to view its error log.

### Download snapshot of classification template used in job 
You can download the template snapshot for the moment when the job starts to run. The snapshot shows what the job is using as data identifiers. 

On the **job details** page, choose **Download snapshot** to download the template snapshot in JSON format(.json). 





