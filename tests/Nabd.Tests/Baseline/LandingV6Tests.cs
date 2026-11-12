using System.Buffers.Binary;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Nabd.Tests.Support;

namespace Nabd.Tests.Baseline;

/// <summary>
/// The V6.2 public landing (ADR 0010) as the browser receives it: the order of its sections, the IDs the legacy
/// client binds, honest actions (no forms, sign-in through the existing modal), its images and fonts, its script
/// bundle, and the isolation of its stylesheets from the rest of the application.
/// </summary>
public partial class LandingV6Tests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly string[] Stylesheets = ["landing-v6.css", "landing-v6-shell.css"];
    private readonly HttpClient _client;

    public LandingV6Tests(WebApplicationFactory<Program> factory) => _client = factory.CreateClient();

    /* ---------- structure ---------- */

    [Fact]
    public async Task The_sections_follow_the_prototype_order()
    {
        var page = await Page();
        string[] order =
        [
            "<header id=\"public-header\"", "id=\"nl-home\"", "aria-label=\"ملامح المنصة\"", "id=\"nl-specialties\"", "id=\"nl-experience\"",
            "id=\"nl-method\"", "id=\"nl-about\"", "id=\"nl-institutions\"", "id=\"nl-audience\"", "id=\"nl-join\"", "<footer id=\"site-footer\"",
        ];
        var at = order.Select(s => (s, i: page.IndexOf(s, StringComparison.Ordinal))).ToList();
        Assert.All(at, x => Assert.True(x.i >= 0, $"missing: {x.s}"));
        for (var k = 1; k < at.Count; k++) Assert.True(at[k - 1].i < at[k].i, $"'{at[k - 1].s}' should come before '{at[k].s}'");
    }

    [Fact]
    public async Task There_is_one_public_header_and_the_IDs_the_legacy_client_binds_are_kept()
    {
        var page = await Page();
        Assert.Single(Regex.Matches(page, "<header id=\"public-header\""));
        Assert.Single(Regex.Matches(page, "<footer id=\"site-footer\""));
        string[] required =
        [
            "public-header", "public-brand-btn", "public-login-btn", "public-register-btn", "view-index", "nb-quiz-main",
            "site-footer", "footer-guest-links", "footer-app-links", "foot-er-btn", "app-header", "auth-modal", "app-sidebar",
        ];
        foreach (var id in required) Assert.True(Regex.Matches(page, $"\\bid=\"{id}\"").Count == 1, $"id '{id}' should occur exactly once");
        // The public header has no button that opens the signed-in sidebar; its menu is its own.
        Assert.DoesNotContain("public-open-sidebar-btn", Header(page));
        Assert.Contains("aria-controls=\"public-main-nav\"", Header(page));
        Assert.Contains("aria-expanded=\"false\"", Header(page));
    }

    [Fact]
    public async Task Every_id_on_the_page_is_unique()
    {
        var ids = IdAttribute().Matches(await Page()).Select(m => m.Groups[1].Value).ToList();
        var repeated = ids.GroupBy(i => i).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
        Assert.True(repeated.Count == 0, "repeated ids: " + string.Join(", ", repeated));
    }

    [Fact]
    public async Task Every_in_page_link_of_the_landing_has_a_target()
    {
        var page = await Page();
        var regions = string.Concat(LandingRegions.All.Select(r => LandingRegions.Extract(page, r.Name)));
        var targets = Regex.Matches(regions, "href=\"#([^\"]+)\"").Select(m => m.Groups[1].Value).Distinct().ToList();
        Assert.NotEmpty(targets);
        foreach (var t in targets) Assert.True(Regex.IsMatch(page, $"\\bid=\"{Regex.Escape(t)}\""), $"link to #{t} has no target");
    }

    [Fact]
    public async Task The_landing_has_no_forms_and_signs_in_only_through_the_existing_modal()
    {
        var page = await Page();
        var regions = string.Concat(LandingRegions.All.Select(r => LandingRegions.Extract(page, r.Name)));
        Assert.DoesNotContain("<form", regions, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<input", regions, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("type=\"password\"", regions, StringComparison.OrdinalIgnoreCase);
        var auth = Regex.Matches(regions, "data-nl-auth=\"([^\"]*)\"").Select(m => m.Groups[1].Value).ToList();
        Assert.NotEmpty(auth);
        Assert.All(auth, a => Assert.Contains(a, new[] { "login", "register" }));
        var script = await Text("/js/landing.js");
        Assert.Contains("window.openAuthModal(", script);
        Assert.DoesNotContain("fetch(", script);
        Assert.DoesNotContain("localStorage", script);
    }

    [Fact]
    public async Task Links_to_other_sites_are_only_the_credits()
    {
        var page = await Page();
        var regions = string.Concat(LandingRegions.All.Select(r => LandingRegions.Extract(page, r.Name)));
        var external = Regex.Matches(regions, "(?:href|src)=\"(https?://[^\"]+)\"").Select(m => m.Groups[1].Value).ToList();
        string[] allowed = ["https://commons.wikimedia.org/", "https://figshare.com/", "https://creativecommons.org/"];
        Assert.All(external, u => Assert.True(allowed.Any(a => u.StartsWith(a, StringComparison.Ordinal)), $"unexpected external link {u}"));
        // Every one opens in a new tab without giving the other site a handle on this one.
        foreach (Match a in Regex.Matches(regions, "<a [^>]*href=\"https?://[^>]*>"))
            Assert.Contains("rel=\"noopener", a.Value);
    }

    /* ---------- images ---------- */

    [Fact]
    public async Task Every_landing_image_is_a_local_WebP_of_the_size_its_markup_declares()
    {
        var page = await Page();
        var landing = LandingRegions.Extract(page, "landing");
        var images = Regex.Matches(landing, "<img [^>]*>").Select(m => m.Value).ToList();
        Assert.Equal(6, images.Count);
        foreach (var img in images)
        {
            var src = Attr(img, "src");
            Assert.StartsWith("img/landing/", src);
            Assert.EndsWith(".webp", src);
            Assert.False(string.IsNullOrWhiteSpace(Attr(img, "alt")), $"{src}: no alt text");
            Assert.Matches("\\p{IsArabic}", Attr(img, "alt"));
            var (w, h) = await WebPSize(src);
            Assert.Equal(int.Parse(Attr(img, "width")), w);
            Assert.Equal(int.Parse(Attr(img, "height")), h);
        }

        // The hero is fetched at once; every other photo waits until it is near the screen.
        Assert.Equal("eager", Attr(images[0], "loading"));
        Assert.Contains("hero", Attr(images[0], "src"));
        Assert.All(images.Skip(1), i => Assert.Equal("lazy", Attr(i, "loading")));
        foreach (Match bg in Regex.Matches(landing, "url\\((img/landing/[^)]+)\\)")) await WebPSize(bg.Groups[1].Value);
    }

    [Fact]
    public async Task The_landing_images_are_credited()
    {
        var credits = File.ReadAllText(Path.Combine(WebRoot(), "img", "landing", "CREDITS.md"));
        foreach (var file in Directory.GetFiles(Path.Combine(WebRoot(), "img", "landing"), "*.webp"))
            Assert.Contains(Path.GetFileName(file), credits);
        Assert.Contains("SIL Open Font License", File.ReadAllText(Path.Combine(WebRoot(), "fonts", "noto-sans-arabic", "LICENSE.md")));
        Assert.Contains("مصادر الصور", LandingRegions.Extract(await Page(), "site-footer"));
    }

    /* ---------- fonts and script ---------- */

    [Theory]
    [InlineData("NotoSansArabic-Regular.woff2")]
    [InlineData("NotoSansArabic-Bold.woff2")]
    public async Task The_self_hosted_fonts_are_served_as_WOFF2(string file)
    {
        var response = await _client.GetAsync("/fonts/noto-sans-arabic/" + file);
        response.EnsureSuccessStatusCode();
        Assert.Equal("font/woff2", response.Content.Headers.ContentType?.MediaType);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.Equal("wOF2", Encoding.ASCII.GetString(bytes, 0, 4));
        Assert.Equal(bytes.Length, (int)BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(8))); // the header's own length field
    }

    [Fact]
    public async Task The_landing_script_is_the_bundle_of_its_fragment()
    {
        var served = await Text("/js/landing.js");
        var fragment = File.ReadAllText(Path.Combine(WebProject(), "ClientScripts", "landing", "010-landing-v6.js")).Replace("\r\n", "\n");
        Assert.Contains(fragment.Trim(), served);
        Assert.DoesNotContain("\r", served);
    }

    /* ---------- stylesheet isolation ---------- */

    [Theory]
    [MemberData(nameof(StylesheetNames))]
    public async Task Every_landing_rule_starts_from_a_landing_root(string file)
    {
        var css = await Text("/css/" + file);
        Assert.DoesNotContain("http://", css);
        Assert.DoesNotContain("https://", css);
        var selectors = CssSelectors(StripComments(css)).ToList();
        Assert.True(selectors.Count >= (file == "landing-v6.css" ? 1000 : 30), $"{file}: only {selectors.Count} selectors read; the parser missed rules");
        var bad = selectors.Where(s => !LandingRoot().IsMatch(s)).ToList();
        Assert.True(bad.Count == 0, $"{file}: selectors that could reach the rest of the application:\n  " + string.Join("\n  ", bad.Take(20)));
        foreach (Match k in Regex.Matches(css, "@keyframes\\s+([\\w-]+)")) Assert.StartsWith("nl-", k.Groups[1].Value);
    }

    [Fact]
    public void No_legacy_stylesheet_uses_the_landing_prefix()
    {
        foreach (var file in Directory.GetFiles(Path.Combine(WebRoot(), "css"), "*.css").Where(f => !Path.GetFileName(f).StartsWith("landing-v6", StringComparison.Ordinal)))
        {
            var css = File.ReadAllText(file);
            Assert.DoesNotMatch("\\.nl-[\\w-]", css);
            Assert.DoesNotContain("nabd-landing", css);
        }
    }

    public static TheoryData<string> StylesheetNames() => [.. Stylesheets];

    /* ---------- helpers ---------- */

    // A selector is confined to the landing when its first compound is one of the landing roots or an nl- class.
    [GeneratedRegex(@"^(?::where\(\.nabd-landing\)|\.nabd-landing\b|\.nl-[\w-]|#public-header\.nl-site-header|#public-header\b|#view-index\.nl-index-view|#site-footer\b|#nl-dialog\b|html\.nl-modal-open\b)")]
    private static partial Regex LandingRoot();

    [GeneratedRegex("\\bid=\"([^\"]+)\"")]
    private static partial Regex IdAttribute();

    private static string Attr(string tag, string name) => Regex.Match(tag, $"\\b{name}=\"([^\"]*)\"").Groups[1].Value;

    private static string Header(string page) => LandingRegions.Extract(page, "public-header");

    private async Task<string> Page() => (await Text("/")).Replace("\r\n", "\n");

    private async Task<string> Text(string url)
    {
        var response = await _client.GetAsync(url);
        response.EnsureSuccessStatusCode();
        return Encoding.UTF8.GetString(await response.Content.ReadAsByteArrayAsync());
    }

    private async Task<(int Width, int Height)> WebPSize(string src)
    {
        var response = await _client.GetAsync("/" + src);
        Assert.True(response.IsSuccessStatusCode, $"{src}: {(int)response.StatusCode}");
        Assert.Equal("image/webp", response.Content.Headers.ContentType?.MediaType);
        var b = await response.Content.ReadAsByteArrayAsync();
        Assert.True(Encoding.ASCII.GetString(b, 0, 4) == "RIFF" && Encoding.ASCII.GetString(b, 8, 4) == "WEBP", $"{src} is not a WebP file");
        return Encoding.ASCII.GetString(b, 12, 4) switch
        {
            "VP8 " => (BinaryPrimitives.ReadUInt16LittleEndian(b.AsSpan(26)) & 0x3fff, BinaryPrimitives.ReadUInt16LittleEndian(b.AsSpan(28)) & 0x3fff),
            "VP8L" => ((b[21] | (b[22] & 0x3f) << 8) + 1, ((b[22] >> 6) | b[23] << 2 | (b[24] & 0x0f) << 10) + 1),
            "VP8X" => ((b[24] | b[25] << 8 | b[26] << 16) + 1, (b[27] | b[28] << 8 | b[29] << 16) + 1),
            var chunk => throw new Xunit.Sdk.XunitException($"{src}: unknown WebP chunk {chunk}"),
        };
    }

    private static string StripComments(string css) => Regex.Replace(css, "/\\*.*?\\*/", "", RegexOptions.Singleline);

    /// <summary>Every complex selector of every style rule, inside @media, @supports and @layer blocks too.</summary>
    private static IEnumerable<string> CssSelectors(string css)
    {
        var i = 0;
        while (i < css.Length)
        {
            var open = css.IndexOf('{', i);
            var semi = css.IndexOf(';', i);
            if (open < 0) yield break;
            if (semi >= 0 && semi < open) { i = semi + 1; continue; } // a statement such as "@layer a, b;"
            var prelude = css[i..open].Trim();
            var depth = 1;
            var j = open + 1;
            for (; j < css.Length && depth > 0; j++)
            {
                if (css[j] == '{') depth++;
                else if (css[j] == '}') depth--;
            }

            var body = css[(open + 1)..(j - 1)];
            if (prelude.StartsWith("@media", StringComparison.Ordinal) || prelude.StartsWith("@supports", StringComparison.Ordinal) || prelude.StartsWith("@layer", StringComparison.Ordinal))
                foreach (var s in CssSelectors(body)) yield return s;
            else if (!prelude.StartsWith('@'))
                foreach (var s in SplitSelectorList(prelude)) yield return s;
            i = j;
        }
    }

    private static IEnumerable<string> SplitSelectorList(string list)
    {
        var depth = 0;
        var start = 0;
        for (var k = 0; k < list.Length; k++)
        {
            if (list[k] == '(') depth++;
            else if (list[k] == ')') depth--;
            else if (list[k] == ',' && depth == 0) { yield return list[start..k].Trim(); start = k + 1; }
        }

        yield return list[start..].Trim();
    }

    private static string WebProject()
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir != null; dir = dir.Parent)
        {
            var candidate = Path.Combine(dir.FullName, "src", "Nabd.Web");
            if (Directory.Exists(candidate)) return candidate;
        }

        throw new DirectoryNotFoundException("src/Nabd.Web not found above the test binaries");
    }

    private static string WebRoot() => Path.Combine(WebProject(), "wwwroot");
}
