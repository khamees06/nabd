# ER room: records column, starting a case, the start briefing, back button, test hook — er.js:4255–4706

Audited at commit 5f431d5 (branch refactor/clean-architecture). All line numbers are er.js unless a file is named.
One browser probe was run against http://127.0.0.1:5180/ (1440x900, demo `med_student`, `/api` = 404, so `api === 'off'`); its results are marked "probe".

## Purpose

This range is the tail of the ER room bundle. It renders the investigations ("Labs") column and turns a click on a test card into an order (4255–4340). It holds `begin()`, the single place where a case is chosen, the per-case state object `E` is created, the room DOM is reset and the animation-frame clock loop is started (4342–4420). It builds and controls the start briefing dialog, which pauses the case clock and carries the doctor/nurse role switch (4422–4561). It wires all room event listeners once (`mount`, 4563–4624), handles the phone back button and the leave-page warning (4626–4657), loads the case file and the offline act model and opens the room (`open`, 4659–4693), and publishes three globals: `window.nbOpenER`, `window.nbErReport`, `window.__nbER` (4695–4705). Line 4706 closes the wrapper function.

## Features and user journeys implemented here

| # | Feature (what the user sees or does) | Lines | Reachability | Evidence |
|---|---|---|---|---|
| 1 | Investigations column: test cards grouped Bedside / Lab / Imaging & ECG, filter buttons (الكل + 3 groups), free-text search (Arabic, English, keywords, group and panel names). Only tests with a result in the case are listed. | 4256–4286, 4604, 4608 | live | probe: 22 cards, headings `Bedside`, `Lab`, `Imaging & ECG` |
| 2 | Card state text: «طلب ←» (not ordered), «بانتظار النتيجة», «النتيجة ←», culture «سُحبت العينة · النتيجة بعد يوم أو يومين»; tick mark; amber dot when out of indication; nurse-scope tag | 4277–4281 | live | probe: after click, card `abg` shows tick + «النتيجة ←» |
| 3 | «Labs» tab counter `(n)` = number of ordered tests | 4288–4291 | live | probe: `(0)` then `(1)` |
| 4 | Click a card = order the test (trainee line «بدي <en>» + result). A card whose result is back scrolls the chat to that result and flashes it for 1.8 s. Nurse mode: click is an attempt routed to `nurseTest`. | 4293–4303, 4328–4340 | live | probe: click on `abg` set `E.started = true`, counter rose |
| 5 | Wide screen (>= 1024px): «Vitals» / «Labs» side tabs switch the panel left of the chat (`#er-grid[data-side]`). Phone: `#er-test` button opens/closes the records sheet (`.is-open`); closing clears the search. | 4311–4326, 4568, 4575 | live | probe: `data-side` `mon` then `labs`; phone path read in code only |
| 6 | Starting a case: case chosen by id (`?case=`, «أعد الحالة نفسها», role switch) or at random without repeats until all were seen; room reset; opening lines (arrival, patient, nurse handoff, companion) | 4344–4420 | live | callers 3946–3947, 4222–4223, 3097, 4686; probe: 5 feed messages at start |
| 7 | Start briefing dialog (doctor version and nurse version): bed, patient, who is in the room, role, steps, tips, «ابدأ الجلسة». Clock paused while open. Reopened any time by the injected «عرض التعليمات» button. | 4437–4561, 4587–4597 | live | probe: dialog shown, `E.paused` true, `E.sim` stayed 0; after «ابدأ» sim advanced; reopening set `paused` true again |
| 8 | Role switch (طبيب / ممرض/ة) inside the briefing, only before the session starts; afterwards a read-only line | 4432–4436, 4548, 4527–4532 | live | probe: switch present at start; after one order replaced by `.er-role-now` |
| 9 | Dialog keyboard handling: Escape closes, Tab cycles role switch and start button, Left/Right arrows change role | 4514–4533 | live | listener attached 4542 |
| 10 | Phone back button: closes the handover sheet, else the records sheet, else goes home with the case kept and a toast; reload/close mid-case asks for confirmation | 4630–4657 | live | probe: `history.state` = `{nbER:1}` after opening |
| 11 | Entering the room: navigate, mount once, wake audio, turn monitor sound on unless muted, load cases + ping + act model + history finder, begin or resume | 4663–4693 | live | `window.nbOpenER` called from index.html:2289, script.js:6095, 6602, 6625 |
| 12 | Re-reading the last ER report from the «debrief» view | 4697–4702 | live | script.js:1978 calls `window.nbErReport()` inside `navigateTo('debrief')` |
| 13 | Doctor's orders box (`#er-ord`, nurse mode) injected above the test list; row click runs `execOrder` | 4578–4586, 4601–4602 | live (nurse role) | probe: `#er-ord` exists (hidden); filling it is outside this range |
| 14 | `window.__nbER` hook | 4704–4705 | live, and used by production code | script.js:6060, 6097; terms.js:82–83 |

Not found in today's UI path: nothing in this range is guarded off. The non-`REAL` branches (4398 role intro line, 4335/4338 without `goResult`) run only in the Node harness (`REAL` false, line 45).

## Declarations

| Name | Lines | Kind | Responsibility | Layer | Shared state read / written | Called from |
|---|---|---|---|---|---|---|
| `PANELS` | 4256 | const array | Arabic names of 5 lab panels (heart, blood, chem, imaging, other); used only for search text | domain (reference data) | – | `panelName` 4265 |
| `recFilter`, `recQuery` | 4257 | let | current filter key and search text of the column | presentation (UI state) | written 4269, 4325, 4370, 4604, 4608 | `buildRecords`, `toggleRecords`, `begin`, `mount` |
| `CATS` | 4263 | const array | 3 groups: key, English label, Arabic label | presentation | – | `buildRecords` |
| `catOf` | 4264 | arrow fn | group of a test; `ecg` forced into `img` | domain (rule) | – | `buildRecords` 4274 |
| `panelName` | 4265 | arrow fn | Arabic panel name by key | presentation | reads `PANELS` | `buildRecords` 4274 |
| `buildRecords` | 4266–4286 | function | render filter buttons and cards; keep keyboard focus across re-render; call `buildLog` | presentation | reads `D.tests`, `E.c.results`, `E.tests`, `recFilter`, `recQuery`; writes `recFilter` | 3516–3517, 4325, 4373, 4604, 4608; exported in hook |
| `buildLog` | 4288–4291 | function | write ordered-test count into `#er-labs-n` | presentation | reads `E.tests` | 4284; exported in hook |
| `goResult` | 4293–4303 | function | scroll chat to a result card and flash it (1.8 s timer); honours reduced motion | presentation / browser | reads `E.tests[id].el` | `panelTest` 4337 |
| `wide` | 4304 | arrow fn | media query `(min-width: 1024px)` | browser | – | 4296, 4307, 4321, 4334, 4339 |
| `autoFocus` | 4307 | arrow fn | focus an element unless narrow + coarse pointer | browser | – | 3757, 3772, 3993, 4011, 4419, 4559, 4688 |
| `setSide` | 4311–4317 | function | set `#er-grid[data-side]` to `mon`/`labs`, update `aria-pressed` | presentation | – | 4321, 4371, 4575; exported in hook |
| `toggleRecords` | 4318–4326 | function | wide: show Labs panel and focus search; narrow: toggle sheet, clear search on close | presentation | reads/writes `recQuery` | 4296, 4334, 4339, 4568, 4606, 4646 |
| `panelTest` | 4328–4340 | function | a card click: mark session started, branch by role and test state, order / re-order / go to result | application | reads `E`, `REAL`; writes `E.started` | `mount` 4605; exported in hook |
| `soundBack`, `lastReport` | 4343 | let | flag "sound was muted by the report, restore at next case"; the `E` whose report is on screen | application state | `soundBack` written 3861, 4347; `lastReport` written 3949, 4225, read 4698 | – |
| `begin` | 4344–4420 | function | choose case, resolve role, create `E`, reset DOM, write opening lines, start clock loop, show briefing | application + domain (state init) + presentation, mixed | reads `D.cases`, `seen`, `roleWanted`, `api`, `tickId`; writes `E`, `seen`, `recFilter`, `recQuery`, `chain`, `apiNoted`, `last`, `tickId`, `soundBack` | 3097 (`setRole`), 3946–3947, 4222–4223, 4686, hook |
| `briefTrack` | 4425–4430 | function | signed-in user's track via script.js `authState` + `nbTrackOf`; `null` on any failure | infrastructure (adapter to script.js) | reads `authState.user` | 4357, 4479 |
| `roleSwitch` | 4432–4436 | function | HTML of the role radio group, or a read-only line once `canSwitch()` is false | presentation | reads `E.role` | 4444, 4487 |
| `briefHtmlNurse` | 4437–4475 | function | HTML of the nurse briefing (scope of practice, steps, tips) | presentation (+ fixed domain text) | reads `E.c`, `E.nurse` | `briefHtml` 4477 |
| `briefHtml` | 4476–4513 | function | HTML of the doctor briefing; role sentence differs for nursing-track users playing the doctor | presentation | reads `E.c` | `showBrief` 4544 |
| `briefKey` | 4514–4533 | function | keydown handler of the dialog (Escape, Tab trap, arrows) | presentation / browser | – | listener 4542 |
| `showBrief` | 4534–4553 | function | create `#er-brief` once, fill it, set `E.paused = true` (unless over), wire buttons, focus start | presentation + application (pause) | writes `E.paused` | 4419, 4596; exported in hook |
| `closeBrief` | 4554–4560 | function | hide dialog, `E.paused = false`, focus input | presentation + application | writes `E.paused` | 4515, 4547; exported in hook |
| `briefOpen` | 4561 | arrow fn | is the briefing visible | presentation | – | 4687 |
| `mount` | 4563–4624 | function | one-time wiring of all room listeners; injects `#er-ord`, `#er-ord-list`, `#er-help`; keeps feed pinned on resize | presentation | writes `recFilter`, `recQuery`; sets `#view-er[data-ready]` | `open` 4668 |
| `backHooked` | 4630 | let | listeners installed once | browser | – | `guardBack` |
| `keepBack` | 4631 | arrow fn | `history.pushState({ nbER: 1 }, '')` | browser | – | 4639, 4645, 4646 |
| `guardBack` | 4632–4640 | function | install `popstate` and `beforeunload` listeners once; ensure one history entry | browser | reads `E.started`, `E.over` | `open` 4679 |
| `onBack` | 4641–4657 | function | back = close sheet / close records / go home + toast | application + presentation | reads `E.over`; writes `window._toastTimer` | `popstate` 4636 |
| `loadAct` | 4660 | arrow fn | fetch `data/er-act.json` (4 s timeout), build `ACT` (gram index map, weights and bias divided by 100) | infrastructure | writes `ACT` | `open` 4682 |
| `load` | 4661 | arrow fn | fetch `data/er-cases.json` once, memoised in `loading`; reset on failure | infrastructure | writes `D`, `loading` | `open` 4681 |
| `open` | 4663–4693 | async function | room entry use case (see feature 11) | application | reads `E`, `ACT`; writes `roleWanted`, `ac` | `window.nbOpenER` |
| `window.nbOpenER` | 4695 | global | public entry | application | – | index.html:2289; script.js:6084–6095, 6602, 6625 |
| `window.nbErReport` | 4697–4702 | global fn | show last ER report if `lastReport === E` and `E.over` | application | reads `lastReport`, `E` | script.js:1978 |
| `window.__nbER` | 4704–4705 | global object | 42 keys (probe): accessors and internals for tests | infrastructure (test seam) | read/write `E`, `D`, `api`, `apiRetryAt`, `roleWanted`, `E.sim`, `E.risk` | Node/browser checks; script.js:6060, 6097; terms.js:82–83 |

## Shared state, globals and contracts

Defined here for others:

| Item | Lines | Consumer |
|---|---|---|
| `window.nbOpenER()` (async, returns nothing) | 4695 | index.html:2289 `onclick`; script.js:6095, 6602, 6625 |
| `window.nbErReport()` → boolean | 4697 | script.js:1978 |
| `window.__nbER` (`.D`, `.E`, `.chatEn`, `begin`, `beginAs`, `role` setter/getter, `api` setter/getter, `jump`, `setRisk`, `end`, `score`, …) | 4704–4705 | script.js:6060 (`.D.cases` reused as the case list), 6097 (`.E.c.id`), terms.js:82–83 (`.chatEn`) |
| DOM created at run time: `#er-brief` (class `er-sheet er-brief-wrap`), `#er-brief-go`, `#er-brief-h`, `#er-brief-now`, `[data-role]` buttons, `#er-ord`, `#er-ord-list`, `#er-help` | 4538–4541, 4580–4591 | motion.js:573 reads `#er-brief` hidden state ("quiet"); er.css:240–261 styles |
| DOM attributes: `#er-grid[data-side]`, `.er-mon[data-run]` (counter, +1 per case), `#view-er[data-rhythm]`, `#view-er[data-ready]`, `#er-test[data-badge]`, `#er-tab-labs[data-badge]`, `.er-p[data-who="n"][data-out]` | 4315, 4396, 4394, 4566, 4391–4392, 4389 | motion.js:370, 413 (`data-run`); er.css |
| Top-level functions used earlier in er.js: `begin`, `buildRecords`, `autoFocus`, `soundBack`, `lastReport` | – | 3097, 3516–3517, 3757…4011, 3861, 3949, 4225 |
| History state shape `{ nbER: 1 }` | 4631 | this range only |

Expected from others:

| Kind | Items |
|---|---|
| er.js top-level state | `D`, `loading`, `api`, `apiNoted`, `apiRetryAt` (22); `E`, `tickId`, `last` (23); `seen` (24); `roleWanted` (28); `ACT` (709); `chain` (1898); `ac` (235) |
| er.js helpers | `$`, `esc`, `norm` (34–37); `pickOf` (40); `testOf` (41); `REAL` (45); `offInd` (48); `NM` (29); `paint` (93); `tick` (136); `person` (611); `nurse` (637); `sys` (641); `timeout` (662); `ping` (695); `loadFind` (738); `send` (1901); `newNurseState` (2477); `nurseTest` (2957); `nurseChips` (3038); `execOrder` (3068); `nurseTag` (3085); `canSwitch` (3091); `setRole` (3092); `orderTest` (3492); `lineOf` (3561); `openEnd` (3724); `OFFLINE_NOTE` (20); plus every name listed in the hook literal (4704–4705) |
| script.js globals (all guarded with `typeof`) | `navigateTo` (script.js:1948; returns `false` only when the view is protected and the user is signed out, 1953–1958), `authState` (1688), `nbTrackOf` (3457) |
| motion.js | `window.nbAudio()` (motion.js:243), the `.er-mon .nb-mon-sound` button and its `aria-pressed` |
| index.html ids | `view-er`, `er-who`, `er-bed`, `er-clock`, `er-grid`, `er-side-tabs`, `er-tab-mon`, `er-tab-labs`, `er-labs-n`, `er-v-bp`, `er-records`, `er-rec-x`, `er-rec-f`, `er-rec-q`, `er-rec-list`, `er-feed`, `er-form`, `er-input`, `er-send`, `er-test`, `er-end`, `er-sheet`, `er-debrief`, `calm-toast`, `calm-toast-text`; selectors `.er-p[data-who="c|n|p|d"] b`, `.er-mon`, `#view-er .er-room`, `#view-er .er-top` |
| Data fields (`data/er-cases.json`) | root `tests[]` {`id`, `ar`, `en`, `group` (bed/lab/img), `kw[]`, `panel`}; root `cases[]` {`id`, `bed`, `nurseMode`, `risk.start`, `patient` {`name`, `age`, `arrival`, `opening`}, `companion` {`name`, `rel`, `start`, `lines.enter[]`}, `nurse` {`name`, `handoff`}, `results[testId].report`}; 6 cases, all with `nurseMode` |
| Data fields (`data/er-act.json`) | `grams[]`, `bias[]`, `w[][]` (integers scaled by 100), other keys spread unchanged |
| `E` fields read | `E.tests[id]` {`back`, `el`, `ind`}, `E.over`, `E.started`, `E.role`, `E.nurse` {`sex`, `doc`}, `E.paused`, `E.comp` |

## Data, storage and network

| Kind | Detail | Lines |
|---|---|---|
| fetch | `data/er-cases.json`, no timeout, no cache option; `!r.ok` throws; memoised promise reset on failure | 4661 |
| fetch | `data/er-act.json`, abort after 4000 ms, no `r.ok` check, failure only `console.warn('er-act', e)`; retried on each `open()` while `ACT` is null | 4660, 4682 |
| network (indirect) | `ping()` (defined 695, calls the chat API with `?ping=1`) awaited together with `load()`; `loadFind()` (738) | 4681, 4685 |
| URL | `?case=<id>` read with `URLSearchParams(location.search)` when a new case starts from `open()`; `location.protocol` checked for `file:` | 4686, 4399 |
| localStorage | read-only `nbSound` (string `'0'` = muted by the trainee; written by motion.js:316) | 4677 |
| sessionStorage | none | – |
| History API | `history.pushState({ nbER: 1 }, '')` (no URL change); `popstate` and `beforeunload` listeners on `window`, never removed | 4631–4639 |
| Timers | `requestAnimationFrame` clock loop, id in `tickId`, cancelled at next `begin` (4345); stops itself when `E.over`; 1800 ms flash timer (4302); 4500 ms toast timer in `window._toastTimer`, shared with script.js:1841 | 4417–4418, 4302, 4654 |
| Time source | `performance.now()` into `last` | 4415 |
| Audio | `AudioContext` from `window.nbAudio()` or a new context; `ac.resume()`; programmatic `.click()` on the monitor sound button (4678, 4347) | 4672–4678 |
| Observers | `ResizeObserver` on `#er-feed` + scroll listener (pinned if within 90 px of the end) | 4614–4619 |
| Media queries | `(min-width: 1024px)`, `(pointer: coarse)`, `(prefers-reduced-motion: reduce)` | 4304, 4307, 4297 |

## Calculations and rules worth pinning with a golden-master test

| Name | Lines | Inputs | Outputs | Randomness / time |
|---|---|---|---|---|
| Initial case state `E` | 4359–4369 | case `c`, resolved role | full literal (about 70 fields): `risk = c.risk.start`, `anx = c.companion.start`, `riskLog = [[0, start]]`, `bp = ['--','--']`, `comp.*` counters, `paused: false`; nurse adds `readAsks = 3` and `E.nurse` | none in the literal; `newNurseState(c)` not audited here |
| Case selection | 4348–4355 | `id`, `D.cases`, `seen` | given id if it exists, else random among unseen; `seen` cleared when all seen; unknown id silently falls back to random | `Math.random` via `pickOf` (40) |
| Role resolution | 4357–4358 | `opts.role`, `roleWanted`, `briefTrack()`, `c.nurseMode` | `opts.role` > `roleWanted` > track (`nursing` → nurse) > doctor; nurse downgraded to doctor if the case has no `nurseMode` | none |
| Opening transcript | 4398–4413 | case, role, `api`, `REAL` | ordered messages: (non-REAL role line), offline note if `api === 'off'` and not `file:`, arrival, patient opening, nurse handoff (nurse mode: handoff spoken by `d` + system line with doctor name and gender), one companion `enter` line | `pickOf` for the companion line |
| Test grouping and visibility | 4264, 4274 | test `{id, group}`, `E.c.results`, filter, query | `ecg` → `img`; listed only if the case has a result; search over `ar`, `en`, `kw`, both group labels, panel name, all through `norm` | none |
| Card state | 4277–4281 | `E.tests[id]` {`back`, `ind`}, result `report` | one of 4 states; `incubating` when `back` and report matches `/incubat/i`; `is-off` when `offInd` | none |
| Card click decision | 4328–4340 | `E.over`, role, `E.tests[id]`, `REAL` | nurse → `nurseTest`; new → say + `orderTest(id,'','',true)`; back + real page → `goResult`; otherwise `orderTest` again; always sets `E.started = true` | none here |
| Clock pause | 4417, 4546, 4558 | `E.paused`, `document.hidden`, view hidden | `tick(now)` only when not paused, tab visible and `#view-er` shown; otherwise `last = now` (no time jump) | `requestAnimationFrame` timestamp |
| Role-switch window | 4434 with `canSwitch` 3091 | `E.over`, `E.started`, `E.turns`, `E.sim` | switch offered only if not started, 0 turns, `sim < 0.05` | sim time |
| Leave-page warning | 4637 | `E.started`, `E.over` | prompt only for a started, unfinished case | none |
| Back-button order | 4645–4647 | sheet open, records open | close sheet → close records → home | none |
| Act model decoding | 4660 | `grams`, `bias`, `w` | `index` Map gram → position; `bias` and `w` divided by 100 | none |
| `nbErReport` guard | 4698 | `lastReport`, `E` | true only if the finished case is still the current `E` | none |

## Problems

| Severity | Kind | Evidence |
|---|---|---|
| high | data-exposure | `window.__nbER` is published on the production page (4704–4705). `get E()` returns the live case including `E.c` (the case file with `dx`, `dispo`, `care`, `teach`), `get D()` all cases, and `setRisk`, `jump`, `end`, `score`, `set api` change the session from the console. Probe: 42 keys present for a demo student. |
| high | architecture | The "test hook" is also a production dependency: script.js:6060 reads `__nbER.D.cases`, 6097 reads `__nbER.E.c.id`, terms.js:82–83 calls `__nbER.chatEn`. It cannot be removed or test-gated without replacing these three uses. |
| high | architecture | `begin` (4344–4420) mixes case selection, role rule, domain state construction, about 25 direct DOM writes, transcript output, the clock loop and the briefing. No part can be tested without the DOM except through the Node fake document (`REAL` false). |
| medium | bug | `open()` wraps `begin()` in the same `try` as loading (4680–4692): any exception thrown while starting a case is shown as «تعذّر تحميل الحالات. تحقق من الاتصال» and replaces the feed. |
| medium | bug | `begin` is exported as `begin: id => begin(id)` and called from `setRole`; an unknown `?case=` id (4686) or hook id falls back to a random case without notice (4349–4354). |
| medium | maintainability | The clock can be paused by the trainee at any time: «عرض التعليمات» → `showBrief` sets `E.paused = true` (4546, 4596); probe confirmed mid-session. Whether this is intended for scoring of timing is not stated in the code. |
| medium | duplication | `briefHtmlNurse` (4437–4475) and `briefHtml` (4476–4513) repeat header, «ما تعرفه الآن», patient/companion rows, two tips, disclaimer and footer. The role intro text exists a third time at 4398 (Node harness only). |
| medium | duplication | Toast code in `onBack` (4649–4655) repeats script.js:1836–1842 (`showToast`), sharing `window._toastTimer`. |
| medium | architecture | `mount` creates `#er-ord`, `#er-ord-list`, `#er-help` at run time "because index.html is not edited by er.js work" (4570–4597); these ids are part of the page contract but absent from index.html. `showBrief` likewise creates `#er-brief` (4538). |
| medium | architecture | Cross-script coupling through free globals guarded by `typeof`: `authState`, `nbTrackOf`, `navigateTo` (4427–4428, 4647, 4664, 4698); and through simulated clicks on motion.js's sound button (4347, 4678). |
| low | bug | `buildRecords` builds a CSS selector from `dataset` values without escaping (4272) and calls `$('er-records').querySelector` without a null check (4285); `data-t="${t.id}"` and `data-f` are not passed through `esc` (4270, 4281). Values come from the project's own JSON. |
| low | bug | `loadAct` has no `r.ok` check (4660): a 404 HTML body fails in `r.json()` and is only logged; the offline act model is then silently absent. `load` has no timeout (4661). |
| low | maintainability | `seen` (no-repeat memory) lives in page memory only (24, 4351–4355); a reload restarts the rotation. `lastReport`, `soundBack` are module-level flags set in other parts of the file (3861, 3949, 4225). |
| low | maintainability | `PANELS` (4256) is kept only to add Arabic panel names to the search haystack (4265, 4274); the header comment still names it "records column" although the order log was removed (4287). `buildLog` now only writes a counter. |
| low | maintainability | Gendered fixed text: «المشرفة التمريضية», «الممرضة» are always feminine (4449, 4492, 4407) while the doctor's gender follows `E.nurse.sex`. |
| low | bug | `popstate`/`beforeunload` listeners are global and permanent (4636–4637); `onBack` returns early only if `#view-er` is hidden. `history.pushState` entries accumulate one per close-sheet action (4645–4646). |
| info | observation | Probe: dialog heading rendered as «حالتك في غرفة الـER» while the source says «غرفة الطوارئ» (4441, 4484); the text is rewritten after render by another script (terms.js not audited here). |

## Proposed source fragments

All ranges validated with `check-fragment.mjs … --iife` (all `ok`). Start lines are in `.work/er-cuts.txt`.

| Order | File name | From–to | Single responsibility | Layer |
|---|---|---|---|---|
| 1 | `er-records-list.js` | 4255–4303 | Investigations column: groups, filter/search state, card rendering, counter, go-to-result | presentation |
| 2 | `er-records-panel.js` | 4304–4341 | Screen-width helpers, side panel switch, records sheet toggle, card click → order | presentation / application |
| 3 | `er-case-begin.js` | 4342–4421 | `begin`: case choice, role, `E` creation, room reset, opening lines, clock loop | application (+ domain state init) |
| 4 | `er-brief-content.js` | 4422–4513 | Briefing content: track lookup, role switch HTML, nurse and doctor briefing HTML | presentation |
| 5 | `er-brief-dialog.js` | 4514–4562 | Briefing dialog behaviour: keyboard, show (pause), close (resume), open test | presentation / browser |
| 6 | `er-mount.js` | 4563–4625 | One-time listener wiring and injected DOM parts | presentation |
| 7 | `er-back-button.js` | 4626–4658 | History entry, back-button handling, leave-page warning | browser |
| 8 | `er-open.js` | 4659–4694 | Loading cases and act model; `open` use case | infrastructure / application |
| 9 | `er-public-api.js` | 4695–4705 | `window.nbOpenER`, `window.nbErReport`, `window.__nbER`. Ends at 4705; line 4706 `})();` is the bundle suffix that closes the wrapper | infrastructure (public surface) |

## Open questions

1. Is pausing the case clock by reopening the briefing mid-session intended (4546), given that timing is scored elsewhere in er.js?
2. Should `window.__nbER` stay on production pages? If not, script.js:6060, 6097 and terms.js:82 need a supported public interface (case list, current case id, `chatEn`).
3. `newNurseState`, `canSwitch`, `setRole`, `nurseTag`, `orderTest`, `tick`, `paint` are outside this range; their behaviour was not audited here.
4. Phone layout (records sheet, back button, coarse-pointer focus rule) was read in code only; not exercised in a narrow viewport.
5. After a failed `loadAct` the offline reader behaviour without `ACT` is not determined in this range (`actRetried`, line 709, is outside it).
6. Which script rewrites «الطوارئ» to «الـER» in the briefing heading, and whether that is intended for dialog headings, is not determined here.
