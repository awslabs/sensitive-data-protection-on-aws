import sqlalchemy as sa
from db.database import Base


class CatalogColumnLevelClassification(Base):

    __tablename__ = 'catalog_column_level_classification'

    id = sa.Column(sa.Integer(), primary_key=True)
    account_id = sa.Column(sa.String(20), nullable=False)
    region = sa.Column(sa.String(20), nullable=False)
    database_type = sa.Column(sa.String(20), nullable=False)
    database_name = sa.Column(sa.String(255), nullable=False)
    table_name = sa.Column(sa.String(255), nullable=False)
    column_name = sa.Column(sa.String(255), nullable=False)
    column_type = sa.Column(sa.String(255), nullable=False)
    column_order_num = sa.Column(sa.Integer(), nullable=False)
    column_value_example = sa.Column(sa.Text())
    identifier = sa.Column(sa.String(2048))
    identifier_score = sa.Column(sa.Numeric(3, 2))
    privacy = sa.Column(sa.SmallInteger())
    sensitivity = sa.Column(sa.String(255), nullable=False)
    comments = sa.Column(sa.String(255))
    manual_tag = sa.Column(sa.String(20))
    state = sa.Column(sa.String(20))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())


class CatalogTableLevelClassification(Base):

    __tablename__ = 'catalog_table_level_classification'

    id = sa.Column(sa.Integer(), primary_key=True)
    account_id = sa.Column(sa.String(20), nullable=False)
    region = sa.Column(sa.String(20), nullable=False)
    database_type = sa.Column(sa.String(20), nullable=False)
    database_name = sa.Column(sa.String(255), nullable=False, info={'searchable': True})
    table_name = sa.Column(sa.String(255), nullable=False, info={'searchable': True})
    privacy = sa.Column(sa.SmallInteger(), info={'searchable': True})
    sensitivity = sa.Column(sa.String(255))
    object_count = sa.Column(sa.BigInteger())
    size_key = sa.Column(sa.BigInteger())
    column_count = sa.Column(sa.Integer())
    row_count = sa.Column(sa.Integer())
    storage_location = sa.Column(sa.String(2048))
    identifiers = sa.Column(sa.String(2048))
    label_ids = sa.Column(sa.String(255))
    manual_tag = sa.Column(sa.String(20))
    state = sa.Column(sa.String(20))
    classification = sa.Column(sa.String(255))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())


class CatalogDatabaseLevelClassification(Base):

    __tablename__ = 'catalog_database_level_classification'

    id = sa.Column(sa.Integer(), primary_key=True)
    account_id = sa.Column(sa.String(20), nullable=False, info={'searchable': True})
    region = sa.Column(sa.String(20), nullable=False, info={'searchable': True})
    database_type = sa.Column(sa.String(20), nullable=False)
    database_name = sa.Column(sa.String(255), nullable=False, info={'searchable': True})
    privacy = sa.Column(sa.SmallInteger())
    sensitivity = sa.Column(sa.String(255), nullable=False)
    object_count = sa.Column(sa.BigInteger())
    size_key = sa.Column(sa.BigInteger())
    table_count = sa.Column(sa.Integer(), info={'searchable': True})
    column_count = sa.Column(sa.Integer())
    row_count = sa.Column(sa.Integer())
    storage_location = sa.Column(sa.String(2048), info={'searchable': True})
    label_ids = sa.Column(sa.String(255))
    manual_tag = sa.Column(sa.String(20))
    state = sa.Column(sa.String(20))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())
