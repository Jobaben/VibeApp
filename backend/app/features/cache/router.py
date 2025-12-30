"""Cache management API endpoints."""
import logging
from typing import Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.infrastructure.cache import get_cache_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cache", tags=["cache"])


class CacheInvalidateRequest(BaseModel):
    """Request body for cache invalidation."""
    pattern: Optional[str] = None


class CacheStatusResponse(BaseModel):
    """Response for cache status check."""
    enabled: bool
    available: bool
    message: str


class CacheInvalidateResponse(BaseModel):
    """Response for cache invalidation."""
    success: bool
    keys_deleted: int
    message: str


@router.get("/status", response_model=CacheStatusResponse)
async def get_cache_status():
    """
    Check cache service status.

    Returns:
        Cache availability status
    """
    cache = get_cache_service()

    return CacheStatusResponse(
        enabled=cache.enabled,
        available=cache.is_available,
        message="Cache is operational" if cache.is_available else "Cache is not available"
    )


@router.post("/invalidate", response_model=CacheInvalidateResponse)
async def invalidate_cache(
    pattern: str = Query(
        default="*",
        description="Key pattern to invalidate (e.g., 'stocks:*', 'leaderboard:*', or '*' for all)"
    )
):
    """
    Invalidate cache entries matching a pattern.

    Use patterns like:
    - 'stocks:*' - All stock-related cache
    - 'stocks:list:*' - All stock list cache
    - 'stocks:detail:*' - All stock detail cache
    - 'leaderboard:*' - All leaderboard cache
    - '*' - Clear entire cache

    Args:
        pattern: Key pattern with wildcards

    Returns:
        Number of keys deleted
    """
    cache = get_cache_service()

    if not cache.is_available:
        return CacheInvalidateResponse(
            success=False,
            keys_deleted=0,
            message="Cache service is not available"
        )

    if pattern == "*":
        # Clear all
        success = cache.clear_all()
        return CacheInvalidateResponse(
            success=success,
            keys_deleted=-1,  # Unknown count for flush
            message="All cache entries cleared" if success else "Failed to clear cache"
        )

    deleted = cache.invalidate(pattern)
    return CacheInvalidateResponse(
        success=True,
        keys_deleted=deleted,
        message=f"Invalidated {deleted} cache entries matching '{pattern}'"
    )


@router.delete("/key/{key}")
async def delete_cache_key(key: str):
    """
    Delete a specific cache key.

    Args:
        key: Exact cache key to delete

    Returns:
        Success status
    """
    cache = get_cache_service()

    if not cache.is_available:
        return {"success": False, "message": "Cache service is not available"}

    success = cache.delete(key)
    return {
        "success": success,
        "message": f"Key '{key}' deleted" if success else f"Key '{key}' not found or delete failed"
    }
