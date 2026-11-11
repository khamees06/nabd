using System.Net.Http.Headers;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nabd.Application.Abstractions.Ai;

namespace Nabd.Infrastructure.Ai;

/// <summary>Where one understanding service is and how long it may take.</summary>
public sealed class UnderstandingEndpointOptions
{
    /// <summary>False switches the service off: every request is answered "unavailable" and the room works offline.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Absolute URL of the service.</summary>
    public string Endpoint { get; set; } = "";

    /// <summary>Seconds to wait for an answer. The rooms themselves give up after 15 seconds.</summary>
    public int TimeoutSeconds { get; set; } = 20;

    /// <summary>
    /// The Origin header sent with each request. Empty means the origin of <see cref="Endpoint"/> itself.
    /// The existing functions refuse a request whose origin they do not know (see the remarks on the gateway).
    /// </summary>
    public string Origin { get; set; } = "";
}

/// <summary>The understanding services the application relays to.</summary>
public sealed class UnderstandingServicesOptions
{
    /// <summary>Configuration section name.</summary>
    public const string SectionName = "UnderstandingServices";

    /// <summary>The service behind the emergency room.</summary>
    public UnderstandingEndpointOptions ErRoom { get; set; } = new();

    /// <summary>The service behind the respiratory room.</summary>
    public UnderstandingEndpointOptions RespiratoryRoom { get; set; } = new();

    /// <summary>The options of one service.</summary>
    public UnderstandingEndpointOptions For(UnderstandingService service) =>
        service == UnderstandingService.ErRoom ? ErRoom : RespiratoryRoom;
}

/// <summary>
/// Relays requests to the understanding services over HTTP. The services are the existing serverless functions:
/// they hold the model key and the prompts; this adapter holds neither.
/// </summary>
/// <remarks>
/// <para>
/// The functions were written to be called by a browser: they accept a request only when its Origin header is
/// their own host or a site on their allow-list, and they limit requests per caller address. A server-side
/// caller has no origin of its own, so this adapter sends the configured <see cref="UnderstandingEndpointOptions.Origin"/>,
/// by default the function's own. That is a stop-gap of this phase, recorded in docs/decisions/0006: before the
/// application serves real users, the functions should recognise it by a shared secret instead, and should not
/// count all of its users as one caller address.
/// </para>
/// <para>
/// Failures of any kind (switched off, unreachable, too slow) become
/// <see cref="UnderstandingResponse.Unavailable"/>, which the rooms answer by working offline.
/// </para>
/// </remarks>
public sealed class HttpUnderstandingServiceGateway : IUnderstandingServiceGateway
{
    /// <summary>Name of the HTTP client this adapter uses.</summary>
    public const string HttpClientName = "understanding-services";

    private const int MaximumResponseBytes = 256 * 1024;

    private readonly IHttpClientFactory _clients;
    private readonly UnderstandingServicesOptions _options;
    private readonly ILogger<HttpUnderstandingServiceGateway> _logger;

    /// <summary>Creates the gateway.</summary>
    public HttpUnderstandingServiceGateway(IHttpClientFactory clients, IOptions<UnderstandingServicesOptions> options, ILogger<HttpUnderstandingServiceGateway> logger)
    {
        ArgumentNullException.ThrowIfNull(options);
        _clients = clients;
        _options = options.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<UnderstandingResponse> SendAsync(UnderstandingRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var endpoint = _options.For(request.Service);
        if (!TryGetUri(endpoint, out var uri)) return UnderstandingResponse.Unavailable;
        using var message = new HttpRequestMessage(HttpMethod.Post, uri) { Content = new ReadOnlyMemoryContent(request.JsonBody) };
        message.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
        return await RelayAsync(request.Service, endpoint, message, cancellationToken).ConfigureAwait(false) ?? UnderstandingResponse.Unavailable;
    }

    /// <inheritdoc />
    public async Task<bool> IsAvailableAsync(UnderstandingService service, CancellationToken cancellationToken = default)
    {
        var endpoint = _options.For(service);
        if (!TryGetUri(endpoint, out var uri)) return false;
        using var message = new HttpRequestMessage(HttpMethod.Get, new UriBuilder(uri) { Query = "ping=1" }.Uri);
        var response = await RelayAsync(service, endpoint, message, cancellationToken).ConfigureAwait(false);
        return response is { StatusCode: >= 200 and < 300 };
    }

    private async Task<UnderstandingResponse?> RelayAsync(UnderstandingService service, UnderstandingEndpointOptions endpoint, HttpRequestMessage message, CancellationToken cancellationToken)
    {
        message.Headers.TryAddWithoutValidation("Origin", string.IsNullOrWhiteSpace(endpoint.Origin) ? message.RequestUri!.GetLeftPart(UriPartial.Authority) : endpoint.Origin);
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Clamp(endpoint.TimeoutSeconds, 1, 60)));
        try
        {
            using var response = await _clients.CreateClient(HttpClientName).SendAsync(message, HttpCompletionOption.ResponseHeadersRead, timeout.Token).ConfigureAwait(false);
            var body = await ReadLimitedAsync(response.Content, timeout.Token).ConfigureAwait(false);
            return new UnderstandingResponse((int)response.StatusCode, body, response.Content.Headers.ContentType?.MediaType ?? "application/json");
        }
        catch (Exception e) when (e is HttpRequestException or OperationCanceledException or IOException)
        {
            // The caller's own cancellation is not a failure of the service.
            if (cancellationToken.IsCancellationRequested) throw;
            _logger.LogWarning("Understanding service {Service} could not be reached: {Reason}", service, e.GetType().Name);
            return null;
        }
    }

    private static bool TryGetUri(UnderstandingEndpointOptions endpoint, out Uri uri)
    {
        uri = null!;
        return endpoint.Enabled
            && Uri.TryCreate(endpoint.Endpoint, UriKind.Absolute, out uri!)
            && (uri.Scheme == Uri.UriSchemeHttps || uri.IsLoopback);
    }

    private static async Task<byte[]> ReadLimitedAsync(HttpContent content, CancellationToken cancellationToken)
    {
        await using var stream = await content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
        using var buffer = new MemoryStream();
        var chunk = new byte[8192];
        int read;
        while ((read = await stream.ReadAsync(chunk, cancellationToken).ConfigureAwait(false)) > 0)
        {
            if (buffer.Length + read > MaximumResponseBytes) throw new IOException("The understanding service sent more than it may.");
            buffer.Write(chunk, 0, read);
        }

        return buffer.ToArray();
    }
}
