"""API routes for project CRUD operations."""

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import CurrentUser, SessionDep
from app.crud import create_project, delete_project, get_project_by_id, get_projects_by_user, update_project
from app.models import Project
from app.schemas.auth import Message
from app.schemas.project import ProjectCreate, ProjectPublic, ProjectsPublic, ProjectUpdate

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
    project = create_project(session=session, project_in=project_in, user_id=current_user.id)
    return project


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
    projects = get_projects_by_user(session=session, user_id=current_user.id)
    # Apply pagination
    paginated_projects = projects[offset : offset + limit]
    return ProjectsPublic(data=paginated_projects, count=len(projects))


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

    Raises:
        HTTPException 404: If project not found or not owned by user
    """
    project = get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project",
        )
    return project


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

    Raises:
        HTTPException 404: If project not found or not owned by user
    """
    project = get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this project",
        )
    return update_project(session=session, db_project=project, project_in=project_in)


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

    Raises:
        HTTPException 404: If project not found or not owned by user
    """
    project = get_project_by_id(session=session, project_id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project",
        )
    delete_project(session=session, project_id=project_id)
    return Message(message="Project deleted successfully")
