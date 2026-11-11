# index.html:414–1116 — signed-in home, observe, nurse, specialty simulation and debrief views

Scope: index.html lines 414–1116, read in full. Line 413 is blank; line 1117 is the first line after the range (inside the VIEW 4 comment header that starts at 1111, see Open questions). Method: static reading plus greps over `*.js`, `index.html` and the CSS files. No page probe was needed (0 probes).

## Structure

| Lines | Element (id / class) | Role | Notes |
|---|---|---|---|
| 414 | `<section id="view-home" class="hidden max-w-6xl ...">` | home view, opens | closes at 784 |
| 416–433 | `div.v7-welcome` (`home-welcome-role`, `home-demo-indicator`, `home-welcome-name`, `home-welcome-sub`, `home-quick-er-btn`, `home-quick-profile-btn`, `home-quick-uni-btn`, `img/welcome.jpg`) | welcome card | |
| 435 | `#home-skip-note` | "you skipped the level test" note, button `#skip-take-btn` | hidden by class and scope.css |
| 437–441 | `#home-learn` (`home-track-chip`, `learn-sub`, `learn-steps`) | learning path card | hidden by class and scope.css |
| 443–460 | `#home-path` (`path-donut`, `path-donut-txt`, `path-level`, `path-level-src`, `path-hist`, `path-k1..k3`, `path-retake`, `osce-toggle`, `path-retake-note`, `path-tip`, `path-rooms`) | level, KPIs, recommended rooms | two `.nb-path-card`; second card hidden by scope.css |
| 462–474 | `#home-nurse` (`home-or`, `or-cards`, `nurse-filter`, `nurse-cards`) | nursing cases and operating-room cards | hidden by class and scope.css |
| 476–601 | `#home-professor-section` | professor dashboard on home | sub-blocks: header + 3 buttons (490–498), `nav.nb8-quick` with 5 `data-nb8-go` buttons (503–509), 4 KPI tiles (512–533), `#home-prof-reports-pane` table (536–558), `#home-prof-create-pane` form (561–600, 5 inputs, 1 select, `#home-doc-save-case-btn`) |
| 603–611 | `#nb8-guide` (`nb8-guide-track`, `-title`, `-intro`, `-steps`) | "what will you do now?" card | filled by `nb8RenderGuide` |
| 613–631 | `#home-er-card` (`launch-er-random-btn`) | emergency room entry + 3 steps | |
| 633–702 | `#home-student-uni-section` (`home-student-uni-badge`, `home-student-open-uni-btn`, `nb8-home-stu-uni`, `.nb8-legacy` with 3 static cards 654–701) | student university assignments | |
| 704–720 | `#home-fields9` (`h9-fields-title`, `ul.h9-fields` with 8 `li`, 711–718) | specialty photo cards, only Emergency open | |
| 722–725 | `div.er-rooms` | strip of 5 locked rooms | hidden by home9.css:20 |
| 727–735 | `#home-resp-card.rs-home.er-locked` | respiratory room teaser | hidden by home9.css:20 |
| 737–773 | `#home-cases-anchor` (`dept-filter-bar`, `filtered-cases-count`, `case-filter2`, `cases-cards-grid`, `cases-empty-state`, `reset-dept-filter-btn`) | cases by specialty | hidden by scope.css:32 |
| 775–782 | `#home-coach-banner` (`open-coach-view-btn`) | coach banner | hidden by scope.css:40 |
| 784 | `</section>` | | |
| 786–792 | HTML comment "VIEW 2" | | |
| 793–799 | `<section id="view-observe">` (`obs-badge`, `obs-title`, `obs-sub`, `obs-exit`, `obs-stream`, `obs-why`, `obs-prog`, `obs-auto`, `obs-next`, `obs-check`) | expert observation | dormant |
| 801–804 | `<section id="view-nurse">` (`nurse-badge`, `nurse-title`, `nurse-sub`, `nurse-exit`, `nurse-body`) | nursing case | dormant |
| 806–947 | `<section id="view-sim">` | specialty simulation | dormant. Chat column 812–848 (`sim-osce-bar`, `sim-level-hint`, `sim-chat-messages`, `sim-suggestions-bar`, `sim-suggested-questions`, `sim-voice-btn`, `sim-chat-input`, `sim-send-btn`, quick vitals button 837, `toggle-sim-tools-btn`, `open-handover-modal-btn`); backdrop 850; tools aside 851–944 (`side-tab-vitals`, `side-tab-workup`, `close-sim-tools-mobile`, ECG svg, `sim-v-hr/-bp/-spo2/-temp`, `sim-vitals-note`, `nurse-scratchpad`, `workup-category-tabs`, `dynamic-workup-buttons`, `dynamic-workup-viewer`) |
| 953–1109 | `<section id="view-debrief">` | report | empty state 956–972 (`debrief-empty-state`, `empty-debrief-go-home`, `empty-debrief-go-er`); report 975–1108 (`debrief-report-content`, `rep-*` ids, 4 tables with `tbody#rep-competency-tbody`, `-inquiry-`, `-workup-`, `-handover-`; `rep-compare`; buttons `rep-retry-btn`, `rep-go-profile-btn`, `rep-back-home-btn`) |
| 1111–1116 | comment header of VIEW 4 (coach) | belongs to the next block | |

## Which script owns what

All writers below are in `script.js` unless stated. Wiring is done with `getElementById(...).addEventListener` in the init block (about lines 6620–6900); the only inline handlers are listed in the next section.

| Id / group | Owner (reads or writes) | Evidence |
|---|---|---|
| `view-*` visibility | `showOnlySection` toggles `hidden` on 11 views; `navigateTo` | 2010–2013 |
| `view-sim`, `view-observe`, `view-nurse` | blocked by `REMOVED_VIEWS` | 1678, 1949 |
| `view-debrief` | `navigateTo` chooses empty state or report; first asks `window.nbErReport()` (er.js:4697) | 1977–1989 |
| `home-professor-section`, `home-student-uni-section` | `hidden` toggled by role (`isProf`, `isStudent`) | 1934–1938 |
| `home-welcome-sub`, `home-track-chip`, `home-er-card`, `home-cases-anchor`, `home-nurse`, `nb8-guide` | `renderTrackHome` (shows er-card, hides cases and nurse, sets welcome text, calls `nb8RenderGuide`) | 4009–4023 |
| `home-path`, `path-*`, `osce-toggle`, `home-skip-note` | `renderHomePath` (reads `home-path` at 2408; skip note 2436; retake note 2441; osce checkbox 2442); listeners 2627–2629 (`skip-take-btn`, `path-retake`, `osce-toggle` change stores `nabd_osce`) | |
| `home-learn`, `learn-steps` | learning-path renderer | 3990 |
| `nurse-cards`, `nurse-filter`, `or-cards` | written only by code after the early `return;` at 4024 and by `nbRenderOr` (4045), whose only caller is 4042 (also after the return) | see Problems |
| `prof-invite`, `prof-invite-copy` | 2639 and role code | |
| `home-prof-cohort-tbody`, `home-prof-kpi-*`, `home-prof-attempts` | `renderProfessorCohortTables` and `nb8RenderAcademic` (comment in html says KPIs computed in script.js) | not traced line by line |
| `nb8-home-stu-uni` | `nb8RenderStudentUni` (per html comment 650) | |
| `data-nb8-go` buttons | delegated click handler: `navigateTo('university')` then `nb8SetProfTab` | 6471–6475 |
| `home-quick-er-btn` | `launchRandomER` (6671+); `launch-er-random-btn` also uses it and calls `window.nbOpenER()` | 6619–6625 |
| `home-quick-profile-btn`, `home-quick-uni-btn`, `home-student-open-uni-btn`, `home-prof-open-full-uni-btn` | `navigateTo('profile'/'university')` | 6671–6675 |
| `dept-filter-bar`, `case-filter2`, `cases-cards-grid`, `reset-dept-filter-btn` | case grid renderer and listener | 6693 |
| `obs-*` | observe module | 3470–3545 (`obsStart` returns at once, 3474) |
| `nurse-*` | nurse module | 3887–3985 (`nurseStart` returns at once, 3888) |
| `sim-*`, `side-*`, `workup-*`, `dynamic-workup-*`, `nurse-scratchpad`, `open-handover-modal-btn` | simulation module; tabs 4587, 6716–6733, voice 6775, handover 6813 | |
| `sim-osce-bar` | classes `on` added or removed | 2501, 2512 |
| `rep-*`, `debrief-*` | report renderer and listeners | 2548, 5303, 6631, 6828–6830 |
| `.uni-start-case-btn` (legacy cards) | listener calls `startSimulationSession(id,false,true)` | 6894–6896 |
| `sim-chat-messages` | also referenced in terms.js (1 hit) | |
| `view-home`, `view-nurse`, `view-debrief` | motion.js (selectors, e.g. 49, 172) | |
| `home-resp-card`, `home-fields9`, `er-rooms`, `home-or`, `home-coach-banner`, `home-er-card` order | no script reference; CSS only (home9.css, resp.css, theme.css, scope.css); `home-er-card` read by script 4012 | |

## Inline code

No inline `<script>`, `<style>` or `<link>` exists in 414–1116.

Inline event handlers:

| Line | Element | Handler | Global / target |
|---|---|---|---|
| 432 | welcome `img` | `onerror="nbImgFail(this)"` | `nbImgFail`, script.js:3442 |
| 711 | `button.h9-open` | `onclick="document.getElementById('launch-er-random-btn').click()"` | clicks #launch-er-random-btn |
| 711–718 | 8 `img` | `onerror="nbImgFail(this)"` | `nbImgFail` |
| 837 | quick vitals button | `onclick="document.getElementById('sim-measure-vitals-btn').click()"` | clicks #sim-measure-vitals-btn (line 878) |

Inline `style` attributes that carry layout or colour (full list):

| Line | Value (shortened) | Purpose |
|---|---|---|
| 438 | `display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap;align-items:center`; `margin:0`; `margin-right:.4rem` | header row of learn card |
| 439 | `font-size:.82rem;color:#425D69;margin:.3rem 0 .8rem` | |
| 446 | `display:flex;gap:1rem;align-items:center` | donut row |
| 448 | font-size and colours `#A3B3BA`, `#FFFFFF` (3 elements) | level text |
| 454 | `font-size:.7rem;color:#A3B3BA;margin-top:.4rem` | |
| 457 | flex row style; `h2` margin; `#path-tip` pill (colour `#193B4A`, bg `#E6F2F4`, border `#DCE7EB`, radius, padding) | |
| 470 | `margin:0 0 .3rem` | |
| 483 | `color:#1A3643;font-weight:700` on copy button | |
| 794, 802 | `margin:.4rem 0 .2rem`; `margin:0;font-size:.85rem;color:#425D69` | view headers |
| 796 | `margin:0 0 .4rem`; `font-size:.84rem;line-height:1.95;color:#1F3D4A` | |
| 797 | `flex:1;margin:0`; `width:auto;padding:.7rem 1.4rem` | observe controls |
| 850 | `z-index: 45;` | backdrop (also class `z-45`) |
| 851 | `z-index: 48;` | tools aside (also class `z-48`) |
| 1096 | `font-size:.84rem;line-height:1.9` | `#rep-compare` |

Inline SVG: donut 447, ECG 884–886 (class `ecg-animated`), icons at 616, 730, 778, 831, 841, 958.

## External resources

| Resource | URL | Line |
|---|---|---|
| Welcome photo | `img/welcome.jpg` (local, lazy) | 432 |
| Specialty photos | `img/v9/sp-er.jpg` 711, `sp-cardio.jpg` 712, `sp-resp.jpg` 713, `sp-diabetes.jpg` 714, `sp-sepsis.jpg` 715, `sp-surgery.jpg` 716, `sp-obgyn.jpg` 717, `sp-peds.jpg` 718 | as listed |

No CDN, font, or absolute URL in this range. All `src` values are relative, so under MVC they need `~/img/...` (or `Url.Content`) if the page is served from a nested route. Images are also created by script (`nbImg`, 3441; case photos, 4199): not in this range.

## Text that needs care in Razor

| Item | Result |
|---|---|
| `@` characters in 414–1116 | none found (`grep -n '@'` on the range returned nothing), including no `@media`, `@keyframes` or e-mail address |
| Inline `<style>` | none, so no `@media` problem here (style.css holds `@media`, not in scope) |
| Braces | no `{`/`}` in text content other than inside attribute `style` values and SVG; Razor only cares after `@` |
| Arabic text with `«` `»` | plain characters, safe; keep the file UTF-8 |
| HTML comments | 416, 426, 443, 476, 502, 511, 535, 560, 603, 613, 619, 633–634, 650, 653, 685, 704, 727, 737, 744, 758, 775, 786–792, 808, 811, 816, 821, 828, 853, 870, 912, 922, 955, 974, 977, 982, 1008, 1032, 1054, 1075, 1111–1116 are developer notes; they reach the client today. Comments `<!-- Populated by JS -->` (554, 747, 760, 819, 824, 937, 1026, 1048, 1069, 1090) sit inside otherwise empty containers: dropping them changes the DOM only by a comment node. None is read by script. Keep all if "rendered HTML must stay the same" is taken literally; otherwise they may be dropped (use `@* *@` for notes that should not render) |
| Whitespace | `#home-quick-*` and tag inner text contain newlines (e.g. 490–492); `white-space` is not preserved for inline-block buttons, so reformatting is low risk but not zero |
| Line 837 | `id=" toggle-sim-tools-btn-quick"` starts with a space; must be copied byte for byte if the HTML has to stay identical |

## Accessibility and RTL notes

- RTL comes from the document root (outside this range, not checked). Inline styles here use physical `margin-right` (438) and Tailwind `border-x`, `left-0` (851) next to logical properties in CSS (`padding-inline-end` in academic8.css:106): a mix.
- `aria-live="polite"` on `#sim-chat-messages` (817) and `#filtered-cases-count` (749); `role="timer"` on `#sim-osce-bar` (814); `role="tablist"` on `#dept-filter-bar` (746) with no `role="tab"` children in markup (children are generated by JS; not checked).
- `aria-label` on the aside 851, close button 863, ECG svg 884, quick nav 503, locked-rooms strip 722. Decorative SVGs carry `aria-hidden="true"` (447, 616, 730, 778); the SVGs at 831, 841, 958 do not.
- `alt` is empty on the 8 specialty images (711–718): decorative by intent, with `aria-label` only on the ER open button (711).
- `#home-resp-card` has `aria-hidden="true"` and is also removed by `display:none`.
- `toggle-sim-tools-btn` has `aria-expanded="true"` as static markup (840); script.js updates it (2 references).
- Labels: the 5 professor form fields have `for`/`id` pairs (568–591). `#sim-chat-input` and `#sim-voice-btn` rely on placeholder and `aria-label` (830); input label not seen in cut text (not determined).
- Digits use class `font-num`; `dir="ltr"` only on the `°C` span (903).
- Several buttons lack `type` (768, 856, 859, 863, 878, 930–933, 965, 968, 1099–1103): harmless outside a form, but they are not inside a form here.

## Features and reachability

| Block | Class | Evidence |
|---|---|---|
| Welcome card, role line, demo badge, quick buttons | live | script writes `home-welcome-sub` (4017–4021); `home-quick-er-btn` is `display:none` on desktop (theme.css:640) and shown on phones (theme.css:642) |
| `#home-er-card`, `launch-er-random-btn` | live | shown by `renderTrackHome` (4012); click calls `nbOpenER` (6619–6625) |
| `#nb8-guide` | live | filled by `nb8RenderGuide` (4021); `#nb8-guide-intro` hidden by home9.css:22 |
| `#home-fields9` | live | no hide rule; order 4 (home9.css:14); Emergency card clicks the ER button, 7 others are static "soon" tags |
| `#home-path` dark card (donut, level, KPIs) | live | `renderHomePath` (2408); `path-k2` tile hidden by scope.css:46; `osce-toggle` label hidden by scope.css:48 (`label.nb-switch:has(#osce-toggle)`) |
| `#home-path` second card (`path-rooms`, `path-tip`), `#path-retake`, `#path-retake-note` | dormant | hidden by scope.css:33 (`!important`); script still writes them |
| `#home-skip-note`, `#home-learn` | dormant | scope.css:31 |
| `#home-nurse` (`or-cards`, `nurse-cards`) | dormant | scope.css:31, and `renderTrackHome` adds `hidden` (4012); the code that fills it is after `return;` at 4024 |
| `#home-cases-anchor` and its filters/grid | dormant | scope.css:32; `renderTrackHome` adds `hidden` (4012). Filter scripts bound at 6693 |
| `#home-coach-banner`, `open-coach-view-btn` | dormant | scope.css:40; `coach` is also in `REMOVED_VIEWS` (1678) |
| `#home-professor-section` | live (professor role) | toggled 1934–1935; scope.css:30 comment says it is shown again |
| `#home-student-uni-section` live part (`nb8-home-stu-uni`, open button) | live (student role) | 1937–1938 |
| `.nb8-legacy` 3 static cards (654–701) | dormant | `display:none !important` academic8.css:268; their buttons call `startSimulationSession` which redirects to home (4266) |
| `.er-rooms` (722–725), `#home-resp-card` (727–735) | dormant | `display:none !important` home9.css:20; resp card also `er-locked` (pointer-events:none, er.css:155) and `aria-hidden` |
| `#view-observe` (793–799) | dormant | `observe` in `REMOVED_VIEWS` (1678); `obsStart` returns at once (3474) |
| `#view-nurse` (801–804) | dormant | `nurse` in `REMOVED_VIEWS`; `nurseStart` returns at once (3888) |
| `#view-sim` (806–947) | dormant | `sim` in `REMOVED_VIEWS`; `startSimulationSession(.., false, true)` redirects home (4266); `navigateTo('sim')` at 4377 is therefore also redirected. Listeners still bind to its ids (6716–6813) |
| `#view-debrief` empty state and report | live | side-nav item `data-side-app="debrief"` (index.html:226); `navigateTo('debrief')` (1977); report path first tries `window.nbErReport()` (er.js:4697); script.js report path needs `hasCompletedSessionInRun && simState.sessionCompleted && simState.sbarSubmitted`, which needs the closed simulation (not determined whether any live path sets them) |

Searches run for reachability: ids via `grep -c` over `*.js` and index.html for 48 ids; `REMOVED_VIEWS`, `navigateTo('sim'|'debrief'|'observe'|'nurse')`, `obsStart`, `nurseStart`, `nbRenderOr`, `toggle-sim-tools-btn-quick` (only index.html:837, nothing in scripts); CSS greps of scope.css, home9.css, academic8.css, theme.css, er.css, resp.css.

## Problems

| # | Severity | Problem | Evidence |
|---|---|---|---|
| 1 | high | About 400 of 700 lines (observe, nurse, sim, nurse home, cases, coach banner, legacy cards) are dormant but are still wired by script.js; deleting them in the refactor would break `getElementById(..)?.` calls silently or throw where no `?.` is used (e.g. 3479 `obs-badge`, 3482 `obs-stream`, 2408) | scope.css header comment; 1678 |
| 2 | high | Dead code after `return;` in `renderTrackHome` fills `nurse-cards`, `nurse-filter`, `or-cards` (4024–4046); `nbRenderOr` has one caller, also dead | 4024, 4042, 4045 |
| 3 | high | Visual order is not DOM order: home9.css sets `order` on `#view-home` children (welcome 1, professor 2, ER card 3, fields 4, student uni 5, path 6, guide 7, rest 9). Partial order must follow the DOM, not the screen | home9.css:8–17 |
| 4 | medium | Visibility is decided by `!important` CSS (scope.css, home9.css, academic8.css) overriding `hidden` toggles by script; a block can look removed while script toggles its class | scope.css header |
| 5 | medium | `id=" toggle-sim-tools-btn-quick"` contains a space (invalid id); no script references it (greps found only index.html:837) | 837 |
| 6 | medium | Inline `onclick` handlers couple one button to another by id (`launch-er-random-btn`, `sim-measure-vitals-btn`) | 711, 837 |
| 7 | medium | Hard-coded demo content in markup: "7 طلاب نشطين", "(7)", "7 محاولات", "عرض 6 حالات", `NUR-402 / MED-410`, a named professor, a student name and "91%" in the legacy cards, default values of the session-creator inputs | 491, 515, 539, 482, 663, 692, 750, 569–592 |
| 8 | medium | Markup for all roles is sent to every user and hidden by script (professor form, student uni, nurse home) | 476–601, 635–702 |
| 9 | low | Hard-coded colours in inline styles (`#425D69`, `#A3B3BA`, `#1A3643`, `#193B4A`, `#E6F2F4`, `#DCE7EB`, `#1F3D4A`) bypass the CSS variables used elsewhere (`--ink`, `--signal`) | table in Inline code |
| 10 | low | Tailwind utility classes (`bg-teal-700`, `z-45` etc.) mixed with custom classes; `z-index` set both by class and inline | 850–851 |

## Proposed Razor split

Cuts fall only between sibling elements (or comments). Concatenating the rows in order gives back lines 414–1116 unchanged. The `<section>` wrappers of `view-home` stay in the parent view so that no partial has an unbalanced tag; the other four views are one partial each (section included).

| Order | Partial / file | From–to | What it holds |
|---|---|---|---|
| 1 | `Home.cshtml` (parent, part 1) | 414–415 | `<section id="view-home" ...>` open tag and blank line |
| 2 | `_HomeWelcome.cshtml` | 416–434 | welcome card (+ blank line 434) |
| 3 | `_HomeLearnPath.cshtml` | 435–442 | skip note, learning path card (both dormant) |
| 4 | `_HomeTrainingPath.cshtml` | 443–461 | `#home-path` level and rooms cards |
| 5 | `_HomeNurse.cshtml` | 462–475 | `#home-nurse` (dormant) |
| 6 | `_HomeProfessor.cshtml` | 476–602 | professor dashboard (KPIs, reports table, session creator) |
| 7 | `_HomeGuide.cshtml` | 603–612 | `#nb8-guide` |
| 8 | `_HomeErCard.cshtml` | 613–632 | `#home-er-card` |
| 9 | `_HomeStudentUni.cshtml` | 633–703 | `#home-student-uni-section` incl. dormant legacy cards |
| 10 | `_HomeFields.cshtml` | 704–721 | `#home-fields9` photo cards (uses `Url.Content` for images) |
| 11 | `_HomeLockedRooms.cshtml` | 722–736 | `.er-rooms` strip and `#home-resp-card` (both display:none) |
| 12 | `_HomeCases.cshtml` | 737–774 | `#home-cases-anchor` |
| 13 | `_HomeCoachBanner.cshtml` | 775–783 | `#home-coach-banner` |
| 14 | `Home.cshtml` (parent, part 2) | 784–785 | `</section>` of view-home and blank line |
| 15 | `_ObserveView.cshtml` | 786–800 | comment VIEW 2 + `#view-observe` |
| 16 | `_NurseView.cshtml` | 801–805 | `#view-nurse` |
| 17 | `_SimView.cshtml` | 806–948 | `#view-sim` (may later be cut into chat column 812–848 and tools aside 850–944) |
| 18 | `_DebriefView.cshtml` | 949–1110 | comment VIEW 3 + `#view-debrief` + blank line 1110 |
| 19 | `_CoachViewHeader` comment (belongs to next area's `_CoachView.cshtml`) | 1111–1116 | comment block of VIEW 4; assign to the partial that starts at 1117 (or drop) |

The partials are plain markup with no model; a role-based `@if` would change the rendered HTML (the blocks are hidden by script today), so none is proposed.

## Open questions

1. Must the rendered HTML stay byte-identical (comments, the space in id at 837, blank lines), or only DOM-equivalent?
2. Should dormant views (observe, nurse, sim) and the dead nurse-home code be kept in the Razor output, given script.js still writes into them?
3. Does any live path set `simState.sessionCompleted` and `simState.sbarSubmitted` (needed by the non-ER debrief report)? Not determined; only `window.nbErReport` was seen as the live route.
4. Where do the lines 1111–1116 (VIEW 4 comment) go: this area's report ends at 1116, but the comment belongs to `view-coach` that starts at 1117.
5. Are the professor KPI numbers (515, 539, 491) always overwritten by `renderProfessorCohortTables`/`nb8RenderAcademic` before display? Not traced line by line.
6. Do image paths stay relative to the site root under MVC routes (`img/...` at 432, 711–718)?
