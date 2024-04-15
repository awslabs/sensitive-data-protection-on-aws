## 创建识别规则

POST /template/identifiers

创建识别规则.

### Request
|Parameter Name |Required|Type|Description|
|---|---|---|---|
|description|No|string|-|
|type|No|integer|Default:1|
|name|Yes|string|-|
|classification|No|integer|Default:1|
|privacy|No|integer|Default:0|
|rule|No|string|*|
|header_keywords|No|string|*|
|max_distance|No|integer|-|
|min_occurrence|No|integer|-|
|props|No|string|-|
|exclude_keywords|No|string|-|

> Response Examples

> Success

```json
{
  "status": "success",
  "code": 1001,
  "message": "Operation succeeded"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|1001|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Success|Inline|

### Responses Data Schema

HTTP Status Code **1001**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» message|string|true|none||none|
|» code|integer|true|none||none|


## 将识别规则添加进模版

POST /template/template-mappings

将识别规则添加进入模版.

### Request
|Parameter Name |Required|Type|Description|
|---|---|---|---|
|template_id|Yes|integer|Template ID|
|identifier_ids|Yes|array|eg: [1,2,3]|
|status|No|string|Default:0|

> Response Examples

> Success

```json
{
  "status": "success",
  "code": 1001,
  "message": "Operation succeeded"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|1001|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Success|Inline|

### Responses Data Schema

HTTP Status Code **1001**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» message|string|true|none||none|
|» code|integer|true|none||none|
