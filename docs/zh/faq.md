# 常见问题

关于具体的UI显示的错误信息（Error message），请参考“故障排查”章节。

## 关于解决方案安装/升级/卸载
**方案安装完使用的是alb的地址 （随机，不好记），支持绑定域名吗？**
    
支持域名配置。通过配置DNS，您可以绑定自定义域名（如企业二级域名）。具体来说，需要让DNS管理员把自定义域名的CName指向ALB地址，然后更新CloudFormation的参数，填入自定义域名即可。

**方案主体的Admin CloudFormation所在VPC为什么要NAT Gateway**?

Admin Cloudfomration部署在VPC中，其lambda没有公有IP；lambda需要访问service，比如S3、StepFunction、Glue等，所以需要NAT Gateway。

## 关于连接账号及连接数据源
**解决方案支持的数据类型/文件类型有哪些？有没有一个具体的列表？** 

解决方案目前支持结构化/半结构化数据主要利用AWS Glue的原生能力。具体列表请参见[AWS Glue 中的内置分类器](https://docs.aws.amazon.com/zh_cn/glue/latest/dg/add-classifier.html).

**我希望对公开访问（public access）的RDS实例进行扫描，怎么操作？**

默认情况下，方案不支持扫描公开访问（public access）的数据库，因为生产环境的数据库通常为非公开访问。需要更改一下方案代码。打开Lambda控制台找到 Sdp-admin开头相关Lambda函数中*Service.py*的文件，注释掉以下代码，这个操作将允许SDPS方案查看public access数据库的信息。
    ```
    if public_access:
      raise BizException(...)
    ```

**在连接RDS时，为什么需要NAT Gateway 或 Endpoint？**

方案使用时，需要自动化做如下操作

- 在Glue Job运行时，需要从SecretsManager读取Secret信息(使用Secret保存RDS密码时)；
- 从Glue读取catalog信息；
- 检测完毕后，需要把结果写到S3。

因为RDS通常在VPC私有子网（Private subnet）里，所以需要NAT gateway或者Glue endpoint、S3 endpoint、SecretsManager endpoint（这3个endpoint同时需要。如果使用用户名密码方式连接数据库，只需要前2个endpoint；如果Secrets使用KMS加密，还需要KMS endpoint）

## 关于数据目录
**增量扫描的逻辑是怎样的？扫描新增表？字段变更是否会扫描到？**

请参见文档 [创建作业](user-guide/discovery-job-create.md)中“关于增量扫描”的章节。

**如果某个表的其中一个字段变更了，其他字段是否会重新扫描，之前的标识是否会覆盖？**

会的。只要有字段发生变化（即schema发生变化），整个table会被job重新扫描。在job完成后，覆盖是按字段级别（列）进行覆盖的。如下两种情况：

- 如果某一列进行过手动标识符修改（last updated by不是System）,当在job选择了“不覆盖手动标记”设置，那么，之前扫描的标识不会被覆盖。

- 如果某一列未进行过标识符修改（last updated by为System），那么，之前扫描的标识不会被覆盖。

**如果有个字段没有加密，后面加密了，识别出不是敏感数据了，就没有标识了？**

一般情况下，这个字段加密了不含有明文的敏感数据，则不会被识别为敏感数据，job扫描后不会被标记任何标识符，即为未非敏感数据。

只有一中情况除外：如果之前该字段为手动标记的某标识符（last updated by不是System），且job中选择了“不覆盖手动标记”，那么，在扫描后job不会对该字段进行修改，某标识符依然存在。


## 关于分类分级模版
**Built-in 的数据标识符，有没有详细的说明，我们想知道是怎么识别的，我们关心的就是，如果数据加密了，还会不会识别出来？我们自定义的规范，可以指定字段名**

## 关于敏感数据发现任务

**导出数据中的 score 是指什么？表示敏感数据条数占1000条的比例么？**

是的。Score的定义为：出现identifer出现的行数除以总行数（默认为1000行）。Score大于Job配置中的敏感程度阈值（默认为10%）的字段才会被定义为敏感数据。