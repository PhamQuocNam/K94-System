import random
import string

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings


def random_lower_string() -> str:
    return "".join(random.choices(string.ascii_lowercase, k=32))


def random_email() -> str:
    return f"{random_lower_string()}@{random_lower_string()}.com"


def get_superuser_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    """Get superuser authentication headers for API testing."""
    from sqlmodel import select

    from app import crud
    from app.core.security import create_access_token, get_password_hash
    from app.models import User
    from app.schemas.user import UserUpdate
    from datetime import timedelta

    # Ensure superuser exists in test database
    superuser = crud.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)

    if not superuser:
        # Create superuser directly for test environment
        from app.schemas.user import UserCreate
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD
        )
        superuser = crud.create_user(session=db, user_create=user_in)
    else:
        # Reset password to known value
        user_in_update = UserUpdate(password=settings.FIRST_SUPERUSER_PASSWORD)
        if not superuser.id:
            raise Exception("Superuser id not set")
        superuser = crud.update_user(session=db, db_user=superuser, user_in=user_in_update)

    # Login with OAuth2
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)

    if r.status_code == 200:
        tokens = r.json()
        a_token = tokens["access_token"]
        headers = {"Authorization": f"Bearer {a_token}"}
    else:
        # Fallback: create token directly for test environment
        if not superuser.id:
            raise Exception("Superuser id not set")
        access_token = create_access_token(
            data={"sub": str(superuser.id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        headers = {"Authorization": f"Bearer {access_token}"}

    return headers
