"""Shared authentication dependencies for admin-only endpoints."""
import secrets

from fastapi import Header, HTTPException, status

from app.config import settings


async def require_admin(
    x_admin_token: str = Header(default="", alias="X-Admin-Token")
) -> None:
    """Guard mutating admin endpoints (imports, score recalculation, cache flush).

    Behavior:
    - ADMIN_API_KEY configured: the request must send a matching X-Admin-Token
      header (constant-time comparison).
    - ADMIN_API_KEY empty in development: open, for local convenience.
    - ADMIN_API_KEY empty in production: admin endpoints are disabled (503)
      rather than silently left open.
    """
    if not settings.ADMIN_API_KEY:
        if settings.ENVIRONMENT == "production":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Admin endpoints are disabled: ADMIN_API_KEY is not configured.",
            )
        return
    if not secrets.compare_digest(x_admin_token, settings.ADMIN_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-Token header.",
        )
