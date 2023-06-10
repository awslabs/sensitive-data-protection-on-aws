数据标识符是检测敏感数据的规则。首先，您需要了解在贵公司中，什么样的数据被定义为敏感数据，以及这些敏感数据的识别规则。只有那些可以通过正则表达式定义或者AI定义的敏感数据才可以通过技术手段（例如，利用SDP方案）进行识别。

在定义了这些数据规则（即数据标识符）后，您还需要将它们添加至模版。敏感数据扫描任务在运行时会将数据源中的数据与[数据分类模版](data-classification-template.md)中的规则进行一一匹配，并在数据目录中对其进行标记。

## 内置的数据标识符

方案提供内置的数据标识符，这些标识符主要是基于国家分类的隐私数据规则。在**管理数据识别规则**页面中的 **内置数据标识符** 标签页中，您可以看到内置的数据标识符的列表。有关完整列表，请参见[附录 - 内置数据标识符](appendix-built-in-identifiers.md)。默认情况下，这些数据标识符具有`PERSONAL`类别属性和`S2`/`S3`/`S4`标识符标签属性。您可以根据自己的敏感数据更新这些属性。更多细节请参见[这里](data-identifiers.md)。

## 自定义数据标识符
在 **管理数据识别规则** 页面中的 **自定义数据标识符** 选项卡中，您可以看到您定义的自定义数据标识符列表。默认情况下，该列表为空。您可以根据业务敏感数据定义创建或删除数据标识符。

您可以单击 ![edit-icon](docs/../../images/edit-icon.png) 编辑图标，根据自己对敏感数据的定义，编辑这些数据标识符的“类别”和“标识符标签”属性。例如，您可以将类别定义为`FINANCE`/`AUTO`/`GENERAL`，并将数据敏感级别定义为`Level1`/`Level2`/`Level3`/`Level4`。

### 创建和编辑

要创建新的数据标识符，请选择“创建数据标识符”； 当要编辑时，点击某个数据标识符时。您将被重定向到“数据标识符详情”页面。

- 在定义识别规则时，如果同时启用了正则表达式规则和关键词规则，则数据字段必须同时满足正则表达式模式并匹配（完全或部分匹配）其中一个关键词才能被标记。
- 您可以在此页面上创建/编辑“类别”和“标识符标签”属性。

## 示例：敏感数据发现任务后数据标识符在数据目录中的标记方式。

假设我们想要在名为 **"PizzaOrderTable"** 的表中检测敏感数据。

| id | user_name      | email_address        | order_id   |
|----|----------------|----------------------|------------|
| 1  | aaa_frankzhu   | frankzhu@mail.com    | 12344536   |
| 2  | aaa_zheng      | zhm@mail.com         | 12344536   |
| 3  | aaa_patrickpark| ppark@example.com    | 12344536   |
| 4  | aaa_kyle       | kyle@qq.com          | 1230000    |

例如，我们定义了5个自定义数据标识符：

| Identifier Name | Regex                                              | Keyword                                       |
|-----------------|----------------------------------------------------|-----------------------------------------------|
| OrderInfo1      | OrderInfo1                                         | order                                         |
| OrderInfo2      | (disabled)                                         | _id                                           |
| UserEmail       | `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` | (disabled)                                    |
| EmailAddress    | (disabled)                                         | themail, email-address, email_address         |
| UserPrefix      | aaa_                                               | user                                          |
 
假设上述所有标识符都已添加到分类模板中，然后我们启动了一个发现任务。 "PizzaOrderTable" 数据目录的结果如下：

| Column         | Identifiers             | Privacy       |
|----------------|-------------------------|---------------|
| id             | N/A                     | Non-PII       |
| user_name      | UserPrefix              | Contain-PII   |
| email_address  | UserEmail, EmailAddress | Contain-PII   |
| order_id       | OrderInfo2              | Contain-PII   |

**标识符解释:**

- 标识符 "OrderInfo1" 未匹配，因为正则表达式与数据模式不匹配。
- 标识符 "OrderInfo2" 标记在 "order_id" 列上，因为关键字 "_id" 部分匹配列名 "order_id"。
- 标识符 "UserEmail" 标记在 "email_address" 列上，因为正则表达式匹配 "email_address" 列值的数据模式。
- 标识符 "EmailAddress" 标记在 "email_address" 列上，因为关键字 "email_address" 之一匹配列名。
- 标识符 "UserPrefix" 标记在 "user_name" 列上，因为正则表达式和关键字都匹配。

**隐私标签解释:**

- "user_name"、"email_address" 和 "order_id" 列被标记为(包含个人身份信息)隐私标签，因为已匹配到标识符。
- "id" 列被标记为(不包含个人身份信息)隐私标签，因为没有匹配到标识符。