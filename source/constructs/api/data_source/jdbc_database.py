from abc import abstractmethod, ABCMeta
from common.reference_parameter import logger
from common.exception_handler import BizException
from common.enum import MessageEnum
import pymysql
import traceback


class JdbcDatabase(metaclass=ABCMeta):
    @abstractmethod
    def list_databases(self) -> list[str]:
        pass


class MySQLDatabase(JdbcDatabase):
    ignored_databases = ['information_schema', 'innodb', 'mysql', 'performance_schema', 'sys', 'tmp']

    def __init__(self, host, port, user, password):
        self.host = host
        self.port = port
        self.user = user
        self.password = password

    def list_databases(self):
        databases = []
        try:
            db = pymysql.connect(host=self.host,
                                 port=self.port,
                                 user=self.user,
                                 password=self.password)
        except Exception as e:
            logger.info(e)
            raise BizException(MessageEnum.SOURCE_JDBC_LIST_DATABASES_FAILED.get_code(),
                               str(e.args[1]) if e.args else traceback.format_exc())

        try:
            cursor = db.cursor()
            sql = "show databases;"
            cursor.execute(sql)
            results = cursor.fetchall()
            for row in results:
                database = row[0]
                if database not in self.ignored_databases:
                    databases.append(row[0])

            return databases
        except Exception as e:
            logger.exception(e)
            raise BizException(MessageEnum.SOURCE_JDBC_LIST_DATABASES_FAILED.get_code(),
                               MessageEnum.SOURCE_JDBC_LIST_DATABASES_FAILED.get_msg())
        finally:
            cursor.close()
            db.close()
