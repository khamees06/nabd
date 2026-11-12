using Microsoft.AspNetCore.Mvc;
using Nabd.Web.Models;

namespace Nabd.Web.Controllers;

/// <summary>
/// The sign-in and registration pages (ADR 0012). Each is the application's single page opened on its screen:
/// the browser-side client keeps the accounts (browser demo data, no server authentication yet) and needs the
/// whole page to sign the user in and continue to the signed-in home, so the page is the same as on "/" except
/// that the screen is shown from the start, on the right form, with its own title.
/// </summary>
public sealed class AccountController : Controller
{
    /// <summary>Key of the view data entry that tells the layout which screen to open.</summary>
    public const string AuthPageKey = "AuthPage";

    /// <summary>The sign-in page.</summary>
    [HttpGet("/login")]
    [HttpHead("/login")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult Login() => Screen(AuthPage.Login, "/login", "تسجيل الدخول | نَبْض الأردن");

    /// <summary>The registration page.</summary>
    [HttpGet("/register")]
    [HttpHead("/register")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult Register() => Screen(AuthPage.Register, "/register", "إنشاء حساب | نَبْض الأردن");

    private IActionResult Screen(AuthPage page, string path, string title)
    {
        // The route also matches "/login/". The page's stylesheets, scripts and images are addressed relative to it
        // (css/…, js/…), which below "/login/" would point to "/login/css/…": that address goes to the canonical one.
        if (Request.Path.Value is { Length: > 1 } requested && requested.EndsWith('/'))
            return LocalRedirectPermanent(Request.PathBase + path + Request.QueryString);
        ViewData[AuthPageKey] = page;
        ViewData["Title"] = title;
        return View(page.ToString());
    }
}
