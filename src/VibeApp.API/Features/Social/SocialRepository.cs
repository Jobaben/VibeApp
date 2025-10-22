using VibeApp.API.Infrastructure.Data;

namespace VibeApp.API.Features.Social;

public class SocialRepository
{
    private readonly ApplicationDbContext _context;

    public SocialRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // TODO: Implement social-specific repository methods (follows, likes, comments)
}
