namespace Nabd.Application.Common;

/// <summary>Why a use case could not do what was asked.</summary>
public enum ErrorKind
{
    /// <summary>The request itself is wrong (a missing field, an unknown id, a value out of range).</summary>
    Invalid,

    /// <summary>What the request refers to does not exist.</summary>
    NotFound,

    /// <summary>The request is valid but not in the current state (for example, the session has ended).</summary>
    Conflict,

    /// <summary>Something the use case depends on is not available right now.</summary>
    Unavailable,
}

/// <summary>A failure a use case reports to its caller, without throwing.</summary>
/// <param name="Kind">The kind of failure; the presentation layer maps it to a status code.</param>
/// <param name="Message">A short message for developers and logs. It never carries clinical answers.</param>
public sealed record Error(ErrorKind Kind, string Message);

/// <summary>The outcome of a use case: a value, or the reason there is none.</summary>
/// <typeparam name="T">The type of the value.</typeparam>
public sealed class Result<T>
{
    private Result(T? value, Error? error)
    {
        Value = value;
        Error = error;
    }

    /// <summary>True when the use case succeeded.</summary>
    public bool IsSuccess => Error is null;

    /// <summary>The value, when the use case succeeded.</summary>
    public T? Value { get; }

    /// <summary>The failure, when it did not.</summary>
    public Error? Error { get; }

    /// <summary>A successful outcome.</summary>
    public static Result<T> Success(T value) => new(value, null);

    /// <summary>A failed outcome.</summary>
    public static Result<T> Failure(ErrorKind kind, string message) => new(default, new Error(kind, message));
}
