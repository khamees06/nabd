using Microsoft.Extensions.Options;

namespace Nabd.Infrastructure.LegacyData;

/// <summary>Where the legacy JSON data files are.</summary>
public sealed class LegacyDataOptions
{
    /// <summary>Configuration section name.</summary>
    public const string SectionName = "LegacyData";

    /// <summary>
    /// Folder that holds the files. Empty means the folder shipped with the application
    /// (<c>LegacyData/Files</c> next to the binaries).
    /// </summary>
    public string RootPath { get; set; } = "";
}

/// <summary>
/// The one place that knows the legacy data files by name and reads them from disk. Nothing outside the
/// infrastructure layer touches these files.
/// </summary>
public sealed class LegacyDataFiles
{
    /// <summary>The ER room's cases, interventions and tests.</summary>
    public const string ErCases = "er-cases";

    /// <summary>Every file the application ships, by name without extension.</summary>
    public static readonly IReadOnlyList<string> KnownNames =
    [
        ErCases, "er-act", "er-find", "er-lang", "resp-ar", "resp-clinical", "resp-model", "resp-patients",
    ];

    private readonly string _root;

    /// <summary>Creates the reader over the configured folder.</summary>
    public LegacyDataFiles(IOptions<LegacyDataOptions> options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var configured = options.Value.RootPath;
        _root = string.IsNullOrWhiteSpace(configured)
            ? Path.Combine(AppContext.BaseDirectory, "LegacyData", "Files")
            : Path.GetFullPath(configured);
    }

    /// <summary>The folder the files are read from.</summary>
    public string RootPath => _root;

    /// <summary>True when <paramref name="name"/> is one of the shipped files.</summary>
    public static bool IsKnown(string name) => KnownNames.Contains(name, StringComparer.Ordinal);

    /// <summary>Reads a file whole. Only a known name is accepted, so a caller can never name a path.</summary>
    public async Task<byte[]> ReadAsync(string name, CancellationToken cancellationToken = default)
    {
        if (!IsKnown(name)) throw new ArgumentException($"'{name}' is not a legacy data file.", nameof(name));
        return await File.ReadAllBytesAsync(Path.Combine(_root, name + ".json"), cancellationToken).ConfigureAwait(false);
    }
}
