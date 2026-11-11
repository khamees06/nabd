using Microsoft.AspNetCore.Mvc;
using Nabd.Application.Abstractions.Data;
using Nabd.Web.Http;

namespace Nabd.Web.Controllers;

/// <summary>
/// Serves the data documents the browser-side rooms still load (cases, language resources, model weights).
/// </summary>
/// <remarks>
/// The legacy client asks for <c>data/&lt;name&gt;.json</c>. The files are no longer public static files: they
/// live in the infrastructure layer and only the documents the application names can be asked for. What each
/// document reveals to a trainee is listed in docs/data-catalog.md; a document stops being served when its room
/// moves to the server.
/// </remarks>
public sealed class ClientDataController : Controller
{
    private readonly IClientDataDocumentSource _documents;

    /// <summary>Creates the controller.</summary>
    public ClientDataController(IClientDataDocumentSource documents) => _documents = documents;

    /// <summary>One document, byte for byte as stored.</summary>
    [HttpGet("/data/{name}.json")]
    [HttpHead("/data/{name}.json")]
    public async Task<IActionResult> Get(string name, CancellationToken cancellationToken)
    {
        var document = await _documents.FindAsync(name, cancellationToken);
        if (document is null) return NotFound();
        return this.Revalidated(document.Content, document.MediaType, document.EntityTag);
    }
}
