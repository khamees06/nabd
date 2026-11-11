using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;

namespace Nabd.Web.Http;

/// <summary>Results for content that is kept in memory and revalidated by the browser with an entity tag.</summary>
internal static class CachedContentResults
{
    /// <summary>
    /// Sends in-memory content without copying it. The browser keeps it and asks again with If-None-Match; an
    /// unchanged tag is answered with 304 and no body.
    /// </summary>
    public static IActionResult Revalidated(this ControllerBase controller, ReadOnlyMemory<byte> content, string mediaType, string entityTag)
    {
        controller.Response.Headers.CacheControl = "no-cache";
        var stream = MemoryMarshal.TryGetArray(content, out var segment)
            ? new MemoryStream(segment.Array!, segment.Offset, segment.Count, writable: false)
            : new MemoryStream(content.ToArray(), writable: false);
        return controller.File(stream, mediaType, lastModified: null, new EntityTagHeaderValue(entityTag));
    }
}
