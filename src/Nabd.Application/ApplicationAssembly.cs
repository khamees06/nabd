using System.Reflection;

namespace Nabd.Application;

/// <summary>
/// Marker for the application assembly. Architecture tests and assembly scanning refer to it
/// instead of naming a concrete application type.
/// </summary>
public static class ApplicationAssembly
{
    /// <summary>The assembly that holds the use cases and the ports.</summary>
    public static Assembly Reference => typeof(ApplicationAssembly).Assembly;
}
