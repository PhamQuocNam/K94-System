"""Setting-related schemas."""

import uuid
from sqlmodel import Field, SQLModel


class SettingBase(SQLModel):
    """Base setting schema."""
    scene_start: int | None = Field(default=None)
    scene_end: int | None = Field(default=None)
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None)
    time_of_day: str | None = Field(default=None, max_length=100)
    weather: str | None = Field(default=None, max_length=100)
    art_style: str | None = Field(default=None, max_length=255)
    reference_image_url: str | None = Field(default=None, max_length=2048)


class SettingCreate(SettingBase):
    """Request model for creating a setting."""
    storyboard_id: uuid.UUID


class SettingUpdate(SQLModel):
    """Request model for updating a setting."""
    scene_start: int | None = Field(default=None)
    scene_end: int | None = Field(default=None)
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None)
    time_of_day: str | None = Field(default=None, max_length=100)
    weather: str | None = Field(default=None, max_length=100)
    art_style: str | None = Field(default=None, max_length=255)
    reference_image_url: str | None = Field(default=None, max_length=2048)
