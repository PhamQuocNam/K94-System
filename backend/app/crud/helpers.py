"""Ownership verification helpers for CRUD operations."""

import uuid
from sqlmodel import Session

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models import Project, StoryBoard


def get_owned_project(session: Session, project_id: uuid.UUID, user_id: uuid.UUID) -> Project:
    """Get project and verify ownership.

    Args:
        session: Database session
        project_id: Project UUID to fetch
        user_id: User UUID to verify ownership

    Returns:
        Project if found and owned by user

    Raises:
        NotFoundException: If project not found
        ForbiddenException: If user doesn't own the project
    """
    project = session.get(Project, project_id)
    if not project:
        raise NotFoundException("Project", project_id)
    if project.user_id != user_id:
        raise ForbiddenException("Not authorized to access this project")
    return project


def get_owned_storyboard(session: Session, storyboard_id: uuid.UUID, user_id: uuid.UUID) -> StoryBoard:
    """Get storyboard and verify ownership through project.

    Args:
        session: Database session
        storyboard_id: Storyboard UUID to fetch
        user_id: User UUID to verify ownership

    Returns:
        Storyboard if found and owned by user (through project)

    Raises:
        NotFoundException: If storyboard not found
        ForbiddenException: If user doesn't own the storyboard
    """
    storyboard = session.get(StoryBoard, storyboard_id)
    if not storyboard:
        raise NotFoundException("Storyboard", storyboard_id)
    # Verify ownership through project
    project = session.get(Project, storyboard.project_id)
    if not project or project.user_id != user_id:
        raise ForbiddenException("Not authorized to access this storyboard")
    return storyboard
