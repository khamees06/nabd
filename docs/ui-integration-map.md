# UI integration map: prototype V6.2 → Razor views

Where every part of `Nabd-Index-Prototype-V6.2.html` went. Why: [ui-integration-audit.md](ui-integration-audit.md).
Decision: [ADR 0010](decisions/0010-public-landing-v62-with-the-shell-preserved.md).

## Request path (unchanged)

`GET /` → `HomeController.Index` → `Views/Home/Index.cshtml` (layout `Views/Shared/_Layout.cshtml`). The landing is
still the view `#view-index` that the legacy client shows to guests (`showOnlySection('index')`) and hides after
sign-in; the public header and footer are still swapped by `syncAuthShellUI()`.

## Sections

| # | Prototype section | Razor file | Root element / ID |
|---|---|---|---|
| 1 | `header.site-header` (+ skip link) | `Views/Shared/Layout/_PublicHeader.cshtml` | `header#public-header.nabd-landing.nl-site-header` |
| 2 | Hero `#home` | `Views/Home/Landing/_Hero.cshtml` | `section#nl-home.nl-hero` |
| 3 | Value strip | `Views/Home/Landing/_ValueStrip.cshtml` | `section.nl-value-strip` |
| 4 | Overview shell | `Views/Home/Landing/_Overview.cshtml` | `section.nl-premium-overview` |
| 4a | Specialty cards `#specialties` | `Views/Home/Landing/_Specialties.cshtml` (inside 4) | `section#nl-specialties` |
| 4b | Laptop showcase `#experience` | `Views/Home/Landing/_SimulationShowcase.cshtml` (inside 4) | `section#nl-experience` |
| 5 | Method `#method` | `Views/Home/Landing/_Method.cshtml` | `section#nl-method` |
| 6 | Vision / mission / goal `#about` | `Views/Home/Landing/_About.cshtml` | `section#nl-about` |
| 7 | Institutions + audience | `Views/Home/Landing/_Institutions.cshtml` | `section#nl-institutions-section` (contains `#nl-institutions`, `#nl-audience`) |
| 8 | Final call to action `#join` | `Views/Home/Landing/_FinalCta.cshtml` | `section#nl-join` |
| 9 | Information dialog | `Views/Home/Landing/_LandingDialog.cshtml` | `div#nl-dialog.nabd-landing` |
| 10 | `footer.site-footer` | `Views/Shared/Layout/_SiteFooter.cshtml` | `footer#site-footer.nabd-landing.nl-site-footer` |
| — | Demonstration sign-in screens (`.auth-app`) | not ported | the application's `#auth-modal` is used |

`Views/Home/Landing/_LandingView.cshtml` composes 2–9 inside
`section#view-index.nl-index-view > div.nabd-landing.nl-landing[data-no-terms]`, followed by the legacy
`#nb-quiz-main` box (closed by `scope.css`; `script.js` still writes into it).

Each of the three regions is wrapped in `<!-- nabd:region NAME … -->` … `<!-- /nabd:region NAME -->`
(`public-header`, `landing`, `site-footer`); the baseline tests use these markers.

`data-no-terms` on the three roots keeps the legacy English-terms converter (`terms.js`) out of the landing's copy.

## IDs

| Prototype | Application | Why |
|---|---|---|
| — (header) | `public-header`, `public-brand-btn`, `public-login-btn`, `public-register-btn` | Bound by the legacy client (sign-in buttons, brand → `navigateTo('index')`, guest/signed-in switch) |
| `mainNav`, `menuToggle` | `public-main-nav`, `public-menu-toggle` | The header's own menu |
| `home`, `about`, `specialties`, `method`, `audience`, `experience`, `institutions`, `institutions-section`, `join` | `nl-` + the same name | Cannot meet an application ID |
| `heroTitle`, `specialtiesTitle`, `experienceTitle`, `methodTitle`, `aboutTitle` | `nl-hero-title`, `nl-specialties-title`, … | Same |
| `contact` (footer) | `site-footer` | The legacy footer ID; «تواصل معنا» now links to `#site-footer` |
| `modalBackdrop`, `modalTitle`, `modalMessage`, `prototypeNote`, `modalClose`, `modalOk` | `nl-dialog`, `nl-dialog-title`, `nl-dialog-message`, `nl-dialog-note`, `nl-dialog-close`, `nl-dialog-ok` | Prefixed |
| `mainContent` (skip-link target) | `main-container` | The application's `main` |

IDs of the old landing that no longer exist: `index-demo-cta`, `index-login-cta`, `index-register-cta`,
`public-open-sidebar-btn`, `sec-about8`, `sec-audience8`, `sec-fields`, `sec-how`, `sec-problems8`. Every legacy
script reference to them is null-safe (`getElementById(…)?.`), and the browser run reports no errors.

## Classes

Every prototype class `x` became `nl-x` in the markup and the stylesheet (252 classes, listed by
`convert-css.mjs`). The application adds: `nabd-landing` (landing root), `nl-landing`, `nl-index-view`,
`nl-footer-links`, `nl-footer-credits`, `nl-is-open` (state) and the legacy footer classes `foot-app-link`.

## Actions (calls to action)

| Prototype control | Prototype behaviour | Application behaviour |
|---|---|---|
| Header «تسجيل الدخول» / «إنشاء حساب» | Open the demonstration sign-in screens | `#public-login-btn` / `#public-register-btn`: the legacy client opens `openAuthModal('login' / 'register')` |
| Hero and final CTA buttons with `data-auth-open` | Same | `data-nl-auth="login|register"` → `openAuthModal(...)` (`landing.js`) |
| «اكتشف حلول نبض للمؤسسات» (`data-modal="academic"`) | Information dialog | `data-nl-dialog="academic"` → the landing dialog (no form) |
| Final CTA «للمؤسسات التعليمية» (`data-modal`) | Information dialog | Link to `#nl-institutions` |
| Nav and footer links `#about` … | Smooth scroll | `#nl-about` …: scroll below the sticky header, focus the section, respect reduced motion |
| Brand | Scroll to top | Legacy `navigateTo('index')` + scroll to top |
| Specialty cards | Links to `#experience` | Links to `#nl-experience` |
| Mobile menu | Toggle `is-open` | `landing.js`: toggle `nl-is-open`, `aria-expanded`, `aria-label`, Escape, outside click, close on link, close above 820 px |

## Footer

| Part | Content |
|---|---|
| Brand + about | Prototype text (brand line without «الوطنية») |
| `#footer-guest-links` (guests) | The prototype's two columns «روابط سريعة» and «معلومات» |
| `#footer-app-links` (signed in; `.hidden` for guests) | The legacy signed-in links, unchanged in behaviour: home, random ER (`#foot-er-btn`), ER room (`nbOpenER()`), coach, profile; and «طبيعة النموذج» (the legacy disclaimer) |
| Bottom line | Prototype copyright line |
| `.nl-footer-credits` | «مصادر الصور» (`#nb-credits`, filled by the legacy script, plus the V6.2 image note) and «مصادر البيانات» (DDXPlus, CC BY 4.0) |

## Files added

| Path | What |
|---|---|
| `wwwroot/css/landing-v6.css` | Generated stylesheet + guard (do not edit) |
| `wwwroot/css/landing-v6-shell.css` | Hand-written integration rules |
| `wwwroot/fonts/noto-sans-arabic/*.woff2`, `LICENSE.md` | Self-hosted font, OFL 1.1 |
| `wwwroot/img/landing/*.webp`, `CREDITS.md` | The seven photos |
| `ClientScripts/landing/010-landing-v6.js` → `/js/landing.js` | Landing behaviour (bundle `landing` in `bundles.json`) |
| `tools/migration/landing-v6/*` | Converters (CSS, markup, partials, WOFF2) and the snapshot approval script |
| `tools/legacy/landing-style-diff.mjs`, `landing-visual-compare.mjs` | Prototype ↔ application comparison |
| `tests/Nabd.Tests/LandingBaseline/*` | Region definitions and approved snapshots |
| `tests/Nabd.Tests/Baseline/LandingV6Tests.cs`, `Support/LandingRegions.cs` | Tests |

Two registered differences were added to `LegacyBaseline/seams.json` (the head links, the `landing.js` script tag).
Removed: the old landing partials `_Facts`, `_Fields`, `_Jordan`, `_Problem`, `_Solution`, `_Audience`, `_Closing`.
