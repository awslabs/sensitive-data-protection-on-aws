
import os
import boto3
from pypdf import PdfReader
from io import BytesIO

from .parser import BaseParser

class PdfParser(BaseParser):
    def __init__(self, s3_client):
        super().__init__(s3_client=s3_client)
    

    def parse_file(self, pdf_stream):
        """
        Extracts text from a PDF file and returns a list of lines.
        """

        # Create a PDF reader object
        pdf_reader = PdfReader(BytesIO(pdf_stream))
        file_content = []

        # Loop through each page in the PDF file
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]

            # Extract the text from the page and append it to the string
            page_content = page.extract_text()
            file_content.append(page_content)

        # print(file_content)
        return file_content
