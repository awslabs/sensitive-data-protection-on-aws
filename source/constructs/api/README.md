# API Introduction
## Run locally
Python version requirement 3.9
### 1. Installation package
```shell
pip install -r requirements.txt
pip install uvicorn
```
### 2. Connect to the database locally
RDS is in a VPC private subnet. You can connect using an SSH tunnel.  
You need to start an EC2 in the public subnet first.
```shell
ssh -i SDPS.pem ec2-user@EC2-IP -Nf -L 6306:xxx.rds.cn-northwest-1.amazonaws.com.cn:6306
```
After setting, the database client tool/program can be accessed using 127.0.0.1:6306.
### 3. Configure database connection information
The program will read the information named `SDPS` in the SecretsManager (default profile).  
You can use the following command to modify the default SecretId.
```shell
export SecretId="NewSecretId"
```
As shown in the following format. Please follow this configuration. Select 'Other type of secret' for Secret type.
```json
{"username":"db username","password":"db password","engine":"mysql","host":"127.0.0.1","port":6306}
```
### 4. Configuration development mode
The following command is configured as development mode to bypass authentication.
```shell
export mode=dev
```
The following command is to configure the bucket name.
```shell
export ProjectBucketName="YourBucketName"
```
The following command is to configure the name of controller.You can get the name of controller from lambda console.
```shell
export ControllerFunctionName="YourControllerName"
```
### 5. Starting web services locally
```shell
uvicorn main:app --reload
```
### 6. View API
http://127.0.0.1:8000/docs

## File Naming
| File Name         | Role        |
|------------------|-----------|
| main.py          | controller |
| service.py       | service   |
| schemas.py       | VO        |
| crud.py          | DAO       |
| db/models-xxx.py | DO        |

## Add a module
### 1. Generate DDL sql
Recommend using DataGrip, Place constraints use Inside table mode
### 2. Install omm
```shell
pip install omymodels
```
### 3. Generate models
```shell
omm db.sql -m sqlalchemy -t models_xxx.py
```
### 4. Generate schemas
```shell
omm db.sql -m pydantic --defaults-off -t schemas.py
```
### 5. Coding
Develop controllers, services, dao normally, and modify schemas
### 6. Export API
Add the router for the module to main.py in the root directory

```python
from discovery_job.main import router as discovery_router

app.include_router(discovery_router)
```

### 7. Manual packaging testing
```shell
zip -r api.zip * -x "venv/*" "lambda/*_test.py"
```
Then put this zip file into lambda and run it.