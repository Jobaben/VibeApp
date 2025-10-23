"""Shared models package."""
from app.shared.models.base import BaseEntity
from app.shared.models.result import Result, ErrorType

__all__ = ["BaseEntity", "Result", "ErrorType"]
