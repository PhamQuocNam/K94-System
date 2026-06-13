"""API routes for character CRUD operations."""

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser, SessionDep
from app.core.storage import storage
from app.crud.character import get_character_by_id, update_character
from app.crud.helpers import get_owned_storyboard
from app.image_generator.image_gen import ImageGenerator
from app.models import Character
from app.schemas.character import CharacterUpdate
from app.schemas.storyboard import ImageGenerationResponse

router = APIRouter(prefix="/characters", tags=["characters"])


@router.put("/{character_id}", response_model=Character)
def update_character_endpoint(
    session: SessionDep,
    current_user: CurrentUser,
    character_id: uuid.UUID,
    character_in: dict,
) -> Character:
    """Update a character.

    Args:
        session: Database session
        current_user: Authenticated user
        character_id: Character UUID
        character_in: Update data

    Returns:
        Updated character
    """
    character = session.get(Character, character_id)
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Character not found"
        )

    get_owned_storyboard(session, character.storyboard_id, current_user.id)

    update_data = CharacterUpdate(**character_in)
    return update_character(
        session=session,
        db_character=character,
        character_in=update_data,
    )


@router.post("/{character_id}/regenerate-image", response_model=ImageGenerationResponse)
async def regenerate_character_image(
    session: SessionDep,
    current_user: CurrentUser,
    character_id: uuid.UUID,
    style: str = "cinematic",
) -> ImageGenerationResponse:
    """Regenerate a character's reference image.

    Args:
        session: Database session
        current_user: Authenticated user
        character_id: Character UUID
        style: Art style for image generation

    Returns:
        Image generation response with URL
    """
    character = get_character_by_id(session=session, character_id=character_id)
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Character not found"
        )

    get_owned_storyboard(session, character.storyboard_id, current_user.id)

    image_gen = ImageGenerator()
    try:
        description = f"""
Character profile:
- Age: {character.age}
- Gender: {character.gender}
- Nationality/Ethnicity: {character.nationality}
- Body build: {character.body_build}
- Facial features: {character.face}
- Hair: {character.hair}
- Clothing: {character.clothes}
""".strip()

        temp_url = await image_gen.generate_character_reference(
            character_name=character.name or "Character",
            description=description,
            style=style,
        )

        if temp_url:
            image_url = await storage.download_and_save(temp_url, "images")
            update_data = CharacterUpdate(reference_image_url=image_url)
            update_character(
                session=session,
                db_character=character,
                character_in=update_data,
            )
            session.commit()
            return ImageGenerationResponse(image_url=image_url)

        return ImageGenerationResponse(error="Failed to generate image")

    finally:
        await image_gen.close()
