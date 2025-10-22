namespace VibeApp.API.Features.Vibes;

public interface IVibeRepository
{
    Task<Vibe> AddAsync(Vibe vibe, CancellationToken cancellationToken = default);
    Task<Vibe?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Vibe>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Vibe>> GetTrendingAsync(int count, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
