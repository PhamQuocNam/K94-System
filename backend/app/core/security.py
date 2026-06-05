from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers import argon2, bcrypt

from app.core.config import settings

# Configure argon2 as default hasher with bcrypt as legacy for migration
password_hasher = argon2.Argon2Hasher(memory_cost=65536, time_cost=3, parallelism=4)
legacy_hasher = bcrypt.BcryptHasher()

ALGORITHM = "HS256"


def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_password_hash(password: str) -> str:
    return str(password_hasher.hash(password))


def verify_password(
    plain_password: str, hashed_password: str
) -> tuple[bool, str | None]:
    """
    Verify password and handle hash migration from bcrypt to argon2.

    Returns:
        tuple[bool, str | None]: (is_valid, updated_hash)
        - is_valid: True if password is correct
        - updated_hash: New argon2 hash if password was bcrypt and needs upgrade, None otherwise
    """
    # Check if the hash is a bcrypt hash (starts with $2)
    if hashed_password.startswith("$2"):
        # Legacy bcrypt hash - verify with bcrypt and upgrade to argon2
        try:
            verified = legacy_hasher.verify(plain_password, hashed_password)
            if verified:
                # Upgrade to argon2 hash
                new_hash = str(password_hasher.hash(plain_password))
                return True, new_hash
            return False, None
        except Exception:
            return False, None
    else:
        # Argon2 hash - verify with argon2
        try:
            result = password_hasher.verify(plain_password, hashed_password)
            return bool(result), None
        except Exception:
            return False, None
