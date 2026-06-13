"""API routes for scene CRUD operations."""

import uuid
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlmodel import Session, select
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.language_models.chat_models import BaseChatModel

from app.api.deps import CurrentUser, SessionDep
from app.core.storage import storage
from app.crud.helpers import get_owned_storyboard
from app.crud.scene import create_scene, get_scene_by_id, update_scene
from app.image_generator.image_gen import ImageGenerator
from app.llm_provider import get_llm
from app.models import Scene
from app.schemas.scene import SceneCreate, SceneUpdate
from app.schemas.storyboard import (
    BatchGenerationResponse,
    ImageGenerationResponse,
    VideoGenerationResponse,
)
from app.services.scene_generation import SceneGenerationService
from app.crud import get_characters_by_storyboard

router = APIRouter(prefix="/scenes", tags=["scenes"])

def get_llm_dep(
    provider: Annotated[Literal["openai", "claude", "google"] | None, Query()] = None
) -> BaseChatModel:
    """Dependency to get LLM instance based on provider query parameter."""
    return get_llm(provider=provider)


class SceneRequest(BaseModel):
    content: str
    position: int | None = None


@router.get("/{storyboard_id}/scenes", response_model=list[Scene])
def get_scenes_by_storyboard(
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
    storyboard = get_owned_storyboard(session, storyboard_id, current_user.id)

    scenes = session.exec(
        select(Scene)
        .where(Scene.storyboard_id == storyboard_id)
        .order_by(Scene.sequence_number)
    ).all()

    return scenes


@router.post("/{storyboard_id}/scenes", response_model=Scene)
async def create_scene_endpoint(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
    req: SceneRequest,
    llm: Annotated[Any, Depends(get_llm)],
) -> Scene:
    """Create a new scene in a storyboard.

    Args:
        session: Database session
        current_user: Authenticated user
        storyboard_id: Storyboard UUID
        req: Scene creation request
        llm: LLM instance

    Returns:
        Created scene
    """
    from app.prompts.scene_visual import ADD_NEW_SCENE_PROMPT

    storyboard = get_owned_storyboard(session, storyboard_id, current_user.id)

    scenes = session.exec(
        select(Scene)
        .where(Scene.storyboard_id == storyboard_id)
        .order_by(Scene.sequence_number)
    ).all()

    characters = get_characters_by_storyboard(session, storyboard_id)
    character_names = '\n'.join([char.name for char in characters if char.name])
    
    prompt = ADD_NEW_SCENE_PROMPT.format(story=storyboard.content, content=req.content, characters= character_names)
    chain = llm | JsonOutputParser()

    try:
        new_scene_data = await chain.ainvoke(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")

    if req.position is not None and 0 <= req.position <= len(scenes):
        if req.position == 0:
            sequence_number = scenes[0].sequence_number - 1 if scenes else 1
        elif req.position >= len(scenes):
            sequence_number = scenes[-1].sequence_number + 1 if scenes else 1
        else:
            sequence_number = (scenes[req.position -1].sequence_number + scenes[req.position].sequence_number) / 2
    else:
        sequence_number = scenes[-1].sequence_number + 1 if scenes else 1

    new_scene_data["storyboard_id"] = str(storyboard_id)
    new_scene_data["sequence_number"] = sequence_number
    new_scene_data["setting_id"] = scenes[int(sequence_number)].setting_id if scenes else None
    
    scene_create = SceneCreate(**new_scene_data)
    return create_scene(session, scene_create)


@router.put("/{scene_id}", response_model=Scene)
def update_scene_endpoint(
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
    scene = session.get(Scene, scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found"
        )

    get_owned_storyboard(session, scene.storyboard_id, current_user.id)

    update_data = SceneUpdate(**scene_in)
    return update_scene(
        session=session,
        db_scene=scene,
        scene_in=update_data,
    )


@router.delete("/{scene_id}")
def delete_scene_endpoint(
    session: SessionDep,
    current_user: CurrentUser,
    scene_id: uuid.UUID,
) -> dict:
    """Delete a scene.

    Args:
        session: Database session
        current_user: Authenticated user
        scene_id: Scene UUID

    Returns:
        Success message
    """
    scene = session.get(Scene, scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found"
        )

    get_owned_storyboard(session, scene.storyboard_id, current_user.id)

    session.delete(scene)
    session.commit()

    return {"message": "Scene deleted successfully"}


@router.post("/{scene_id}/regenerate-image", response_model=ImageGenerationResponse)
async def regenerate_scene_image(
    session: SessionDep,
    current_user: CurrentUser,
    scene_id: uuid.UUID,
    llm: Annotated[BaseChatModel, Depends(get_llm_dep)],
    style: str = "cinematic",
) -> ImageGenerationResponse:
    """Regenerate a scene's reference image.

    Args:
        session: Database session
        current_user: Authenticated user
        scene_id: Scene UUID
        llm: LLM instance (injected via provider query param: ?provider=openai|claude|google)
        style: Art style for image generation

    Returns:
        Image generation response with URL
    """
    scene = get_scene_by_id(session=session, scene_id=scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found"
        )

    get_owned_storyboard(session, scene.storyboard_id, current_user.id)

    gen_service = SceneGenerationService(
        session=session,
        storyboard_id=scene.storyboard_id,
        llm=llm,
    )

    characters = scene.characters
    scene_setting = scene.setting
    
    # Collect reference URLs and convert to local paths
    reference_urls = [char.reference_image_url for char in characters if char.reference_image_url]
    if scene_setting and scene_setting.reference_image_url:
        reference_urls.append(scene_setting.reference_image_url)
    
    reference_paths = []
    for url in reference_urls:
        if url:
            local_path = await storage.download_to_temp(url)
            if local_path:
                reference_paths.append(local_path)
    
    visual_prompt_data = await gen_service._generate_visual_prompt(
        scene=scene,
        characters=characters,
        setting=scene_setting,
    )

    image_gen = ImageGenerator()
    try:
        temp_url = await image_gen.generate_scene_reference(
            visual_prompt=visual_prompt_data["visual_prompt"],
            style=style or gen_service.storyboard.style or "cinematic",
            reference_paths=reference_paths
        )

        if temp_url:
            image_url = await storage.download_and_save(temp_url, "images")
            update_data = SceneUpdate(reference_image_url=image_url, visual_prompt= visual_prompt_data["visual_prompt"])
            update_scene(
                session=session,
                db_scene=scene,
                scene_in=update_data,
            )
            session.commit()
            return ImageGenerationResponse(image_url=image_url)

        return ImageGenerationResponse(error="Failed to generate image")

    finally:
        await image_gen.close()


@router.post("/{scene_id}/generate-image", response_model=ImageGenerationResponse)
async def generate_scene_image(
    session: SessionDep,
    current_user: CurrentUser,
    scene_id: uuid.UUID,
    llm: Annotated[BaseChatModel, Depends(get_llm_dep)],
    style: str | None = None,
) -> ImageGenerationResponse:
    """Generate image for a single scene with visual prompt generation (Phase 2).

    Args:
        session: Database session
        current_user: Authenticated user
        scene_id: Scene UUID
        llm: LLM instance (injected via provider query param: ?provider=openai|claude|google)
        style: Art style (uses storyboard style if not specified)

    Returns:
        Image generation response with URL
    """
    scene = get_scene_by_id(session=session, scene_id=scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found"
        )

    get_owned_storyboard(session, scene.storyboard_id, current_user.id)

    gen_service = SceneGenerationService(
        session=session,
        storyboard_id=scene.storyboard_id,
        llm=llm,
    )

    characters = scene.characters
    scene_setting = scene.setting
    
    # Collect reference URLs and convert to local paths
    reference_urls = [char.reference_image_url for char in characters if char.reference_image_url]
    if scene_setting and scene_setting.reference_image_url:
        reference_urls.append(scene_setting.reference_image_url)
    
    reference_paths = []
    for url in reference_urls:
        if url:
            local_path = await storage.download_to_temp(url)
            if local_path:
                reference_paths.append(local_path)
    
    visual_prompt_data = await gen_service._generate_visual_prompt(
        scene=scene,
        characters=characters,
        setting=scene_setting,
    )

    image_gen = ImageGenerator()
    try:
        temp_url = await image_gen.generate_scene_reference(
            visual_prompt=visual_prompt_data["visual_prompt"],
            style=style or gen_service.storyboard.style or "cinematic",
            reference_paths=reference_paths
        )

        if temp_url:
            image_url = await storage.download_and_save(temp_url, "images")
            update_data = SceneUpdate(reference_image_url=image_url, visual_prompt= visual_prompt_data["visual_prompt"])
            update_scene(
                session=session,
                db_scene=scene,
                scene_in=update_data,
            )
            session.commit()
            return ImageGenerationResponse(image_url=image_url)

        return ImageGenerationResponse(error="Failed to generate image")

    finally:
        await image_gen.close()


@router.post("/{scene_id}/generate-video", response_model=VideoGenerationResponse)
async def generate_scene_video(
    session: SessionDep,
    current_user: CurrentUser,
    llm: Annotated[BaseChatModel, Depends(get_llm_dep)],
    scene_id: uuid.UUID,
    duration: float = 3.0,
) -> VideoGenerationResponse:
    """Generate video for a single scene (Phase 2).

    Args:
        session: Database session
        current_user: Authenticated user
        llm: LLM instance (injected via provider query param)
        scene_id: Scene UUID
        duration: Video duration in seconds

    Returns:
        Video generation response with URL
    """
    scene = get_scene_by_id(session=session, scene_id=scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found"
        )

    get_owned_storyboard(session, scene.storyboard_id, current_user.id)

    service = SceneGenerationService(
        session=session,
        storyboard_id=scene.storyboard_id,
        llm=llm,
    )
    
    result = await service.generate_scene_videos(
        start_scene=int(scene.sequence_number),
        end_scene=int(scene.sequence_number),
        duration=duration,
    )
    
    if result["generated"] > 0:
        # Refresh scene to get updated video URL
        session.refresh(scene)
        return VideoGenerationResponse(
            video_url=scene.reference_video_url,
            error=None,
        )
    
    error_msg = result["errors"][0] if result["errors"] else "Video generation failed"
    return VideoGenerationResponse(
        video_url=None,
        error=error_msg,
    )


@router.post("/{storyboard_id}/generate-scene-images", response_model=BatchGenerationResponse)
async def generate_storyboard_scene_images(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
    llm: Annotated[BaseChatModel, Depends(get_llm_dep)],
    start_scene: int = 1,
    end_scene: int | None = None,
) -> BatchGenerationResponse:
    """Generate images for all scenes in a storyboard (Phase 2).

    Args:
        session: Database session
        current_user: Authenticated user
        storyboard_id: Storyboard UUID
        llm: LLM instance (injected via provider query param: ?provider=openai|claude|google)
        start_scene: Starting scene sequence number
        end_scene: Ending scene sequence number (None = all scenes)

    Returns:
        Batch generation results with counts and errors
    """
    get_owned_storyboard(session, storyboard_id, current_user.id)

    service = SceneGenerationService(
        session=session,
        storyboard_id=storyboard_id,
        llm=llm,
    )
    result = await service.generate_scene_images(
        start_scene=start_scene,
        end_scene=end_scene,
    )
    generated = result.get("generated", 0)
    skipped = result.get("skipped", 0)
    error_list = result.get("errors", [])
    return BatchGenerationResponse(
        total=generated + skipped,
        success_count=generated,
        error_count=len(error_list),
        errors=[{"message": err} for err in error_list],
    )


@router.post("/{storyboard_id}/generate-scene-videos", response_model=BatchGenerationResponse)
async def generate_storyboard_scene_videos(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
    llm: Annotated[BaseChatModel, Depends(get_llm_dep)],
    start_scene: int = 1,
    end_scene: int | None = None,
    duration: float = 3.0,
) -> BatchGenerationResponse:
    """Generate videos for all scenes in a storyboard (Phase 2).

    Args:
        session: Database session
        current_user: Authenticated user
        storyboard_id: Storyboard UUID
        llm: LLM instance (injected via provider query param: ?provider=openai|claude|google)
        start_scene: Starting scene sequence number
        end_scene: Ending scene sequence number (None = all scenes)
        duration: Video duration in seconds

    Returns:
        Batch generation results with counts and errors
    """
    get_owned_storyboard(session, storyboard_id, current_user.id)

    service = SceneGenerationService(
        session=session,
        storyboard_id=storyboard_id,
        llm=llm,
    )
    result = await service.generate_scene_videos(
        start_scene=start_scene,
        end_scene=end_scene,
        duration=duration,
    )
    generated = result.get("generated", 0)
    skipped = result.get("skipped", 0)
    error_list = result.get("errors", [])
    return BatchGenerationResponse(
        total=generated + skipped,
        success_count=generated,
        error_count=len(error_list),
        errors=[{"message": err} for err in error_list],
    )
