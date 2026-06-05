"""API routes for storyboard and story analysis."""

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Character, Scene, Setting, StoryBoard
from app.services.story_analysis import StoryAnalysisService

router = APIRouter()


class StoryBoardCreate(BaseModel):
    """Request model for creating a storyboard."""

    project_id: uuid.UUID
    content: str
    style: str | None = "cinematic"


class StoryBoardUpdate(BaseModel):
    """Request model for updating a storyboard."""

    content: str | None = None
    style: str | None = None


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
    from app.models import Project

    # Verify project belongs to user
    project = session.get(Project, storyboard_in.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Check if storyboard already exists for this project
    existing = session.exec(
        select(StoryBoard).where(StoryBoard.project_id == storyboard_in.project_id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Storyboard already exists for this project",
        )

    storyboard = StoryBoard(
        project_id=storyboard_in.project_id,
        content=storyboard_in.content,
        style=storyboard_in.style,
    )
    session.add(storyboard)
    session.commit()
    session.refresh(storyboard)
    return storyboard


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
    storyboard = session.get(StoryBoard, storyboard_id)
    if not storyboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storyboard not found",
        )

    # Verify ownership through project
    from app.models import Project

    project = session.get(Project, storyboard.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this storyboard",
        )

    return storyboard


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
    storyboard = session.get(StoryBoard, storyboard_id)
    if not storyboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storyboard not found",
        )

    # Verify ownership
    from app.models import Project

    project = session.get(Project, storyboard.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

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
    storyboard = session.get(StoryBoard, storyboard_id)
    if not storyboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storyboard not found",
        )

    # Verify ownership
    from app.models import Project

    project = session.get(Project, storyboard.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

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
    storyboard = session.get(StoryBoard, storyboard_id)
    if not storyboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storyboard not found",
        )

    # Verify ownership
    from app.models import Project

    project = session.get(Project, storyboard.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    scenes = session.exec(
        select(Scene)
        .where(Scene.storyboard_id == storyboard_id)
        .order_by(Scene.sequence_number)
    ).all()
    return scenes


@router.post("/storyboards/{storyboard_id}/analyze")
async def analyze_story(
    session: SessionDep,
    current_user: CurrentUser,
    storyboard_id: uuid.UUID,
    style: str = "cinematic",
    generate_images: bool = True,
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
    storyboard = session.get(StoryBoard, storyboard_id)
    if not storyboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storyboard not found",
        )

    # Verify ownership
    from app.models import Project

    project = session.get(Project, storyboard.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    if not storyboard.content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Storyboard content is empty",
        )

    # Run story analysis
    service = StoryAnalysisService(session)
    result = await service.analyze_story(
        storyboard_id=storyboard_id,
        story_content=storyboard.content,
        style=style,
        generate_images=generate_images,
    )

    return result
