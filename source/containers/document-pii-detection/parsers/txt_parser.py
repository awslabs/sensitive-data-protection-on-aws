
import os
from .parser import BaseParser
import quopri

class TxtParser(BaseParser):
    def __init__(self, s3_client):
        super().__init__(s3_client=s3_client)

    def parse_file(self, txt_path):
        """
        Extracts text from a TXT file and returns a list of lines.
        """

        file_encoding = self.get_encoding(txt_path)

        # Read the file
        with open(txt_path, 'rb') as file:
            file_content_byte = file.read()
        
        file_content = file_content_byte.decode(file_encoding).encode('utf-8').decode('utf-8', errors='ignore')

        # if file_encoding == 'us-ascii':
        #     file_content = quopri.decodestring(file_content).decode('utf-8', errors='ignore')

        return [file_content]
