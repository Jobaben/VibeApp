using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VibeApp.API.Shared.Common;

namespace VibeApp.API.Features.Social;

[Authorize]
public class SocialController : BaseController
{
    private readonly ILogger<SocialController> _logger;

    public SocialController(ILogger<SocialController> logger)
    {
        _logger = logger;
    }

    [HttpPost("follow/{userId}")]
    public async Task<IActionResult> FollowUser(Guid userId)
    {
        // TODO: Implement follow user
        _logger.LogInformation("Follow user called with userId: {UserId}", userId);
        return Ok(new { message = $"Follow user {userId} - Not yet implemented" });
    }

    [HttpPost("unfollow/{userId}")]
    public async Task<IActionResult> UnfollowUser(Guid userId)
    {
        // TODO: Implement unfollow user
        _logger.LogInformation("Unfollow user called with userId: {UserId}", userId);
        return Ok(new { message = $"Unfollow user {userId} - Not yet implemented" });
    }

    [HttpPost("like/{vibeId}")]
    public async Task<IActionResult> LikeVibe(Guid vibeId)
    {
        // TODO: Implement like vibe
        _logger.LogInformation("Like vibe called with vibeId: {VibeId}", vibeId);
        return Ok(new { message = $"Like vibe {vibeId} - Not yet implemented" });
    }

    [HttpPost("unlike/{vibeId}")]
    public async Task<IActionResult> UnlikeVibe(Guid vibeId)
    {
        // TODO: Implement unlike vibe
        _logger.LogInformation("Unlike vibe called with vibeId: {VibeId}", vibeId);
        return Ok(new { message = $"Unlike vibe {vibeId} - Not yet implemented" });
    }

    [HttpPost("comment/{vibeId}")]
    public async Task<IActionResult> CommentOnVibe(Guid vibeId, [FromBody] object model)
    {
        // TODO: Implement comment on vibe
        _logger.LogInformation("Comment on vibe called with vibeId: {VibeId}", vibeId);
        return Ok(new { message = $"Comment on vibe {vibeId} - Not yet implemented" });
    }

    [HttpGet("followers/{userId}")]
    public async Task<IActionResult> GetFollowers(Guid userId)
    {
        // TODO: Implement get followers
        _logger.LogInformation("Get followers called with userId: {UserId}", userId);
        return Ok(new { message = $"Get followers for user {userId} - Not yet implemented" });
    }

    [HttpGet("following/{userId}")]
    public async Task<IActionResult> GetFollowing(Guid userId)
    {
        // TODO: Implement get following
        _logger.LogInformation("Get following called with userId: {UserId}", userId);
        return Ok(new { message = $"Get following for user {userId} - Not yet implemented" });
    }
}
