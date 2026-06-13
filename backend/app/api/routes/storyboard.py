"""API routes for storyboard CRUD and story analysis."""

import uuid

from fastapi import APIRouter
from sqlmodel import Session, select

from app.api.deps import CurrentUser, SessionDep
from app.crud.helpers import get_owned_project, get_owned_storyboard
from app.crud.storyboard import get_storyboard_by_project
from app.models import Character, Scene, Setting, StoryBoard
from app.schemas.storyboard import (
    StoryBoardCreate,
    StoryBoardUpdate,
    StoryAnalysisResponse,
)
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
    get_owned_storyboard(session, storyboard_id, current_user.id)

    scenes = session.exec(
        select(Scene)
        .where(Scene.storyboard_id == storyboard_id)
        .order_by(Scene.sequence_number)
    ).all()
    return scenes


@router.post("/storyboards/{storyboard_id}/analyze", response_model=StoryAnalysisResponse)
async def analyze_story(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
    style: str = "cinematic",
    generate_images: bool = False,
) -> StoryAnalysisResponse:
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
    result = await service.analyze_story(
        storyboard_id=storyboard_id,
        user_id=current_user.id,
        style=style,
        generate_images=generate_images,
    )
    return StoryAnalysisResponse(
        characters_count=result.get("characters_count", 0),
        settings_count=result.get("settings_count", 0),
        scenes_count=result.get("scenes_count", 0),
        message=result.get("message", "Analysis complete"),
    )
