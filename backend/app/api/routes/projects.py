"""API routes for project CRUD operations."""

import uuid
from typing import Any

from fastapi import APIRouter, status
from sqlmodel import Session

from app.api.deps import CurrentUser, SessionDep
from app.models import Project
from app.schemas.auth import Message
from app.schemas.project import ProjectCreate, ProjectPublic, ProjectsPublic, ProjectUpdate
from app.services.project import ProjectService

router = APIRouter()


@router.post("/projects", response_model=ProjectPublic)
def create_project_endpoint(
    session: SessionDep,
    current_user: CurrentUser,
    project_in: ProjectCreate,
) -> Project:
    """Create a new project for the authenticated user.

    Args:
        session: Database session
        current_user: Authenticated user
        project_in: Project creation data

    Returns:
        Created project
    """
    service = ProjectService(session)
    return service.create_project(project_in=project_in, user_id=current_user.id)


@router.get("/projects", response_model=ProjectsPublic)
def list_projects(
    session: SessionDep,
    current_user: CurrentUser,
    offset: int = 0,
    limit: int = 100,
) -> dict[str, Any]:
    """List all projects for the authenticated user.

    Args:
        session: Database session
        current_user: Authenticated user
        offset: Pagination offset
        limit: Maximum items to return

    Returns:
        Dictionary containing projects list and count
    """
    service = ProjectService(session)
    projects, total = service.list_projects(user_id=current_user.id, offset=offset, limit=limit)
    return ProjectsPublic(data=projects, count=total)


@router.get("/projects/{project_id}", response_model=ProjectPublic)
def get_project(
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
) -> Project:
    """Get a specific project by ID.

    Args:
        session: Database session
        current_user: Authenticated user
        project_id: Project UUID

    Returns:
        Project if found and owned by user
    """
    service = ProjectService(session)
    return service.get_project(project_id=project_id, user_id=current_user.id)


@router.patch("/projects/{project_id}", response_model=ProjectPublic)
def update_project_endpoint(
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    project_in: ProjectUpdate,
) -> Project:
    """Update a project.

    Args:
        session: Database session
        current_user: Authenticated user
        project_id: Project UUID
        project_in: Project update data

    Returns:
        Updated project
    """
    service = ProjectService(session)
    return service.update_project(project_id=project_id, user_id=current_user.id, project_in=project_in)


@router.delete("/projects/{project_id}")
def delete_project_endpoint(
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
) -> Message:
    """Delete a project.

    Args:
        session: Database session
        current_user: Authenticated user
        project_id: Project UUID

    Returns:
        Success message
    """
    service = ProjectService(session)
    service.delete_project(project_id=project_id, user_id=current_user.id)
    return Message(message="Project deleted successfully")
