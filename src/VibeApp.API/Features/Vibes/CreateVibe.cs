using FluentValidation;
using MediatR;
using VibeApp.API.Shared.Common;

namespace VibeApp.API.Features.Vibes;

public class CreateVibeCommand : IRequest<Result<CreateVibeResponse>>
{
    public string Content { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string? MediaUrl { get; set; }
    public VibeType Type { get; set; }
    public bool IsPublic { get; set; } = true;
}

public class CreateVibeResponse
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string? MediaUrl { get; set; }
    public VibeType Type { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public int SharesCount { get; set; }
}

public class CreateVibeCommandValidator : AbstractValidator<CreateVibeCommand>
{
    public CreateVibeCommandValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required")
            .MaximumLength(500).WithMessage("Content cannot exceed 500 characters");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required");

        RuleFor(x => x.MediaUrl)
            .MaximumLength(2048).WithMessage("MediaUrl cannot exceed 2048 characters")
            .When(x => !string.IsNullOrEmpty(x.MediaUrl));

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid vibe type");
    }
}

public class CreateVibeCommandHandler : IRequestHandler<CreateVibeCommand, Result<CreateVibeResponse>>
{
    private readonly IVibeRepository _repository;

    public CreateVibeCommandHandler(IVibeRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<CreateVibeResponse>> Handle(CreateVibeCommand request, CancellationToken cancellationToken)
    {
        var vibe = new Vibe
        {
            Id = Guid.NewGuid(),
            Content = request.Content,
            UserId = request.UserId,
            MediaUrl = request.MediaUrl,
            Type = request.Type,
            IsPublic = request.IsPublic,
            LikesCount = 0,
            CommentsCount = 0,
            SharesCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        await _repository.AddAsync(vibe, cancellationToken);

        var response = new CreateVibeResponse
        {
            Id = vibe.Id,
            Content = vibe.Content,
            UserId = vibe.UserId,
            MediaUrl = vibe.MediaUrl,
            Type = vibe.Type,
            IsPublic = vibe.IsPublic,
            CreatedAt = vibe.CreatedAt,
            LikesCount = vibe.LikesCount,
            CommentsCount = vibe.CommentsCount,
            SharesCount = vibe.SharesCount
        };

        return Result.Success(response);
    }
}
