import sqlalchemy as sa
from db.database import Base


class Template(Base):

    __tablename__ = 'template'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    name = sa.Column(sa.String(255))
    status = sa.Column(sa.SmallInteger())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class TemplateIdentifier(Base):

    __tablename__ = 'template_identifier'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    description = sa.Column(sa.String(255))
    type = sa.Column(sa.SmallInteger())
    version = sa.Column(sa.Integer())
    name = sa.Column(sa.String(255), nullable=False)
    category = sa.Column(sa.SmallInteger())
    privacy = sa.Column(sa.SmallInteger())
    rule = sa.Column(sa.String(1024))
    header_keywords = sa.Column(sa.String(255))
    create_by = sa.Column(sa.String(255))
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())
    create_time = sa.Column(sa.TIMESTAMP())


class TemplateMapping(Base):

    __tablename__ = 'template_mapping'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    template_id = sa.Column(sa.Integer())
    identifier_id = sa.Column(sa.Integer())
    status = sa.Column(sa.SmallInteger())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())

    __mapper_args__ = {"version_id_col": version}
