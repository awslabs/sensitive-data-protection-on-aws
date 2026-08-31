# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

"""Regression tests for the Athena SQL injection reported against
POST /catalog/sync-job-detection-results.

They assert that the five user-controlled request fields
(account_id, region, database_type, database_name, run_id) can no longer
alter the executed Athena query:

  1. values containing a single quote / SQL metacharacters, or an
     out-of-enum database_type, are rejected before reaching Athena;
  2. the query is built with positional '?' placeholders and the values are
     passed via ExecutionParameters (bound as data, never parsed as SQL).
"""

import pytest

import catalog.service as service
from common.exception_handler import BizException

# Module-level double-underscore names are not name-mangled; access them directly.
validate = service.__validate_athena_query_fields
query_by_athena = service.__query_job_result_by_athena

# The exact payload from the vulnerability report.
INJECTION_PAYLOAD = (
    "x' UNION SELECT table_name,column_name,'','',privacy,table_size,"
    "s3_location,location FROM job_detection_output_table WHERE '1'='1"
)


def test_benign_fields_pass_validation():
    # A normal request must not be rejected.
    validate("123456789012", "us-east-1", "glue", "my_database", "run-baseline-0001")
    validate("123456789012", "us-east-1", "rds", "my_db", "0f8b3c2a-1234-5678-9abc-def012345678")


@pytest.mark.parametrize("field_name,fields", [
    ("run_id", ("999999999999", "eu-west-1", "rds", "nonexistent_db", INJECTION_PAYLOAD)),
    ("account_id", ("1'; DROP TABLE x --", "us-east-1", "s3", "db", "r")),
    ("region", ("1", "us-east-1' OR '1'='1", "s3", "db", "r")),
    ("database_name", ("1", "us-east-1", "s3", "db'--", "r")),
    ("run_id", ("1", "us-east-1", "s3", "db", "r/* comment */")),
])
def test_injection_fields_are_rejected(field_name, fields):
    with pytest.raises(BizException):
        validate(*fields)


@pytest.mark.parametrize("bad_type", [
    "glue' OR 1=1",
    "unknown",
    "s3; SELECT 1",
    "",
])
def test_invalid_database_type_is_rejected(bad_type):
    with pytest.raises(BizException):
        validate("123456789012", "us-east-1", bad_type, "db", "run-1")


def test_query_uses_parameter_binding(mocker):
    """The malicious value must be bound as an execution parameter, and the
    generated SQL must contain '?' placeholders rather than the interpolated
    value, so it cannot escape the intended string literal."""
    captured = {}

    class _FakeAthena:
        def start_query_execution(self, **kwargs):
            captured.update(kwargs)
            return {"QueryExecutionId": "qid-test"}

        def get_query_execution(self, **kwargs):
            return {"QueryExecution": {"Status": {"State": "SUCCEEDED"}}}

        def get_query_results(self, **kwargs):
            return {"ResultSet": {"Rows": []}}

    mocker.patch("catalog.service.boto3.client", return_value=_FakeAthena())
    # __remove_query_result_from_s3 issues its own boto3 S3 calls; stub it out.
    mocker.patch("catalog.service.__remove_query_result_from_s3", return_value=True)

    # database_type must be a valid enum value ('rds', not 's3') so the payload
    # rides straight to the query builder, mirroring the reported attack.
    query_by_athena("123456789012", "us-east-1", "rds", "my_db", "safe-run-id")

    sql = captured["QueryString"]
    params = captured["ExecutionParameters"]

    # No user value is interpolated; every filter uses a positional placeholder.
    assert "account_id=?" in sql
    assert "run_id=?" in sql
    assert "'%s'" not in sql
    # The five values are bound as parameters, in order.
    assert params == ["123456789012", "us-east-1", "rds", "my_db", "safe-run-id"]
