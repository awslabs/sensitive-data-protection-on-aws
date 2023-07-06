# 连接到数据源
添加 AWS 帐户后，您可以为数据源创建数据目录。

!!! Info "支持的数据类型"
    - **支持结构化数据和半结构化数据** 解决方案使用 AWS Glue 将这些数据爬取到数据目录中。有关 AWS Glue 支持的特定数据格式，请参阅 [AWS Glue 中的内置分类器](https://docs.aws.amazon.com/glue/latest/dg/add-classifier.html)。
    - **不支持非结构化数据（如图像和 PDF）。**

## 为 S3 创建数据目录（手动）

1. 在 **连接数据源** 页面上，单击一个帐户以打开其详细信息页面。
2. 在 **Amazon S3** 标签页中，查看解决方案部署区域中的 S3 存储桶列表。
3. 选择一个 S3 存储桶，然后选择 **同步至数据目录** 以创建或更新数据目录。

几分钟后，您可以看到 **目录状态** 为 `ACTIVE`，这表示已为 S3 存储桶创建了数据目录。

您还可以从 **操作** 列表中选择 **同步全部至数据目录** 以快速为此 AWS 帐户的所有 S3 存储桶创建数据目录。


## 为 RDS 创建数据目录（手动）

!!! important "前提条件"
        RDS 实例至少要有1个私有子网，且必须满足以下条件之一才能成功连接：
        
        - 它具有 [VPC NAT 网关](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)。
        - 它同时具有 [S3 的 VPC 终端节点](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html) 和 Glue 终端节点。
        - 它已经授予解决方案对应的数据库操作用户select权限。

1. 在 **连接数据源** 页面上，单击一个帐户以打开其详细信息页面。
2. 选择 **Amazon RDS** 标签页。您可以看到解决方案部署区域中的 RDS 实例列表。
3. 选择一个 RDS 实例，然后选择 **同步至数据目录** 以打开一个弹出窗口，要求输入凭据。有两种输入凭据的选项：
    - 选择 **用户名/密码** 并输入 RDS 实例的用户名和密码。
    - 选择 **Secret Manager** 并选择 RDS 的 Secret。它将列出 Secret Manager 中与 RDS 相同帐户的所有 Secret。

4. 选择 **连接**。解决方案将开始测试连接，可能需要几分钟时间。

一旦您看到目录状态为 `ACTIVE`，则表示已为 RDS 实例创建了数据目录。