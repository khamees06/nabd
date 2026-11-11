using Microsoft.Extensions.Options;
using Nabd.Infrastructure.LegacyData;

namespace Nabd.Tests.Support;

/// <summary>Shared access to the real data files and to the test inputs copied next to the test binaries.</summary>
internal static class TestData
{
    public static string OutputFolder => AppContext.BaseDirectory;

    public static string GoldenMasters(string area) => Path.Combine(OutputFolder, "GoldenMasters", area);

    public static string LegacyBaseline(params string[] parts) => Path.Combine([OutputFolder, "LegacyBaseline", .. parts]);

    public static LegacyDataFiles LegacyDataFiles { get; } = new(Options.Create(new LegacyDataOptions()));

    public static JsonClinicalCaseRepository CaseRepository { get; } = new(LegacyDataFiles);

    /// <summary>Text as the baseline keeps it: line endings as line feeds, whatever the checkout did.</summary>
    public static string ReadNormalized(string path) => File.ReadAllText(path).Replace("\r\n", "\n");
}
