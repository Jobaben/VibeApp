using VibeApp.API.Shared.Behaviors;

namespace VibeApp.API.Shared.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationBehaviors(this IServiceCollection services)
    {
        // Register MediatR pipeline behaviors
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(TransactionBehavior<,>));

        return services;
    }
}
