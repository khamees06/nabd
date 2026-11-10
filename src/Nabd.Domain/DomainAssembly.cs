using System.Reflection;

namespace Nabd.Domain;

/// <summary>
/// Marker for the domain assembly. Architecture tests and assembly scanning refer to it
/// instead of naming a concrete domain type.
/// </summary>
public static class DomainAssembly
{
    /// <summary>The assembly that holds the clinical and simulation domain.</summary>
    public static Assembly Reference => typeof(DomainAssembly).Assembly;
}
