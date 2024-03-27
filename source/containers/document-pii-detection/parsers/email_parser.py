
import os
from .parser import BaseParser
import quopri
from email.parser import BytesParser as PyEmailParser
import io
import chardet

class EmailParser(BaseParser):
    def __init__(self, s3_client):
        super().__init__(s3_client=s3_client)


    def parse_file(self, eml_stream):
        """
        Extracts text from a eml file and returns a string of content.
        """

        # file_encoding = self.get_encoding(eml_stream)
        result = chardet.detect(eml_stream)
        file_encoding = result['encoding']

        # with open(eml_stream) as stream:
        parser = PyEmailParser()
        # message = parser.parsebytes(io.BytesIO(eml_stream))

        file_content = []
        eml_content = eml_stream.decode(file_encoding)  # Decode the stream if needed
        msg = parser.parsebytes(eml_content.encode())

        # text = ""
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                if content_type == "text/plain":
                    file_content.append(part.get_payload(decode=True).decode())
        else:
            file_content.append(msg.get_payload(decode=True).decode())


        return ['\n'.join(file_content)]
