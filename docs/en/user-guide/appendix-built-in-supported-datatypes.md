# Supported data types

## Structured/Semi-structured data scanning

| Classifier type       | Classification string | Notes |
|-----------------------|-----------------------|-------|
| Apache Avro           | avro                  | Reads the schema at the beginning of the file to determine format. |
| Apache ORC            | orc                   | Reads the file metadata to determine format. |
| Apache Parquet        | parquet               | Reads the schema at the end of the file to determine format. |
| JSON                  | json                  | Reads the beginning of the file to determine format. |
| Binary JSON           | bson                  | Reads the beginning of the file to determine format. |
| XML                   | xml                   | Reads the beginning of the file to determine format. AWS Glue determines the table schema based on XML tags in the document. For information about creating a custom XML classifier to specify rows in the document, see Writing XML custom classifiers. |
| Amazon Ion            | ion                   | Reads the beginning of the file to determine format. |
| Combined Apache log   | combined_apache       | Determines log formats through a grok pattern. |
| Apache log            | apache                | Determines log formats through a grok pattern. |
| Linux kernel log      | linux_kernel          | Determines log formats through a grok pattern. |
| Microsoft log         | microsoft_log         | Determines log formats through a grok pattern. |
| Ruby log              | ruby_logger           | Reads the beginning of the file to determine format. |
| Squid 3.x log         | squid                 | Reads the beginning of the file to determine format. |
| Redis monitor log     | redismonlog           | Reads the beginning of the file to determine format. |
| Redis log             | redislog              | Reads the beginning of the file to determine format. |
| CSV                   | csv                   | Checks for the following delimiters: comma (,), pipe (|), tab (\t), semicolon (;), and Ctrl-A (\u0001). Ctrl-A is the Unicode control character for Start Of Heading. |
| Amazon Redshift       | redshift              | Uses JDBC connection to import metadata. |
| MySQL                 | mysql                 | Uses JDBC connection to import metadata. |
| PostgreSQL            | postgresql            | Uses JDBC connection to import metadata. |
| Oracle database       | oracle                | Uses JDBC connection to import metadata. |
| Microsoft SQL Server  | sqlserver             | Uses JDBC connection to import metadata. |
| Amazon DynamoDB       | dynamodb              | Reads data from the DynamoDB table. |
| **Compressed Formats**|                       | **Files in the following compressed formats can be classified:** |
| ZIP                   |                       | Supported for archives containing only a single file. Note that Zip is not well-supported in other services (because of the archive). |
| BZIP                  |                       |       |
| GZIP                  |                       |       |
| LZ4                   |                       |       |
| Snappy                |                       | Supported for both standard and Hadoop native Snappy formats. |

Note: The solution uses AWS Glue to crawl these data into data catalogs. For specific data format supported by AWS Glue, please refer to [Built-in classifiers in AWS Glue](https://docs.aws.amazon.com/glue/latest/dg/add-classifier.html).

## ## Unstructured data scanning (S3 only)
| File Type | Extensions                                                  |
|-----------|-------------------------------------------------------------|
| Document  | ".docx", ".pdf"                                     |
| Webpage   | ".htm", ".html"                                             |
| Email     | ".eml"                                                      |
| Code      | ".java", ".py", ".cpp", ".c", ".h", ".html", ".css", ".js", ".php", ".rb", ".swift", ".go", ".sql" |
| Text      | ".txt", ".md", ".log"                                       |
| Image     | “.jpg”, “.jpeg”, “.png”, “.gif”, “.bmp”, “.tiff”, “.tif” - (ID cards/Business licenses/Driver's licenses/Faces) |
