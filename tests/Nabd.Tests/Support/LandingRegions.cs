using System.Text.Json;

namespace Nabd.Tests.Support;

/// <summary>
/// The three parts of the page that the V6.2 public landing replaced (public header, landing view, public footer;
/// ADR 0010), as LandingBaseline/regions.json describes them. The served page marks each with
/// <c>&lt;!-- nabd:region NAME ... --&gt;</c> … <c>&lt;!-- /nabd:region NAME --&gt;</c>; the frozen legacy page has the
/// old version between two texts that occur there once.
/// </summary>
internal static class LandingRegions
{
    public sealed record Region(string Name, string LegacyStart, string LegacyEnd);

    public static IReadOnlyList<Region> All { get; } = Load();

    public static string SnapshotPath(string name) => Path.Combine(TestData.OutputFolder, "LandingBaseline", name + ".html");

    /// <summary>The region as served, from its start marker to the end of its end marker, plus a line feed.</summary>
    public static string Extract(string served, string name)
    {
        var (start, end) = Served(served, name);
        return served[start..end] + "\n";
    }

    /// <summary>The served page with the region replaced by a token.</summary>
    public static string TokenizeServed(string served, string name)
    {
        var (start, end) = Served(served, name);
        return Tokenize(served, start, end, name);
    }

    /// <summary>The legacy page with the old version of the region replaced by the same token.</summary>
    public static string TokenizeLegacy(string legacy, Region region)
    {
        var start = legacy.IndexOf(region.LegacyStart, StringComparison.Ordinal);
        Assert.True(start >= 0 && legacy.IndexOf(region.LegacyStart, start + 1, StringComparison.Ordinal) < 0, $"legacy region {region.Name}: its start text must occur exactly once");
        var end = legacy.IndexOf(region.LegacyEnd, start, StringComparison.Ordinal);
        Assert.True(end > start, $"legacy region {region.Name}: no end text after the start");
        return Tokenize(legacy, start, end + region.LegacyEnd.Length, region.Name);
    }

    private static (int Start, int End) Served(string served, string name)
    {
        var startMarker = $"<!-- nabd:region {name} ";
        var endMarker = $"<!-- /nabd:region {name} -->";
        var start = served.IndexOf(startMarker, StringComparison.Ordinal);
        var end = served.IndexOf(endMarker, StringComparison.Ordinal);
        Assert.True(start >= 0, $"region {name}: start marker missing");
        Assert.True(end > start, $"region {name}: end marker missing or before the start");
        Assert.True(served.IndexOf(startMarker, start + 1, StringComparison.Ordinal) < 0 && served.IndexOf(endMarker, end + 1, StringComparison.Ordinal) < 0, $"region {name}: markers repeated");
        return (start, end + endMarker.Length);
    }

    // The blank lines and indentation right after a region belong to neither side: the old partials ended
    // with a blank line, the new ones end with their marker. Everything else outside the regions is compared.
    private static string Tokenize(string text, int start, int end, string name)
    {
        while (end < text.Length && char.IsWhiteSpace(text[end])) end++;
        return string.Concat(text.AsSpan(0, start), $"\u0001region {name}\u0001\n", text.AsSpan(end));
    }

    private static List<Region> Load()
    {
        using var doc = JsonDocument.Parse(File.ReadAllText(Path.Combine(TestData.OutputFolder, "LandingBaseline", "regions.json")));
        return [.. doc.RootElement.GetProperty("regions").EnumerateArray().Select(r => new Region(
            r.GetProperty("name").GetString()!, r.GetProperty("legacyStart").GetString()!, r.GetProperty("legacyEnd").GetString()!))];
    }
}
