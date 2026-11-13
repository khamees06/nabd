using System.Buffers.Binary;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Nabd.Tests.Support;

namespace Nabd.Tests.Baseline;

/// <summary>
/// The public landing (V6.2, ADR 0010; refined in V6.3 and V6.4, ADR 0011) as the browser receives it: the order of
/// its sections, the IDs the legacy client binds, honest actions (no forms, sign-in through the existing screen), its
/// images and fonts, its script bundle, its Arabic-first copy, and the isolation of its stylesheets (and of the
/// sign-in pages' stylesheet, ADR 0012) from the rest of the application.
/// </summary>
public partial class LandingV6Tests : IClassFixture<WebApplicationFactory<Program>>
{
    // Stylesheet -> the fewest selectors it must hold (a guard against a parser that silently reads nothing).
    private static readonly Dictionary<string, int> Stylesheets = new()
    {
        ["landing-v6.css"] = 1000, ["landing-v6-shell.css"] = 30, ["landing-v63.css"] = 80, ["landing-v64.css"] = 30, ["auth.css"] = 120,
    };
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
        Assert.Contains("nabd:region auth", regions); // the sign-in screen's links are checked too
        var targets = Regex.Matches(regions, "href=\"#([^\"]+)\"").Select(m => m.Groups[1].Value).Distinct().ToList();
        Assert.NotEmpty(targets);
        foreach (var t in targets) Assert.True(Regex.IsMatch(page, $"\\bid=\"{Regex.Escape(t)}\""), $"link to #{t} has no target");
    }

    [Fact]
    public async Task The_landing_has_no_forms_and_signs_in_only_through_the_existing_modal()
    {
        var page = await Page();
        var regions = string.Concat(LandingRegions.All.Where(r => r.Name != "auth").Select(r => LandingRegions.Extract(page, r.Name)));
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
        var all = Regex.Matches(landing, "<img [^>]*>").Select(m => m.Value).ToList();
        // One drawing, the laptop around the screen: decorative (empty alt), an SVG of the size it declares.
        var drawings = all.Where(i => Attr(i, "src").EndsWith(".svg", StringComparison.Ordinal)).ToList();
        var frame = Assert.Single(drawings);
        Assert.Equal("img/landing/v64/laptop.svg", Attr(frame, "src"));
        Assert.Contains("alt=\"\"", frame);
        var svg = await _client.GetAsync("/img/landing/v64/laptop.svg");
        svg.EnsureSuccessStatusCode();
        Assert.Equal("image/svg+xml", svg.Content.Headers.ContentType?.MediaType);
        var viewBox = Regex.Match(await svg.Content.ReadAsStringAsync(), "viewBox=\"0 0 (\\d+) (\\d+)\"");
        Assert.Equal(Attr(frame, "width"), viewBox.Groups[1].Value);
        Assert.Equal(Attr(frame, "height"), viewBox.Groups[2].Value);
        Assert.Equal("lazy", Attr(frame, "loading"));

        // Photos and screens: hero, four specialties, the laptop's screen, four steps, the campus photo, three «لماذا» cards.
        var images = all.Except(drawings).ToList();
        Assert.Equal(14, images.Count);
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
        foreach (var version in new[] { "", "v63", "v64" })
        {
            var folder = Path.Combine(WebRoot(), "img", "landing", version);
            var credits = File.ReadAllText(Path.Combine(folder, "CREDITS.md"));
            var files = Directory.GetFiles(folder, "*.webp").Concat(Directory.GetFiles(folder, "*.svg")).ToList();
            Assert.NotEmpty(files);
            foreach (var file in files) Assert.Contains(Path.GetFileName(file), credits);
        }

        // Every image file of the landing is used by the page; a replaced one is removed, not left behind.
        var landing = LandingRegions.Extract(await Page(), "landing");
        var root = Path.Combine(WebRoot(), "img", "landing");
        foreach (var file in Directory.GetFiles(root, "*.webp", SearchOption.AllDirectories).Concat(Directory.GetFiles(root, "*.svg", SearchOption.AllDirectories)))
            Assert.Contains(Path.GetRelativePath(WebRoot(), file).Replace('\\', '/'), landing);
        Assert.Contains("SIL Open Font License", File.ReadAllText(Path.Combine(WebRoot(), "fonts", "noto-sans-arabic", "LICENSE.md")));
        Assert.Contains("مصادر الصور", LandingRegions.Extract(await Page(), "site-footer"));
    }

    /* ---------- V6.3: Arabic first, the steps read right to left ---------- */

    [Fact]
    public async Task The_header_and_landing_show_no_English_except_needed_clinical_terms()
    {
        var page = await Page();
        var text = Visible(LandingRegions.Extract(page, "public-header") + LandingRegions.Extract(page, "landing"));
        string[] allowed = ["SBAR", "ER", "ECG", "ICU"];
        var english = Regex.Matches(text, "[A-Za-z][A-Za-z0-9]*").Select(m => m.Value).Where(w => !allowed.Contains(w)).Distinct().ToList();
        Assert.True(english.Count == 0, "English words on the landing: " + string.Join(", ", english));
        foreach (Match alt in Regex.Matches(LandingRegions.Extract(page, "landing"), "alt=\"([^\"]*)\""))
            Assert.DoesNotMatch("[A-Za-z]{3,}", alt.Groups[1].Value);
    }

    [Fact]
    public async Task The_training_steps_are_an_ordered_list_with_an_arrow_between_each_pair()
    {
        var method = Regex.Match(LandingRegions.Extract(await Page(), "landing"), "<ol class=\"nl-flow\"[^>]*>(.*?)</ol>", RegexOptions.Singleline);
        Assert.True(method.Success, "the steps are not an ordered list");
        var steps = Regex.Matches(method.Groups[1].Value, "<li class=\"nl-flow-step\">(.*?)</li>", RegexOptions.Singleline).Select(m => m.Groups[1].Value).ToList();
        Assert.Equal(4, steps.Count);
        // An arrow after every step but the last, hidden from screen readers; the order is carried by the list.
        Assert.All(steps.Take(3), s => Assert.Contains("class=\"nl-flow-arrow\"", s));
        Assert.DoesNotContain("nl-flow-arrow", steps[3]);
        Assert.All(steps, s => Assert.Matches("<img [^>]*src=\"img/landing/v63/step-", s));
        Assert.Matches("aria-hidden=\"true\" class=\"nl-flow-arrow\"", steps[0]);
    }

    [Fact]
    public async Task The_sign_in_stylesheet_never_shows_or_hides_what_the_legacy_script_toggles()
    {
        // auth.css is !important inside a layer, so a display rule there would beat .hidden and the script. The
        // elements that .hidden (or .nb-step / .is-on) shows and hides get their display outside the layer, as
        // ordinary declarations, and only there.
        var css = StripComments(await Text("/css/auth.css"));
        var layer = css.IndexOf("@layer nl-refine", StringComparison.Ordinal);
        Assert.True(layer > 0, "auth.css has no @layer nl-refine block");
        var toggled = new Regex(@"(#auth-modal$|\.(nl-auth-form|nl-auth-field|nl-auth-alert|nl-auth-step|nb-step)(?![\w-])|#auth-pane-|#reg-(role|year-wrap|code-wrap|step-)|#login-error-msg|#reg-error-msg|#reg-submit-error)");
        var displayRules = Regex.Matches(css, "([^{};]+)\\{[^{}]*\\bdisplay\\s*:[^;}]*", RegexOptions.Singleline)
            .Select(m => (At: m.Index, Selectors: SplitSelectorList(m.Groups[1].Value.Trim()).ToList(), Important: m.Value.Contains("!important"))).ToList();
        foreach (var rule in displayRules.Where(r => r.At > layer))
            Assert.False(rule.Selectors.Any(toggled.IsMatch), "display set inside the layer on a toggled element: " + string.Join(", ", rule.Selectors));
        var outside = displayRules.Where(r => r.At < layer).ToList();
        Assert.Equal(["#auth-modal .nl-auth-form", "#auth-modal .nl-auth-field", "#auth-modal .nl-auth-alert"], outside.SelectMany(r => r.Selectors));
        Assert.All(outside, r => Assert.False(r.Important, "a display outside the layer must stay an ordinary declaration"));
        // The screen's own stacking is the legacy one (z-index 85 on the element): the file never changes it.
        Assert.DoesNotMatch("#auth-modal\\s*\\{[^}]*z-index", css);
    }

    [Fact]
    public async Task The_sign_in_screen_shows_no_English_except_the_names_Microsoft_and_Google()
    {
        var text = Visible(LandingRegions.Extract(await Page(), "auth"));
        var english = Regex.Matches(text, "[A-Za-z][A-Za-z0-9]*").Select(m => m.Value).Where(w => w is not ("Microsoft" or "Google")).Distinct().ToList();
        Assert.True(english.Count == 0, "English words on the sign-in screen: " + string.Join(", ", english));
    }

    /* ---------- V6.5: the signed-in application's stylesheet ---------- */

    [Fact]
    public async Task The_application_stylesheet_reaches_only_signed_in_screens()
    {
        var css = StripComments(await Text("/css/app-v65.css"));
        // Only the at-rules the selector reader understands, so that no rule is skipped unseen.
        Assert.Empty(Regex.Matches(css, @"@(?!media\b|layer\b|supports\b)[a-zA-Z-]+").Select(m => m.Value));
        var selectors = CssSelectors(css).ToList();
        Assert.True(selectors.Count >= 150, $"app-v65.css: only {selectors.Count} selectors read; the parser missed rules");
        var bad = selectors.Where(s => !SignedInRoot().IsMatch(s)).ToList();
        Assert.True(bad.Count == 0, "app-v65.css selectors that could reach the landing, the sign-in screen or the footer:\n  " + string.Join("\n  ", bad.Take(20)));
        foreach (var s in selectors)
        {
            // a leading :is(…) list: every item must be one of the signed-in views
            if (s.StartsWith(":is(", StringComparison.Ordinal))
                foreach (var item in s[4..s.IndexOf(')')].Split(','))
                    Assert.Matches(@"^#view-(?:home|profile|university|debrief)(?: #[\w-]+)?$", item.Trim());
            // no sibling combinator, which could step from a signed-in root to a public part
            Assert.DoesNotMatch(@"[~+](?![^(]*\))", s);
            Assert.DoesNotMatch(@"#auth-modal|#view-index\b|#public-header|#site-footer|#nl-dialog|nl-auth|nb-auth", s.Replace(":not(#view-index)", ""));
        }
    }

    [Fact]
    public async Task The_application_stylesheet_changes_only_paint_never_what_the_scripts_show_hide_or_place()
    {
        // The scripts show and hide the signed-in parts (.hidden, [hidden], classes) and the ER room's height
        // depends on the header's: none of these properties may be set, except display and height on the
        // generated ::before of the eyebrows (an element of this file's own), and the named phone-layout rules
        // (section 7b): table parts, the drawer's footer note and locked items, the room's height and its monitor
        // canvas, none of them shown or hidden by a script, all outside the layer so that .hidden still wins.
        var css = StripComments(await Text("/css/app-v65.css"));
        var layer = css.IndexOf("@layer nl-refine", StringComparison.Ordinal);
        var forbidden = new Regex(@"^(?:display|visibility|opacity|transform|translate|rotate|scale|position|z-index|(?:min-|max-)?(?:height|block-size)|inset(?:-.*)?|top|bottom|left|right|animation(?:-.*)?|transition(?:-.*)?|pointer-events|content-visibility|contain|all|float|clip|clip-path|overflow(?:-.*)?)$", RegexOptions.IgnoreCase);
        var phoneLayout = new Regex(@"(?:\.prof-structured-table\b|\.overflow-x-auto\b|\.prof-open-stu-btn$|#app-sidebar \.v7-foot > small$|#sidebar-app-nav \.v7-item\.er-locked$|^#view-er$|^#view-er \.er-trace \.nb-mon-canvas$)");
        var declarations = 0;
        foreach (Match rule in Regex.Matches(css, @"([^{};]+)\{([^{}]*)\}"))
        {
            var selector = rule.Groups[1].Value.Trim();
            foreach (Match declaration in Regex.Matches(rule.Groups[2].Value, @"(?:^|;)\s*([a-zA-Z-]+)\s*:"))
            {
                declarations++;
                var property = declaration.Groups[1].Value.ToLowerInvariant();
                if (property.StartsWith("--", StringComparison.Ordinal) || !forbidden.IsMatch(property)) continue;
                var ownBefore = selector.EndsWith("::before", StringComparison.Ordinal) && property is "display" or "height";
                var phone = rule.Index < layer && SplitSelectorList(selector).All(s => phoneLayout.IsMatch(s))
                    && property is "display" or "overflow" or "height" or "min-height";
                Assert.True(ownBefore || phone, $"app-v65.css sets {property} in '{selector}'");
            }
        }
        Assert.True(declarations > 300, $"only {declarations} declarations read");
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
        foreach (var name in new[] { "010-landing-v6.js", "020-auth-pages.js" })
        {
            var fragment = File.ReadAllText(Path.Combine(WebProject(), "ClientScripts", "landing", name)).Replace("\r\n", "\n");
            Assert.Contains(fragment.Trim(), served);
        }
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
        Assert.True(selectors.Count >= Stylesheets[file], $"{file}: only {selectors.Count} selectors read; the parser missed rules");
        // The sign-in stylesheet may start only from the sign-in screen; the landing files only from a landing root.
        var root = file == "auth.css" ? AuthRoot() : LandingRoot();
        var bad = selectors.Where(s => !root.IsMatch(s)).ToList();
        Assert.True(bad.Count == 0, $"{file}: selectors that could reach the rest of the application:\n  " + string.Join("\n  ", bad.Take(20)));
        foreach (Match k in Regex.Matches(css, "@keyframes\\s+([\\w-]+)")) Assert.StartsWith("nl-", k.Groups[1].Value);
    }

    [Fact]
    public void No_legacy_stylesheet_uses_the_landing_prefix()
    {
        // The new stylesheets (landing-v6*.css and auth.css) are the ones allowed to use it.
        foreach (var file in Directory.GetFiles(Path.Combine(WebRoot(), "css"), "*.css").Where(f => !Path.GetFileName(f).StartsWith("landing-v6", StringComparison.Ordinal) && Path.GetFileName(f) != "auth.css"))
        {
            var css = File.ReadAllText(file);
            Assert.DoesNotMatch("\\.nl-[\\w-]", css);
            Assert.DoesNotContain("nabd-landing", css);
        }
    }

    public static TheoryData<string> StylesheetNames() => [.. Stylesheets.Keys];

    /* ---------- helpers ---------- */

    // A selector is confined to the landing when its first compound is one of the landing roots or an nl- class.
    [GeneratedRegex(@"^(?::where\(\.nabd-landing\)|\.nabd-landing\b|\.nl-[\w-]|#public-header\.nl-site-header|#public-header\b|#view-index\.nl-index-view|#site-footer\b|#nl-dialog\b|html\.nl-modal-open\b)")]
    private static partial Regex LandingRoot();

    [GeneratedRegex(@"^#auth-modal\b")]
    private static partial Regex AuthRoot();

    // A selector of app-v65.css starts from the signed-in flag or from a part only a signed-in user sees. The drawer
    // and the toast are not such parts (the toast says goodbye on the landing; the closed drawer waits off-screen):
    // their rules must start from the flag.
    [GeneratedRegex(@"^(?:html:has\(> body > #app-header:not\(\.hidden\)\)|:is\(#view-(?:home|profile|university|debrief)[,) ]|#(?:app-header|account-dropdown-menu|app-brand-btn|app-open-sidebar-btn|user-menu-btn|handover-modal|level-modal|medical-image-lightbox|student-attempt-detail-modal|handover-modal-title|lightbox-title|stu-modal-title|view-(?:home|profile|university|debrief|coach|er|resp))\b)")]
    private static partial Regex SignedInRoot();

    [GeneratedRegex("\\bid=\"([^\"]+)\"")]
    private static partial Regex IdAttribute();

    /// <summary>The text a visitor reads: tags, comments and drawings removed.</summary>
    private static string Visible(string html) =>
        Regex.Replace(Regex.Replace(Regex.Replace(html, "<svg.*?</svg>", " ", RegexOptions.Singleline), "<!--.*?-->", " ", RegexOptions.Singleline), "<[^>]+>", " ");

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
