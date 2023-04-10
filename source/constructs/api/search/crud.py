from db.database import get_session
from fastapi_pagination import Params
from fastapi_pagination.ext.sqlalchemy import paginate

from db.database import get_session


def get_filter_values(searchable, column_name: str):
    if column_name is not None:
        # module = locate(f"db.{model_name}")
        column = getattr(searchable, column_name)
        return get_session().query(column).distinct(column).all()
    return []


def query(query, searchable):
    q = get_session().query(searchable)
    if query.conditions is not None:
        f = None
        for c in query.conditions:
            column = getattr(searchable, c.column)
            if c.condition == 'and':
                if f is None:
                    f = column.in_(c.values)
                else:
                    f = f, column.in_(c.values)

            elif c.condition == 'or':
                if f is None:
                    f = column.in_(c.values)
                else:
                    f = f | column.in_(c.values)
        if f is not None:
            q = get_session().query(searchable).filter(f)
    if query.sort_column is not None and query.sort_column != '':
        sort_column = getattr(searchable, query.sort_column)
        if query.asc:
            q = q.order_by(sort_column)
        else:
            q = q.order_by(sort_column.desc())

    return paginate(q, Params(
        size=query.size,
        page=query.page,
    ))
