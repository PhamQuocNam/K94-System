"""Character CRUD operations."""

import uuid
from sqlmodel import Session, select

from app.crud.base import CRUDBase
from app.models import Character
from app.schemas.character import CharacterCreate, CharacterUpdate


class CRUDCharacter(CRUDBase[Character, CharacterCreate, CharacterUpdate]):
    def get_by_storyboard(
        self, session: Session, storyboard_id: uuid.UUID
    ) -> list[Character]:
        statement = select(Character).where(Character.storyboard_id == storyboard_id)
        return session.exec(statement).all()


character = CRUDCharacter(Character)


def create_character(session: Session, character_in: CharacterCreate) -> Character:
    return character.create(session, character_in)


def get_characters_by_storyboard(
    session: Session, storyboard_id: uuid.UUID
) -> list[Character]:
    return character.get_by_storyboard(session, storyboard_id)


def get_character_by_id(session: Session, character_id: uuid.UUID) -> Character | None:
    return character.get(session, character_id)


def update_character(
    session: Session, db_character: Character, character_in: CharacterUpdate
) -> Character:
    return character.update(session, db_character, character_in)


def delete_character(session: Session, character_id: uuid.UUID) -> bool:
    return character.delete(session, character_id)

