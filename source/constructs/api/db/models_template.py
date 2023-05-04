import sqlalchemy as sa
from sqlalchemy.orm import relationship
from db.database import Base


class TemplateIdentifierPropRef(Base):

    __tablename__ = 'template_identifier_prop_ref'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    identifier_id = sa.Column(sa.Integer())
    prop_id = sa.Column(sa.Integer())
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


class Template(Base):

    __tablename__ = 'template'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    name = sa.Column(sa.String(255))
    snapshot_no = sa.Column(sa.String(32))
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
    classification = sa.Column(sa.SmallInteger())
    privacy = sa.Column(sa.SmallInteger())
    rule = sa.Column(sa.String(1024))
    header_keywords = sa.Column(sa.String(255))
    props = relationship(
        'TemplateIdentifierProp',
        secondary='template_identifier_prop_ref',
        primaryjoin='TemplateIdentifier.id == template_identifier_prop_ref.c.identifier_id',
        secondaryjoin='template_identifier_prop_ref.c.prop_id == TemplateIdentifierProp.id',
        lazy="joined",
        back_populates='identifiers',
    )
    create_by = sa.Column(sa.String(255))
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())
    create_time = sa.Column(sa.TIMESTAMP())


class TemplateIdentifierProp(Base):

    __tablename__ = 'template_identifier_prop'

    id = sa.Column(sa.Integer(), autoincrement=True, primary_key=True)
    prop_name = sa.Column(sa.String(32))
    prop_type = sa.Column(sa.Integer())
    identifiers = relationship(
        'TemplateIdentifier',
        secondary='template_identifier_prop_ref',
        primaryjoin='TemplateIdentifierProp.id == template_identifier_prop_ref.c.prop_id',
        secondaryjoin='template_identifier_prop_ref.c.identifier_id == TemplateIdentifier.id',
        back_populates='props'
    )
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.TIMESTAMP())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.TIMESTAMP())


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
