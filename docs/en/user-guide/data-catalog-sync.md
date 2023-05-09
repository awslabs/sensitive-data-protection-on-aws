# Browse data catalogs

## What is data catalog?
A data catalog is a repository of metadata of data source (S3, RDS). With data catalogs, you can view the column-level information of data. 

> Please refer to [Appendix: Supported data types](appendix-supported-data-types.md) for more details.

## When the data catalogs are synced with data source?

The SDPS platform syncs the data catalogs for data source in the following situations:

- When data catalog creation
- When sensitive data discovery job run

| AWS resource | Data source change | Sync when data catalog creation | Sync when sensitive data discovery job run |
| --- | --- | --- | --- |
| S3 | bucket created | Y | Y- Autosync |
| S3 | bucket deleted | Y | Y- Autosync |
| S3 | object created | Y | ? |
| S3 | object deleted | Y | ? |
| S3 | object updated (timestamp changed) | Y | Y |
| RDS | instance created | Y | Y- Autosync |
| RDS | instance deleted | Y | Y- Autosync |
| RDS | database created | Y | ? |
| RDS | database deleted | Y | ? |
| RDS | table created | Y | ? |
| RDS | table deleted | Y | ? |
| RDS | table updated | Y | Y |

> Note that syncing data catalog will not affect the label on an existing data catalog.