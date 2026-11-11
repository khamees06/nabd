# Existing ER test tooling (outside the repository)

Scope: `C:/Users/ss/nabd-model/lang` (read-only). Audited 2026-11-11 against the checkout `C:/Users/ss/nabd-refactor` (commit 5f431d5).
Line numbers: `er.js:N` is the checkout's `er.js`; `harness:N` is `nabd-model/lang/harness-er.js` (123 lines).

Verified identity of inputs (SHA-1 after removing CR): `er.js`, `data/er-cases.json`, `data/er-act.json`, `data/er-find.json`, `data/er-lang.json` are identical in the checkout and in `C:/Users/ss/OneDrive/Desktop/nabd` (the harness default root). Results below therefore hold for both.

## How the harness works

| Topic | What the harness does | Where |
|---|---|---|
| Site root | `NB_ROOT` environment variable; default `C:/Users/ss/OneDrive/Desktop/nabd`. Reads `er.js`, `data/er-cases.json`, `data/er-act.json` once at module load; `data/er-find.json` on demand. | harness:3-6, 59 |
| Loading er.js | `vm.createContext(sandbox)`, then `vm.runInContext(SRC)`. The script is run unchanged. `sandbox.window = sandbox`, so `window.__nbER`, `window.nbOpenER`, `window.nbErReport`, `window.nbErVitals` land on the sandbox. | harness:33-52 |
| Globals supplied | `document`, `console` (error is collected in `room.errors`, warn dropped, log passed through), `location {hostname, protocol:'https:', search:''}`, `URLSearchParams`, `performance.now`, `requestAnimationFrame`, `cancelAnimationFrame`, `AbortSignal.timeout`, `fetch`, `setTimeout`, `clearTimeout`. | harness:35-45 |
| Globals NOT supplied | `navigateTo`, `authState`, `localStorage`, `AudioContext`, `nbAudio`, `history`, `matchMedia`, `ResizeObserver`, `document.body`, `document.addEventListener`, `document.activeElement`. er.js guards each with `typeof`/`try`/`REAL`. | er.js:45, 4232, 4664-4677 |
| Fake DOM | Class `El`: `children`, `dataset`, `textContent`, `innerHTML` (string only, never parsed), `hidden`, `disabled`, `value`, `classList` (Set), `listeners` (stored, never dispatched), `onclick`, `attrs`. `getElementById(id)` creates the element on first use, so it never returns null. `querySelector(sel)` returns a created element keyed `qs:<sel>`, except `.er-mon` which returns null. `querySelectorAll` returns `[]`. An element's own `querySelector` returns a fresh throwaway element. | harness:10-21, 27-33 |
| Consequence of string-only innerHTML | Clicks on rendered rows cannot be simulated (no child nodes, no `closest`). Suites call the hook instead (`N.send`, `N.execOrder`, `N.panelTest`). Only two real listeners are invoked: `er-end` click and `er-end-go.onclick` (the handover sheet). | harness:105-118 |
| Time: the clock | `performance.now()` returns `room.now` (starts at 1000 ms). `requestAnimationFrame(f)` stores `f`; nothing runs until the test calls `frame(ms)`, which adds `ms` to `now`, fires due deferred fetch answers, then calls the stored callback once. er.js converts the frame delta to simulated minutes in `tick` (er.js:136-142, `dt` capped at 2 s, `PACE = 1`). | harness:37-39, 88-92 |
| `real(seconds, step=100)` | Advances wall time by `seconds` in 100 ms frames; yields to the microtask queue every 5 frames (`tickle`). | harness:93 |
| `simTo(min)` | Runs 100 ms frames until `E.sim >= min` or the case is over (cap 200,000 frames). | harness:94 |
| `tickle(n)` | `n` rounds of `setImmediate`, to let promise chains settle. Not time; it only drains async work. | harness:87 |
| Real timers | `setTimeout`/`clearTimeout` are Node's real ones. er.js uses `setTimeout` at 662 (only when `AbortSignal.timeout` is missing; the harness supplies it), 4302 (1.8 s CSS flash) and 4654 (toast). Whether 4302/4654 are reached in a harness run: not determined. They only touch `classList`. Suites end with `process.exit`, so a pending real timer does not delay them. | er.js:662, 4302, 4654 |
| `Date.now` | Not replaced by the harness. er.js uses it for the API retry gate (666, 672-673), the ping cache-buster (695) and the saved record timestamp (4240). Only `golden-doctor.js` pins it (`Date.now = () => 1.7e12 + room.now`). | golden-doctor.js `play()` |
| Randomness | `mulberry(seed)` (32-bit PRNG) replaces `Math.random` inside the vm context before er.js runs. Default seed 1; every suite passes its own. | harness:8, 47-50 |
| Random draws in er.js | 8 call sites: `pickOf` (40: line choice, first case choice), `wobble` (92: monitor digits, 3 draws per `paint`), companion break-ins (3641-3659). Order of draws depends on frame cadence (paint every 0.12 sim-min). | er.js:40, 92, 3641-3659 |
| Server mock: data | `fetch('data/er-cases.json' / 'er-act.json' / 'er-find.json')` served from `NB_ROOT`. | harness:57-59 |
| Server mock: ping | URL containing `ping=` resolves `{ok:true}` if `room.responder` is set, otherwise rejects. With no responder, er.js `ping()` sets `api='off'` at open (er.js:695). | harness:60 |
| Server mock: POST | Body is parsed and pushed to `room.posts` (`{at, simAt, body}`). If `room.responder` exists its return value is the response; it may return `{hang:true}` (rejects after the request's timeout on the fake clock), `{after:ms, res}` (answers late or times out), `{reject:msg}`, or a response object `{ok,status,json()}`. With no responder every POST rejects ("stub dead"). The URL is not checked. | harness:61-72 |
| "api modes" | The constructor options `api` (default `'dead'`) and `latency` are stored and never read. The real switch is er.js's own state `api` = `'try' | 'on' | 'off'` (er.js:22), set through the hook: `r.N.api = 'off'` forces the offline reader and loads the finding model. Online behaviour = set `room.responder` before `open()`. | harness:23-24; er.js:4704 |
| Opening a room | `open(id, {role})`: sets `N.role`, calls the real `nbOpenER()` (mount, ping, load data, `begin()` with a seeded random case), then `N.begin(id)` for the requested case. Two `begin` calls happen per room. | harness:76-85 |
| Sending | `say(text, gap)`: `N.send(text)`, drain, optionally `real(gap)`; returns the new feed lines. | harness:95-101 |
| Reading output | `feed()` = children of `er-feed` as `{k: class, t: text without tags}`; `debrief()` = text of `er-debrief`; `state()` = snapshot of `E` (see golden-master section); `orders()`, `exec(kind,id)` for nurse mode. | harness:102-121 |

### What `REAL === false` means

`REAL` (er.js:45) is true only when `document.body` exists and `document.addEventListener` is a function. The fake document has neither, so in every harness run these branches are NOT executed (or a harness-only variant runs instead):

| er.js line | Real-page behaviour not exercised | Harness-only behaviour |
|---|---|---|
| 592 | `chatEn()` applied to displayed lines of English-speaking roles | feed keeps the engine's Arabic text (suite 19 calls `chatEn` directly) |
| 3056 | focus restored to the same order row after the order list is rebuilt | - |
| 3541 | test card header shows English name only | header shows Arabic + English |
| 4334, 4337 | nurse-mode line uses the English test name; `goResult()` scroll/flash to an existing result | Arabic test name |
| 4396 | monitor `data-run` counter bump | - |
| 4398 | - | an extra system intro line is added to the feed (`if (!REAL) sys(...)`) |
| 4535-4560 | start briefing dialog (`showBrief`), role choice inside it, `E.paused` clock stop, `closeBrief` | `showBrief()` returns false; clock runs from `begin` |
| 4573-4597 | injection of the orders box `#er-ord` and the help button `#er-help`; side-tab click listener | - |
| 4611-4623 | `ResizeObserver` scroll pinning; send-button focus keeping | - |
| 4667 | `roleWanted` reset on each entry from home | harness sets the role itself |
| 4679, 4631-4647 | `guardBack()`: `history.pushState` / `popstate` leave-guard | - |

Also never executed in the harness, independent of `REAL`: audio (`ac` is null, er.js:4672-4674), the sound preference read from `localStorage` (4677), the hidden-tab pause (`document.hidden` is always false, 4417), `save()` into `authState.user` (returns at 4233), `navigateTo` calls, all listeners registered with `addEventListener` except the two named above, and anything that needs parsed HTML.

## Suites

All harness suites were run on 2026-11-11 with `cd C:/Users/ss/nabd-model/lang && NB_ROOT=C:/Users/ss/nabd-refactor node <file>`. No network call is possible in them (fetch is the stub). "Checks" is the count printed by the suite.

| File | What it covers | Checks | Result against the checkout |
|---|---|---|---|
| audit-fix-test.js | doses with orders, orders outside the case, repeats, VT and shock, PE lysis by pressure, the ending, offline drug words that are not orders, penicillin spellings, anaphylaxis, facts only when heard, API retry note | 109 | 109 passed, 0 failed |
| audit-fix-test-2.js | second-round fixes of the same areas (online via scripted responder + offline) | 68 | 68 / 0 |
| audit-fix-test-3.js | oxygen effect on vitals, untreated pace, on-time care, nurse proposals and one "yes", instant tests in the records column, supervisor handover prompt | 53 | 53 / 0 |
| audit-fix-test-4.js | re-check fixes of round 3 | 27 | 27 / 0 |
| audit-fix-test-5.js | DKA and hypertension cases, the finding reader | 34 | 34 / 0 |
| audit-fix-test-6.js | second clinical check of DKA and hypertension | 15 | 15 / 0 |
| audit-fix-test-7.js | companion and nurse timing over whole scripted cases (uses `companion-eval.js`, same folder) | 223 | 223 / 0 |
| audit-fix-test-8.js | fixes from the paid live run of 2026-11-07 (scripted reader) | 15 | 15 / 0 |
| audit-fix-test-9.js | student/nurse user-test fixes; `bidi` helper evaluated from source text; ping is uncached | 15 | 15 / 0 |
| audit-fix-test-10.js | offline reader: question marks, several questions, shorthand and plural orders, forms of address | 45 | 45 / 0 |
| audit-fix-test-11.js | offline replies of supervisor and nurse | 11 | 11 / 0 |
| audit-fix-test-12.js | out-of-indication tests, handover justification, grading with/without accepted justification, briefing never blocks the harness | 47 | 47 / 0 |
| audit-fix-test-13.js | nurse mode: scope, escalation + SBAR, orders from case data with doses, executing orders, allergy checks, reassessment, failure paths, handover/report, role switch, all 6 cases end to end; section 0 is a static scan of `er.js` text | 436 | 436 / 0 |
| audit-fix-test-14.js | nurse mode review fixes (calling the doctor, SBAR B, allergy question, short order names, carriers, airway, PE collapse, report credits, optional orders) | 118 | 118 / 0 |
| audit-fix-test-15.js | doctor-room chat coherence; spawns `eval-chat-bank.js` and applies thresholds; online path with mocked server | 96 | 96 / 0 (38 s) |
| audit-fix-test-16.js | "answers the current message" cases; safety around stray "yes" | 33 | 33 / 0 |
| audit-fix-test-17.js | plain history questions with no case line; room questions | 23 | 23 / 0 |
| audit-fix-test-18.js | nurse proposal wording, late yes, online skip rule (mock server) | 32 | 32 / 0 |
| audit-fix-test-19.js | `chatEn` term conversion called directly; Labs count; `setSide` exported | 121 | 121 / 0 |
| replay-live-chat.js | replays recorded server answers (`live-chat-2026-11-08.json`) through the responder; 3 sessions | 7 | 7 ok; 20 recorded answers used, 0 missing, 0 errors |
| replay-live-chat-2.js | same for `live-chat-2-2026-11-08.json` | 5 | 5 ok; 11 used, 0 missing, 0 errors |
| eval-nurse-route.js | nurse-mode routing of 70 phrasings (offline `localRead`) | 70 | self 29/29, nurse 16/16, supervisor 10/10, patient 9/9, companion 6/6 |
| golden-doctor.js (+ golden-doctor.json) | fixed 40-message script x 6 cases x {offline, stub online}; saves feed, chat, debrief text, debrief HTML, request bodies, done ids, outcome, errors; deep-compares with a stored file | 12 rooms x 8 fields | Against stored `golden-doctor.json` (dated 2026-11-07 20:36): **54 differences** (feed 12, chat 12, debrief 12, html 12, posts 6; `done`, `outcome`, `errors` equal in all 12 rooms). Two fresh runs against the checkout: byte-identical (same SHA-1), "identical (12 rooms)". The stored file predates the 2026-11-08 chat changes. |
| eval-orders.js | `localRead` action ids for `test-orders.json` rows (absolute paths hard-coded) | 86 rows | order_dose 29/30, order_wrong_dose 12/12, order_no_dose 12/12, prohibition 12/12, history 12/12, mixed 7/8 (84/86). No pass threshold in the script. |
| eval-chat-bank.js | 471 doctor-room messages: read / room / busy-room, plus 68 dialogue turns | 471 + 68 | read 471/471, room 470/471, busy 470/471, dialogues 68/68, stale reminders seen 2. A measurement; thresholds live in suite 15. |
| parity-test.mjs | JS `readAct` vs Python predictions in `parity.json`; extracts code from `er.js` by text; path hard-coded to the Desktop copy (ignores `NB_ROOT`) | 435 rows | same 435 of 435 (Desktop copy, identical to the checkout). Prints "tau undefined": the model file has no `tau` field. |
| fix-test.mjs | dialect filter `jordanian()` extracted by regex from `Desktop/nabd/api/er-chat.js` + `data/er-lang.json`; hard-coded paths | 62 | checked 62, failed 0 |
| api-nurse-test.mjs | `api/er-chat.js` handler with a fake Anthropic client (source rewritten, no key, no network); compares with an old snapshot | not counted | **not run**: the default old snapshot folder `<scratchpad>/pre-chat-fix/api` exists but is empty; the script also writes rewritten copies into `<scratchpad>/api-mock`. |
| eval-route.js | routing over persona files | - | **not run**: persona folder is empty (see below). |
| run-persona.js | plays a persona script; `offline` mode uses the harness; `live` mode POSTs to the deployed paid API (ledger-capped) | - | **not run**. `live` mode must not be used. |
| run-all-suites.sh | runs all of the above plus fuzz, personas and nurse-shots; writes `summary.txt` | - | not run as a whole (see missing helpers). |

Total for audit-fix-test 1-19: 1,521 checks, 0 failed.

Exit codes: suites 1-12 call `process.exit(0)` even when checks fail; 13-18 exit 1 on failure; 19 has no explicit exit; `run-all-suites.sh` records only the last two log lines. A CI wrapper must parse `passed N failed M`.

Helper inputs named by `run-all-suites.sh`, `eval-route.js`, `api-nurse-test.mjs` (all under one session scratchpad, `C:/Users/ss/AppData/Local/Temp/claude/2a8a33095be139b1/c55bea31-.../scratchpad`):

| Path | State on 2026-11-11 | Effect |
|---|---|---|
| `verify-engine/fuzz.js` | folder exists, empty | fuzz step fails |
| `personas/*.json` | folder exists, empty | persona step is a no-op; `eval-route.js` reports 0/0 |
| `chat-scripts/*.json` | folder exists, empty | same |
| `rv/nurse-shots.mjs` | folder exists, empty | nurse screenshot step fails |
| `pre-chat-fix/api/er-chat.js` | folder exists, empty | `api-nurse-test.mjs` cannot load its comparison file |

## Determinism

| Reproducible because | Evidence |
|---|---|
| `Math.random` is a seeded PRNG inside the sandbox | harness:47-50 |
| Time is advanced only by `frame()`; the same sequence of `real`/`simTo`/`say` calls gives the same `E.sim` | harness:88-94 |
| No network: every fetch is answered by the stub or by a scripted responder | harness:56-74 |
| One fresh vm context per `Room`; module state of er.js is not shared between rooms | harness:46 |
| Measured: two `golden-doctor.js` runs produced byte-identical 846 KB outputs | this audit |

| Not controlled | Effect |
|---|---|
| `Date.now()` is the real clock (except in `golden-doctor.js`) | After the API goes off, the retry gate (er.js:666-673) depends on wall time: a suite that takes more than 60 s of real time inside one room could see a retry. The ping URL carries a real timestamp (suite 9 checks only its shape). |
| Real `setTimeout` at er.js:4302, 4654 | Class changes only; not on the fake clock. |
| The random sequence is shared by display wobble, line choice and companion break-ins | Any change in frame step, in the number of `paint` calls, or one extra `pickOf` shifts every later draw. Text-level goldens are therefore sensitive to changes that are clinically neutral. |
| `tickle()` uses `setImmediate` rounds as "enough" settling | Deep promise chains (online path) rely on the default 12 rounds; not a proof of quiescence. |
| `eval-chat-bank.js` output file contains `at: new Date().toISOString()` | Output differs per run in that field. |
| `api-nurse-test.mjs` uses unseeded `Math.random` for the fake client IP | Only affects rate-limit keys. |
| Hard-coded absolute paths (`eval-orders.js`, `eval-route.js`, `parity-test.mjs`, `fix-test.mjs`, `api-nurse-test.mjs`, `run-all-suites.sh`) | These ignore `NB_ROOT` in whole or part; they test the Desktop copy and one user's temp folder. |

## What can serve as a golden master for a C# port of the clinical core

### The test hook `window.__nbER` (er.js:4704-4705)

| Member | Kind | Target in er.js (line) | Layer |
|---|---|---|---|
| `begin(id)`, `beginAs(id, opts)` | start a case | `begin` 4344 | application |
| `role` (set: wanted role; get: `E.role`), `setRole` | role | 3092 | application |
| `nurse` (get `E.nurse`) | nurse-mode state | - | domain state |
| `E` (get) | whole session state object | 4359 | domain state |
| `D` (get) | loaded case data | - | infrastructure |
| `api` (get/set; set `'off'` also loads the finding model) | server state | 22, 4704 | infrastructure |
| `send(text)` | one trainee message, full pipeline | 1901 | application |
| `localRead(text)` | offline reader: addressee, facts, actions, tests, tone | 1090 | domain (language rules) |
| `readAct(text)`, `readFinding(text)` | linear model inference (act, history finding) | 725, 743 | infrastructure (model execution) |
| `doseOf`, `doseIn`, `doseCheck`, `doseBad` | dose parsing and range check | 785, 802, 804, 2428 | domain |
| `allergicTo` | allergy rule | 2387 | domain |
| `modsNow()`, `live()` | treatment modifiers and current vitals | 72, 80 | domain |
| `jump(min)`, `setRisk(r)` | test-only: move `E.sim`, set `E.risk` | 4704 | test aid |
| `orderTest`, `panelTest` | order a test (chat path / panel path) | 3492, 4328 | application |
| `execOrder`, `releaseOrders`, `buildOrders`, `nurseAct`, `nurseTest`, `escBy`, `gradeSbar`, `strip` (= `forNurse`) | nurse mode: carry out an order, release orders, render them, own acts/tests, escalation, SBAR grading, text adaptation | 3068, 2761, 3046, 2842, 2957, 2503, 2521, 32 | domain / application (`buildOrders` presentation) |
| `score(end)`, `end` (= `conclude`) | scoring, ending | 3785, 3853 | domain / application |
| `justGood`, `offInd` | out-of-indication test rules | 53, 48 | domain |
| `buildRecords`, `buildLog`, `setSide`, `showBrief`, `closeBrief` | panel rendering, briefing | 4266, 4288, 4311, 4534, 4554 | presentation |
| `chatEn` | display conversion of clinical terms | 264 | presentation |
| `real` (get) | value of `REAL` | 45 | - |

Not exposed (reachable only through `E` or through effects): `tick` 136, `netRate` 124, `stageCheck` 173, `vitalsAt` 62, `give` 3283, `scoreNurse` 4031, `concludeNurse` 4107, `stateNow` 655.

### State to record after each step

`E` is created at er.js:4359-4369. A per-step record for a C# port can be read directly through `room.E`:

| Item | Source | Note |
|---|---|---|
| time | `E.sim` (minutes) | compare with a tolerance or after rounding; float accumulation of `dt * PACE / 60` |
| risk | `E.risk`, `E.riskLog` (`[sim, risk]` every 0.25 min) | clamp `RISK_FLOOR = 20`..100 (er.js:19, 143) |
| stage | `E.stage`, `E.topStage` | set in `stageCheck` |
| vitals | `N.live()` (hr, spo2, rr, sbp, dbp, no wobble) and `E.bp`, `E.bpTime`, `E.tempKnown` | do not use the `er-v-*` element text: it includes random wobble (er.js:95-97) |
| done actions | `E.done` (Map id -> record), `E.harmed`, `E.harms`, `E.wrongDoses`, `E.unneeded` | |
| effects | `E.effects`, `E.mods` (each with `from`, `ramp`, deltas), `E.jobs` (`at` + closure: record only `at`) | closures are not serialisable |
| tests | `E.tests` (id -> state), `E.lateTests` | |
| history/exam | `E.facts`, `E.exam` | Sets |
| companion | `E.anx`, `E.anxTop`, `E.comp` | break-ins are RNG-driven |
| rhythm events | `E.vtNow`, `E.vtAt`, `E.shockedAt`, `E.anaph` | |
| ending | `E.over`, `E.outcome` (`arrest` 3716; `stable`/`unstable` 3768, 4007), `N.score(end)` result, debrief text | |
| nurse mode | `E.nurse` (orders with `doneAt`, `cancelled`) | |
| requests | `room.posts[].body` (contains `state`, `risk`, `anx`, `history`) | online rooms only |

`harness.state()` (harness:103) already returns: sim, risk, stage, anx, pending, queue, done ids, harmed, test ids, facts, over, outcome. It lacks vitals, effects/mods, score and nurse state.

Suitability of the existing material:

| Candidate | Use as golden master | Limits |
|---|---|---|
| `golden-doctor.js` | Regression gate for the whole doctor room (text + request bodies). Deterministic. | Records text, not numeric state per step. Stored `golden-doctor.json` is stale (54 diffs) and must be regenerated from the frozen commit before use. Doctor role only. Depends on RNG order. |
| audit-fix-test 1-19 | Behavioural assertions of clinical rules (dose, allergy, VT/shock, PE, endings, nurse scope, scoring). Source of test-case ideas and expected values. | Assertions are written against Arabic feed text and `E` internals; not portable as-is. |
| `test-orders.json`, `chat-bank-2026-11-08.json`, `chat-dialogues-2026-11-08.json`, `parity.json`, eval-nurse-route rows | Input/expected tables for the reader (`localRead`, `readAct`): directly reusable as data-driven fixtures in C#. | Current accuracy is 84/86 and 470/471: record the legacy output as the expected value, not the label. |
| `live-chat*-2026-11-08.json` | Recorded server answers for replay of the online path without cost. | 31 answers, 5 sessions. |

Observed in the checkout (untracked, not part of this audit area): `tests/legacy-baseline/` already holds a modified copy of the harness (adds `NB_ER_JS`, `NB_DATA`, a `transform` option), `instrument-er.js`, `record-er-clinical.js`, `golden-conversation.js`, and `tests/Nabd.Tests/GoldenMasters/ErClinical/*.json`. Their content was not audited here.

## Gaps

| Area | Coverage found |
|---|---|
| er.js real-page branches (table under "What REAL === false means") | none automated in the listed tooling. `nurse-shots.mjs` (browser screenshots) is named by the runner but missing. |
| er.js audio, alarms, hidden-tab pause, back-button guard, sound preference | none |
| er.js `save()` into the user record (`authState.user.history`, averages, er.js:4230-4250) | none: `authState` is undefined in the sandbox |
| er.js DOM event wiring (form submit, records click delegation, search input, Escape on sheet) | none: listeners are stored, not dispatched; only `er-end` and `er-end-go` are invoked |
| HTML produced by er.js | compared only as strings in `golden-doctor` (`html` field); never parsed or rendered |
| `index.html` structure the room depends on (ids) | none: the fake DOM creates any id on demand, so a missing id cannot fail a test |
| `script.js` (7,124 lines: auth, views, quiz, tracks, sim engine, professor, coach) | no test found in `nabd-model/lang` (searched the listed files for `script.js`: no hit) |
| `resp.js`, `api/resp-chat.js`, `data/resp-*.json` | no test found in the listed files |
| `ui.js`, `motion.js`, `terms.js`, CSS | none |
| `api/er-chat.js` | `fix-test.mjs` (dialect filter, 62 cases, passes) and `api-nurse-test.mjs` (not runnable today: missing snapshot) |
| Online path end to end | only with scripted or recorded responders; real server behaviour (rate limit, CORS, model output) is not covered and must not be called |
| Random first-case choice, "next case" without id | each room draws one, but no suite asserts it |

## Recommendation

Copy into the repository under `tests/` (keep them runnable with Node, no dependencies):

| Copy | Change needed |
|---|---|
| `harness-er.js` | already copied in a modified form; keep one copy; resolve paths from the repository, not from `NB_ROOT` defaults on a Desktop folder |
| `audit-fix-test.js`, `-2` ... `-19`, `companion-eval.js` (required by 7) | replace the Desktop default in 13 and 14 (`NB_ROOT` fallback); make every suite exit non-zero on failure |
| `replay-live-chat.js`, `replay-live-chat-2.js` + `live-chat-2026-11-08.json`, `live-chat-2-2026-11-08.json` | none |
| `golden-doctor.js` | regenerate `golden-doctor.json` from commit 5f431d5 and commit it; do not copy the stale file |
| `eval-nurse-route.js`, `eval-orders.js` + `test-orders.json`, `eval-chat-bank.js` + `chat-bank-2026-11-08.json`, `chat-dialogues-2026-11-08.json` | remove absolute paths in `eval-orders.js`; store the measured numbers (84/86; 471/470/470; 68/68; 70/70) as thresholds |
| `parity-test.mjs` + `parity.json`, `fix-test.mjs` | read `er.js`, `data/` and the API source from repository paths; `api/er-chat.js` must first be brought into the repository |
| `api-nurse-test.mjs` | only after an old snapshot is available or the old/new comparison is removed |

Do not copy: `run-persona.js` live mode (paid endpoint), `run-all-suites.sh` as written (session-specific temp paths), `live-*.js` and `cost-probe.mjs` (not audited; names indicate live calls).

Generate as fixtures (from the frozen legacy `er.js`, through the harness):

1. Per-step numeric traces for each of the 6 cases and both roles: after every scripted input and every N frames, record `sim`, `risk`, `stage`, `live()` vitals, `E.bp`, done ids with dose and time, `mods`, tests, facts, `over`, `outcome`, and the final `score()` object. Use scripts that cover: ideal care, late care, neglect to arrest, a harmful order, VT + shock, PE collapse, anaphylaxis.
2. Reader tables: for every row of the chat bank, orders file, nurse-route rows and parity file, the legacy output of `localRead` / `readAct` / `readFinding` (ids, doses, addressee) as expected values.
3. Dose tables: `doseOf` / `doseIn` / `doseCheck` / `doseBad` outputs for every action of every case with good, low, high and missing doses.
4. Vitals curve: `vitalsAt(risk)` cannot be called through the hook; record `live()` with empty `mods` at `setRisk(20..100)` for each case.
5. Keep RNG-dependent text (line choice, companion break-ins, wobble) out of the numeric fixtures, or port the PRNG and the draw order exactly and state that in the fixture header.

## Open questions

1. Which commit should the regenerated `golden-doctor.json` be frozen at: 5f431d5 (current) is assumed.
2. Are the untracked files already in `tests/legacy-baseline/` and `tests/Nabd.Tests/GoldenMasters/` the intended home, so that the copies above merge into them?
3. The missing helpers (`fuzz.js`, persona scripts, chat scripts, `nurse-shots.mjs`, the pre-chat-fix API snapshot): do other copies exist (for example `Desktop/nabd-user-test-2026-11-07`)? Not searched.
4. Is the text of the room (Arabic lines chosen by seeded random) part of the contract for the C# port, or only the numeric clinical state and the set of lines available?
5. er.js `Date.now()` retry gate under a fake clock: should the port take an injected clock so that the "keeps knocking" behaviour becomes testable?
6. `parity-test.mjs` prints `tau undefined`: is a threshold field expected in `data/er-act.json`, or is the print obsolete?
