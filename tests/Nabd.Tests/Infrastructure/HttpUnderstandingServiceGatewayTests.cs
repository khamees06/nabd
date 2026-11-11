using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Nabd.Application.Abstractions.Ai;
using Nabd.Infrastructure.Ai;

namespace Nabd.Tests.Infrastructure;

/// <summary>The HTTP adapter to the understanding services, against a fake transport: nothing leaves the process.</summary>
public class HttpUnderstandingServiceGatewayTests
{
    private sealed class FakeTransport(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> respond) : HttpMessageHandler
    {
        public List<(HttpMethod Method, Uri Uri, string? Origin, string? Body)> Seen { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var body = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            Seen.Add((request.Method, request.RequestUri!, request.Headers.TryGetValues("Origin", out var o) ? o.Single() : null, body));
            return await respond(request, cancellationToken);
        }
    }

    private sealed class Clients(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private static HttpUnderstandingServiceGateway Gateway(FakeTransport transport, Action<UnderstandingServicesOptions>? configure = null)
    {
        var options = new UnderstandingServicesOptions
        {
            ErRoom = { Endpoint = "https://understanding.example/api/er-chat", TimeoutSeconds = 1 },
            RespiratoryRoom = { Endpoint = "https://understanding.example/api/resp-chat", TimeoutSeconds = 1 },
        };
        configure?.Invoke(options);
        return new HttpUnderstandingServiceGateway(new Clients(transport), Options.Create(options), NullLogger<HttpUnderstandingServiceGateway>.Instance);
    }

    private static HttpResponseMessage Reply(HttpStatusCode status, string json) => new(status) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    private static UnderstandingRequest Turn(UnderstandingService service = UnderstandingService.ErRoom) => new(service, "{\"case\":\"asthma\",\"text\":\"مرحبا\"}"u8.ToArray());

    [Fact]
    public async Task The_body_is_posted_to_the_service_and_its_answer_is_returned_as_it_came()
    {
        var transport = new FakeTransport((_, _) => Task.FromResult(Reply(HttpStatusCode.OK, "{\"reply\":\"أهلاً\"}")));

        var response = await Gateway(transport).SendAsync(Turn());

        Assert.Equal(200, response.StatusCode);
        Assert.Equal("{\"reply\":\"أهلاً\"}", Encoding.UTF8.GetString(response.Body.Span));
        var seen = Assert.Single(transport.Seen);
        Assert.Equal(HttpMethod.Post, seen.Method);
        Assert.Equal("https://understanding.example/api/er-chat", seen.Uri.ToString());
        Assert.Equal("{\"case\":\"asthma\",\"text\":\"مرحبا\"}", seen.Body);
        Assert.Equal("https://understanding.example", seen.Origin);
    }

    [Fact]
    public async Task Each_room_goes_to_its_own_endpoint_and_a_configured_origin_is_used()
    {
        var transport = new FakeTransport((_, _) => Task.FromResult(Reply(HttpStatusCode.Gone, "{\"error\":\"room closed\"}")));

        var response = await Gateway(transport, o => o.RespiratoryRoom.Origin = "https://nabd.example").SendAsync(Turn(UnderstandingService.RespiratoryRoom));

        Assert.Equal(410, response.StatusCode); // an error status is passed on, not hidden
        Assert.Equal("https://understanding.example/api/resp-chat", transport.Seen.Single().Uri.ToString());
        Assert.Equal("https://nabd.example", transport.Seen.Single().Origin);
    }

    [Fact]
    public async Task A_service_that_is_switched_off_is_never_called()
    {
        var transport = new FakeTransport((_, _) => Task.FromResult(Reply(HttpStatusCode.OK, "{}")));
        var gateway = Gateway(transport, o => o.ErRoom.Enabled = false);

        Assert.Equal(503, (await gateway.SendAsync(Turn())).StatusCode);
        Assert.False(await gateway.IsAvailableAsync(UnderstandingService.ErRoom));
        Assert.Empty(transport.Seen);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not a url")]
    [InlineData("http://plain-http.example/api/er-chat")]
    public async Task An_endpoint_that_is_missing_or_not_https_is_never_called(string endpoint)
    {
        var transport = new FakeTransport((_, _) => Task.FromResult(Reply(HttpStatusCode.OK, "{}")));
        var response = await Gateway(transport, o => o.ErRoom.Endpoint = endpoint).SendAsync(Turn());
        Assert.Equal(503, response.StatusCode);
        Assert.Empty(transport.Seen);
    }

    [Fact]
    public async Task A_service_that_cannot_be_reached_or_is_too_slow_reads_as_unavailable()
    {
        var down = new FakeTransport((_, _) => throw new HttpRequestException("connection refused"));
        Assert.Equal(503, (await Gateway(down).SendAsync(Turn())).StatusCode);

        var slow = new FakeTransport(async (_, ct) => { await Task.Delay(TimeSpan.FromSeconds(30), ct); return Reply(HttpStatusCode.OK, "{}"); });
        Assert.Equal(503, (await Gateway(slow).SendAsync(Turn())).StatusCode);
    }

    [Fact]
    public async Task The_health_check_is_a_get_with_ping_and_follows_the_status()
    {
        var transport = new FakeTransport((_, _) => Task.FromResult(Reply(HttpStatusCode.OK, "{\"ok\":true}")));
        Assert.True(await Gateway(transport).IsAvailableAsync(UnderstandingService.ErRoom));
        Assert.Equal((HttpMethod.Get, "https://understanding.example/api/er-chat?ping=1"), (transport.Seen.Single().Method, transport.Seen.Single().Uri.ToString()));

        var notConfigured = new FakeTransport((_, _) => Task.FromResult(Reply(HttpStatusCode.ServiceUnavailable, "{\"ok\":false}")));
        Assert.False(await Gateway(notConfigured).IsAvailableAsync(UnderstandingService.ErRoom));
    }

    [Fact]
    public async Task An_answer_far_larger_than_any_real_one_is_not_passed_on()
    {
        var transport = new FakeTransport((_, _) => Task.FromResult(Reply(HttpStatusCode.OK, new string('x', 400 * 1024))));
        Assert.Equal(503, (await Gateway(transport).SendAsync(Turn())).StatusCode);
    }
}
