## 创建任务 

POST /discovery-jobs

创建扫描任务.

### Request
<table>
  <thead>
    <tr>
      <th>Parameter Name</th>
      <th>Required</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  <thead>
  <tbody>
    <tr>
      <td>name</td>
      <td>Yes</td>
      <td>string</td>
      <td>-</td>
    </tr>
    <tr>
      <td>template_id</td>
      <td>No</td>
      <td>integer</td>
      <td>Default: 1</td>
    </tr>
    <tr>
      <td>schedule</td>
      <td>No</td>
      <td>string</td>
      <td>Default: OnDemand</td>
    </tr>
    <tr>
      <td>description</td>
      <td>No</td>
      <td>string</td>
      <td>-</td>
    </tr>
    <tr>
      <td>range</td>
      <td>No</td>
      <td>integer</td>
      <td>Default:1</td>
    </tr>
    <tr>
      <td>depth_structured</td>
      <td>No</td>
      <td>integer</td>
      <td>Default:100</td>
    </tr>
    <tr>
      <td>depth_unstructured</td>
      <td>No</td>
      <td>integer</td>
      <td>Default:10</td>
    </tr>
    <tr>
      <td>detection_threshold</td>
      <td>No</td>
      <td>number</td>
      <td>Default:0.2</td>
    </tr>
    <tr>
      <td>all_s3</td>
      <td>No</td>
      <td>integer</td>
      <td>-</td>
    </tr>
    <tr>
      <td>all_rds</td>
      <td>No</td>
      <td>integer</td>
      <td>-</td>
    </tr>
    <tr>
      <td>all_ddb</td>
      <td>No</td>
      <td>integer</td>
      <td>-</td>
    </tr>
    <tr>
      <td>all_emr</td>
      <td>No</td>
      <td>integer</td>
      <td>-</td>
    </tr>
    <tr>
      <td>all_glue</td>
      <td>No</td>
      <td>integer</td>
      <td>-</td>
    </tr>
    <tr>
      <td>all_jdbc</td>
      <td>No</td>
      <td>integer</td>
      <td>-</td>
    </tr>
    <tr>
      <td>overwrite</td>
      <td>No</td>
      <td>integer</td>
      <td>-</td>
    </tr>
    <tr>
      <td>exclude_keywords</td>
      <td>No</td>
      <td>string</td>
      <td>-</td>
    </tr>
    <tr>
      <td>include_keywords</td>
      <td>No</td>
      <td>string</td>
      <td>-</td>
    </tr>
    <tr>
      <td>exclude_file_extensions</td>
      <td>No</td>
      <td>string</td>
      <td>-</td>
    </tr>
    <tr>
      <td>include_file_extensions</td>
      <td>No</td>
      <td>string</td>
      <td>-</td>
    </tr>
    <tr>
      <td>provider_id</td>
      <td>No</td>
      <td>integer</td>
      <td>-</td>
    </tr>
    <tr>
      <td>database_type</td>
      <td>No</td>
      <td>string</td>
      <td>-</td>
    </tr>
    <tr>
      <td>databases</td>
      <td>Yes</td>
      <td>array</td>
      <td>
        每一个元素结构如下:<br/>
        {<br/>
          &emsp;"account_id": "string",<br/>
          &emsp;"region": "string",<br/>
          &emsp;"database_type": "string",<br/>
          &emsp;"database_name": "string",<br/>
          &emsp;"table_name": "string"<br/>
        }
      
      </td>
</tr>
</tbody>
</table>


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


## 启动任务

POST /discovery-jobs/{job_id}/start

启动扫描任务.

### Request
|Parameter Name |Required|Type|Description|
|---|---|---|---|
|job_id|Yes|integer|-|

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