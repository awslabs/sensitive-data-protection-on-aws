import logging
from crhelper import CfnResource
import boto3
import traceback

logger = logging.getLogger('call_region')
logger.setLevel(logging.INFO)

helper = CfnResource(json_logging=False, log_level='DEBUG', boto_level='CRITICAL', sleep_on_delete=120, ssl_verify=None)

admin_region = boto3.session.Session().region_name
# Only applicable to China region
call_region = "cn-north-1"
if admin_region == "cn-north-1":
    call_region = "cn-northwest-1"
cloudformation = boto3.client('cloudformation', region_name=call_region)


@helper.create
def create(event, context):
    try:
        stack_name = f'{event["ResourceProperties"]["SolutionNameAbbr"]}-AdminRegion'
        org_id = event["ResourceProperties"]["OrgId"]
        with open('AdminRegion.template.json','r') as f:
            template=f.read()
        stack = cloudformation.create_stack(
            StackName=stack_name,
            TemplateBody=template,
            # TemplateURL='https://s3.cn-north-1.amazonaws.com.cn/cf-templates-7dk5cirdwmv5-cn-north-1/2023-02-02T074106.492Zsp1-AdminRegion.template.json',
            Parameters=[
                {
                    'ParameterKey':'AdminRegion',
                    'ParameterValue': admin_region,
                },
                {
                    'ParameterKey':'PrincipalOrgID',
                    'ParameterValue': org_id,
                },
            ],
            DisableRollback=True,
            Capabilities=[
                'CAPABILITY_NAMED_IAM',
            ],
        )
    except Exception:
        msg = traceback.format_exc()
        error_msg = f"Error create admin region:{msg}"
        logger.exception(error_msg)
        raise ValueError(error_msg)
    return "MyResourceId"


@helper.update
def update(event, context):
    logger.info("Got Update")


@helper.delete
def delete(event, context):
    try:
        stack_name = f'{event["ResourceProperties"]["SolutionNameAbbr"]}-AdminRegion'
        stack = cloudformation.delete_stack(
            StackName=stack_name,
        )
    except Exception:
        msg = traceback.format_exc()
        error_msg = f"Error delete admin region:{msg}"
        logger.exception(error_msg)
        raise ValueError(error_msg)
    # return "MyResourceId"


def lambda_handler(event, context):
    logger.info(event)
    helper(event, context)
