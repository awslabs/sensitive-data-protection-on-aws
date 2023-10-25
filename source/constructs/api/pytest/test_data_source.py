# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import time
from operator import or_

import mock
from fastapi.testclient import TestClient
from fastapi_pagination import Page
from mock_alchemy.mocking import UnifiedAlchemyMagicMock

import data_source.main
from common.enum import (Provider)
from data_source.schemas import S3BucketSource as S3BucketSourceSchema, JDBCInstanceSource as JDBCInstanceSourceSchema
from db.models_data_source import S3BucketSource, Account, JDBCInstanceSource
from main import app

fake_account_id = 123123123123
fake_bucket_name = 'fake bucket name'
exp = 600


def setup_validate(mocker):
    mocker.patch('main.__online_validate', return_value=True)
    mocker.patch('main.jwt.get_unverified_claims', return_value={'username': 'fake_user', 'exp': time.time() + exp})


def setup_session(mocker):
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
    ])
    mocker.patch('db.database.get_session', return_value=session)
    mocker.patch('data_source.crud.get_session', return_value=session)


def mock_paginate(query, param):
    page = Page(total=1, size=1, page=1, items=query.all())
    return page


def test_data_source(mocker):
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
