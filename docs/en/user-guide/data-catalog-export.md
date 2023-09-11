You can export the latest data catalogs

1. On the **Browse data catalogs** page, click button **Export data catalogs** button.
2. Choose either **Download .xlsx file** for Microsoft Excel file or **Download . csv file**

The exported files contains all the details at column level of current data catalogs, the file schema is shown as below. 

| S3                     | RDS                    |
|-----------------------|------------------------|
| account_id            | account_id             |
| region                | region                 |
| s3_bucket             | rds_instance_id        |
| folder_name           | table_name             |
| column_name           | column_name            |
| identifiers           | identifiers            |
| sample_data           | sample_data            |
| bucket_catalog_label  | instance_catalog_label |
| folder_catalog_label  | table_catalog_label    |
| comment               | comment                |