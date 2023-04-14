import os
import boto3

sqs = boto3.client('sqs')
caller_identity = boto3.client('sts').get_caller_identity()
partition = caller_identity['Arn'].split(':')[1]
admin_account_id = caller_identity.get('Account')
url_suffix = '.cn' if partition == 'aws-cn' else ''

def lambda_handler(event, context):
    crawler_name = event['detail']['crawlerName']
    if crawler_name.endswith('-crawler') and (crawler_name.startswith('rds-') or crawler_name.startswith('s3-')):
        message = sqs.send_message(
            QueueUrl=f"https://sqs.{os.getenv('AWS_REGION')}.amazonaws.com{url_suffix}/{os.getenv('ADMIN_ACCOUNT')}/{os.getenv('QUEUE')}",
            MessageBody=str(event))
    return {
        'statusCode': 200
    }
