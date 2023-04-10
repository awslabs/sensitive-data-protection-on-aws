from datetime import datetime


def get_time() -> str:
    return format_time(datetime.utcnow())


def format_time(in_time: datetime) -> str:
    return datetime.strftime(in_time, '%Y-%m-%d %H:%M:%S')
