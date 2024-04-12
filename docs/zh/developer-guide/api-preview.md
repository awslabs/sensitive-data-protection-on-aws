本文仅列出每个模块主要操作接口。更详细请参考[OPENAPI](../openapi.json)

## 数据源相关接口
| url | 接口功能 | 频率限制（次/秒） |
|--------------------|-------------------|-------|
| /data-source/add_account | 添加账号 | 10 |
| /data-source/delete_account | 删除账号 | 10 |
| /data-source/add-jdbc-conn | 添加数据源 | 10 |
| /data-source/update-jdbc-conn | 编辑数据源 | 10 |
| /data-source/delete-jdbc | 删除数据源 | 10 |


## 检测任务相关接口
| url | 接口功能 | 频率限制（次/秒） |
|--------------------|-------------------|-------|
| /discovery-jobs | 创建任务 | 10 |
| /discovery-jobs/{job_id}/start | 启动任务 | 10 |

## 数据识别规则相关接口
| url | 接口功能 | 频率限制（次/秒） |
|--------------------|-------------------|-------|
| /template/identifiers | 创建识别规则 | 10 |
| /template/template-mappings | 将识别规则添加进模版 | 10 |