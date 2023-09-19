import os
import threading
from sqlalchemy import event, create_engine
from sqlalchemy.orm import sessionmaker, Session
import boto3
import json
from common.constant import const
from sqlalchemy.ext.declarative import declarative_base
from common.db_base_col import before_exec

secret_id = os.getenv("SecretId", const.SOLUTION_NAME)
secrets_client = boto3.client('secretsmanager')
secret_response = secrets_client.get_secret_value(SecretId=secret_id)
secrets = json.loads(secret_response['SecretString'])
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{secrets['username']}:{secrets['password']}@{secrets['host']}:{secrets['port']}/{secrets['dbname']}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True, pool_size=1, max_overflow=0)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

event.listen(engine, "before_execute", before_exec)

local_session = threading.local()


def gen_session():
    session = SessionLocal()
    local_session.currentSession = session


def get_session() -> Session:
    return local_session.currentSession


def close_session():
    local_session.currentSession.close()
