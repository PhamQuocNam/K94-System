"""Project CRUD operations."""

import uuid
from datetime import datetime
from sqlmodel import Session, select

from app.models import Project, get_datetime_utc
from app.schemas.project import ProjectCreate, ProjectUpdate


def create_project( session: Session, project_in: ProjectCreate, user_id: uuid.UUID) -> Project:
    """Create a new project.

    Args:
        session: Database session
        project_in: Project creation data
        user_id: ID of the user creating the project

    Returns:
        Created project
    """
    db_project = Project.model_validate(project_in, update={"user_id": user_id})
    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project


def update_project( session: Session, db_project: Project, project_in: ProjectUpdate) -> Project:
    """Update an existing project.

    Args:
        session: Database session
        db_project: Existing project to update
        project_in: Project update data

    Returns:
        Updated project
    """
    project_data = project_in.model_dump(exclude_unset=True)
    db_project.sqlmodel_update(project_data)
    db_project.updated_at = get_datetime_utc()
    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project


def get_project_by_id( session: Session, project_id: uuid.UUID) -> Project | None:
    """Get project by ID.

    Args:
        session: Database session
        project_id: Project UUID

    Returns:
        Project if found, None otherwise
    """
    return session.get(Project, project_id)


def get_projects_by_user( session: Session, user_id: uuid.UUID) -> list[Project]:
    """Get all projects for a user.

    Args:
        session: Database session
        user_id: User UUID

    Returns:
        List of projects owned by the user
    """
    statement = select(Project).where(Project.user_id == user_id).order_by(Project.created_at)
    return session.exec(statement).all()


def delete_project( session: Session, project_id: uuid.UUID) -> bool:
    """Delete a project by ID.

    Args:
        session: Database session
        project_id: Project UUID

    Returns:
        True if deleted, False if not found
    """
    project = session.get(Project, project_id)
    if not project:
        return False
    session.delete(project)
    session.commit()
    return True
