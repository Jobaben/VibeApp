using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VibeApp.API.Shared.Common;

namespace VibeApp.API.Features.Notifications;

[Authorize]
public class NotificationsController : BaseController
{
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(ILogger<NotificationsController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        // TODO: Implement GetAll notifications for current user
        _logger.LogInformation("GetAll notifications called with page: {Page}, pageSize: {PageSize}", page, pageSize);
        return Ok(new { message = "GetAll notifications - Not yet implemented" });
    }

    [HttpGet("unread")]
    public async Task<IActionResult> GetUnread()
    {
        // TODO: Implement Get unread notifications
        _logger.LogInformation("Get unread notifications called");
        return Ok(new { message = "Get unread notifications - Not yet implemented" });
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        // TODO: Implement mark notification as read
        _logger.LogInformation("Mark notification as read called with id: {Id}", id);
        return Ok(new { message = $"Mark notification {id} as read - Not yet implemented" });
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        // TODO: Implement mark all notifications as read
        _logger.LogInformation("Mark all notifications as read called");
        return Ok(new { message = "Mark all notifications as read - Not yet implemented" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // TODO: Implement Delete notification
        _logger.LogInformation("Delete notification called with id: {Id}", id);
        return Ok(new { message = $"Delete notification {id} - Not yet implemented" });
    }
}
