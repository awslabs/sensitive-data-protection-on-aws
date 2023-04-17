from common.exception_handler import BizException
from common.enum import MessageEnum
from common.query_condition import QueryCondition, query_with_condition, query_with_condition_multi_table
from tools.pydantic_tool import parse_pydantic_schema
from template import schemas
from db import models_template as models
from db.database import get_session, gen_session
import logging
from common.constant import const

logger = logging.getLogger(const.LOGGER_API)


def get_identifiers(condition: QueryCondition):
    return query_with_condition(get_session().query(models.TemplateIdentifier), condition)


def get_identifiers_by_template(tid: int):
    return get_session().query(
        models.TemplateMapping.identifier_id).filter(models.TemplateMapping.template_id == tid).all()


def get_identifier(id: int):
    return get_session().query(models.TemplateIdentifier).get(id)


def create_identifier(identifier: schemas.TemplateIdentifier) -> models.TemplateIdentifier:
    session = get_session()
    db_identifier = models.TemplateIdentifier(**(parse_pydantic_schema(identifier)))
    session.add(db_identifier)
    session.commit()
    session.refresh(db_identifier)
    return db_identifier


def delete_identifier(id: int):
    session = get_session()
    del_data = session.query(models.TemplateIdentifier).filter(models.TemplateIdentifier.id == id).delete()
    if not del_data:
        logger.error("The item is not exsits!")
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.commit()


def update_identifier(id: int, identifier: schemas.TemplateIdentifier):
    session = get_session()
    size = session.query(models.TemplateIdentifier).filter(models.TemplateIdentifier.id == id).update(
        identifier.dict(exclude_unset=True))
    if size <= 0:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.commit()
    return get_identifier(id)


def get_template(id: int):
    return get_session().query(models.Template).get(id)


def get_mapping(id: int):
    return get_session().query(models.TemplateMapping).get(id)


def create_mapping(mapping: schemas.TemplateMapping) -> models.TemplateMapping:
    session = get_session()
    if not get_template(mapping.template_id):
        raise BizException(MessageEnum.BIZ_TEMPLATE_NOT_EXISTS.get_code(),
                           MessageEnum.BIZ_TEMPLATE_NOT_EXISTS.get_msg())
    if not get_identifier(mapping.identifier_id):
        raise BizException(MessageEnum.BIZ_IDENTIFIER_NOT_EXISTS.get_code(),
                           MessageEnum.BIZ_IDENTIFIER_NOT_EXISTS.get_msg())
    db_mapping = models.TemplateMapping(**(parse_pydantic_schema(mapping)))
    session.add(db_mapping)
    session.commit()
    session.refresh(db_mapping)
    return db_mapping


def update_mapping(id: int, mapping: schemas.TemplateMapping):
    session = get_session()
    size = session.query(models.TemplateMapping).filter(models.TemplateMapping.id == id).update(
        mapping.dict(exclude_unset=True))
    if size <= 0:
        logger.error("The item is not exsits!")
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.commit()
    return get_mapping(id)


def delete_mapping(id: int):
    session = get_session()
    del_data = session.query(models.TemplateMapping).filter(models.TemplateMapping.id == id).delete()
    if not del_data:
        logger.error("The item is not exsits!")
        # raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS)
    session.commit()


def get_mappings_by_identifier(id: int):
    return get_session().query(models.TemplateMapping).filter(models.TemplateMapping.identifier_id == id).all()


def get_mappings(condition: QueryCondition):
    ignoreProperties = ['template_id']
    mappings = {'name': models.TemplateIdentifier.name,
                'description': models.TemplateIdentifier.description}
    return query_with_condition_multi_table(get_session().query(models.TemplateMapping.id,
                                            models.TemplateMapping.template_id,
                                            models.TemplateMapping.identifier_id,
                                            models.TemplateMapping.status,
                                            models.TemplateIdentifier.type,
                                            models.TemplateIdentifier.name,
                                            models.TemplateIdentifier.description).filter(
        models.TemplateMapping.template_id == 1).join(
            models.TemplateMapping,
            models.TemplateMapping.identifier_id == models.TemplateIdentifier.id),
        condition, mappings, ignoreProperties)


def get_ref_identifiers(id: int):
    return get_session().query(models.TemplateMapping.id,
                               models.TemplateMapping.template_id,
                               models.TemplateMapping.identifier_id,
                               models.TemplateMapping.status,
                               models.TemplateIdentifier.name,
                               models.TemplateIdentifier.category,
                               models.TemplateIdentifier.rule,
                               models.TemplateIdentifier.type,
                               models.TemplateIdentifier.privacy,
                               models.TemplateIdentifier.header_keywords,
                               models.TemplateIdentifier.description
                               ).filter(
        models.TemplateMapping.template_id == id).filter(models.TemplateMapping.status == 1).join(
        models.TemplateMapping, models.TemplateMapping.identifier_id == models.TemplateIdentifier.id).all()


def get_identify_by_name(name: str):
    return get_session().query(models.TemplateIdentifier).filter(models.TemplateIdentifier.name == name).all()


def update_template_snapshot_no(id: int, no: str):
    gen_session()
    session = get_session()
    size = session.query(models.Template).filter(models.Template.id == id).update({"snapshot_no": no})
    if size <= 0:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.commit()
    return get_template(id)


def get_template_snapshot_no(id: int):
    return get_session().query(models.Template.snapshot_no).filter(models.Template.id == id).first()[0]
