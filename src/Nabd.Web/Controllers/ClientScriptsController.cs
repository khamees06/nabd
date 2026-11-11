using Microsoft.AspNetCore.Mvc;
using Nabd.Web.ClientScripts;
using Nabd.Web.Http;

namespace Nabd.Web.Controllers;

/// <summary>Serves the script bundles joined from the client source fragments.</summary>
public sealed class ClientScriptsController : Controller
{
    private readonly IClientBundleProvider _bundles;

    /// <summary>Creates the controller.</summary>
    public ClientScriptsController(IClientBundleProvider bundles) => _bundles = bundles;

    /// <summary>One bundle, for example <c>/js/er.js</c>. The browser revalidates it with its entity tag.</summary>
    [HttpGet("/js/{fileName}")]
    [HttpHead("/js/{fileName}")]
    public IActionResult Get(string fileName)
    {
        var bundle = _bundles.Find(fileName);
        if (bundle is null) return NotFound();
        return this.Revalidated(bundle.Content, "text/javascript; charset=utf-8", bundle.EntityTag);
    }
}
