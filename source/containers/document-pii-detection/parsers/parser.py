import os
import re
from tempfile import NamedTemporaryFile

import boto3
import magic


def merge_strings(substrings, delimiter=".", max_length=128, truncate_buffer=False):
    """
    Merges a list of strings into a list of strings with a maximum length.

    Args:
        substrings: a list of strings to be merged.
        delimiter: the delimiter to be used to merge the strings.
        max_length: the maximum length of the merged string.

    Returns:
        merged_strings: a list of strings with a maximum length.

    Note:
        if a substring in original substrings is longer than max_length, it will still be in merged substrings.
    """
    merged_strings = []
    buffer = ""
    for substring in substrings:
        if len(buffer + delimiter + substring) > max_length:
            buffer = buffer[:max_length] if truncate_buffer else buffer
            merged_strings.append(buffer)
            buffer = substring
        else:
            buffer = buffer + delimiter + substring if buffer else substring
    if buffer:
        buffer = buffer[:max_length] if truncate_buffer else buffer
        merged_strings.append(buffer)
    return merged_strings


class BaseParser:
    def __init__(self, s3_client):
        # constructor code here
        # self.region = region
        self.s3_client = s3_client
        pass

    def parse_file(self, file_path, **kwargs):
        """This method must be overwritten by child classes to extract raw
        text from a file path.
        """
        raise NotImplementedError("must be overwritten by child classes")

    def load_content(self, bucket, object_key):
        """
        Downloads the file from S3.

        # Create a temporary file
        with NamedTemporaryFile() as temp_file:
            self.s3_client.download_file(Bucket=bucket, Key=object_key, Filename=temp_file.name)
            file_path = temp_file.name

            try:
                file_content = self.parse_file(file_path)
            except Exception as e:
                print(f"Failed to parse file {object_key}. Error: {e}")
                file_content = []
            processed_content = self.postprocess_content(file_content)
        """
        # begin download obj into memory
        s3 = boto3.resource("s3", region_name=self.s3_client.meta.region_name)
        obj = s3.Object(bucket, object_key).get()

        try:
            file_content = self.parse_file(obj["Body"].read())
        except Exception as e:
            print(f"Failed to parse file {object_key}. Error: {e}")
            file_content = []
        processed_content = self.postprocess_content(file_content)
        # end download obj into memory

        return processed_content

    def postprocess_content(self, file_content):
        """
        For each item in content, if size is bigger than 128, split it into multiple items.
        """
        # split all_page_content into a list of lines and remove empty lines
        processed_content = []
        for page in file_content:
            # page_content = []
            lines = [line for line in page.splitlines() if line.strip() != ""]

            for item in lines:
                if len(item) > 128:
                    # Split item by . and extend to processed_content
                    re_split_items = re.split(r"(?<=[.。;])", item)
                    merged_split_items = merge_strings(
                        re_split_items, delimiter="", max_length=128
                    )
                    processed_content.extend(merged_split_items)
                else:
                    processed_content.extend([item])

        processed_content = merge_strings(
            processed_content, delimiter="    ", max_length=128, truncate_buffer=True
        )
        processed_content = processed_content[:10000]
        return processed_content

    def get_encoding(self, file_path):
        """
        Returns the encoding of the file.
        """

        with open(file_path, "rb") as f:
            blob = f.read()
        m = magic.Magic(mime_encoding=True)
        encoding = m.from_buffer(blob)
        return encoding
