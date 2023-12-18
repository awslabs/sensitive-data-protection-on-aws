import os
import json
import boto3
import pathlib
import random
import datetime
from tempfile import NamedTemporaryFile
from dateutil.parser import parse
from datetime import timezone

"""
sample_crawler_result = {
    "path_to_files_document": {
        "file_type": "document",
        "file_path": "path_to_files",
        "sample_files": [
            "file_1",
            "file_2",
            "file_3"
        ]
    }
}
"""

supported_file_types = {
    "document": [".docx", ".pdf"],
    "webpage": [".htm", ".html"],
    "email": [".eml"],
    "code": [".java", ".py", ".cpp", ".c", ".h", ".css", ".js", ".php", ".rb", ".swift", ".go", ".sql"],
    "text": [".txt", ".md", ".log"],
    "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif"]
}

s3_client = boto3.client('s3')

def get_file_type_from_extension(file_extension):
    for file_type, file_extensions in supported_file_types.items():
        if file_extension.lower() in file_extensions:
            return file_type
    return file_type.lstrip(".")

def split_s3_path(s3_path, max_folder_depth=5):
    """
    Splits the s3 path into parent directories and remaining path.
    
    Args:
        s3_path: s3 path of the file
    
    Returns:
        parent_directories: first 5 parent directories
        remaining_path: remaining path
    """
    # Split the path into individual directories
    directories = s3_path.split("/")

    parent_directories = "/".join(directories[:max_folder_depth])
    remaining_path = "/".join(directories[max_folder_depth:])

    remaining_path = f"{remaining_path}/" if remaining_path else ""

    return parent_directories, remaining_path

def extract_file_details(file_path: str):
    """
    Extracts the file details (extension, basename, parent) from the file path.
    """
    pathlib_path = pathlib.Path(file_path)
    file_extension, file_basename, file_parent = pathlib_path.suffix, pathlib_path.stem, pathlib_path.parent
    return file_extension, file_basename, str(file_parent)

def add_file_to_dict(files_dict, file_parent, file_extension, file_basename, file_size, mode = "detect"):

    parent_directories, remaining_path = split_s3_path(file_parent)
    file_type = get_file_type_from_extension(file_extension)
    file_key = f"{parent_directories}/{file_type}_{mode}"
    if file_key not in files_dict:
        files_dict[file_key] = {
            "file_type": file_type,
            "file_path": parent_directories,
            "total_file_size": 0,
            "total_file_count": 0,
            "sample_files": []
        }
    files_dict[file_key]["sample_files"].append(f"{remaining_path}{file_basename}{file_extension}")
    files_dict[file_key]["total_file_size"] += file_size
    files_dict[file_key]["total_file_count"] += 1

    return files_dict

def update_dict_files(files_dict, page_files_dict):
    for current_path, current_path_info in page_files_dict.items():
        # If key exists, check if the file is already detected
        if files_dict.get(current_path):
            files_dict[current_path]["sample_files"].extend(current_path_info["sample_files"])
        # If path&file does not exist, add files and sample files
        else:
            files_dict[current_path] = current_path_info

    return files_dict

def summarize_page(page, supported_types, include_file_extensions, exclude_file_extensions, base_time):
    """
    Summarizes the page and adds the files to the respective dict.
    """
    page_detection_files, page_include_files, page_exclude_files = {}, {}, {}
    for obj in page['Contents']:
        file_path = obj['Key']
        # obj["LastModified"] is already in UTC
        last_modified_date = obj["LastModified"]
        file_size = obj["Size"]
        file_extension, file_basename, file_parent = extract_file_details(file_path)
        if not file_extension or last_modified_date < base_time:
            continue
        elif file_extension.lower() in include_file_extensions:
            add_file_to_dict(page_include_files, file_parent, file_extension, file_basename, file_size, mode = "include")
        elif file_extension.lower() in exclude_file_extensions:
            add_file_to_dict(page_exclude_files, file_parent, file_extension, file_basename, file_size, mode = "exclude")
        elif file_extension.lower() in supported_types:
            add_file_to_dict(page_detection_files, file_parent, file_extension, file_basename, file_size, mode = "detect")
    return page_detection_files, page_include_files, page_exclude_files

def postprocess_crawler_result(crawler_result, scan_depth):
    """
    Postprocesses the crawler result and returns the crawler result.
    """
    for key, value in crawler_result.items():
        # Perform sampling only when scan_depth > 0, because scan_depth = -1 means no sampling
        if scan_depth > 0:
            sample_size = scan_depth if scan_depth < len(value["sample_files"]) else len(value["sample_files"])
            if len(value["sample_files"]) > sample_size:
                value["sample_files"] = random.sample(value["sample_files"], sample_size)
    return crawler_result

def list_s3_objects(bucket_name, scan_depth, include_file_extensions, 
                    exclude_file_extensions, base_time, prefix=''):
    """
    Lists the objects in the s3 bucket and returns the crawler result.
    
    Args:
        s3_client: boto3 s3 client
        bucket_name: name of the s3 bucket
        scan_depth: number of files to be scanned
        include_file_extensions: list of file extensions to be included in the scan
        exclude_file_extensions: list of file extensions to be excluded in the scan
        prefix: prefix of the s3 bucket
    """
    bucket_info = {}

    paginator = s3_client.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket_name, Prefix=prefix, PaginationConfig={'PageSize': 1000})

    supported_types = []
    for file_type, file_extensiones in supported_file_types.items():
        supported_types.extend(file_extensiones)
    
    detection_files, include_files, exclude_files = {}, {}, {}

    # iterate over pages
    for page in pages:
        # loop through objects in page
        if 'Contents' in page:
            page_detection_files, page_include_files, page_exclude_files = summarize_page(page, 
                supported_types, include_file_extensions, exclude_file_extensions, base_time)
            detection_files = update_dict_files(detection_files, page_detection_files)
            include_files = update_dict_files(include_files, page_include_files)
            exclude_files = update_dict_files(exclude_files, page_exclude_files)

    detection_files = postprocess_crawler_result(detection_files, scan_depth)
    include_files = postprocess_crawler_result(include_files, scan_depth)
    exclude_files = postprocess_crawler_result(exclude_files, scan_depth)

    # Get the current UTC time
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    utc_string = now_utc.strftime('%Y-%m-%d %H:%M:%S.%f %Z')

    bucket_info['bucket_name'] = bucket_name
    bucket_info['last_updated_time'] = utc_string
    bucket_info['detection_files'] = detection_files
    bucket_info['include_files'] = include_files
    bucket_info['exclude_files'] = exclude_files
    bucket_info['include_file_extensions'] = include_file_extensions
    bucket_info['exclude_file_extensions'] = exclude_file_extensions

    return bucket_info

def upload_bucket_info(bucket_info, source_bucket_name, result_bucket_name, result_prefix=''):
    # dump json format content to a file and save to s3
    json_file_path = NamedTemporaryFile().name
    with open(json_file_path, 'w') as json_file:
        json.dump(bucket_info, json_file, ensure_ascii=False)
    s3_client.upload_file(json_file_path, result_bucket_name, f"{result_prefix}/{source_bucket_name}_info.json")

    os.remove(json_file_path)


def lambda_handler(event, context):
    # print(event)
    source_bucket_name = event['SourceBucketName']
    result_bucket_name = event['ResultBucketName']
    scan_depth = int(event['ScanDepth'])
    include_file_extensions = event['IncludeFileExtensions']
    exclude_file_extensions = event['ExcludeFileExtensions']

    base_time_str = event.get('BaseTime', '1970-01-01 00:00:00')
    base_time = parse(base_time_str).replace(tzinfo=timezone.utc)
    
    bucket_info = list_s3_objects(source_bucket_name, scan_depth, 
                                  include_file_extensions, exclude_file_extensions, base_time)
    upload_bucket_info(bucket_info, source_bucket_name, result_bucket_name=result_bucket_name, result_prefix="crawler_results")


    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Detection Finished"
        }),
    }