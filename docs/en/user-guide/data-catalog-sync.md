## What is data catalog?
A data catalog is a repository of metadata of data source (Amazon S3, Amazon RDS). With data catalogs, you can view the column-level information of data. 

## When are the data catalogs synchronized with data source?

The solution synchronizes the data catalogs with data source in the following situations:
- Sync to data catalog (manual). Please refer to [Connect to data source](data-catalog-create.md)
- Run sensitive data discovery job (automatic)

!!! Info "For more information"
    Synchronizing data catalog will not affect the labels on an existing data catalog.

| AWS resource | Data source change | Sync to data catalog | Run sensitive data discovery jobs |
| --- | --- | --- | --- |
| S3 | bucket created | Y | Y |
| S3 | bucket deleted | Y | Y |
| S3 | object created | Y | Y |
| S3 | object deleted | Y | Y |
| S3 | object(in bucket root) created | Y | Y  |
| S3 | object(in bucket root) deleted | N | N  |
| S3 | object updated (timestamp changed) | Y | Y |
| RDS | instance created | Y | Y |
| RDS | instance deleted | Y | Y |
| RDS | instance updated | Y | Y | 
| RDS | database created | Y | Y |
| RDS | database deleted | Y | Y |
| RDS | table created | Y | Y |
| RDS | table deleted | Y | Y  |
| RDS | table updated | Y | Y |
| RDS | column created | Y | Y  |
| RDS | column deleted | Y | Y  |
| RDS | column updated | Y | Y  |
