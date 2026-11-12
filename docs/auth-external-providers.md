# Sign-in with Microsoft and Google: what it needs

Status 2026-11-13: **not connected.** The sign-in and registration pages show «حساب Microsoft الجامعي» and
«حساب Google» marked «قريباً»; pressing one explains that they are not available yet and points to e-mail or a
demo account. Nothing calls Microsoft or Google, and the server has no sign-in endpoint (`AccountPagesTests`
checks the markup and that `/signin-google`, `/signin-microsoft` and `/signin-oidc` do not exist). This page lists what turning
them on requires, so that the owner can decide.

## The two logos

The buttons show the Microsoft four-square mark and the Google "G", drawn inline (no image file), only to name the
two services, as their sign-in buttons do everywhere. Their use is governed by the providers' own branding rules
for sign-in buttons (Microsoft identity platform branding guidelines; Google Identity sign-in branding
guidelines), which assume a working sign-in. If the owner decides not to connect them soon, the logos (or the
buttons) should be removed rather than kept on a placeholder for long.

## Why it cannot simply be switched on

1. **Accounts live in the browser today** (decision 0008). A Microsoft or Google sign-in proves who someone is on
   the server; the application then needs somewhere on the server to remember that person (at least: id, name,
   e-mail, role, university) and a session cookie. That is the identity decision 0008 postponed.
2. **The apps must be registered by the owner**, in his own accounts, with the real address of the site:
   - Microsoft: an app registration in Microsoft Entra ID (Azure portal → App registrations), supported account
     types «Accounts in any organizational directory and personal Microsoft accounts» (or only the university's
     tenant, if a university asks for that), redirect URI `https://<site>/signin-microsoft`. It gives a client id
     and a client secret.
   - Google: a project in Google Cloud Console → OAuth consent screen (external, name «نَبْض الأردن», the privacy
     and terms links) → Credentials → OAuth client ID, type «Web application», redirect URI
     `https://<site>/signin-google`. It gives a client id and a client secret.
   The secrets belong in the host's secret settings (never in the repository), like the understanding-service key.
3. **A privacy notice and terms** are required by both consent screens and by students' data rules; the site has
   none yet.
4. **The host**: these sign-ins need the ASP.NET Core application running on a server with HTTPS. GitHub Pages and
   the static Vercel site cannot do it.

## The change itself (about one to two days once 1–4 are decided)

- Packages: `Microsoft.AspNetCore.Authentication.MicrosoftAccount` (or `Microsoft.Identity.Web` for university
  tenants) and `Microsoft.AspNetCore.Authentication.Google`, plus a store (ASP.NET Core Identity with a database,
  or a minimal user table).
- `Program.cs`: `AddAuthentication` with a cookie scheme and the two providers, configured from settings; the
  providers are added only when their client id is configured, so a host without them keeps today's behaviour.
- `AccountController`: `POST /login/external/{provider}` → `Challenge`; the callback signs the user in, creates
  the account on first visit (role chosen on the registration page, as today), and redirects to `/`.
- The browser client: on start, ask the server who is signed in (`GET /api/me`) and, if someone is, build the
  same account object `loginWithAccount` uses today, so every view keeps working unchanged.
- The buttons: replace `aria-disabled` and the note with a form that posts to the challenge address.
- Tests: the challenge redirects to the provider's address; the callback creates one account per external id;
  without configuration the buttons stay «قريباً».

## What the owner needs to provide

- A decision: keep accounts in the browser for now (buttons stay «قريباً»), or move to server accounts.
- The site's final address (domain) for the redirect URIs.
- The Microsoft Entra ID and Google Cloud registrations above, made in his accounts, and the secrets entered in the
  host's settings by him.
- A privacy notice and terms of use (Arabic), or approval for a draft to be written for his review.
