# 方案支持扫描的数据类型

## 支持的结构化/半结构化数据

| 分类器类型             | 分类字符串          | 备注 |
|---------------------|------------------|------|
| Apache Avro         | avro             | 读取文件开始的模式来确定格式。 |
| Apache ORC          | orc              | 读取文件元数据来确定格式。 |
| Apache Parquet      | parquet          | 读取文件末尾的模式来确定格式。 |
| JSON                | json             | 读取文件开始来确定格式。 |
| 二进制JSON          | bson             | 读取文件开始来确定格式。 |
| XML                 | xml              | 读取文件开始来确定格式。AWS Glue根据文档中的XML标签确定表结构。关于创建自定义XML分类器以指定文档中的行的信息，请参见编写XML自定义分类器。 |
| Amazon Ion          | ion              | 读取文件开始来确定格式。 |
| 综合Apache日志      | combined_apache  | 通过grok模式确定日志格式。 |
| Apache日志          | apache           | 通过grok模式确定日志格式。 |
| Linux内核日志       | linux_kernel     | 通过grok模式确定日志格式。 |
| 微软日志            | microsoft_log    | 通过grok模式确定日志格式。 |
| Ruby日志            | ruby_logger      | 读取文件开始来确定格式。 |
| Squid 3.x日志       | squid            | 读取文件开始来确定格式。 |
| Redis监控日志       | redismonlog      | 读取文件开始来确定格式。 |
| Redis日志           | redislog         | 读取文件开始来确定格式。 |
| CSV                 | csv              | 检查以下分隔符：逗号(,)、管道(|)、制表符(\t)、分号(;)和Ctrl-A (\u0001)。Ctrl-A是标题开始的Unicode控制字符。 |
| Amazon Redshift     | redshift         | 使用JDBC连接来导入元数据。 |
| MySQL               | mysql            | 使用JDBC连接来导入元数据。 |
| PostgreSQL          | postgresql       | 使用JDBC连接来导入元数据。 |
| Oracle数据库        | oracle           | 使用JDBC连接来导入元数据。 |
| Microsoft SQL Server| sqlserver        | 使用JDBC连接来导入元数据。 |
| Amazon DynamoDB     | dynamodb         | 从DynamoDB表中读取数据。 |
| **压缩格式**          |                  | **可以分类以下压缩格式的文件：** |
| ZIP                 |                  | 支持仅包含单个文件的档案。请注意，Zip在其他服务中支持不佳（因为档案）。 |
| BZIP                |                  |      |
| GZIP                |                  |      |
| LZ4                 |                  |      |
| Snappy              |                  | 支持标准和Hadoop本地Snappy格式。 |

备注：解决方案使用 AWS Glue 将这些数据爬取到数据目录中。请以最新的 AWS Glue 支持的特定数据格式为准，请参阅 [AWS Glue 中的内置分类器](https://docs.aws.amazon.com/glue/latest/dg/add-classifier.html)

## 支持的非结构化数据（仅限S3数据源）
| 文件种类  | 文件后缀                                                  |
|-----------|-------------------------------------------------------------|
| Document  | ".doc", ".docx", ".pdf"                                     |
| Webpage   | ".htm", ".html"                                             |
| Email     | ".eml"                                                      |
| Code      | ".java", ".py", ".cpp", ".c", ".h", ".html", ".css", ".js", ".php", ".rb", ".swift", ".go", ".sql" |
| Text      | ".txt", ".md", ".log"                                       |
| Image     | “.jpg”, “.jpeg”, “.png”, “.gif”, “.bmp”, “.tiff”, “.tif” - (ID cards/Business licenses/Driver's licenses/Faces) |
