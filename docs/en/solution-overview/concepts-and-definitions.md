# Concepts and definitions
- **Data source**: AWS resources where data is stored, such as Amazon S3, and Amazon RDS.
- **Data catalog**: A repository of metadata of a data source, allowing you to manage data at the column level. For example, you can view the table schema, sample data of a particular column, and add labels to specific data fields.
- **Data identifier**: The rule used to detect data. You can define custom data identifiers using RegEx and keywords.
- **Classification template**: A collection of data identifiers. Data identifiers are rules used to detect data.
- **Sensitive data discovery job**: A job that uses a template to detect sensitive data. The job automatically labels sensitive data in the data catalog.
- **Glue job**: A job that is triggered by a sensitive data discovery job to scan sensitive data using AWS Glue. One discovery job can trigger AWS Glue jobs in multiple AWS accounts in a distributed manner.