import os
import json
import boto3
import pathlib
import random
import datetime

"""
sample_crawler_result = {
    "path_to_files_jpg": {
        "file_type": "jpg",
        "file_path": "path_to_files",
        "sample_files": [
            "file_1",
            "file_2",
            "file_3"
        ]
    }
}
"""

supported_text_types = [".doc", ".docx", ".pdf", ".eml", ".htm", ".html", ".txt", ".gz"]
suported_image_types = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif"]

def extract_file_details(file_path: str):
    """
    Extracts the file details (suffix, basename, parent) from the file path.
    """
    pathlib_path = pathlib.Path(file_path)
    file_suffix, file_basename, file_parent = pathlib_path.suffix, pathlib_path.stem, pathlib_path.parent
    return file_suffix, file_basename, str(file_parent)

def add_file_to_dict(files_dict, file_parent, file_suffix, file_basename):
    file_key = f"{file_parent}/*{file_suffix}"
    if file_key not in files_dict:
        files_dict[file_key] = {
            "file_type": file_suffix,
            "file_path": file_parent,
            "sample_files": []
        }
    files_dict[file_key]["sample_files"].append(file_basename)
    return files_dict

def update_dict_files(files_dict, page_files_dict):
    for key, value in page_files_dict.items():
        if files_dict.get(key):
            files_dict[key]["sample_files"].extend(value["sample_files"])
        else:
            files_dict[key] = value
    return files_dict

def summarize_page(page, supported_types, include_file_extensions, exclude_file_extensions):
    """
    Summarizes the page and adds the files to the respective dict.
    """
    page_detection_files, page_include_files, page_exclude_files = {}, {}, {}
    for obj in page['Contents']:
        file_path = obj['Key']
        file_suffix, file_basename, file_parent = extract_file_details(file_path)
        # print(file_suffix, file_basename, file_parent)
        if file_suffix in include_file_extensions:
            add_file_to_dict(page_include_files, file_parent, file_suffix, file_basename)
        elif file_suffix in exclude_file_extensions:
            add_file_to_dict(page_exclude_files, file_parent, file_suffix, file_basename)
        elif file_suffix in supported_types:
            add_file_to_dict(page_detection_files, file_parent, file_suffix, file_basename)
    return page_detection_files, page_include_files, page_exclude_files

def postprocess_crawler_result(crawler_result, scan_depth):
    """
    Postprocesses the crawler result and returns the crawler result.
    """
    for key, value in crawler_result.items():
        sample_size = scan_depth if scan_depth < len(value["sample_files"]) else len(value["sample_files"])
        if len(value["sample_files"]) > sample_size:
            value["sample_files"] = random.sample(value["sample_files"], sample_size)
    return crawler_result

def list_s3_objects(s3_client, bucket_name, scan_depth, include_file_extensions, exclude_file_extensions, prefix=''):
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
    detection_files, include_files, exclude_files = {}, {}, {}
    paginator = s3_client.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket_name, Prefix=prefix, PaginationConfig={'PageSize': 1000})

    supported_types = []
    for file_extension in supported_text_types + suported_image_types:
        supported_types.append(file_extension)

    # iterate over pages
    for page in pages:
        # loop through objects in page
        if 'Contents' in page:
            page_detection_files, page_include_files, page_exclude_files = summarize_page(page, supported_types, include_file_extensions, exclude_file_extensions)
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

def upload_bucket_info(s3_client, bucket_info, source_bucket_name, result_bucket_name, prefix=''):
    # dump json format content to a file and save to s3
    json_file_path = '/tmp/json_file.json'
    with open(json_file_path, 'w') as json_file:
        json.dump(bucket_info, json_file, ensure_ascii=False)
    s3_client.upload_file(json_file_path, result_bucket_name, f"{prefix}/{source_bucket_name}_info.json")

    # delete the tmp file
    os.remove(json_file_path)


def lambda_handler(event, context):
    # print(event)
    source_bucket_name = event['SourceBucketName']
    result_bucket_name = event['ResultBucketName']
    scan_depth = int(event['ScanDepth'])
    include_file_extensions = event['IncludeFileExtensions']
    exclude_file_extensions = event['ExcludeFileExtensions']
    s3 = boto3.client('s3')

    bucket_info = list_s3_objects(s3, source_bucket_name, scan_depth, include_file_extensions, exclude_file_extensions)
    upload_bucket_info(s3, bucket_info, source_bucket_name, result_bucket_name=result_bucket_name, prefix="crawler_results")


    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Detection Finished"
        }),
    }