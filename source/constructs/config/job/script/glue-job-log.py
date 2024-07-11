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

import gzip
import json
import logging
import os
import sys
from pathlib import Path
from tempfile import NamedTemporaryFile

import boto3
from awsglue.context import GlueContext
from awsglue.utils import getResolvedOptions
from log_detection.detection_utils import add_metadata, format_error_record_data
from log_detection.main_detection import detect_df
from pyspark.context import SparkContext
from pyspark.sql import Row
from pyspark.sql.functions import (
    col,
    current_timestamp,
    from_utc_timestamp,
    monotonically_increasing_id,
    udf,
)
from template.template_utils import get_template

LOGGING_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"


class LogPiiDetectionSparkJob:

    def __init__(self):
        self.name = "LogPiiDetectionSparkJob"
        self.args = None

        self.log_level = "INFO"

    def parse_arguments(self):
        """ """

        mandatory_args = [
            "AccountId",
            "Region",
            "JOB_NAME",
            "DatabaseName",
            "JobId",
            "RunId",
            "RunDatabaseId",
            "AdminBucketName",
            "AgentBucketName",
            "TemplateId",
            "TemplateSnapshotNo",
            "BaseTime",
            "TableBegin",
            "TableEnd",
            "TableName",
            "IncludeKeywords",
            "ExcludeKeywords",
        ]

        args = getResolvedOptions(sys.argv, mandatory_args)

        self.name = args["JOB_NAME"]
        self.args = args

    def add_arguments(self):
        """"""
        raise NotImplementedError

    def validate_arguments(self):
        """"""

        return True

    def init_logging(self, level=None, spark_context=None):
        if level:
            self.log_level = level
        else:
            level = self.log_level
        logging.basicConfig(level=level, format=LOGGING_FORMAT)
        logging.getLogger(self.name).setLevel(level)
        if spark_context:
            spark_context.setLogLevel(level)

    def init_accumulators(self, spark_context):
        """Register and initialize counters (aka. accumulators).
        Derived classes may use this method to add their own
        accumulators but must call super().init_accumulators(spark_session)
        to also initialize counters from base classes."""
        self.records_processed = spark_context.accumulator(0)
        self.warc_input_processed = spark_context.accumulator(0)
        self.warc_input_failed = spark_context.accumulator(0)

    def get_logger(self, spark_session):
        """Get logger from SparkSession or (if None) from logging module"""
        if spark_session:
            return spark_session._jvm.org.apache.log4j.LogManager.getLogger(self.name)
        return logging.getLogger(self.name)

    def log_accumulator(self, spark_session, acc, descr):
        """Log single counter/accumulator"""
        self.get_logger(spark_session).info(descr.format(acc.value))

    def log_accumulators(self, spark_session):
        """Log counters/accumulators, see `init_accumulators`."""
        self.log_accumulator(
            spark_session,
            self.warc_input_processed,
            "WARC/WAT/WET input files processed = {}",
        )
        self.log_accumulator(
            spark_session,
            self.warc_input_failed,
            "WARC/WAT/WET input files failed = {}",
        )
        self.log_accumulator(
            spark_session, self.records_processed, "WARC/WAT/WET records processed = {}"
        )

    def get_detect_template(self, spark_context):
        # Get template from s3 and broadcast it
        s3_client = boto3.client("s3")
        template = get_template(
            s3_client,
            self.args["AdminBucketName"],
            self.args["TemplateId"],
            self.args["TemplateSnapshotNo"],
        )
        broadcast_template = spark_context.broadcast(template)
        return broadcast_template

    def run(self):
        """Run the job"""
        spark_context = SparkContext()
        glue_context = GlueContext(spark_context)
        spark_session = glue_context.spark_session

        self.parse_arguments()
        if not self.validate_arguments():
            raise Exception("Arguments not valid")

        self.init_logging(self.log_level, spark_context)

        logging.info(self.args)

        self.init_accumulators(spark_context)

        self.run_job(glue_context, spark_context)

        spark_session.stop()

    def run_job(self, glue_context, spark_context):

        spark_session = glue_context.spark_session

        broadcast_template = self.get_detect_template(spark_context)

        crawler_save_result_prefix = ""

        crawler_result_path_json = f"s3-log-crawler-result/crawler-results-index/{self.args['DatabaseName']}/{crawler_save_result_prefix}result.json"
        output_path = f"s3://{self.args['AdminBucketName']}/glue-database/job_detection_output_table/"
        error_path = f"s3://{self.args['AdminBucketName']}/glue-database/job_detection_error_table/"
        # get the content of the result file
        s3_client = boto3.client("s3")
        result_file = NamedTemporaryFile(delete=False, suffix=".json")
        print(
            f"Downloading from s3://{self.args['AgentBucketName']}/{crawler_result_path_json}"
        )
        s3_client.download_file(
            self.args["AgentBucketName"], crawler_result_path_json, result_file.name
        )
        with open(result_file.name) as f:
            crawler_result_paths = json.load(f)

        for crawler_result_path in crawler_result_paths[
            int(self.args["TableBegin"]) : int(self.args["TableEnd"])
        ]:
            logging.info(f"Processing {crawler_result_path}")
            try:
                df = (
                    spark_session.read.format("json")
                    .option("header", "true")
                    .load(f"s3://{self.args['AgentBucketName']}/{crawler_result_path}")
                    .repartition(50)
                    .withColumn("id", monotonically_increasing_id())
                )

                result_df = detect_df(df, glue_context, broadcast_template, self.args)

                result_df = add_metadata(result_df, self.args)

                result_df = result_df.repartition(1, "year", "month", "day")
                result_df.write.partitionBy("year", "month", "day").mode(
                    "append"
                ).parquet(output_path)

            except Exception as e:
                logging.error(f"Error processing {crawler_result_path}: {e}")
                error_df_data = format_error_record_data(e, self.args)
                error_df = spark_session.createDataFrame(error_df_data)
                error_df.withColumn(
                    "update_time", from_utc_timestamp(current_timestamp(), "UTC")
                )
                error_df = error_df.repartition(1)
                error_df.write.mode("append").parquet(error_path)
                continue


if __name__ == "__main__":
    logging.info("Starting preprocess job")

    job = LogPiiDetectionSparkJob()
    job.run()
