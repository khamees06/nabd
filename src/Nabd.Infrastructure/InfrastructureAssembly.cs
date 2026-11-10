using System.Reflection;

namespace Nabd.Infrastructure;

/// <summary>
/// Marker for the infrastructure assembly. Architecture tests and assembly scanning refer to it
/// instead of naming a concrete adapter.
/// </summary>
public static class InfrastructureAssembly
{
    /// <summary>The assembly that holds the adapters for data and external services.</summary>
    public static Assembly Reference => typeof(InfrastructureAssembly).Assembly;
}
