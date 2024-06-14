"""
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import os
import sys
from functools import reduce

import boto3
import pyspark.sql.functions as sf
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from data_source.construct_dataframe import construct_dataframe
from data_source.get_tables import get_tables
from pyspark.context import SparkContext
from pyspark.sql import DataFrame
from structured_detection.detection_utils import add_metadata, get_table_info
from structured_detection.main_detection import detect_df
from template.template_utils import get_template

if __name__ == "__main__":
    """
    This script is used to perform PII detection on using Glue Data Catalog.
    """

    # Get all input arguments
    s3 = boto3.client(service_name="s3")
    glue = boto3.client(service_name="glue")
    result_database = "sdps_database"
    result_table = "job_detection_output_table"

    args = getResolvedOptions(
        sys.argv,
        [
            "AccountId",
            "Region",
            "JOB_NAME",
            "DatabaseName",
            "GlueDatabaseName",
            "DatabaseType",
            "Depth",
            "DetectionThreshold",
            "JobId",
            "RunId",
            "RunDatabaseId",
            "TemplateId",
            "TemplateSnapshotNo",
            "AdminBucketName",
            "BaseTime",
            "TableBegin",
            "TableEnd",
            "TableName",
            "IncludeKeywords",
            "ExcludeKeywords",
        ],
    )

    output_path = f"s3://{args['AdminBucketName']}/glue-database/{result_table}/"
    error_path = (
        f"s3://{args['AdminBucketName']}/glue-database/job_detection_error_table/"
    )

    # Create spark and glue context
    sc = SparkContext()
    glueContext = GlueContext(sc)
    spark = glueContext.spark_session
    job = Job(glueContext)
    job.init(args["JOB_NAME"], args)

    # Get all crawler tables
    crawler_tables = get_tables(glue, args)
    num_crawler_tables = len(crawler_tables)

    # Get template from s3 and broadcast it
    template = get_template(
        s3, args["AdminBucketName"], args["TemplateId"], args["TemplateSnapshotNo"]
    )
    broadcast_template = sc.broadcast(template)

    output = []
    error = []
    save_freq = 10
    for table_index, table in enumerate(crawler_tables):
        try:
            # call detect_table to perform PII detection
            print(f"Detecting table {table['Name']}")
            raw_df = construct_dataframe(glueContext, glue, table, args)
            detection_result = detect_df(raw_df, glueContext, broadcast_template, args)
            summarized_result = add_metadata(detection_result, table, args)
            summarized_result.show()
            output.append(summarized_result)

        except Exception as e:
            # Report error if failed
            basic_table_info = get_table_info(table, args)
            data = {
                "account_id": args["AccountId"],
                "region": args["Region"],
                "job_id": args["JobId"],
                "run_id": args["RunId"],
                "run_database_id": args["RunDatabaseId"],
                "database_name": args["DatabaseName"],
                "database_type": args["DatabaseType"],
                "table_name": table["Name"],
                "location": basic_table_info["location"],
                "s3_location": basic_table_info["s3_location"],
                "s3_bucket": basic_table_info["s3_bucket"],
                "rds_instance_id": basic_table_info["rds_instance_id"],
                "error_message": str(e),
            }
            error.append(data)
            print(f"Error occured detecting table {table}")
            print(e)

        if (table_index + 1) % save_freq == 0 or (
            table_index + 1
        ) == num_crawler_tables:
            # Save detection result to s3.
            if output:
                df = reduce(DataFrame.unionAll, output)
                df = df.repartition(1, "year", "month", "day")
                # df.show()
                df.write.partitionBy("year", "month", "day").mode("append").parquet(
                    output_path
                )

            # If error in detect_table, save to error_path
            if error:
                df = spark.createDataFrame(error)
                df.withColumn(
                    "update_time", sf.from_utc_timestamp(sf.current_timestamp(), "UTC")
                )
                df = df.repartition(1)
                df.write.mode("append").parquet(error_path)

            output = []
            error = []

    job.commit()
