using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Nabd.Web.Http;

/// <summary>
/// Refuses a request that a browser sent from another site. A browser states the page's origin in the Origin
/// header of every cross-site request and of every POST; when that origin is not this application's, the request
/// is answered 403. A request without the header (a same-site GET, a server-side caller) is not affected.
/// </summary>
/// <remarks>
/// This keeps other websites from spending the application's understanding-service budget through their visitors'
/// browsers. It is not authentication: the application has none in this phase.
/// </remarks>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class SameOriginOnlyAttribute : Attribute, IResourceFilter
{
    /// <inheritdoc />
    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        ArgumentNullException.ThrowIfNull(context);
        var request = context.HttpContext.Request;
        var origin = request.Headers.Origin.ToString();
        if (origin.Length == 0) return;
        // Host and port decide. The scheme is left out on purpose: behind a proxy that ends TLS the application
        // sees http while the browser's origin says https, and another site never shares this host.
        if (Uri.TryCreate(origin, UriKind.Absolute, out var from)
            && string.Equals(from.Authority, request.Host.Value, StringComparison.OrdinalIgnoreCase)) return;
        context.Result = new ContentResult { StatusCode = StatusCodes.Status403Forbidden, ContentType = "application/json", Content = "{\"error\":\"origin\"}" };
    }

    /// <inheritdoc />
    public void OnResourceExecuted(ResourceExecutedContext context)
    {
    }
}
