import logging
import boto3
import json
import os
import pymysql

logger = logging.getLogger('api')
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    path = "1.0.0-1.0.1"
    if "path" in event:
        path = event["path"]
    logger.info(f"exec path:{path}")
    main(path)
    return {
        'statusCode': 200,
        'body': json.dumps('Upgrade Successful!')
    }


def __get_sql_files(path):
    files = []
    filenames = os.listdir(path)
    for filename in filenames:
        if filename.endswith(".sql"):
            files.append(f"{path}/{filename}")
    list.sort(files)
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


def __check_version(cursor, path):
    sql = 'select value from version'
    check = True
    to_version = path.split("-")[1]
    logger.info(f"To Version:{to_version}")
    cursor.execute(sql)
    results = cursor.fetchall()
    for row in results:
        if row[0] == to_version:
            check = False
            break
    logger.info(f"Check result:{check}")
    return check


def main(path):
    secrets_client = boto3.client('secretsmanager')
    secret_response = secrets_client.get_secret_value(SecretId="SDPS")
    secrets = json.loads(secret_response['SecretString'])
    db = pymysql.connect(host=secrets['host'],
                         port=secrets['port'],
                         user=secrets['username'],
                         password=secrets['password'],
                         database=secrets['dbname'])
    db.autocommit(True)
    cursor = db.cursor()
    try:
        check_result = __check_version(cursor, path)
        if not check_result:
            logger.info("The upgrade script is currently included")
            return
        sql_files = __get_sql_files(path)
        for sql_file in sql_files:
            __exec_file(cursor, sql_file)
    finally:
        cursor.close()
        db.close()