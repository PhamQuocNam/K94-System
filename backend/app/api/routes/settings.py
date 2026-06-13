"""API routes for setting CRUD operations."""

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser, SessionDep
from app.core.storage import storage
from app.crud.helpers import get_owned_storyboard
from app.crud.setting import get_setting_by_id, update_setting
from app.image_generator.image_gen import ImageGenerator
from app.models import Setting
from app.schemas.setting import SettingUpdate
from app.schemas.storyboard import ImageGenerationResponse

router = APIRouter(prefix="/settings", tags=["settings"])


@router.put("/{setting_id}", response_model=Setting)
def update_setting_endpoint(
    session: SessionDep,
    current_user: CurrentUser,
    setting_id: uuid.UUID,
    setting_in: dict,
) -> Setting:
    """Update a setting.

    Args:
        session: Database session
        current_user: Authenticated user
        setting_id: Setting UUID
        setting_in: Update data

    Returns:
        Updated setting
    """
    setting = session.get(Setting, setting_id)
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Setting not found"
        )

    get_owned_storyboard(session, setting.storyboard_id, current_user.id)

    update_data = SettingUpdate(**setting_in)
    return update_setting(
        session=session,
        db_setting=setting,
        setting_in=update_data,
    )


@router.post("/{setting_id}/regenerate-image", response_model=ImageGenerationResponse)
async def regenerate_setting_image(
    session: SessionDep,
    current_user: CurrentUser,
    setting_id: uuid.UUID,
    style: str = "cinematic",
) -> ImageGenerationResponse:
    """Regenerate a setting's reference image.

    Args:
        session: Database session
        current_user: Authenticated user
        setting_id: Setting UUID
        style: Art style for image generation

    Returns:
        Image generation response with URL
    """
    setting = get_setting_by_id(session=session, setting_id=setting_id)
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Setting not found"
        )

    get_owned_storyboard(session, setting.storyboard_id, current_user.id)

    image_gen = ImageGenerator()
    try:
        temp_url = await image_gen.generate_setting_reference(
            setting_name=setting.name or "Setting",
            description=setting.description or "",
            style=style,
        )

        if temp_url:
            image_url = await storage.download_and_save(temp_url, "images")
            update_data = SettingUpdate(reference_image_url=image_url)
            update_setting(
                session=session,
                db_setting=setting,
                setting_in=update_data,
            )
            session.commit()
            return ImageGenerationResponse(image_url=image_url)

        return ImageGenerationResponse(error="Failed to generate image")

    finally:
        await image_gen.close()
