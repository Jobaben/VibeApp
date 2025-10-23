"""Result pattern for consistent API responses."""
from typing import Generic, TypeVar, Optional
from enum import Enum
from pydantic import BaseModel


class ErrorType(str, Enum):
    """Types of errors that can occur."""
    NOT_FOUND = "not_found"
    VALIDATION = "validation"
    UNAUTHORIZED = "unauthorized"
    FORBIDDEN = "forbidden"
    SERVER_ERROR = "server_error"


T = TypeVar('T')


class Result(BaseModel, Generic[T]):
    """Result wrapper for API responses."""
    is_success: bool
    value: Optional[T] = None
    error: Optional[str] = None
    error_type: Optional[ErrorType] = None

    @classmethod
    def success(cls, value: T) -> "Result[T]":
        """Create a successful result."""
        return cls(is_success=True, value=value)

    @classmethod
    def failure(cls, error: str, error_type: ErrorType = ErrorType.SERVER_ERROR) -> "Result[T]":
        """Create a failed result."""
        return cls(is_success=False, error=error, error_type=error_type)

    class Config:
        use_enum_values = True
