using MediatR;
using VibeApp.API.Shared.Common.Interfaces;

namespace VibeApp.API.Shared.Behaviors;

public class TransactionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<TransactionBehavior<TRequest, TResponse>> _logger;

    public TransactionBehavior(ILogger<TransactionBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        // For now, just pass through. In the future, this can handle database transactions
        // when IUnitOfWork is injected and used
        _logger.LogInformation("Begin transaction for {RequestName}", typeof(TRequest).Name);

        try
        {
            var response = await next();

            _logger.LogInformation("Commit transaction for {RequestName}", typeof(TRequest).Name);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rollback transaction for {RequestName}", typeof(TRequest).Name);
            throw;
        }
    }
}
