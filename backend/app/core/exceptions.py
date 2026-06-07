"""Custom exception hierarchy for the application."""

from typing import Any


class AppException(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, error_code: str | None = None):
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        super().__init__(message)


class NotFoundException(AppException):
    """Entity not found - HTTP 404."""

    def __init__(self, entity_type: str, entity_id: Any = None):
        message = f"{entity_type} not found"
        if entity_id is not None:
            message += f" (id: {entity_id})"
        super().__init__(message, "NOT_FOUND")
        self.entity_type = entity_type
        self.entity_id = entity_id


class ForbiddenException(AppException):
    """Authorization failed - HTTP 403."""

    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, "FORBIDDEN")


class DuplicateResourceException(AppException):
    """Resource already exists - HTTP 409."""

    def __init__(self, entity_type: str, field: str, value: Any):
        message = f"{entity_type} with {field}='{value}' already exists"
        super().__init__(message, "DUPLICATE_RESOURCE")
        self.entity_type = entity_type
        self.field = field
        self.value = value


class BusinessRuleException(AppException):
    """Business rule violation - HTTP 400."""

    def __init__(self, message: str):
        super().__init__(message, "BUSINESS_RULE_VIOLATION")


class UnauthorizedException(AppException):
    """Authentication failed - HTTP 401."""

    def __init__(self, message: str = "Could not validate credentials"):
        super().__init__(message, "UNAUTHORIZED")


class ValidationException(AppException):
    """Validation error - HTTP 422."""

    def __init__(self, message: str, field: str | None = None):
        super().__init__(message, "VALIDATION_ERROR")
        self.field = field


class ConflictException(AppException):
    """Resource conflict - HTTP 409."""

    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, "CONFLICT")
