"""MediaData-related schemas."""

import uuid
from sqlmodel import Field, SQLModel


class MediaDataPublic(SQLModel):
    """Public representation of media data."""
    id: uuid.UUID
    project_id: uuid.UUID
    type: str
    url: str | None = None
    content: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class MediaDataCreate(SQLModel):
    """Request model for creating media data."""
    project_id: uuid.UUID
    type: str = Field(default="", max_length=255)
    url: str | None = Field(default=None, max_length=2048)
    content: str | None = Field(default=None)


class MediaDataUpdate(SQLModel):
    """Request model for updating media data."""
    type: str | None = Field(default=None, max_length=255)
    url: str | None = Field(default=None, max_length=2048)
    content: str | None = Field(default=None)
