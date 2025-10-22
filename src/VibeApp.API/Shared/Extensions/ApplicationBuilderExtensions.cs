using VibeApp.API.Shared.Middleware;

namespace VibeApp.API.Shared.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseCustomExceptionHandling(this IApplicationBuilder app)
    {
        app.UseMiddleware<ExceptionMiddleware>();
        app.UseMiddleware<CorrelationIdMiddleware>();
        return app;
    }
}
