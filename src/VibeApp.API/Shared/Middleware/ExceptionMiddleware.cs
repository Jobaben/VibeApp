using System.Net;
using System.Text.Json;
using VibeApp.API.Shared.Exceptions;

namespace VibeApp.API.Shared.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            NotFoundException notFoundException => new
            {
                statusCode = (int)HttpStatusCode.NotFound,
                message = notFoundException.Message,
                detailed = _env.IsDevelopment() ? notFoundException.StackTrace : null
            },
            ValidationException validationException => new
            {
                statusCode = (int)HttpStatusCode.BadRequest,
                message = "Validation failed",
                errors = validationException.Errors,
                detailed = _env.IsDevelopment() ? validationException.StackTrace : null
            },
            UnauthorizedException unauthorizedException => new
            {
                statusCode = (int)HttpStatusCode.Unauthorized,
                message = unauthorizedException.Message,
                detailed = _env.IsDevelopment() ? unauthorizedException.StackTrace : null
            },
            _ => new
            {
                statusCode = (int)HttpStatusCode.InternalServerError,
                message = "An error occurred while processing your request.",
                detailed = _env.IsDevelopment() ? exception.StackTrace : null
            }
        };

        context.Response.StatusCode = response.statusCode;

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}
