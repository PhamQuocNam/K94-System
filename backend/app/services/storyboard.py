"""StoryBoard service layer."""

import uuid
from typing import Any

from sqlmodel import Session

from app.core.exceptions import BusinessRuleException, DuplicateResourceException
from app.crud.helpers import get_owned_storyboard
from app.crud.storyboard import (
    create_storyboard,
    delete_storyboard_analysis,
    get_storyboard_by_project,
    update_storyboard,
)
from app.models import StoryBoard
from app.schemas.storyboard import StoryBoardCreate, StoryBoardUpdate


class StoryboardService:
    """Business logic for storyboard operations."""

    def __init__(self, session: Session):
        self.session = session

    def create_storyboard(
        self, project_id: uuid.UUID, user_id: uuid.UUID, storyboard_in: StoryBoardCreate
    ) -> StoryBoard:
        """Create a new storyboard with duplicate check.

        Args:
            project_id: Project UUID
            user_id: User UUID creating the storyboard
            storyboard_in: Storyboard creation data

        Returns:
            Created storyboard

        Raises:
            DuplicateResourceException: If storyboard already exists for project
        """
        # Check for existing storyboard
        existing = get_storyboard_by_project(session = self.session, project_id = project_id)
        if existing:
            raise DuplicateResourceException("Storyboard", "project_id", project_id)

        return create_storyboard(session=self.session, storyboard_in=storyboard_in)

    def get_storyboard(self, storyboard_id: uuid.UUID, user_id: uuid.UUID) -> StoryBoard:
        """Get a storyboard with ownership verification.

        Args:
            storyboard_id: Storyboard UUID
            user_id: User UUID requesting access

        Returns:
            Storyboard if found and owned by user

        Raises:
            NotFoundException: If storyboard not found
            ForbiddenException: If user doesn't own the storyboard
        """
        return get_owned_storyboard(self.session, storyboard_id, user_id)

    def update_storyboard(
        self, storyboard_id: uuid.UUID, user_id: uuid.UUID, storyboard_in: StoryBoardUpdate
    ) -> StoryBoard:
        """Update a storyboard with ownership verification.

        Args:
            storyboard_id: Storyboard UUID
            user_id: User UUID requesting update
            storyboard_in: Storyboard update data

        Returns:
            Updated storyboard

        Raises:
            NotFoundException: If storyboard not found
            ForbiddenException: If user doesn't own the storyboard
        """
        db_storyboard = get_owned_storyboard(self.session, storyboard_id, user_id)
        return update_storyboard(self.session, db_storyboard, storyboard_in)

    async def analyze_story(
        self, storyboard_id: uuid.UUID, user_id: uuid.UUID, style: str = "cinematic", generate_images: bool = False
    ) -> dict[str, Any]:
        """Analyze story content and extract characters, settings, and scenes.

        Args:
            storyboard_id: Storyboard UUID
            user_id: User UUID requesting analysis
            style: Art style for image generation
            generate_images: Whether to generate reference images

        Returns:
            Analysis results with counts

        Raises:
            NotFoundException: If storyboard not found
            ForbiddenException: If user doesn't own the storyboard
            BusinessRuleException: If content is too short
        """
        from app.services.story_analysis import StoryAnalysisService

        storyboard = get_owned_storyboard(self.session, storyboard_id, user_id)

        if not storyboard.content or not storyboard.content.strip():
            raise BusinessRuleException("Storyboard content is empty")

        if len(storyboard.content.strip()) < 50:
            raise BusinessRuleException(
                "Story content is too short. Please provide a full story (at least 50 characters)."
            )

        # Delete existing analysis before re-analyzing
        delete_storyboard_analysis(self.session, storyboard_id)

        # Run story analysis
        service = StoryAnalysisService(self.session)
        result = await service.analyze_story(
            storyboard_id=storyboard_id,
            story_content=storyboard.content,
            style=style,
            generate_images=generate_images,
        )

        return result
