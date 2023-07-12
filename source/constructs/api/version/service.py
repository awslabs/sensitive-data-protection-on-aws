from version import crud

def get_latest_version():
    res = crud.get_latest_version()
    return res
