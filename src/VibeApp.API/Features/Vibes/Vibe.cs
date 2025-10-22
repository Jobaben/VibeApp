using VibeApp.API.Shared.Common;

namespace VibeApp.API.Features.Vibes;

public class Vibe : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string? MediaUrl { get; set; }
    public VibeType Type { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public int SharesCount { get; set; }
    public bool IsPublic { get; set; } = true;
}

public enum VibeType
{
    Text,
    Image,
    Video,
    Audio
}
