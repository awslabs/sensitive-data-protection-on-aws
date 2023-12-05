import db.models_label as models
from tools.pydantic_tool import parse_pydantic_schema
from db.database import get_session
from . import schemas
from common.exception_handler import BizException
from common.enum import MessageEnum
import datetime
from typing import List


def get_all_labels():
    return get_session().query(models.Label).all()

def get_labels_by_id_list(id_list: List[int]) -> List[models.Label]:
    session = get_session()
    query = session.query(models.Label).filter(models.Label.id.in_(id_list))
    labels = query.all()
    return labels


def search_labels_by_name(label_name: str) -> List[models.Label]:
    session = get_session()
    if not label_name:  # 检查 label_name 是否为空
        labels = session.query(models.Label).order_by(models.Label.label_name).all()
    else:
        query = session.query(models.Label).filter(models.Label.label_name.ilike("%" + label_name + "%")).order_by(models.Label.label_name)
        labels = query.all()

    return labels


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
    label_exist = session.query(models.Label)\
        .filter(models.Label.classification == db_label.classification)\
        .filter(models.Label.type == db_label.type)\
        .filter(models.Label.label_name == db_label.label_name).first()
    if label_exist is not None:
        raise BizException(MessageEnum.LABEL_EXIST_FAILED.get_code(),
                           MessageEnum.LABEL_EXIST_FAILED.get_msg())
    session = get_session()
    session.add(db_label)
    session.commit()
    print(db_label.id)
    return db_label


def update_label(label: schemas.LabelUpdate):
    size = (
        get_session()
        .query(models.Label)
        .filter(models.Label.id == label.id)
        .update(label.dict(exclude_unset=True))  # column.dict(exclude_unset=True)
    )
    get_session().commit()
    if size is None:
        return False
    return size > 0


def delete_labels_by_ids(ids: list):
    try:
        label_id_list = list(map(int, ids))
        session = get_session()
        session.query(models.Label).filter(
            models.Label.id.in_(label_id_list)
        ).delete()
        session.commit()
        return True
    except Exception:
        raise BizException(
            MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(),
            MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg()
        )



