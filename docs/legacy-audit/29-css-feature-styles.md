# Feature stylesheets

Scope: resp.css (235 lines), er.css (432), scope.css (63), home9.css (75), landing8.css (177), landing9.css (137), academic8.css (319). Total 1,438 lines, no framework, no preprocessor. Checked against index.html, script.js, er.js, resp.js, ui.js, motion.js and the running page (3 probes' worth of evidence: one probe run on the sign-in page).

Every file relies on `!important` heavily because style.css carries global `!important` rules (resp.css:3-4, er.css:3-4, scope.css:10-11). Count of `!important` lines: resp 33, er 28, academic8 28, home9 15, landing9 13, landing8 10, scope 4.

## Purpose of each file and load order (from index.html <head>)

Order in `<head>` (index.html:19-29): style.css, theme.css, **resp.css (21)**, **er.css (22)**, **scope.css (23)**, **home9.css (24)**, landing8.css (26), landing9.css (27), academic8.css (29). Lines 25 and 28 are HTML comments only. Google Fonts link at line 13.

| File | Lines | Purpose | Layer |
|---|---|---|---|
| resp.css | 235 | Respiratory emergency room (`#view-resp`, `.rs-*`) and a home card (`#home-resp-card`) | presentation |
| er.css | 432 | Emergency room (`#view-er`, `.er-*`): stage, chat, monitor, tests sheet, orders, briefing, report; wide/phone layouts | presentation |
| scope.css | 63 | Hides features that are kept in the markup but not offered (landing sections, learning path, coach, TTS, OSCE) | presentation (feature visibility) |
| home9.css | 75 | Student home order (flex `order`), photo cards "أقسام التدريب", and sign-in restyled as a full page | presentation |
| landing8.css | 177 | Styles for the phase8 landing sections (`.l8-*`) and one header-nav rule | presentation |
| landing9.css | 137 | Landing v9 (`#view-index.l9`): hero, Jordan strip, trust list, fields cards, final call | presentation |
| academic8.css | 319 | Sign-in role cards and side panel, "what will you do now" guide card, academic portal (`.nb8-*`: tabs, courses, assignments, advisor) | presentation |

Cascade note: home9.css header says "Loaded last" (home9.css:5); it is not. landing8, landing9 and academic8 load after it. Where both touch `#auth-modal`, home9 wins by selector specificity (see Problems).

## Scoping (which view or component each file styles; the selectors that scope it)

| File | Scoped by | Evidence |
|---|---|---|
| resp.css | `#view-resp` (44 rules), `.rs-*` classes (unscoped, prefixed), `#home-resp-card`, a few `#view-home`/`#view-index` rules | resp.css:6-60; `#view-resp` at index.html:1766 (`class="hidden"`) |
| er.css | `#view-er` (40 rules), `.er-*` classes (unscoped, prefixed), `#view-er[data-stage=...]`, `.er-grid[data-side=...]`, `.v7-item` (2), a global `html:has(#view-er:not(.hidden))` rule | er.css:6, 36-37, 360 |
| scope.css | Global IDs (not view-scoped): `#sec-*`, `#home-*`, `#path-*`, `#public-header`, `#app-sidebar`, `#setting-tts-row` | scope.css:15-51 |
| home9.css | `#view-home` (15), `html #auth-modal ...` (7), `.h9-*` | home9.css:9-20, 49-68 |
| landing8.css | `#view-index .l8-*` (all 53 rules except the last media block) and `#public-header nav .nav-link-item` | landing8.css:142-145 |
| landing9.css | `#view-index.l9 ...` (84 rules; `.l9` class at index.html:270) | landing9.css:6-137 |
| academic8.css | `#auth-modal ...` (21), `#view-home ...` (12), `.nb8-*` (unscoped, prefixed) | academic8.css:38-319 |

Unscoped (global) selectors: `.rs-*`, `.er-*`, `.nb8-*`, `.h9-*`, `.er-rooms*`, `.er-room-card` (home9/er), `label.nb-switch:has(#osce-toggle)`. They rely on class prefixes for isolation, not on a view ancestor.

## scope.css in detail (every selector group that hides a feature, what feature it hides, and the matching guard in script.js if any: this file decides which features are visible)

Header (scope.css:1-13) says hidden views are "closed in script.js (REMOVED_VIEWS and the start guards)". The guard is `const REMOVED_VIEWS = new Set(['observe', 'nurse', 'resp', 'coach', 'sim'])` at script.js:1678, enforced in `navigateTo` at script.js:1949 (`if (REMOVED_VIEWS.has(viewId)) { viewId = 'home'; options = {}; }`). 'university' was removed from that set in phase8 (script.js:1677 comment).

Two rule blocks: one plain list ending `display: none !important` (lines 15-43) and one `:has()` list in its own rule (46-51), kept separate so a browser without `:has()` does not drop the first list (comment lines 44-45).

| Lines | Selectors | Feature hidden | Element present in index.html? | Matching guard in script.js |
|---|---|---|---|---|
| 15 | `#sec-roles, #sec-specs, #sec-or, #sec-universities, #sec-level, #index-level-cta` | Old landing sections: roles, specialties, OR, universities, level quiz CTA | No: 0 matches for each ID in index.html and in all JS | none; landing sections are now `#sec-about8/problems8/how/fields/audience8` (index.html:316-380) |
| 16-18 | `#public-header a[data-pub-anchor="sec-specs"/"sec-universities"/"sec-level"]` | Header nav links to the removed sections | No: header anchors are sec-about8, sec-problems8, sec-how, sec-fields, sec-audience8 (index.html:57-61) | none |
| 19-22 | `#app-sidebar #sidebar-guest-nav .v7-item[href="#sec-roles"/"#sec-specs"/"#sec-universities"/"#sec-level"]` | Guest sidebar links to removed sections | No: sidebar guest links point to sec-about8..sec-audience8 (index.html:204-208) | none |
| 25 | `#app-nav-cases` | Header nav button "الحالات والتدريب" (cases) | Yes, index.html (1 line) | script.js:6610 click handler to `navigateTo('home', {scrollToCases:true})`; script.js:4015 sets its label. Both operate on a hidden button |
| 26 | `#app-sidebar .v7-item[onclick*="app-nav-cases"]` | Sidebar item that triggers the cases nav | No match found in index.html (the only `app-nav-cases` text is the id itself). Dynamic creation not determined | none |
| 31 | `#home-skip-note, #home-learn, #home-nurse` | "skipped level quiz" note; learning-path card; nursing home section | Yes (index.html:435, 437, 462; all also carry `hidden`) | script.js:3990-4014 `renderLearnPath` toggles `.hidden` on them; scope.css keeps them invisible regardless |
| 32 | `#home-cases-anchor` | Cases/specialties block on student home | Yes (index.html:738) | script.js:4012-4014 adds `.hidden`; 1995-1996 scroll-to-cases logic |
| 33 | `#home-path > .nb-path-card:not(.nb-path-dark), #path-retake, #path-retake-note` | All progress-path cards except the dark one; "retake level quiz" button and note | Yes (index.html:444-445; `nb-path-card` appears 5 times) | script.js:2441 writes `path-retake-note`; 2628 binds `path-retake` click to `nbOpenLevelModal` |
| 37 | `#path-mistakes [data-fix]` | "Fix this" buttons that open a room for a mistake | Generated: script.js:2594 builds them, 2595 binds click to `nbOpenRoom` | none |
| 40 | `#home-coach-banner, #open-coach-view-btn, #dash-coach-go, [data-foot-app="coach"]` | Coach (clinical coach) entry points | `#home-coach-banner` index.html:776; `open-coach-view-btn` 1 line; `dash-coach-go` created by script.js:5447; `data-foot-app="coach"` 1 line | script.js:6698, 5448, 7110 call `navigateTo('coach')`, which `REMOVED_VIEWS` redirects to home (script.js:1949) |
| 41 | `#setting-tts-row, #coach-api-box` | Text-to-speech default setting row; coach API box | Yes (index.html:1359 and 1 line) | not referenced in script.js (0 matches) |
| 46 | `#home-path .nb-kpis > div:has(#path-k2)` | Specialty-average KPI | Yes | script.js:2427 still writes `#path-k2` |
| 47 | `#view-profile div:has(> #profile-stat-spec)` | Profile specialty stat | Yes | script.js:5326 still writes it |
| 48 (in 49) | `#printable-certificate-area div:has(> #cert-stat-spec)` | Certificate specialty stat | Yes | script.js:5386 still writes it |
| 49 | `label.nb-switch:has(#osce-toggle)` | OSCE exam-mode switch in profile | Yes | script.js:2442 sets state, 2629 change handler stores `nabd_osce` |
| 49 | `label:has(> input#setting-tts-default)` | TTS default checkbox label | Yes | not referenced in script.js |
| 58 | `#home-path .nb-kpis { grid-template-columns: repeat(2, ...) }` | Closes the gap left by the hidden KPI cell | n/a | n/a |
| 59-62 | `@media (min-width: 900px) { #home-path { grid-template-columns: 1fr } }` | One-column path row | n/a | n/a |

Left visible on purpose (phase8 comments): `#app-nav-uni`, university sidebar group, `#home-quick-uni-btn`, `#home-professor-section`, `#home-student-uni-section`, `#path-notes`, professor demo button, supervisor role card, `#reg-code` (scope.css:21-23 comments, 33-35, 53-56, 63). `#home-professor-section` and `#home-student-uni-section` are shown by role in script.js (1 reference each).

Classification: all rows are **dormant** (markup and script writes kept; hidden by scope.css with `!important`), except rows 15-22 which target elements that no longer exist (**stale selectors**, match nothing today) and row 26 (no match found).

Two other hiding mechanisms found outside scope.css that also decide visibility: `.er-locked` cards in the markup (index.html:118, 220-222, 724, 728) and home9.css:20 `#view-home .er-rooms, #view-home #home-resp-card { display: none !important }`.

## Relative url() references (every one, with file and line)

| File:line | Value | Resolves to | Exists |
|---|---|---|---|
| home9.css:59 | `url("img/v9/login2.jpg")` inside `.nb8-auth-side` background (min-width 860px) | img/v9/login2.jpg relative to the stylesheet (same folder as index.html) | Yes, 121,851 bytes |
| home9.css:68 | `url(...)` in the `::before` of `.nb-auth-main` (phone band; line is cut at 200 chars in my listing) | not fully read; the value is on a long line | not determined |
| home9.css:74 | `url("data:image/svg+xml...")` as `-webkit-mask` (lock icon) | data URI, no file | n/a |
| landing9.css:66 | `url("data:image/svg+xml...")` as mask (lock icon) | data URI, no file | n/a |

No other `url()` exists in resp.css, er.css, scope.css, landing8.css or academic8.css. The Google Fonts stylesheet is linked from index.html:13, not imported in these files. Landing and home photos are `<img>` elements in markup, not CSS backgrounds.

Re-hosting note: `img/v9/login2.jpg` is resolved relative to the CSS file location; moving CSS to another folder breaks it.

## Rules tied to JavaScript state (data attributes, classes toggled by scripts, :has() rules)

| File:line | Selector | State carried | Set by |
|---|---|---|---|
| resp.css:7 | `#view-resp.is-loading .rs-wrap` | loading dim | resp.js `open()` (classList add/remove) |
| resp.css:60, 157, 174 | `.rs-card[hidden]`, `.rs-submit[hidden]`, `.rs-dx[hidden]` | `hidden` attribute | resp.js |
| resp.css:117-118, 133-134, 150, 173 | `.rs-t.is-on`, `tr.is-hi/.is-lo`, `.rs-q.is-asked`, `.rs-dx[aria-pressed=true]` | test selected, lab flag, asked question, diagnosis picked | resp.js |
| er.css:30-31, 254, 299 | `.er-p.is-on`, `[data-who="p/c/n/d"]`, `.er-p[data-out]` | active speaker, who, person out of room | er.js |
| er.css:36-37, 91-92, 384-391 | `#view-er[data-stage="watch/urgent/critical"]` | clinical stage of the patient (colours border, monitor, Vitals tab dot, flash) | er.js (state transition rendered as attribute) |
| er.css:375-388 | `.er-grid[data-side="labs"]`, `.er-side-tabs button[aria-pressed]` | which side panel (monitor or tests) shows at 1024px+ | er.js |
| er.css:16, 119, 291, 403 | `aria-pressed="true"`, `aria-checked="true"` on filters, tests, role switch | selection | er.js |
| er.css:172 | `.er-records.is-open` | tests sheet open (phone) | er.js |
| er.css:110, 124, 303 | `.er-sheet[hidden]`, `#er-debrief[hidden]`, `.er-ord[hidden]` | hidden panels | er.js |
| er.css:220-225, 272-273, 416 | `.is-off` (out-of-indication amber) | order not indicated | er.js |
| er.css:307-318, 328, 415 | `.er-ord-row.is-open`, `.er-ord-chip.is-wait/.is-done/.is-x/.is-rem/.is-doc`, `tr.is-blocked`, `.er-tc.is-done` | order status | er.js |
| er.css:321, 381 | `#er-test[data-badge]:not([data-badge=""])::after { content: attr(data-badge) }` and `#er-tab-labs` | pending-results counter | er.js |
| er.css:360 | `html:has(#view-er:not(.hidden))` | disables pull-to-refresh while the room is open | `.hidden` toggled by `navigateTo` |
| er.css:429-431 | `#er-records:has(> #er-ord:not([hidden]))` (min-width 1024px) | nurse mode with doctor's orders showing: panel scrolls as one piece | er.js toggles `hidden` on `#er-ord` |
| home9.css:9-10 | `#view-home:not(.hidden)` | home view active | `navigateTo` |
| home9.css:30-33, 75 | `.h9-fields li.is-open` / `:not(.is-open)` | open vs locked section card | markup (static) |
| home9.css:49 | `html #auth-modal:not(.hidden)` | auth page open | `openAuthModal`/`closeAuthModal` |
| landing9.css:61, 69 | `.l9-fields li.is-open` / `:not(.is-open)` | open vs coming-soon field | markup (static) |
| academic8.css:80 | `#auth-modal #reg-rolecards button.is-on::before` | selected role card | script.js |
| academic8.css:91 | `#view-home .nb8-guide.hidden { display:none !important }` | guide card hidden | `nb8RenderGuide` (script.js:6118) |
| academic8.css:140-144 | `.nb8-tabs button[aria-selected=true]`, `.nb8-pane[hidden]`, `.nb8-pane:not([hidden])`, `#nb8-pane-reports > :not([hidden]) ~ :not([hidden])` | active portal tab | script.js (nb8 portal) |
| academic8.css:174-176, 196, 212, 240-247, 281, 285 | `.is-main`, `#nb8-as-status.is-bad`, `.nb8-details[open]`, `.nb8-adv-pill/.nb8-adv .is-needs/.is-good/.is-contacted`, `.nb8-as-card.is-done`, `.nb8-due.is-late` | portal states (advisor status, assignment done/late) | script.js |
| home9.css:5 (comment only) | `html.nb9-auth-page` | claimed to be added by script.js | **No code adds it** (grep of all JS, CSS and index.html: only the comment). Live page with sign-in open: `<html class="">` |

`:has()` use: scope.css:46-49 (4 selectors), er.css:360, 429-431. Without `:has()` support: scope.css hides nothing for those four; er.css loses the pull-to-refresh block and the nurse-mode scroll rule. scope.css isolates them in a separate rule so the main hide list still works.

## Breakpoints (list the media queries and note any gap or overlap between max-width and min-width pairs)

| File | Queries |
|---|---|
| resp.css | `max-width:1023px` (218), `max-width:640px` (228); `prefers-reduced-motion` no-preference (41, 87) and reduce (70) |
| er.css | `min-width:1024px` (164, 370, 399, 426), `max-width:1023.98px` (167, 278, 329, 341, 418), `max-width:1023.98px and max-height:520px` (201), same plus `min-width:600px` (208), `max-width:480px` (281), `max-width:640px` (356), `min-width:1024px and no-preference` (390); no-preference (69, 228) |
| scope.css | `min-width:900px` (59) |
| home9.css | `max-width:900px` (42), `max-width:480px` (43), `min-width:860px` (55), `max-width:859.98px` (67) |
| landing8.css | `min-width:1101px and max-width:1320px` (142), `max-width:1024px` (147), `900px` (151), `768px` (164), `520px` (167); reduce (174) |
| landing9.css | `max-width:900px` (81, 130), `max-width:480px` (88); no-preference (26) |
| academic8.css | `min-width:860px` (40), `max-width:640px` (304); reduce (314) |

Pair analysis:
- er.css pairs `min-width:1024px` with `max-width:1023.98px`: no gap and no overlap, including fractional widths.
- home9.css pairs `min-width:860px` with `max-width:859.98px`: no gap. Its `max-width:900px` and `480px` rules for `.h9-fields` are a separate series.
- resp.css uses `max-width:1023px` with no min-width pair; the desktop layout is the default. At fractional widths from 1023.01px to 1023.98px the resp tablet rules do not apply while er.css (a different view) already uses its phone layout there. This is a one-file inconsistency with er.css, not a conflict inside one view.
- scope.css `min-width:900px` has no paired max-width; below 900px the cascade default applies. landing9.css/home9.css use `max-width:900px` (applies at exactly 900px), so at exactly 900px scope.css (min) and home9.css `.h9-fields` (max) both match: different selectors, no conflict.
- academic8.css `min-width:860px` (sign-in side panel) uses the same threshold as home9.css `min-width:860px`; academic8 has no max pair (phone styles are the default).
- landing8.css `max-width:1024px` includes 1024px, where er.css `min-width:1024px` also matches. Different views, no conflict. landing8 has a bounded range (1101-1320px) for the header nav only.
- Threshold set across files: 480, 520, 600 (height-linked), 640, 768, 859.98/860, 900, 1023/1023.98/1024, 1101-1320. Nine different widths for three layout classes (phone, tablet, desktop). Not unified.
- Height-based query: er.css:201, 208 (`max-height:520px`, landscape phone).

## Problems (table)

| # | Severity | Finding | Evidence |
|---|---|---|---|
| 1 | high | landing8.css is dead: every `.l8-*` class (about, journey, stages, solve, cards, soon, node) has 0 matches in index.html and in all JS. Only the header-nav rule at 142-145 is live. ~170 of 177 lines apply to nothing | landing8.css; grep of `l8-about`, `l8-journey`, `l8-stages`, `l8-solve`, `l8-cards-3`, `l8-card`, `l8-soon`, `l8-node`: html 0 each; `l8-` in *.js: 0 |
| 2 | high | The respiratory room is unreachable from the UI: no UI element calls `nbOpenResp` (index.html, script.js, er.js, ui.js, motion.js, terms.js: 0 matches; defined at resp.js:885), `resp` is in `REMOVED_VIEWS` (script.js:1678), and `#home-resp-card` is `display:none !important` (home9.css:20) and `aria-hidden` and `er-locked` (index.html:728). resp.css (235 lines) styles a view that cannot be opened through the UI. A direct console call `nbOpenResp()` calls `navigateTo('resp')`, which redirects to home; whether `open()` then stops is not determined | resp.js:827-830, 885 |
| 3 | medium | scope.css rows 15-22 hide IDs and links that do not exist in the markup (`#sec-roles`, `#sec-specs`, `#sec-or`, `#sec-universities`, `#sec-level`, `#index-level-cta`, three header anchors, four sidebar anchors). The visibility decision is split between scope.css, script.js `REMOVED_VIEWS`, home9.css:20 and `.er-locked` markup | index.html:57-61, 204-208 |
| 4 | medium | Visibility is controlled by CSS only for features whose JS still runs: `renderLearnPath` and others keep toggling hidden elements (script.js:3990-4014, 2427, 2441-2442, 5326, 5386). Removing the CSS rule would bring the feature back, but the guard is not in one place | scope.css:31-49 |
| 5 | medium | `html.nb9-auth-page` is documented (home9.css:5) but never set; the phone and desktop sign-in rules do not depend on it. Stale comment, no functional effect found | grep of all css, js, html: 1 match, the comment |
| 6 | medium | Two files restyle the sign-in side panel: academic8.css:39 `#auth-modal .nb8-auth-side { display:none !important }` and home9.css `html #auth-modal .nb8-auth-side` at min-width 860px. academic8 loads later but home9 wins by specificity (extra `html` type selector). Running page at 1440px: `.nb8-auth-side` computed display is `flex`, columns `754px 686px` (home9's 1.1fr/1fr, not academic8's 5fr/6fr). Result depends on specificity, not on order | probe on http://127.0.0.1:5180/ with the sign-in page opened; home9.css:55-62, academic8.css:39-44 |
| 7 | medium | Global `!important` and ID-prefixed overrides: 131 `!important` lines over the seven files. Re-hosting with new markup or a CSS reset will change winners | counts above |
| 8 | low | Unscoped class prefixes (`.rs-`, `.er-`, `.nb8-`, `.h9-`) are the only isolation; `.er-rooms`, `.er-room-card`, `.er-lock-tag` are defined in er.css but used on the home view (er.css:160s; home9.css:20) | er.css, index.html:722-728 |
| 9 | low | Breakpoints are not unified (nine thresholds), and resp.css `1023px` differs from er.css `1023.98px` | Breakpoints section |
| 10 | low | One relative `url()` (img/v9/login2.jpg) depends on the CSS file location; home9.css:68 `url()` was not fully read | home9.css:59, 68 |

## Open questions

1. Is the respiratory room meant to return? If so, which control opens it (the card at index.html:728 is locked)? If not, resp.css and resp.js are removable.
2. Is landing8.css intended to be removed, or were the `.l8-*` sections deleted by the landing v9 rewrite without removing the CSS? Only the header-nav rule at landing8.css:142-145 is live.
3. Does `open()` in resp.js stop when `navigateTo('resp')` redirects home? `navigateTo` returns `true` at its end (script.js, `return true` in the 1948-2010 range); a `false` return seen at one early path (line 11 of the range) is not tied to `REMOVED_VIEWS`. Not determined.
4. Are `.v7-item[onclick*="app-nav-cases"]` items (scope.css:26) ever created dynamically? None in index.html.
5. What is the target for the url() on home9.css:68? Not determined.
6. In the ASP.NET re-host, will the hide-list in scope.css become server-side feature flags, or stay as CSS? The rows marked dormant still have live JS writing into them.
