using VibeApp.API.Shared.Common.Interfaces;

namespace VibeApp.API.Shared.Common;

public abstract class BaseEntity : IEntity
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}
