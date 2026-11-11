# index.html:1888–2318 — modals (handover, level, sign-in/registration, student attempt), footer and script tags

Source: `C:/Users/ss/nabd-refactor/index.html`, lines 1888–2318 (CRLF). Read in full with long lines cut; the cut tails of lines 1932, 1937, 1962, 2072, 2121, 2123, 2149, 2194, 2307 were printed separately. Ownership found by grepping `script.js er.js resp.js ui.js motion.js terms.js` and the CSS files.

## Structure

| Lines | Block | Id / selector | Notes |
|---|---|---|---|
| 1888 | `</main>` | – | Closes the `<main>` opened before this range. Belongs to the layout. |
| 1890–1952 | Modal 1: SBAR handover | `#handover-modal` (1893) | `role=dialog`, `aria-modal`, `aria-labelledby=handover-modal-title`, classes `hidden … items-center`, inline `z-index:85` |
| 1896–1902 | header | `#handover-modal-title` 1899, `#close-handover-modal-btn` 1901 | |
| 1905–1940 | body | `#handover-modal-body`; `#handover-recipient` 1914 (select, 2 options), `#copy-scratchpad-to-sbar-btn` 1910, `#handover-diagnosis-input` 1921, `#handover-extra-workups-box` 1924 (class `hidden`) + `#handover-extra-workups-list` 1927, `#handover-summary-input` 1932, `#handover-action-input` 1937 | |
| 1943–1950 | footer | `#cancel-handover-btn` 1944, `#confirm-handover-submit-btn` 1947 | |
| 1954–1958 | HTML comment "MODAL 2: AUTHENTICATION" | – | Sits above the level modal, not above the auth modal (see Problems). |
| 1960–1965 | Level quiz modal | `#level-modal` (1960) | no `aria-labelledby`; inline `z-index:85;background:rgba(25,59,74,.55)`; contains `.nb-quiz` (1961, inline max-width/width/max-height/overflow), `aside` with `#level-aside-title` 1962, `#level-aside-text` 1962, `#level-modal-close` 1962; main host `#nb-quiz-modal-main` 1963 (empty, filled by script) |
| 1967–2088 | Auth modal | `#auth-modal` (1967) | `aria-labelledby=auth-modal-title` |
| 1970–1985 | brand side panel | `aside.nb-auth-side.nb8-auth-side` `aria-hidden=true` | static text and two inline SVGs |
| 1986–1991 | brand row | `#close-auth-modal-btn` 1990 | |
| 1993 | title | `#auth-modal-title` (`tabindex=-1`) | text switched by script |
| 1996–2019 | login pane | `form#auth-pane-login`; `#login-email` 1998, `#login-pass` 2001, `#login-error-msg` 2003 (role=alert, hidden), `#submit-login-btn` 2004, `#auth-tab-register` 2005; demo group 2008–2018 with three `button[data-demo-login]` (rana, med_student, doctor) | only `<form>` in this range |
| 2022–2083 | register pane (2 steps) | `#auth-pane-register` (hidden) | steps `#reg-step-1` 2029, `#reg-step-2` 2055; dots `#reg-dot-1/2`, `#reg-bar` 2023–2026 |
| 2030–2052 | step 1 | `#reg-name`, `#reg-email`, `#reg-pass`, role cards `#reg-rolecards` 2041 (`[data-rc]` nursing/medicine/supervisor), hidden `#reg-role` 2046, `#reg-error-msg` 2051, `#reg-next-btn` 2052 | |
| 2055–2081 | step 2 | `#reg-track-chip` 2056, hidden-label `#reg-specialty` 2058, `#reg-year-wrap`/`#reg-year` 2063–2064, `#reg-code-wrap`/`#reg-code` 2072, `#reg-uni` 2074, `#reg-submit-error` 2076, `#reg-back-btn` 2078, `#submit-register-btn` 2079 | |
| 2082 | switch link | `#auth-tab-login` | |
| 2085 | about text `p.nb-auth-about` | – | |
| 2091–2128 | Modal 3: image lightbox | `#medical-image-lightbox` (2097) | `aria-labelledby=lightbox-title`; inline `z-index:90` |
| 2105–2111 | toolbar | `#zoom-out-btn`, `#zoom-level-badge` 2106, `#zoom-in-btn`, `#zoom-200-btn`, `#zoom-300-btn`, `#zoom-reset-btn`, `#close-lightbox-btn` 2111 | |
| 2116–2118 | stage | `#lightbox-stage`, `#lightbox-img` (`src=""`) | |
| 2121–2125 | note row | `#lightbox-tech-meta`, `#lightbox-quick-note`, `#lightbox-save-note-btn` | |
| 2130–2256 | Modal 4: student attempt detail | `#student-attempt-detail-modal` (2139) | `aria-labelledby=stu-modal-title`; inline `z-index:85` |
| 2144–2151 | header | `#stu-modal-role-badge`, `#stu-modal-pub-badge`, `#stu-modal-title`, `#stu-modal-subtitle`, comment box `#stu-comment-box` 2149 (`#stu-comment-input`, `#stu-comment-save`, `#stu-comment-status`, `#stu-comment-last`), `#close-stu-modal-btn` 2151 | 2149 is a single line with many inline styles |
| 2155–2168 | summary strip | `#stu-modal-diagnosis`, `#stu-modal-workup-summary`, `#stu-modal-score` | |
| 2171–2189 | inquiry table | `#stu-modal-inq-count`, `#stu-modal-inquiry-tbody` | 4 columns |
| 2192–2210 | workup table | `#stu-modal-workup-tbody` | 4 columns |
| 2213–2226 | scratchpad + SBAR | `#stu-modal-scratchpad`, `#stu-modal-sbar-sb`, `#stu-modal-sbar-ar` | |
| 2229–2238 | strengths/weaknesses | `#stu-modal-strengths`, `#stu-modal-weaknesses` | |
| 2241–2254 | note + publish | `#stu-modal-prof-note` 2244, `#stu-modal-toggle-pub-btn` 2247, `#stu-modal-close-bottom-btn` 2250 | |
| 2258–2309 | Footer | `footer#site-footer` (2261) | |
| 2272–2282 | guest links | `#footer-guest-links` | 5 `<a href="#sec-…">` |
| 2284–2293 | app links | `#footer-app-links` (class `hidden`) | 5 buttons |
| 2295–2302 | model-nature list | – | static text |
| 2304–2308 | copyright + credits | `details.v7-credits` x2; `#nb-credits` 2306 (empty, filled by script); data-credits text 2307 | |
| 2311–2316 | Script tags | `script.js`, `motion.js`, `terms.js`, `ui.js`, `resp.js`, `er.js` | all `defer`, relative src, no version query |
| 2317–2318 | `</body></html>` | – | layout |

## Which script owns what

| Id / selector | Script and line | Action |
|---|---|---|
| `#handover-modal` | script.js 5009 (open), 5041 (close) | toggles `hidden`/`flex` |
| `#open-handover-modal-btn` (in index.html 844, not this range) | script.js 6813 | click opens; 6814 `#close-handover-modal-btn` closes |
| `#handover-diagnosis-input`, `-summary-input`, `-action-input` | script.js 4300–4304 | read/write |
| `#handover-recipient` | script.js 5054 | value read into `simState.submittedRecipient` |
| `#handover-extra-workups-box/-list` | script.js 5014–5015 | filled and shown only when extra workups exist |
| `#level-modal`, `#nb-quiz-modal-main`, `#level-aside-*`, `#level-modal-close` | script.js 2557–2570 (`nbOpenLevelModal`, close), 2617 (close handler), 2564 (host name) | `nbQHost='nb-quiz-modal-main'`; close label changed at 2560 |
| `#auth-modal`, `#login-error-msg`, `#reg-error-msg` | script.js 2076–2114 (open/close), 6954 | |
| `#auth-modal-title` | script.js 2107 (focus target), 4087 (text) | |
| `#auth-pane-login` / `#auth-pane-register` | script.js 4085–4086 (toggle `hidden`), 6991 (login `submit` listener) | |
| `#close-auth-modal-btn`, `#auth-tab-login/-register` | script.js 6950, 6961, 6962 | |
| `[data-demo-login]` | script.js 6603–6604 | click calls `nbDemoLogin(dataset.demoLogin)` |
| `#reg-rolecards [data-rc]` | script.js 2386, 2393, 2398 | `nbSetRegRole`; sets `is-on`, `aria-pressed` |
| `#reg-track-chip`, `#reg-code-wrap`, `#reg-year-wrap` | script.js 2387, 2394, 6986–6987 | shown/hidden by role |
| `#reg-next-btn`, `#reg-back-btn` | script.js 6964, 6982 (`setRegStep`) | |
| `#medical-image-lightbox`, `#lightbox-img`, `#lightbox-quick-note` | script.js 4977–4999 (`openMedicalLightbox`) | callers: 4678, 4682 (sim workup cards) and 5652 (student attempt modal) |
| `#zoom-*-btn` | script.js 6792–6794 and following | `applyLightboxZoom` |
| `#student-attempt-detail-modal` | script.js 5670 (open), 5676 (close); opener `openStudentAttemptDetailModal` 5595; callers 5589, 6496, 6913 | |
| `#stu-modal-inquiry-tbody` | script.js 5618 | |
| `#stu-modal-prof-note` | script.js 5668 | value set |
| `#stu-modal-toggle-pub-btn` | script.js 6527 and 6905 | two `addEventListener('click')` on the same button |
| `#stu-modal-close-bottom-btn` | script.js 6904 | |
| `#stu-comment-save/-input/-status/-last` | script.js 2610–2613, 2630–2636 | professor note to student |
| `#site-footer` | script.js 2015–2016 | hidden when `viewId` is sim, nurse, observe, resp or er |
| `#footer-guest-links`, `#footer-app-links` | script.js 1860–1861 (auth toggle) | |
| `#foot-er-btn` | script.js 6630 | click runs `launchRandomER` (defined 6620) |
| `.foot-app-link[data-foot-app]` | script.js 7109–7110 | `navigateTo(attr)` |
| `#nb-credits` | script.js 6947 | `innerHTML` built from `NB_IMG` (Wikimedia links) |
| `window.nbOpenER` | er.js 4695 | called by inline onclick 2289 |
| `window.nbImgFail` | index.html line 30 (outside range) | stub until script.js |
| motion.js, terms.js, ui.js, resp.js | no id from this range found in the greps | not determined for other hooks (selectors, not ids) |

## Inline code

| Kind | Line | Detail |
|---|---|---|
| inline `<script>` | none in range | |
| inline `on*` handler | 2289 | `onclick="nbOpenER()"` (global from er.js 4695). Only inline handler in the range. |
| inline `style` carrying layout/stacking | 1893, 2139, 2097 | `z-index: 85` / `85` / `90` (classes `z-85`, `z-90` also present) |
| | 1960 | `z-index:85;background:rgba(25, 59, 74, 0.55)` |
| | 1961 | `max-width:56rem;width:100%;max-height:92vh;overflow:auto` |
| | 1962 | on the close button: `align-self:flex-start;margin-top:auto` |
| | 1996, 2022 | `margin-top:1.1rem` |
| | 2003, 2051, 2076 | `margin-bottom:.8rem` |
| | 2024 | `style=""` (empty) |
| | 2040 | `margin-bottom:.4rem` |
| | 2072 | `direction:ltr;text-align:right` on `#reg-code` |
| | 2077 | `display:flex;gap:.6rem` |
| | 2079 | `flex:1` |
| | 2149 | label (font-size/weight/color `#193B4A`), flex row, save button (width/padding/font-size), status span (color `#0A562F`), last-note div (`#425D69`) |
| | 2306, 2307 | `margin-top:.4rem` |
| `data-*` hooks | 2014–2016 `data-demo-login`; 2042–2044 `data-rc`; 2287, 2290, 2291 `data-foot-app` | read by script.js, see above |

## External resources

| Resource | URL | Line |
|---|---|---|
| Scripts | `script.js`, `motion.js`, `terms.js`, `ui.js`, `resp.js`, `er.js` (relative, `defer`) | 2311–2316 |
| Dataset link | https://figshare.com/articles/dataset/DDXPlus_Dataset/20043374 (`target=_blank rel=noopener`) | 2307 |
| Licence link | https://creativecommons.org/licenses/by/4.0/ (`target=_blank rel=noopener`) | 2307 |
| `src` of `#lightbox-img` | empty, set by script | 2117 |
| Wikimedia Commons links | generated into `#nb-credits` at runtime | script.js 6947 |
| Fonts, CDNs, images | none in range (fonts are linked at index.html 11–13, outside range) | – |

## Text that needs care in Razor

| Item | Line | Detail |
|---|---|---|
| `@` characters | 1998 | `placeholder="name@university.edu.jo"` |
| | 2034 | `placeholder="name@university.edu.jo"` |
| other `@` in range | none | whole file has 4 `@` (grep count); the other 2 are outside this range |
| `@media`, `@keyframes` | none (no `<style>` block in range) | |
| Razor-sensitive form | 1998, 2034 | Razor may accept an e-mail-like token, but write `@@` to be safe; rendered output is unchanged |
| HTML entities | 1931, 1936 | `&amp;` inside `<bdi>`; keep as is (not decoded) |
| Non-ASCII | whole range | Arabic text, `✕ ✓ ← → − + ©`; the partials must be saved as UTF-8 and the layout must keep `<meta charset>` |
| `{` `}` | none in markup text | |
| HTML comments to keep | none needed functionally | no conditional comments, no script reads comments (not searched in scripts; comments are not DOM elements) |
| HTML comments safe to drop | 1890–1892, 1954–1958, 1969, 1995, 2007, 2021, 2039, 2092–2096, 2115, 2131–2138, 2154, 2170, 2191, 2212, 2228, 2240, 2258–2260, 2271, 2275, 2283 | descriptive only; they are in the rendered HTML today, so keeping them keeps the output byte-identical |
| Whitespace | 1959 (line with 2 spaces), 2268 (8 spaces) | trailing whitespace only |

## Accessibility and RTL notes

- All four dialogs have `role=dialog` and `aria-modal=true`. `#level-modal` (1960) has no `aria-labelledby`/`aria-label` although `#level-aside-title` exists (1962).
- Close buttons with `aria-label="إغلاق"`: 1901, 1990. Without a label (only the glyph ✕): 2111 (`#close-lightbox-btn`), 2151 (`#close-stu-modal-btn`).
- Auth: `#auth-modal-title` has `tabindex=-1` (script.js 2107 uses it as focus target). Errors use `role=alert` (2003, 2051, 2076). Inputs are inside `<label>` wrappers. Role cards: `role=group`, `aria-labelledby=nb8-rolehead`; script adds `aria-pressed` (script.js 2393). Side panel is `aria-hidden=true` (1970). Step indicator `aria-hidden=true` (2023).
- Handover: `label for` is set for recipient, diagnosis, summary, action (1909, 1920, 1931, 1936).
- `#reg-role` select (2046) is `hidden` + `aria-hidden`; `#reg-specialty` label has class `hidden` (2057).
- RTL: `dir` is not set anywhere in this range (set on `<html>`, outside range, not verified here). LTR islands: `<bdi dir="ltr">` at 1931 and 1936, `direction:ltr` on `#reg-code` (2072), `.nb8-side-en` forced `direction:ltr` in academic8.css 57. Table text uses `text-right` (2177, 2198).
- Footer headings are `div`, not heading elements (2273, 2285, 2296).

## Features and reachability

| Block | Class | Evidence |
|---|---|---|
| Auth modal (login, register, demo login) | live | script.js 2076 opens it; demo buttons bound at 6603; CSS full-screen override in home9.css 48–52; side panel display rules in academic8.css 39–47. |
| Demo login buttons | live | `nbDemoLogin` called at script.js 6604 |
| Level quiz modal (`#level-modal`) | not determined | `nbOpenLevelModal` is called at script.js 2627, 2628, 4071; scope.css header says the level quiz is hidden and closed "in script.js (start guards)"; I did not trace the guard. |
| Handover modal (`#handover-modal`) | dormant | opener `#open-handover-modal-btn` is at index.html 844 inside `#view-sim` (806, class `hidden`); `'sim'` is in `REMOVED_VIEWS` (script.js 1678) and `viewId` is reset to `home` at 1949. Modal markup and handlers stay. |
| Image lightbox | live (via professor modal), dormant (via sim) | opener at script.js 5652 is in the student attempt renderer; openers at 4678/4682 are sim workup cards (sim removed). |
| Student attempt modal | live for professors | `openStudentAttemptDetailModal` called from 5589, 6496 (`data-nb8-open-stu`), 6913; phase8 re-enabled the university portal (scope.css header). Whether the portal is reachable with the demo professor was not probed. |
| Footer, guest links | live | `#footer-guest-links` shown for guests (script.js 1860). Targets `#sec-about8`, `#sec-problems8`, `#sec-how`, `#sec-resp`, `#sec-roadmap8`: existence in index.html not checked. |
| Footer, app links | live after sign-in | `#footer-app-links` starts `hidden` (2284), toggled at 1861 |
| `[data-foot-app="coach"]` (2290) | dormant | hidden by scope.css `display:none !important` (line 40 of that file, selector list starts at its line 40) |
| `#foot-er-btn` (2288) and `onclick="nbOpenER()"` button (2289) | live | two separate buttons for the ER room: random vs fixed |
| Footer visibility | live | hidden while view is sim, nurse, observe, resp or er (script.js 2016) |
| `#nb-credits` | live | filled at script.js 6947 |
| Script tags | live | 6 deferred scripts, executed in this order |

## Problems

| # | Severity | Issue |
|---|---|---|
| 1 | medium | Comment "MODAL 2: AUTHENTICATION" (1954–1958) sits above `#level-modal`, not above `#auth-modal`; the level modal has no comment of its own. Cutting a partial at either comment gives a misleading name. |
| 2 | medium | `#stu-modal-toggle-pub-btn` has two click listeners (script.js 6527 and 6905). Both run on each click; moving the markup must keep the id. |
| 3 | medium | Seven modal and footer ids are written by script.js with no registry: any Razor rename of ids breaks them silently (full list in "Which script owns what"). |
| 4 | medium | `#level-modal` has no accessible name (1960). |
| 5 | low | `✕` close buttons at 2111 and 2151 have no `aria-label`. |
| 6 | low | Stacking is set twice: classes `z-85`/`z-90` and inline `style="z-index"` (1893, 2097, 2139) plus 1960 inline only. |
| 7 | low | `style=""` empty at 2024. |
| 8 | low | Two professor-note inputs in one modal: `#stu-comment-input` (2149) and `#stu-modal-prof-note` (2244), with similar labels. |
| 9 | low | Hidden duplicate controls: `#reg-role` (2046) vs role cards, `#reg-specialty` (2057–2061). |
| 10 | low | Footer has two ER buttons (2288, 2289) and footer links point to `#sec-*` ids not verified. |

## Proposed Razor split

Contiguous, cut only at element boundaries (blank lines and comments go with the block that follows or precedes them). Concatenating in order gives lines 1888–2318 exactly.

| Order | Partial | From–to | What it holds |
|---|---|---|---|
| 1 | (inside `_Layout.cshtml`, tail of the body section) | 1888–1889 | `</main>` and one blank line; unbalanced on its own, so it stays in the layout around `@RenderBody()` |
| 2 | `_HandoverModal.cshtml` | 1890–1953 | SBAR handover modal with its comment |
| 3 | `_LevelModal.cshtml` | 1954–1966 | the 1954–1958 comment (mislabeled) and `#level-modal` |
| 4 | `_AuthModal.cshtml` | 1967–2090 | `#auth-modal` (login, register, demo login) and following blank lines |
| 5 | `_ImageLightbox.cshtml` | 2091–2129 | lightbox comment and `#medical-image-lightbox` |
| 6 | `_StudentAttemptModal.cshtml` | 2130–2257 | professor student-attempt modal with its comment |
| 7 | `_SiteFooter.cshtml` | 2258–2310 | `footer#site-footer` with guest links, app links, credits |
| 8 | `_ScriptTags.cshtml` | 2311–2316 | six `<script defer>` tags (use `~/` or `Url.Content` only if the rendered `src` stays identical) |
| 9 | (inside `_Layout.cshtml`) | 2317–2318 | `</body>` and `</html>` |

`@` handling: write `name@@university.edu.jo` in `_AuthModal.cshtml` at the two placeholders (source lines 1998, 2034).

## Open questions

1. Is `#level-modal` reachable today? The guard in script.js that closes the level quiz was not traced (calls exist at script.js 2627, 2628, 4071).
2. Do the footer anchors `#sec-about8`, `#sec-problems8`, `#sec-how`, `#sec-resp`, `#sec-roadmap8` all exist in index.html? Not checked.
3. Is `dir="rtl"` and `lang` set on `<html>`/`<body>` (lines 1–3)? Outside this range; not verified.
4. Can the demo professor (`nbDemoLogin('doctor')`) open the student-attempt modal in the running page? Not probed.
5. Should the empty `style=""` (2024) and the duplicate z-index declarations be preserved for byte-identical output?
6. Should script tags get cache-busting versions in ASP.NET Core (would change rendered HTML)?
