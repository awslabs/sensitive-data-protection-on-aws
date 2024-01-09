# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import time

import mock
from fastapi.testclient import TestClient
from fastapi_pagination import Page
from mock_alchemy.mocking import UnifiedAlchemyMagicMock

import db.models_data_source as data_source_models
import search.crud
import search.main
from main import app

token_exp_time = 600


def setup_validation(mocker):
    mocker.patch('main.__online_validate', return_value=True)
    mocker.patch('main.jwt.get_unverified_claims',
                 return_value={'username': 'fake_user', 'exp': time.time() + token_exp_time})


def setup_session(mocker):
    session = UnifiedAlchemyMagicMock(data=[
        (
            [mock.call.query(data_source_models.S3BucketSource.bucket_name)],
            [
                {
                    'bucket_name': 'distinct bucket name'
                }
            ]
        ),
    ])

    mocker.patch('db.database.get_session', return_value=session)
    mocker.patch('search.crud.get_session', return_value=session)


def mock_paginate(query, param):
    page = Page(total=1, size=1, page=1, items=query.all())
    return page


def test_filter_values(mocker):
    setup_validation(mocker)
    setup_session(mocker)

    client = TestClient(app)
    get_property_values = client.get("query/property_values",
                                     headers={"authorization": "Bearer fake_token"},
                                     params={
                                         'table': 'source_s3_bucket',
                                         'column': 'bucket_name',
                                         'condition': '{"column":"account_id","condition":"and","operation":"in","values":["640463273335"]}'
                                     }
                                     )
    assert get_property_values.status_code == 200
    assert 'status' in get_property_values.json()
    assert get_property_values.json()['status'] == 'success'
    assert get_property_values.json()['data'] == ['distinct bucket name']


def test_query(mocker):
    setup_validation(mocker)
    setup_session(mocker)
    with mock.patch.object(search.crud, 'paginate', side_effect=mock_paginate):
        client = TestClient(app)
        post_query = client.post("/query/",
                                 headers={"authorization": "Bearer fake_token"},
                                 json={
                                     "table": "source_s3_bucket",
                                     "page": 1,
                                     "size": 20,
                                     "sort_column": "bucket_name",
                                     "asc": True,
                                     "conditions": [
                                     ]
                                 }
                                 )
        assert post_query.status_code == 200
        assert 'status' in post_query.json()
        assert post_query.json()['status'] == 'success'


def test_columns(mocker):
    setup_validation(mocker)
    setup_session(mocker)
    client = TestClient(app)
    get_query = client.get("query/columns",
                           headers={"authorization": "Bearer fake_token"},
                           params={
                               "table": "source_s3_bucket",
                           }
                           )
    assert get_query.status_code == 200
    assert 'status' in get_query.json()
    assert get_query.json()['status'] == 'success'


def test_tables(mocker):
    setup_validation(mocker)
    setup_session(mocker)
    client = TestClient(app)
    get_tables = client.get("query/tables",
                            headers={"authorization": "Bearer fake_token"}
                            )
    assert get_tables.status_code == 200
    print(get_tables.json())
    assert 'status' in get_tables.json()
    assert get_tables.json()['status'] == 'success'
    if __name__ == '__main__':
        assert set(get_tables.json()['status']) == set(search.main.searchable)
