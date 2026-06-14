"""Scene CRUD operations."""

import uuid
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models import Scene
from app.schemas.scene import SceneCreate, SceneUpdate


class CRUDScene(CRUDBase[Scene, SceneCreate, SceneUpdate]):
    def get_by_storyboard(
        self, session: Session, storyboard_id: uuid.UUID
    ) -> list[Scene]:
        statement = (
            select(Scene)
            .where(Scene.storyboard_id == storyboard_id)
            .order_by(Scene.sequence_number)
        )
        return session.exec(statement).all()

    def get_with_relations(self, session: Session, scene_id: uuid.UUID) -> Scene | None:
        statement = (
            select(Scene)
            .where(Scene.id == scene_id)
            .options(selectinload(Scene.setting), selectinload(Scene.characters))
        )
        return session.exec(statement).first()


scene = CRUDScene(Scene)


def create_scene(session: Session, scene_in: SceneCreate) -> Scene:
    return scene.create(session, scene_in)


def get_scenes_by_storyboard(session: Session, storyboard_id: uuid.UUID) -> list[Scene]:
    return scene.get_by_storyboard(session, storyboard_id)


def get_scene_by_id(session: Session, scene_id: uuid.UUID) -> Scene | None:
    return scene.get_with_relations(session, scene_id)


def update_scene(session: Session, db_scene: Scene, scene_in: SceneUpdate) -> Scene:
    return scene.update(session, db_scene, scene_in)


def delete_scene(session: Session, scene_id: uuid.UUID) -> bool:
    return scene.delete(session, scene_id)

