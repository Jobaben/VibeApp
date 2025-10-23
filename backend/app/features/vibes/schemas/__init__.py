"""Vibe schemas (DTOs)."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from app.features.vibes.models import VibeType


class CreateVibeCommand(BaseModel):
    """Command for creating a new vibe."""
    content: str = Field(..., min_length=1, max_length=500, description="The vibe content")
    user_id: UUID = Field(..., description="The user ID who creates the vibe")
    media_url: Optional[str] = Field(None, max_length=2048, description="Optional media URL")
    type: VibeType = Field(default=VibeType.TEXT, description="Type of vibe")
    is_public: bool = Field(default=True, description="Whether the vibe is public")

    @field_validator('media_url')
    @classmethod
    def validate_media_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate media URL if provided."""
        if v and len(v) > 2048:
            raise ValueError("Media URL must not exceed 2048 characters")
        return v


class VibeResponse(BaseModel):
    """Response model for a vibe."""
    id: UUID
    content: str
    user_id: UUID
    media_url: Optional[str] = None
    type: VibeType
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    is_public: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateVibeCommand(BaseModel):
    """Command for updating a vibe."""
    content: Optional[str] = Field(None, min_length=1, max_length=500)
    media_url: Optional[str] = Field(None, max_length=2048)
    is_public: Optional[bool] = None


__all__ = ["CreateVibeCommand", "VibeResponse", "UpdateVibeCommand", "VibeType"]
