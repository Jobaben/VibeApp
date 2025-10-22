using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VibeApp.API.Shared.Common;

namespace VibeApp.API.Features.Vibes;

[Authorize]
public class VibesController : BaseController
{
    private readonly ILogger<VibesController> _logger;

    public VibesController(ILogger<VibesController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        // TODO: Implement GetAll vibes with pagination
        _logger.LogInformation("GetAll vibes called with page: {Page}, pageSize: {PageSize}", page, pageSize);
        return Ok(new { message = "GetAll vibes - Not yet implemented" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        // TODO: Implement GetById
        _logger.LogInformation("GetById vibe called with id: {Id}", id);
        return Ok(new { message = $"GetById vibe {id} - Not yet implemented" });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVibeCommand command)
    {
        _logger.LogInformation("Creating vibe for user {UserId}", command.UserId);

        var result = await Mediator.Send(command);

        return HandleResult(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] object model)
    {
        // TODO: Implement Update vibe
        _logger.LogInformation("Update vibe called with id: {Id}", id);
        return Ok(new { message = $"Update vibe {id} - Not yet implemented" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // TODO: Implement Delete vibe
        _logger.LogInformation("Delete vibe called with id: {Id}", id);
        return Ok(new { message = $"Delete vibe {id} - Not yet implemented" });
    }
}
