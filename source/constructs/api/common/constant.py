class _const(object):
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


const = _const()

const.SOLUTION_FULL_NAME = "Sensitive Data Protect Solution"
const.SOLUTION_NAME = "SDPS"

const.LOGGER_API = "api"

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
const.PROJECT_BUCKET_DEFAULT_NAME = "sdps-admin"
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
const.PARTITION_CN = 'aws-cn'
const.URL_SUFFIX_CN = '.cn'
const.DEFAULT_TEMPLATE_ID = 1
const.VERSION = 'Version'
const.PROJECT_TAG_KEY = 'CreatedBy'
const.PROJECT_TAG_VALUE = const.SOLUTION_NAME
const.EMPTY_STR = ''
const.MSCK_REPAIR_DATE = 'MsckRepairDate'
const.MSCK_REPAIR_START_TIME = 'MsckRepairStartTime'
const.MANUAL = 'manual'
const.SYSTEM = 'system'
const.SAMPLE_LIMIT = 1000
const.EXPORT_FILE_S3_COLUMNS = ["account_id", "region", "s3_bucket", "folder_name", "column_name", "identifiers", "sample_data",
                                "bucket_catalog_label", "folder_catalog_label", "comment"]
const.EXPORT_FILE_RDS_COLUMNS = ["account_id", "region", "rds_instance_id", "table_name", "column_name", "identifiers", "sample_data",
                                 "instance_catalog_label", "table_catalog_label", "comment"]
const.EXPORT_XLSX_MAX_LINES = 30000
const.EXPORT_CSV_MAX_LINES = 60000
const.EXPORT_S3_MARK_STR = "Amazon_S3"
const.EXPORT_RDS_MARK_STR = "Amazon_RDS"

