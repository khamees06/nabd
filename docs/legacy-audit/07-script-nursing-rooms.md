# Nursing rooms, operating-room section and track logic — script.js:3440–4130

## Purpose
This range holds the nursing-track code of the legacy site: image helpers, the "observe an expert" view, the chat-style nursing room engine (vitals, actions, doctor orders, SBAR report, ISBAR handoff, scoring), the learning-path card, the track-specific home, and the operating-room (periop) card list. It ends with three unrelated UI helpers (registration step, auth modal tab, sidebar and account dropdown). Today the whole nursing room and observe flow is closed: `obsStart` and `nurseStart` return after `navigateTo('home')` on their first line, and `#home-learn` and `#home-nurse` are hidden by `scope.css:31`. The code is kept, and a few helpers (`nrWarn`, `nbTrackOf`, `nbCaseObj`, `nbLearn`, `nbImgFail`, the sidebar functions) are still used by live code.

## Features and user journeys implemented here
Reachability key: live / dormant / unreferenced.

| Feature | What the user sees | Reachability | Evidence |
|---|---|---|---|
| Observe-expert view (`obsStart`, `obsNext`, `obsShowCheck`, `initObserve`) | Step-by-step expert demo stream, "why" panel, auto-play (4.5 s), two-question check, records the viewing in `u.learn.obs` | dormant | `obsStart` line 3476 is `navigateTo('home'); return;`, the rest is unreachable. Buttons that call it are in `renderLearnPath` (4003) inside `#home-learn`, hidden by `scope.css:31` (`display:none !important`). `initObserve` (3543) still runs at script.js:6946 and binds `#obs-next/#obs-exit/#obs-auto` (exist at index.html:797) |
| Nurse room chat engine (`nurseStart` … `nrFinish`) | Chat feed, monitor, tabbed action chips, doctor orders, report and handoff multiple choice, final score report | dormant | `nurseStart` line 3888 returns after `navigateTo('home')`. Callers: 4006 (`renderLearnPath`, hidden), 4039 and 4059 (card buttons), 3977 (retry). Only `initNurse` (6948) runs |
| Seq / calc / checklist overlays (`nrOpenSeq`, `nrOpenCalc`, `nrOpenChk`, `nrOverlay`, `nrChkOverlay`) | Order-the-steps, dose-calculation and surgical-safety checklist dialogs | dormant | reachable only from `nrDoAct` (3668–3670), which is reachable only from the nurse room UI |
| NEWS2 in nurse room | `nrApply` calls `nbNews2(ns.v)` at 3682 | dormant | same chain; `nbNews2` defined at 2654 |
| Vital-sign warning thresholds `nrWarn` | Used by the nurse monitor and by motion.js | live | motion.js:339 and 419 call `window.nrWarn` (typeof-guarded); not confirmed which UI path triggers it today: not determined |
| Learning path card (`renderLearnPath`) | 3-step card: observe, guided case, independent | dormant | runs on every home render (2410) but fills `#home-learn` which is CSS-hidden. Line 3991 also hides it for professors |
| Track home (`renderTrackHome`) | Welcome line by track ("مسار التمريض" / "مسار الطب"), track chip, nav label "حالات التمريض", ER card shown, `nb8RenderGuide(u)` | live (lines 4010–4023 only) | called at 2410; `return` at 4024 makes 4025–4042 (nurse case grid, `nbRenderOr()` call) unreachable |
| OR periop section (`nbRenderOr`) | Three phases (before op, in OR, recovery) as case cards in `#or-cards` | dormant | only caller is line 4042, after the `return` at 4024. `#or-cards` is inside `#home-nurse` (index.html:462–467), hidden by `scope.css:31` |
| Onboarding level modal (`nbMaybeOnboard`) | Would open the level-placement modal after login | dormant | first statement `return;` at 4064; called at 2410 |
| Image fallback (`nbImgFail`, `nbImg`) | Photo replaced by an SVG placeholder on load error | live | `nbImgFail` is used by inline `onerror` in index.html:289, 297, 317, 341 and script.js:4199; index.html:30 defines a stub first, script.js:3442 overrides it |
| Image credits | `NB_IMG` listing built into `#nb-credits` | live | script.js:6947, element at index.html:2306 |
| Registration step, auth tab, sidebar, account dropdown | Register step 1/2, login/register tab switch, mobile sidebar, user menu | live | callers: 2089, 6961–6962, 6980–6982, 6597, 6613, 6616, 6652, many `closeSidebar` / `closeAccountDropdown` calls |
| `nbDoctorCard` | none | unreferenced | `grep -nw nbDoctorCard` over script.js, index.html, er.js, resp.js, ui.js, motion.js, terms.js: only the definition (3451) |

## Declarations
`Called from` lists the callers found by `grep -nw` over all scripts and index.html. "own range" means only lines 3440–4130. State `ns` = nurse session, `obs` = observe session.

| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| NB_IMG | 3440 | const object | Image catalogue (key → local url, Commons page, Arabic alt) | infrastructure (static data) | none | nbImg, 6947 (credits) |
| nbImg | 3441 | function | `<img>` HTML for a key, with `onerror` fallback | presentation | reads NB_IMG | 3500, 3791, 4000 (own range), unreachable 4032, 4052 |
| nbImgFail | 3442 | function | Replace failed image by SVG placeholder div | presentation | DOM only | inline onerror: index.html:289/297/317/341, script.js:4199, nbImg |
| NB_CASE_PHOTO | 3444 | const object | Case id → photo path | infrastructure (static data) | none | script.js:4199 |
| NB_CASE_IMG | 3445 | const object | Nurse case id → NB_IMG key | infrastructure (static data) | none | 4032, 4052 (both dormant) |
| nbLab | 3446 | function | Build lab-row object | domain (data factory) | none | many in NB_DEMOS/NB_NURSE_CASES (2727…) |
| nbLabsTable | 3447–3450 | function | Lab results table HTML (H/L/C flags) | presentation | none | 3500, 3790 |
| nbDoctorCard | 3451–3454 | function | Doctor handoff card HTML | presentation | none | none (unreferenced) |
| nbCaseObj | 3456 | function | Resolve case id in CASES_DB or NB_NURSE_CASES | application | reads CASES_DB, NB_NURSE_CASES | 2306, 2317, 2333, 2485, 5439, 3995 |
| nbTrackOf | 3457–3462 | function | Decide user track (nursing/medicine/null) | domain | reads user fields role, track, specialty | er.js:4248, 4428; script.js 2045, 2247, 2254, 2281, 3470, 3471, 4010 |
| nbLearn | 3463 | function | Get or create `u.learn {obs, guided}` | domain | writes u.learn | 2536, 3464, 3537, 3969, 3993 |
| nbNeedsLearning | 3464–3469 | function | Rule: tier-1 user lacks 2 observations and 1 guided case | domain | reads u via nbBaseTier, nbLearn | 3993 |
| nbGuidedId | 3470 | function | Guided case id per track | domain | reads NB_MED_GUIDED_ID | 3993 |
| nbDemosFor | 3471 | function | Demos for the user's track | application | reads NB_DEMOS | 3993 |
| obs | 3474 | let | Observe session state `{demo, i, auto}` | application (state) | read/write | 3475–3549 |
| obsStart | 3475–3489 | function | Start an observe demo (disabled by early return) | application | writes obs, DOM #obs-* | 4003 |
| obsRenderProg | 3490–3493 | function | Progress dots | presentation | reads obs | 3518 |
| obsNext | 3494–3520 | function | Append next demo step to stream | presentation | reads/writes obs | 3488, 3544, 3549 |
| obsShowCheck | 3521–3542 | function | Two-question check, records `u.learn.obs`, saves account | application | writes authState.user via saveAccountToStorage | 3496 |
| initObserve | 3543–3551 | function | Bind observe buttons, auto-play timer | presentation / browser (timer) | writes obs.auto | 6946 |
| ns | 3554 | let | Nurse session state (see Shared state) | application (state) | read/write | whole engine |
| NR_TABS | 3555 | const | Dock tab labels | presentation | none | 3625 |
| NR_VN | 3556 | const | Vital sign Arabic names | presentation | none | 3505, 3656, 3660 |
| NR_AV | 3557 | const | AVPU Arabic labels | presentation | none | not found in range (only definition); other files not determined |
| nbShuffle | 3558 | function | Fisher-Yates index permutation | domain (random) | Math.random | 3691, 3843, 3893 |
| nrEsc | 3559 | function | HTML escape (& < > ") | presentation | none | many |
| nrActs | 3560 | function | Case actions plus common actions without duplicates | domain | reads NB_COMMON_ACTS | 3892 |
| nrTime | 3561 | function | Virtual clock to HH:MM | domain | reads ns.clock | 3569, 3571, 3605, 3606 |
| nrHas | 3562 | function | Action done (or its alternative done) | domain | reads ns.done, ns.acts | 3659, 3786, 3855, 3877, 3950, 3952 |
| nrAct | 3563 | function | Find action by id | domain | reads ns.acts | many |
| nrSay | 3565–3575 | function | Append chat bubble | presentation | reads ns; DOM #nr-feed | many |
| nrSayHtml | 3576–3580 | function | Append rich bubble | presentation | DOM | 3790, 3791 |
| nrBad | 3581–3586 | function | Route a bad-outcome line to coach/patient/doctor/alarm bubble | presentation | reads ns.osce | 3685, 3812 |
| nrCoach | 3587 | function | Coach bubble unless exam mode | presentation | reads ns.osce | many |
| nrWarn | 3588–3597 | function | Abnormal-vital thresholds (see rules) | domain | none | 3505, 3600; motion.js:339 |
| nrMonitor | 3598–3607 | function | Render vitals grid, clock, note | presentation | reads ns | 3644, 3651, 3686, 3941 |
| nrSideOrders | 3608–3613 | function | Render doctor orders list | presentation | reads ns.c.beats, ns.bi, ns.bdone | 3686, 3775, 3816, 3831 |
| nrDock | 3616–3630 | function | Render question strip, tabs, action chips | presentation | reads/writes ns.tab | 3644, 3651, 3686, 3941 |
| nrNorm | 3631 | function | Arabic text normalisation | domain | none | 3632–3636 |
| nrMatchAsk | 3632–3638 | function | Keyword match free text to patient question | domain | reads ns.c.ask | 3643 |
| nrSend | 3639–3646 | function | Free-text question handler | application | writes ns.asked, ns.clock | 3935–3936 |
| nrAsk | 3647–3652 | function | Ask a canned question | application | writes ns.asked, ns.clock | 3621 |
| nrMissing | 3655–3661 | function | Prerequisite check for an action | domain | reads ns | 3666 |
| nrDoAct | 3662–3672 | function | Dispatch action (seq/calc/chk/plain) | application | reads ns | 3629, 3933, 3934 |
| nrApply | 3673–3687 | function | Apply action effects: clock, vitals patch, med authorisation, safety log | domain / application | writes ns.done, clock, safety, v, shown, news2 | 3671, 3718, 3744, 3759 |
| nrOpenSeq | 3688–3693 | function | Open sequencing overlay | application | writes ns.overlay | 3668 |
| nrOpenCalc | 3694 | function | Open calc overlay | application | writes ns.overlay | 3669 |
| nrOpenChk | 3696 | function | Open checklist overlay | application | writes ns.overlay | 3670 |
| nrChkOverlay | 3697–3721 | function | Render and score safety checklist | presentation + domain (scoring inline) | writes ns.q, ns.safety, ns.overlay | 3724 |
| nrOverlay | 3722–3763 | function | Render and score seq and calc overlays | presentation + domain (scoring inline) | writes ns.q, ns.safety | 3849 |
| nrNextBeat | 3766–3777 | function | Advance to next scenario beat | application | writes ns.bi, stage, authed | 3795, 3796 |
| nrGuide | 3778–3782 | function | Show beat hint in guided mode | presentation | reads ns | 3775 |
| nrCheck | 3783–3795 | function | Beat completion check, post-results, report stage | application | writes ns.stage, postShown | 3686, 3776, 3816 |
| nrEndBeat | 3796 | function | Mark beat done, go next | application | writes ns.bdone | 3794, 3826 |
| nrOrd | 3797–3817 | function | Handle doctor-order response (execute/clarify/refuse) | domain | writes ns.safety, authed, skipped, ordRes, waive | 3853 |
| nrRep | 3818–3827 | function | Handle SBAR report answer | domain | writes ns.repRes, safety, ri | 3860 |
| nrStartHandoff | 3828–3832 | function | Enter handoff stage | application | writes ns.stage, hi, bi | 3768 |
| nrHo | 3833–3841 | function | Handle ISBAR answer | domain | writes ns.hoRes, hi | 3864 |
| nrOptsHtml | 3842–3845 | function | Shuffled option buttons | presentation (random) | writes ns.shuf | 3859, 3863 |
| nrRenderPrompt | 3846–3868 | function | Render current prompt by stage | presentation | reads ns | many |
| nrPinFeed | 3869 | function | Keep feed scrolled to bottom (rAF, image load) | browser | DOM | 3849, 3866 |
| nrRevealPrompt | 3870 | function | Scroll prompt into view on narrow screens | browser | matchMedia | 3849, 3867 |
| nrHint | 3871–3884 | function | Stage-specific hint | application | reads ns | 3937 |
| nurseStart | 3887–3943 | function | Create session `ns`, build room DOM, wire events (disabled by early return) | application + presentation | writes ns, DOM #nurse-* | 3977, 4006, 4039, 4059 |
| nrFinish | 3944–3982 | function | Score session, write history and stats, render report, tier-unlock toast | domain + application + presentation | writes ns.rows, u.history, u.stats, u.learn; storage via saveAccountToStorage | 3840 |
| initNurse | 3984–3986 | function | Bind exit button with confirm() | presentation | none | 6948 |
| renderLearnPath | 3989–4008 | function | Render learning-path card | presentation | reads u.learn | 2410 |
| renderTrackHome | 4009–4043 | function | Track welcome line, chip, nav label (4025–4042 unreachable) | presentation | reads authState.user | 2410 |
| nbRenderOr | 4045–4062 | function | Render periop cards | presentation | reads NB_NURSE_CASES | 4042 (dormant) |
| nbMaybeOnboard | 4063–4072 | function | Open level modal (body disabled) | application | window.__nbOnboarded | 2410 |
| setRegStep | 4074–4081 | function | Toggle registration step UI | presentation | DOM | 6980, 6982 |
| switchAuthModalTab | 4083–4090 | function | Toggle login/register pane | presentation | DOM | 2089, 6961, 6962 |
| openSidebar | 4093–4100 | function | Show sidebar | browser | DOM | 6597, 6613 |
| closeSidebar | 4102–4109 | function | Hide sidebar | browser | DOM | 1955, 1990, 2067, 2074, 6564, 6652 |
| toggleAccountDropdown | 4111–4122 | function | Toggle user menu | browser | DOM | 6616 |
| closeAccountDropdown | 4124–4129 | function | Close user menu | browser | DOM | 1875, 1991, 2066, 2075, 6565, 6580 |

## Shared state, globals and contracts
Defines for others (confirmed callers outside the range): `nbImgFail` (inline onerror, index.html); `nbTrackOf` (er.js:4248, 4428); `nbCaseObj`, `nbLearn`, `nrWarn` (motion.js:339 via `window.nrWarn`, which works because a top-level function in a classic script is a window property); `NB_CASE_PHOTO`, `NB_IMG`; `renderLearnPath`, `renderTrackHome`, `nbMaybeOnboard`; `initObserve`, `initNurse`; the UI helpers `setRegStep`, `switchAuthModalTab`, `openSidebar`, `closeSidebar`, `toggleAccountDropdown`, `closeAccountDropdown`.

Session object `ns` (created at 3892): `c, acts, bi, stage ('acts'|'order'|'report'|'handoff'|'done'), asked, done, shown, authed, skipped, bdone (Sets), v (copy of c.vitals), news2, clock (starts 540 = 09:00), safety[], q{}, ordRes[], repRes[], hoRes[], overlay, tab, osce, waive, postShown, ri, hi, order{measure,proc,med}, shuf, rows`.

Expects from other parts of script.js (all top-level globals): `CASES_DB`, `NB_NURSE_CASES` (2902), `NB_DEMOS` (2671), `NB_COMMON_ACTS` (2894), `nbNews2` (2654), `NB_MED_GUIDED_ID` (2652), `NB_LEVELS` (2140), `nbBaseTier`, `nbUnlockedTier`, `nbLockInfo`, `nbOsceOn`, `nbFilterBar`, `nbFltPass`, `nbGetPlacement`, `nbPlacementKey`, `NB_PLACEMENT_KEY`, `nbOpenLevelModal`, `nbBidi` (4532), `nb8RenderGuide` (6117), `navigateTo`, `showToast`, `safeStorageGet/Set`, `saveAccountToStorage`, `authState`, `openAuthModal`, `startSimulationSession` (4265).

Case object contract read here: `id, title, patient{name,age,bio}, doctor{name,dept}, vitals{hr,bp,rr,spo2,temp,avpu,bg?}, intro, guided, levelLabel, deptName, durationMin, cardSummary, periop, acts[], ask[{id,label,q,a,key,crit}], beats[{sys,doc,ord{a,why,crit,bad,reply},do[],hint,post{labs,img},rep[{q,o[],why,reply,crit[]}]}], handoff{to,items[{q,o[],a,why}]}`. Action fields: `id, g, label, r, rf, min, patch, reveal, requires, alt, unsafe, bad, seq{steps,extra,q}, calc{q,ans,tol,unit,why,crit}, chk{q,items[{t,ok,why,unsafe}]}`. Demo step fields: `w` (labs, image, vitals, nurse, patient, doctor, action, sys, think), `t, why, v, key, cap, labs`; demo: `id, track, who, title, sub, steps, check[{q,o,a}]`.

DOM ids expected: `obs-badge, obs-title, obs-sub, obs-stream, obs-why, obs-check, obs-next, obs-exit, obs-auto, obs-prog, obs-check-res, obs-check-done, nurse-title, nurse-sub, nurse-badge, nurse-body, nurse-exit, home-learn, learn-sub, learn-steps, home-er-card, home-cases-anchor, home-nurse, app-nav-er, app-nav-cases, home-welcome-sub, home-track-chip, or-cards, nurse-cards, nurse-filter, nb-credits, reg-step-1/2, reg-dot-2, reg-bar, reg-error-msg, reg-submit-error, auth-pane-login/register, auth-modal-title, sidebar-backdrop, app-sidebar, account-dropdown-menu, user-menu-btn`. `obs-check-res` and `obs-check-done` were not found in the index.html grep of `id="obs-` (only 793–798 shown); they may be created in the check markup at 3524: not determined. Elements generated by `nurseStart`: `nr-feed, nr-guide, nr-prompt, nr-strip, nr-input, nr-send, nr-vt2, nr-tools, nr-clock, nr-vitbtn, nr-mon, nr-vnote, nr-notes, nr-ordl, nr-hint, nr-tabs, nr-list, nr-pane-mon, nr-pane-act`, plus overlay ids `chk-ok, chk-cancel, seq-pool, seq-mine, seq-undo, seq-cancel, seq-ok, calc-in, calc-ok, calc-cancel`.

## Data, storage and network
- Network: none in this range (no fetch, no XHR). Images are local files (`img/nb/*.jpg`, `img/cases/*.jpg`) with Commons page URLs stored only as credit links.
- Storage: no direct localStorage calls. Indirect: `saveAccountToStorage(u)` at 3537 and 3970 persists the user object; `safeStorageGet/Set(NB_PLACEMENT_KEY ...)` in the disabled `nbMaybeOnboard`; `nbOsceOn()` reads key `nabd_osce` (defined 2498).
- Account fields written: `u.learn = {obs: [demoId], guided: [caseId]}`; `u.history.unshift({caseTitle, mode: 'مسار التمريض (<dept>)', date: ISO date, workupCount: 0, score: '<n>% (مجتاز|غير مجتاز)', caseId, num, passed, mistakes[], osce, ts: Date.now()})` (3967); `u.stats.completed = history.length`, `u.stats.avgSpec = '<n>%'` (3968, overwritten with the latest score, not an average).
- Timers: `setInterval` 4500 ms auto-play (3549); `setTimeout 500` for the unlock toast (3980); `requestAnimationFrame` in 3719, 3869, 3870.
- Audio: none. History API: none directly (`navigateTo` is outside the range).
- `window.__nbOnboarded` global flag (4069, dormant).

## Calculations and rules worth pinning with a golden-master test
| Name | Lines | Inputs | Output | Randomness / time |
|---|---|---|---|---|
| nbTrackOf | 3457–3462 | user `{role, track, specialty}` | 'nursing' / 'medicine' / null (professor or no user → null; `practitioner` → nursing; specialty starting with "الطب" → medicine; else nursing) | none |
| nbNeedsLearning | 3464–3469 | user | true if base tier is 1 and fewer than 2 observed or 0 guided | none |
| nrWarn | 3588–3597 | vital key, value | 'warn' or '': hr >110 or <50; bp systolic <100 or >=160; rr >=22 or <=11; spo2 <=94; temp >=38 or <=36; avpu != 'A'; bg <70 or >250 | none |
| nrNorm / nrMatchAsk | 3631–3638 | free Arabic text, case ask[] | best question by token count (tokens >2 chars, stop words removed, prefix ال/و/ب/ل stripped, substring match on label+q); needs score >=1; first best wins on ties | none |
| nrMissing | 3655–3661 | action, session | prerequisite label or ''; `news2` requires hr, bp, rr, spo2, temp, avpu all shown | none |
| nrApply (med authorisation) | 3673–3687 | action, session | adds safety text when a non-`unsafe` med has no authorisation (`authed` has id or alt) | none |
| Sequence scoring | 3736–3748 | mine[], steps | `q = max(0, matches/n − 0.15 × wrongExtras)`; perfect = all in order, no extras, length n; unsafe extras push to `ns.safety` | shuffle order only affects display |
| Calc scoring | 3754–3760 | number, `ans, tol` | correct if `abs(v−ans) <= tol`; q=1/0; `crit` pushed when wrong | none |
| Checklist scoring | 3707–3718 | marks per item | q = right/total; missed real defect pushes `it.unsafe`; false alarm gives only a note | none |
| nrOrd | 3797–3817 | choice 0/1/2, `o.a` | `safeOrder = o.a===0`; ok if (safe and choice 0) or (unsafe and choice != 0); unsafe order executed pushes `o.crit` and sets `waive`, `skipped` | none |
| nrRep / nrHo | 3818–3841 | option index | ok only for index 0 (report) or `it.a` (handoff); report option 0 is always correct in data, options are shuffled for display | shuffle (Math.random) |
| nrFinish score | 3944–3962 | session | rows weights: history 20, procedures 25, orders 25, SBAR 15, ISBAR 15 (only rows with data count); `raw = sum/max×100`; unasked critical questions add safety errors; `total = clamp(round(raw − 15×uniqueSafety), 0, 100)`; `passed = total>=70 && no safety errors`; unlock toast if tier rises | date from `new Date()` and `Date.now()`; virtual clock fixed at 09:00 + action minutes |
| nbShuffle | 3558 | n | random permutation | `Math.random` (needs a seam for tests) |

## Problems
| Severity | Kind | Evidence |
|---|---|---|
| high | dead-code | `obsStart` (3476) and `nurseStart` (3888) return immediately; ~14 + ~55 lines unreachable. `renderTrackHome` 4025–4042 and `nbMaybeOnboard` 4065–4072 are unreachable after `return`. The whole nursing engine (~700 lines) cannot run from the UI today; any test must call the internals directly |
| high | architecture | One global mutable session `ns` (3554) and `obs` (3474) are read and written by ~50 functions that mix scoring, DOM building and storage (`nrFinish` 3944–3982, `nrOverlay` 3722–3763). Domain scoring cannot be reused or tested without the DOM |
| medium | bug | `nrFinish` uses `authState.user` without a null check (3964–3968): `u.history` throws if the user logged out mid-session |
| medium | bug | `u.stats.avgSpec` is set to the latest score, not an average (3968); the name says average. Intended behaviour: not determined |
| medium | maintainability | Hidden-by-CSS plus early-return pattern: the same feature is disabled in three places (index.html hidden class, `scope.css:31`, JS `return`), so re-enabling needs all three |
| medium | maintainability | Block of unrelated helpers at the end of the range (registration step, auth tab, sidebar, dropdown 4073–4129) sits inside the nursing section; they are live and used by other flows |
| low | security | `nbDoctorCard` (3453), `nbLabsTable` (3449), `obsShowCheck` (3524), `nbImg` (3441) interpolate case/demo text without `nrEsc`; today the data is static and in-repo, so no user input reaches them. `nrSay` correctly uses `textContent` |
| low | security | Credits at 6947 build links from `NB_IMG[].page` into innerHTML; static data, escaping not verified |
| low | duplication | Card HTML at 4032 and 4052 is duplicated; `nrSay` has a no-op ternary (`'إجراء' : 'إجراء'`, 3569); `nrRenderPrompt` and `nrCheck` call each other indirectly; `obsRenderProg` has unused `const n` (3491) |
| low | dead-code | `NB_AV` (3557) and `nbDoctorCard` (3451) have no reference found in this range or in the files searched; `NB_CASE_IMG` is used only by dormant code |

## Proposed source fragments
All ranges were validated with `check-fragment.mjs` (all `ok`). Starting lines are in `.work/script-cuts.txt`.

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | nursing-image-catalogue.js | 3440–3440 | `NB_IMG` data literal | infrastructure |
| 2 | nursing-image-helpers.js | 3441–3445 | `nbImg`, `nbImgFail`, case photo maps | presentation |
| 3 | nursing-lab-doctor-views.js | 3446–3455 | lab factory, lab table, doctor card HTML | presentation |
| 4 | track-and-learning-rules.js | 3456–3472 | case lookup, track rule, learning progress rules | domain |
| 5 | observe-expert-view.js | 3473–3552 | observe session, rendering, check, init | presentation |
| 6 | nurse-room-state-and-render.js | 3553–3614 | `ns`, constants, clock, bubbles, warn thresholds, monitor | application |
| 7 | nurse-room-dock-and-actions.js | 3615–3687 | dock, free-text matching, ask, action dispatch and apply | application |
| 8 | nurse-room-overlays.js | 3688–3764 | sequence, calculation, checklist overlays and scoring | presentation |
| 9 | nurse-room-beat-flow.js | 3765–3885 | beats, orders, SBAR, handoff, prompt rendering, hints | application |
| 10 | nurse-room-start.js | 3886–3943 | `nurseStart` session creation and room DOM | application |
| 11 | nurse-room-finish.js | 3944–3987 | `nrFinish` scoring and report, `initNurse` | domain |
| 12 | home-learning-and-track.js | 3988–4043 | learning-path card, track home | presentation |
| 13 | operating-room-cards.js | 4044–4062 | periop card list | presentation |
| 14 | onboarding-level-prompt.js | 4063–4072 | `nbMaybeOnboard` | application |
| 15 | auth-modal-steps.js | 4073–4091 | registration step, auth tab switch | presentation |
| 16 | sidebar-and-account-menu.js | 4092–4130 | sidebar and account dropdown | browser |

## Open questions
1. Is the nursing track meant to come back (scope.css says "closed while the old rooms are closed")? This decides whether fragments 5–11 and 13–14 are ported or archived.
2. Which UI path calls `nrWarn` through motion.js:339/419 today? Not determined in this range.
3. Is `NB_AV` used by another script or by markup? Not found in the files searched in this range.
4. `u.stats.avgSpec` semantics: latest score or average?
5. Are `obs-check-res` / `obs-check-done` defined in index.html inside `#obs-check` or only created by the template at 3524? Not determined.
6. Should the scoring in `nrFinish` (weights 20/25/25/15/15, 15 points per safety error, pass at 70) be treated as the official rubric, or is it a placeholder?
