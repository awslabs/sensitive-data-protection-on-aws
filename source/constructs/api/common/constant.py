class _Const(object):
    class ConstError(TypeError):
        def __init__(self, msg):
            super().__init__(msg)

    def __setattr__(self, name, value):
        if name in self.__dict__:
            err = self.ConstError("Can't change const.%s" % name)
            raise err
        if not name.isupper():
            err = self.ConstError('Const name "%s" is not all uppercase' % name)
            raise err
        self.__dict__[name] = value


const = _Const()

const.SOLUTION_FULL_NAME = "Sensitive Data Protect Solution"
const.SOLUTION_NAME = "SDPS"
const.ADMIN_BUCKET_NAME_PREFIX = "sdps-admin"
const.AGENT_BUCKET_NAME_PREFIX = "sdps-agent"

const.LOGGER_API = "api"

const.PUBLIC_ACCOUNT_ID_CN = "753680513547"
const.PUBLIC_ACCOUNT_ID_GLOBAL = "366590864501"

const.RESPONSE_SUCCESS = "success"
const.RESPONSE_FAIL = "fail"
const.ON_DEMAND = "OnDemand"
const.MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const.OIDC_CONFIGURATION_URL = "/.well-known/openid-configuration"
const.OIDC_ISSUER = "OidcIssuer"
const.OIDC_CLIENT_ID = "OidcClientId"
const.OIDC_JWKS_URI = "OidcJwksUri"
const.JWT_TOKEN_EXPIRE_TIME = 60 * 60 * 2
const.JWT_ALGORITHM = "HS256"
const.JWT_SECRET = ""
const.NA = "N/A"
const.PROJECT_BUCKET_NAME = "ProjectBucketName"
const.USER = "user"
const.USER_DEFAULT_NAME = "SDPS"
const.JOB_RESULT_DATABASE_NAME = "sdps_database"
const.JOB_RESULT_TABLE_NAME = "job_detection_output_table"
const.JOB_SAMPLE_RESULT_TABLE_NAME = "job_sample_output_table"
const.CATALOG_SAMPLE_ITEM_COUNT = 10
const.MODE = 'mode'
const.MODE_DEV = 'dev'
const.EXCLUDE_PATH_LIST = ['/', '/docs', '/openapi.json']
const.JOB_INTERVAL_WAIT = 10
const.JOB_QUEUE_NAME = const.SOLUTION_NAME + '-DiscoveryJob'
const.RDS_SUPPORTED_ENGINES = ['aurora-mysql', 'mysql', 'aurora-postgres', 'postgres']
const.RDS_AVAILABLE = 'available'
const.RDS_DBID = 'sdps-rds'
const.PARTITION_CN = 'aws-cn'
const.URL_SUFFIX_CN = '.cn'
const.DEFAULT_TEMPLATE_ID = 1
const.VERSION = 'Version'
const.TAG_ADMIN_ACCOUNT_ID = 'AdminAccountId'
const.TAG_KEY = 'Owner'
const.TAG_VALUE = const.SOLUTION_NAME
const.EMPTY_STR = ''
const.MANUAL = 'manual'
const.SYSTEM = 'system'
const.SAMPLE_LIMIT = 1000
const.LAMBDA_MAX_RUNTIME = 900
const.EXPORT_FILE_S3_COLUMNS = ["account_id", "region", "type", "s3_bucket", "folder_name", "column_name", "column_path", "identifiers", "sample_data",
                                "bucket_catalog_label", "folder_catalog_label", "comment"]
const.EXPORT_FILE_RDS_COLUMNS = ["account_id", "region", "type", "rds_instance_id", "table_name", "column_name", "identifiers", "sample_data",
                                 "instance_catalog_label", "table_catalog_label", "comment"]
const.EXPORT_FILE_GLUE_COLUMNS = ["account_id", "region", "type", "glue_database", "table_name",  "column_name", "identifiers", "sample_data",
                                 "instance_catalog_label", "table_catalog_label", "comment"]
const.EXPORT_FILE_JDBC_COLUMNS = ["account_id", "region", "type", "jdbc_connection", "table_name", "column_name", "identifiers", "sample_data",
                                 "instance_catalog_label", "table_catalog_label", "comment"]
const.EXPORT_XLSX_MAX_LINES = 30000
const.EXPORT_CSV_MAX_LINES = 60000
const.EXPORT_S3_MARK_STR = "Amazon_S3"
const.EXPORT_RDS_MARK_STR = "Amazon_RDS"
const.EXPORT_GLUE_MARK_STR = "Amazon_GLUE"
const.EXPORT_JDBC_MARK_STR = "JDBC"
const.SECURITY_GROUP_JDBC = "SDPS-CustomDB"
const.NUMBER_OF_OBJECTS = 'NumberOfObjects'
const.BUCKET_SIZE_BYTES = 'BucketSizeBytes'
const.YES = 'Yes'
const.NO = 'No'
const.PUBLIC = 'Public'
const.PRIVATE = 'Private'

const.UNSTRUCTURED_FILES = {
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
