using System.Net;
using System.Net.Sockets;
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

    /// <summary>Sessions one caller address may start per minute.</summary>
    public int SimulationStartsPerMinute { get; set; } = 6;
}

/// <summary>The rate-limit policies of the API.</summary>
public static class RateLimitPolicies
{
    /// <summary>Policy for the understanding-service endpoints.</summary>
    public const string Understanding = "understanding";

    /// <summary>Policy for the simulation session endpoints.</summary>
    public const string Simulation = "simulation";

    /// <summary>Policy for starting a simulation session.</summary>
    public const string SimulationStart = "simulation-start";

    /// <summary>Registers the policies. A caller over its limit is answered 429, which the rooms treat as "work offline".</summary>
    public static IServiceCollection AddNabdRateLimits(this IServiceCollection services, IConfiguration configuration)
    {
        var limits = configuration.GetSection(RateLimitOptions.SectionName).Get<RateLimitOptions>() ?? new RateLimitOptions();
        return services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(Understanding, context => PerCaller(context, Understanding, limits.UnderstandingPerMinute));
            options.AddPolicy(Simulation, context => PerCaller(context, Simulation, limits.SimulationPerMinute));
            options.AddPolicy(SimulationStart, context => PerCaller(context, SimulationStart, limits.SimulationStartsPerMinute));
        });
    }

    private static RateLimitPartition<string> PerCaller(HttpContext context, string policy, int perMinute) =>
        RateLimitPartition.GetFixedWindowLimiter(
            policy + ":" + CallerKey(context.Connection.RemoteIpAddress),
            _ => new FixedWindowRateLimiterOptions { PermitLimit = Math.Max(1, perMinute), Window = TimeSpan.FromMinutes(1), QueueLimit = 0 });

    /// <summary>
    /// One caller, as far as an address can tell. An IPv6 subscriber holds a whole /64 network and can use a new
    /// address for every request, so the first 64 bits identify the caller; an IPv4 address identifies it whole.
    /// </summary>
    internal static string CallerKey(IPAddress? address)
    {
        if (address is null) return "unknown";
        if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();
        if (address.AddressFamily != AddressFamily.InterNetworkV6) return address.ToString();
        return Convert.ToHexStringLower(address.GetAddressBytes().AsSpan(0, 8)) + "::/64";
    }
}
