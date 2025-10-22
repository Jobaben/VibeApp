using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VibeApp.API.Features.Vibes;
using VibeApp.API.Infrastructure.Data;
using Xunit;

namespace VibeApp.Tests.Functional.Features.Vibes;

public class CreateVibeEndpointTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;
    private readonly string _testDatabaseName;

    public CreateVibeEndpointTests(WebApplicationFactory<Program> factory)
    {
        _testDatabaseName = $"VibeAppTestDb_{Guid.NewGuid()}";

        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                // Remove the existing DbContext registration
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // Add in-memory database for testing
                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase(_testDatabaseName);
                });

                // Add test authentication
                services.AddAuthentication("Test")
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", options => { });
            });

            builder.UseEnvironment("Development");
        });

        _client = _factory.CreateClient();

        // Set up test authentication
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Test");
    }

    [Fact]
    public async Task CreateVibe_ValidRequest_ReturnsCreatedVibe()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new
        {
            Content = "This is my first test vibe!",
            UserId = userId,
            Type = "Text",
            IsPublic = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/vibes", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CreateVibeResponse>();
        result.Should().NotBeNull();
        result!.Content.Should().Be(request.Content);
        result.UserId.Should().Be(userId);
        result.Type.Should().Be(VibeType.Text);
        result.IsPublic.Should().BeTrue();
        result.Id.Should().NotBeEmpty();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.LikesCount.Should().Be(0);
        result.CommentsCount.Should().Be(0);
        result.SharesCount.Should().Be(0);
    }

    [Fact]
    public async Task CreateVibe_EmptyContent_ReturnsBadRequest()
    {
        // Arrange
        var request = new
        {
            Content = "",
            UserId = Guid.NewGuid(),
            Type = "Text",
            IsPublic = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/vibes", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateVibe_ContentTooLong_ReturnsBadRequest()
    {
        // Arrange
        var request = new
        {
            Content = new string('a', 501), // 501 characters
            UserId = Guid.NewGuid(),
            Type = "Text",
            IsPublic = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/vibes", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateVibe_WithMediaUrl_ReturnsCreatedVibeWithMediaUrl()
    {
        // Arrange
        var request = new
        {
            Content = "Check out this image!",
            UserId = Guid.NewGuid(),
            MediaUrl = "https://cdn.vibeapp.com/media/image123.jpg",
            Type = "Image",
            IsPublic = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/vibes", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CreateVibeResponse>();
        result!.MediaUrl.Should().Be(request.MediaUrl);
        result.Type.Should().Be(VibeType.Image);
    }

    [Fact]
    public async Task CreateVibe_PrivateVibe_ReturnsPrivateVibe()
    {
        // Arrange
        var request = new
        {
            Content = "This is a private thought",
            UserId = Guid.NewGuid(),
            Type = "Text",
            IsPublic = false
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/vibes", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CreateVibeResponse>();
        result!.IsPublic.Should().BeFalse();
    }

    [Fact]
    public async Task CreateVibe_EmptyUserId_ReturnsBadRequest()
    {
        // Arrange
        var request = new
        {
            Content = "Valid content",
            UserId = Guid.Empty,
            Type = "Text",
            IsPublic = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/vibes", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("Text")]
    [InlineData("Image")]
    [InlineData("Video")]
    [InlineData("Audio")]
    public async Task CreateVibe_AllValidTypes_ReturnsCreatedVibe(string vibeType)
    {
        // Arrange
        var request = new
        {
            Content = $"Test vibe of type {vibeType}",
            UserId = Guid.NewGuid(),
            Type = vibeType,
            IsPublic = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/vibes", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CreateVibeResponse>();
        result!.Type.ToString().Should().Be(vibeType);
    }

    public void Dispose()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        context.Database.EnsureDeleted();
        _client.Dispose();
    }
}

// Test authentication handler for integration tests
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthHandler(
        Microsoft.Extensions.Options.IOptionsMonitor<AuthenticationSchemeOptions> options,
        Microsoft.Extensions.Logging.ILoggerFactory logger,
        System.Text.Encodings.Web.UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "TestUser"),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
