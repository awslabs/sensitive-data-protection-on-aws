import json
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
import boto3
from dateutil.parser import parse
import pytz
from pyspark.sql import DataFrame
from functools import reduce
import os
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(filename)s %(funcName)s() L%(lineno)-4d %(message)s')

def get_tables(_database_name, region, _base_time):
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
    region = os.environ['AWS_DEFAULT_REGION']
    s3 = boto3.client(service_name='s3', region_name=region)
    result_database = 'sdps_database'
    result_table = 'job_sample_output_table'


    sc = SparkContext()
    glueContext = GlueContext(sc)
    spark = glueContext.spark_session
    args = getResolvedOptions(sys.argv, ["JobName", "DatabaseType", "JobId", "RunId", "Limit",
                                         "DatabaseName", "TableName", "BaseTime", "Depth", "BucketName"])
    logging.info(args)

    full_database_name = f"{args['DatabaseType']}-{args['DatabaseName']}-database"
    output_path = f"s3://{args['BucketName']}/glue-database/{result_table}/"
    base_time = parse(args['BaseTime']).replace(tzinfo=pytz.timezone('UTC'))

    job = Job(glueContext)
    job.init(args["JobName"], args)

    output = []
    error = []
    crawler_tables = get_tables(full_database_name, region, base_time)
    udf_dict = dict()
    limit_count = 1000
    if args["Limit"]:
        limit_count = args["Limit"]
    table_name = args['TableName']
    num_crawler_tables = len(crawler_tables)
    for table_index, table in enumerate(crawler_tables):
        if table['Name'] != table_name and table_name is not None:
            continue
        try:
            raw_df = glueContext.create_data_frame_from_catalog(
                database=full_database_name,
                table_name=table['Name']
            )
            logging.info(table['Name'])
            table_size = raw_df.count()
            logging.info(table_size)
            if table_size > 0:
                if args['Depth'].isdigit() and args['Depth'] != '1':
                    depth = int(args['Depth'])
                    raw_df = raw_df.limit(depth * 10)
                    rows = raw_df.count()
                    sample_rate = 1.0 if rows <= depth else depth / rows
                else:
                    sample_rate = float(args['Depth'])
                logging.info(sample_rate)
                raw_df = raw_df.sample(sample_rate)
                logging.info(raw_df)
                sample_df = raw_df.limit(200)
                logging.info(sample_df)
                output.append(sample_df)
            logging.info(output)
        except Exception as e:
            error.append(None)
            logging.info(f'Error occured detecting table {table}')
            logging.info(e)
        if output:
            s3 = boto3.client('s3')
            """ :type : pyboto3.s3 """
            file_folder_path = f"glue-database/{result_table}/{full_database_name}/{table_name}/"
            # 获取文件夹中的所有对象
            response = s3.list_objects_v2(Bucket=args['BucketName'],
                                          Prefix=file_folder_path)
            logging.info(response)
            if 'Contents' in response and response['Contents']:
                # 提取文件路径
                file_paths = [obj['Key'] for obj in response['Contents']]
                logging.info(file_paths)
                # 打印文件路径
                for file_path in file_paths:
                    key = file_folder_path + file_path
                    logging.info(key)
                    response = s3.delete_object(Bucket=args['BucketName'],
                                                Key=key)
                    logging.info(response)

            df = reduce(DataFrame.unionAll, output)
            output_file_path = f"{output_path}{full_database_name}/{table_name}/"
            df.write.csv(output_file_path, header=True, mode="overwrite")
    job.commit()
