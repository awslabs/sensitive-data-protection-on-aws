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
from pyspark.sql.types import ArrayType, StringType, FloatType, DoubleType, StructType, StructField
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
    """
    ColumnDetector is used to detect entities in a column.
    """
    def __init__(self, broadcast_template, job_exclude_keywords):
        self.broadcast_template = broadcast_template

        raw_job_exclude_keywords = job_exclude_keywords.split(',') if job_exclude_keywords else []
        self.job_exclude_keywords = list(filter(None, raw_job_exclude_keywords))
    
    def validate_column_name(self, column_name, identifier_include_keywords, identifier_exclude_keywords):
        """
        validate_column_name is used to check whether a column name is valid.
        A column name is valid when it is not in the exclude keywords list.

        Args:
            column_name: The name of a column.
        
        Returns:
            True if column_name is valid, False otherwise.
        """
        valid_column_header = False
        
        total_exclude_keywords = identifier_exclude_keywords + self.job_exclude_keywords
        for exclude_keyword in total_exclude_keywords:
            if re.search(exclude_keyword, column_name):
                valid_column_header = False
                return valid_column_header

        if not identifier_include_keywords:
            valid_column_header = True
        else:
            for keyword in identifier_include_keywords:
                if re.search(keyword, column_name):
                    valid_column_header = True
                    break
        return valid_column_header
    
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
        ml_label_mapping = {'CHINESE-NAME': 'CHINA_CHINESE_NAME',
                            'ENGLISH-NAME': 'CHINA_ENGLISH_NAME',
                            'ADDRESS': 'CHINA_ADDRESS'}

        # iterate through all identifiers(including Regex and ML) to detect entities in col_val
        for identifier in identifiers:
            # Get identifier and skip Glue identifier when identifier type is 2
            identifier_type = identifier.get('type', -1)
            if identifier_type == 2:
                continue

            identifier_include_keywords = identifier.get('header_keywords', [])
            identifier_include_keywords = list(filter(None, identifier_include_keywords)) if identifier_include_keywords else []
            identifier_exclude_keywords = identifier.get('exclude_keywords', [])
            identifier_exclude_keywords = list(filter(None, identifier_exclude_keywords)) if identifier_exclude_keywords else []
            
            score = 0
            valid_column_header = self.validate_column_name(column_name, identifier_include_keywords, identifier_exclude_keywords)

            # Only perform regex matching when this column has valid column header.
            if valid_column_header:
                # Regex matching when identifier classification is 1
                if identifier['classification'] == 1:
                    if identifier['rule']:
                        if re.search(identifier['rule'], str(col_val)):
                            score = 1
                    else:
                        score = 1
                # ML matching when identifier classification is 0
                elif identifier['classification'] == 0:
                    for r in ml_result:
                        if r['Identifier'] in ml_label_mapping.keys():
                            if ml_label_mapping[r['Identifier']] == identifier['name']:
                                score = r['Score']
            result.append({'identifier': identifier['name'], 'score': float(score)})

        return result
    
    def create_detect_column_udf(self):
        # Create a udf to detect entities in a column
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
    If a string is longer than 100, we display the first 80 characters,
    and display the following characters using * (at most 20 *)
    """
    def mask_string(s):
        length = len(s)
        first_80_percent = math.floor(length * 0.8)
        display_length = min(first_80_percent, 80)
        masked_length = min(20, length - display_length)
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
        rds_instance_id = args["DatabaseName"]
    return s3_location, s3_bucket, rds_instance_id

def post_process_glue_result(glue_result_df):
    """
    post_process_glue_result function aims to filter false positive results in Glue.
    More rules will be added in this function in the future.
    """
    processed_glue_result_df = glue_result_df.filter((sf.col('entityType') != 'PERSON_NAME') | (sf.col('column_name').rlike("name|姓名|^col")))
    return processed_glue_result_df

def classifyColumnsAfterRowLevel(nonEmptySampledDf: DataFrame, thresholdFraction: float):
    """
    classifyColumnsAfterRowLevel function aims to summarize column level detection results
    after performing row level detection in Glue.
    
    Args:
        nonEmptySampledDf: the df after performing row level detection in Glue.
        thresholdFraction: the threshold to filter out the results with score less than thresholdFraction.
    
    Returns:
        glue_entities_df: the df with column level detection results.
    """

    rows = nonEmptySampledDf.count()

    glue_entities_df = nonEmptySampledDf.select(sf.explode(sf.col("DetectedEntities")).alias("column_name", "entities"))\
        .selectExpr("column_name", "explode(entities) as entity")\
        .selectExpr("column_name", "entity.entityType")
    glue_entities_df = post_process_glue_result(glue_entities_df)
    glue_entities_df = glue_entities_df.withColumn("score", sf.lit(1.0)/rows)\
        .groupBy('column_name', 'entityType').agg(sf.sum('score').alias('score'))\
        .where(f'score > {thresholdFraction}')\
        .withColumnRenamed("entityType", "identifier")\
        .withColumn('identifiers', sf.struct('identifier', 'score'))\
        .groupBy('column_name').agg(sf.collect_list('identifiers').alias('identifiers'))\

    return glue_entities_df

def glue_entity_detection(glueContext, df, broadcast_template, threshold):
    """
    glue_entity_detection function aims to perform entity detection in Glue.
    
    Args:
        glueContext: the glueContext to perform entity detection.
        df: the df to be detected.
        broadcast_template: the broadcast template to be used for entity detection.
        threshold: the threshold to filter out the results with score less than thresholdFraction.
    
    Returns:
        glue_detector_result: the df with column level detection results.
        """

    glue_identifiers = []

    # Get the Glue identifiers from the broadcast template
    identifiers = broadcast_template.value.get('identifiers')
    for identifier in identifiers:
        identifier_type = identifier.get('type', -1)
        if identifier_type == 2:
            glue_identifiers.append(identifier['name'])

    # Perform entity detection in Glue
    if len(glue_identifiers) != 0:
        dynamic_df = DynamicFrame.fromDF(df, glueContext, "dynamic_df")

        entity_detector = EntityDetector()
        DetectSensitiveData_node1 = entity_detector.detect(
            dynamic_df,
            glue_identifiers,
            "DetectedEntities",
        )

        glue_detector_result = classifyColumnsAfterRowLevel(DetectSensitiveData_node1.toDF(), threshold)
    else:
        glue_detector_result = None

    return glue_detector_result

def sdps_entity_detection(df, threshold, detect_column_udf):
    """
    sdps_entity_detection function aims to perform entity detection in SDPS.
    
    Args:
        df: the df to be detected.
        threshold: the threshold to filter out the results with score less than thresholdFraction.
        detect_column_udf: the udf to be used for entity detection.
        
    Returns:
        result_df: the df with column level SDPS detection results."""

    rows = df.count()

    # Perform entity detection in SDPS
    identity_columns = {}
    for column in df.columns:
        identity_columns[column] = column+'_identity_types'
        df = df.withColumn(column+'_identity_types', detect_column_udf(column, sf.lit(column)))
    
    # Summarize the column level detection results
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

def preprocess_df(df, table_depth):
    """
    preprocess_df function aims to preprocess the df before performing entity detection.
    Select first 128 characters of each string column.
    """
    # Sample the df to size of depth
    if table_depth.isdigit():
        depth = int(table_depth)
        df = df.limit(depth*10)
        rows = df.count()
        sample_rate = 1.0 if rows <= depth else depth/rows

    df = df.sample(sample_rate)
    
    # Select first 128 characters of each string column
    df = df.select([sf.col(c).cast("string") for c in df.columns])
    df = df.select([sf.substring(c, 1, 128).alias(c) if t == "string" else c for c, t in df.dtypes])

    return df

def detect_df(df, spark, glueContext, udf_dict, broadcast_template, table, region, args):
    """
    detect_table is the main function to perform PII detection in a crawler table.

    Args:
        df: the df to be detected.
        spark: the spark session.
        glueContext: the glueContext to perform entity detection.
        udf_dict: the udf dict containing all udfs to be used for entity detection.
        broadcast_template: the broadcast template to be used for entity detection.
        table: the name of Glue Table.
        region: the region of this SDPS Job.
        args: the args dict containing all the parameters for this SDPS Job.
    
    Returns:
        result_df: the df with column level detection results.
    """

    threshold = float(args['DetectionThreshold'])
    detect_column_udf, mask_data_udf = udf_dict['detect_column_udf'], udf_dict['mask_data_udf']
    
    table_size = df.count()

    if table_size > 0:
        
        df = preprocess_df(df, args['Depth'])
        sample_df = df.limit(10)

        # Perform entity detection in Glue and SDPS
        glue_result_df = glue_entity_detection(glueContext, df, broadcast_template, threshold)
        sdps_result_df = sdps_entity_detection(df, threshold, detect_column_udf)

        # Combine the results from Glue and SDPS
        if glue_result_df != None:
            union_result_df = glue_result_df.union(sdps_result_df)
            result_df = union_result_df.groupBy('column_name').agg(sf.collect_list('identifiers').alias('identifiers'))
            result_df = result_df.select('column_name', sf.flatten('identifiers').alias('identifiers'))
        else:
            result_df = sdps_result_df

        # Combine the results with masked sample data
        expr_str = ', '.join([f"'{c}', cast(`{c}` as string)"for c in sample_df.columns])
        expr_str = f"stack({len(sample_df.columns)}, {expr_str}) as (column_name,sample_data)"
        sample_df = sample_df.select(sf.expr(expr_str)).groupBy('column_name').agg(sf.collect_list('sample_data').alias('sample_data'))

        data_frame = result_df
        data_frame = data_frame.join(sample_df, data_frame.column_name == sample_df.column_name, 'right')\
            .select(data_frame['identifiers'], sample_df['*'])
    # If table size is 0, return an empty df with default schema
    elif table_size == 0:
        empty_df_schema = StructType([
            StructField("identifiers", ArrayType(StructType(
                            [StructField("identifier",StringType(),True),
                             StructField("score",DoubleType(),True)]
                             ),True), True),
            StructField("column_name", StringType(), True),
            StructField("sample_data", ArrayType(StringType()), True),
        ])

        data_frame = spark.createDataFrame([(None, "", ["Table size is 0"])], empty_df_schema)

    # Add metadata columns to the df
    s3_location, s3_bucket, rds_instance_id = get_table_info(table, args)

    data_frame = data_frame.withColumn('account_id', sf.lit(args['AccountId']))    
    data_frame = data_frame.withColumn('job_id', sf.lit(args['JobId']))
    data_frame = data_frame.withColumn('run_id', sf.lit(args['RunId']))
    data_frame = data_frame.withColumn('run_database_id', sf.lit(args['RunDatabaseId']))
    data_frame = data_frame.withColumn('database_name', sf.lit(args['DatabaseName']))
    data_frame = data_frame.withColumn('database_type', sf.lit(args['DatabaseType']))
    data_frame = data_frame.withColumn('table_name', sf.lit(table['Name']))
    data_frame = data_frame.withColumn('region', sf.lit(region))
    data_frame = data_frame.withColumn('update_time', sf.from_utc_timestamp(sf.current_timestamp(), 'UTC'))
    data_frame = data_frame.withColumn('s3_location', sf.lit(s3_location))
    data_frame = data_frame.withColumn('s3_bucket', sf.lit(s3_bucket))
    data_frame = data_frame.withColumn('rds_instance_id', sf.lit(rds_instance_id))
    data_frame = data_frame.withColumn('privacy', sf.expr('case when identifiers is null then 0 else 1 end'))
    data_frame = data_frame.withColumn('year', sf.year(sf.col('update_time')))
    data_frame = data_frame.withColumn('month', sf.month(sf.col('update_time')))
    data_frame = data_frame.withColumn('day', sf.dayofmonth(sf.col('update_time')))
    data_frame = data_frame.withColumn('sample_data', mask_data_udf('sample_data'))
    data_frame = data_frame.withColumn('table_size', sf.lit(table_size))

    return data_frame
    

def get_tables(_database_name, region, _base_time, args):
    """
    get_tables detects all the crawler tables in one specified database.
    Only the tables updated after the base time will be returned.

    Args:
        _database_name: The database to store all crawler tables.
    
    Returns:
        tables: All the crawler tables.
    """
    glue = boto3.client(service_name='glue', region_name=region)
    tables = []
    if str(args['TableBegin']) == '-1':
        selected_tables = list(filter(None, args['TableName'].split(',')))
        for table_name in selected_tables:
            table = glue.get_table(
                DatabaseName=_database_name,
                Name=table_name
            )
            tables.append(table['Table'])
    else:
        next_token = ""
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
        tables = tables[int(args["TableBegin"]):int(args['TableEnd'])]
    return tables

if __name__ == "__main__":
    """
    The following code is used to get all input arguments while executing this job.
    """

    # Get all input arguments
    region = os.environ['AWS_DEFAULT_REGION']
    s3 = boto3.client(service_name='s3', region_name=region)
    result_database = 'sdps_database'
    result_table = 'job_detection_output_table'

    args = getResolvedOptions(sys.argv, ["AccountId", "JOB_NAME", 'DatabaseName', 'DatabaseType', 'BucketName',
    'Depth', 'DetectionThreshold', 'JobId', 'RunId', 'RunDatabaseId', 'TemplateId', 'TemplateSnapshotNo', 
    'AdminAccountId', 'BaseTime', 'TableBegin', 'TableEnd', 'TableName', 'ExcludeKeywords'])

    full_database_name = f"{args['DatabaseType']}-{args['DatabaseName']}-database"
    output_path = f"s3://{args['BucketName']}/glue-database/{result_table}/"
    error_path = f"s3://{args['BucketName']}/glue-database/job_detection_error_table/"
    base_time = parse(args['BaseTime']).replace(tzinfo=pytz.timezone('UTC'))

    # Create spark and glue context
    sc = SparkContext()
    glueContext = GlueContext(sc)
    spark = glueContext.spark_session
    job = Job(glueContext)
    job.init(args["JOB_NAME"], args)

    output = []
    error = []

    # Get the template from s3 and broadcast it to all the executors
    template = get_template(s3, args['BucketName'], f"template/template-{args['TemplateId']}-{args['TemplateSnapshotNo']}.json")
    broadcast_template = sc.broadcast(template)

    crawler_tables = get_tables(full_database_name, region, base_time, args)

    # Create UDFs
    column_detector = ColumnDetector(broadcast_template, args['ExcludeKeywords'])
    detect_column_udf = column_detector.create_detect_column_udf()

    mask_data_udf = create_mask_data_udf()
    udf_dict = dict()
    udf_dict['detect_column_udf'] = detect_column_udf
    udf_dict['mask_data_udf'] = mask_data_udf

    # The detection result is saved every 10 tables
    save_freq = 10
    num_crawler_tables = len(crawler_tables)
    for table_index, table in enumerate(crawler_tables):
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

        if (table_index + 1) % save_freq == 0 or (table_index + 1) == num_crawler_tables:
            # Save detection result to s3.
            if output:
                df = reduce(DataFrame.unionAll, output)
                df = df.repartition(1, 'year', 'month', 'day')
                # df.show()
                df.write.partitionBy('year', 'month', 'day').mode('append').parquet(output_path)

            # If error in detect_table, save to error_path
            if error:
                df = spark.createDataFrame(error)
                df.withColumn('update_time', sf.from_utc_timestamp(sf.current_timestamp(), 'UTC'))
                df = df.repartition(1)
                df.write.mode('append').parquet(error_path)
            
            output = []
            error = []

    job.commit()
