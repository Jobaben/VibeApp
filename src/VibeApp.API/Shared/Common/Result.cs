namespace VibeApp.API.Shared.Common;

public enum ErrorType
{
    None,
    NotFound,
    Validation,
    Unauthorized,
    Forbidden,
    ServerError
}

public class Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }
    public ErrorType ErrorType { get; }

    protected Result(bool isSuccess, string? error, ErrorType errorType = ErrorType.None)
    {
        IsSuccess = isSuccess;
        Error = error;
        ErrorType = errorType;
    }

    public static Result Success() => new(true, null);

    public static Result Failure(string error, ErrorType errorType = ErrorType.ServerError)
        => new(false, error, errorType);

    public static Result<T> Success<T>(T value) => new(value, true, null);

    public static Result<T> Failure<T>(string error, ErrorType errorType = ErrorType.ServerError)
        => new(default, false, error, errorType);
}

public class Result<T> : Result
{
    public T? Value { get; }

    protected internal Result(T? value, bool isSuccess, string? error, ErrorType errorType = ErrorType.None)
        : base(isSuccess, error, errorType)
    {
        Value = value;
    }
}
