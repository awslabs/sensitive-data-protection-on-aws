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


region = os.environ['AWS_DEFAULT_REGION']
s3 = boto3.client(service_name='s3', region_name=region)
# catalog_id = boto3.client('sts', region_name=region).get_caller_identity().get('Account')
result_database = 'sdps_database'
result_table = 'job_detection_output_table'

args = getResolvedOptions(sys.argv, ["AccountId", "JOB_NAME", 'DatabaseName', 'BaseTime', 'DatabaseType', 'BucketName',
'Depth', 'DetectionThreshold', 'JobId', 'RunId', 'RunDatabaseId', 'TemplateId', 'TemplateSnapshotNo', 'AdminAccountId'])
admin_account_id = args['AdminAccountId']
account_id = args["AccountId"]
database_name = args["DatabaseName"]
depth = int(args["Depth"])
threshold = float(args['DetectionThreshold'])
base_time = parse(args['BaseTime']).replace(tzinfo=pytz.timezone('Asia/Shanghai'))
database_type = args['DatabaseType']
job_id = args['JobId']
run_id = args['RunId']
run_database_id = args['RunDatabaseId']
full_database_name = f'{database_type}-{database_name}-database'
template_id = args['TemplateId']
template_snapshot_no = args['TemplateSnapshotNo']
bucket_name = args['BucketName']

output_path = f's3://{bucket_name}/glue-database/{result_table}/'
error_path = f's3://{bucket_name}/glue-database/job_detection_error_table/'

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args["JOB_NAME"], args)

output = []
error = []

def get_template(bucket_name, object_name):
    with tempfile.TemporaryFile() as data:
        s3.download_fileobj(bucket_name, object_name, data)
        data.seek(0)
        return json.loads(data.read().decode('utf-8'))

template = get_template(bucket_name, f'template/template-{template_id}-{template_snapshot_no}.json')

broadcast_template = sc.broadcast(template)

def dectect_column(col_val, column_name):
    result = []
    identifiers = broadcast_template.value.get('identifiers')
    # ml_result = []
    ml_result = sdps_ner.predict(str(col_val)).get(str(col_val), [])

    for identifier in identifiers:
        header_keywords = identifier.get('header_keywords', [])
        
        score = 0
        header_has_keyword = False
        if not header_keywords:
            header_has_keyword = True
        else:
            for keyword in header_keywords:
                if re.search(keyword, column_name):
                    header_has_keyword = True
                    break
        if header_has_keyword:
            if identifier['category'] == 1 and identifier['rule']:
                if re.search(identifier['rule'], str(col_val)):
                    score = 1
            elif identifier['category'] == 0:
                for r in ml_result:
                    if r['Identifier'] == identifier['name']:
                        score = r['Score']
        result.append({'identifier': identifier['name'], 'score': float(score)})

    return result

dectect_column_udf = sf.udf(dectect_column, ArrayType(StructType([StructField('identifier', StringType()), StructField('score', FloatType())])))

def sample_data(df, column_name, limit):
    return df.limit(limit).select(sf.collect_list(column_name).alias('sample_data')).collect()[0]['sample_data']

sample_data_udf = sf.udf(sample_data, StringType())

def mask_data(col_val):
    def mask_string(s):
        length = len(s)
        first_30_percent = math.ceil(length * 0.3)
        return s[:first_30_percent] + '*' * (length - first_30_percent)
    return [mask_string(s) for s in col_val]

mask_data_udf = sf.udf(mask_data, ArrayType(StringType()))

def get_table_info(table):
    s3_location = 'NA'
    s3_bucket = 'NA'
    if database_type == 's3':
        s3_location = table['StorageDescriptor']['Location']
        s3_bucket = urlparse(s3_location).netloc
    rds_instance_id = 'NA'
    if database_type == 'rds':
        # rds_instance_id = database_name[4:len(database_name)-9]
        rds_instance_id = database_name
    return s3_location, s3_bucket, rds_instance_id

def detect_table(table):
    df = glueContext.create_data_frame_from_catalog(
        database=full_database_name,
        table_name=table['Name'],
        # catalog_id=catalog_id
    ).limit(depth*10)
    # df = df.withColumn('full_name', sf.concat_ws(' ', 'first_name', 'last_name'))
    rows = df.count()
    sample_rate = 1.0 if rows <= depth else depth/rows
    df = df.sample(sample_rate)
    rows = df.count()
    # print(rows)
    sample_df = df.limit(10)
    # sample_df.show()
    identity_columns = {}
    for column in df.columns:
        identity_columns[column] = column+'_identity_types'
        df = df.withColumn(column+'_identity_types', dectect_column_udf(column, sf.lit(column)))
    
    expr_str = ', '.join([f"'{k}', `{v}`"for k, v in identity_columns.items()])
    expr_str = f"stack({len(identity_columns)}, {expr_str}) as (column_name,identity_types)"
    df = df.select(sf.expr(expr_str))\
        .select('column_name', sf.explode('identity_types'))\
        .select('col.*', '*').groupBy('column_name', 'identifier').agg(sf.sum('score').alias('score'))\
        .withColumn('score', sf.col('score')/rows)\
        .where(f'score > {threshold}')\
        .withColumn('identifier', sf.struct('identifier', 'score'))\
        .groupBy('column_name').agg(sf.collect_list('identifier').alias('identifiers'))
    
    
    expr_str = ', '.join([f"'{c}', cast(`{c}` as string)"for c in sample_df.columns])
    expr_str = f"stack({len(sample_df.columns)}, {expr_str}) as (column_name,sample_data)"
    sample_df = sample_df.select(sf.expr(expr_str)).groupBy('column_name').agg(sf.collect_list('sample_data').alias('sample_data'))
    # df = DynamicFrame.fromDF(df, glue_ctx=glueContext)
    # Script generated for node Detect PII
    # entity_detector = EntityDetector()
    # classified_map = entity_detector.classify_columns(
    #     df,
    #     detect_type.split(','),
    #     1.0,
    #     threshold,
    # )
    # items = classified_map.items()
    # schema = StructType(
    #     [
    #         StructField("columnName", StringType(), True),
    #         StructField(
    #             "entityTypes", StructType([StructField("entityType", StringType(), True)])
    #         ),
    #     ]
    # )
    s3_location, s3_bucket, rds_instance_id = get_table_info(table)
    # data_frame = spark.createDataFrame(data=items, schema=schema)
    data_frame = df
    # data_frame = data_frame.select('columnName', 'entityTypes.entityType')
    # data_frame = data_frame.withColumnRenamed('columnName', 'column_name')
    # data_frame = data_frame.withColumnRenamed('entityType', 'identifier')
    data_frame = data_frame.join(sample_df, data_frame.column_name == sample_df.column_name, 'right')\
        .select(data_frame['identifiers'], sample_df['*'])
    data_frame = data_frame.withColumn('account_id', sf.lit(account_id))    
    data_frame = data_frame.withColumn('job_id', sf.lit(job_id))
    data_frame = data_frame.withColumn('run_id', sf.lit(run_id))
    data_frame = data_frame.withColumn('run_database_id', sf.lit(run_database_id))
    data_frame = data_frame.withColumn('database_name', sf.lit(database_name))
    data_frame = data_frame.withColumn('database_type', sf.lit(database_type))
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
    
    # data_frame.show(100)
    output.append(data_frame)
    

def get_tables(_database_name, _base_time):
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

crawler_tables = get_tables(full_database_name, base_time)
# crawler_tables = [{'Name': 'sakila_customer'}]
for table in crawler_tables:
    try:
        detect_table(table)
    except Exception as e:
        s3_location, s3_bucket, rds_instance_id = get_table_info(table)
        data = {
            'account_id': account_id,
            'region': region,
            'job_id': job_id,
            'run_id': run_id,
            'run_database_id': run_database_id,
            'database_name': database_name,
            'database_type': database_type,
            'table_name': table['Name'],
            's3_location': s3_location,
            's3_bucket': s3_bucket,
            'rds_instance_id': rds_instance_id,
            'error_message': str(e)
        }
        error.append(data)
        print(f'Error occured detecting table {table}')
        print(e)

if output:
    df = reduce(DataFrame.unionAll, output)
    df = df.repartition(1, 'year', 'month', 'day')
    # glueContext.write_data_frame_from_catalog(
    #     frame=df,
    #     database=result_database,
    #     table_name=result_table,
    #     catalog_id=admin_account_id
    # )
    # df.show()
    df.write.partitionBy('year', 'month', 'day').mode('append').parquet(output_path)

if error:
    df = spark.createDataFrame(error)
    df.withColumn('update_time', sf.from_utc_timestamp(sf.current_timestamp(), 'Asia/Shanghai'))
    df = df.repartition(1)
    df.write.mode('append').parquet(error_path)

job.commit()
