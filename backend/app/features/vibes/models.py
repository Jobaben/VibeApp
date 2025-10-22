"""Vibe entity model."""
from enum import Enum
from sqlalchemy import Column, String, Integer, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.shared.models.base import BaseEntity


class VibeType(str, Enum):
    """Types of vibes."""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class Vibe(BaseEntity):
    """Vibe entity representing a social media post."""

    __tablename__ = "vibes"

    content = Column(String(500), nullable=False)
    user_id = Column(PGUUID(as_uuid=True), nullable=False)
    media_url = Column(String(2048), nullable=True)
    type = Column(SQLEnum(VibeType), nullable=False, default=VibeType.TEXT)
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)
    shares_count = Column(Integer, default=0, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
