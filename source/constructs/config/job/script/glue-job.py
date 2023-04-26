'''
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
'''


import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
# from awsglueml.transforms import EntityDetector
from pyspark.sql.types import ArrayType, StringType, FloatType, StructType, StructField
# from awsglue.dynamicframe import DynamicFrame
import boto3
from dateutil.parser import parse
import pytz
import pyspark.sql.functions as sf
from pyspark.sql import DataFrame
from functools import reduce
import os
from datetime import datetime
from urllib.parse import urlparse
import tempfile
import json
import re
import sdps_ner
import math

from awsglueml.transforms import EntityDetector
from awsglue.dynamicframe import DynamicFrame


def get_template(s3, bucket_name, object_name):
    """
    get_template is used to download regex template file from bucket name and 
    use json to load the contents.

    Args:
        s3: The boto3 client used to download the template
        bucket_name: The bucket name to download template file from.
        object_name: The path of regex template file in bucket_name.
    
    Returns:
        the regex templates as a python dict.
    """
    with tempfile.TemporaryFile() as data:
        s3.download_fileobj(bucket_name, object_name, data)
        data.seek(0)
        return json.loads(data.read().decode('utf-8'))

class ColumnDetector:
    def __init__(self, broadcast_template):
        self.broadcast_template = broadcast_template
    
    def detect_column(self, col_val, column_name):
        """
        detect_column serves as a function to construct a udf 
        to detect entities inside a dataframe.

        sdps_ner predict() sample output: 
        sdps_ner.predict('Mike James') = {'Mike James': [{'Identifier': 'ENGLISH-NAME', 'Score': 0.99523854}]}

        Args:
            col_val: The value in a cell to be detected
            column_name: The name of a column
        
        Returns:
            result = [{'identifier': 'CHINESE-NAME', 'score': 0.5},
                {'identifier': 'ENGLISH-NAME', 'score': 0.4}]
        """

        result = []
        identifiers = self.broadcast_template.value.get('identifiers')
        ml_result = sdps_ner.predict(str(col_val)).get(str(col_val), [])
        ml_label_mapping = {'CHINESE-NAME': 'CN_CHINESE_NAME',
                            'ENGLISH-NAME': 'CN_ENGLISH_NAME',
                            'ADDRESS': 'CN_ADDRESS'}

        for identifier in identifiers:
            identifier_type = identifier.get('type', -1)
            if identifier_type == 2:
                continue

            header_keywords = identifier.get('header_keywords', [])
            
            score = 0
            valid_column_header = False

            # column header is valid when no specific column header required for this identifier.
            if not header_keywords or len(header_keywords) == 0:
                valid_column_header = True
            else:
                for keyword in header_keywords:
                    if re.search(keyword, column_name):
                        valid_column_header = True
                        break

            # Only perform regex matching when this column has valid column header.
            if valid_column_header:
                if identifier['category'] == 1:
                    if identifier['rule']:
                        if re.search(identifier['rule'], str(col_val)):
                            score = 1
                    else:
                        score = 1
                elif identifier['category'] == 0:
                    for r in ml_result:
                        if r['Identifier'] in ml_label_mapping.keys():
                            if ml_label_mapping[r['Identifier']] == identifier['name']:
                                score = r['Score']
            result.append({'identifier': identifier['name'], 'score': float(score)})

        return result
    
    def create_detect_column_udf(self):
        detect_column_udf = sf.udf(self.detect_column, ArrayType(StructType([StructField('identifier', StringType()), StructField('score', FloatType())])))
        return detect_column_udf

def sample_data(df, column_name, limit):
    """
    sample_data performs sampling on a column and creates a new column in the df with sample data.
    This function is currently not used.

    Args:
        df: the df to provide sample data.
        column_name: the name of original df to collect all the data as a list.
        limit: The number of rows to display as sample data in the df.
    
    Returns:
        returns the sampled data defined by limit in column_name in df.
    """
    return df.limit(limit).select(sf.collect_list(column_name).alias('sample_data')).collect()[0]['sample_data']

def mask_data(col_val):
    """
    This mask_data is used to created a udf for masking data.
    The input is a list of strings. The column to be detected is a column of lists.
    If a string is longer than 100, we display the first 70 characters,
    and display the following characters using * (at most 30 *)
    """
    def mask_string(s):
        length = len(s)
        first_70_percent = math.floor(length * 0.7)
        display_length = min(first_70_percent, 70)
        masked_length = min(30, length - display_length)
        return s[:display_length] + '*' * (masked_length)
    return [mask_string(s) for s in col_val]

def create_mask_data_udf():
    mask_data_udf = sf.udf(mask_data, ArrayType(StringType()))
    return mask_data_udf

def get_table_info(table, args):
    """
    get_table_info function aims to find the basic info of the table.

    Args:
        table: the table from crawler to be detected.
    
    Returns:
        s3_location: the s3 location of the cralwer table.
        s3_bucket: the s3 bucket of the crawler table.
        rds_instance_id: the rds instance id of the crawler table.
    """
    s3_location = 'NA'
    s3_bucket = 'NA'
    if args['DatabaseType'] == 's3':
        s3_location = table['StorageDescriptor']['Location']
        s3_bucket = urlparse(s3_location).netloc
    rds_instance_id = 'NA'
    if args['DatabaseType'] == 'rds':
        # rds_instance_id = database_name[4:len(database_name)-9]
        rds_instance_id = args["DatabaseName"]
    return s3_location, s3_bucket, rds_instance_id

def summarize_glue_result_udf(classifications, column_name):
    result = []
    if classifications.get(column_name):
        for attr in classifications[column_name]:
            result.append({'identifier': attr['entityType'], 'score': 1.0})

    return result

def create_summarize_glue_result_udf():
    summarize_result_udf = sf.udf(summarize_glue_result_udf, ArrayType(StructType([StructField('identifier', StringType()), StructField('score', FloatType())])))
    return summarize_result_udf

def classifyColumnsAfterRowLevel(nonEmptySampledDf: DataFrame,
                                 summarize_glue_result_udf,
                                 outputColumnName: str,
                                 thresholdFraction: float):
    
    clsDataCol = sf.col(outputColumnName)
    identity_columns = {}

    for column in nonEmptySampledDf.columns:
        if column == "DetectedEntities":
            continue
        identity_columns[column] = column+'_identity_types'
        nonEmptySampledDf = nonEmptySampledDf.withColumn(column+'_identity_types', summarize_glue_result_udf(clsDataCol, sf.lit(column)))

    rows = nonEmptySampledDf.count()
    expr_str = ', '.join([f"'{k}', `{v}`"for k, v in identity_columns.items()])
    expr_str = f"stack({len(identity_columns)}, {expr_str}) as (column_name,identity_types)"
    nonEmptySampledDf = nonEmptySampledDf.select(sf.expr(expr_str))\
        .select('column_name', sf.explode('identity_types'))\
        .select('col.*', '*').groupBy('column_name', 'identifier').agg(sf.sum('score').alias('score'))\
        .withColumn('score', sf.col('score')/rows)\
        .where(f'score > 0.1')\
        .withColumn('identifier', sf.struct('identifier', 'score'))\
        .groupBy('column_name').agg(sf.collect_list('identifier').alias('identifiers'))

    return nonEmptySampledDf

def glue_entity_detection(glueContext, df, summarize_glue_result_udf, broadcast_template):

    glue_identifiers = []
    identifiers = broadcast_template.value.get('identifiers')
    for identifier in identifiers:
        identifier_type = identifier.get('type', -1)
        if identifier_type == 2:
            glue_identifiers.append(identifier['name'])

    if len(glue_identifiers) != 0:
        dynamic_df = DynamicFrame.fromDF(df, glueContext, "dynamic_df")

        entity_detector = EntityDetector()
        DetectSensitiveData_node1 = entity_detector.detect(
            dynamic_df,
            glue_identifiers,
            "DetectedEntities",
        )

        glue_detector_result = classifyColumnsAfterRowLevel(DetectSensitiveData_node1.toDF(), summarize_glue_result_udf, "DetectedEntities", 0.1)
    else:
        glue_detector_result = None

    return glue_detector_result

def sdps_entity_detection(df, threshold, detect_column_udf):

    rows = df.count()

    identity_columns = {}
    for column in df.columns:
        identity_columns[column] = column+'_identity_types'
        df = df.withColumn(column+'_identity_types', detect_column_udf(column, sf.lit(column)))
    
    expr_str = ', '.join([f"'{k}', `{v}`"for k, v in identity_columns.items()])
    expr_str = f"stack({len(identity_columns)}, {expr_str}) as (column_name,identity_types)"
    result_df = df.select(sf.expr(expr_str))\
        .select('column_name', sf.explode('identity_types'))\
        .select('col.*', '*').groupBy('column_name', 'identifier').agg(sf.sum('score').alias('score'))\
        .withColumn('score', sf.col('score')/rows)\
        .where(f'score > {threshold}')\
        .withColumn('identifier', sf.struct('identifier', 'score'))\
        .groupBy('column_name').agg(sf.collect_list('identifier').alias('identifiers'))
    
    return result_df

def detect_df(df, spark, glueContext, udf_dict, broadcast_template, table, region, args):
    """
    detect_table is the main function to perform PII detection in a crawler table.
    """

    threshold = float(args['DetectionThreshold'])
    detect_column_udf, mask_data_udf = udf_dict['detect_column_udf'], udf_dict['mask_data_udf']
    summarize_glue_result_udf = udf_dict['summarize_glue_result_udf']
    
    table_size = df.count()

    if table_size > 0:
        if args['Depth'].isdigit() and args['Depth'] != '1':
            depth = int(args['Depth'])
            df = df.limit(depth*10)
            rows = df.count()
            sample_rate = 1.0 if rows <= depth else depth/rows
        else:
            sample_rate = float(args['Depth'])

        df = df.sample(sample_rate)
        # print(rows)
        sample_df = df.limit(10)
        # sample_df.show()

        glue_result_df = glue_entity_detection(glueContext, df, summarize_glue_result_udf, broadcast_template)
        sdps_result_df = sdps_entity_detection(df, threshold, detect_column_udf)

        if glue_result_df != None:
            union_result_df = glue_result_df.union(sdps_result_df)
            result_df = union_result_df.groupBy('column_name').agg(sf.collect_list('identifiers').alias('identifiers'))
            result_df = result_df.select('column_name', sf.flatten('identifiers').alias('identifiers'))
        else:
            result_df = sdps_result_df
        # result_df.show(truncate=False)
    
        expr_str = ', '.join([f"'{c}', cast(`{c}` as string)"for c in sample_df.columns])
        expr_str = f"stack({len(sample_df.columns)}, {expr_str}) as (column_name,sample_data)"
        sample_df = sample_df.select(sf.expr(expr_str)).groupBy('column_name').agg(sf.collect_list('sample_data').alias('sample_data'))

        data_frame = result_df
        data_frame = data_frame.join(sample_df, data_frame.column_name == sample_df.column_name, 'right')\
            .select(data_frame['identifiers'], sample_df['*'])
    elif table_size == 0:
        empty_df_schema = StructType([
            StructField("identifiers", StringType(), True),
            StructField("column_name", StringType(), True),
            StructField("sample_data", StringType(), True),
        ])

        data_frame = spark.createDataFrame([(None, "", "")], empty_df_schema)

    s3_location, s3_bucket, rds_instance_id = get_table_info(table, args)
    # data_frame = spark.createDataFrame(data=items, schema=schema)

    data_frame = data_frame.withColumn('account_id', sf.lit(args['AccountId']))    
    data_frame = data_frame.withColumn('job_id', sf.lit(args['JobId']))
    data_frame = data_frame.withColumn('run_id', sf.lit(args['RunId']))
    data_frame = data_frame.withColumn('run_database_id', sf.lit(args['RunDatabaseId']))
    data_frame = data_frame.withColumn('database_name', sf.lit(args['DatabaseName']))
    data_frame = data_frame.withColumn('database_type', sf.lit(args['DatabaseType']))
    data_frame = data_frame.withColumn('table_name', sf.lit(table['Name']))
    data_frame = data_frame.withColumn('region', sf.lit(region))
    data_frame = data_frame.withColumn('update_time', sf.from_utc_timestamp(sf.current_timestamp(), 'Asia/Shanghai'))
    data_frame = data_frame.withColumn('s3_location', sf.lit(s3_location))
    data_frame = data_frame.withColumn('s3_bucket', sf.lit(s3_bucket))
    data_frame = data_frame.withColumn('rds_instance_id', sf.lit(rds_instance_id))
    data_frame = data_frame.withColumn('privacy', sf.expr('case when identifiers is null then 0 else 1 end'))
    data_frame = data_frame.withColumn('year', sf.year(sf.col('update_time')))
    data_frame = data_frame.withColumn('month', sf.month(sf.col('update_time')))
    data_frame = data_frame.withColumn('day', sf.dayofmonth(sf.col('update_time')))
    data_frame = data_frame.withColumn('sample_data', mask_data_udf('sample_data'))
    data_frame = data_frame.withColumn('table_size', sf.lit(table_size))
    
    # data_frame.show(100, truncate=False)
    return data_frame
    

def get_tables(_database_name, _base_time, region):
    """
    get_tables detects all the crawler tables in one specified database.

    Args:
        _database_name: The database to store all crawler tables.
        _base_time: Only table updated after _base_time is detected.
    
    Returns:
        tables: All the crawler tables after _base_time.
    """
    next_token = ""
    glue = boto3.client(service_name='glue', region_name=region)
    tables = []
    while True:
        response = glue.get_tables(
            # CatalogId=catalog_id, 
            DatabaseName=_database_name, 
            NextToken=next_token)
        for table in response['TableList']:
            if table['UpdateTime'] > _base_time:
                tables.append(table)
        next_token = response.get('NextToken')
        if next_token is None:
            break
    return tables

if __name__ == "__main__":
    """
    The following code is used to get all input arguments while executing this job.
    """

    region = os.environ['AWS_DEFAULT_REGION']
    s3 = boto3.client(service_name='s3', region_name=region)
    result_database = 'sdps_database'
    result_table = 'job_detection_output_table'

    args = getResolvedOptions(sys.argv, ["AccountId", "JOB_NAME", 'DatabaseName', 'BaseTime', 'DatabaseType', 'BucketName',
    'Depth', 'DetectionThreshold', 'JobId', 'RunId', 'RunDatabaseId', 'TemplateId', 'TemplateSnapshotNo', 'AdminAccountId'])

    base_time = parse(args['BaseTime']).replace(tzinfo=pytz.timezone('Asia/Shanghai'))
    full_database_name = f"{args['DatabaseType']}-{args['DatabaseName']}-database"
    output_path = f"s3://{args['BucketName']}/glue-database/{result_table}/"
    error_path = f"s3://{args['BucketName']}/glue-database/job_detection_error_table/"

    sc = SparkContext()
    glueContext = GlueContext(sc)
    spark = glueContext.spark_session
    job = Job(glueContext)
    job.init(args["JOB_NAME"], args)

    output = []
    error = []

    template = get_template(s3, args['BucketName'], f"template/template-{args['TemplateId']}-{args['TemplateSnapshotNo']}.json")
    broadcast_template = sc.broadcast(template)

    crawler_tables = get_tables(full_database_name, base_time, region)

    column_detector = ColumnDetector(broadcast_template)
    detect_column_udf = column_detector.create_detect_column_udf()
    mask_data_udf = create_mask_data_udf()
    summarize_glue_result_udf = create_summarize_glue_result_udf()
    udf_dict = dict()
    udf_dict['detect_column_udf'] = detect_column_udf
    udf_dict['mask_data_udf'] = mask_data_udf
    udf_dict['summarize_glue_result_udf'] = summarize_glue_result_udf

    # crawler_tables = [{'Name': 'sakila_customer'}]
    for table in crawler_tables:
        try:
            # call detect_table to perform PII detection 
            raw_df = glueContext.create_data_frame_from_catalog(
                database=full_database_name,
                table_name=table['Name']
            )
            # transformation_ctx = full_database_name + table['Name'] + 'df'
            summarized_result = detect_df(raw_df, spark, glueContext, udf_dict, broadcast_template, table, region, args)
            
            output.append(summarized_result)
        except Exception as e:
            # Report error if failed
            s3_location, s3_bucket, rds_instance_id = get_table_info(table, args)
            data = {
                'account_id': args["AccountId"],
                'region': region,
                'job_id': args['JobId'],
                'run_id': args['RunId'],
                'run_database_id': args['RunDatabaseId'],
                'database_name': args['DatabaseName'],
                'database_type': args['DatabaseType'],
                'table_name': table['Name'],
                's3_location': s3_location,
                's3_bucket': s3_bucket,
                'rds_instance_id': rds_instance_id,
                'error_message': str(e)
            }
            error.append(data)
            print(f'Error occured detecting table {table}')
            print(e)


    # Save detection result to s3.
    if output:
        df = reduce(DataFrame.unionAll, output)
        df = df.repartition(1, 'year', 'month', 'day')
        # glueContext.write_data_frame_from_catalog(
        #     frame=df,
        #     database=result_database,
        #     table_name=result_table,
        #     catalog_id=args['AdminAccountId']
        # )
        # df.show()
        df.write.partitionBy('year', 'month', 'day').mode('append').parquet(output_path)

    # If error in detect_table, save to error_path
    if error:
        df = spark.createDataFrame(error)
        df.withColumn('update_time', sf.from_utc_timestamp(sf.current_timestamp(), 'Asia/Shanghai'))
        df = df.repartition(1)
        df.write.mode('append').parquet(error_path)

    job.commit()
