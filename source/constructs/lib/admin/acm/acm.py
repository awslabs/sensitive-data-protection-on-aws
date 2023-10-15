import logging
import boto3
import json
import traceback
import requests

from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from datetime import datetime, timedelta
from tempfile import NamedTemporaryFile
import os


acm_client = boto3.client('acm')
region = boto3.session.Session().region_name
domain_name = f'*.{region}.elb.amazonaws.com'

logger = logging.getLogger('constructs')
logger.setLevel(logging.INFO)
request_type_list = ["Create","Update","Delete"]
solution_name = os.getenv('SolutionName')


def lambda_handler(event, context):
    logger.info(event)
    certificate_arn = ''
    certificate_s3_key = ''
    try:
        request_type = event['RequestType']
        if request_type not in request_type_list:
            send_response(event,"FAILED","request type not in list")
            return

        if request_type == 'Create':
            certificate_arn, certificate_s3_key = on_create(event)
        elif request_type == 'Update':
            certificate_arn, certificate_s3_key = on_update(event)
        elif request_type == 'Delete':
            on_delete(event)
        send_response(event, data = {"CertificateArn": certificate_arn, "CertificateS3Key": certificate_s3_key})
    except Exception:
        error_msg = traceback.format_exc()
        logger.exception(error_msg.replace("\n", "\r"))
        send_response(event, "FAILED" ,error_msg)


def send_response(event, response_status = "SUCCESS", reason = "OK", data = {}):
    response_url = event['ResponseURL']
    response_body = {}
    response_body['Status'] = response_status
    response_body['PhysicalResourceId'] = event['PhysicalResourceId'] if 'PhysicalResourceId' in event else event['LogicalResourceId']
    response_body['StackId'] = event['StackId']
    response_body['RequestId'] = event['RequestId']
    response_body['LogicalResourceId'] = event['LogicalResourceId']
    response_body['Reason'] = reason
    response_body['Data'] = data

    json_response_body = json.dumps(response_body)
    logger.info(json_response_body)

    headers = {
        'content-type': '',
        'content-length': str(len(json_response_body))
    }
    response = requests.put(response_url,
                            data=json_response_body,
                            headers=headers)
    return response


def on_create(event):
    logger.info("Got create")
    certificate_arn = event["ResourceProperties"]["CertificateArn"]
    if certificate_arn != '':
        logger.info(f'Use existing certificate:{certificate_arn}')
        return certificate_arn, ''
    return gen_certificate(event["ResourceProperties"]["BucketName"])


def on_update(event):
    logger.info("Got Update")
    return on_create(event)


def on_delete(event):
    logger.info("Got Delete")
    certificates_response = acm_client.list_certificates(CertificateStatuses=['ISSUED'])
    for cert in certificates_response['CertificateSummaryList']:
        if cert['DomainName'] == domain_name:
            tags_response = acm_client.list_tags_for_certificate(CertificateArn=cert['CertificateArn'])
            for tag in tags_response['Tags']:
                if tag['Key'] == 'Owner' and tag['Value'] == solution_name:
                    acm_client.delete_certificate(CertificateArn=cert['CertificateArn'])
                    continue


def gen_certificate(bucket_name: str) -> str:
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )

    public_key = private_key.public_key()

    subject = issuer = x509.Name([
        x509.NameAttribute(x509.NameOID.COMMON_NAME, solution_name),
    ])

    builder = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        public_key
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.utcnow()
    ).not_valid_after(
        datetime.utcnow() + timedelta(days=3650)
    ).add_extension(
        x509.BasicConstraints(ca=False, path_length=None),
        critical=True,
    ).add_extension(
        x509.KeyUsage(
            digital_signature=True,
            key_encipherment=True,
            key_agreement=False,
            content_commitment=False,
            data_encipherment=False,
            key_cert_sign=False,
            crl_sign=False,
            encipher_only=False,
            decipher_only=False,
        ),
        critical=True,
    ).add_extension(
        x509.SubjectAlternativeName([
            x509.DNSName(domain_name),
        ]),
        critical=False,
    ).add_extension(
        x509.ExtendedKeyUsage([x509.oid.ExtendedKeyUsageOID.SERVER_AUTH, x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH]),
        critical=True,
    ).sign(private_key, hashes.SHA256(), default_backend())

    cert_pem = builder.public_bytes(serialization.Encoding.PEM)

    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )

    response = acm_client.import_certificate(Certificate=cert_pem.decode('utf-8'), PrivateKey=private_key_pem.decode('utf-8'))
    logger.info(f"New certificate:{response['CertificateArn']}")
    acm_client.add_tags_to_certificate(
      CertificateArn=response['CertificateArn'],
      Tags=[
        {
          'Key': 'Owner',
          'Value': solution_name
        }
        ])
    
    filename = NamedTemporaryFile().name
    with open(filename, "wb") as f:
        f.write(cert_pem)
    s3_client = boto3.client('s3')
    key_name = "cert/server.cer"
    s3_client.upload_file(filename, bucket_name, key_name)
    os.remove(filename)
    s3_key = f's3://{bucket_name}/{key_name}'
    return response['CertificateArn'], s3_key