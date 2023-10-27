# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import time
from operator import or_

import mock
from fastapi.testclient import TestClient
from fastapi_pagination import Page
from mock_alchemy.mocking import UnifiedAlchemyMagicMock

import data_source.main
from common.enum import (Provider, MessageEnum)
from data_source.schemas import S3BucketSource as S3BucketSourceSchema, JDBCInstanceSource as JDBCInstanceSourceSchema, \
    RdsInstanceSource as RdsInstanceSourceSchema, SourceGlueDatabase as SourceGlueDatabaseSchema
from db.models_data_source import S3BucketSource, Account, JDBCInstanceSource, RdsInstanceSource, SourceGlueDatabase
from main import app

fake_account_id = 123123123123
fake_instance_id = 'fake-rds_instance-id'
fake_bucket_name = 'fake-bucket-name'
fake_region = 'us-east-1'
token_exp_time = 600


def setup_validate(mocker):
    mocker.patch('main.__online_validate', return_value=True)
    mocker.patch('main.jwt.get_unverified_claims',
                 return_value={'username': 'fake_user', 'exp': time.time() + token_exp_time})


def setup_session(mocker):
    row_s3_bucket = S3BucketSourceSchema(
        id=0,
        bucket_name=fake_bucket_name,
        region=fake_region,
        account_id=fake_account_id,
        size=10
    )
    session = UnifiedAlchemyMagicMock(data=[
        (
            [mock.call.query(Account),
             mock.call.filter(Account.account_provider_id == Provider.AWS_CLOUD.value,
                              Account.status == 1)],
            [Account(
                id=0,
                account_id=fake_account_id
            )]
        ),
        (
            [mock.call.query(S3BucketSource),
             mock.call.filter(S3BucketSource.account_id.in_([fake_account_id]),
                              S3BucketSource.detection_history_id != -1)
             ],
            [S3BucketSourceSchema(
                id=0,
                bucket_name=fake_bucket_name,
                region='fake region',
                account_id=fake_account_id,
                size=10
            )]
        ),
        (
            [mock.call.query(JDBCInstanceSource),
             mock.call.filter(JDBCInstanceSource.account_id.in_([fake_account_id]),
                              JDBCInstanceSource.account_provider_id == 1,
                              or_(JDBCInstanceSource.detection_history_id != -1,
                                  JDBCInstanceSource.detection_history_id == None))
             ],
            [JDBCInstanceSourceSchema(
                description='fake value',
                jdbc_connection_url='fake url',
                jdbc_enforce_ssl='fake ssl',
                kafka_ssl_enabled='fake ssl',
                master_username='fake username',
                password='fake password',
                secret='fake secret',
                skip_custom_jdbc_cert_validation='fake cert',
                custom_jdbc_cert='fake cert',
                custom_jdbc_cert_string='fake cert',
                jdbc_driver_class_name='fake class_nam',
                jdbc_driver_jar_uri='fake uri',
                create_type=0
            )]
        ),
        (
            [mock.call.query(RdsInstanceSource),
             mock.call.filter(RdsInstanceSource.account_id.in_([fake_account_id]),
                              RdsInstanceSource.detection_history_id != -1)
             ],
            [RdsInstanceSourceSchema(
                id=1,
                instance_id='fake instance',
                instance_class='fake instance',
                engine='fake engine',
            )]
        ),
        (
            [mock.call.query(SourceGlueDatabase),
             mock.call.filter(SourceGlueDatabase.account_id.in_([fake_account_id]),
                              SourceGlueDatabase.detection_history_id != -1)
             ],
            [SourceGlueDatabaseSchema(
                glue_database_description='fake description',
                glue_database_location_uri='fake uri',
                detection_history_id=1,
                permissions='fake permissions',
            )]
        ),
        (
            [mock.call.query(S3BucketSource),
             mock.call.filter(S3BucketSource.account_id == fake_account_id,
                              S3BucketSource.region == fake_region,
                              S3BucketSource.bucket_name == fake_bucket_name)
             ],
            []
        ),
        (
            [mock.call.query(RdsInstanceSource),
             mock.call.filter(RdsInstanceSource.account_id == fake_account_id,
                              RdsInstanceSource.region == fake_region,
                              RdsInstanceSource.instance_id == fake_instance_id)
             ],
            []
        ),
    ])
    mocker.patch('db.database.get_session', return_value=session)
    mocker.patch('data_source.crud.get_session', return_value=session)


def mock_paginate(query, param):
    page = Page(total=1, size=1, page=1, items=query.all())
    return page


def test_s3(mocker):
    setup_validate(mocker)
    setup_session(mocker)

    with mock.patch.object(data_source.main, 'paginate', side_effect=mock_paginate):
        client = TestClient(app)
        list_s3 = client.post("/data-source/list-s3", headers={"authorization": "Bearer fake_token"},
                              json={
                                  "page": 1,
                                  "size": 20,
                                  "sort_column": "",
                                  "asc": "true",
                                  "conditions": [
                                  ]
                              })
        assert list_s3.status_code == 200
        assert 'items' in list_s3.json()['data']
        assert list_s3.json()['data']['items'][0]['bucket_name'] == fake_bucket_name
        assert list_s3.json()['data']['items'][0]['account_id'] == str(fake_account_id)

        mocker.patch('data_source.service.before_delete_s3_connection', return_value=True)
        list_s3 = client.post("/data-source/hide-s3", headers={"authorization": "Bearer fake_token"},
                              json={
                                  'account_id': fake_account_id,
                                  'region': fake_region,
                                  'bucket': fake_bucket_name
                              })
        assert list_s3.json()['code'] == MessageEnum.BIZ_DEFAULT_OK.get_code()


def test_jdbc(mocker):
    setup_validate(mocker)
    setup_session(mocker)

    with mock.patch.object(data_source.main, 'paginate', side_effect=mock_paginate):
        client = TestClient(app)

        list_jdbc = client.post("/data-source/list-jdbc", headers={"authorization": "Bearer fake_token"},
                                params={'provider_id': 1},
                                json={
                                    "page": 1,
                                    "size": 20,
                                    "sort_column": "",
                                    "asc": "true",
                                    "conditions": [
                                    ]
                                })
        assert list_jdbc.status_code == 200
        assert 'items' in list_jdbc.json()['data']
        assert list_jdbc.json()['data']['items'][0]['jdbc_connection_url'] == 'fake url'


def test_rds(mocker):
    setup_validate(mocker)
    setup_session(mocker)

    with mock.patch.object(data_source.main, 'paginate', side_effect=mock_paginate):
        client = TestClient(app)

        list_rds = client.post("/data-source/list-rds", headers={"authorization": "Bearer fake_token"},
                               params={'provider_id': 1},
                               json={
                                   "page": 1,
                                   "size": 20,
                                   "sort_column": "",
                                   "asc": "true",
                                   "conditions": [
                                   ]
                               })
        assert list_rds.status_code == 200
        assert 'items' in list_rds.json()['data']
        assert list_rds.json()['data']['items'][0]['engine'] == 'fake engine'

        mocker.patch('data_source.service.before_delete_rds_connection', return_value=True)
        list_rds = client.post("/data-source/hide-rds", headers={"authorization": "Bearer fake_token"},
                              json={
                                  'account_id': fake_account_id,
                                  'region': fake_region,
                                  'instance': fake_instance_id
                              })
        assert list_rds.json()['code'] == MessageEnum.BIZ_DEFAULT_OK.get_code()

def test_glue(mocker):
    setup_validate(mocker)
    setup_session(mocker)

    with mock.patch.object(data_source.main, 'paginate', side_effect=mock_paginate):
        client = TestClient(app)

        list_glue_database = client.post("/data-source/list-glue-database",
                                         headers={"authorization": "Bearer fake_token"},
                                         params={'provider_id': 1},
                                         json={
                                             "page": 1,
                                             "size": 20,
                                             "sort_column": "",
                                             "asc": "true",
                                             "conditions": [
                                             ]
                                         })
        assert list_glue_database.status_code == 200
        assert 'items' in list_glue_database.json()['data']
        assert list_glue_database.json()['data']['items'][0]['glue_database_location_uri'] == 'fake uri'
