namespace Nabd.Application.Abstractions.Ai;

/// <summary>The external services that read what a trainee wrote and voice the people in the room.</summary>
public enum UnderstandingService
{
    /// <summary>The service behind the emergency room (reader, voices, handover grading).</summary>
    ErRoom,

    /// <summary>The service behind the respiratory room.</summary>
    RespiratoryRoom,
}

/// <summary>A request relayed to an understanding service.</summary>
/// <param name="Service">Which service.</param>
/// <param name="JsonBody">The JSON body, exactly as the room built it.</param>
public sealed record UnderstandingRequest(UnderstandingService Service, ReadOnlyMemory<byte> JsonBody);

/// <summary>What the understanding service answered.</summary>
/// <param name="StatusCode">Its HTTP status. The rooms read the status to decide whether to work offline.</param>
/// <param name="Body">The response body, unchanged.</param>
/// <param name="MediaType">The media type of the body.</param>
public sealed record UnderstandingResponse(int StatusCode, ReadOnlyMemory<byte> Body, string MediaType)
{
    /// <summary>The answer when the service is switched off, unreachable or too slow: the rooms then work offline.</summary>
    public static UnderstandingResponse Unavailable { get; } =
        new(503, "{\"error\":\"unavailable\"}"u8.ToArray(), "application/json");
}

/// <summary>
/// The way out to the understanding services. The application relays; it holds no model key and no prompt.
/// </summary>
/// <remarks>
/// This is the seam where the multi-agent system will plug in: when the agents of
/// <see cref="Agents.IAgentOrchestrator"/> exist, the use case that relays a message today will ask the
/// orchestrator instead, and the rooms will not notice.
/// </remarks>
public interface IUnderstandingServiceGateway
{
    /// <summary>Relays a request and returns the service's answer, or <see cref="UnderstandingResponse.Unavailable"/>.</summary>
    Task<UnderstandingResponse> SendAsync(UnderstandingRequest request, CancellationToken cancellationToken = default);

    /// <summary>True when the service answers its health check. No model is called.</summary>
    Task<bool> IsAvailableAsync(UnderstandingService service, CancellationToken cancellationToken = default);
}
