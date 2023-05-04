import sqlalchemy as sa
from db.database import Base


class Label(Base):
    __tablename__ = 'label'

    id = sa.Column(sa.Integer(), primary_key=True)
    label_name = sa.Column(sa.String(40), nullable=False)
    classification = sa.Column(sa.String(20), nullable=False)
    type = sa.Column(sa.String(20), nullable=False)
    style_type = sa.Column(sa.String(20), nullable=False)
    style_value = sa.Column(sa.String(20), nullable=False)
    state = sa.Column(sa.String(20))
    version = sa.Column(sa.Integer())
    create_by = sa.Column(sa.String(255))
    create_time = sa.Column(sa.DateTime())
    modify_by = sa.Column(sa.String(255))
    modify_time = sa.Column(sa.DateTime())
