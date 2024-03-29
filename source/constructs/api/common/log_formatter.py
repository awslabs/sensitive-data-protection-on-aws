import os
import logging

is_running_in_lambda = 'AWS_LAMBDA_FUNCTION_NAME' in os.environ


class CustomFormatter(logging.Formatter):
    def format(self, record):
        if is_running_in_lambda:
            record.msg = str(record.msg).replace("\n", "\r")
        return super().format(record)
