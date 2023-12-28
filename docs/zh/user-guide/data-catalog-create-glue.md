# 连接到数据源
添加 AWS 帐户后，您可以连接AWS Glue Data Catalogs，用以扫描以AWS Glue为数据目录（元数据目录）的数据源。

## 连接AWS Glue数据源

!!! Info "支持的大数据数据类型"
    有关 AWS Glue 支持的特定数据格式，请参阅 [AWS Glue 中的内置分类器](https://docs.aws.amazon.com/glue/latest/dg/add-classifier.html)。
    
    此外，方案还支持Glue Hudi表。

1. 在 **连接数据源** 页面上，单击一个帐户以打开其详细信息页面。
2. 在 **Glue Data Catalogs** 标签页，选择一个Glue 连接，然后选择 **同步至数据目录** 。
3. 您看到目录状态变为灰色`PENDING`，表示连接开始（约3分钟）
4. 您看到目录状态边绿色 `ACTIVE`，则表示已经Glue Data Catalog已同步至了SDP平台上的数据目录。

至此，您已经连接好了Glue Data Catalog，可以开始下一步操作了。