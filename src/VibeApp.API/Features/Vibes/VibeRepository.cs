using VibeApp.API.Infrastructure.Data;

namespace VibeApp.API.Features.Vibes;

public class VibeRepository : IVibeRepository
{
    private readonly ApplicationDbContext _context;

    public VibeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // TODO: Implement vibe-specific repository methods
}
