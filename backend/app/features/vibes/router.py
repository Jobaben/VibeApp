"""Vibes API router."""
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.features.vibes.schemas import CreateVibeCommand, VibeResponse
from app.features.vibes.commands.create_vibe import CreateVibeHandler
from app.features.vibes.queries.get_vibes import (
    GetVibeByIdHandler,
    GetVibesByUserIdHandler,
    GetTrendingVibesHandler
)
from app.infrastructure.repositories import VibeRepository
from app.infrastructure.database import get_db
from app.shared.models import ErrorType

router = APIRouter(prefix="/vibes", tags=["vibes"])


def get_vibe_repository(db: Session = Depends(get_db)) -> VibeRepository:
    """Dependency for getting vibe repository."""
    return VibeRepository(db)


@router.post("/", response_model=VibeResponse, status_code=status.HTTP_201_CREATED)
async def create_vibe(
    command: CreateVibeCommand,
    repository: VibeRepository = Depends(get_vibe_repository)
):
    """Create a new vibe."""
    handler = CreateVibeHandler(repository)
    result = await handler.handle(command)

    if not result.is_success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.error
        )

    return result.value


@router.get("/{vibe_id}", response_model=VibeResponse)
async def get_vibe(
    vibe_id: UUID,
    repository: VibeRepository = Depends(get_vibe_repository)
):
    """Get a vibe by ID."""
    handler = GetVibeByIdHandler(repository)
    result = await handler.handle(vibe_id)

    if not result.is_success:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if result.error_type == ErrorType.NOT_FOUND
            else status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        raise HTTPException(status_code=status_code, detail=result.error)

    return result.value


@router.get("/user/{user_id}", response_model=List[VibeResponse])
async def get_user_vibes(
    user_id: UUID,
    repository: VibeRepository = Depends(get_vibe_repository)
):
    """Get all vibes for a specific user."""
    handler = GetVibesByUserIdHandler(repository)
    result = await handler.handle(user_id)

    if not result.is_success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.error
        )

    return result.value


@router.get("/trending/", response_model=List[VibeResponse])
async def get_trending_vibes(
    count: int = 10,
    repository: VibeRepository = Depends(get_vibe_repository)
):
    """Get trending vibes."""
    handler = GetTrendingVibesHandler(repository)
    result = await handler.handle(count)

    if not result.is_success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.error
        )

    return result.value
