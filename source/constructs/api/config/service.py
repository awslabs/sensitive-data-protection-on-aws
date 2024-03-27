from . import crud,schemas
import boto3
from common.reference_parameter import admin_subnet_ids


def set_config(key: str, value: str):
    crud.set_value(key, value)


def get_config(key: str, default_value=None) -> str:
    _value = crud.get_value(key)
    if _value:
        return _value
    if default_value:
        return default_value
    return None


def list_config():
    return crud.list_config()


def set_configs(configs: list[schemas.ConfigBase]):
    for config in configs:
        set_config(config.config_key, config.config_value)


def list_subnets():
    ec2_client = boto3.client('ec2')
    response = ec2_client.describe_subnets(SubnetIds=admin_subnet_ids)
    subnet_infos = []
    for subnet in response['Subnets']:
        subnet_info = schemas.SubnetInfo(subnet_id=subnet['SubnetId'],
                                         name=__get_name(subnet['Tags']),
                                         available_ip_address_count=subnet['AvailableIpAddressCount'])
        subnet_infos.append(subnet_info)
    return subnet_infos


def __get_name(tags: list) -> str:
    for tag in tags:
        if tag.get("Key") == "Name":
            return tag.get("Value")
    return None


