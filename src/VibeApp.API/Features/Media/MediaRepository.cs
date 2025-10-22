using VibeApp.API.Infrastructure.Data;

namespace VibeApp.API.Features.Media;

public class MediaRepository
{
    private readonly ApplicationDbContext _context;

    public MediaRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // TODO: Implement media-specific repository methods
}
