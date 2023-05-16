import db.models_config as models
from db.database import get_session


def get_value(key: str) -> str:
    db_config = get_session().query(models.Config).filter(models.Config.config_key == key).first()
    if db_config is None:
        return None
    return db_config.config_value


def set_value(key: str, value: str):
    session = get_session()
    size = session.query(models.Config).filter(models.Config.config_key == key).update({"config_value": value})
    if size <= 0:
        db_config = models.Config(config_key=key,
                                  config_value=value)
        session.add(db_config)
    session.commit()
