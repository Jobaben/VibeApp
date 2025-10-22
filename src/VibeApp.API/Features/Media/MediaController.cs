using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VibeApp.API.Shared.Common;

namespace VibeApp.API.Features.Media;

[Authorize]
public class MediaController : BaseController
{
    private readonly ILogger<MediaController> _logger;

    public MediaController(ILogger<MediaController> logger)
    {
        _logger = logger;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        // TODO: Implement file upload
        _logger.LogInformation("Upload file called with fileName: {FileName}", file?.FileName);
        return Ok(new { message = "Upload file - Not yet implemented" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        // TODO: Implement GetById media
        _logger.LogInformation("GetById media called with id: {Id}", id);
        return Ok(new { message = $"GetById media {id} - Not yet implemented" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // TODO: Implement Delete media
        _logger.LogInformation("Delete media called with id: {Id}", id);
        return Ok(new { message = $"Delete media {id} - Not yet implemented" });
    }
}
