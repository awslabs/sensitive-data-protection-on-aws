import json
import boto3
from common.constant import const
from common.response_wrapper import S3WrapEncoder
from common.exception_handler import BizException
from common.enum import MessageEnum, DatabaseType, IdentifierDependency, IdentifierType, OperationType
from common.query_condition import QueryCondition
from common.reference_parameter import admin_bucket_name
from catalog.service_dashboard import get_database_by_identifier
from template import schemas, crud


caller_identity = boto3.client('sts').get_caller_identity()


def get_identifiers(condition: QueryCondition):
    return crud.get_identifiers(condition)


def get_identifiers_by_template(tid: int):
    res = []
    tmp = crud.get_identifiers_by_template(tid)
    for item in tmp:
        res.append(item['identifier_id'])
    return res


def get_identifier(id: int):
    return crud.get_identifier(id)


# def get_identifier_by_names(names: list):
#     return crud.get_identifier_by_names(names)


def create_identifier(identifier: schemas.TemplateIdentifier):
    res_list = crud.get_identify_by_name(identifier.name)
    if res_list:
        raise BizException(MessageEnum.TEMPLATE_IDENTIFIER_EXISTS.get_code(),
                           MessageEnum.TEMPLATE_IDENTIFIER_EXISTS.get_msg())
    check_rule(identifier)
    return crud.create_identifier(identifier)


def delete_identifier(id: int):
    ref = []
    identifier = crud.get_identifier(id)
    ref_templates = crud.get_mappings_by_identifier(id)
    ref_buckets = get_database_by_identifier(identifier.name, DatabaseType.S3.value)
    ref_rds = get_database_by_identifier(identifier.name, DatabaseType.RDS.value)
    if ref_templates:
        ref.append(IdentifierDependency.TEMPLATE.value)
    if ref_buckets:
        ref.append(f'{IdentifierDependency.S3.value}:{len(ref_buckets)}')
    if ref_rds:
        ref.append(f'{IdentifierDependency.RDS.value}:{len(ref_rds)}')
    if not ref:
        crud.delete_identifier(id)
    else:
        raise BizException(MessageEnum.TEMPLATE_IDENTIFIER_USED.get_code(), MessageEnum.TEMPLATE_IDENTIFIER_USED.get_msg(), ref)


def update_identifier(id: int, identifier: schemas.TemplateIdentifier):
    res_list = crud.get_identify_by_name(identifier.name)
    if res_list and res_list[0].id != id:
        raise BizException(MessageEnum.TEMPLATE_IDENTIFIER_EXISTS.get_code(),
                           MessageEnum.TEMPLATE_IDENTIFIER_EXISTS.get_msg())
    check_rule(identifier)
    snapshot_no, res = crud.update_identifier(id, identifier)
    # used_by_template = crud.get_mappings_by_identifier(id)
    if snapshot_no:
        sync_s3(snapshot_no)
    return res


def get_template(id: int):
    # MVP：single template, and the template with id 1 is returned by default
    return crud.get_template(const.DEFAULT_TEMPLATE_ID)


def create_mapping(mapping: schemas.TemplateMapping):
    snapshot_no = crud.create_mapping(mapping)
    sync_s3(snapshot_no)
    return snapshot_no


def update_mapping(id: int, mapping: schemas.TemplateMapping):
    snapshot_no, res = crud.update_mapping(id, mapping)
    sync_s3(snapshot_no)
    return res


def delete_mapping(ids: list[int]):
    snapshot_no = crud.delete_mapping(ids)
    sync_s3(snapshot_no)


def get_mappings(condition: QueryCondition):
    # MVP：single template, and the template with id 1 is returned by default
    return crud.get_mappings(const.DEFAULT_TEMPLATE_ID, condition)


def get_template_snapshot_no(id: int):
    return crud.get_template_snapshot_no(id)


def get_props_by_type(tid: int):
    return crud.get_props_by_type(tid)


def create_prop(prop: schemas.TemplateIdentifierProp):
    res_list = crud.get_props_by_name_and_type(prop)
    if res_list:
        raise BizException(MessageEnum.TEMPLATE_PROPS_EXISTS.get_code(), MessageEnum.TEMPLATE_PROPS_EXISTS.get_msg())
    return crud.create_pop(prop)


def delete_prop(id: int):
    refs = crud.get_refs_by_prop(id)
    if refs:
        raise BizException(MessageEnum.TEMPLATE_PROPS_USED.get_code(), MessageEnum.TEMPLATE_PROPS_USED.get_msg())
    crud.delete_prop(id)


def update_prop(id: int, prop: schemas.TemplateIdentifierProp):
    res_list = crud.get_props_by_name_and_type(prop)
    if res_list:
        raise BizException(MessageEnum.TEMPLATE_PROPS_EXISTS.get_code(), MessageEnum.TEMPLATE_PROPS_EXISTS.get_msg())
    snapshot_no, res = crud.update_prop(id, prop)
    if snapshot_no:
        sync_s3(snapshot_no)
    return res


def sync_s3(snapshot_no):
    res_json = {}
    identifiers = []
    # generate new version
    template = crud.get_template(const.DEFAULT_TEMPLATE_ID)
    res = crud.get_ref_identifiers(const.DEFAULT_TEMPLATE_ID)
    for item in res:
        item_json = {}
        item_json['name'] = item[4]
        item_json['classification'] = item[5]
        item_json['rule'] = item[6]
        item_json['type'] = item[7]
        item_json['privacy'] = item[8]
        item_json['header_keywords'] = json.loads(item[9]) if item[9] else item[9]
        if item[11]:
            item_json['exclude_keywords'] = [val for val in json.loads(item[11]) if val]
        else:
            item_json['exclude_keywords'] = []
        item_json['description'] = item[10]
        item_json['max_distance'] = item[12]
        item_json['min_occurrence'] = item[13]
        identifiers.append(item_json)
    json_str = S3WrapEncoder.convert(template, ['id', 'name'])
    res_json['template_id'] = json_str['id']
    res_json['template_name'] = json_str['name']
    res_json['identifiers'] = identifiers
    # upload
    client = boto3.client('s3')
    client.put_object(
        Body=json.dumps(res_json, ensure_ascii=False),
        Bucket=admin_bucket_name,
        Key='template/template-{}-{}.json'.format(res_json['template_id'], snapshot_no),
    )


def check_rule(identifier):
    if identifier.type == IdentifierType.CUSTOM.value and identifier.rule == const.EMPTY_STR:
        raise BizException(MessageEnum.TEMPLATE_IDENTIFIER_RULES_EMPTY.get_code(),
                           MessageEnum.TEMPLATE_IDENTIFIER_RULES_EMPTY.get_msg())
    if identifier.type == IdentifierType.CUSTOM.value and identifier.header_keywords and '""' in identifier.header_keywords[1:-1].split(","):
        raise BizException(MessageEnum.TEMPLATE_HEADER_KEYWORDS_EMPTY.get_code(),
                           MessageEnum.TEMPLATE_HEADER_KEYWORDS_EMPTY.get_msg())
