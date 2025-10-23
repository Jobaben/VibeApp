"""Vibe repository for data access."""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.features.vibes.models import Vibe


class VibeRepository:
    """Repository for Vibe entity."""

    def __init__(self, db: Session):
        self.db = db

    async def add(self, vibe: Vibe) -> Vibe:
        """Add a new vibe to the database."""
        self.db.add(vibe)
        self.db.commit()
        self.db.refresh(vibe)
        return vibe

    async def get_by_id(self, vibe_id: UUID) -> Optional[Vibe]:
        """Get a vibe by ID."""
        return self.db.query(Vibe).filter(
            Vibe.id == vibe_id,
            Vibe.is_deleted == False
        ).first()

    async def get_by_user_id(self, user_id: UUID) -> List[Vibe]:
        """Get all vibes for a specific user."""
        return self.db.query(Vibe).filter(
            Vibe.user_id == user_id,
            Vibe.is_deleted == False
        ).order_by(desc(Vibe.created_at)).all()

    async def get_trending(self, count: int = 10) -> List[Vibe]:
        """Get trending vibes based on likes and comments."""
        return self.db.query(Vibe).filter(
            Vibe.is_deleted == False,
            Vibe.is_public == True
        ).order_by(
            desc(Vibe.likes_count + Vibe.comments_count)
        ).limit(count).all()

    async def get_all_public(self, skip: int = 0, limit: int = 20) -> List[Vibe]:
        """Get all public vibes with pagination."""
        return self.db.query(Vibe).filter(
            Vibe.is_deleted == False,
            Vibe.is_public == True
        ).order_by(desc(Vibe.created_at)).offset(skip).limit(limit).all()

    async def update(self, vibe: Vibe) -> Vibe:
        """Update a vibe."""
        self.db.commit()
        self.db.refresh(vibe)
        return vibe

    async def delete(self, vibe_id: UUID) -> bool:
        """Soft delete a vibe."""
        vibe = await self.get_by_id(vibe_id)
        if vibe:
            vibe.is_deleted = True
            self.db.commit()
            return True
        return False
