"""Character-related schemas."""

import uuid
from sqlmodel import Field, SQLModel


class CharacterBase(SQLModel):
    """Base character schema."""
    name: str | None = Field(default=None, max_length=255)
    gender: str | None = Field(default=None, max_length=50)
    age: int | None = Field(default=None)
    body_build: str | None = Field(default=None, max_length=255)
    face: str | None = Field(default=None, max_length=255)
    hair: str | None = Field(default=None, max_length=255)
    clothes: str | None = Field(default=None, max_length=255)
    nationality: str | None = Field(default=None, max_length=255)
    source: str | None = Field(default=None, max_length=2048)
    reference_image_url: str | None = Field(default=None, max_length=2048)


class CharacterCreate(CharacterBase):
    """Request model for creating a character."""
    storyboard_id: uuid.UUID


class CharacterUpdate(SQLModel):
    """Request model for updating a character."""
    name: str | None = Field(default=None, max_length=255)
    gender: str | None = Field(default=None, max_length=50)
    age: int | None = Field(default=None)
    body_build: str | None = Field(default=None, max_length=255)
    face: str | None = Field(default=None, max_length=255)
    hair: str | None = Field(default=None, max_length=255)
    clothes: str | None = Field(default=None, max_length=255)
    nationality: str | None = Field(default=None, max_length=255)
    source: str | None = Field(default=None, max_length=2048)
    reference_image_url: str | None = Field(default=None, max_length=2048)
