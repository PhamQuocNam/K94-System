"""User CRUD operations."""

from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import User
from app.schemas.user import UserCreate, UserUpdate


def create_user( session: Session, user_create: UserCreate) -> User:
    """Create a new user.

    Args:
        session: Database session
        user_create: User creation data

    Returns:
        Created user
    """
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user( session: Session, db_user: User, user_in: UserUpdate) -> User:
    """Update an existing user.

    Args:
        session: Database session
        db_user: Existing user to update
        user_in: User update data

    Returns:
        Updated user
    """
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email( session: Session, email: str) -> User | None:
    """Get user by email.

    Args:
        session: Database session
        email: User email

    Returns:
        User if found, None otherwise
    """
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


# Dummy hash to use for timing attack prevention when user is not found
# This is an Argon2 hash of a random password, used to ensure constant-time comparison
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


def authenticate( session: Session, email: str, password: str) -> User | None:
    """Authenticate a user with email and password.

    Args:
        session: Database session
        email: User email
        password: User password

    Returns:
        User if authenticated, None otherwise
    """
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        # Prevent timing attacks by running password verification even when user doesn't exist
        # This ensures the response time is similar whether or not the email exists
        verify_password(password, DUMMY_HASH)
        return None
    verified, new_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    # If password hash was upgraded from bcrypt to argon2, save the new hash
    if new_hash:
        db_user.hashed_password = new_hash
        session.add(db_user)
        session.commit()
    return db_user
