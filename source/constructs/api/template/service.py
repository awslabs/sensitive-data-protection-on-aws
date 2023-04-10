
import json
import boto3
import os
from common.constant import const
from common.response_wrapper import S3WrapEncoder
from common.exception_handler import BizException
from common.enum import MessageEnum, DatabaseType, IdentifierDependency
from common.query_condition import QueryCondition
from catalog.service_dashboard import get_database_by_identifier
from template import schemas, crud


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


def create_identifier(identifier: schemas.TemplateIdentifier):
    res_list = crud.get_identify_by_name(identifier.name)
    if res_list:
        raise BizException(MessageEnum.BIZ_IDENTIFIER_EXISTS.get_code(), MessageEnum.BIZ_IDENTIFIER_EXISTS.get_msg())
    return crud.create_identifier(identifier)


def delete_identifier(id: int):
    ref = []
    identifier = crud.get_identifier(id)
    used_by_template = crud.get_mappings_by_identifier(id)
    used_by_bucket = get_database_by_identifier(identifier.name, DatabaseType.S3.value)
    uesd_by_rds = get_database_by_identifier(identifier.name, DatabaseType.RDS.value)
    if used_by_template:
        ref.append(IdentifierDependency.TEMPLATE.value)
    if used_by_bucket:
        ref.append(IdentifierDependency.S3.value)
    if uesd_by_rds:
        ref.append(IdentifierDependency.RDS.value)
    if not ref:
        crud.delete_identifier(id)
    else:
        raise BizException(MessageEnum.BIZ_IDENTIFIER_USED.get_code(), MessageEnum.BIZ_IDENTIFIER_USED.get_msg(), ref)


def update_identifier(id: int, identifier: schemas.TemplateIdentifier):
    res = crud.update_identifier(id, identifier)
    used_by_template = crud.get_mappings_by_identifier(id)
    if used_by_template:
        async_s3()
    return res


def get_template(id: int):
    # MVP：single template, and the template with id 1 is returned by default
    return crud.get_template(1)


def create_mapping(mapping: schemas.TemplateMapping):
    res = crud.create_mapping(mapping)
    async_s3()
    return res


def update_mapping(id: int, mapping: schemas.TemplateMapping):
    res = crud.update_mapping(id, mapping)
    async_s3()
    return res


def delete_mapping(id: int):
    crud.delete_mapping(id)
    async_s3()


def get_mappings(condition: QueryCondition):
    # MVP：single template, and the template with id 1 is returned by default
    return crud.get_mappings(condition)


def async_s3():
    # generate
    template = crud.get_template(1)
    identifiers = []
    res = crud.get_ref_identifiers(1)
    res_json = {}
    identifiers = []
    for item in res:
        item_json = {}
        item_json['name'] = item[4]
        item_json['category'] = item[5]
        item_json['rule'] = item[6]
        item_json['type'] = item[7]
        item_json['privacy'] = item[8]
        item_json['header_keywords'] = json.loads(item[9]) if item[9] else item[9]
        item_json['description'] = item[10]
        identifiers.append(item_json)
    json_str = S3WrapEncoder.convert(template, ['id', 'name'])
    res_json['template_id'] = json_str['id']
    res_json['template_name'] = json_str['name']
    res_json['identifiers'] = identifiers
    # upload
    client = boto3.client('s3')
    client.put_object(
        Body=json.dumps(res_json, ensure_ascii=False),
        Bucket=os.getenv(const.PROJECT_BUCKET_NAME, const.PROJECT_BUCKET_DEFAULT_NAME),
        Key='template/template-1.json',
    )
