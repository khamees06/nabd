using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Options;
using Nabd.Infrastructure.LegacyData;
using Nabd.Tests.Support;
using Nabd.Web.Http;

namespace Nabd.Tests.Web;

/// <summary>
/// One test per defect that the independent review of this phase confirmed and that was then fixed.
/// Each name says what must hold; the comment says what went wrong before.
/// </summary>
public class ReviewFindingsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ReviewFindingsTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private HttpClient Client(bool sessionsApi = true) =>
        _factory.WithWebHostBuilder(b => b.UseSetting("Simulation:ServerSessionsApi:Enabled", sessionsApi ? "true" : "false")).CreateClient();

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    private static async Task<string> StartAsync(HttpClient client, string caseId = "sepsis")
    {
        var started = await client.PostAsJsonAsync("/api/simulation/sessions", new { caseId, role = "Doctor" });
        started.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await started.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("sessionId").GetString()!;
    }

    [Theory]
    [InlineData("{ not json")]
    [InlineData("{}")]
    [InlineData("{\"caseId\":\"sepsis\"}")]
    public async Task A_switched_off_session_api_answers_404_whatever_is_sent(string body)
    {
        // Before: the body was read and validated first, so a malformed body got 400 and revealed the endpoint.
        var response = await Client(sessionsApi: false).PostAsync("/api/simulation/sessions", Json(body));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task A_body_that_cannot_be_read_is_refused_without_naming_internal_types()
    {
        // Before: the serializer's message was returned, with the CLR type name of the request record.
        var response = await Client().PostAsync("/api/simulation/sessions", Json("{\"caseId\": 5, \"role\": \"Wizard\"}"));
        var text = await response.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.DoesNotContain("Nabd.", text, StringComparison.Ordinal);
        Assert.DoesNotContain("System.", text, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("/api/simulation/sessions/00000000000000000000000000000000/report")]
    [InlineData("/data/unknown.json")]
    [InlineData("/no-such-page")]
    public async Task Error_responses_carry_the_protective_headers_too(string path)
    {
        var response = await Client().GetAsync(path);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("SAMEORIGIN", response.Headers.GetValues("X-Frame-Options").Single());
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/js/ui.js")]
    [InlineData("/data/er-lang.json")]
    [InlineData("/healthz")]
    public async Task Head_requests_are_answered_like_get(string path)
    {
        // Before: 405. Link checkers, monitors and some proxies ask with HEAD.
        // (The body is dropped by the real server; the in-memory test server does not drop it, so only the
        // status is checked here.)
        var response = await Client().SendAsync(new HttpRequestMessage(HttpMethod.Head, path));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("1e999")]
    [InlineData("-5")]
    [InlineData("250")]
    public async Task A_harm_with_a_number_out_of_range_is_refused(string risk)
    {
        // Before: an exponent beyond the range of a double became infinity, the risk became "not a number", and the
        // session could no longer be completed.
        var client = Client();
        var id = await StartAsync(client);
        var response = await client.PostAsync($"/api/simulation/sessions/{id}/harmful-orders", Json($"{{\"actionId\":\"sedative\",\"harm\":{{\"label\":\"x\",\"risk\":{risk}}}}}"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var completed = await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/completion", new
        {
            handover = new { destination = "icu", diagnosis = "Close", statesSituation = true, givesBackground = true, givesAssessment = true, makesRecommendation = true, claimsTreatmentNotGiven = false, gradedByService = false },
            communication = new { introduced = true, explained = true, showedEmpathy = true, rudeRemarks = 0, jargonRemarks = 0 },
        });
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
    }

    [Fact]
    public async Task Measuring_the_temperature_makes_it_known()
    {
        // Before: the order was recorded but the monitor's temperature stayed unknown on the server path.
        var client = Client();
        var id = await StartAsync(client);
        var response = await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/interventions", new { actionId = "temp" });
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var clinicalCase = await TestData.CaseRepository.FindAsync("sepsis");
        Assert.Equal(clinicalCase!.Temperature, doc.RootElement.GetProperty("temperature").GetDouble());
    }

    [Fact]
    public async Task The_clock_keeps_what_is_left_of_a_step_for_the_next_call()
    {
        // Before: each call dropped or added up to half a step, so the clock ran at a pace that depended on how
        // often the caller called. 100 calls of 0.05 s must be 5 s: 50 steps of 0.1 s.
        var client = Client();
        var id = await StartAsync(client);
        JsonDocument? last = null;
        for (var i = 0; i < 100; i++)
        {
            var r = await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/advance", new { elapsedSeconds = 0.05 });
            last?.Dispose();
            last = JsonDocument.Parse(await r.Content.ReadAsStringAsync());
        }

        Assert.Equal(5.0 / 60, last!.RootElement.GetProperty("simulatedMinutes").GetDouble(), precision: 9);
        last.Dispose();
    }

    [Fact]
    public async Task What_happened_to_tests_and_doses_reaches_the_score()
    {
        // Before: rejected doses, a misread result and an accepted justification had no way into the server score.
        var client = Client();
        var clinicalCase = (await TestData.CaseRepository.FindAsync("asthma"))!;
        // A test the case marks as not needed (and not dangerous): the kind a written justification can excuse.
        var unneeded = clinicalCase.ExpectedResults.First(r => r.Indication == Nabd.Domain.Simulation.TestIndication.NotIndicated && r.WhenShocked is null).TestId;
        async Task<JsonDocument> RunAsync(object extra)
        {
            var id = await StartAsync(client, "asthma");
            // Every indicated test is ordered, so the tests score is not at its floor and a change shows.
            foreach (var indicated in clinicalCase.ExpectedResults.Where(r => r.Indication == Nabd.Domain.Simulation.TestIndication.Indicated))
            {
                await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/tests", new { testId = indicated.TestId, reasonGrade = "good" });
            }

            await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/tests", new { testId = unneeded, reasonGrade = "good" });
            var body = new Dictionary<string, object?>
            {
                ["handover"] = new { destination = "icu", diagnosis = "Right", statesSituation = true, givesBackground = true, givesAssessment = true, makesRecommendation = true, claimsTreatmentNotGiven = false, gradedByService = true },
                ["communication"] = new { introduced = true, explained = true, showedEmpathy = true, rudeRemarks = 0, jargonRemarks = 0 },
            };
            foreach (var p in extra.GetType().GetProperties()) body[p.Name] = p.GetValue(extra);
            var completed = await client.PostAsJsonAsync($"/api/simulation/sessions/{id}/completion", body);
            Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
            return JsonDocument.Parse(await completed.Content.ReadAsStringAsync());
        }

        using var plain = await RunAsync(new { });
        using var noted = await RunAsync(new { rejectedDoses = 2, testNotes = new[] { new { testId = unneeded, readWrongly = true, justificationAccepted = true } } });
        var plainTests = plain.RootElement.GetProperty("score").GetProperty("tests").GetDouble();
        var notedTests = noted.RootElement.GetProperty("score").GetProperty("tests").GetDouble();
        Assert.Equal(2, noted.RootElement.GetProperty("wrongDoseCount").GetInt32());
        // An accepted justification takes back the 3 points of a test outside the indication; a misread result costs 2.
        Assert.Equal(plainTests + 3 - 2, notedTests);

        var id2 = await StartAsync(client, "asthma");
        var unknownNote = await client.PostAsJsonAsync($"/api/simulation/sessions/{id2}/completion", new
        {
            handover = new { destination = "icu", diagnosis = "Right", statesSituation = true, givesBackground = true, givesAssessment = true, makesRecommendation = true, claimsTreatmentNotGiven = false, gradedByService = true },
            communication = new { introduced = true, explained = true, showedEmpathy = true, rudeRemarks = 0, jargonRemarks = 0 },
            testNotes = new[] { new { testId = "ecg", readWrongly = true, justificationAccepted = false } },
        });
        Assert.Equal(HttpStatusCode.BadRequest, unknownNote.StatusCode);
    }

    [Fact]
    public void One_ipv6_subscriber_is_one_caller_however_many_addresses_it_uses()
    {
        // Before: every address of a /64 network had its own allowance.
        var a = RateLimitPolicies.CallerKey(IPAddress.Parse("2001:db8:1:2:aaaa:bbbb:cccc:dddd"));
        var b = RateLimitPolicies.CallerKey(IPAddress.Parse("2001:db8:1:2::1"));
        var other = RateLimitPolicies.CallerKey(IPAddress.Parse("2001:db8:1:3::1"));
        Assert.Equal(a, b);
        Assert.NotEqual(a, other);
        Assert.Equal("203.0.113.9", RateLimitPolicies.CallerKey(IPAddress.Parse("::ffff:203.0.113.9")));
        Assert.Equal("unknown", RateLimitPolicies.CallerKey(null));
    }

    [Fact]
    public async Task Starting_sessions_is_limited_more_tightly_than_using_them()
    {
        // Before: one caller could fill the 500-session store in about two minutes.
        var client = _factory.WithWebHostBuilder(b =>
        {
            b.UseSetting("Simulation:ServerSessionsApi:Enabled", "true");
            b.UseSetting("RateLimits:SimulationStartsPerMinute", "2");
        }).CreateClient();
        var statuses = new List<int>();
        for (var i = 0; i < 4; i++) statuses.Add((int)(await client.PostAsJsonAsync("/api/simulation/sessions", new { caseId = "asthma" })).StatusCode);
        Assert.Equal([201, 201, 429, 429], statuses);
    }

    [Fact]
    public async Task A_failed_read_of_the_case_file_is_not_remembered()
    {
        // Before: the first failure was cached, and every later request failed until the process restarted.
        var folder = Directory.CreateTempSubdirectory("nabd-cases-");
        try
        {
            var repository = new JsonClinicalCaseRepository(new LegacyDataFiles(Options.Create(new LegacyDataOptions { RootPath = folder.FullName })));
            await Assert.ThrowsAnyAsync<IOException>(() => repository.FindAsync("asthma"));
            File.Copy(Path.Combine(TestData.LegacyDataFiles.RootPath, "er-cases.json"), Path.Combine(folder.FullName, "er-cases.json"));
            Assert.NotNull(await repository.FindAsync("asthma"));
        }
        finally
        {
            folder.Delete(recursive: true);
        }
    }
}
