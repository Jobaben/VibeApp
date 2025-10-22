using FluentAssertions;
using VibeApp.API.Features.Vibes;
using Xunit;

namespace VibeApp.Tests.Unit.Features.Vibes;

public class CreateVibeCommandValidatorTests
{
    private readonly CreateVibeCommandValidator _validator;

    public CreateVibeCommandValidatorTests()
    {
        _validator = new CreateVibeCommandValidator();
    }

    [Fact]
    public void Validate_ValidCommand_ReturnsValid()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "This is a valid vibe!",
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void Validate_EmptyContent_ReturnsInvalid()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "",
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.PropertyName == "Content");
        result.Errors.First().ErrorMessage.Should().Be("Content is required");
    }

    [Fact]
    public void Validate_ContentTooLong_ReturnsInvalid()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = new string('a', 501), // 501 characters
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.PropertyName == "Content");
        result.Errors.First().ErrorMessage.Should().Be("Content cannot exceed 500 characters");
    }

    [Fact]
    public void Validate_ContentExactly500Characters_ReturnsValid()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = new string('a', 500), // Exactly 500 characters
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_EmptyUserId_ReturnsInvalid()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "Valid content",
            UserId = Guid.Empty,
            Type = VibeType.Text,
            IsPublic = true
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.PropertyName == "UserId");
        result.Errors.First().ErrorMessage.Should().Be("UserId is required");
    }

    [Fact]
    public void Validate_InvalidVibeType_ReturnsInvalid()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "Valid content",
            UserId = Guid.NewGuid(),
            Type = (VibeType)999, // Invalid enum value
            IsPublic = true
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.PropertyName == "Type");
        result.Errors.First().ErrorMessage.Should().Be("Invalid vibe type");
    }

    [Fact]
    public void Validate_MediaUrlTooLong_ReturnsInvalid()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "Valid content",
            UserId = Guid.NewGuid(),
            MediaUrl = new string('a', 2049), // 2049 characters
            Type = VibeType.Image,
            IsPublic = true
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.PropertyName == "MediaUrl");
        result.Errors.First().ErrorMessage.Should().Be("MediaUrl cannot exceed 2048 characters");
    }

    [Fact]
    public void Validate_NullMediaUrl_ReturnsValid()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "Valid content",
            UserId = Guid.NewGuid(),
            MediaUrl = null,
            Type = VibeType.Text,
            IsPublic = true
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_ValidMediaUrl_ReturnsValid()
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "Check this out!",
            UserId = Guid.NewGuid(),
            MediaUrl = "https://cdn.vibeapp.com/media/image123.jpg",
            Type = VibeType.Image,
            IsPublic = true
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(VibeType.Text)]
    [InlineData(VibeType.Image)]
    [InlineData(VibeType.Video)]
    [InlineData(VibeType.Audio)]
    public void Validate_AllValidVibeTypes_ReturnsValid(VibeType vibeType)
    {
        // Arrange
        var command = new CreateVibeCommand
        {
            Content = "Valid content",
            UserId = Guid.NewGuid(),
            Type = vibeType,
            IsPublic = true
        };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}
