using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Nabd.Web.Http;

/// <summary>How many requests one caller may make per minute.</summary>
public sealed class RateLimitOptions
{
    /// <summary>Configuration section name.</summary>
    public const string SectionName = "RateLimits";

    /// <summary>Requests per minute, per caller address, to the understanding services (each may call a paid model).</summary>
    public int UnderstandingPerMinute { get; set; } = 40;

    /// <summary>Requests per minute, per caller address, to the simulation session API.</summary>
    public int SimulationPerMinute { get; set; } = 240;
}

/// <summary>The rate-limit policies of the API.</summary>
public static class RateLimitPolicies
{
    /// <summary>Policy for the understanding-service endpoints.</summary>
    public const string Understanding = "understanding";

    /// <summary>Policy for the simulation session endpoints.</summary>
    public const string Simulation = "simulation";

    /// <summary>Registers both policies. A caller over its limit is answered 429, which the rooms treat as "work offline".</summary>
    public static IServiceCollection AddNabdRateLimits(this IServiceCollection services, IConfiguration configuration)
    {
        var limits = configuration.GetSection(RateLimitOptions.SectionName).Get<RateLimitOptions>() ?? new RateLimitOptions();
        return services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(Understanding, context => PerCaller(context, Understanding, limits.UnderstandingPerMinute));
            options.AddPolicy(Simulation, context => PerCaller(context, Simulation, limits.SimulationPerMinute));
        });
    }

    private static RateLimitPartition<string> PerCaller(HttpContext context, string policy, int perMinute) =>
        RateLimitPartition.GetFixedWindowLimiter(
            policy + ":" + (context.Connection.RemoteIpAddress?.ToString() ?? "unknown"),
            _ => new FixedWindowRateLimiterOptions { PermitLimit = Math.Max(1, perMinute), Window = TimeSpan.FromMinutes(1), QueueLimit = 0 });
}
