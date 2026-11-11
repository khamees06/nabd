using System.Net;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Nabd.Application.Abstractions.Ai;

namespace Nabd.Tests.Web;

/// <summary>
/// The endpoints the rooms call for the understanding services, with the gateway replaced by a recorder: no
/// request of these tests leaves the process.
/// </summary>
public class UnderstandingEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public UnderstandingEndpointTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private sealed class RecordingGateway : IUnderstandingServiceGateway
    {
        public List<UnderstandingRequest> Requests { get; } = [];

        public UnderstandingResponse Answer { get; set; } = new(200, "{\"to\":\"patient\",\"reply\":null,\"read\":{}}"u8.ToArray(), "application/json");

        public bool Available { get; set; } = true;

        public Task<UnderstandingResponse> SendAsync(UnderstandingRequest request, CancellationToken cancellationToken = default)
        {
            Requests.Add(request);
            return Task.FromResult(Answer);
        }

        public Task<bool> IsAvailableAsync(UnderstandingService service, CancellationToken cancellationToken = default) => Task.FromResult(Available);
    }

    private (HttpClient Client, RecordingGateway Gateway) Start(int perMinute = 1000)
    {
        var gateway = new RecordingGateway();
        var client = _factory.WithWebHostBuilder(b =>
        {
            b.UseSetting("RateLimits:UnderstandingPerMinute", perMinute.ToString(System.Globalization.CultureInfo.InvariantCulture));
            b.ConfigureTestServices(s => s.AddSingleton<IUnderstandingServiceGateway>(gateway));
        }).CreateClient();
        return (client, gateway);
    }

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    [Fact]
    public async Task A_room_request_is_relayed_unchanged_and_the_answer_comes_back_unchanged()
    {
        var (client, gateway) = Start();
        const string body = "{\"case\":\"sepsis\",\"risk\":46.5,\"text\":\"عندك حساسية؟\",\"history\":[{\"r\":\"s\",\"t\":\"مرحبا\"}]}";

        var response = await client.PostAsync("/api/er-chat", Json(body));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("{\"to\":\"patient\",\"reply\":null,\"read\":{}}", await response.Content.ReadAsStringAsync());
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        var relayed = Assert.Single(gateway.Requests);
        Assert.Equal(UnderstandingService.ErRoom, relayed.Service);
        Assert.Equal(body, Encoding.UTF8.GetString(relayed.JsonBody.Span));
    }

    [Theory]
    [InlineData(429, "{\"error\":\"slow down\"}")]
    [InlineData(503, "{\"error\":\"not configured\"}")]
    [InlineData(502, "{\"error\":\"empty\"}")]
    public async Task The_status_of_the_service_reaches_the_room_because_the_room_decides_by_it(int status, string body)
    {
        var (client, gateway) = Start();
        gateway.Answer = new UnderstandingResponse(status, Encoding.UTF8.GetBytes(body), "application/json");

        var response = await client.PostAsync("/api/er-chat", Json("{\"case\":\"asthma\",\"text\":\"x\"}"));

        Assert.Equal(status, (int)response.StatusCode);
        Assert.Equal(body, await response.Content.ReadAsStringAsync());
    }

    [Theory]
    [InlineData("{\"case\":\"no-such-case\",\"text\":\"x\"}", 400)]
    [InlineData("{\"text\":\"x\"}", 400)]
    [InlineData("[1,2,3]", 400)]
    [InlineData("not json", 400)]
    public async Task A_request_the_application_would_not_send_is_refused_before_it_reaches_the_service(string body, int expected)
    {
        var (client, gateway) = Start();
        var response = await client.PostAsync("/api/er-chat", Json(body));
        Assert.Equal(expected, (int)response.StatusCode);
        Assert.Empty(gateway.Requests);
    }

    [Fact]
    public async Task A_body_larger_than_the_limit_is_refused()
    {
        var (client, gateway) = Start();
        var big = "{\"case\":\"asthma\",\"text\":\"" + new string('x', 70 * 1024) + "\"}";
        var response = await client.PostAsync("/api/er-chat", Json(big));
        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
        Assert.Empty(gateway.Requests);
    }

    [Fact]
    public async Task The_respiratory_room_is_relayed_to_its_own_service()
    {
        var (client, gateway) = Start();
        var response = await client.PostAsync("/api/resp-chat", Json("{\"text\":\"وين الوجع؟\",\"history\":[]}"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(UnderstandingService.RespiratoryRoom, Assert.Single(gateway.Requests).Service);
    }

    [Fact]
    public async Task The_health_check_answers_without_calling_a_model()
    {
        var (client, gateway) = Start();

        var up = await client.GetAsync("/api/er-chat?ping=1&_=123");
        Assert.Equal(HttpStatusCode.OK, up.StatusCode);
        Assert.Equal("{\"ok\":true}", await up.Content.ReadAsStringAsync());

        gateway.Available = false;
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/api/er-chat?ping=1")).StatusCode);
        Assert.Equal(HttpStatusCode.MethodNotAllowed, (await client.GetAsync("/api/er-chat")).StatusCode);
        Assert.Empty(gateway.Requests);
    }

    [Fact]
    public async Task A_request_sent_by_a_browser_from_another_site_is_refused()
    {
        var (client, gateway) = Start();
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/er-chat") { Content = Json("{\"case\":\"asthma\",\"text\":\"x\"}") };
        request.Headers.Add("Origin", "https://evil.example");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Empty(gateway.Requests);

        var own = new HttpRequestMessage(HttpMethod.Post, "/api/er-chat") { Content = Json("{\"case\":\"asthma\",\"text\":\"x\"}") };
        own.Headers.Add("Origin", "http://localhost");
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(own)).StatusCode);
    }

    [Fact]
    public async Task A_caller_over_its_limit_is_slowed_down()
    {
        var (client, gateway) = Start(perMinute: 3);
        var statuses = new List<int>();
        for (var i = 0; i < 5; i++) statuses.Add((int)(await client.PostAsync("/api/er-chat", Json("{\"case\":\"asthma\",\"text\":\"x\"}"))).StatusCode);

        Assert.Equal([200, 200, 200, 429, 429], statuses);
        Assert.Equal(3, gateway.Requests.Count);
    }

    [Fact]
    public async Task Every_response_carries_the_protective_headers()
    {
        var (client, _) = Start();
        var response = await client.GetAsync("/");
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("SAMEORIGIN", response.Headers.GetValues("X-Frame-Options").Single());
        Assert.Equal("strict-origin-when-cross-origin", response.Headers.GetValues("Referrer-Policy").Single());
    }
}
