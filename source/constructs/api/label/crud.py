import db.models_label as models
from tools.pydantic_tool import parse_pydantic_schema
from db.database import get_session
from . import schemas
from common.exception_handler import BizException
from common.enum import MessageEnum
import datetime
from typing import List


def get_labels_by_id_list(id_list: List[int]) -> List[models.Label]:
    session = get_session()
    query = session.query(models.Label).filter(models.Label.id.in_(id_list))
    labels = query.all()
    return labels


def search_labels_by_name(label_name: str) -> List[models.Label]:
    session = get_session()
    query = session.query(models.Label).filter(models.Label.label_name.ilike("%" + label_name + "%"))
    labels = query.all()
    return labels


def search_detail_labels_by_page(
    label_search: schemas.LabelSearch,
):
    query = get_session().query(models.Label)
    if label_search.id is not None and label_search.id > 0:
        query = query.filter(models.Label.id == label_search.id)
    if label_search.label_name is not None:
        query = query.filter(models.Label.label_name.ilike(
            "%" + label_search.label_name + "%"
        ))
    if label_search.classification is not None and label_search.classification.strip():
        query = query.filter(
            models.Label.classification == label_search.classification
        )
    if label_search.type is not None and label_search.type.strip():
        query = query.filter(
            models.Label.type == label_search.type
        )
    if label_search.style_type is not None and label_search.style_type.strip():
        query = query.filter(
            models.Label.style_type == label_search.style_type
        )
    if label_search.style_value is not None and label_search.style_value.strip():
        query = query.filter(
            models.Label.style_value == label_search.style_value
        )
    if label_search.state is not None and label_search.state.strip():
        query = query.filter(
            models.Label.state == label_search.state
        )
    result = query.order_by(
        models.Label.modify_time
    )
    return result


def create_label(label: schemas.LabelCreate) -> models.Label:
    session = get_session()
    parsed_schema = parse_pydantic_schema(label)
    now = datetime.datetime.now()
    # 将时间转换为 SQLite DateTime 格式
    formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')

    db_label = models.Label(**parsed_schema,
                            create_time=formatted_date,
                            modify_time=formatted_date
                            )
    session.add(db_label)
    session.commit()
    print(db_label.id)
    return db_label


def update_label(
        id: int,
        label: schemas.LabelUpdate
):
    session = get_session()
    db_label = session.query(models.Label).filter(models.Label.id == id).first()
    if not db_label:
        raise BizException(
            MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(),
            MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg()
        )

    # 将version字段+1
    if db_label.version is not None and db_label.version.isdigit():
        db_label.version += 1

    now = datetime.datetime.now()
    # 将时间转换为 SQLite DateTime 格式
    formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
    label.modify_time = formatted_date

    session.query(models.Label).filter(models.Label.id == id).update(label.dict(exclude_unset=True))
    session.commit()
    return True


def delete_label(
        id: int
    ):
    try:
        session = get_session()
        session.query(models.Label).filter(
            models.Label.id == id
        ).delete()
        session.commit()
        return True
    except Exception:
        raise BizException(
            MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(),
            MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg()
        )


