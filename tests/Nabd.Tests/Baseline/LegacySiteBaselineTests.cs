using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Nabd.Tests.Support;

namespace Nabd.Tests.Baseline;

/// <summary>
/// Zero-regression checks of what the browser receives. The application is started in memory and each asset
/// is compared with the frozen legacy site (LegacyBaseline/site, taken from commit 5f431d5):
/// the page, the six script bundles, the nine stylesheets, the data documents and the images.
/// The only differences allowed are the ones registered in LegacyBaseline/seams.json; they are undone on the
/// served text before the comparison, so any other change, down to one character, fails.
/// Four regions of the page were redesigned (the V6.2 landing's public header, landing view and public footer,
/// ADR 0010; the V6.4 sign-in screen, ADR 0012): they are compared with their own approved snapshots in
/// LandingBaseline/, and the rest of the page is still compared with the legacy page.
/// </summary>
public class LegacySiteBaselineTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly Lazy<List<Seam>> Seams = new(LoadSeams);
    private static readonly Lazy<Dictionary<string, (long Bytes, string Sha256)>> Manifest = new(LoadManifest);
    private readonly HttpClient _client;

    public LegacySiteBaselineTests(WebApplicationFactory<Program> factory) => _client = factory.CreateClient();

    public static TheoryData<string> Scripts() => ["script.js", "er.js", "resp.js", "ui.js", "motion.js", "terms.js"];

    public static TheoryData<string> Styles() =>
        ["style.css", "theme.css", "resp.css", "er.css", "scope.css", "home9.css", "landing8.css", "landing9.css", "academic8.css"];

    public static TheoryData<string> DataDocuments() =>
        ["er-act", "er-cases", "er-find", "er-lang", "resp-ar", "resp-clinical", "resp-model", "resp-patients"];

    public static TheoryData<string> LandingRegionNames() => [.. LandingRegions.All.Select(r => r.Name)];

    /// <summary>
    /// The page is the legacy page everywhere except the four redesigned regions: the public header, the landing
    /// view and the public footer (V6.2, ADR 0010) and the sign-in screen (V6.4, ADR 0012). Those are cut out of
    /// both pages and checked on their own against their approved snapshots (next test).
    /// </summary>
    [Fact]
    public async Task The_page_outside_the_landing_regions_is_the_legacy_page()
    {
        var served = await Page();
        var legacy = Legacy("index.html");
        foreach (var region in LandingRegions.All)
        {
            served = LandingRegions.TokenizeServed(served, region.Name);
            legacy = LandingRegions.TokenizeLegacy(legacy, region);
        }

        AssertSameText(legacy, UndoSeams("index.html", served), "the page outside the landing regions");
    }

    /// <summary>Each redesigned region is exactly its approved snapshot (LandingBaseline/NAME.html).</summary>
    [Theory]
    [MemberData(nameof(LandingRegionNames))]
    public async Task Each_redesigned_region_is_its_approved_snapshot(string name)
    {
        var served = await Page();
        AssertSameText(TestData.ReadNormalized(LandingRegions.SnapshotPath(name)), LandingRegions.Extract(served, name), $"landing region '{name}'");
    }

    [Fact]
    public async Task The_landing_regions_come_in_page_order()
    {
        var served = await Page();
        var at = LandingRegions.All.Select(r => served.IndexOf($"<!-- nabd:region {r.Name} ", StringComparison.Ordinal)).ToList();
        Assert.All(at, i => Assert.True(i >= 0));
        Assert.Equal(at.Order(), at);
    }

    private async Task<string> Page()
    {
        var response = await _client.GetAsync("/");
        response.EnsureSuccessStatusCode();
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        return Normalize(await response.Content.ReadAsStringAsync());
    }

    [Theory]
    [MemberData(nameof(Scripts))]
    public async Task Each_script_bundle_is_the_legacy_script(string file)
    {
        var response = await _client.GetAsync("/js/" + file);
        response.EnsureSuccessStatusCode();
        Assert.Equal("text/javascript", response.Content.Headers.ContentType?.MediaType);
        var served = Encoding.UTF8.GetString(await response.Content.ReadAsByteArrayAsync());
        Assert.DoesNotContain("\r", served); // the bundler always emits line feeds
        AssertSameText(Legacy(file), UndoSeams(file, served), file);
    }

    [Theory]
    [MemberData(nameof(Styles))]
    public async Task Each_stylesheet_is_the_legacy_stylesheet(string file)
    {
        var response = await _client.GetAsync("/css/" + file);
        response.EnsureSuccessStatusCode();
        Assert.Equal("text/css", response.Content.Headers.ContentType?.MediaType);
        var served = Normalize(Encoding.UTF8.GetString(await response.Content.ReadAsByteArrayAsync()));
        AssertSameText(Legacy(file), UndoSeams(file, served), file);
    }

    [Theory]
    [MemberData(nameof(DataDocuments))]
    public async Task Each_data_document_is_the_legacy_file_byte_for_byte(string name)
    {
        var response = await _client.GetAsync($"/data/{name}.json");
        response.EnsureSuccessStatusCode();
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        var (length, sha) = Manifest.Value[$"data/{name}.json"];
        Assert.Equal(length, bytes.LongLength);
        Assert.Equal(sha, Convert.ToHexStringLower(SHA256.HashData(bytes)));
    }

    [Fact]
    public async Task Every_legacy_image_is_served_unchanged()
    {
        var images = Manifest.Value.Where(f => f.Key.StartsWith("img/", StringComparison.Ordinal) && !f.Key.EndsWith(".txt", StringComparison.Ordinal)).ToList();
        Assert.Equal(59, images.Count);
        foreach (var (path, (length, sha)) in images)
        {
            var response = await _client.GetAsync("/" + path);
            Assert.True(response.IsSuccessStatusCode, $"{path}: {(int)response.StatusCode}");
            var bytes = await response.Content.ReadAsByteArrayAsync();
            Assert.True(length == bytes.LongLength && sha == Convert.ToHexStringLower(SHA256.HashData(bytes)), $"{path} differs from the legacy file");
        }
    }

    [Fact]
    public async Task Data_that_the_application_does_not_name_cannot_be_asked_for()
    {
        Assert.Equal(System.Net.HttpStatusCode.NotFound, (await _client.GetAsync("/data/secrets.json")).StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.NotFound, (await _client.GetAsync("/data/..%2Fappsettings.json")).StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.NotFound, (await _client.GetAsync("/js/unknown.js")).StatusCode);
        // The source fragments are joined on the server; none is reachable on its own.
        Assert.Equal(System.Net.HttpStatusCode.NotFound, (await _client.GetAsync("/ClientScripts/er/010-config-state.js")).StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.NotFound, (await _client.GetAsync("/ClientScripts/bundles.json")).StatusCode);
    }

    [Fact]
    public async Task A_bundle_is_revalidated_with_its_entity_tag()
    {
        var first = await _client.GetAsync("/js/ui.js");
        var tag = first.Headers.ETag;
        Assert.NotNull(tag);
        var request = new HttpRequestMessage(HttpMethod.Get, "/js/ui.js");
        request.Headers.IfNoneMatch.Add(tag);
        var second = await _client.SendAsync(request);
        Assert.Equal(System.Net.HttpStatusCode.NotModified, second.StatusCode);
    }

    [Fact]
    public void Every_registered_difference_fits_the_legacy_file_exactly()
    {
        foreach (var seam in Seams.Value)
        {
            Assert.True(seam.Count == Occurrences(Legacy(seam.File), seam.Legacy), $"seam in {seam.File}: '{seam.Legacy}' should occur {seam.Count} time(s) in the legacy file");
            Assert.False(string.IsNullOrWhiteSpace(seam.Reason), $"seam in {seam.File} has no reason");
        }
    }

    /* ---------- helpers ---------- */

    private sealed record Seam(string File, int Count, string Legacy, string Current, string Reason);

    private static List<Seam> LoadSeams()
    {
        using var doc = JsonDocument.Parse(File.ReadAllText(TestData.LegacyBaseline("seams.json")));
        return [.. doc.RootElement.GetProperty("seams").EnumerateArray().Select(s => new Seam(
            s.GetProperty("file").GetString()!, s.GetProperty("count").GetInt32(), s.GetProperty("legacy").GetString()!,
            s.GetProperty("current").GetString()!, s.GetProperty("reason").GetString()!))];
    }

    private static Dictionary<string, (long, string)> LoadManifest()
    {
        using var doc = JsonDocument.Parse(File.ReadAllText(TestData.LegacyBaseline("legacy-manifest.json")));
        return doc.RootElement.GetProperty("files").EnumerateObject()
            .ToDictionary(f => f.Name, f => (f.Value.GetProperty("bytes").GetInt64(), f.Value.GetProperty("sha256").GetString()!));
    }

    private static string Legacy(string file) => TestData.ReadNormalized(TestData.LegacyBaseline("site", file));

    private static string Normalize(string text) => text.Replace("\r\n", "\n");

    /// <summary>Puts the legacy text back where a registered difference changed it, and requires each to be present.</summary>
    private static string UndoSeams(string file, string served)
    {
        foreach (var seam in Seams.Value.Where(s => s.File == file))
        {
            Assert.True(seam.Count == Occurrences(served, seam.Current), $"{file}: registered difference '{seam.Current}' should occur {seam.Count} time(s) in the served text");
            served = served.Replace(seam.Current, seam.Legacy, StringComparison.Ordinal);
        }

        return served;
    }

    private static int Occurrences(string text, string piece)
    {
        var n = 0;
        for (var i = text.IndexOf(piece, StringComparison.Ordinal); i >= 0; i = text.IndexOf(piece, i + piece.Length, StringComparison.Ordinal)) n++;
        return n;
    }

    private static void AssertSameText(string legacy, string served, string what)
    {
        if (legacy == served) return;
        var at = 0;
        while (at < legacy.Length && at < served.Length && legacy[at] == served[at]) at++;
        var line = legacy.AsSpan(0, Math.Min(at, legacy.Length)).Count('\n') + 1;
        static string Around(string s, int i) => s.Substring(Math.Max(0, i - 60), Math.Min(s.Length - Math.Max(0, i - 60), 140)).Replace("\n", "\\n");
        Assert.Fail($"{what} differs from the legacy text at character {at} (legacy line {line}); lengths legacy={legacy.Length} served={served.Length}\n legacy: …{Around(legacy, at)}…\n served: …{Around(served, at)}…");
    }
}
