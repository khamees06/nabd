# 0010 — The public landing is redesigned (V6.2); the shell and the rest of the page stay frozen

Status: accepted · 2026-11-12 · amends [0003](0003-razor-views-reproduce-the-legacy-page.md) for three regions

## Context

The owner supplied a landing-page prototype (`Nabd-Index-Prototype-V6.2.html`) as the visual source of truth for
`/`. Until now the whole page was frozen: the served HTML had to equal the legacy `index.html` character for
character (ADR 0003, `The_page_is_the_legacy_page`). The prototype is a standalone page: its class names collide
with the legacy stylesheets, its selectors are global, it has its own fake sign-in screens and embedded images,
and it does not know the IDs the legacy client binds.

## Decision

- Exactly three regions of the page change: the **public header**, the **landing view** (`#view-index`) and the
  **public footer**. Each is a Razor partial (or a composition of partials) wrapped in `nabd:region` markers.
  Everything else, including the signed-in application, the modals, the ER room and every script and stylesheet
  of the legacy client, stays as it was.
- The **shell contract** is kept: `HomeController → Views/Home/Index.cshtml`, `id="view-index"`, and the IDs the
  legacy client binds (`public-header`, `public-brand-btn`, `public-login-btn`, `public-register-btn`,
  `site-footer`, `footer-guest-links`, `footer-app-links`, `foot-er-btn`, `nb-quiz-main`). Sign-in stays the
  application's existing `openAuthModal`; the prototype's demonstration sign-in is not ported.
- **Isolation**: the prototype's styles are converted, not pasted — classes prefixed `nl-`, the root and element
  selectors confined to `.nabd-landing`, and a generated cascade-layer guard for the few properties the legacy
  stylesheets force with `!important` or ID selectors. The legacy stylesheets are not edited.
- **Tests**: the old exact-page test is replaced by two tests that together are no weaker:
  the page **outside** the regions must still equal the legacy page (after the registered differences), and
  **each region** must equal its approved V6.2 snapshot (`tests/Nabd.Tests/LandingBaseline/`). A snapshot is
  approved only after comparing the result with the prototype in a browser (`landing-style-diff.mjs`,
  `landing-visual-compare.mjs`).

## Consequences

- A change to the landing fails the snapshot test until it is compared and approved on purpose
  (`tools/migration/landing-v6/approve-landing-baseline.mjs`); a change anywhere else on the page still fails the
  legacy comparison.
- Two differences are registered in `seams.json`: the landing's stylesheet/font links in the head and the
  `landing.js` script tag.
- `tools/legacy/compare-hosts.mjs` now takes the three regions out of both hosts before comparing the DOM and the
  screenshots; the landing itself is compared with the prototype instead.
- The old landing's CSS (`landing8.css`, `landing9.css`, parts of `style.css`/`theme.css`) still loads and no
  longer matches anything on the landing. It goes when the legacy CSS is retired, not in this change.
