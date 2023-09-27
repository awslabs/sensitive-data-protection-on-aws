from common.constant import const


def is_empty(in_str: str) -> bool:
    if in_str is None or in_str == const.EMPTY_STR:
        return True
    return False
