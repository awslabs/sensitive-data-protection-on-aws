## 添加账号

POST /data-source/add_account

在指定供应商下面创建账号.

### Request
|Parameter Name |Required|Type|Description|
|---|---|---|---|
|account_provider|Yes|integer|Provider ID|
|account_id|Yes|string||
|region|Yes|string||

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


## 删除账号

POST /data-source/delete_account

删除指定账号.

### Request
|Parameter Name |Required|Type|Description|
|---|---|---|---|
|account_provider|Yes|integer|Provider ID|
|account_id|Yes|string|-|
|region|Yes|string|-|

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

## 添加数据源

POST /data-source/add-jdbc-conn

在指定账号下添加数据源.

### Request
|Parameter Name |Required|Type|Description|
|---|---|---|---|
|instance_id|Yes|string|-|
|account_provider_id|Yes|integer|Provider ID|
|account_id|Yes|string|-|
|region|Yes|string|-|
|description|No|string|-|
|jdbc_connection_url|Yes|string|-|
|jdbc_connection_schema|Yes|string|-|
|jdbc_enforce_ssl|No|string|true/false|
|kafka_ssl_enabled|No|string|true/false|
|master_username|Yes|string|*|
|password|Yes|string|*|
|secret|Yes|string|*|
|skip_custom_jdbc_cert_validation|No|string|-|
|custom_jdbc_cert|No|string|-|
|custom_jdbc_cert_string|No|string|-|
|network_availability_zone|Yes|string|-|
|network_subnet_id|Yes|string|-|
|network_sg_id|Yes|string|-|
|glue_crawler_last_updated|No|datetime|-|
|creation_time|No|string|-|
|last_updated_time|No|string|-|
|jdbc_driver_class_name|No|string|-|
|jdbc_driver_jar_uri|No|string|-|
|create_type|Yes|integer|-|

<font size="2">*: master_username/password和secret不能同时为空</font>

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

## 编辑数据源

POST /data-source/delete_account

编辑指定账号下面的数据源.

### Request
|Parameter Name |Required|Type|Description|
|---|---|---|---|
|instance_id|Yes|string|-|
|account_provider_id|Yes|integer|Provider ID|
|account_id|Yes|string|-|
|region|Yes|string|-|
|description|No|string|-|
|jdbc_connection_url|Yes|string|-|
|jdbc_connection_schema|Yes|string|-|
|jdbc_enforce_ssl|No|string|true/false|
|kafka_ssl_enabled|No|string|true/false|
|master_username|Yes|string|*|
|password|Yes|string|*|
|secret|Yes|string|*|
|skip_custom_jdbc_cert_validation|No|string|-|
|custom_jdbc_cert|No|string|-|
|custom_jdbc_cert_string|No|string|-|
|network_availability_zone|Yes|string|-|
|network_subnet_id|Yes|string|-|
|network_sg_id|Yes|string|-|
|glue_crawler_last_updated|No|datetime|-|
|creation_time|No|string|-|
|last_updated_time|No|string|-|
|jdbc_driver_class_name|No|string|-|
|jdbc_driver_jar_uri|No|string|-|
|create_type|Yes|integer|-|

<font size="2">*: master_username/password和secret不能同时为空</font>

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

## 删除数据源

POST /data-source/delete-jdbc

删除指定账号下的数据源

### Request
|Parameter Name |Required|Type|Description|
|---|---|---|---|
|account_provider|Yes|integer|Provider ID|
|account_id|Yes|string||
|region|Yes|string||
|instances|Yes|list<string>||

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