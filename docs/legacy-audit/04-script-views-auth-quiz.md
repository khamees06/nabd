# Views, navigation, sign-in/registration, session and level quiz — script.js:1674–2648

Checkout: C:/Users/ss/nabd-refactor (commit 5f431d5 content). All line numbers refer to script.js unless a file is named. Reachability was checked with greps over `*.js` and `index.html` and with one probe of the running page (http://127.0.0.1:5180/).

## Purpose

This range holds the global view and session state (`authState`, `simState`, view-name sets), the localStorage helper layer with a `window.name` fallback, and the password-derivation helpers. It also holds the shell sync after sign-in and sign-out, the view switcher with its sign-in guard, and the sign-in modal and demo sign-in. The second half is the "Phase 1b/1c" block: the level quiz (question banks, scoring, placement storage), room recommendations, tier unlocking, the OSCE timer, the post-report hook, the level modal, mistakes and notes, and the home "training path" panel. In today's UI most of the quiz and path is closed by `scope.css` and by an early `return`; the sign-in, navigation and storage code is live. Everything is global script code, called both from other scripts and from `index.html`.

## Features and user journeys implemented here

| # | Feature | What the user sees or does | Reachability and evidence |
|---|---------|----------------------------|---------------------------|
| 1 | View switching with sign-in guard | `navigateTo(view)` shows one `#view-*` section, hides the others, closes sidebar and dropdown, scrolls to top (1948–2018). A guest asking for a protected view is sent to the landing view and the login modal opens with a notice (1952–1959). | live. Called from er.js (3948, 4224, 4647…), resp.js (784, 866), script.js many places. Probe: after `nbDemoLogin('med_student')`, `currentView==='home'`. |
| 2 | Closed views redirect home | `observe, nurse, resp, coach, sim` always lead to `home` (1678, 1949). | live. Probe: `navigateTo('resp')` left `currentView==='home'`. `er`, `university`, `profile`, `debrief` remain open. |
| 3 | Shell sync by role | Switches public/app header, sidebar, footer, fills avatar, name, role, demo badge, home welcome text, shows the professor or student home section (1852–1944). | live. Called at 2032, 2068, 6548, 6557. |
| 4 | Demo sign-in | Buttons `[data-demo-login]` (index.html:2014–2016: rana, med_student, doctor) and `#index-demo-cta` call `nbDemoLogin` (2042). It stores a placement for students so no quiz appears, then signs in. | live (index.html:2014–2016; script.js:6602–6604). Probe: placement key `nabd_placement_v1_med_student` written with `demo:true`. |
| 5 | Login modal open/close | Opens with optional notice and focus rules for touch vs mouse (2073–2120). | live. Many callers (6595–6601, 6647…). |
| 6 | Sign-out | `logoutUser` clears session keys and returns to landing (2056–2071). | live (6649, 6668 via `#dropdown-logout-btn`). |
| 7 | Registration role cards | `#reg-rolecards` buttons set role, specialty, chip text, and hide the section-code field for supervisors (2380–2399). | live. `initAuthRoles` called at 6943; `nbSetRegRole` also called from the quiz result (2375). The form submit itself is outside this range (about 7000–7100). |
| 8 | Landing level quiz (nursing / medicine) | Track choice, 8 questions, score, level, weak topics, suggested rooms, review of wrong answers (2223–2260, 2344–2378). | dormant. The host `#nb-quiz-main` has the `hidden` attribute (index.html:402, comment "The level quiz is closed (scope.css)"). `nbRenderQuiz()` still runs at init (6942) and writes into the hidden box. Probe: `quizHidden:true, quizVisible:false`. |
| 9 | Level modal (retake / onboarding / skip) | `#level-modal` hosting the same quiz (2557–2575). | dormant. Onboarding opens only from `nbMaybeOnboard`, which starts with `return;` (4064). `#path-retake` is in a `display:none !important` rule (scope.css:33). `#skip-take-btn` has no match in index.html. `#dash-retake` (5435) exists in a profile pane (profile-pane-dash, index.html:1283) whose visibility is not determined. |
| 10 | Landing showcase carousel | Auto-rotating slides (2193–2221). | dormant. `#nb-stage` is absent from index.html and the probe returned `stage:false`, so the function returns at 2195. |
| 11 | Training path panel on home | Level, KPIs, tip, recommended rooms, history bars, mistakes, notes (2407–2447). | live for the function (called from 3539, 3978, 3985, 2574, er.js:4251), but most of its blocks are hidden by scope.css (33, 46, 49). `#path-notes` and the professor invite code are shown (scope.css comment, 483 in index.html). |
| 12 | OSCE exam mode | Countdown bar, hides hints, auto-opens handover at 0 (2498–2527). | dormant. Started from `startSimulationSession` (4267), but the toggle `label.nb-switch:has(#osce-toggle)` is hidden (scope.css:49). A value saved earlier in `nabd_osce` would still activate it. Whether `startSimulationSession` runs with `goToSim` false from ER is not determined. |
| 13 | Professor comment on a student | Save writes a note keyed by student name; student sees notes in the path panel (2630–2638, 2597–2606). | live if the professor inspect panel is open (caller 5600). Student-side display live via `nbRenderNotes` (2444). |
| 14 | Post-report history and retry | `nbAfterReport` records case id, score, mistakes, compare box, retry button, unlock toast (2530–2554). | not determined. Only caller is script.js:5165 (old report renderer). It is reachable only if that renderer is called from a live path. |

## Declarations

Layer codes: D = domain, A = application, I = infrastructure, P = presentation, B = browser. "R" = reads, "W" = writes.

| name | lines | kind | responsibility | layer | shared state | called from |
|------|-------|------|----------------|-------|--------------|-------------|
| PROTECTED_VIEWS | 1674 | const Set | views a guest may not open | D | R by navigateTo | navigateTo |
| REMOVED_VIEWS | 1678 | const Set | views that redirect home | D | R by navigateTo | navigateTo; named in scope.css comment |
| STORAGE_KEYS | 1679–1686 | const object | six localStorage key names | I | read across script.js | 4376, 5492, 5496, 6049, 6536… |
| authState | 1688–1691 | let object | signed-in flag and user object | A | W by login/logout/init; R everywhere | all scripts |
| currentView | 1693 | let | name of the visible view | A | W navigateTo | script.js (other), er.js (not determined) |
| selectedDeptFilter, selectedWorkupCategory | 1694–1695 | let | filter state of the old case list | P | outside range | not determined (outside range) |
| isEmergencyRandomMode | 1696 | let | random ER flag | A | outside range | not determined |
| activeCaseId | 1697 | let | current case id | A | R saveScratchpadText | script.js |
| hasCompletedSessionInRun | 1698 | let | report gate | A | W 2028, 2059; R 1981 | script.js |
| simToolsOpenOnDesktop | 1699 | let | tools panel flag | P | outside range | not determined |
| simState | 1701–1718 | let object | old simulator session record (case, asked questions, workups, SBAR, flags) | A | W 2029–2030, 2060–2061 | script.js |
| getFallbackStore | 1721–1728 | function | parse store held in `window.name` | I | R window.name | safeStorage* only |
| setFallbackStore | 1730–1734 | function | write store into `window.name` | I | W window.name | safeStorage* only |
| safeStorageGet | 1736–1743 | function | read JSON key, localStorage first, then window.name | I | R both | 13 call sites in script.js |
| safeStorageSet | 1745–1752 | function | write JSON key to both | I | W both | script.js |
| safeStorageRemove | 1754–1761 | function | delete key from both | I | W both | 2063, 2064, 6539 |
| loadPersistedCustomCases | 1763–1770 | function | merge saved custom cases into `CASES_DB`, restore default image | A | R CUSTOM_CASES; W CASES_DB | initNabdApp 6534 |
| saveCustomCaseToStorage | 1772–1778 | function | store a case copy without image | I | W CUSTOM_CASES | 6002 |
| getAccountFromStorageOrDefault | 1780–1785 | function | account from map, else demo account, as deep copy | I | R ACCOUNTS_MAP, DEMO_ACCOUNTS | 2022, 6537 |
| saveAccountToStorage | 1787–1792 | function | store account into the map | I | W ACCOUNTS_MAP | er.js:4250, resp.js:797, script.js (7 places) |
| nbPasswordSalt | 1794–1799 | function | 16 random bytes as hex | B | crypto.getRandomValues | 7012, 7061 |
| nbPasswordDigest | 1801–1807 | async function | PBKDF2-SHA256, 120000 iterations, 256 bits, hex | B / I | crypto.subtle | 7013, 7018, 7062 |
| getScratchpadKey | 1809–1811 | function | `userId__caseId` key | D | none | saveScratchpadText, loadScratchpadText |
| saveScratchpadText | 1813–1818 | function | store notepad text per user and case | I | R authState, activeCaseId; W SCRATCHPADS | 4736, 6589, 6805 |
| loadScratchpadText | 1820–1823 | function | read notepad text | I | R SCRATCHPADS | 4297 |
| getSessionTimestamp | 1826–1832 | function | `MM:SS` since `simState.startTimeMs` (min 1 s) | D | R simState, Date.now | 4448, 4552, 4807, 6745 |
| showToast | 1835–1843 | function | show `#calm-toast` for 4.5 s | P | W `window._toastTimer` | ~30 call sites |
| getRoleArabicName | 1845–1849 | function | role code to Arabic label | D | none | 1880, 5312, 5471, 7079 |
| syncAuthShellUI | 1852–1945 | function | apply auth state to header, sidebar, footer, home welcome, role sections; trigger renders | P | R authState; DOM | 2032, 2068, 6548, 6557 |
| navigateTo | 1948–2008 | function | guard, switch view, nav highlight, debrief gate, scroll | A | R authState, simState, hasCompletedSessionInRun; W currentView | er.js, resp.js, script.js |
| showOnlySection | 2010–2018 | function | toggle `#view-*` sections and footer | P | DOM | navigateTo only |
| loginWithAccount | 2021–2037 | function | load stored account, set session, persist active id, reset flags, sync, navigate, toast | A | W authState, ACCOUNTS_MAP, ACTIVE_USER_ID | 2053, 7015, 7024, 7073, 7105 |
| nbDemoLogin | 2042–2054 | function | seed placement for a demo student, sign in | A | R DEMO_ACCOUNTS; W placement key | 6602, 6604 (and index.html handlers via `data-demo-login`) |
| logoutUser | 2056–2071 | function | clear session | A | W authState, flags, ACTIVE_USER_ID, ACTIVE_SIM | 6649, 6668 |
| openAuthModal | 2073–2111 | function | open login/register modal, notice, focus handling | P / B | DOM, matchMedia | 1956, 2340, 6595… |
| closeAuthModal | 2113–2120 | function | close modal, unlock page | P / B | DOM | 2033, 6566, 6950, 6959 |
| NB_PLACEMENT_KEY | 2124 | const | `nabd_placement_v1` | I | used at 2047 before this line only inside functions | 2047, 2189, 4067 |
| NB_ROOM_HINTS | 2125–2133 | const object | hint text per case id | D (content) | R by 2334, 2456 | nbRoomsHtml, updateSimLevelHint |
| NB_TOPIC_ROOMS | 2134–2138 | const object | quiz topic to medical case ids | D | R 2267, 2305 | nbPickRooms, nbRecommend |
| NB_TOPIC_NAMES | 2139 | const object | topic labels | D | R 2306 | nbRecommend |
| NB_LEVELS | 2140 | const object | level 1–3 names and CSS class | D | R widely | script.js |
| NB_TIPS | 2141–2145 | const object | three tips per level | D | R 2365, 2432 | renderHomePath, nbRenderResult |
| NB_QBANK | 2146–2153 | const array | 6 questions (older bank) | D | none | unreferenced (grep over `*.js`, `index.html`: only the declaration) |
| NB_QTRACK | 2154–2163 | const object | per-track questions (older bank) | D | none | unreferenced (same search) |
| NB_QUIZ_BY_TRACK | 2165–2186 | const object | live bank: 8 nursing and 8 medicine questions `{t,d,q,o,a}` | D | R 2258 | nbStartQuiz |
| nbQuiz | 2187 | let object | quiz run `{track, qs, i, ans}` | A | W 2236 flow, 2258, 2371, 2563, 2572 | quiz functions |
| nbPlacementKey | 2189 | function | per-user placement key | I | R authState | 2355, 2621, 4068 |
| nbHistKey | 2190 | function | per-user quiz history key | I | R authState, NB_HIST_KEY | 2356, 2438 |
| nbGetPlacement | 2191 | function | read placement | I | R storage | 12 call sites |
| initLandingShowcase | 2193–2221 | function | carousel timer and tabs | P / B | DOM, setInterval | 6941 |
| nbRenderQuiz | 2223–2255 | function | render track choice, question, or result | P | R nbQuiz | 6942, 2252, 2371 |
| nbStartQuiz | 2257–2260 | function | start quiz for a track | A | W nbQuiz | 2236, 2254, 2567 |
| nbPickRooms | 2262–2275 | function | choose up to 3 case ids by level, weak topics, tier | D | R CASES_DB, NB_NURSE_CASES | 2050, 2354 |
| NB_WEAK_MAP_N | 2279 | const object | weak topic to nursing case ids | D | R 2305 | nbRecommend |
| nbPoolFor | 2280–2282 | function | case pool by track, excluding guided case | D | R CASES_DB | nbRecommend |
| nbBestMap | 2283–2286 | function | best score per case from history | D | R u.history | 2288, 2321 |
| nbRecommend | 2287–2314 | function | up to 3 recommendations plus a goal sentence | D | R storage, user | 2435 |
| nbRecoHtml | 2315–2319 | function | HTML for recommendations | P | none | 2435 |
| nbFlt | 2320 | let object | level and status filter | A | W 2327–2328 | 2322, 4026, 4169 |
| nbCaseStatus | 2321 | function | locked / done / open | D | R | nbFltPass |
| nbFltPass | 2322 | function | filter predicate | D | R nbFlt | 4027, 4172 |
| nbFilterBar | 2323–2329 | function | render filter buttons | P | W nbFlt | 4026, 4169 |
| nbRoomsHtml | 2331–2337 | function | HTML for suggested rooms | P | none | nbRenderResult |
| nbOpenRoom | 2339–2342 | function | guard, then click the random ER button; the id is ignored | A | R authState | 2370, 2437, 2595 |
| nbRenderResult | 2344–2378 | function | score, level, weak topics, store placement and history, render result | D + I + P mixed | W placement, history, account | 2239 |
| nbSetRegRole | 2380–2395 | function | set registration role UI | P | DOM | 2375, 2398 |
| initAuthRoles | 2397–2399 | function | bind role cards | P | DOM | 6943 |
| nbDerivedLevel | 2401–2405 | function | level from role and year | D | none | 2049, 2419, 2454, 2480, 5433 |
| renderHomePath | 2407–2447 | function | fill the home path panel | P | R placement, history | 3539, 3978, 3985, 2574, er.js:4251 |
| updateSimLevelHint | 2449–2458 | function | hint line for old simulator | P | R placement | 4267 |
| NB_HIST_KEY | 2462 | const | `nabd_placement_hist` | I | R in nbHistKey | 2190 |
| NB_COMMENTS_KEY | 2463 | const | `nabd_comments_v1` | I | | 2599, 2608, 2633, 6xxx |
| NB_COHORTS | 2464–2468 | const object | three cohort codes with university and name | D (data) | | 2473, 6018, 6032, 6045, 6182, 6275, 6308, 6455 |
| nbQHost, nbQModal, nbOsceTimer, nbOsceActive | 2469 | let (4) | quiz host id, modal flag, OSCE timer, OSCE flag | A | W 2561–2572, 2499–2553 | quiz and OSCE functions |
| nbHost | 2471 | function | quiz host element | P | R nbQHost | 2224, 2345 |
| nbCohortFor | 2472–2475 | function | normalise code, look up cohort | D | R NB_COHORTS | 6518, 7037 |
| nbTier | 2476 | function | Arabic level label to 1–3 (default 2) | D | none | many |
| nbBaseTier | 2477–2481 | function | starting tier from role or placement | D | R placement | 2483 |
| nbUnlockedTier | 2482–2488 | function | tier raised by passed cases (score ≥ 70) | D | R history | 2288, 2492, 2551, 3965, 3979, 5434 |
| nbLockInfo | 2489–2495 | function | lock message or null | D | R authState | 2321, 3891, 4030, 4050, 4214 |
| nbOsceOn | 2498 | function | read `nabd_osce` | I | R storage | 2506, 2442 |
| nbStopOsce | 2499–2503 | function | stop timer, restore bars | A / P | DOM | 2505, 2519, 2531, 2517 |
| nbStartOsce | 2504–2527 | function | countdown from `durationMin` (default 12) | A / B | setInterval 1 s | 4267 |
| nbAfterReport | 2530–2554 | function | write history fields, compare, retry, unlock toast | A | W account.history[0] | 5165 |
| nbOpenLevelModal | 2557–2568 | function | open modal quiz | P | W nbQuiz, nbQHost, nbQModal | 2627, 2628, 4071, 5435 |
| nbCloseLevelModal | 2569–2575 | function | close and refresh panels | P | W | 2373, 2623, 2625 |
| nbRoomForText | 2578–2586 | function | regex keyword to case id | D | R authState | 2594–2595 |
| nbRenderMistakes | 2587–2596 | function | top 3 repeated mistakes | P | R u.history, u.weaknesses | 2443 |
| nbRenderNotes | 2597–2606 | function | notes by user name | P | R COMMENTS | 2444 |
| nbLoadComment | 2607–2614 | function | show last comment for a student | P | R COMMENTS | 2637, 5600 |
| initPhase1c | 2616–2646 | function | bind modal, toggle, comment save, invite copy, hero counts | P | DOM | 6944 |

## Shared state, globals and contracts

Defined here for other files:

- Globals: `authState`, `simState`, `currentView`, `activeCaseId`, `hasCompletedSessionInRun`, `nbQuiz`, `nbFlt`, `STORAGE_KEYS`, `NB_*` constants, and all functions in the declarations table. er.js and resp.js call `navigateTo`, `saveAccountToStorage`, `renderHomePath` (er.js:3948, 4224, 4250–4251, 4647…; resp.js:784, 797, 866).
- Data contracts: `authState.user` has `id, name, initials, role ('student'|'professor'|'doctor'|'practitioner'), roleNameAr, roleLabel, specialty, year, isDemo, track, cohort, stats{completed, avgSpec, avgEr}, history[{caseId, num, passed, mistakes[], osce, ts}], weaknesses[], learn{obs[], guided[]}`. Fields were read at 1880–1927, 2285, 2419–2428, 2485, 2537. `account.history[0]` is the newest entry and is mutated by `nbAfterReport` (2533–2537).
- Placement object: `{track, level 1–3, pct, weak[], rooms[], ts}` plus `demo:true` (2050) or `skipped:true` (2621).
- Quiz question: `{t topic, d weight 1–3, q text, o [4 options], a index}`. HTML is built from these with `innerHTML`.

Expected from others:

- Functions: `closeSidebar` (4102), `closeAccountDropdown` (4124), `renderProfileView` (5309), `renderUniversityPortalByRole` (5468), `renderProfessorCohortTables` (5499), `renderInteractiveCoachView` (5725), `renderClinicalCaseCards` (4162), `getProfCohortList` (5491), `nbTrackOf` (3457), `nbCaseObj` (3456), `nbLearn` (3463), `nbMaybeOnboard` (4063), `renderLearnPath` (3989), `renderTrackHome` (4009), `nb8RenderAcademic` (6406), `nb8RoleHint` (6147), `nb8AdvisorNoteHtml` (6157), `startSimulationSession` (4265), `window.nbErReport`, `nbOpenER` (probe).
- Data: `CASES_DB` (214), `CASE_IMAGES` (5), `DEMO_ACCOUNTS` (1032), `NB_NURSE_CASES` (2902), `NB_MED_GUIDED_ID` (2652), `activeInspectedStudentId` (5593).
- Load order: `NB_PLACEMENT_KEY` (2124) is used by `nbDemoLogin` (2047), `NB_HIST_KEY` (2462) by `nbHistKey` (2190); both work because they are read only at call time, after the whole script has run. This is a constraint on any file split.
- DOM ids used (not exhaustive): `view-{index,home,sim,debrief,coach,profile,university,observe,nurse,resp,er}`, `public-header`, `app-header`, `sidebar-*`, `footer-*`, `site-footer`, `calm-toast`, `calm-toast-text`, `auth-modal`, `login-error-msg`, `reg-error-msg`, `login-email`, `reg-name`, `reg-role`, `reg-specialty`, `reg-year`, `reg-rolecards`, `reg-track-chip`, `reg-code-wrap`, `level-modal`, `level-modal-close`, `level-aside-title`, `level-aside-text`, `nb-quiz-main`, `nb-quiz-modal-main`, `home-path`, `path-*`, `osce-toggle`, `sim-osce-bar`, `sim-osce-time`, `rep-compare`, `rep-retry-btn`, `launch-er-random-btn`, `prof-invite-code`, `hero-stat-cases`, `hero-stat-depts`, `stu-comment-*`.
- `navigateTo` calls `window.nbErReport()` for the debrief view (1978); if it returns truthy the legacy report gate is skipped.

## Data, storage and network

No network calls in this range.

| Storage | Key | Shape | Lines |
|---------|-----|-------|-------|
| localStorage and `window.name` copy (`__NABD_STORE__:` + JSON) | `nabd_v2_active_user_id` | string id | 2026, 2063 |
| same | `nabd_v2_accounts_map` | `{id: accountObject}` (whole account, deep copy) | 1781–1791 |
| same | `nabd_v2_custom_cases` | `{caseId: case without image}` | 1764–1777 |
| same | `nabd_v2_scratchpads` | `{"userId__caseId": text}` | 1815–1822 |
| same | `nabd_v2_active_sim_meta` | removed at logout (2064); shape defined outside range | 2064 |
| same | `nabd_v2_prof_cohort` | declared (1685); use not determined in range | 1685 |
| same | `nabd_placement_v1` / `nabd_placement_v1_<userId>` | placement object | 2047, 2189, 2355 |
| same | `nabd_placement_hist` (+ `_<userId>`) | array of `{ts, pct, level}`, last 8 | 2190, 2356 |
| same | `nabd_comments_v1` | `{studentName: [{text, ts, by}]}`, newest first | 2599, 2633–2635 |
| same | `nabd_osce` | boolean | 2498, 2629 |

Other effects:

- Timers: toast `setTimeout` 4500 ms (1842); quiz auto-advance 260 ms (2252); `navigateTo` scroll delay 60 ms (1994); focus `setTimeout(0)` (2102); OSCE `setInterval` 1000 ms (2526); showcase `setInterval` 8000 ms, stopped by hover/focus and `prefers-reduced-motion` (2199–2220); welcome toast; unlock toast 600 ms (2552).
- Browser APIs: `window.name` store (1723, 1732), `history.replaceState` (1957), `crypto.getRandomValues` and `crypto.subtle` PBKDF2 (1795–1806), `matchMedia` (2098, 2210), `scrollTo` and `scrollIntoView` (1997–2004), `navigator.clipboard.writeText` (2641), `Date.now`, `toLocaleDateString('ar-JO')` (2602). No audio.
- Page-lock class `nb-auth-open` on `<html>` for touch devices (2101, 2119).

## Calculations and rules worth pinning with a golden-master test

| Name | Lines | Inputs | Output | Randomness / time |
|------|-------|--------|--------|-------------------|
| Quiz score and level | 2346–2353 | `nbQuiz.qs` weights `d`, answers | `pct = round(score/max*100)`; level 1 if <45, 2 if <78, else 3; weak = top 3 topics by lost weight | none |
| Room picking | 2262–2275 | level, weak topics, tier, track | up to 3 case ids (weak-topic rooms, then level label match, then any in tier) | none; depends on object insertion order of `CASES_DB` and `NB_NURSE_CASES` |
| Derived level | 2401–2405 | role, year | professor 0, practitioner 2, year ≤2 → 1, year 3 → 2, else 3 (missing year counts as 4) | none |
| Tier of a case | 2476 | `levelLabel` | سهل 1, متوسط 2, متقدم 3, unknown 2 | none |
| Base tier and unlocked tier | 2477–2488 | user, placement, history | professor 3; otherwise placement level; each passed case with `num ≥ 70` raises to `min(3, tier+1)` | none |
| Lock message | 2489–2495 | case, user | null or message; note it names `NB_LEVELS[need-1]` (the level below) | none |
| Best score map and recommendations | 2283–2314 | history, pool, placement | ordered list: practice (<70), next (department mean ≥ 85), weak topic, new, review; max 3; goal string for the first locked case | none |
| Case status | 2321 | best score, lock | locked / done (≥70) / open | none |
| Session timestamp | 1826–1832 | `startTimeMs`, now | `MM:SS`, min 1 s, `00:01` if not started | time |
| Scratchpad key | 1809–1811 | user id, case id | `${user||'guest'}__${case||'default'}` | none |
| Password digest | 1801–1807 | password, salt hex | PBKDF2-SHA256, 120000 iterations, 32-byte hex | salt random (1796–1797) |
| Role label | 1845–1849 | role code | professor/doctor → أستاذ جامعي; practitioner → ممارس صحي; else طالب جامعي | none |
| Mistake-to-room mapping | 2578–2586 | text | first matching regex case id (nursing and medicine tables) | none |
| Navigation guard | 1948–1959 | view, auth state | redirect to landing + modal; removed views to home | none |
| Quiz history cap | 2356 | history array | last 8 entries | time |
| OSCE countdown | 2504–2527 | `durationMin` (default 12) | seconds left, formatted; at 0 opens handover | time (interval) |
| Path retake note | 2441 | last attempt ts | message changes after 30 days (`30*864e5`) | time |

## Problems

| Severity | Kind | Evidence |
|----------|------|----------|
| high | security | Registration and sign-in are client-side only. Accounts, including whatever fields registration stores (password hash and salt, written outside this range at 7012–7018, not inspected here), are kept in localStorage (1787–1791) and copied into `window.name` (1749–1751, 1732), which survives navigation to other sites in the same tab. There is no server authority for identity. |
| high | security | `DEMO_ACCOUNTS` are public in the script and `nbDemoLogin` signs anyone in as a professor (2042–2054, index.html:2016). Roles (`professor`) are trusted from client storage, so a user can edit `nabd_v2_accounts_map` to become a professor. |
| medium | data-exposure | Quiz answer indexes `a` are shipped with the questions (2165–2186). Professor notes about students are keyed by display name in `nabd_comments_v1` (2633–2634, 2599) and are visible to anyone on the same browser. |
| medium | bug | Quiz option click schedules `nbQuiz.i++` after 260 ms without a lock (2248–2253). Two quick clicks on different options advance two questions and skip one. The quiz is currently hidden but the code stays. |
| medium | bug | `nbOpenRoom(id)` ignores `id` and clicks the random ER button (2339–2342), so each "suggested room" opens a random room. Recommended rooms are `CASES_DB`/nurse case ids, not ER cases. |
| medium | architecture | Global mutable state plus UI plus storage in one scope; domain rules (`nbUnlockedTier`, `nbRecommend`, scoring in `nbRenderResult` 2346–2356) are mixed with DOM and storage writes. `nbRenderResult` computes, persists (2355–2357) and renders in one function. Ordering depends on const TDZ (`NB_PLACEMENT_KEY` 2124 used at 2047, `NB_HIST_KEY` 2462 used at 2190). |
| medium | dead-code | `NB_QBANK` (2146) and `NB_QTRACK` (2154) are unreferenced. `nbMaybeOnboard` returns at its first line (4064), so the onboarding branch of `nbOpenLevelModal` is not reachable from there. The landing quiz and carousel run against a hidden or missing host (index.html:402; no `#nb-stage`). The OSCE toggle is hidden by CSS (scope.css:49). |
| low | duplication | Two quiz banks repeat the same questions (2146–2163 vs 2165–2186). `nbSetRegRole` sets `chip.innerHTML` twice (2388, 2390). `initPhase1c` sets the status text twice (2636, 2637). |
| low | bug | `nbRenderNotes` and `nbLoadComment` key notes by `u.name`; two students with the same name share notes (2600, 2608). `nbLockInfo` names the level below the required one (`NB_LEVELS[need-1]`, 2494, 2313), which may be intended wording but is not documented. |
| low | maintainability | Behaviour is spread across multiple "phase" patches (comments `phase8 2026-11-07`, `2026-11-08`); `navigateTo` handles the closed views by redirect while `scope.css` also hides controls, so the closed state is defined in two places (1678, scope.css:5–11). `logoutUser` leaves `simState` and `activeCaseId` otherwise intact (2056–2071). |

## Proposed source fragments

Ranges were checked with `tools/legacy/check-fragment.mjs` (all 21 print ok). Every start line is in `.work/script-cuts.txt`.

| order | file name | from–to | single responsibility | layer |
|-------|-----------|---------|-----------------------|-------|
| 1 | session-state.js | 1674–1719 | view-name sets, storage key names, `authState`, `simState` and view globals | domain / application |
| 2 | local-storage-store.js | 1720–1793 | localStorage + `window.name` store, custom-case and account persistence | infrastructure |
| 3 | password-hashing.js | 1794–1808 | salt and PBKDF2 digest | browser |
| 4 | session-utilities.js | 1809–1850 | scratchpad storage, timestamp formatting, toast, role label | application |
| 5 | auth-shell-ui.js | 1851–1946 | apply auth state to header, sidebar, footer, home welcome | presentation |
| 6 | view-navigation.js | 1947–2019 | `navigateTo` guard and section switching | application |
| 7 | auth-session-modal.js | 2020–2122 | login, demo login, logout, auth modal open/close | application |
| 8 | level-quiz-data.js | 2123–2192 | room hints, topics, levels, tips, question banks, quiz state, placement keys | domain |
| 9 | landing-showcase.js | 2193–2222 | landing carousel timer and tabs | browser |
| 10 | level-quiz-view.js | 2223–2261 | quiz render and start | presentation |
| 11 | room-recommendation.js | 2262–2314 | room picking, best-score map, recommendations | domain |
| 12 | room-lists-and-filters.js | 2315–2343 | recommendation and room HTML, case filters, open room | presentation |
| 13 | level-quiz-result.js | 2344–2379 | scoring, placement storage, result render | domain / presentation (to be separated) |
| 14 | registration-role-cards.js | 2380–2400 | registration role cards | presentation |
| 15 | home-training-path.js | 2401–2460 | derived level, home path panel, simulator level hint | presentation |
| 16 | tiers-and-cohorts.js | 2461–2496 | storage keys, cohort table, quiz host state, tier and lock rules | domain |
| 17 | osce-timer.js | 2497–2528 | OSCE countdown | browser |
| 18 | report-history-hook.js | 2529–2555 | post-report history record, compare, retry | application |
| 19 | level-modal.js | 2556–2576 | level modal open/close | presentation |
| 20 | mistakes-and-notes.js | 2577–2615 | mistake and note panels, comment load | presentation |
| 21 | phase1c-bindings.js | 2616–2648 | event bindings for modal, OSCE toggle, comments, invite code, hero counts | presentation |

Note: fragments 3 and 9 are small (15 and 30 lines) because their start lines mark a real responsibility change; merging them with neighbours would also pass the syntax check.

## Open questions

1. Is `nbAfterReport` (called only at 5165 in the old report renderer) reachable from a live path, for example from the ER debrief? Not determined.
2. Where is `#dash-retake` created and is `profile-pane-dash` visible to students today? Not determined (script.js:5434–5435 and index.html:1283 only).
3. What exactly does registration store besides the hash (7012–7018) and does the account map keep password material for demo or real users? Outside this range; not inspected.
4. Should closed views (observe, nurse, resp, coach, sim) be kept as routes in the new site, or removed together with `NB_QBANK`, `NB_QTRACK`, onboarding and the carousel?
5. Is the 70% pass threshold and the level cut-offs (45 and 78) a fixed product rule, or provisional? No source in the code explains them.
6. Are `selectedDeptFilter`, `selectedWorkupCategory`, `isEmergencyRandomMode`, `simToolsOpenOnDesktop` and `nabd_v2_prof_cohort` used outside the old simulator? Not determined (declared at 1685, 1694–1699).
