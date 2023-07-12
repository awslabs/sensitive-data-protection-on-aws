import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()


class Version(Base):

    __tablename__ = 'version'

    id = sa.Column(sa.Integer(), primary_key=True)
    value = sa.Column(sa.String(100), nullable=False)
    description = sa.Column(sa.String(1000))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())
