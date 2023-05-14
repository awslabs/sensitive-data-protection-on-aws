from enum import Enum, unique


# system             1000 ~ 1099
# user               1100 ~ 1199
# data-source        1200 ~ 1299
# catalog            1300 ~ 1399
# template           1400 ~ 1499
# discovery-job      1500 ~ 1599
# query              1600 ~ 1699
@unique
class MessageEnum(Enum):
    # system
    BIZ_UNKNOWN_ERR = {1000: "An application error occurred and has been logged to CloudWatch Logs"}
    BIZ_DEFAULT_OK = {1001: "Operation succeeded"}
    BIZ_DEFAULT_ERR = {1002: "Operation failed"}
    BIZ_INVALID_TOKEN = {1003: "Invalid token"}
    BIZ_TIMEOUT_TOKEN = {1004: "Timeout token"}
    BIZ_ITEM_NOT_EXISTS = {1005: "The item does not exist"}

    # template
    TEMPLATE_NOT_EXISTS = {1401: "The classification template does not exist"}
    TEMPLATE_IDENTIFIER_NOT_EXISTS = {1402: "The data identifier does not exist"}
    TEMPLATE_IDENTIFIER_EXISTS = {1403: "A data identifier with the same name already exists"}
    TEMPLATE_IDENTIFIER_USED = {1404: "The data identifier is being used"}
    TEMPLATE_PROPS_USED = {1405: "The item is being used"}
    TEMPLATE_PROPS_EXISTS = {1406: "A category/regulation with the same name already exists"}
    TEMPLATE_PROPS_NOT_EXISTS = {1407: "The category/regulation does not exist"}
    TEMPLATE_IDENTIFIER_RULES_EMPTY = {1408: "Identifier rules can not be empty"}

    # discovery job
    DISCOVERY_JOB_NON_EXIST = {1510: "The discovery job does non exist"}
    DISCOVERY_JOB_INVALID_PARAMETER = {1511: "Invalid parameter"}
    DISCOVERY_JOB_NON_RUNNING = {1512: "The job is not running"}
    DISCOVERY_RUN_NON_EXIST = {1513: "The running information does non exist"}
    DISCOVERY_JOB_CAN_CHANGE_STATE = {1514: "Only scheduled job can change state"}
    DISCOVERY_JOB_CAN_DISABLE = {1515: "Only idle job can be disabled"}
    DISCOVERY_JOB_CAN_ENABLE = {1516: "Only paused jobs can be enabled"}
    DISCOVERY_JOB_CAN_NOT_DELETE_JOB = {1517: "Could not delete a running job"}
    DISCOVERY_JOB_CAN_NOT_DELETE_ACCOUNT = {1518: "This account cannot be deleted because it has running job(s)."}
    DISCOVERY_JOB_CAN_NOT_DELETE_DATABASE = {1519: "This database cannot be deleted because it has running job(s)."}
    DISCOVERY_RUN_NON_EXIST_TEMPLATE_SNAPSHOT = {1520: "This running does not have a template snapshot."}

    # catalog
    CATALOG_RDS_TABLE_HAS_NO_COLUMNS = {1301: "RDS table columns does not exist"}
    CATALOG_DATABASE_TYPE_ERR = {1302: "Database type error, only s3 and rds database_type are supported"}
    CATALOG_CRAWLER_SYNC_DELETE_FAILED = {1303: "Delete catalog failed before sync crawler result"}
    CATALOG_DATABASE_PROPERTY_GET_FAILED = {1304: "Get database property failed"}
    CATALOG_DATABASE_DELETE_FAILED = {1305: "Delete catalog database failed"}
    CATALOG_TABLE_DELETE_FAILED = {1306: "Delete catalog table failed"}
    CATALOG_COLUMN_DELETE_FAILED = {1307: "Delete catalog column failed"}
    CATALOG_UPDATE_FAILED = {1308: "Update catalog column failed"}

    # data source
    SOURCE_RDS_NO_SCHEMA = {1200: "There is no user created schema found in the database"}
    SOURCE_RDS_NOT_FINISHED = {1201: "Connection being created"}
    SOURCE_RDS_CREATE_FAILED = {1202: "Database connection created failed"}
    SOURCE_RDS_ALREADY_CREATED = {1203: "Database connection already created"}
    SOURCE_S3_NO_BUCKET = {1204: "S3 bucket does not exist"}
    SOURCE_S3_NO_CRAWLER = {1227: "S3 bucket has not been connected"}
    SOURCE_S3_NO_DATABASE = {1228: "Catalog has not been created"}
    SOURCE_RDS_NO_INSTANCE = {1229: "Database instance does not exist"}
    SOURCE_RDS_NO_CRAWLER = {1230: "Database has not been connected"}
    SOURCE_RDS_NO_DATABASE = {1231: "Catalog has not been created"}
    SOURCE_S3_CONNECTION_DELETE_ERROR = {1205: "Failed to delete S3 bucket connection"}
    SOURCE_RDS_CONNECTION_DELETE_ERROR = {1206: "Failed to delete RDS instance connection"}
    SOURCE_CONNECTION_NOT_FINISHED = {1207: "Connection being created"}
    SOURCE_CONNECTION_FAILED = {1208: "Database connection created failed"}
    SOURCE_CONNECTION_ACTIVE = {1209: "Database connection already created"}
    SOURCE_CONNECTION_CRAWLING = {1210: "Data catalog being crawled"}
    SOURCE_CONNECTION_NOT_EXIST = {1211: "Database connection has not been created yet"}
    SOURCE_RDS_NO_AUTH = {1212: "No authorization"}
    SOURCE_RDS_DUPLICATE_AUTH = {1213: "Duplicate authorization"}
    SOURCE_S3_EMPTY_BUCKET = {1214: "Could not connect to empty bucket"}
    SOURCE_ASSUME_ROLE_FAILED = {1215: "Cannot find trusted policy, please deploy the agent CloudFormation stack first"}
    SOURCE_REFRESH_FAILED = {1216: "Parameter is missing"}
    SOURCE_ASSUME_DELEGATED_ROLE_FAILED = {1217: "Assume role failed in the target account"}
    SOURCE_DO_NOT_SUPPORT_CROSS_REGION = {1218: "Cross region connection is not allowed"}
    SOURCE_RDS_NO_VPC_S3_ENDPOINT = {1219: "Could not find S3 endpoint or NAT gateway for subnetId in VPC"}
    SOURCE_RDS_NO_VPC_GLUE_ENDPOINT = {1220: "Could not find Glue endpoint or NAT gateway for subnetId in VPC"}
    SOURCE_RDS_PUBLIC_ACCESSABLE = {1221: "Could not connect to a publicly accessible database"}
    SOURCE_ACCOUNT_NOT_EXIST = {1222: "Account does not exist"}
    SOURCE_ACCOUNT_AGENT_EXIST = {1223: "Could not delete account, please delete agent CloudFromation stack first"}
    SOURCE_ACCOUNT_DELETE_FAILED = {1224: "Account cleanup with error"}
    SOURCE_SOURCE_USED_BY_JOB = {1225: "Could not disconnect data source connection, the data source is used by discovery job"}
    SOURCE_DELETE_WHEN_CONNECTING = {1226: "Could not disconnect data source while connection is creating"}

    def get_code(self):
        return list(self.value.keys())[0]

    def get_msg(self):
        return list(self.value.values())[0]


@unique
class IdentifierType(Enum):
    BUILT_IN = 0
    CUSTOM = 1


@unique
class JobState(Enum):
    IDLE = "Active (idle)"
    RUNNING = "Active (running)"
    PAUSED = "Paused"
    OD_READY = "Ready"
    OD_RUNNING = "Running"
    OD_COMPLETED = "Completed"


@unique
class RunState(Enum):
    READY = "Ready"
    RUNNING = "Running"
    COMPLETED = "Completed"
    STOPPED = "Stopped"


@unique
class RunDatabaseState(Enum):
    READY = "Ready"
    RUNNING = "Running"
    SUCCEEDED = "Succeeded"
    FAILED = "Failed"
    STOPPED = "Stopped"
    NOT_EXIST = "NotExist"


@unique
class DatabaseType(Enum):
    RDS = "rds"
    S3 = "s3"
    DDB = "ddb"
    EMR = "emr"


@unique
class CatalogState(Enum):
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    DETECTED = "DETECTED"


@unique
class AthenaQueryState(Enum):
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


@unique
class GlueCrawlerState(Enum):
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


@unique
class GlueResourceNameSuffix(Enum):
    DATABASE = "database"
    CRAWLER = "crawler"


@unique
class Privacy(Enum):
    PII = 1
    NON_PII = 0
    NA = -1


@unique
class CatalogDashboardAttribute(Enum):
    REGION = 'region'
    PRIVACY = 'privacy'


@unique
class CatalogModifier(Enum):
    MANUAL = "Manual"
    SYSTEM = "System"


@unique
class ConnectionState(Enum):
    PENDING = "PENDING"
    CRAWLING = "CRAWLING"
    ACTIVE = "ACTIVE"
    UNSUPPORTED = "UNSUPPORTED FILE TYPES"
    ERROR = "ERROR"
    STOPPING = "STOPPING"


@unique
class IdentifierDependency(Enum):
    TEMPLATE = "template"
    RDS = "rds"
    S3 = "s3"


@unique
class LabelState(Enum):
    ONLINE = "online"
    OFFLINE = "offline"


@unique
class LabelClassification(Enum):
    DEFAULT = "default"
    CATALOG = "catalog"


@unique
class LabelType(Enum):
    DEFAULT = "default"
    DATABASE = "database"
    TABLE = "table"


@unique
class LabelStyleType(Enum):
    DEFAULT = "default"
    COLOR = "color"


@unique
class ConditionType(Enum):
    AND = "and"
    OR = "or"


@unique
class OperationType(Enum):
    EQUAL = "="
    NOT_EQUAL = "!="
    CONTAIN = ":"
    NOT_CONTAIN = "!="
