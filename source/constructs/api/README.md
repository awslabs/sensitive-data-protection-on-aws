# 后台API介绍
## 本地运行
Python版本要求3.9
### 1. 安装包
```shell
pip install -r requirements.txt
pip install uvicorn
```
### 2. 确认本地可连接数据库
RDS在VPC私有子网中，可考虑SSH隧道方式
```shell
ssh -i SDPS-ZHY.pem ec2-user@ip -Nf -L 5306:xxx.rds.cn-northwest-1.amazonaws.com.cn:5306
```
设置后，数据库客户端工具/系统可以使用127.0.0.1:5306进行访问
### 3. 配置数据库连接信息
系统会读取SecretsManager(default profile)里名为SDPS的信息，格式如下行所示，请按此配置。Secret type选择"Other type of secret"。
```json
{"username":"db username","password":"db password","engine":"mysql","host":"127.0.0.1","port":5306}
```
### 4. 本地运行
```shell
uvicorn main:app --reload
```
### 5. 查看API
http://127.0.0.1:8000/docs

## 模块文件命名
| 文件名              | 作用        |
|------------------|-----------|
| main.py          | controller |
| service.py       | service   |
| schemas.py       | VO        |
| crud.py          | DAO       |
| db/models-xxx.py | DO        |

## 添加一个模块
### 1. 生成DDL sql
建议使用DataGrip，Place constraints采用Inside table模式
### 2. 安装omm
```shell
pip install omymodels
```
### 3. 生成models
```shell
omm db.sql -m sqlalchemy -t models_xxx.py
```
### 4. 生成schemas
```shell
omm db.sql -m pydantic --defaults-off -t schemas.py
```
### 5. 编写模块代码
正常开发controller、service、dao，适当修改schemas.py
### 6. 添加API导出
在根目录下的main.py添加模块的router

```python
from discovery_job.main import router as discovery_router

app.include_router(discovery_router)
```

### 6. 手动打包测试
```
zip -r api.zip * -x "venv/*" "lambda/*_test.py"
```
