"""Scene-related schemas."""

import uuid
from sqlmodel import Field, SQLModel


class SceneBase(SQLModel):
    """Base scene schema."""
    title: str | None = Field(default=None, max_length=255)
    sequence_number: float = Field(default=0.0)
    narrative_description: str | None = Field(default=None)
    visual_description: str | None = Field(default=None)
    visual_prompt: str | None = Field(default=None)
    scene_type: str | None = Field(default=None, max_length=100)
    mood: str | None = Field(default=None, max_length=100)
    reference_image_url: str | None = Field(default=None, max_length=2048)
    reference_video_url: str | None = Field(default=None, max_length=2048)


class SceneCreate(SceneBase):
    """Request model for creating a scene."""
    storyboard_id: uuid.UUID
    setting_id: uuid.UUID | None = Field(default=None)


class SceneUpdate(SQLModel):
    """Request model for updating a scene."""
    title: str | None = Field(default=None, max_length=255)
    sequence_number: float | None = Field(default=None)
    narrative_description: str | None = Field(default=None)
    visual_description: str | None = Field(default=None)
    visual_prompt: str | None = Field(default=None)
    scene_type: str | None = Field(default=None, max_length=100)
    mood: str | None = Field(default=None, max_length=100)
    setting_id: uuid.UUID | None = Field(default=None)
    reference_image_url: str | None = Field(default=None, max_length=2048)
    reference_video_url: str | None = Field(default=None, max_length=2048)
