"""API routes for storyboard and story analysis."""

import uuid
from typing import Any

from fastapi import APIRouter, status
from sqlmodel import Session, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Character, Scene, Setting, StoryBoard
from app.schemas.storyboard import StoryBoardCreate, StoryBoardUpdate
from app.services.storyboard import StoryboardService

router = APIRouter()


@router.get("/storyboards/by-project/{project_id}")
def get_storyboard_by_project_id(
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
) -> StoryBoard | None:
    """Get storyboard by project ID.

    Args:
        session: Database session
        current_user: Authenticated user
        project_id: Project UUID

    Returns:
        Storyboard if exists, null otherwise
    """
    from app.crud.storyboard import get_storyboard_by_project
    from app.crud.helpers import get_owned_project

    # Verify project belongs to user
    get_owned_project(session, project_id, current_user.id)

    return get_storyboard_by_project(session, project_id)


@router.post("/storyboards")
def create_storyboard(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_in: StoryBoardCreate,
) -> StoryBoard:
    """Create a new storyboard for a project.

    Args:
        session: Database session
        current_user: Authenticated user
        storyboard_in: Storyboard creation data

    Returns:
        Created storyboard
    """
    service = StoryboardService(session)
    return service.create_storyboard(
        project_id=storyboard_in.project_id,
        user_id=current_user.id,
        storyboard_in=storyboard_in,
    )


@router.get("/storyboards/{storyboard_id}")
def get_storyboard(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
) -> StoryBoard:
    """Get a storyboard by ID.

    Args:
        session: Database session
        current_user: Authenticated user
        storyboard_id: Storyboard UUID

    Returns:
        Storyboard with related data
    """
    service = StoryboardService(session)
    return service.get_storyboard(storyboard_id=storyboard_id, user_id=current_user.id)


@router.put("/storyboards/{storyboard_id}")
def update_storyboard(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
    storyboard_in: StoryBoardUpdate,
) -> StoryBoard:
    """Update a storyboard.

    Args:
        session: Database session
        current_user: Authenticated user
        storyboard_id: Storyboard UUID
        storyboard_in: Update data

    Returns:
        Updated storyboard
    """
    service = StoryboardService(session)
    return service.update_storyboard(
        storyboard_id=storyboard_id,
        user_id=current_user.id,
        storyboard_in=storyboard_in,
    )


@router.get("/storyboards/{storyboard_id}/characters")
def get_storyboard_characters(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
) -> list[Character]:
    """Get all characters for a storyboard.

    Args:
        session: Database session
        current_user: Authenticated user
        storyboard_id: Storyboard UUID

    Returns:
        List of characters
    """
    from app.crud.helpers import get_owned_storyboard

    # Verify ownership
    get_owned_storyboard(session, storyboard_id, current_user.id)

    characters = session.exec(
        select(Character).where(Character.storyboard_id == storyboard_id)
    ).all()
    return characters


@router.get("/storyboards/{storyboard_id}/settings")
def get_storyboard_settings(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
) -> list[Setting]:
    """Get all settings for a storyboard.

    Args:
        session: Database session
        current_user: Authenticated user
        storyboard_id: Storyboard UUID

    Returns:
        List of settings
    """
    from app.crud.helpers import get_owned_storyboard

    # Verify ownership
    get_owned_storyboard(session, storyboard_id, current_user.id)

    settings = session.exec(
        select(Setting).where(Setting.storyboard_id == storyboard_id)
    ).all()
    return settings


@router.get("/storyboards/{storyboard_id}/scenes")
def get_storyboard_scenes(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
) -> list[Scene]:
    """Get all scenes for a storyboard.

    Args:
        session: Database session
        current_user: Authenticated user
        storyboard_id: Storyboard UUID

    Returns:
        List of scenes ordered by sequence number
    """
    from app.crud.helpers import get_owned_storyboard

    # Verify ownership
    get_owned_storyboard(session, storyboard_id, current_user.id)

    scenes = session.exec(
        select(Scene)
        .where(Scene.storyboard_id == storyboard_id)
        .order_by(Scene.sequence_number)
    ).all()
    return scenes


@router.put("/characters/{character_id}")
def update_character(
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
    from app.crud.character import update_character
    from app.crud.helpers import get_owned_storyboard

    character = session.get(Character, character_id)
    if not character:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Character not found"
        )

    get_owned_storyboard(session, character.storyboard_id, current_user.id)

    from app.schemas.character import CharacterUpdate

    update_data = CharacterUpdate(**character_in)
    return update_character(
        session=session,
        db_character=character,
        character_in=update_data,
    )


@router.put("/settings/{setting_id}")
def update_setting(
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
    from app.crud.helpers import get_owned_storyboard
    from app.crud.setting import update_setting

    setting = session.get(Setting, setting_id)
    if not setting:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Setting not found"
        )

    get_owned_storyboard(session, setting.storyboard_id, current_user.id)

    from app.schemas.setting import SettingUpdate

    update_data = SettingUpdate(**setting_in)
    return update_setting(
        session=session,
        db_setting=setting,
        setting_in=update_data,
    )


@router.put("/scenes/{scene_id}")
def update_scene(
    session: SessionDep,
    current_user: CurrentUser,
    scene_id: uuid.UUID,
    scene_in: dict,
) -> Scene:
    """Update a scene.

    Args:
        session: Database session
        current_user: Authenticated user
        scene_id: Scene UUID
        scene_in: Update data

    Returns:
        Updated scene
    """
    from app.crud.helpers import get_owned_storyboard
    from app.crud.scene import update_scene

    scene = session.get(Scene, scene_id)
    if not scene:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found"
        )

    get_owned_storyboard(session, scene.storyboard_id, current_user.id)

    from app.schemas.scene import SceneUpdate

    update_data = SceneUpdate(**scene_in)
    return update_scene(
        session=session,
        db_scene=scene,
        scene_in=update_data,
    )


@router.post("/characters/{character_id}/regenerate-image")
async def regenerate_character_image(
    session: SessionDep,
    current_user: CurrentUser,
    character_id: uuid.UUID,
    style: str = "cinematic",
) -> dict[str, str | None]:
    """Regenerate a character's reference image.

    Args:
        session: Database session
        current_user: Authenticated user
        character_id: Character UUID
        style: Art style for image generation

    Returns:
        Dictionary with new image URL
    """
    from app.core.storage import storage
    from app.crud.character import get_character_by_id, update_character
    from app.crud.helpers import get_owned_storyboard
    from app.image_generator.image_gen import ImageGenerator
    from app.schemas.character import CharacterUpdate

    character = get_character_by_id(session=session, character_id=character_id)
    if not character:
        from fastapi import HTTPException

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
            # Download and save locally to avoid URL expiration
            image_url = await storage.download_and_save(temp_url, "generated")
            update_data = CharacterUpdate(reference_image_url=image_url)
            update_character(
                session=session,
                db_character=character,
                character_in=update_data,
            )
            session.commit()
        else:
            image_url = None

        return {"image_url": image_url}
    finally:
        await image_gen.close()


@router.post("/settings/{setting_id}/regenerate-image")
async def regenerate_setting_image(
    session: SessionDep,
    current_user: CurrentUser,
    setting_id: uuid.UUID,
    style: str = "cinematic",
) -> dict[str, str | None]:
    """Regenerate a setting's reference image.

    Args:
        session: Database session
        current_user: Authenticated user
        setting_id: Setting UUID
        style: Art style for image generation

    Returns:
        Dictionary with new image URL
    """
    from app.core.storage import storage
    from app.crud.helpers import get_owned_storyboard
    from app.crud.setting import get_setting_by_id
    from app.image_generator.image_gen import ImageGenerator
    from app.schemas.setting import SettingUpdate

    setting = get_setting_by_id(session=session, setting_id=setting_id)
    if not setting:
        from fastapi import HTTPException

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
            # Download and save locally to avoid URL expiration
            image_url = await storage.download_and_save(temp_url, "generated")
            update_data = SettingUpdate(reference_image_url=image_url)
            update_setting(
                session=session,
                db_setting=setting,
                setting_in=update_data,
            )
            session.commit()
        else:
            image_url = None

        return {"image_url": image_url}
    finally:
        await image_gen.close()


@router.post("/scenes/{scene_id}/regenerate-image")
async def regenerate_scene_image(
    session: SessionDep,
    current_user: CurrentUser,
    scene_id: uuid.UUID,
    style: str = "cinematic",
) -> dict[str, str | None]:
    """Regenerate a scene's reference image.

    Args:
        session: Database session
        current_user: Authenticated user
        scene_id: Scene UUID
        style: Art style for image generation

    Returns:
        Dictionary with new image URL
    """
    from app.core.storage import storage
    from app.crud.helpers import get_owned_storyboard
    from app.crud.scene import get_scene_by_id
    from app.image_generator.image_gen import ImageGenerator
    from app.schemas.scene import SceneUpdate

    scene = get_scene_by_id(session=session, scene_id=scene_id)
    if not scene:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found"
        )

    get_owned_storyboard(session, scene.storyboard_id, current_user.id)

    image_gen = ImageGenerator()
    try:
        visual_prompt = scene.visual_description or scene.narrative_description or ""
        temp_url = await image_gen.generate_scene_reference(
            visual_prompt=visual_prompt,
            style=style,
        )

        if temp_url:
            # Download and save locally to avoid URL expiration
            image_url = await storage.download_and_save(temp_url, "generated")
            update_data = SceneUpdate(reference_image_url=image_url)
            update_scene(
                session=session,
                db_scene=scene,
                scene_in=update_data,
            )
            session.commit()
        else:
            image_url = None

        return {"image_url": image_url}
    finally:
        await image_gen.close()


@router.post("/storyboards/{storyboard_id}/analyze")
async def analyze_story(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
    style: str = "cinematic",
    generate_images: bool = False,
) -> dict[str, Any]:
    """Analyze story content and extract characters, settings, and scenes.

    Args:
        session: Database session
        current_user: Authenticated user
        storyboard_id: Storyboard UUID
        style: Art style for image generation
        generate_images: Whether to generate reference images

    Returns:
        Analysis results with counts
    """
    service = StoryboardService(session)
    return await service.analyze_story(
        storyboard_id=storyboard_id,
        user_id=current_user.id,
        style=style,
        generate_images=generate_images,
    )
