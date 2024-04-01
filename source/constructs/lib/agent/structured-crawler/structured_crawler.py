import json
import boto3
import logging.config
from time import sleep

logging.config.fileConfig('logging.conf', disable_existing_loggers=False)
logger = logging.getLogger("api")

caller_identity = boto3.client('sts').get_caller_identity()
account_id = caller_identity.get('Account')
region = boto3.session.Session().region_name
partition = caller_identity['Arn'].split(':')[1]

s3_client = boto3.client('s3')
glue_client = boto3.client('glue')
lakeformation_client = boto3.client('lakeformation')
SOLUTION_NAME = "SDPS"
SLEEP_TIME = 5
SLEEP_MIN_TIME = 2
GRANT_PERMISSIONS_RETRIES = 10
TAG_ADMIN_ACCOUNT_ID = 'AdminAccountId'
TAG_KEY = 'Owner'
TAG_VALUE = SOLUTION_NAME
UNSTRUCTURED_FILES = {
    "document": ["doc", "docx", "pdf", "ppt", "pptx", "xls", "xlsx", "odp"],
    "webpage": ["htm", "html"],
    "email": ["eml"],
    "code": ["java", "py", "cpp", "c", "h", "html", "css", "js", "php", "rb", "swift", "go", "sql", "yaml", "xml"],
    "text": ["txt", "md", "log"],
    "image": ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "tif"],
    "media": ["mp3", "wav", "aac", "flac", "wma", "ogg", "m4a", "opus", "mp4", "avi", "mkv", "wmv", "mov",
              "flv", "webm", "m4v", "mp2", "m4r", "3ga", "mid", "ra", "amr", "ape", "wv", "dsf", "mpeg",
              "3gp", "ogv", "vob", "mts", "rm"],
    "ebook": ["epub", "mobi", "pdf", "azw", "djvu", "fb2", "lit", "pdb", "txt", "html", "cbz", "ibooks", "azw4"],
    "archive": ["zip", "7z", "rar", "targz", "tgz", "tarbz2", "tbz2", "tarxz", "txz", "gz", "bz2", "xz", "zipx", "z"],
    "temp": ["tmp", "swp", "~", "bak", "temp", "wbk", "chk", "dmgpart"],
    "executable": ["exe", "dll", "app"],
    "font": ["ttf", "otf"]
}

def list_sub_folders(folders, bucket_name, prefix=""):
    paginator = s3_client.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=bucket_name, Prefix=prefix, Delimiter="/", PaginationConfig={"PageSize": 1000})
    for page in pages:
        if page.get("CommonPrefixes"):
            for common_prefix in page.get("CommonPrefixes"):
                current_prefix = common_prefix["Prefix"]
                folders.append(current_prefix)
                list_sub_folders(folders, bucket_name, current_prefix)


def __get_excludes_file_exts():
    extensions = list(set([ext for extensions_list in UNSTRUCTURED_FILES.values() for ext in extensions_list]))
    return ["*.{" + ",".join(extensions) + "}"]


def build_s3_targets(bucket_name, prefix):
    prefixes = [""]
    if prefix and prefix != ",":
        prefixes = prefix.split(",")
    s3_targets = []
    folders = []
    for current_prefix in prefixes:
        list_sub_folders(folders, bucket_name, current_prefix)
        s3_targets.append(
                    {
                        "Path": f"s3://{bucket_name}/{current_prefix}",
                        "SampleSize": 20,
                        "Exclusions": __get_excludes_file_exts()
                    }
                )
    for folder in folders:
        s3_targets.append(
                {
                    "Path": f"s3://{bucket_name}/{folder}",
                    "SampleSize": 20,
                    "Exclusions": __get_excludes_file_exts()
                }
            )
    return s3_targets


def set_s3_crawler(bucket_name: str, crawler_name: str, glue_database_name: str, prefix: str, admin_account_id: str):
    s3_targets = build_s3_targets(bucket_name, prefix)
    try:
        response = glue_client.get_crawler(Name=crawler_name)
        logger.info(response)
        try:
            response = glue_client.update_crawler(
                Name=crawler_name,
                Role=get_crawler_role(),
                DatabaseName=glue_database_name,
                Targets={
                    "S3Targets": s3_targets
                },
                SchemaChangePolicy={
                    'UpdateBehavior': 'UPDATE_IN_DATABASE',
                    'DeleteBehavior': 'DELETE_FROM_DATABASE'
                }
            )
            logger.info(response)
        except Exception as e:
            logger.info("update_crawler s3 error")
            logger.info(str(e))
    except glue_client.exceptions.EntityNotFoundException as e:
        response = glue_client.create_crawler(
            Name=crawler_name,
            Role=get_crawler_role(),
            DatabaseName=glue_database_name,
            Targets={
                "S3Targets": s3_targets
            },
            Tags={
                TAG_KEY: TAG_VALUE,
                TAG_ADMIN_ACCOUNT_ID: admin_account_id
            },
        )
        logger.info(response)


def get_crawler_role():
    return f'arn:{partition}:iam::{account_id}:role/{SOLUTION_NAME}GlueDetectionJobRole-{region}'

def create_glue_database(glue_database_name: str):
    try:
        glue_client.get_database(Name=glue_database_name)
    except glue_client.exceptions.EntityNotFoundException as e:
        logger.info(f"Not found glue database:{glue_database_name}, create it.")
        response = glue_client.create_database(DatabaseInput={'Name': glue_database_name})
        logger.debug(response)

    # retry for grant permissions
    num_retries = GRANT_PERMISSIONS_RETRIES
    while num_retries > 0:
        try:
            response = lakeformation_client.grant_permissions(
                Principal={
                    'DataLakePrincipalIdentifier': get_crawler_role()
                },
                Resource={
                    'Database': {
                        'Name': glue_database_name
                    }
                },
                Permissions=['ALL'],
                PermissionsWithGrantOption=['ALL']
            )
        except Exception as e:
            logger.info(e)
            sleep(SLEEP_MIN_TIME)
            num_retries -= 1
        else:
            break


def lambda_handler(event, context):
    database_type = event["DatabaseType"]
    create_glue_database(event["GlueDatabaseName"])
    if database_type == "s3":
        set_s3_crawler(event["DatabaseName"], event["CrawlerName"], event["GlueDatabaseName"], event["Prefix"], event["AdminAccountId"])
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Set crawler"
        }),
    }