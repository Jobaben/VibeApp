namespace VibeApp.API.Shared.Constants;

public static class ErrorMessages
{
    public const string NotFound = "The requested resource was not found.";
    public const string Unauthorized = "You are not authorized to perform this action.";
    public const string ValidationFailed = "One or more validation errors occurred.";
    public const string InternalServerError = "An error occurred while processing your request.";
    public const string InvalidCredentials = "Invalid username or password.";
    public const string EmailAlreadyExists = "An account with this email already exists.";
    public const string UserNotFound = "User not found.";
    public const string InvalidToken = "Invalid or expired token.";
}
