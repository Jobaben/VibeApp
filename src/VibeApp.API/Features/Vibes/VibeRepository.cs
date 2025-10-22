using Microsoft.EntityFrameworkCore;
using VibeApp.API.Infrastructure.Data;

namespace VibeApp.API.Features.Vibes;

public class VibeRepository : IVibeRepository
{
    private readonly ApplicationDbContext _context;

    public VibeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Vibe> AddAsync(Vibe vibe, CancellationToken cancellationToken = default)
    {
        await _context.Vibes.AddAsync(vibe, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return vibe;
    }

    public async Task<Vibe?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Vibes
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Vibe>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Vibes
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Vibe>> GetTrendingAsync(int count, CancellationToken cancellationToken = default)
    {
        return await _context.Vibes
            .Where(v => v.IsPublic)
            .OrderByDescending(v => v.LikesCount)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var vibe = await _context.Vibes
            .IgnoreQueryFilters() // Include soft-deleted entities
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (vibe == null)
        {
            return false;
        }

        vibe.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
