from sqlalchemy import (Column, Integer, String, TIMESTAMP, SmallInteger)
from sqlalchemy.orm import relationship
from db.database import Base


class TemplateIdentifierPropRef(Base):

    __tablename__ = 'template_identifier_prop_ref'

    id = Column(Integer(), autoincrement=True, primary_key=True)
    identifier_id = Column(Integer())
    prop_id = Column(Integer())
    version = Column(Integer())
    create_by = Column(String(255))
    create_time = Column(TIMESTAMP())
    modify_by = Column(String(255))
    modify_time = Column(TIMESTAMP())


class Template(Base):

    __tablename__ = 'template'

    id = Column(Integer(), autoincrement=True, primary_key=True)
    name = Column(String(255))
    snapshot_no = Column(String(32))
    status = Column(SmallInteger())
    version = Column(Integer())
    create_by = Column(String(255))
    create_time = Column(TIMESTAMP())
    modify_by = Column(String(255))
    modify_time = Column(TIMESTAMP())


class TemplateIdentifier(Base):

    __tablename__ = 'template_identifier'

    id = Column(Integer(), autoincrement=True, primary_key=True)
    description = Column(String(255), info={'searchable': True})
    type = Column(SmallInteger())
    version = Column(Integer())
    name = Column(String(255), nullable=False, info={'searchable': True})
    classification = Column(SmallInteger())
    privacy = Column(SmallInteger())
    rule = Column(String(1024))
    header_keywords = Column(String(255))
    exclude_keywords = Column(String(255))
    props = relationship(
        'TemplateIdentifierProp',
        secondary='template_identifier_prop_ref',
        primaryjoin='TemplateIdentifier.id == template_identifier_prop_ref.c.identifier_id',
        secondaryjoin='template_identifier_prop_ref.c.prop_id == TemplateIdentifierProp.id',
        lazy="selectin",
        back_populates='identifiers',
    )
    create_by = Column(String(255))
    modify_by = Column(String(255))
    modify_time = Column(TIMESTAMP())
    create_time = Column(TIMESTAMP())


class TemplateIdentifierProp(Base):

    __tablename__ = 'template_identifier_prop'

    id = Column(Integer(), autoincrement=True, primary_key=True)
    prop_name = Column(String(32))
    prop_type = Column(Integer())
    identifiers = relationship(
        'TemplateIdentifier',
        secondary='template_identifier_prop_ref',
        primaryjoin='TemplateIdentifierProp.id == template_identifier_prop_ref.c.prop_id',
        secondaryjoin='template_identifier_prop_ref.c.identifier_id == TemplateIdentifier.id',
        back_populates='props'
    )
    version = Column(Integer())
    create_by = Column(String(255))
    create_time = Column(TIMESTAMP())
    modify_by = Column(String(255))
    modify_time = Column(TIMESTAMP())


class TemplateMapping(Base):

    __tablename__ = 'template_mapping'

    id = Column(Integer(), autoincrement=True, primary_key=True)
    template_id = Column(Integer())
    identifier_id = Column(Integer())
    status = Column(SmallInteger())
    version = Column(Integer())
    create_by = Column(String(255))
    create_time = Column(TIMESTAMP())
    modify_by = Column(String(255))
    modify_time = Column(TIMESTAMP())
