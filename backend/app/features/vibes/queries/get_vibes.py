"""Get vibes query handlers."""
from typing import List
from uuid import UUID
from app.features.vibes.schemas import VibeResponse
from app.infrastructure.repositories import VibeRepository
from app.shared.models import Result, ErrorType


class GetVibeByIdHandler:
    """Handler for getting a vibe by ID."""

    def __init__(self, repository: VibeRepository):
        self.repository = repository

    async def handle(self, vibe_id: UUID) -> Result[VibeResponse]:
        """Get a vibe by ID."""
        try:
            vibe = await self.repository.get_by_id(vibe_id)

            if not vibe:
                return Result.failure(
                    error=f"Vibe with ID {vibe_id} not found",
                    error_type=ErrorType.NOT_FOUND
                )

            return Result.success(VibeResponse.from_orm(vibe))

        except Exception as e:
            return Result.failure(
                error=f"Failed to get vibe: {str(e)}",
                error_type=ErrorType.SERVER_ERROR
            )


class GetVibesByUserIdHandler:
    """Handler for getting vibes by user ID."""

    def __init__(self, repository: VibeRepository):
        self.repository = repository

    async def handle(self, user_id: UUID) -> Result[List[VibeResponse]]:
        """Get all vibes for a user."""
        try:
            vibes = await self.repository.get_by_user_id(user_id)
            vibe_responses = [VibeResponse.from_orm(vibe) for vibe in vibes]
            return Result.success(vibe_responses)

        except Exception as e:
            return Result.failure(
                error=f"Failed to get user vibes: {str(e)}",
                error_type=ErrorType.SERVER_ERROR
            )


class GetTrendingVibesHandler:
    """Handler for getting trending vibes."""

    def __init__(self, repository: VibeRepository):
        self.repository = repository

    async def handle(self, count: int = 10) -> Result[List[VibeResponse]]:
        """Get trending vibes."""
        try:
            vibes = await self.repository.get_trending(count)
            vibe_responses = [VibeResponse.from_orm(vibe) for vibe in vibes]
            return Result.success(vibe_responses)

        except Exception as e:
            return Result.failure(
                error=f"Failed to get trending vibes: {str(e)}",
                error_type=ErrorType.SERVER_ERROR
            )
