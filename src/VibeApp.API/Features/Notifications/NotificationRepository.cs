using VibeApp.API.Infrastructure.Data;

namespace VibeApp.API.Features.Notifications;

public class NotificationRepository
{
    private readonly ApplicationDbContext _context;

    public NotificationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // TODO: Implement notification-specific repository methods
}
