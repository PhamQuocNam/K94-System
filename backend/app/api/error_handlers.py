"""Global exception handlers for the FastAPI application."""

from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

from app.core.exceptions import (
    AppException,
    BusinessRuleException,
    ConflictException,
    DuplicateResourceException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle all custom application exceptions."""
    status_code = _get_status_code_for_exception(exc)
    return JSONResponse(
        status_code=status_code,
        content={"detail": exc.message, "error_code": exc.error_code},
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle standard HTTP exceptions with consistent format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": "HTTP_ERROR"},
    )


def _get_status_code_for_exception(exc: AppException) -> int:
    """Map exception type to HTTP status code."""
    if isinstance(exc, NotFoundException):
        return status.HTTP_404_NOT_FOUND
    if isinstance(exc, ForbiddenException):
        return status.HTTP_403_FORBIDDEN
    if isinstance(exc, UnauthorizedException):
        return status.HTTP_401_UNAUTHORIZED
    if isinstance(exc, DuplicateResourceException):
        return status.HTTP_409_CONFLICT
    if isinstance(exc, ConflictException):
        return status.HTTP_409_CONFLICT
    if isinstance(exc, ValidationException):
        return status.HTTP_422_UNPROCESSABLE_ENTITY
    if isinstance(exc, BusinessRuleException):
        return status.HTTP_400_BAD_REQUEST
    return status.HTTP_500_INTERNAL_SERVER_ERROR


def register_exception_handlers(app) -> None:
    """Register all exception handlers with the FastAPI app."""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
