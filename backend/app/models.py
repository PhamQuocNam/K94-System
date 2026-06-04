import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import EmailStr
from sqlalchemy import DateTime, Numeric, String
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# User models
# ---------------------------------------------------------------------------

class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    projects: list["Project"] = Relationship(back_populates="user", cascade_delete=True)


class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# ---------------------------------------------------------------------------
# Item models
# ---------------------------------------------------------------------------

class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore[assignment]


class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# ---------------------------------------------------------------------------
# Auth / token models
# ---------------------------------------------------------------------------

class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


# ---------------------------------------------------------------------------
# Project models
# ---------------------------------------------------------------------------

class Project(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Foreign Keys
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")

    title: str | None = Field(default=None, max_length=255)
    type: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    total_cost: float = Field(default=0.0)
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    # Relationships
    user: User | None = Relationship(back_populates="projects")
    storyboard: Optional["StoryBoard"] = Relationship(
        back_populates="project",
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"},
    )
    media_list: List["MediaData"] = Relationship(
        back_populates="project",
        cascade_delete=True,
    )


# ---------------------------------------------------------------------------
# MediaData model
# ---------------------------------------------------------------------------

class MediaData(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Foreign Keys
    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False, ondelete="CASCADE")

    type: str = Field(default="", max_length=255)
    url: str | None = Field(default=None, max_length=2048)
    content: str | None = Field(default=None)
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    # Relationships
    project: Project | None = Relationship(back_populates="media_list")


# ---------------------------------------------------------------------------
# StoryBoard model
# ---------------------------------------------------------------------------

class StoryBoard(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Foreign Keys — unique=True enforces the one-to-one with Project
    project_id: uuid.UUID = Field(
        foreign_key="project.id", nullable=False, unique=True, ondelete="CASCADE"
    )

    content: str | None = Field(default=None)
    scenes: str | None = Field(default=None)
    style: str | None = Field(default=None, max_length=255)

    # Relationships
    project: Project | None = Relationship(back_populates="storyboard")
    characters: List["Character"] = Relationship(
        back_populates="storyboard",
        cascade_delete=True,
    )


# ---------------------------------------------------------------------------
# Character model
# ---------------------------------------------------------------------------

class Character(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Foreign Keys
    storyboard_id: uuid.UUID = Field(
        foreign_key="storyboard.id", nullable=False, ondelete="CASCADE"
    )

    name: str | None = Field(default=None, max_length=255)
    gender: str | None = Field(default=None, max_length=50)
    age: int | None = Field(default=None)
    body_build: str | None = Field(default=None, max_length=255)
    face: str | None = Field(default=None, max_length=255)
    hair: str | None = Field(default=None, max_length=255)
    clothes: str | None = Field(default=None, max_length=255)
    nationality: str | None = Field(default=None, max_length=255)
    source: str | None = Field(default=None, max_length=2048)

    # Relationships
    storyboard: StoryBoard | None = Relationship(back_populates="characters")