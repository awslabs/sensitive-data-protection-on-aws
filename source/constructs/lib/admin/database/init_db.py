import logging
from crhelper import CfnResource
import boto3
import json
import os
import pymysql
import traceback

logger = logging.getLogger('init_db')
logger.setLevel(logging.INFO)

helper = CfnResource(json_logging=False, log_level='DEBUG', boto_level='CRITICAL', sleep_on_delete=120, ssl_verify=None)


def __get_sql_files(path):
    files = []
    filenames = os.listdir(path)
    for filename in filenames:
        if filename.endswith(".sql") and filename != "db.sql" and filename != "init.sql":
            files.append(f"{path}/{filename}")
    return files


def __exec_file(cursor, sql_file):
    logger.info(f"exec file:{sql_file}")
    with open(sql_file, 'r') as f:
        full_sql = f.read()
    all_sql = full_sql.split(";")
    for sql in all_sql:
        sql = sql.strip()
        if sql == "":
            continue
        cursor.execute(sql)


def main(event):
    secret_id = os.getenv("SecretId", event["ResourceProperties"]["SolutionNameAbbr"])
    secrets_client = boto3.client('secretsmanager')
    secret_response = secrets_client.get_secret_value(SecretId=secret_id)
    secrets = json.loads(secret_response['SecretString'])
    db = pymysql.connect(host=secrets['host'],
                         port=secrets['port'],
                         user=secrets['username'],
                         password=secrets['password'],
                         database=secrets['dbname'])
    db.autocommit(True)
    cursor = db.cursor()
    __exec_file(cursor, './db.sql')
    sql_files = __get_sql_files(".")
    for sql_file in sql_files:
        __exec_file(cursor, sql_file)
    __exec_file(cursor, './init.sql')
    db.close()


@helper.create
def create(event, context):
    try:
        main(event)
    except Exception:
        msg = traceback.format_exc()
        error_msg = f"Error initializing database:{msg}"
        logger.exception(error_msg)
        raise ValueError(error_msg)
    return "MyResourceId"


@helper.update
def update(event, context):
    logger.info("Got Update")
    return "MyResourceId"


@helper.delete
def delete(event, context):
    logger.info("Got Delete")
    return "MyResourceId"


def lambda_handler(event, context):
    logger.info(event)
    helper(event, context)
