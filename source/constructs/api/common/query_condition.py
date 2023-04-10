from typing import Optional
from sqlalchemy.orm import Query
from pydantic import BaseModel
from sqlalchemy import and_
from sqlalchemy import or_
from enum import Enum


class ConditionEnum(str, Enum):
    condition_and = "and"
    condition_or = "or"


class Condition(BaseModel):
    column: str = ''
    values: list[str] = []
    condition: Optional[ConditionEnum] = ConditionEnum.condition_and


class QueryCondition(BaseModel):
    page: Optional[int] = 1
    size: Optional[int] = 20
    sort_column: Optional[str] = ''
    asc: Optional[bool] = True
    conditions: Optional[list[Condition]]


def query_with_condition(query: Query, condition: QueryCondition):
    if condition is not None:
        searchable = query.column_descriptions[0]["type"]
        if condition.conditions is not None:
            and_filters = []
            or_filters = []
            for c in condition.conditions:
                if c.column:
                    column = getattr(searchable, c.column)
                    if c.condition == 'and':
                        and_filters.append(column == c.values)
                    elif c.condition == 'or':
                        or_filters.append(column == c.values)
            if len(and_filters) > 0:
                query = query.filter(and_(*and_filters))
            if len(or_filters) > 0:
                query = query.filter(or_(*or_filters))
        if condition.sort_column is not None and condition.sort_column != '':
            sort_column = getattr(searchable, condition.sort_column)
            if condition.asc:
                query = query.order_by(sort_column)
            else:
                query = query.order_by(sort_column.desc())
    return query


def query_with_condition_multi_table(query: Query, condition: QueryCondition, mappings: dict, ignoreProperties: list[str]):
    if condition is not None:
        if condition.conditions is not None:
            for c in condition.conditions:
                if c.column:
                    if c.column in ignoreProperties:
                        pass
                    else:
                        query = query.filter(mappings[c.column] == c.values)            
    return query
