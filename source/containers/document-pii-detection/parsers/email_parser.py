
import os
from .parser import BaseParser
import quopri
from email.parser import Parser as PyEmailParser

class EmailParser(BaseParser):
    def __init__(self, s3_client):
        super().__init__(s3_client=s3_client)


    def parse_file(self, eml_path):
        """
        Extracts text from a eml file and returns a string of content.
        """

        file_encoding = self.get_encoding(eml_path)

        with open(eml_path) as stream:
            parser = PyEmailParser()
            message = parser.parse(stream)

        file_content = []
        for part in message.walk():
            if part.get_content_type().startswith('text/plain'):
                part_payload = part.get_payload()
                if file_encoding == 'us-ascii':
                    decoded_string = quopri.decodestring(part_payload).decode('utf-8')
                else:
                    decoded_string = part_payload
                file_content.append(decoded_string)


        return ['\n'.join(file_content)]
