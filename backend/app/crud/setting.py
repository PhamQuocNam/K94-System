"""Setting CRUD operations."""

import uuid
from sqlmodel import Session, select

from app.crud.base import CRUDBase
from app.models import Setting
from app.schemas.setting import SettingCreate, SettingUpdate


class CRUDSetting(CRUDBase[Setting, SettingCreate, SettingUpdate]):
    def get_by_storyboard(
        self, session: Session, storyboard_id: uuid.UUID
    ) -> list[Setting]:
        statement = select(Setting).where(Setting.storyboard_id == storyboard_id)
        return session.exec(statement).all()


setting = CRUDSetting(Setting)


def create_setting(session: Session, setting_in: SettingCreate) -> Setting:
    return setting.create(session, setting_in)


def get_settings_by_storyboard(
    session: Session, storyboard_id: uuid.UUID
) -> list[Setting]:
    return setting.get_by_storyboard(session, storyboard_id)


def get_setting_by_id(session: Session, setting_id: uuid.UUID) -> Setting | None:
    return setting.get(session, setting_id)


def update_setting(
    session: Session, db_setting: Setting, setting_in: SettingUpdate
) -> Setting:
    return setting.update(session, db_setting, setting_in)


def delete_setting(session: Session, setting_id: uuid.UUID) -> bool:
    return setting.delete(session, setting_id)

