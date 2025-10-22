using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VibeApp.API.Features.Vibes;
using VibeApp.API.Infrastructure.Data;
using Xunit;

namespace VibeApp.Tests.Integration.Features.Vibes;

public class VibeRepositoryTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly VibeRepository _repository;

    public VibeRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new VibeRepository(_context);
    }

    [Fact]
    public async Task AddAsync_ValidVibe_AddsVibeToDatabase()
    {
        // Arrange
        var vibe = new Vibe
        {
            Id = Guid.NewGuid(),
            Content = "Test vibe content",
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true,
            LikesCount = 0,
            CommentsCount = 0,
            SharesCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        // Act
        var result = await _repository.AddAsync(vibe);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(vibe.Id);
        result.Content.Should().Be(vibe.Content);

        var savedVibe = await _context.Vibes.FindAsync(vibe.Id);
        savedVibe.Should().NotBeNull();
        savedVibe!.Content.Should().Be(vibe.Content);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingVibe_ReturnsVibe()
    {
        // Arrange
        var vibe = new Vibe
        {
            Id = Guid.NewGuid(),
            Content = "Test vibe",
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Vibes.Add(vibe);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(vibe.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(vibe.Id);
        result.Content.Should().Be(vibe.Content);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingVibe_ReturnsNull()
    {
        // Arrange
        var nonExistingId = Guid.NewGuid();

        // Act
        var result = await _repository.GetByIdAsync(nonExistingId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdAsync_DeletedVibe_ReturnsNull()
    {
        // Arrange
        var vibe = new Vibe
        {
            Id = Guid.NewGuid(),
            Content = "Deleted vibe",
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = true // Marked as deleted
        };
        _context.Vibes.Add(vibe);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(vibe.Id);

        // Assert
        result.Should().BeNull(); // Should not return deleted vibes
    }

    [Fact]
    public async Task GetByUserIdAsync_ExistingVibes_ReturnsUserVibes()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vibes = new[]
        {
            new Vibe
            {
                Id = Guid.NewGuid(),
                Content = "User vibe 1",
                UserId = userId,
                Type = VibeType.Text,
                IsPublic = true,
                CreatedAt = DateTime.UtcNow.AddMinutes(-10),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-10),
                IsDeleted = false
            },
            new Vibe
            {
                Id = Guid.NewGuid(),
                Content = "User vibe 2",
                UserId = userId,
                Type = VibeType.Image,
                IsPublic = true,
                CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-5),
                IsDeleted = false
            },
            new Vibe
            {
                Id = Guid.NewGuid(),
                Content = "Other user vibe",
                UserId = Guid.NewGuid(), // Different user
                Type = VibeType.Text,
                IsPublic = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            }
        };
        _context.Vibes.AddRange(vibes);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByUserIdAsync(userId);

        // Assert
        result.Should().HaveCount(2);
        result.Should().AllSatisfy(v => v.UserId.Should().Be(userId));
        result.Should().BeInDescendingOrder(v => v.CreatedAt); // Most recent first
    }

    [Fact]
    public async Task GetByUserIdAsync_NoVibes_ReturnsEmptyCollection()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = await _repository.GetByUserIdAsync(userId);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetTrendingAsync_ReturnsTopVibesByLikes()
    {
        // Arrange
        var vibes = new[]
        {
            new Vibe
            {
                Id = Guid.NewGuid(),
                Content = "Popular vibe",
                UserId = Guid.NewGuid(),
                Type = VibeType.Text,
                LikesCount = 100,
                IsPublic = true,
                CreatedAt = DateTime.UtcNow.AddHours(-1),
                UpdatedAt = DateTime.UtcNow.AddHours(-1),
                IsDeleted = false
            },
            new Vibe
            {
                Id = Guid.NewGuid(),
                Content = "Very popular vibe",
                UserId = Guid.NewGuid(),
                Type = VibeType.Video,
                LikesCount = 500,
                IsPublic = true,
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                UpdatedAt = DateTime.UtcNow.AddHours(-2),
                IsDeleted = false
            },
            new Vibe
            {
                Id = Guid.NewGuid(),
                Content = "Unpopular vibe",
                UserId = Guid.NewGuid(),
                Type = VibeType.Text,
                LikesCount = 5,
                IsPublic = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new Vibe
            {
                Id = Guid.NewGuid(),
                Content = "Private popular vibe",
                UserId = Guid.NewGuid(),
                Type = VibeType.Text,
                LikesCount = 1000,
                IsPublic = false, // Private, should not be included
                CreatedAt = DateTime.UtcNow.AddHours(-3),
                UpdatedAt = DateTime.UtcNow.AddHours(-3),
                IsDeleted = false
            }
        };
        _context.Vibes.AddRange(vibes);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetTrendingAsync(2);

        // Assert
        result.Should().HaveCount(2);
        result.First().LikesCount.Should().Be(500); // Most likes
        result.Last().LikesCount.Should().Be(100); // Second most likes
        result.Should().AllSatisfy(v => v.IsPublic.Should().BeTrue());
    }

    [Fact]
    public async Task DeleteAsync_ExistingVibe_SoftDeletesVibe()
    {
        // Arrange
        var vibe = new Vibe
        {
            Id = Guid.NewGuid(),
            Content = "To be deleted",
            UserId = Guid.NewGuid(),
            Type = VibeType.Text,
            IsPublic = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _context.Vibes.Add(vibe);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.DeleteAsync(vibe.Id);

        // Assert
        result.Should().BeTrue();
        var deletedVibe = await _context.Vibes.FindAsync(vibe.Id);
        deletedVibe.Should().NotBeNull();
        deletedVibe!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_NonExistingVibe_ReturnsFalse()
    {
        // Arrange
        var nonExistingId = Guid.NewGuid();

        // Act
        var result = await _repository.DeleteAsync(nonExistingId);

        // Assert
        result.Should().BeFalse();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
