# Concepts and definitions
- **Data source**: Refers to AWS resources where data is stored, such as S3, RDS, etc.
- **Data catalog**: Refers to a repository of metadata of a data source, allowing you to manage data at the column-level. For example, you can view the table schema, sample data of a particular column, and add labels to specific data fields.
- **Data identifier**: Refers to the rule used to inspect data. You can define custom data identifiers using Regex and keywords.
- **Classification template**: Refers to a collection of data identifiers. Data identifiers are rules used to inspect data.
- **Sensitive data discovery job**: Refers to a job that uses a template to inspect sensitive data. The job automatically labels sensitive data in the data catalog.
- **Glue job**: Refers to a job that is triggered by a sensitive data discovery job to scan sensitive data using AWS Glue. As a result, one discovery job can trigger Glue jobs in multiple AWS accounts in a distributed manner.