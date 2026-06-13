"""Scene CRUD operations."""

import uuid
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.models import Scene
from app.schemas.scene import SceneCreate, SceneUpdate


def create_scene( session: Session, scene_in: SceneCreate) -> Scene:
    """Create a new scene.

    Args:
        session: Database session
        scene_in: Scene creation data

    Returns:
        Created scene
    """
    db_scene = Scene.model_validate(scene_in)
    session.add(db_scene)
    session.commit()
    session.refresh(db_scene)
    return db_scene


def get_scenes_by_storyboard( session: Session, storyboard_id: uuid.UUID) -> list[Scene]:
    """Get all scenes for a storyboard, ordered by sequence number.

    Args:
        session: Database session
        storyboard_id: Storyboard UUID

    Returns:
        List of scenes ordered by sequence_number
    """
    statement = select(Scene).where(Scene.storyboard_id == storyboard_id).order_by(Scene.sequence_number)
    return session.exec(statement).all()


def get_scene_by_id(session: Session, scene_id: uuid.UUID) -> Scene | None:
    """Get scene by ID with setting and characters loaded.

    Args:
        session: Database session
        scene_id: Scene UUID

    Returns:
        Scene if found, None otherwise
    """
    statement = (
        select(Scene)
        .where(Scene.id == scene_id)
        .options(selectinload(Scene.setting), selectinload(Scene.characters))
    )
    return session.exec(statement).first()


def update_scene( session: Session, db_scene: Scene, scene_in: SceneUpdate) -> Scene:
    """Update an existing scene.

    Args:
        session: Database session
        db_scene: Existing scene to update
        scene_in: Scene update data

    Returns:
        Updated scene
    """
    scene_data = {k: v for k, v in scene_in.model_dump(exclude_unset=True).items() if v is not None}
    for field, value in scene_data.items():
        setattr(db_scene, field, value)
    session.add(db_scene)
    session.commit()
    session.refresh(db_scene)
    return db_scene


def delete_scene( session: Session, scene_id: uuid.UUID) -> bool:
    """Delete a scene by ID.

    Args:
        session: Database session
        scene_id: Scene UUID

    Returns:
        True if deleted, False if not found
    """
    scene = session.get(Scene, scene_id)
    if not scene:
        return False
    session.delete(scene)
    session.commit()
    return True
