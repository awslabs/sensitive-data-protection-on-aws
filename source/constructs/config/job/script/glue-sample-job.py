import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
import boto3
from dateutil.parser import parse
import pytz
import pyspark.sql.functions as sf
from pyspark.sql import DataFrame
from functools import reduce
import os


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
    result_table = 'job_detection_output_table'


    sc = SparkContext()
    glueContext = GlueContext(sc)
    spark = glueContext.spark_session
    print(spark)
    args = getResolvedOptions(sys.argv, ["JobName", "DatabaseType", "DatabaseName", "BaseTime", "Depth"])
    print(args)

    full_database_name = f"{args['DatabaseType']}-{args['DatabaseName']}-database"
    # output_path = f"s3://{args['BucketName']}/glue-database/{result_table}/"
    # error_path = f"s3://{args['BucketName']}/glue-database/job_detection_error_table/"
    base_time = parse(args['BaseTime']).replace(tzinfo=pytz.timezone('UTC'))

    job = Job(glueContext)
    job.init(args["JobName"], args)

    output = []
    error = []
    crawler_tables = get_tables(full_database_name, region, base_time)
    udf_dict = dict()
    save_freq = 10
    num_crawler_tables = len(crawler_tables)
    for table_index, table in enumerate(crawler_tables):
        try:
            raw_df = glueContext.create_data_frame_from_catalog(
                database=full_database_name,
                table_name=table['Name']
            )
            print(raw_df)
            table_size = raw_df.count()
            if table_size > 0:
                if args['Depth'].isdigit() and args['Depth'] != '1':
                    depth = int(args['Depth'])
                    raw_df = raw_df.limit(depth * 10)
                    rows = raw_df.count()
                    sample_rate = 1.0 if rows <= depth else depth / rows
                else:
                    sample_rate = float(args['Depth'])
                print(sample_rate)
                raw_df = raw_df.sample(sample_rate)
                print(raw_df)
                sample_df = raw_df.limit(10)
                print(sample_df)
                # sample_df.show()
                expr_str = ', '.join([f"'{c}', cast(`{c}` as string)" for c in sample_df.columns])
                print(expr_str)
                expr_str = f"stack({len(sample_df.columns)}, {expr_str}) as (column_name,sample_data)"
                print(expr_str)
                sample_df = sample_df.select(sf.expr(expr_str)).groupBy('column_name').agg(
                    sf.collect_list('sample_data').alias('sample_data'))
                print(sample_df)
                output.append(sample_df)
            elif table_size == 0:
                print("")
            print(output)
        except Exception as e:
            error.append(None)
            print(f'Error occured detecting table {table}')
            print(e)

        # if (table_index + 1) % save_freq == 0 or (table_index + 1) == num_crawler_tables:
        #     # Save detection result to s3.
        #     if output:
        #         df = reduce(DataFrame.unionAll, output)
        #         df = df.repartition(1, 'year', 'month', 'day')
        #         # df.show()
        #         df.write.partitionBy('year', 'month', 'day').mode('append').parquet(output_path)
        #
        #     # If error in detect_table, save to error_path
        #     if error:
        #         df = spark.createDataFrame(error)
        #         df.withColumn('update_time', sf.from_utc_timestamp(sf.current_timestamp(), 'UTC'))
        #         df = df.repartition(1)
        #         df.write.mode('append').parquet(error_path)
        #
        #     output = []
        #     error = []

    job.commit()
