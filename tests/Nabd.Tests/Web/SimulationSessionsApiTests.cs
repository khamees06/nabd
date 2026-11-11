using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Nabd.Tests.Web;

/// <summary>The server-side session API over HTTP, from start to report.</summary>
public class SimulationSessionsApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public SimulationSessionsApiTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private HttpClient Client(bool enabled = true) =>
        _factory.WithWebHostBuilder(b => b.UseSetting("Simulation:ServerSessionsApi:Enabled", enabled ? "true" : "false")).CreateClient();

    [Fact]
    public async Task The_api_does_not_exist_where_it_is_switched_off()
    {
        var response = await Client(enabled: false).PostAsJsonAsync("/api/simulation/sessions", new { caseId = "sepsis", role = "Doctor" });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task A_session_runs_from_start_to_report_over_http()
    {
        var client = Client();

        var started = await client.PostAsJsonAsync("/api/simulation/sessions", new { caseId = "sepsis", role = "Doctor" });
        Assert.Equal(HttpStatusCode.Created, started.StatusCode);
        using var start = JsonDocument.Parse(await started.Content.ReadAsStringAsync());
        var id = start.RootElement.GetProperty("sessionId").GetString();
        Assert.Equal("Calm", start.RootElement.GetProperty("stage").GetString());
        Assert.Equal(104, start.RootElement.GetProperty("cuffSystolic").GetInt32());

        // What a trainee may see is the monitor; the patient's risk and its rate never appear in a response.
        foreach (var hidden in new[] { "risk", "netRiskRate", "riskSlowings", "indication" })
        {
            Assert.False(start.RootElement.TryGetProperty(hidden, out _), $"'{hidden}' must not be sent to the browser");
        }

        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/advance", new { elapsedSeconds = 30 })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/interventions", new { actionId = "oxygen", dose = "15 L/min", amount = 15 })).StatusCode);

        var ordered = await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/tests", new { testId = "lactate", reasonGrade = "good" });
        Assert.Equal(HttpStatusCode.OK, ordered.StatusCode);
        Assert.DoesNotContain("indication", await ordered.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);

        var harmed = await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/harmful-orders", new { actionId = "sedative", dose = "", allergic = false, harm = new { label = "مهدئ", risk = 14 } });
        Assert.Equal(HttpStatusCode.OK, harmed.StatusCode);

        Assert.Equal(HttpStatusCode.Conflict, (await client.GetAsync($"/api/simulation/sessions/{id}/report")).StatusCode);

        var completed = await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/completion", new
        {
            handover = new { destination = "icu", diagnosis = "Right", statesSituation = true, givesBackground = true, givesAssessment = true, makesRecommendation = true, claimsTreatmentNotGiven = false, gradedByService = true },
            communication = new { introduced = true, explained = false, showedEmpathy = true, rudeRemarks = 0, jargonRemarks = 0 },
        });
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        using var report = JsonDocument.Parse(await completed.Content.ReadAsStringAsync());
        Assert.True(report.RootElement.GetProperty("snapshot").GetProperty("isOver").GetBoolean());
        Assert.Equal("Unstable", report.RootElement.GetProperty("snapshot").GetProperty("outcome").GetString());
        Assert.False(report.RootElement.GetProperty("verdict").GetProperty("passed").GetBoolean());
        Assert.Contains("PatientHarmed", report.RootElement.GetProperty("verdict").GetProperty("failures").EnumerateArray().Select(f => f.GetString()));
        Assert.Equal(15, report.RootElement.GetProperty("score").GetProperty("diagnosis").GetDouble());

        var read = await client.GetAsync($"/api/simulation/sessions/{id}/report");
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);
        Assert.Equal("no-store", read.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task Wrong_requests_get_a_problem_document_and_never_a_stack_trace()
    {
        var client = Client();

        var unknownCase = await client.PostAsJsonAsync("/api/simulation/sessions", new { caseId = "nope" });
        Assert.Equal(HttpStatusCode.NotFound, unknownCase.StatusCode);
        Assert.Equal("application/problem+json", unknownCase.Content.Headers.ContentType?.MediaType);

        var unknownSession = await client.PostAsJsonAsync("/api/simulation/sessions/00000000000000000000000000000000/advance", new { elapsedSeconds = 1 });
        Assert.Equal(HttpStatusCode.NotFound, unknownSession.StatusCode);

        var malformed = await client.PostAsync("/api/simulation/sessions", new StringContent("{ not json", System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, malformed.StatusCode);
        Assert.DoesNotContain("   at ", await malformed.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }
}
