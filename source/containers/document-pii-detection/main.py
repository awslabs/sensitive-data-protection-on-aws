import argparse
import copy
import json
import pathlib
import re
import tempfile
from collections import defaultdict
from multiprocessing import Process, Queue, Lock

import boto3
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import psutil

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


def split_dictionary(raw_dictionary, chunk_size=100):
    keys = list(raw_dictionary.keys())
    total_items = len(keys)
    num_chunks = (total_items + chunk_size - 1) // chunk_size

    split_dictionaries = []
    for i in range(num_chunks):
        start_index = i * chunk_size
        end_index = (i + 1) * chunk_size
        chunk_keys = keys[start_index:end_index]
        chunk_dict = {key: raw_dictionary[key] for key in chunk_keys}
        split_dictionaries.append(chunk_dict)

    return split_dictionaries


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


def organize_table_info(table_name, result_bucket_name, original_bucket_name, file_info, columns, file_category,
                        split_file_content_id):
    simplified_file_info = copy.deepcopy(file_info)
    simplified_file_info['sample_files'] = simplified_file_info['sample_files'][:10]
    description = json.dumps(simplified_file_info, ensure_ascii=False)
    s3_location = f"s3://{result_bucket_name}/parser_results/{table_name}/"
    input_format = 'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'
    output_format = 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
    table_type = 'EXTERNAL_TABLE'
    serde_info = {'SerializationLibrary': 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'}
    parameters = {'originalFileBucketName': original_bucket_name,
                  'originalFileType': file_info['file_type'],
                  'originalFilePath': file_info['file_path'],
                  'originalFileSample': json.dumps(file_info['sample_files'], ensure_ascii=False),
                  'originalFileCategory': file_category,
                  'sizeKey': str(file_info['total_file_size']),
                  'objectCount': str(file_info['total_file_count']),
                  'Unstructured': 'false',
                  'classification': 'parquet',
                  'splitFileContentId': str(split_file_content_id)}
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
        "file_type": "image",
        "file_path": "test_images/business_license",
        "total_file_size": 421226,
        "total_file_count": 1,
        "sample_files": [
            "工商营业执照.jpg"
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
                object_key = f"{file_path}/{sample_file}" if file_path != '.' else sample_file
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


# Worker function to process a detection_files item
def worker(queue,
           lock,
           crawler_result_bucket_name,
           destination_database,
           original_file_bucket_name):
    while not queue.empty():
        with lock:
            item = queue.get()
            if item is None:
                break

        glue_client = boto3.client('glue', region_name='cn-northwest-1')
        s3_client = boto3.client('s3', region_name='cn-northwest-1')
        file_category = item[0]
        file = item[1]
        file_path = file[0]
        file_info = file[1]
        try:
            print('Worker is processing... ' + file_path)
            file_contents = batch_process_files(s3_client, original_file_bucket_name, file_info, file_category)
            # print(file_contents)
            # split file_contents into several dictionaries, with which contain 100 files at most
            split_file_contents_list = split_dictionary(file_contents, chunk_size=100)
            len_split_file_contents_list = len(split_file_contents_list)
            for split_file_content_id, split_file_contents in enumerate(split_file_contents_list):
                # convert file_contents to dataframe
                df = pd.DataFrame.from_dict(split_file_contents, orient='index')
                df = df.transpose()
                columns = df.columns.tolist()

                # dump file_info into string and encode in base64 as filename
                file_path = file_path.lstrip('./')
                file_path_process_list = file_path.split('/')
                if len_split_file_contents_list > 1:
                    file_path_process_list = file_path_process_list[:-1] + [
                        f"part{str(split_file_content_id)}"] + file_path_process_list[-1:]

                table_name = '_'.join(file_path_process_list)

                table_name = table_name.replace('.', '_')
                table_name = original_file_bucket_name + '_' + table_name

                # Convert the DataFrame to a PyArrow Table
                table = pa.Table.from_pandas(df)

                # Create a PyArrow Writer for Parquet format without compression
                sink = pa.BufferOutputStream()
                writer = pq.ParquetWriter(sink, table.schema)

                # Write the PyArrow Table to the buffer
                writer.write_table(table)

                # Close the writer
                writer.close()

                # Get the uncompressed in-memory Parquet data as bytes
                parquet_bytes = sink.getvalue().to_pybytes()

                # Upload the uncompressed Parquet data to S3
                s3_client.put_object(
                    Body=parquet_bytes,
                    Bucket=crawler_result_bucket_name,
                    Key=f"parser_results/{table_name}/result.parquet"
                )

                glue_table_info = organize_table_info(table_name, crawler_result_bucket_name,
                                                      original_file_bucket_name, file_info, columns, file_category,
                                                      split_file_content_id)
                create_glue_table(glue_client, destination_database, table_name, glue_table_info)

        except Exception as e:
            print(f"Error occured processing {file_path}. Error message: {e}")
        # print_system_usage()
        print('Worker is finished on ' + file_path)


def main(param_dict):
    original_bucket_name = 'yiyan-test-s6-100partition'  # param_dict['SourceBucketName']
    crawler_result_bucket_name = 'sdps-agent-agents3bucket37b73ecb-veydzutbtwma'  # param_dict['ResultBucketName']
    region_name = 'cn-northwest-1'  # param_dict['RegionName']
    worker_num = psutil.cpu_count(logical=False)  # param_dict['WorkerNum']
    print('worker_num:' + str(worker_num))
    crawler_result_object_key = f"crawler_results/{original_bucket_name}_info.json"
    destination_database = f"SDPS-unstructured-{original_bucket_name}"

    s3_client = boto3.client('s3', region_name='cn-northwest-1')
    glue_client = boto3.client('glue', region_name='cn-northwest-1')
    print('++++++++++++')
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

        response = glue_client.delete_database(Name=destination_database)
        response = glue_client.create_database(
            DatabaseInput={
                'Name': destination_database
            }
        )
        print(f"Re-created database '{destination_database}'")

    # 2. Download the crawler result from S3 and
    with tempfile.NamedTemporaryFile(mode='w') as temp:
        temp_file_path = temp.name
        print('crawler_result_bucket_name:' + crawler_result_bucket_name)
        print('crawler_result_object_key:' + crawler_result_object_key)
        s3_client.download_file(Bucket=crawler_result_bucket_name, Key=crawler_result_object_key,
                                Filename=temp_file_path)
        with open(temp_file_path, 'r') as f:
            bucket_info = json.load(f)

    # 4. Batch process files in same folder with same type
    queue = Queue()
    lock = Lock()

    original_file_bucket_name = bucket_info['bucket_name']
    num_items = 0
    for file_category in ['detection_files', 'include_files', 'exclude_files']:
        for files in bucket_info[file_category].items():
            queue.put((file_category, files))
            num_items += 1

    processes = []
    # Create up to X processes
    worker_num = min(worker_num, num_items)
    for _ in range(worker_num):
        p = Process(
            target=worker,
            args=(
                queue,
                lock,
                crawler_result_bucket_name,
                destination_database,
                original_file_bucket_name
            )
        )
        processes.append(p)
        p.start()

    # Add None to the queue to signal workers to exit
    for _ in range(worker_num):
        queue.put(None)

    # Wait for all worker processes to finish
    for p in processes:
        p.join()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(...)
    parser.add_argument('--SourceBucketName', type=str, default='icyxu-glue-assets-member-a',
                        help='crawler_result_bucket_name')
    parser.add_argument('--ResultBucketName', type=str, default='icyxu-glue-assets-member-a',
                        help='crawler_result_bucket_name')
    parser.add_argument('--RegionName', type=str, default='us-west-2',
                        help='crawler_result_object_key')
    parser.add_argument('--WorkerNum', type=int, default=10,
                        help='worker_num')

    args, _ = parser.parse_known_args()
    param_dict = copy.copy(vars(args))

    main(param_dict)
#
