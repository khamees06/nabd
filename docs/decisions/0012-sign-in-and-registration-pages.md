# 0012 — Sign-in and registration as pages of their own (/login, /register)

Status: proposed (awaiting the owner's visual review) · 2026-11-13 · builds on [0008](0008-no-database-and-no-authentication-in-this-phase.md), [0010](0010-public-landing-v62-with-the-shell-preserved.md), [0011](0011-landing-v63-refinement-layer.md)

## Context

The owner asked (2026-11-13) for sign-in and registration to be standalone pages, official and professional,
possibly with a Microsoft account (most students have one through their university) and a Google account. His V6.2
prototype already designed such a screen ("auth-app": the form on the right with a small brand bar, a navy panel
on the left).

The sign-in itself lives in the legacy browser client: accounts and progress are kept in the browser (decision
0008), the demo accounts are built into `script.js`, and a successful sign-in continues to the signed-in home in
the same page (`loginWithAccount` → `navigateTo('home')`). A demo session is dropped when the page reloads. A page
that holds only the form would therefore either lose the demo sign-in at the redirect, or need the whole client
rewritten.

## Decision

- **Two addresses, served by MVC.** `AccountController` answers `GET`/`HEAD /login` and `/register` (not stored,
  like `/`), sets `AuthPage.Login` or `AuthPage.Register` and the page title, and renders `Views/Account/Login`
  or `Register`, which are the application's page (`Views/Home/Index`) opened on the sign-in screen.
- **One screen, organised in partials.** The legacy `Views/Shared/Modals/_AuthModal.cshtml` is replaced by
  `Views/Account/_AuthScreen.cshtml` (the region, the brand bar, the heading) with `_LoginForm`, `_RegisterForm`,
  `_ExternalSignIn`, `_DemoAccounts` and `_AuthBrandPanel`. Every id the legacy client reads is kept,
  with the demo-account and account-type attributes and the classes it reads or toggles (`nb-auth-simple`,
  `nb-auth-main`, `nb-step`, `is-on`, `hidden`, `flex`); `AccountPagesTests` checks the ids, the attributes and
  those classes; the layout renders the screen with the page's `AuthPage`.
  On `/` it is hidden on the sign-in form, exactly where the legacy modal was; on `/login` and `/register` it is
  open, on its form, from the first byte. `/login/` and `/register/` redirect to the address without the slash
  (the page's files are addressed relative to it).
- **The screen is a page, wherever it is opened.** It covers the whole window (no dimmed dialog), and
  `landing/020-auth-pages.js` keeps the address and the title in step with it: opening it from the landing or
  from a protected button adds `/login` (or `/register`) to the history, switching forms replaces it, closing it
  (the «إغلاق» button, Escape, a successful sign-in) returns to the address it came from, and the browser's Back and
  Forward buttons close and reopen it. On `/login` with an account already signed in on this device, it goes
  straight to the signed-in home. The legacy functions (`openAuthModal`, `closeAuthModal`, `switchAuthModalTab`)
  are unchanged; the script only watches the screen's classes. The history moves that belong to the screen are
  kept from the rest of the client (its popstate listener runs first and stops them from reaching the ER room's
  Back handler) and from the browser's scroll restoration, so closing the screen, also inside the ER room, leaves
  the page as the legacy modal did; Forward after a sign-in does not reopen it. Tab stays on the screen while it
  is open.
- **Design and stylesheet.** The owner's prototype design, in the landing's tokens, in `wwwroot/css/auth.css`:
  every selector from `#auth-modal`; declarations `!important` in `@layer nl-refine` (decision 0011), except
  `display` on anything `.hidden` may hide, which stays outside the layer so that `.hidden` keeps winning (tested).
  The prototype's photo is not used (no documented licence); the panel is navy with a drawn rhythm line.
- **Microsoft and Google: shown, not connected.** The buttons are there, marked «قريباً» and `aria-disabled`; a
  press explains that they are not available yet and points to e-mail or a demo account. No sign-in service is
  contacted and no server endpoint exists for one (`AccountPagesTests` checks the markup and that `/signin-google`,
  `/signin-microsoft` and `/signin-oidc` do not exist). What activating them needs is in
  [`docs/auth-external-providers.md`](../auth-external-providers.md).
- **Baseline.** The screen is a fourth redesigned region (`auth` in `LandingBaseline/regions.json`, snapshot
  `auth.html`); the rest of the page still equals the legacy page, and `/login` and `/register` equal `/` outside
  the screen and the title. `compare-hosts.mjs` takes the screen out of both pages and evens out the two things it
  changes while open (the `nb-auth-open` class on `<html>`, the title).

## Why not a separate small page

A page with only the form would have to load the client anyway to check the password and keep the account, and
the demo sign-in (the one the jury uses) would be lost at the redirect, because the client drops demo sessions on
reload. Rendering the application's page with the screen open keeps every legacy behaviour and still gives real
addresses, a real title and a page layout.

## Consequences

- `/login` and `/register` work as links (for a poster, a QR code, an e-mail) and in a new tab.
- The sign-in is still not a security boundary (decision 0008): the pages change where and how it is shown, not
  what it is.
- Real Microsoft or Google sign-in is a server-side change with an identity decision; it is planned, not done.
- The ASP.NET host is still needed: the static copy on GitHub Pages has no `/login` route.
