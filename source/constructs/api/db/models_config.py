import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()


class Config(Base):

    __tablename__ = 'config'

    id = sa.Column(sa.Integer(), primary_key=True)
    config_key = sa.Column(sa.String(50), nullable=False, unique=True)
    config_value = sa.Column(sa.String(1000))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())
