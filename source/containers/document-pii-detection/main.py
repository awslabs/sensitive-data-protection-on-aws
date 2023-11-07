import json
import boto3
import os
import sys
import pandas as pd
import re
import argparse
import copy
import logging
import tempfile
import pathlib
from collections import defaultdict

from parser_factory import ParserFactory

def remove_symbols(input_string):
    # Define the pattern to match symbols
    symbol_pattern = r'\W'

    # Remove symbols using regular expression substitution
    output_string = re.sub(symbol_pattern, '_', input_string)

    return output_string

def group_files_by_extension(sample_files):
    """
    Group files by extension.

    :param sample_files: list of sample files

    """
    sample_file_extension_dict = defaultdict(list)
    for sample_file in sample_files:
        sample_file_extension = pathlib.Path(sample_file).suffix
        sample_file_extension_dict[sample_file_extension].append(sample_file)
    return sample_file_extension_dict

def get_previous_tables(glue_client, database_name):

    tables = []

    next_token = ""
    while True:
        response = glue_client.get_tables(
            DatabaseName=database_name,
            NextToken=next_token
        )
        for table in response.get('TableList', []):
            if table.get('Parameters', {}).get('classification', '') != 'UNKNOWN':
                tables.append(table)
        next_token = response.get('NextToken')
        if not next_token:
            break

    return tables


def organize_table_info(table_name, result_bucket_name, original_bucket_name, file_info, columns, file_category):

    description = json.dumps(file_info, ensure_ascii=False)
    s3_location = f"s3://{result_bucket_name}/parser_results/{table_name}/"
    input_format = 'org.apache.hadoop.mapred.TextInputFormat'
    output_format = 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
    table_type = 'EXTERNAL_TABLE'
    serde_info = {'SerializationLibrary': 'org.apache.hadoop.hive.serde2.OpenCSVSerde',
                'Parameters': {'field.delim': ','}}
    parameters = {'originalFileBucketName': original_bucket_name,
                  'originalFileType': file_info['file_type'],
                  'originalFilePath': file_info['file_path'],
                  'originalFileSample': json.dumps(file_info['sample_files'], ensure_ascii=False),
                  'originalFileCategory': file_category,
                  'sizeKey': str(file_info['total_file_size']),
                  'objectCount': str(file_info['total_file_count']),
                  'Unstructured': 'true',
                  'classification': 'csv'}
    glue_table_columns = [{'Name': 'index', 'Type': 'string'}]
    for column in columns:
        glue_table_columns.append({'Name': column, 'Type': 'string'})
    
    glue_table_info = {
        'Name': table_name,
        'Description': description,
        'StorageDescriptor': {
            'Columns': glue_table_columns,
            'Location': s3_location,
            'InputFormat': input_format,
            'OutputFormat': output_format,
            'SerdeInfo': serde_info,
            'Parameters': parameters
        },
        'PartitionKeys': [],
        'TableType': table_type,
        'Parameters': parameters
    }
    return glue_table_info

def batch_process_files(s3_client, bucket_name, file_info, file_category):
    """
    Batch process files in a folder with the same schema.

    :param bucket_name: S3 bucket name
    :param file_info: file info

    Sample file_info:
    {
        "file_type": ".jpeg",
        "file_path": "test_images/human_faces",
        "sample_files": [
            "1"
        ]
    }

    """
    file_contents = {}

    file_type = file_info['file_type']
    file_path = file_info['file_path']
    sample_files = file_info['sample_files']

    if file_category == 'detection_files':

        grouped_sample_files = group_files_by_extension(sample_files)

        for sample_file_extension, sample_file_extension_files in grouped_sample_files.items():
        
            parser = ParserFactory.create_parser(file_type=sample_file_extension, s3_client=s3_client)

            for sample_file in sample_file_extension_files:
                object_key = f"{file_path}/{sample_file}"
                file_content = parser.load_content(bucket_name, object_key)
                sample_file_name_no_symbol = remove_symbols(sample_file)
                file_contents[f"{sample_file_name_no_symbol}"] = file_content

    elif file_category == 'include_files':
        for sample_file in sample_files:
            sample_file_name_no_symbol = remove_symbols(sample_file)
            file_contents[f"{sample_file_name_no_symbol}"] = ['This file is marked as Contains-PII.']
    
    elif file_category == 'exclude_files':
        for sample_file in sample_files:
            sample_file_name_no_symbol = remove_symbols(sample_file)
            file_contents[f"{sample_file_name_no_symbol}"] = ['This file is marked as Non-PII.']
            
    return file_contents

def process_file(parser, bucket_name, object_key):
    """
    Process a single file.
    """
    file_content = parser.load_content(bucket_name, object_key)

    json_format_content = {}
    json_format_content[f"{object_key}"] = file_content
    
    return json_format_content

def create_glue_table(glue_client, database_name, table_name, glue_table_info):

    # Check if table exists
    try:
        response = glue_client.get_table(
            DatabaseName=database_name,
            Name=table_name
        )
        print(f"Table '{table_name}' exists in database '{database_name}'. Updating table...")
        response = glue_client.update_table(
            DatabaseName=database_name,
            TableInput=glue_table_info
        )
    except glue_client.exceptions.EntityNotFoundException:
        print(f"Table '{table_name}' does not exist in database '{database_name}'. Creating table...")
        response = glue_client.create_table(
            DatabaseName=database_name,
            TableInput=glue_table_info
        )

    print(response)

def main(param_dict):
    original_bucket_name = param_dict['SourceBucketName']
    crawler_result_bucket_name = param_dict['ResultBucketName']
    region_name = param_dict['RegionName']

    crawler_result_object_key = f"crawler_results/{original_bucket_name}_info.json"
    destination_database = f"SDPS-unstructured-{original_bucket_name}"

    s3_client = boto3.client('s3', region_name = region_name)
    glue_client = boto3.client('glue', region_name = region_name)

    # 1. Create a Glue Database
    try:
        response = glue_client.create_database(
            DatabaseInput={
                'Name': destination_database
            }
        )
    except glue_client.exceptions.AlreadyExistsException:
        print(f"Database '{destination_database}' already exists. Skipping database creation...")
        # Need to delete previous created tables
        print(f"Deleting all tables in database '{destination_database}'...")
        previous_tables = get_previous_tables(glue_client, destination_database)
        for table in previous_tables:
            response = glue_client.delete_table(
                DatabaseName=destination_database,
                Name=table['Name']
            )
        print(f"Deleted all tables in database '{destination_database}'. Start creating tables...")

    # 2. Download the crawler result from S3 and 
    with tempfile.NamedTemporaryFile(mode='w') as temp:
        temp_file_path = temp.name
        s3_client.download_file(Bucket=crawler_result_bucket_name, Key=crawler_result_object_key, Filename=temp_file_path)
        with open(temp_file_path, 'r') as f:
            bucket_info = json.load(f)


    
    # 4. Batch process files in same folder with same type
    original_file_bucket_name = bucket_info['bucket_name']
    for file_category in ['detection_files', 'include_files', 'exclude_files']:
        files = bucket_info[file_category]
        for file_path, file_info in files.items():
            print(f"Processing {file_path}...")
            file_contents = batch_process_files(s3_client, original_file_bucket_name, file_info, file_category)

            # convert file_contents to dataframe
            df = pd.DataFrame.from_dict(file_contents, orient='index')
            df = df.transpose()
            columns = df.columns.tolist()

            # dump file_info into string and encode in base64 as filename
            table_name = file_path.replace('/', '_')
            table_name = table_name.replace('.', '_')
            table_name = original_file_bucket_name + '_' + table_name

            # save to csv and upload to s3
            with tempfile.NamedTemporaryFile(mode='w') as temp:
                csv_file_path = temp.name
                df.to_csv(csv_file_path, header=False)
                s3_client.upload_file(csv_file_path, crawler_result_bucket_name, f"parser_results/{table_name}/result.csv")

            glue_table_info = organize_table_info(table_name, crawler_result_bucket_name, original_file_bucket_name, file_info, columns, file_category)
            create_glue_table(glue_client, destination_database, table_name, glue_table_info)

    
if __name__ == '__main__':
    parser = argparse.ArgumentParser(...)
    parser.add_argument('--SourceBucketName', type=str, default='icyxu-glue-assets-member-a',
                        help='crawler_result_bucket_name')
    parser.add_argument('--ResultBucketName', type=str, default='icyxu-glue-assets-member-a',
                        help='crawler_result_bucket_name')
    parser.add_argument('--RegionName', type=str, default='us-west-2',
                        help='crawler_result_object_key')

    args, _ = parser.parse_known_args()
    param_dict = copy.copy(vars(args))
    
    main(param_dict)
