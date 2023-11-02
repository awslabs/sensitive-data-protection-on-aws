from parsers import PdfParser, TxtParser, DocParser, HtmlParser, EmailParser, ImageParser

class ParserFactory:
    @staticmethod
    def create_parser(file_type, s3_client):
        if file_type.lower() in ['.pdf']:
            return PdfParser(s3_client=s3_client)
        elif file_type.lower() in ['.txt', '.java', '.py', '.log']:
            return TxtParser(s3_client=s3_client)
        elif file_type.lower() in ['.doc', '.docx']:
            return DocParser(s3_client=s3_client)
        elif file_type.lower() in ['.html', '.htm']:
            return HtmlParser(s3_client=s3_client)
        elif file_type.lower() in ['.eml']:
            return EmailParser(s3_client=s3_client)
        elif file_type.lower() in ['.jpg', '.jpeg', '.png', ".gif", ".bmp", ".tiff", ".tif"]:
            # return ImageParser(s3_client=s3_client, fd_model_path='./fd_model/', 
            #                    ocr_model_path='./ocr_model/')
            return ImageParser(s3_client=s3_client, fd_model_path='./fd_model/', 
                               ocr_model_path='./ocr_model/')
        else:
            raise ValueError('Unsupported file type')