from . import crud


def set_config(key: str, value: str):
    return crud.set_value(key, value)


def get_config(key: str) -> str:
    return crud.get_value(key)
