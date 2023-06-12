## What is data catalog?
A data catalog is a repository of metadata of data source (Amazon S3, Amazon RDS). With data catalogs, you can view the column-level information of data. 

You can refer to [Appendix: Supported data types](appendix-supported-data-types.md) for more details.

## When are the data catalogs synchronized with data source?

The solution synchronizes the data catalogs with data source in the following situations:

- when data catalog is created
- when sensitive data discovery job runs

| AWS resource | Data source change | Synchronize when data catalog is created | Synchronize when sensitive data discovery job runs |
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

!!! Note "Note"
    Synchronizing data catalog will not affect the label on an existing data catalog.