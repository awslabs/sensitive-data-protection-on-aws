#!/usr/bin/python
import json
import mysql.connector
import pg8000.native


def lambda_handler(event, context):
    schema_path_list = []
    try:
        if event["engine"] == "aurora-mysql" or event["engine"] == "mysql":
            conn = mysql.connector.connect(
                host=event["host"],
                port=event["port"],
                user=event["username"],
                password=event["password"],
                connection_timeout=1,
            )
            if conn.is_connected():
                mysql_sys_db = ["mysql", "information_schema", "performance_schema", "sys"]
                cursor = conn.cursor()
                databases = "show databases"
                cursor.execute(databases)
                for databases in cursor:
                    schema_path_list.append(
                        {"name": databases[0], "system": databases[0] in mysql_sys_db}
                    )
        elif event["engine"] == "aurora-postgres" or event["engine"] == "postgres":

            conn = pg8000.native.Connection(
                host=event["host"],
                port=event["port"],
                user=event["username"],
                password=event["password"],
                ssl_context=True,
                database=None,
                timeout=2
            )

            db_list = conn.run('SELECT datname FROM pg_database WHERE datistemplate = false;')
            for db in db_list:
                conn = pg8000.native.Connection(
                    host=event["host"],
                    port=event["port"],
                    user=event["username"],
                    password=event["password"],
                    ssl_context=True,
                    database=db[0],
                    timeout=2
                )
                schema_list = conn.run(
                    'SELECT schema_name FROM information_schema.schemata WHERE schema_owner <> \'rdsadmin\';')
                for schema in schema_list:
                    schema_path_list.append(
                        {"name": f"{db[0]}/{schema[0]}", "system": False}
                    )
    except Exception as err:
        return {
            'statusCode': 500,
            'errorMessage': str(err)
        }

    return {
        'statusCode': 200,
        'schema': schema_path_list
    }
# https://docs.aws.amazon.com/glue/latest/dg/connection-properties.html#connection-properties-jdbc
