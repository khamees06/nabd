using System.Text.Json;
using Microsoft.Extensions.Logging;
using Nabd.Application.Abstractions.Ai;
using Nabd.Application.Abstractions.Data;

namespace Nabd.Application.Dialogue;

/// <summary>A message from a room that needs the understanding service: a turn, a spoken line or a handover grade.</summary>
/// <param name="Service">The room's service.</param>
/// <param name="JsonBody">The request body the room built.</param>
public sealed record ProcessPatientMessageCommand(UnderstandingService Service, ReadOnlyMemory<byte> JsonBody);

/// <summary>
/// Use case: process a patient message. The room's request is checked and relayed to the understanding service,
/// and the service's answer is returned as it came.
/// </summary>
/// <remarks>
/// The reading rules, the prompts and the model key live in that external service, not here. This use case is
/// the one place the application decides what may be sent out: the body must be a JSON object of a sane size
/// and, for the emergency room, must name a case the application knows. When the multi-agent system exists,
/// this use case is where it replaces the relay.
/// </remarks>
public sealed class ProcessPatientMessage(IUnderstandingServiceGateway gateway, IClinicalCaseRepository cases, ILogger<ProcessPatientMessage> logger)
{
    /// <summary>The largest request body that is relayed.</summary>
    public const int MaximumBodyBytes = 64 * 1024;

    private static readonly UnderstandingResponse BadRequest = new(400, "{\"error\":\"bad request\"}"u8.ToArray(), "application/json");
    private static readonly UnderstandingResponse UnknownCase = new(400, "{\"error\":\"case\"}"u8.ToArray(), "application/json");
    private static readonly UnderstandingResponse TooLarge = new(413, "{\"error\":\"too large\"}"u8.ToArray(), "application/json");

    /// <summary>Checks and relays the message.</summary>
    public async Task<UnderstandingResponse> HandleAsync(ProcessPatientMessageCommand command, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        if (command.JsonBody.Length > MaximumBodyBytes) return TooLarge;
        string? caseId = null;
        try
        {
            using var body = JsonDocument.Parse(command.JsonBody);
            if (body.RootElement.ValueKind != JsonValueKind.Object) return BadRequest;
            if (body.RootElement.TryGetProperty("case", out var c) && c.ValueKind == JsonValueKind.String) caseId = c.GetString();
        }
        catch (JsonException)
        {
            return BadRequest;
        }

        if (command.Service == UnderstandingService.ErRoom)
        {
            if (caseId is null || await cases.FindAsync(caseId, cancellationToken).ConfigureAwait(false) is null) return UnknownCase;
        }

        var response = await gateway.SendAsync(new UnderstandingRequest(command.Service, command.JsonBody), cancellationToken).ConfigureAwait(false);
        if (response.StatusCode >= 400) logger.LogWarning("Understanding service {Service} answered {Status}", command.Service, response.StatusCode);
        return response;
    }

    /// <summary>True when the room's service answers its health check; no model is called.</summary>
    public Task<bool> IsAvailableAsync(UnderstandingService service, CancellationToken cancellationToken = default) =>
        gateway.IsAvailableAsync(service, cancellationToken);
}
