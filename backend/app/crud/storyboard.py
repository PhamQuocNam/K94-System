"""StoryBoard CRUD operations."""

import uuid
from sqlmodel import Session, select

from app.models import Scene, Setting, StoryBoard
from app.schemas.storyboard import StoryBoardCreate, StoryBoardUpdate


def create_storyboard(session: Session, storyboard_in: StoryBoardCreate) -> StoryBoard:
    """Create a new storyboard.

    Args:
        session: Database session
        storyboard_in: Storyboard creation data

    Returns:
        Created storyboard
    """
    storyboard = StoryBoard.model_validate(storyboard_in)
    session.add(storyboard)
    session.commit()
    session.refresh(storyboard)
    return storyboard


def get_storyboard_by_id(session: Session, storyboard_id: uuid.UUID) -> StoryBoard | None:
    """Get storyboard by ID.

    Args:
        session: Database session
        storyboard_id: Storyboard UUID

    Returns:
        Storyboard if found, None otherwise
    """
    return session.get(StoryBoard, storyboard_id)


def get_storyboard_by_project(session: Session, project_id: uuid.UUID) -> StoryBoard | None:
    """Get storyboard by project ID.

    Args:
        session: Database session
        project_id: Project UUID

    Returns:
        Storyboard if found, None otherwise
    """
    statement = select(StoryBoard).where(StoryBoard.project_id == project_id)
    return session.exec(statement).first()


def update_storyboard( session: Session, db_storyboard: StoryBoard, storyboard_in: StoryBoardUpdate) -> StoryBoard:
    """Update an existing storyboard.

    Args:
        session: Database session
        db_storyboard: Existing storyboard to update
        storyboard_in: Storyboard update data

    Returns:
        Updated storyboard
    """
    storyboard_data = {k: v for k, v in storyboard_in.model_dump(exclude_unset=True).items() if v is not None}
    for field, value in storyboard_data.items():
        setattr(db_storyboard, field, value)
    session.add(db_storyboard)
    session.commit()
    session.refresh(db_storyboard)
    return db_storyboard


def delete_storyboard( session: Session, storyboard_id: uuid.UUID) -> bool:
    """Delete a storyboard by ID.

    Args:
        session: Database session
        storyboard_id: Storyboard UUID

    Returns:
        True if deleted, False if not found
    """
    storyboard = session.get(StoryBoard, storyboard_id)
    if not storyboard:
        return False
    session.delete(storyboard)
    session.commit()
    return True


def delete_storyboard_analysis(session: Session, storyboard_id: uuid.UUID) -> None:
    """Delete all analysis data (characters, settings, scenes) for a storyboard.

    Args:
        session: Database session
        storyboard_id: Storyboard UUID
    """
    from app.models import Character

    # Delete characters (SceneCharacterLink will cascade)
    characters = session.exec(select(Character).where(Character.storyboard_id == storyboard_id)).all()
    for character in characters:
        session.delete(character)

    # Delete settings
    settings = session.exec(select(Setting).where(Setting.storyboard_id == storyboard_id)).all()
    for setting in settings:
        session.delete(setting)

    # Delete scenes
    scenes = session.exec(select(Scene).where(Scene.storyboard_id == storyboard_id)).all()
    for scene in scenes:
        session.delete(scene)

    session.commit()
