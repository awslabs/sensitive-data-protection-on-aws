# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import pytest
from main import app
from fastapi.testclient import TestClient
from unittest.mock import Mock


def test_auth_without_token():
    client = TestClient(app)
    response = client.get("/version/get-latest-version")
    assert response.status_code == 200
    assert response.json() == {"code": 1003, "message": "Invalid token", "ref": None, "status": "fail"}


@pytest.fixture
def mock_online_validate(mocker):
    mock = Mock()
    mocker.patch('main.__online_validate', return_value=mock)
    return mock


def test_auth_with_token(mocker):
    mocker.patch('main.__online_validate', return_value=True)
    mocker.patch('main.jwt.get_unverified_claims', return_value={"username":"fake_user"})
    mocker.patch('version.service.get_latest_version', return_value="0.0.0")
    client = TestClient(app)
    response = client.get("/version/get-latest-version", headers={"authorization": "Bearer fake_token"})
    assert response.status_code == 200
    assert response.json() == {'status': 'success', 'code': 1001, 'message': 'Operation succeeded', 'data': '0.0.0'}