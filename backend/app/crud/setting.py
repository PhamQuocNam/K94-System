"""Setting CRUD operations."""

import uuid
from sqlmodel import Session, select

from app.models import Setting
from app.schemas.setting import SettingCreate, SettingUpdate


def create_setting( session: Session, setting_in: SettingCreate) -> Setting:
    """Create a new setting.

    Args:
        session: Database session
        setting_in: Setting creation data

    Returns:
        Created setting
    """
    db_setting = Setting.model_validate(setting_in)
    session.add(db_setting)
    session.commit()
    session.refresh(db_setting)
    return db_setting


def get_settings_by_storyboard( session: Session, storyboard_id: uuid.UUID) -> list[Setting]:
    """Get all settings for a storyboard.

    Args:
        session: Database session
        storyboard_id: Storyboard UUID

    Returns:
        List of settings
    """
    statement = select(Setting).where(Setting.storyboard_id == storyboard_id)
    return session.exec(statement).all()


def get_setting_by_id(session: Session, setting_id: uuid.UUID) -> Setting | None:
    """Get setting by ID.

    Args:
        session: Database session
        setting_id: Setting UUID

    Returns:
        Setting if found, None otherwise
    """
    return session.get(Setting, setting_id)


def update_setting( session: Session, db_setting: Setting, setting_in: SettingUpdate) -> Setting:
    """Update an existing setting.

    Args:
        session: Database session
        db_setting: Existing setting to update
        setting_in: Setting update data

    Returns:
        Updated setting
    """
    setting_data = {k: v for k, v in setting_in.model_dump(exclude_unset=True).items() if v is not None}
    for field, value in setting_data.items():
        setattr(db_setting, field, value)
    session.add(db_setting)
    session.commit()
    session.refresh(db_setting)
    return db_setting


def delete_setting( session: Session, setting_id: uuid.UUID) -> bool:
    """Delete a setting by ID.

    Args:
        session: Database session
        setting_id: Setting UUID

    Returns:
        True if deleted, False if not found
    """
    setting = session.get(Setting, setting_id)
    if not setting:
        return False
    session.delete(setting)
    session.commit()
    return True
