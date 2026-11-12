namespace Nabd.Web.Models;

/// <summary>
/// Which sign-in page a request asked for. The application is one page: the sign-in and registration screen is
/// part of it on every address, hidden on "/" until the client opens it, and shown as the page itself on
/// "/login" and "/register" (ADR 0012).
/// </summary>
public enum AuthPage
{
    /// <summary>The application's home address: the screen is in the page, hidden.</summary>
    None,

    /// <summary>"/login": the page opens on the sign-in form.</summary>
    Login,

    /// <summary>"/register": the page opens on the first step of registration.</summary>
    Register,
}
