using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VibeApp.API.Shared.Common;

namespace VibeApp.API.Features.Users;

[Authorize]
public class UsersController : BaseController
{
    private readonly ILogger<UsersController> _logger;

    public UsersController(ILogger<UsersController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // TODO: Implement GetAll users
        _logger.LogInformation("GetAll users called");
        return Ok(new { message = "GetAll users - Not yet implemented" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        // TODO: Implement GetById
        _logger.LogInformation("GetById user called with id: {Id}", id);
        return Ok(new { message = $"GetById user {id} - Not yet implemented" });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] object model)
    {
        // TODO: Implement Create user
        _logger.LogInformation("Create user called");
        return Ok(new { message = "Create user - Not yet implemented" });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] object model)
    {
        // TODO: Implement Update user
        _logger.LogInformation("Update user called with id: {Id}", id);
        return Ok(new { message = $"Update user {id} - Not yet implemented" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // TODO: Implement Delete user
        _logger.LogInformation("Delete user called with id: {Id}", id);
        return Ok(new { message = $"Delete user {id} - Not yet implemented" });
    }
}
