namespace Nabd.Application.Abstractions.Data;

/// <summary>
/// The data documents the browser-side rooms load while they still run the legacy client engine
/// (cases, language resources, model weights). The documents are opaque here: bytes, a media type and a tag.
/// </summary>
/// <remarks>
/// This port exists for the migration period. Each document it serves is listed in docs/data-catalog.md with
/// what a trainee could learn from it; a document leaves this port when its room moves to the server.
/// </remarks>
public interface IClientDataDocumentSource
{
    /// <summary>The names of the documents that may be served, without extension (for example <c>er-cases</c>).</summary>
    IReadOnlyCollection<string> Names { get; }

    /// <summary>The document with this name, or null when the name is not one of <see cref="Names"/>.</summary>
    Task<ClientDataDocument?> FindAsync(string name, CancellationToken cancellationToken = default);
}

/// <summary>One data document as it is sent to the browser.</summary>
/// <param name="Name">Its name, without extension.</param>
/// <param name="Content">The bytes, exactly as stored.</param>
/// <param name="MediaType">The media type to send.</param>
/// <param name="EntityTag">A tag that changes when the content changes, for HTTP caching.</param>
public sealed record ClientDataDocument(string Name, ReadOnlyMemory<byte> Content, string MediaType, string EntityTag);
