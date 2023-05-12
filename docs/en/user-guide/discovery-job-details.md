# Sensitive data discovery job
A sensitive data discovery job consists of Glue jobs that run in monitored AWS accounts (the same account as the data source). 

> For instance, if you run a discovery job for a RDS instance (the data source) in Account A, and the solution is installed in Account B, the Glue job runs in Account A and returns results and masked sample data to Account B.

## View job details
On the **Run sensitive data discovery job** webpage, click into a specific job, you can see a side window. 
In the **Job history** tab, choose a specific job run, click **Job run details** link, you will be redirected to job detail page, where you can see more details of job execution.

In the job details webpage, you can see a list of Glue jobs. 

> Tips: In case a Glue job is failed, you can cilck into the FAILED status to view more failure logs.

## Download snapshot of classification template used in job 
You can download the template of the moment of the job start. This gave you a clue of what the job is using as data identifiers in this particular job run. 

On job details page, click **Download snapshot** link. You can download the template in JSON format(.json).
