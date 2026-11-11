using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Nabd.Application.Abstractions.Ai;
using Nabd.Application.Dialogue;
using Nabd.Web.Http;

namespace Nabd.Web.Controllers.Api;

/// <summary>
/// The rooms' way to the understanding services. The paths are the ones the legacy client has always called
/// (<c>/api/er-chat</c>, <c>/api/resp-chat</c>), so the rooms work unchanged; behind them the request goes through
/// the application layer, which checks it and relays it.
/// </summary>
[SameOriginOnly]
[EnableRateLimiting(RateLimitPolicies.Understanding)]
public sealed class UnderstandingController(ProcessPatientMessage processPatientMessage) : ControllerBase
{
    /// <summary>A turn, a spoken line or a handover grade of the emergency room.</summary>
    [HttpPost("/api/er-chat")]
    public Task ErChat(CancellationToken cancellationToken) => RelayAsync(UnderstandingService.ErRoom, cancellationToken);

    /// <summary>Health check of the emergency room's service (<c>?ping=1</c>). No model is called.</summary>
    [HttpGet("/api/er-chat")]
    public Task ErPing(CancellationToken cancellationToken) => PingAsync(UnderstandingService.ErRoom, cancellationToken);

    /// <summary>A question to the patient of the respiratory room.</summary>
    [HttpPost("/api/resp-chat")]
    public Task RespChat(CancellationToken cancellationToken) => RelayAsync(UnderstandingService.RespiratoryRoom, cancellationToken);

    /// <summary>Health check of the respiratory room's service.</summary>
    [HttpGet("/api/resp-chat")]
    public Task RespPing(CancellationToken cancellationToken) => PingAsync(UnderstandingService.RespiratoryRoom, cancellationToken);

    private async Task RelayAsync(UnderstandingService service, CancellationToken cancellationToken)
    {
        var body = await ReadBodyAsync(cancellationToken);
        var response = body is null
            ? new UnderstandingResponse(StatusCodes.Status413PayloadTooLarge, "{\"error\":\"too large\"}"u8.ToArray(), "application/json")
            : await processPatientMessage.HandleAsync(new ProcessPatientMessageCommand(service, body), cancellationToken);
        await WriteAsync(response.StatusCode, response.MediaType, response.Body, cancellationToken);
    }

    private async Task PingAsync(UnderstandingService service, CancellationToken cancellationToken)
    {
        if (!Request.Query.ContainsKey("ping"))
        {
            await WriteAsync(StatusCodes.Status405MethodNotAllowed, "application/json", "{\"error\":\"POST only\"}"u8.ToArray(), cancellationToken);
            return;
        }

        var available = await processPatientMessage.IsAvailableAsync(service, cancellationToken);
        await WriteAsync(
            available ? StatusCodes.Status200OK : StatusCodes.Status503ServiceUnavailable,
            "application/json",
            available ? "{\"ok\":true}"u8.ToArray() : "{\"ok\":false}"u8.ToArray(),
            cancellationToken);
    }

    /// <summary>Reads the request body, or returns null when it is larger than the application relays.</summary>
    private async Task<byte[]?> ReadBodyAsync(CancellationToken cancellationToken)
    {
        if (Request.ContentLength > ProcessPatientMessage.MaximumBodyBytes) return null;
        using var buffer = new MemoryStream();
        var chunk = new byte[8192];
        int read;
        while ((read = await Request.Body.ReadAsync(chunk, cancellationToken)) > 0)
        {
            if (buffer.Length + read > ProcessPatientMessage.MaximumBodyBytes) return null;
            buffer.Write(chunk, 0, read);
        }

        return buffer.ToArray();
    }

    private async Task WriteAsync(int status, string mediaType, ReadOnlyMemory<byte> body, CancellationToken cancellationToken)
    {
        Response.StatusCode = status;
        Response.ContentType = mediaType;
        Response.Headers.CacheControl = "no-store";
        Response.ContentLength = body.Length;
        await Response.Body.WriteAsync(body, cancellationToken);
    }
}
