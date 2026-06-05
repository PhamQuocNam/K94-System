"""Storyboard-related schemas."""
from datetime import datetime

import uuid
from typing import List, Optional
from sqlmodel import Field, SQLModel


class StoryBoardCreate(SQLModel):
    """Request model for creating a storyboard."""
    project_id: uuid.UUID
    content: str
    style: str | None = "cinematic"


class StoryBoardUpdate(SQLModel):
    """Request model for updating a storyboard."""
    content: str | None = None
    style: str | None = None


class StoryBoardPublic(SQLModel):
    """Public representation of a storyboard."""
    id: uuid.UUID
    project_id: uuid.UUID
    content: str | None = None
    scenes_json: str | None = None
    style: str | None = None


class CharacterPublic(SQLModel):
    """Public representation of a character."""
    id: uuid.UUID
    storyboard_id: uuid.UUID
    name: str | None = None
    gender: str | None = None
    age: int | None = None
    body_build: str | None = None
    face: str | None = None
    hair: str | None = None
    clothes: str | None = None
    nationality: str | None = None
    source: str | None = None
    reference_image_url: str | None = None


class SettingPublic(SQLModel):
    """Public representation of a setting."""
    id: uuid.UUID
    storyboard_id: uuid.UUID
    scene_start: int | None = None
    scene_end: int | None = None
    name: str | None = None
    description: str | None = None
    time_of_day: str | None = None
    weather: str | None = None
    art_style: str | None = None
    reference_image_url: str | None = None


class ScenePublic(SQLModel):
    """Public representation of a scene."""
    id: uuid.UUID
    storyboard_id: uuid.UUID
    setting_id: uuid.UUID | None = None
    title: str | None = None
    sequence_number: int = 0
    visual_prompt: str | None = None
    scene_type: str | None = None
    reference_image_url: str | None = None
    reference_video_url: str | None = None
