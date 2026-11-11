using System.Collections.Concurrent;
using System.Security.Cryptography;
using Nabd.Application.Abstractions.Data;

namespace Nabd.Infrastructure.LegacyData;

/// <summary>
/// Serves the legacy data files to the browser-side rooms, byte for byte as stored. A file is read once and
/// kept in memory with its entity tag (the files total about 2.7 MB and never change while the application runs).
/// </summary>
public sealed class FileClientDataDocumentSource : IClientDataDocumentSource
{
    private readonly LegacyDataFiles _files;
    private readonly ConcurrentDictionary<string, Lazy<Task<ClientDataDocument>>> _documents = new(StringComparer.Ordinal);

    /// <summary>Creates the source over the legacy data files.</summary>
    public FileClientDataDocumentSource(LegacyDataFiles files)
    {
        ArgumentNullException.ThrowIfNull(files);
        _files = files;
    }

    /// <inheritdoc />
    public IReadOnlyCollection<string> Names => LegacyDataFiles.KnownNames;

    /// <inheritdoc />
    public async Task<ClientDataDocument?> FindAsync(string name, CancellationToken cancellationToken = default)
    {
        if (!LegacyDataFiles.IsKnown(name)) return null;
        var lazy = _documents.GetOrAdd(name, n => new Lazy<Task<ClientDataDocument>>(() => LoadAsync(n)));
        return await lazy.Value.WaitAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task<ClientDataDocument> LoadAsync(string name)
    {
        var bytes = await _files.ReadAsync(name).ConfigureAwait(false);
        var tag = "\"" + Convert.ToHexStringLower(SHA256.HashData(bytes))[..32] + "\"";
        return new ClientDataDocument(name, bytes, "application/json; charset=utf-8", tag);
    }
}
