"""Project service layer."""

import uuid
from typing import Any

from sqlmodel import Session, select

from app.crud.helpers import get_owned_project
from app.crud.project import (
    create_project,
    delete_project,
    get_project_by_id,
    get_projects_by_user,
    update_project,
)
from app.models import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    """Business logic for project operations."""

    def __init__(self, session: Session):
        self.session = session

    def create_project(self, project_in: ProjectCreate, user_id: uuid.UUID) -> Project:
        """Create a new project.

        Args:
            project_in: Project creation data
            user_id: User UUID creating the project

        Returns:
            Created project
        """
        return create_project(session=self.session, project_in=project_in, user_id=user_id)

    def get_project(self, project_id: uuid.UUID, user_id: uuid.UUID) -> Project:
        """Get a project with ownership verification.

        Args:
            project_id: Project UUID
            user_id: User UUID requesting access

        Returns:
            Project if found and owned by user

        Raises:
            NotFoundException: If project not found
            ForbiddenException: If user doesn't own the project
        """
        return get_owned_project(self.session, project_id, user_id)

    def list_projects(
        self, user_id: uuid.UUID, offset: int = 0, limit: int = 100
    ) -> tuple[list[Project], int]:
        """List projects for a user with pagination.

        Args:
            user_id: User UUID
            offset: Pagination offset
            limit: Maximum items to return

        Returns:
            Tuple of (projects list, total count)
        """
        # Get total count
        count_statement = select(Project).where(Project.user_id == user_id)
        total = len(self.session.exec(count_statement).all())

        # Get paginated results
        projects = get_projects_by_user(session=self.session, user_id=user_id)
        paginated = projects[offset : offset + limit]

        return paginated, total

    def update_project(
        self, project_id: uuid.UUID, user_id: uuid.UUID, project_in: ProjectUpdate
    ) -> Project:
        """Update a project with ownership verification.

        Args:
            project_id: Project UUID
            user_id: User UUID requesting update
            project_in: Project update data

        Returns:
            Updated project

        Raises:
            NotFoundException: If project not found
            ForbiddenException: If user doesn't own the project
        """
        db_project = get_owned_project(self.session, project_id, user_id)
        return update_project(self.session, db_project, project_in)

    def delete_project(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a project with ownership verification.

        Args:
            project_id: Project UUID
            user_id: User UUID requesting deletion

        Returns:
            True if deleted

        Raises:
            NotFoundException: If project not found
            ForbiddenException: If user doesn't own the project
        """
        get_owned_project(self.session, project_id, user_id)
        return delete_project(self.session, project_id)
