from db import models_version as models
from db.database import get_session
from sqlalchemy import desc



def get_latest_version():
    return get_session().query(
        models.Version.value).order_by(models.Version.create_by.desc()).first()[0]
