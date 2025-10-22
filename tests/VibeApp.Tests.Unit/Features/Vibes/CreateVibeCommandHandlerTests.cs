using FluentAssertions;
using Moq;
using VibeApp.API.Features.Vibes;
using Xunit;

namespace VibeApp.Tests.Unit.Features.Vibes;

public class CreateVibeCommandHandlerTests
{
    private readonly Mock<IVibeRepository> _mockRepository;
    private readonly CreateVibeCommandHandler _handler;

    public CreateVibeCommandHandlerTests()
    {
        _mockRepository = new Mock<IVibeRepository>();
        _handler = new CreateVibeCommandHandler(_mockRepository.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccessResult()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "This is my first vibe!",
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true
        };

        _mockRepository
            .Setup(x => x.AddAsync(It.IsAny<Vibe>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vibe v, CancellationToken ct) => v);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Content.Should().Be(command.Content);
        result.Value.UserId.Should().Be(command.UserId);
        result.Value.Type.Should().Be(command.Type);
        result.Value.IsPublic.Should().Be(command.IsPublic);
        result.Value.Id.Should().NotBeEmpty();
        result.Value.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.Value.LikesCount.Should().Be(0);
        result.Value.CommentsCount.Should().Be(0);
        result.Value.SharesCount.Should().Be(0);
    }

    [Fact]
    public async Task Handle_ValidCommand_CallsRepositoryAddAsync()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "Test vibe",
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true
        };

        _mockRepository
            .Setup(x => x.AddAsync(It.IsAny<Vibe>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vibe v, CancellationToken ct) => v);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _mockRepository.Verify(
            x => x.AddAsync(It.Is<Vibe>(v =>
                v.Content == command.Content &&
                v.UserId == command.UserId &&
                v.Type == command.Type &&
                v.IsPublic == command.IsPublic &&
                v.LikesCount == 0 &&
                v.CommentsCount == 0 &&
                v.SharesCount == 0
            ), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_CommandWithMediaUrl_CreatesVibeWithMediaUrl()
    {
        // Arrange
        var mediaUrl = "https://cdn.vibeapp.com/media/image123.jpg";
        var command = new CreateVibeCommand
        {
            Content = "Check out this image!",
            UserId = Guid.NewGuid(),
            MediaUrl = mediaUrl,
            Type = VibeType.Image,
            IsPublic = true
        };

        _mockRepository
            .Setup(x => x.AddAsync(It.IsAny<Vibe>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vibe v, CancellationToken ct) => v);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.MediaUrl.Should().Be(mediaUrl);
        result.Value.Type.Should().Be(VibeType.Image);
    }

    [Fact]
    public async Task Handle_PrivateVibe_CreatesPrivateVibe()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "This is a private thought",
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = false
        };

        _mockRepository
            .Setup(x => x.AddAsync(It.IsAny<Vibe>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vibe v, CancellationToken ct) => v);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsPublic.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_CreatesNewGuidForVibe()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "Test",
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true
        };

        Guid capturedVibeId = Guid.Empty;
        _mockRepository
            .Setup(x => x.AddAsync(It.IsAny<Vibe>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vibe v, CancellationToken ct) =>
            {
                capturedVibeId = v.Id;
                return v;
            });

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        capturedVibeId.Should().NotBeEmpty();
        result.Value!.Id.Should().Be(capturedVibeId);
    }
}
