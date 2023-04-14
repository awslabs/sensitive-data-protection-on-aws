import logging
import os
import json

logger = logging.getLogger('portal_config')
logger.setLevel(logging.INFO)


def __get_env_with_defaults(key, default_value): 
	value = os.getenv(key)
	if None == value or "" == value:
		return default_value
	else:
		return value


def lambda_handler(event, context):
	"""
	Those configration will be needed by portal UI.
	"""
	logger.info('>>>> going to read config.')
	aws_project_region = __get_env_with_defaults('aws_project_region', '')
	aws_api_endpoint = __get_env_with_defaults('aws_api_endpoint', '/api')
	aws_authenticationType = __get_env_with_defaults('aws_authenticationType', 'AUTH_TYPE.OPENID_CONNECT')
	aws_oidc_provider = __get_env_with_defaults('aws_oidc_provider', '')
	aws_oidc_client_id = __get_env_with_defaults('aws_oidc_client_id', '')
	aws_oidc_customer_domain = __get_env_with_defaults('aws_oidc_customer_domain', '')
	aws_alb_url = __get_env_with_defaults('aws_alb_url', '')
	aws_cognito_region = __get_env_with_defaults('aws_cognito_region', '')
	aws_user_pools_id = __get_env_with_defaults('aws_user_pools_id', '')
	aws_user_pools_web_client_id = __get_env_with_defaults('aws_user_pools_web_client_id', '')
	version = __get_env_with_defaults('version', 'v1.0.0')
	backend_url = __get_env_with_defaults('backend_url', '')
	expired = __get_env_with_defaults('expired', 12)
	expired = int(expired)

	logger.info('<<<< going to respond portal config.')

	body = {
		"aws_project_region": aws_project_region,
		"aws_api_endpoint": aws_api_endpoint,
		"aws_authenticationType": aws_authenticationType,
		"aws_oidc_provider": aws_oidc_provider,
		"aws_oidc_client_id": aws_oidc_client_id,
		"aws_oidc_customer_domain": aws_oidc_customer_domain,
		"aws_alb_url": aws_alb_url,
		"aws_cognito_region": aws_cognito_region,
		"aws_user_pools_id": aws_user_pools_id,
		"aws_user_pools_web_client_id": aws_user_pools_web_client_id,
		"version": version,
		"backend_url": backend_url,
		"expired" : expired
	}

	return {
		"statusCode": 200, 
		"headers": {"Content-Type": "application/json"},
    	"body": json.dumps(body)
	}
	
