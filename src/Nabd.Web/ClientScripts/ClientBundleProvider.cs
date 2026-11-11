using System.Collections.Frozen;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.FileProviders;

namespace Nabd.Web.ClientScripts;

/// <summary>One script bundle as the browser receives it.</summary>
/// <param name="Name">Bundle name, for example <c>er</c>.</param>
/// <param name="FileName">File name in the page's script tag, for example <c>er.js</c>.</param>
/// <param name="Content">The joined source, UTF-8, line endings as line feeds.</param>
/// <param name="EntityTag">A tag that changes when the content changes, for HTTP caching.</param>
/// <param name="Fragments">The source files it was joined from, in order.</param>
public sealed record ClientBundle(string Name, string FileName, ReadOnlyMemory<byte> Content, string EntityTag, IReadOnlyList<string> Fragments);

/// <summary>Gives the script bundles the page loads.</summary>
public interface IClientBundleProvider
{
    /// <summary>File names of every bundle, in the order of bundles.json.</summary>
    IReadOnlyList<string> FileNames { get; }

    /// <summary>The bundle served under this file name, or null.</summary>
    ClientBundle? Find(string fileName);
}

/// <summary>
/// Joins the client scripts from their source fragments.
/// </summary>
/// <remarks>
/// The browser-side code is the legacy client, kept as it was but cut into cohesive source files under
/// <c>ClientScripts/</c>. <c>bundles.json</c> lists, for each bundle, its fragments in order (and, for a script
/// that lives inside one wrapper function, the opening and closing pieces). Joining is plain concatenation:
/// nothing is rewritten, minified or reordered, so the joined text equals the legacy file except for the
/// differences registered in the test baseline. Bundles are built once, on first use.
/// </remarks>
public sealed class ClientBundleProvider : IClientBundleProvider
{
    /// <summary>Folder, under the content root, that holds bundles.json and the fragments.</summary>
    public const string Folder = "ClientScripts";

    private readonly Lazy<FrozenDictionary<string, ClientBundle>> _bundles;
    private readonly Lazy<IReadOnlyList<string>> _fileNames;

    /// <summary>Creates the provider over the application's content root.</summary>
    public ClientBundleProvider(IWebHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(environment);
        var files = environment.ContentRootFileProvider;
        var all = new Lazy<List<ClientBundle>>(() => Build(files));
        _bundles = new Lazy<FrozenDictionary<string, ClientBundle>>(() => all.Value.ToFrozenDictionary(b => b.FileName, StringComparer.Ordinal));
        _fileNames = new Lazy<IReadOnlyList<string>>(() => [.. all.Value.Select(b => b.FileName)]);
    }

    /// <inheritdoc />
    public IReadOnlyList<string> FileNames => _fileNames.Value;

    /// <inheritdoc />
    public ClientBundle? Find(string fileName) => _bundles.Value.GetValueOrDefault(fileName);

    private static List<ClientBundle> Build(IFileProvider files)
    {
        using var manifest = JsonDocument.Parse(ReadText(files, "bundles.json"));
        var bundles = new List<ClientBundle>();
        foreach (var b in manifest.RootElement.GetProperty("bundles").EnumerateArray())
        {
            var text = new StringBuilder();
            var fragments = new List<string>();
            if (b.TryGetProperty("open", out var open)) text.Append(ReadText(files, open.GetString()!));
            foreach (var fragment in b.GetProperty("fragments").EnumerateArray())
            {
                var path = fragment.GetString()!;
                fragments.Add(path);
                text.Append(ReadText(files, path));
            }

            if (b.TryGetProperty("close", out var close)) text.Append(ReadText(files, close.GetString()!));
            var bytes = Encoding.UTF8.GetBytes(text.ToString());
            var tag = "\"" + Convert.ToHexStringLower(SHA256.HashData(bytes))[..32] + "\"";
            bundles.Add(new ClientBundle(b.GetProperty("name").GetString()!, b.GetProperty("output").GetString()!, bytes, tag, fragments));
        }

        return bundles;
    }

    /// <summary>Reads a source file with its line endings as line feeds, whatever the checkout turned them into.</summary>
    private static string ReadText(IFileProvider files, string relativePath)
    {
        var file = files.GetFileInfo(Folder + "/" + relativePath);
        if (!file.Exists) throw new FileNotFoundException($"Client script source '{Folder}/{relativePath}' is missing.");
        using var reader = new StreamReader(file.CreateReadStream(), Encoding.UTF8);
        return reader.ReadToEnd().Replace("\r\n", "\n", StringComparison.Ordinal);
    }
}
