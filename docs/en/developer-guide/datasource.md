## Add Account

POST /data-source/add_account

Create an account under the specified provider.

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


## Delete Account

POST /data-source/delete_account

Delete an account under the specified provider.

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

## Add Datasource

POST /data-source/add-jdbc-conn

Add a data source under the specified account.

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

<font size="2">*: master_username/password and secret cannot be empty at the same time.</font>

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

## Edit Datasource

POST /data-source/delete_account

Edit a data source under the specified account.

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

<font size="2">*: master_username/password and secret cannot be empty at the same time.</font>

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

## Delete Datasource

POST /data-source/delete-jdbc

Delete a data source under the specified account.

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