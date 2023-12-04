import os
from datetime import datetime
from .constant import const


def before_exec(conn, clause, multi_params, params):
    operator = os.getenv(const.USER, const.USER_DEFAULT_NAME)
    operation_time = datetime.utcnow()
    if str(clause).startswith('INSERT'):
        if multi_params:
            for current_params in multi_params:
                __add_insert_params(current_params, operator, operation_time)
        else:
            __add_insert_params(params, operator, operation_time)
    elif str(clause).startswith('UPDATE'):
        if multi_params:
            for current_params in multi_params:
                __add_update_params(current_params, operator, operation_time)
        else:
            __add_update_params(params, operator, operation_time)


def __add_insert_params(params, operator, operation_time):
    params['create_by'] = operator
    params['create_time'] = operation_time


def __add_update_params(params, default_operator, operation_time):
    params['modify_by'] = params['modify_by'] if ('modify_by' in params) else default_operator
    params['modify_time'] = operation_time
