# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import time

import mock
from fastapi.testclient import TestClient
from fastapi_pagination import Page
from mock_alchemy.mocking import UnifiedAlchemyMagicMock

import db.models_catalog as catalog_models
import db.models_label as label_models
import label.schemas as label_schemas
from main import app

fake_account_id = 123123123123
fake_instance_id = 'fake-rds_instance-id'
fake_database_name = 'fake-database-name'
fake_region = 'us-east-1'
token_exp_time = 600


def setup_validation(mocker):
    mocker.patch('main.__online_validate', return_value=True)
    mocker.patch('main.jwt.get_unverified_claims',
                 return_value={'username': 'fake_user', 'exp': time.time() + token_exp_time})


def setup_session(mocker):
    session = UnifiedAlchemyMagicMock(data=[
        (
            [mock.call.query(catalog_models.CatalogDatabaseLevelClassification),
             mock.call.filter(
                 catalog_models.CatalogDatabaseLevelClassification.account_id == fake_account_id,
                 catalog_models.CatalogDatabaseLevelClassification.region == fake_region,
                 catalog_models.CatalogDatabaseLevelClassification.database_type == 's3',
                 catalog_models.CatalogDatabaseLevelClassification.database_name == fake_database_name,
             )],
            [catalog_models.CatalogDatabaseLevelClassification(
                account_id=fake_account_id,
                region=fake_region,
                database_type='s3',
                database_name=fake_database_name
            )]
        ),
        (
            [mock.call.query(label_models.Label),
             mock.call.filter(
                 label_models.Label.id.in_([fake_account_id]),
             )],
            [label_schemas.Label(
                id=1,
                label_name='fake label name',
                classification='fake classification',
                type='fake type',
                style_type='fake style type',
                style_value='fake style value'
            )]
        ),
        (
            [mock.call.query(catalog_models.CatalogTableLevelClassification),
             mock.call.filter(
                 catalog_models.CatalogTableLevelClassification.account_id == fake_account_id,
                 catalog_models.CatalogTableLevelClassification.region == fake_region,
                 catalog_models.CatalogTableLevelClassification.database_type == 's3',
                 catalog_models.CatalogTableLevelClassification.database_name == fake_database_name,
             )],
            [catalog_models.CatalogDatabaseLevelClassification(
                account_id=fake_account_id,
                region=fake_region,
                database_type='s3',
                database_name=fake_database_name
            )]
        ),
        (
            [mock.call.query(label_models.Label),
             mock.call.filter(
                 label_models.Label.label_name.ilike("%" + 'fake label name' + "%"),
             )],
            [label_schemas.Label(
                id=1,
                label_name='fake label name',
                classification='fake classification',
                type='fake type',
                style_type='fake style type',
                style_value='fake style value'
            )]
        ),
        (
            [mock.call.query(label_models.Label),
             mock.call.filter(
                 label_models.Label.classification == 'fake classification',
                 label_models.Label.type == 'fake type',
                 label_models.Label.label_name == 'fake label name'
             )],
            [label_schemas.Label(
                id=2,
                label_name='fake label name',
                classification='fake classification',
                type='fake type',
                style_type='fake style type',
                style_value='fake style value'
            )]
        ),
        (
            [mock.call.query(label_models.Label),
             mock.call.filter(
                 label_models.Label.id == 1
             )],
            [label_schemas.Label(
                id=1,
                label_name='fake label name',
                classification='fake classification',
                type='fake type',
                style_type='fake style type',
                style_value='fake style value'
            )]
        ),
    ])
    mocker.patch('db.database.get_session', return_value=session)
    mocker.patch('catalog.crud.get_session', return_value=session)
    mocker.patch('label.crud.get_session', return_value=session)


def mock_paginate(query, param):
    page = Page(total=1, size=1, page=1, items=query.all())
    return page


def test_get_labels_by_one_database(mocker):
    setup_validation(mocker)
    setup_session(mocker)

    client = TestClient(app)
    get_labels_by_one_database = client.get("labels/category/get-labels-by-one-database",
                                            headers={"authorization": "Bearer fake_token"},
                                            params={
                                                'account_id': fake_account_id,
                                                'region': fake_region,
                                                'database_type': 's3',
                                                'database_name': fake_database_name,
                                                'need_table_labels': True,
                                            }
                                            )
    assert get_labels_by_one_database.status_code == 200
    assert 'status' in get_labels_by_one_database.json()
    assert get_labels_by_one_database.json()['status'] == 'success'


def test_delete_labels_by_ids(mocker):
    setup_validation(mocker)
    setup_session(mocker)

    client = TestClient(app)
    post_delete_labels_by_ids = client.post("labels/delete-labels-by-ids",
                                            headers={"authorization": "Bearer fake_token"},
                                            json={
                                                'ids': [fake_account_id]
                                            }
                                            )
    assert post_delete_labels_by_ids.status_code == 200
    assert 'status' in post_delete_labels_by_ids.json()
    assert post_delete_labels_by_ids.json()['status'] == 'success'


def test_search_labels(mocker):
    setup_validation(mocker)
    setup_session(mocker)

    client = TestClient(app)
    get_search_labels = client.get("labels/search-labels",
                                   headers={"authorization": "Bearer fake_token"},
                                   params={
                                       'label_name': 'fake label name'
                                   }
                                   )
    assert get_search_labels.status_code == 200
    assert 'status' in get_search_labels.json()
    assert get_search_labels.json()['status'] == 'success'


def test_create_labels(mocker):
    setup_validation(mocker)
    setup_session(mocker)

    client = TestClient(app)
    post_create_labels = client.post("labels/create-label",
                                     headers={"authorization": "Bearer fake_token"},
                                     json={
                                         'label_name': 'fake label name',
                                         'classification': 'fake classification',
                                         'type': 'fake type',
                                     }
                                     )
    assert post_create_labels.status_code == 200
    assert 'status' in post_create_labels.json()
    assert post_create_labels.json()['status'] == 'fail'
    assert post_create_labels.json()['message'] == 'Cannot create duplicated label'

    post_create_labels = client.post("labels/create-label",
                                     headers={"authorization": "Bearer fake_token"},
                                     json={
                                         'label_name': 'new fake label name',
                                         'classification': 'new fake classification',
                                         'type': 'new fake type',
                                     }
                                     )
    assert post_create_labels.status_code == 200
    assert 'status' in post_create_labels.json()
    assert post_create_labels.json()['status'] == 'success'


def test_update_labels(mocker):
    setup_validation(mocker)
    setup_session(mocker)

    client = TestClient(app)
    post_create_labels = client.post("labels/update-label",
                                     headers={"authorization": "Bearer fake_token"},
                                     json={
                                         'id': 1,
                                     }
                                     )
    assert post_create_labels.status_code == 200
    assert 'status' in post_create_labels.json()
    assert post_create_labels.json()['status'] == 'success'
