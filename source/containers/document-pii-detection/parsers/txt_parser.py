
import os
from .parser import BaseParser
import quopri
import chardet

class TxtParser(BaseParser):
    def __init__(self, s3_client):
        super().__init__(s3_client=s3_client)

    def parse_file(self, txt_stream):
        """
        Extracts text from a TXT file and returns a list of lines.
        """

        # file_encoding = self.get_encoding(txt_stream)

        # Read the file
        # with open(txt_stream, 'rb') as file:
        #     file_content_byte = file.read()
        result = chardet.detect(txt_stream)
        encoding = result['encoding']
        file_content = txt_stream.decode(encoding)
        # print(file_content)
        # if file_encoding == 'us-ascii':
        #     file_content = quopri.decodestring(file_content).decode('utf-8', errors='ignore')

        return [file_content]
