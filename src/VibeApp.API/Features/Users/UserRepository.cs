using VibeApp.API.Infrastructure.Data;

namespace VibeApp.API.Features.Users;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // TODO: Implement user-specific repository methods
}
