from datetime import datetime


def get_time() -> str:
    return format_time(datetime.utcnow())


def get_date() -> str:
    return datetime.strftime(datetime.utcnow(), '%Y-%m-%d')


def format_time(in_time: datetime) -> str:
    return datetime.strftime(in_time, '%Y-%m-%d %H:%M:%S')


def parse_time(in_str: str) -> datetime:
    return datetime.strptime(in_str, '%Y-%m-%d %H:%M:%S')
