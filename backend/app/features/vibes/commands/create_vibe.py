"""Create vibe command handler."""
from uuid import UUID
from app.features.vibes.models import Vibe
from app.features.vibes.schemas import CreateVibeCommand, VibeResponse
from app.infrastructure.repositories import VibeRepository
from app.shared.models import Result, ErrorType


class CreateVibeHandler:
    """Handler for creating a new vibe."""

    def __init__(self, repository: VibeRepository):
        self.repository = repository

    async def handle(self, command: CreateVibeCommand) -> Result[VibeResponse]:
        """
        Handle the create vibe command.

        Args:
            command: The create vibe command

        Returns:
            Result with VibeResponse or error
        """
        try:
            # Create the vibe entity
            vibe = Vibe(
                content=command.content,
                user_id=command.user_id,
                media_url=command.media_url,
                type=command.type,
                is_public=command.is_public
            )

            # Save to database
            created_vibe = await self.repository.add(vibe)

            # Return success result
            return Result.success(VibeResponse.from_orm(created_vibe))

        except Exception as e:
            return Result.failure(
                error=f"Failed to create vibe: {str(e)}",
                error_type=ErrorType.SERVER_ERROR
            )
