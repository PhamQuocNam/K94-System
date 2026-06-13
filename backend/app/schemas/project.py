"""Project-related schemas."""
from datetime import datetime
from typing import Literal

import uuid
from sqlmodel import Field, SQLModel


class ProjectBase(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    type: Literal["storyboard"] | None = Field(default="storyboard")
    status: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    total_cost: float = Field(default=0.0)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    title: str | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    type: Literal["storyboard"] | None = Field(default=None)  # type: ignore[assignment]
    status: str | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    description: str | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    total_cost: float | None = Field(default=None)


class ProjectPublic(ProjectBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProjectsPublic(SQLModel):
    data: list[ProjectPublic]
    count: int
