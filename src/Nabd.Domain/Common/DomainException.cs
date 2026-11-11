namespace Nabd.Domain.Common;

/// <summary>
/// A domain rule was broken: the caller asked the model to do something the clinical simulation does not allow.
/// </summary>
public sealed class DomainException : Exception
{
    /// <summary>Creates the exception with a message that names the broken rule.</summary>
    public DomainException(string message) : base(message)
    {
    }
}
