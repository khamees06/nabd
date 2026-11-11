using Microsoft.AspNetCore.Mvc;

namespace Nabd.Web.Controllers;

/// <summary>Serves the single page of the application.</summary>
public sealed class HomeController : Controller
{
    /// <summary>
    /// The page: the landing view, the signed-in home and every training view. The browser-side client shows one
    /// view at a time, as it did on the static site.
    /// </summary>
    [HttpGet("/")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult Index() => View();
}
