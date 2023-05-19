from common.exception_handler import BizException
from common.enum import MessageEnum
from common.query_condition import QueryCondition, query_with_condition, query_with_condition_multi_table
from tools.pydantic_tool import parse_pydantic_schema
from template import schemas
from db import models_template as models
from db.database import get_session
import time


def get_identifiers(condition: QueryCondition):
    props_filter = []
    props_filter_not = []
    for item in condition.conditions:
        if item.column == 'props':
            props_filter.append(item)
        else:
            props_filter_not.append(item)
    condition.conditions = props_filter_not
    query = query_with_condition(get_session().query(models.TemplateIdentifier), condition)
    if props_filter and query:
        for filter in props_filter:
            q_item = []
            for item in query:
                for prop in item.props:
                    if str(prop.id) in filter.values:
                        q_item.append(item.id)
                        break
            query = query.filter(models.TemplateIdentifier.id.in_(q_item))
    return query


def get_mappings(id: int, condition: QueryCondition):
    template_mappings = {
        'name': (models.TemplateIdentifier.name, True),
        'description': (models.TemplateIdentifier.description, True)
    }
    ignoreProperties = ['template_id']
    return query_with_condition_multi_table(get_session().query(models.TemplateMapping.id,
                                            models.TemplateMapping.template_id,
                                            models.TemplateMapping.identifier_id,
                                            models.TemplateMapping.status,
                                            models.TemplateIdentifier.type,
                                            models.TemplateIdentifier.name,
                                            models.TemplateIdentifier.description).filter(
        models.TemplateMapping.template_id == id).join(
            models.TemplateMapping,
            models.TemplateMapping.identifier_id == models.TemplateIdentifier.id),
        condition, template_mappings, ignoreProperties)


def get_identifiers_by_template(tid: int):
    return get_session().query(
        models.TemplateMapping.identifier_id).filter(models.TemplateMapping.template_id == tid).all()


def get_identifier(id: int):
    return get_session().query(models.TemplateIdentifier).get(id)


def create_identifier(identifier: schemas.TemplateIdentifier) -> models.TemplateIdentifier:
    session = get_session()

    db_identifier = models.TemplateIdentifier()
    prop_ids = get_props_ids()
    for item in (identifier.props or []):
        if item not in prop_ids:
            raise BizException(MessageEnum.TEMPLATE_PROPS_NOT_EXISTS.get_code(),
                               MessageEnum.TEMPLATE_PROPS_NOT_EXISTS.get_msg())
        else:
            db_identifier.props.append(get_prop_by_id(item))

    for key, value in dict(identifier).items():
        if not key.startswith('__') and key != 'props':
            setattr(db_identifier, key, value)

    session.add(db_identifier)
    session.commit()
    session.refresh(db_identifier)

    return db_identifier


def get_prop_by_id(id: int):
    return get_session().query(
        models.TemplateIdentifierProp).filter(models.TemplateIdentifierProp.id == id).first()


def delete_identifier(id: int):
    session = get_session()
    del_data = session.query(models.TemplateIdentifier).filter(models.TemplateIdentifier.id == id).delete()
    if not del_data:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.query(models.TemplateIdentifierPropRef).filter(
        models.TemplateIdentifierPropRef.identifier_id == id).delete()
    session.commit()


def update_identifier(id: int, identifier: schemas.TemplateIdentifier):
    snapshot_no = None
    session = get_session()
    session.query(models.TemplateIdentifier).filter(models.TemplateIdentifier.id == id).update(
        identifier.dict(exclude={'props'}, exclude_unset=True))

    session.query(models.TemplateIdentifierPropRef).filter(
        models.TemplateIdentifierPropRef.identifier_id == id).delete()
    for item in (identifier.props or []):
        session.add(models.TemplateIdentifierPropRef(identifier_id=id, prop_id=item))
    if get_mappings_by_identifier(id):
        snapshot_no = update_template_snapshot_no(1)

    session.commit()
    return snapshot_no, get_identifier(id)


def get_template(id: int):
    return get_session().query(models.Template).get(id)


def get_mapping(id: int):
    return get_session().query(models.TemplateMapping).get(id)


def create_mapping(mapping: schemas.TemplateMapping) -> models.TemplateMapping:
    session = get_session()
    if not get_template(mapping.template_id):
        raise BizException(MessageEnum.TEMPLATE_NOT_EXISTS.get_code(),
                           MessageEnum.TEMPLATE_NOT_EXISTS.get_msg())
    if not get_identifier(mapping.identifier_id):
        raise BizException(MessageEnum.TEMPLATE_IDENTIFIER_NOT_EXISTS.get_code(),
                           MessageEnum.TEMPLATE_IDENTIFIER_NOT_EXISTS.get_msg())
    db_mapping = models.TemplateMapping(**(parse_pydantic_schema(mapping)))
    snapshot_no = update_template_snapshot_no(mapping.template_id)
    session.add(db_mapping)
    session.commit()
    session.refresh(db_mapping)
    return snapshot_no, db_mapping


def update_mapping(id: int, mapping: schemas.TemplateMapping):
    session = get_session()
    size = session.query(models.TemplateMapping).filter(models.TemplateMapping.id == id).update(
        mapping.dict(exclude_unset=True))
    if size <= 0:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    snapshot_no = update_template_snapshot_no(mapping.template_id)
    session.commit()
    return snapshot_no, get_mapping(id)


def delete_mapping(id: int):
    session = get_session()
    template_id = session.query(models.TemplateMapping.template_id).filter(models.TemplateMapping.id == id).first()[0]
    del_data = session.query(models.TemplateMapping).filter(models.TemplateMapping.id == id).delete()
    if not del_data:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    snapshot_no = update_template_snapshot_no(template_id)
    session.commit()
    return snapshot_no


def get_mappings_by_identifier(id: int):
    return get_session().query(models.TemplateMapping).filter(models.TemplateMapping.identifier_id == id).all()


def get_used_prop_ids():
    res = []
    tmp = get_session().query(models.TemplateIdentifierPropRef.prop_id, models.TemplateMapping.identifier_id).join(
        models.TemplateIdentifierPropRef, models.TemplateIdentifierPropRef.identifier_id == models
        .TemplateMapping.identifier_id).all()
    for e in tmp:
        res.append(e[0])
    return res


def get_ref_identifiers(id: int):
    return get_session().query(models.TemplateMapping.id,
                               models.TemplateMapping.template_id,
                               models.TemplateMapping.identifier_id,
                               models.TemplateMapping.status,
                               models.TemplateIdentifier.name,
                               models.TemplateIdentifier.classification,
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


def update_template_snapshot_no(id: int):
    snapshot_no = time.strftime("%Y%m%d%H%M%S")
    get_session().query(models.Template).filter(models.Template.id == id).update({"snapshot_no": snapshot_no})
    return snapshot_no


def get_template_snapshot_no(id: int):
    return get_session().query(models.Template.snapshot_no).filter(models.Template.id == id).first()[0]


def get_props_ids():
    res = []
    tmp = get_session().query(models.TemplateIdentifierProp.id).all()
    for e in tmp:
        res.append(e[0])
    return res


def get_props_by_type(tid: int):
    return get_session().query(
        models.TemplateIdentifierProp).filter(models.TemplateIdentifierProp.prop_type == tid).all()


def get_props_by_name_and_type(prop: schemas.TemplateIdentifierProp):
    return get_session().query(models.TemplateIdentifierProp).filter(
        models.TemplateIdentifierProp.prop_name == prop.prop_name).filter(
        models.TemplateIdentifierProp.prop_type == prop.prop_type).all()


def create_pop(prop: schemas.TemplateIdentifierProp) -> models.TemplateIdentifierProp:
    session = get_session()
    db_prop = models.TemplateIdentifierProp(**(parse_pydantic_schema(prop)))
    session.add(db_prop)
    session.commit()
    session.refresh(db_prop)
    return db_prop


def delete_prop(id: int):
    session = get_session()
    del_data = session.query(models.TemplateIdentifierProp).filter(models.TemplateIdentifierProp.id == id).delete()
    if not del_data:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    session.commit()


def update_prop(id: int, prop: schemas.TemplateIdentifierProp):
    snapshot_no = None
    session = get_session()
    size = session.query(models.TemplateIdentifierProp).filter(models.TemplateIdentifierProp.id == id).update(
        prop.dict(exclude_unset=True))
    if size <= 0:
        raise BizException(MessageEnum.BIZ_ITEM_NOT_EXISTS.get_code(), MessageEnum.BIZ_ITEM_NOT_EXISTS.get_msg())
    if id in get_used_prop_ids():
        snapshot_no = update_template_snapshot_no(1)
    session.commit()
    return snapshot_no, get_identifier(id)


def get_refs_by_prop(id: int):
    return get_session().query(models.TemplateIdentifierPropRef).filter(
        models.TemplateIdentifierPropRef.prop_id == id).all()
