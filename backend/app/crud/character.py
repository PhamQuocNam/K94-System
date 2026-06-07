"""Character CRUD operations."""

import uuid
from sqlmodel import Session, select

from app.models import Character
from app.schemas.character import CharacterCreate, CharacterUpdate


def create_character( session: Session, character_in: CharacterCreate) -> Character:
    """Create a new character.

    Args:
        session: Database session
        character_in: Character creation data

    Returns:
        Created character
    """
    db_character = Character.model_validate(character_in)
    session.add(db_character)
    session.commit()
    session.refresh(db_character)
    return db_character


def get_characters_by_storyboard( session: Session, storyboard_id: uuid.UUID) -> list[Character]:
    """Get all characters for a storyboard.

    Args:
        session: Database session
        storyboard_id: Storyboard UUID

    Returns:
        List of characters
    """
    statement = select(Character).where(Character.storyboard_id == storyboard_id)
    return session.exec(statement).all()


def get_character_by_id(session: Session, character_id: uuid.UUID) -> Character | None:
    """Get character by ID.

    Args:
        session: Database session
        character_id: Character UUID

    Returns:
        Character if found, None otherwise
    """
    return session.get(Character, character_id)


def update_character( session: Session, db_character: Character, character_in: CharacterUpdate) -> Character:
    """Update an existing character.

    Args:
        session: Database session
        db_character: Existing character to update
        character_in: Character update data

    Returns:
        Updated character
    """
    character_data = {k: v for k, v in character_in.model_dump(exclude_unset=True).items() if v is not None}
    for field, value in character_data.items():
        setattr(db_character, field, value)
    session.add(db_character)
    session.commit()
    session.refresh(db_character)
    return db_character


def delete_character( session: Session, character_id: uuid.UUID) -> bool:
    """Delete a character by ID.

    Args:
        session: Database session
        character_id: Character UUID

    Returns:
        True if deleted, False if not found
    """
    character = session.get(Character, character_id)
    if not character:
        return False
    session.delete(character)
    session.commit()
    return True
