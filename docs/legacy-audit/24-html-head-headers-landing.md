# index.html:1–413 — document head, public header, app header, sidebar and the landing view

Scope: index.html lines 1–413, read in full. Long lines were cut when printed (lines 8, 10, 74, 128, 176, 190, 205–236, 256, 279, 322–324, 355, 368–369, 386–388); ids, handlers and attributes on those lines were checked with targeted greps. No probe of the running page was used. A grep for CR characters in index.html returned 0 lines (the brief says CRLF; not determined which is true).

## Structure

| Lines | Block | id / key class | Notes |
|---|---|---|---|
| 1–4 | doctype, `<html lang="ar" dir="rtl">`, charset, viewport | | |
| 6 | `<title>` | | one static string |
| 7–10 | comment, favicon (inline SVG data URI), theme-color `#0F766E`, meta description | | |
| 11–13 | preconnect x2 + Google Fonts stylesheet (Readex Pro, IBM Plex Mono) | | line 13 contains `@` |
| 14–17 | four blank lines | | |
| 18–29 | 9 stylesheet links: style, theme, resp, er, scope, home9, landing8, landing9, academic8 (+3 comments at 24, 26, 27) | | order matters: scope.css uses `!important` against theme.css |
| 30 | inline `<script>` defining `window.nbImgFail` stub | | |
| 32–33 | `</head>`, `<body class="min-h-screen flex flex-col bg-[#F6F4EF] ...">` | | utility classes are served from style.css; no Tailwind script tag in the head |
| 35–37 | comment banner "1A. PUBLIC HEADER" | | |
| 38–82 | public header | `#public-header` | brand button 40–54, anchor nav 55–62, login / register / hamburger 64–81 |
| 84–86 | comment banner "1B" | | |
| 87–184 | app header | `#app-header` (class `hidden`) | brand 89–102, nav 104–121, avatar + dropdown 124–168 (`#user-menu-btn` 131, `#account-dropdown-menu` 137), hamburger `#app-open-sidebar-btn` 171–183 |
| 186–188 | comment banner sidebar | | |
| 189 | backdrop | `#sidebar-backdrop` (class `hidden`) | inline z-index |
| 190–251 | sidebar drawer | `#app-sidebar` | head 191–194, user card 195–198, guest nav 201–210 (`#sidebar-guest-nav`, 5 anchors), signed-in nav 213–238 (`#sidebar-app-nav`, hidden, 5 groups), footer 240–250 (`#sidebar-guest-footer`, `#sidebar-app-footer` hidden) |
| 253–259 | toast | `#calm-toast` (class `hidden`) | `#calm-toast-text`, `#calm-toast-close` |
| 261–264 | comment banner + `<main id="main-container">` (closed outside this range) | | |
| 270–403 | landing view | `<section id="view-index" class="nb-index l9">` | |
| 275–294 | hero | `.nb-hero.l9-hero`; `<h1>` 278; CTAs `#index-register-cta` 281, `#index-demo-cta` 282, `#index-login-cta` 285; photo 289 | |
| 296–306 | Jordan strip | `.l9-jordan` | photo 297 |
| 308–313 | facts list | `ul.l9-trust` | 4 numbers typed as text |
| 316–328 | about / vision | `#sec-about8` | photo 317, 3 cards |
| 330–343 | problem | `#sec-problems8` | photo 341, stat `~85%` |
| 345–360 | solution | `#sec-how` | photo 346, 4 feature items, button 357 with `onclick` |
| 362–378 | fields | `#sec-fields` | 8 `<li>`, photos 368–375 |
| 380–391 | audience | `#sec-audience8` | 3 `<li>`, photos 386–388 |
| 393–400 | closing CTA | `.v7-final.l9-final` | button 398 with `onclick` |
| 402 | `<div id="nb-quiz-main" hidden>` | | quiz host |
| 405–413 | comment banner that introduces `#view-home` (line 414) | | belongs to the next block |

Signed-in sidebar groups (213–238): home (`data-side-app="home"`, 215), "التدريب السريري" (`#side-er-btn` + 3 locked buttons), "سجلي" (debrief, profile, `#side-cert-btn`), "المسار الجامعي" (`#side-uni-portal-btn`), "إعدادات الحساب" (settings button, `data-drop-view="profile"`).

## Which script owns what

| id / selector | Reader / writer (file:line) | What it does |
|---|---|---|
| `#public-header`, `#app-header`, `#sidebar-guest-nav`, `#sidebar-app-nav`, `#sidebar-guest-footer`, `#sidebar-app-footer` | script.js:1854–1859, 1865–1870 (`syncAuthShellUI`) | toggles class `hidden` by `authState.isAuthenticated` |
| `#sidebar-subtitle` | script.js:1862 and following | text = guest string or `role · specialty` |
| `#user-avatar-fallback`, `#header-user-short-name`, `#dropdown-user-name`, `#dropdown-user-role`, `#dropdown-demo-badge` | script.js:1888–1896 (get elements and write); ui.js:19–20, 44 (reads) | user identity text |
| `#side-user-av`, `#side-user-name` | ui.js:15–27 (writes; MutationObserver on `#dropdown-user-name` and on `#app-header` class) | mirrors header identity in the drawer |
| `#app-sidebar [data-v7-view]` | ui.js:32–35 | toggles `is-current` by the open `#main-container > section` id |
| `#app-open-sidebar-btn`, `#public-open-sidebar-btn` | script.js:6597, 6613 (`openSidebar`, 4093); ui.js:40–42 | opens drawer |
| `#close-sidebar-btn`, `#sidebar-backdrop` | script.js:6652–6653 (`closeSidebar`, 4102) | closes drawer; Escape handler at script.js:6561–6563 |
| `#user-menu-btn`, `#account-dropdown-menu` | script.js:4112–4130, 6576–6577, 6614 | dropdown toggle, `aria-expanded` |
| `[data-drop-view]` (lines 145, 149, 153, 157, 235) | script.js:6636 | opens profile tab named in `data-profile-tab` |
| `.app-nav-btn[data-app-view]` | script.js:1966–1967 | active-state marking |
| `.guest-side-link`, `.side-app-item[data-side-app]` | script.js:6654, 6660–6662 | sidebar click handlers (bodies not read) |
| `#public-brand-btn`, `#public-login-btn`, `#public-register-btn` | script.js:6594–6596 | `navigateTo('index')`, `openAuthModal('login' / 'register')` |
| `#index-login-cta`, `#index-register-cta`, `#index-demo-cta` | script.js:6599–6602 | auth modal; demo = `nbDemoLogin('med_student')` then `nbOpenER()` after 400 ms |
| `#app-brand-btn`, `#app-nav-home`, `#app-nav-cases`, `#app-nav-uni`, `#app-nav-coach`, `#app-nav-er` | script.js:6608–6612, 6627 (`launchRandomER`) | navigation; script.js:4014–4015 removes `hidden` from `#app-nav-er` and renames `#app-nav-cases` for nurses |
| `#side-er-btn`, `#side-uni-portal-btn`, `#side-cert-btn`, `#side-switch-demo-btn`, `#side-logout-btn`, `#side-guest-login-btn`, `#side-guest-register-btn`, `#dropdown-switch-demo-btn`, `#dropdown-logout-btn` | script.js:6628, 6666, 6879, 6667–6668, 6657–6658, 6645, 6649 | click handlers |
| `#calm-toast`, `#calm-toast-text`, `#calm-toast-close` | script.js:1836–1837 (`showToast`), 7114–7115; er.js:4649 (second writer) | toast |
| `#nb-quiz-main` | script.js:2469, 2571 (`nbQHost`; `nbHost()` 2471) | quiz renders here; the section stays hidden |
| `#view-index`, `#main-container` | motion.js (references found by grep, not read); ui.js:31 | view switching code not read in this range |
| `#sec-*` ids | no script reference found; native `href="#..."`; `scroll-margin-top` in style.css:459 | |
| `data-pub-anchor` | no script reference; scope.css:16–18 only | |
| `.er-locked` | er.css:155–158 | `pointer-events:none`, grey, label "مقفلة" via `::after` |

## Inline code

| Line | Kind | Content / global called |
|---|---|---|
| 30 | inline `<script>` | defines `window.nbImgFail` stub (hides the image). The real `function nbImgFail` is at script.js:3442 (whether it replaces the global at load: not run-tested) |
| 289, 297, 317, 341, 346, 368–375, 386–388 | `onerror="nbImgFail(this)"` (17 images) | global `nbImgFail` |
| 357 | `onclick="document.getElementById('index-demo-cta').click()"` | no global; depends on id `index-demo-cta` |
| 398 | same `onclick` | same |
| 189 | `style="z-index: 70;"` | layout; duplicates class `z-70` |
| 190 | `style="z-index: 75;"` | layout; duplicates `z-75` |
| 256 | `style="z-index: 100;"` | layout; duplicates `z-100` |

No other `on*` attributes, no other inline `<script>` and no inline `<style>` in 1–413.

## External resources

| Resource | URL | Line |
|---|---|---|
| Fonts preconnect | https://fonts.googleapis.com | 11 |
| Fonts preconnect (crossorigin) | https://fonts.gstatic.com | 12 |
| Fonts stylesheet (Readex Pro 160..700, IBM Plex Mono 300/400/500) | https://fonts.googleapis.com/css2?family=Readex+Pro:wght@160..700&family=IBM+Plex+Mono:wght@300;400;500&display=swap | 13 |
| Favicon | inline `data:image/svg+xml` | 8 |
| Local CSS | style, theme, resp, er, scope, home9, landing8, landing9, academic8 (.css) | 18–29 |
| Landing photos | img/v9/hero2, jordan, vision2, problem, solution2, sp-er, sp-cardio, sp-resp, sp-diabetes, sp-sepsis, sp-surgery, sp-obgyn, sp-peds, aud-students, aud-nurses, aud-uni (.jpg) | 289, 297, 317, 341, 346, 368–375, 386–388 |
| Scripts | none in 1–413 (script tags are at 2311–2316) | |

style.css:703 and 774 name Noto Kufi Arabic / Noto Sans Arabic; no link in 1–413 loads them (loaded elsewhere: not determined).

## Text that needs care in Razor

| Line | Text | Handling |
|---|---|---|
| 13 | `wght@160..700` (the only `@` in 1–413, found by grep) | write `@@` in the .cshtml |
| 1–413 | `@media` / `@keyframes` | none: no inline `<style>` |
| 8 | favicon data URI with `%3C`, `%27`, `%23` | no Razor effect; keep verbatim |
| 189, 190, 256 | inline `style` | no Razor effect |

Comments: all are authoring notes with dates; none is a conditional comment. They may be dropped without changing rendered output (script lookups are by id, not by comment): lines 7, 24, 26, 27, 35–37, 39, 56, 63, 84–86, 88, 103, 123, 125, 170, 186–188, 200, 211–212, 253–255, 261–263, 266–269, 273–274, 295, 307, 315, 329, 344, 361, 379, 392, 401, 405–413 (line numbers of single-line comments not all verified one by one). Keep as `@* *@` only if the team wants the notes.

## Accessibility and RTL notes

| Item | Evidence |
|---|---|
| `lang="ar" dir="rtl"` on `<html>` | line 2 |
| Drawer has `aria-label` and `aria-hidden`, toggled by script | 190; script.js:4098, 4108 |
| Drawer close button has `aria-label` and title "(Esc)"; Escape handler exists | 194; script.js:6561 |
| Dropdown button has `aria-expanded`, `aria-haspopup`; menu has `role="menu"`, items have no `role="menuitem"` | 131, 137 |
| Locked items use `tabindex="-1"` and `aria-disabled="true"`; they remain buttons, blocked by CSS `pointer-events:none`; `#app-nav-coach` still has a click handler | 118, 220–222; er.css:155; script.js:6612 |
| Focus trap in the drawer | not determined |
| Toast has `role="status"`, `aria-live="polite"` | 256 |
| Decorative SVGs have `aria-hidden="true"`; the dropdown chevron svg has none | 135 |
| Fields photos have `alt=""` | 368–375 |
| One `<h1>`, then `<h2>` per section | 278 and following |
| Physical directions in markup (`text-right`, `left-0`, `left-5`, `-translate-x-full` on a `left-0` drawer) | 41, 137, 190, 256 |

## Features and reachability

| Block | State | Evidence |
|---|---|---|
| Public header | live (guest) | shown unless authenticated: script.js:1865 |
| Public header nav (5 anchors) | live from `md` up | `hidden md:flex`, line 55 |
| `#public-register-btn` | live from `sm` up | `hidden sm:inline-flex`, line 67 |
| App header | live (signed in) | `hidden` removed at script.js:1866 |
| `#app-nav-cases` | dormant | hidden by scope.css:25 (`display:none !important`); handler 6610 and rename 4015 remain |
| `#app-nav-coach` | dormant | `er-locked` (er.css:155); handler script.js:6612 remains |
| `#app-nav-er`, `#app-nav-home`, `#app-nav-uni` | live | handlers 6627, 6609, 6611 |
| 3 locked sidebar buttons (lines 220–222) | dormant | `er-locked`, no id, no handler found |
| Sidebar home, `#side-er-btn`, debrief, profile, `#side-cert-btn`, `#side-uni-portal-btn`, settings | live | handlers listed above |
| scope.css:26 selector `.v7-item[onclick*="app-nav-cases"]` | unreferenced | no sidebar element in 1–413 has an `onclick` |
| scope.css selectors for `#sec-roles`, `#sec-specs`, `#sec-universities`, `#sec-level` and their links | unreferenced in this range | no such id or href in lines 1–413 (full-file search not done) |
| Landing sections (hero, Jordan, facts, about, problems, solution, fields, audience, closing CTA) | live | no `hidden` class |
| `#nb-quiz-main` | dormant | attribute `hidden` (line 402); script.js writes into it (2469, 2571); scope.css header says the level quiz is closed |
| `#view-index` show/hide | script-managed, code not read here | |
| `#calm-toast` | live | script.js:1836, er.js:4649 |

## Problems

| # | Severity | Problem | Where |
|---|---|---|---|
| 1 | medium | About 45 ids in this range are looked up by script; every id must stay unchanged and unique in the Razor output. | whole range |
| 2 | medium | Guest/signed-in switching is done in the browser by toggling `hidden` (`syncAuthShellUI`); both headers and both sidebar navs are always in the HTML. | script.js:1865–1870 |
| 3 | medium | Landing buttons trigger another button by id through inline `onclick`. | 357, 398 |
| 4 | medium | `<main>` opens at 264 and closes outside the range; `<section id="view-index">` spans 270–403. Partial cuts must respect this. | 264, 270 |
| 5 | low | Stale CSS selectors (`#sec-roles`, `#sec-specs`, `#sec-universities`, `#sec-level`, `[onclick*="app-nav-cases"]`); `data-pub-anchor` has no script reader. | scope.css:15–26 |
| 6 | low | Locked items are buttons blocked only by CSS; `#app-nav-coach` keeps a live handler. | 118; script.js:6612 |
| 7 | low | z-index set twice (class and inline style). | 189, 190, 256 |
| 8 | low | Landing numbers (6, 4, 2, 6, ~85%) are hard-coded text, and the hero floats repeat "6". | 291, 309–312, 339 |
| 9 | low | `role="menu"` without `menuitem` children. | 137 |
| 10 | low | The same logo path and hamburger SVG are repeated in several places. | 44–46, 92–94, 170–176 |

## Proposed Razor split

Line ranges are contiguous and cover 1–413. Cuts are at element boundaries except where noted. Rows 8 and 17 are the wrapper of `<section id="view-index">`; they belong to one view file (`Landing.cshtml`) that renders the inner partials, so the markup stays identical when concatenated.

| Order | Partial | From–to | What it holds |
|---|---|---|---|
| 1 | _Head.cshtml | 1–32 | doctype, html, head, meta, fonts (`@@` on line 13), 9 CSS links, `nbImgFail` stub script |
| 2 | _BodyOpen.cshtml | 33–34 | `<body ...>` open tag (closed in the layout) |
| 3 | _PublicHeader.cshtml | 35–83 | banner comment and `<header id="public-header">` |
| 4 | _AppHeader.cshtml | 84–185 | banner comment and `<header id="app-header">` with account dropdown |
| 5 | _SidebarDrawer.cshtml | 186–252 | banner comment, `#sidebar-backdrop`, `<aside id="app-sidebar">` |
| 6 | _Toast.cshtml | 253–260 | banner comment and `#calm-toast` |
| 7 | _MainOpen.cshtml | 261–265 | banner comment and `<main id="main-container">` open tag (closed in the layout) |
| 8 | Landing.cshtml (wrapper, part 1) | 266–274 | banner comments and `<section id="view-index">` open tag, hero comment |
| 9 | _LandingHero.cshtml | 275–294 | `.nb-hero.l9-hero` |
| 10 | _LandingJordan.cshtml | 295–306 | comment and `.l9-jordan` |
| 11 | _LandingFacts.cshtml | 307–314 | comment and `ul.l9-trust` |
| 12 | _LandingAbout.cshtml | 315–328 | `#sec-about8` |
| 13 | _LandingProblem.cshtml | 329–343 | `#sec-problems8` |
| 14 | _LandingSolution.cshtml | 344–360 | `#sec-how` |
| 15 | _LandingFields.cshtml | 361–378 | `#sec-fields` |
| 16 | _LandingAudience.cshtml | 379–391 | `#sec-audience8` |
| 17 | _LandingClosing.cshtml | 392–401 | `.v7-final.l9-final` and the quiz-note comment |
| 18 | Landing.cshtml (wrapper, part 2) | 402–404 | `#nb-quiz-main`, `</section>`, blank line |
| 19 | _HomeViewBanner.cshtml | 405–413 | comment banner for `#view-home`; may be dropped or merged into the partial that starts at 414 |

## Open questions

1. How will the signed-in state reach the page: stay client-side (class toggles) or become server-rendered? This decides whether both headers and both sidebar navs remain in the HTML.
2. Are Noto Kufi Arabic / Noto Sans Arabic (style.css:703, 774) loaded anywhere? No link in 1–413 loads them.
3. Does the real `nbImgFail` (script.js:3442) replace the stub of line 30 at load? Not run-tested.
4. Which line endings must the migrated output keep? grep found no CR in index.html.
5. Which of the stale scope.css selectors target elements outside lines 1–413 (full-file grep not done)?
6. What do the `.guest-side-link` and `.side-app-item` handlers (script.js:6654–6666) do exactly? Not read.
