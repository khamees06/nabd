# ER room: setup, clinical state (vitals, risk, tick, stages), alarm tones, English chat terms — er.js:1–593

Audited at commit 5f431d5 (branch refactor/clean-architecture). All line numbers are er.js unless a file is named.
Method: every line of 1–593 read once; references searched with word-boundary greps over er.js and plain greps over
all `*.js`, `*.css`, `index.html`; data shape checked by a Node read of `data/er-cases.json`; `chatEn` (264–588) evaluated
in Node and in the running page; three browser probes, none of which opened the ER room (see Problems, row 1).

## Purpose

This range opens the single wrapper function of er.js and holds the room's configuration, its module-level state and
its small shared helpers (12–59). It contains the clinical core of the simulation: vitals interpolated from the risk
score, treatment modifiers, the net risk rate, the per-frame `tick`, and the stage machine (61–233). It also holds the
Web Audio alarm tones (234–254) and `chatEn`, a display-only converter that rewrites Arabic clinical terms in staff
lines into ward English (256–592). er.js is the source of truth for the clock, risk, vitals and stage; the server
function (`api/er-chat.js`) only interprets text and words lines (header, 5–7).

## Features and user journeys implemented here

| # | What the user sees or does | Lines | Reachability | Evidence |
|---|---|---|---|---|
| 1 | Monitor tiles HR / SpO2 / RR update with a small random jitter; NIBP updates on a cuff cycle (every 2 simulated min, 1 when stage >= 2) with a "قبل N د" age; Temp shows `--.-` until `E.tempKnown` | 93–107 | live | `paint()` called from `tick` 147 and `begin` 4414; ids exist in index.html 1859–1863; probe: none missing |
| 2 | Case clock `mm:ss` in the header | 146 | live | `#er-clock` index.html 1839 |
| 3 | Patient deteriorates over time unless treated: risk rises by `risk.rate` per simulated minute, floor 20, arrest at 100 | 124–134, 143, 169 | live | `tick` is the only caller of `netRate`; loop started at 4417–4418 |
| 4 | Stage changes (calm / watch / urgent / critical): border colours, alarm line in chat, nurse line, patient line, relative line, supervisor coaching | 172–217 | live | `#view-er[data-stage]` styled in er.css 36–37, 91–92, 384–391 |
| 5 | Improvement event: nurse reads the improved numbers when stage falls from >= 2 | 179–191 | live (doctor role); in nurse role the spoken line is dropped by `nurse()` 637 with no `alt` | 187 |
| 6 | VT rhythm in the critical stage of a case with `vt: true` (only `stemi`) | 177–178, 197, 84, 129 | live | `dataset.rhythm` read by motion.js 572 |
| 7 | Supervisor "ready to hand over?" nudge, once, when the patient is steady | 153–156 | live | conditions in 153 |
| 8 | Nurse reminder that an order still waits for a dose | 158–162 | live in doctor role; in nurse role the flag is set but nothing is said (Problems row 6) | 159–161, 637–638 |
| 9 | "Numbers held but not improving" prompt for cases with `risk.hold` (`sepsis`, `dka`) | 163–167 | live | data check: only those two cases have `hold` |
| 10 | Alarm tones: 3 beeps at 620 Hz every 6 s (urgent), 5 beeps at 880 Hz every 2.6 s (critical), only when the monitor sound toggle is on | 236–254 | live | `.er-mon[data-sound]` set by motion.js 313; `ac` created in `open()` 4672–4674 |
| 11 | Monitor tile turns to warning colour outside adult limits | 113–122 | live | `window.nbErVitals.warn` called by motion.js 574; probe returned expected booleans |
| 12 | Staff, system, exam and alarm chat lines show clinical terms in English («الـBP 90 على 60»); patient, relative and trainee lines stay Arabic | 264–592 | live | `shown()` used at 605, 623, 3538, 4237, 4309; probe: `__nbER.chatEn('الضغط 90 على 60')` → `الـBP 90 على 60`, `real` = true |
| 13 | Nurse role: address «يا دكتور» stripped from lines; bedside observation note on stage rise | 29, 32, 196, 205, 215 | live when `E.role === 'nurse'` (set in `begin` 4357–4358; all 6 cases have `nurseMode`) | 4357 |
| 14 | Offline notice text | 20 | live | used at 668 and 4399 |

## Declarations

"Called from" lists er.js line numbers outside the declaration. Widely used helpers are summarised.

| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| `API` | 12 | const string | Endpoint URL: relative `/api/er-chat` on `*.vercel.app`, otherwise the absolute production URL | infrastructure | reads `location.hostname` | 677, 695 |
| `PACE` | 15 | const | Simulation speed factor (1) | domain | – | 141 |
| `BP_EVERY`, `BP_SICK` | 17 | const | Cuff cycle in simulated minutes (2; 1 when stage >= 2) | domain | – | 101 |
| `RISK_FLOOR` | 19 | const | Lowest risk value (20) | domain | – | 143 |
| `OFFLINE_NOTE` | 20 | const string | Arabic notice shown when the API is unreachable | presentation | – | 668, 4399 |
| `D` | 22 | let | Loaded `er-cases.json` (`tests`, `actions`, `cases`, `reviewed`) | infrastructure | written 4661 | throughout |
| `loading` | 22 | let | In-flight promise of the cases fetch | infrastructure | – | 4661 |
| `api` | 22 | let | API availability: `'try'` / `'on'` / `'off'`; starts `'off'` on `file:` | infrastructure | reads `location.protocol` | 665, 671, 686, 690, 695, 3676, 4399, 4704 |
| `apiFails`, `apiRetryAt`, `apiNoted` | 22 | let | Failure counter, next retry time (ms epoch), "offline note shown" flag | infrastructure | – | 666–695, 4399, 4704 |
| `E` | 23 | let | The running case state object (created in `begin` 4359–4368) | domain (state) | – | throughout |
| `tickId` | 23 | let | `requestAnimationFrame` handle | browser | – | 3857, 4345, 4417–4418 |
| `last` | 23 | let | Timestamp of the previous frame | browser | – | 138–139, 4415–4417 |
| `seen` | 24 | const Set | Case ids already played in this page load (random pick without repeat) | application | – | 4351–4355 |
| `roleWanted` | 28 | let | Role requested before a case starts; null = from the user's track | application | – | 3096, 4357, 4667, 4704 |
| `NM` | 29 | arrow fn | True when the running case is in nurse role | application | reads `E.role` | throughout |
| `forNurse` | 32 | arrow fn | Removes the address «يا دكتور» from a line | presentation (text) | – | 205, 614, 4123, 4704 (`strip`) |
| `$` | 34 | arrow fn | `document.getElementById` | presentation | DOM | throughout |
| `esc` | 35 | arrow fn | HTML-escapes `& < > "` (not `'`) | presentation | – | throughout |
| `norm` | 37–38 | arrow fn | Arabic text normaliser: strips U+064B–065F, U+0670, U+0640; Arabic-Indic digits to ASCII; alef / ya / ta-marbuta / hamza-carrier folding; punctuation to space; lower-case | domain (text matching) | – | about 70 sites, 711–4274 |
| `clamp` | 39 | arrow fn | Bound a number | domain helper | – | throughout |
| `pickOf` | 40 | arrow fn | Random element of a list (`Math.random`) | domain helper | – | 155, 206, 1764–4410 (16 sites) |
| `testOf`, `actOf` | 41–42 | arrow fn | Look up a test / action definition by id in `D` | domain | reads `D.tests`, `D.actions` | about 40 and 60 sites |
| `REAL` | 45 | const bool | True in a real page; false in the Node test harness (no `document.body`) | browser / test seam | reads `document` | 592, 3056, 3541, 4334–4705 |
| `offInd` | 48 | arrow fn | Test is out of indication (`ind` is `'no'` or `'harm'`) | domain | – | 3540–4277 (8 sites), 4705 |
| `OFF_BADGE` | 49 | const string | Badge text for an out-of-indication test | presentation | – | 3541, 3838 |
| `clk` | 50 | arrow fn | Format simulated minutes as `mm:ss` | presentation | – | 3045, 3838, 4200 |
| `wordsIn` | 51 | arrow fn | Word count | domain helper | – | 16 sites, 1170–3988 |
| `justGood` | 53–59 | function | Grades a free-text justification: length >= 10, not a stock non-answer, and (keyword hit or >= 5 words) | domain | – | 3763, 4001, 4705 |
| `vitalsAt` | 62–69 | function | Piecewise-linear interpolation of hr / sbp / dbp / rr / spo2 over the case's `vitals` table by risk | domain | reads `E.c.vitals` | 81, 2412 |
| `modsNow` | 72–79 | function | Sum of treatment modifiers, each ramped in over `ramp` (default 0.2) simulated minutes | domain | reads `E.mods`, `E.sim` | 81, 4704 |
| `live` | 80–89 | function | Current true vitals = `vitalsAt(E.risk)` + clamped modifiers; HR frozen in VT | domain | reads `E.risk`, `E.vtNow` | 94, 108, 110, 186, 223, 228 and about 25 later sites, 4704 |
| `fix` | 91 | arrow fn | Round to `d` decimals | domain helper | – | 4177 (and others on 4138–4146, not individually verified) |
| `wobble` | 92 | arrow fn | Random jitter of width `n` centred on 0 | presentation | – | 95–97 |
| `paint` | 93–107 | function | Writes vitals to the monitor tiles; runs the cuff cycle; stores un-jittered values in `E.show` | presentation (plus one state transition: cuff) | reads `E.sim`, `E.stage`, `E.tempKnown`, `E.c.temp`; writes `E.show`, `E.bp`, `E.bpAt`, `E.bpTime`; DOM `er-v-*` | 147, 185, 198, 222, 2858–3388, 4414 |
| `vitalsLine` | 108 | arrow fn | English one-line vitals summary (sent to the server in the state object) | application | reads `E.show`, `E.bp` | 656 |
| `spokenVitals` | 110 | arrow fn | Arabic spoken vitals line | presentation (text) | reads `E.show`, `E.bp` | 1607, 1757–1862, 2859, 3297 |
| `window.nbErVitals` | 113–122 | global object | `warn(key, value)`: adult alarm limits per tile | domain | – | motion.js 574 |
| `netRate` | 124–134 | function | Risk points per simulated minute after treatments, anaphylaxis, VT and the `hold` rule | domain | reads `E.c.risk`, `E.effects`, `E.anaph`, `E.vtNow`, `E.done`, `E.risk` | 140, 153 |
| `tick` | 136–170 | function | One frame: advance clock and risk, log risk, paint, run due jobs, stage check, nudges, alarm, arrest | application (orchestration) with DOM write at 146 | reads/writes most of `E`; DOM `er-clock` | 4417 |
| `STAGES` | 172 | const array | Stage index to name | domain | – | 176, 199, 1764 |
| `stageCheck` | 173–217 | function | Stage transition and everything it triggers (chat lines, alarm line, anxiety, director, coach) | domain transition + application + DOM dataset | writes `E.stage`, `E.topStage`, `E.vtNow`, `E.vtAt`, `E.anx`, `E.betterTurn`, `E.bpAt`, `E.comp.*`, `E.nurse.stageAt`; DOM `#view-er` dataset | 149, 3321 |
| `nurseStage` | 220–227 | function | Chooses the nurse's stage line from signs the monitor actually shows | domain | reads `E.bp`; forces a cuff reading | 202 |
| `worst` | 228 | arrow fn | The vital named in the alarm line (SpO2 <= 90, else SBP < 95, else HR) | domain | – | 201 |
| `later` | 229 | arrow fn | Schedule a job at `E.sim + min` | application | writes `E.jobs` | about 30 sites |
| `soon` | 232 | arrow fn | Schedule a conversational job within 0.05 simulated min, tagged `conv` and `turn` | application | writes `E.jobs` | 1847, 2133, 2435, 3337–3585 |
| `ac`, `lastAlarm` | 235 | let | Audio context (assigned in `open()` 4673) and time of last alarm | browser | – | 237–251, 4673–4674 |
| `tone` | 236–246 | function | One triangle-wave beep with gain envelope | browser | reads `ac` | 252–253 |
| `alarm` | 247–254 | function | Rate-limited alarm pattern by stage, if sound is on | browser | reads `E.stage`, `.er-mon[data-sound]` | 168 |
| `chatEn` | 264–588 | const (IIFE result) | Builds 281 ordered regex rules once; returns `text => text` with Arabic clinical terms replaced by English. Identity function if rule construction throws | presentation (display text) | none (pure after construction) | 592, 4705 (`__nbER.chatEn`, used by terms.js 82–83) |
| `EN_WHO` | 591 | const Set | Speakers whose lines are converted: `n`, `d`, `sys`, `exam`, `alarm` | presentation | – | 592 |
| `shown` | 592 | arrow fn | Applies `chatEn` when `REAL` and the speaker is in `EN_WHO` | presentation | – | 605, 623, 3538, 4237, 4309 |

Inner declarations of `chatEn` (not top level): `L`, `NOT_L`, `END`, `MARKS`, `ALT`, `esc` (shadows the outer `esc`, 270),
`pat`, `any`, `lead`, `PRE`, `rules`, `raw`, `EMIT`, `term`, `tail`, `def`, `PCT`, `SOFT`, `FEEL`, `MOVED`, `SAT`, `ON_BODY`,
`DRUGS` (381–399, about 60 drug entries), `NOT_BP_AFTER`, `UNIT`, `DRUG_EN`, `DRUG_RE`, `EMIT_RE`.

## Shared state, globals and contracts

Defined here for others:

| item | lines | consumer |
|---|---|---|
| `window.nbErVitals.warn(key, value)`; keys `hr`, `rr`, `spo2`, `bp` (string `"sys/dia"`), `temp` | 113–122 | motion.js 574 |
| `#view-er[data-stage]` = `calm` / `watch` / `urgent` / `critical` | 176 | er.css 36–37, 91–92, 384–391 |
| `#view-er[data-rhythm]` = `vt` or empty | 178 | motion.js 572 |
| Text content of `#er-v-hr`, `#er-v-spo2`, `#er-v-rr`, `#er-v-bp`, `#er-v-temp` | 95–106 | motion.js 567–576 reads the tiles to drive pulse, beep and warning colour |
| `chatEn` (exposed as `window.__nbER.chatEn` at 4705) | 264 | terms.js 82–83 |
| Module state `D`, `E`, `api*`, `roleWanted`, `seen`, `tickId`, `last`, `ac` and helpers `$`, `esc`, `norm`, `clamp`, `pickOf`, `testOf`, `actOf`, `later`, `soon`, `live`, `paint` | 22–232 | the rest of er.js (same closure) |
| Job contract: `E.jobs` items `{ at, fn, conv?, turn? }`; `send()` drops `conv` jobs (1904) | 229, 232 | 148, 1904, 3228, 3234 |

Expected from others:

| item | where used | provided by |
|---|---|---|
| `E` shape: `c, sim, risk, anx, anxTop, stage, topStage, done (Map), effects[], mods[], jobs[], riskLog, riskLogAt, paintAt, bpAt, bpTime, bp, show, tempKnown, vtNow, vtAt, anaph, pending, nudged, holdAsked, turns, dTurn, dAt, betterTurn, comp{used,outUntil,lastAt}, nurse{stageAt,esc.calledAt,present,orders}, over, role` | 62–232 | `begin()` 4359–4368; `E.show`, `E.dTurn`, `E.dAt`, `E.betterTurn` are not initialised there and are created on first write (98, 632, 189) |
| `E.effects` items `{ id, from, slow }`; `E.mods` items with `from`, `ramp`, and any of `spo2, hr, rr, sbp, dbp` | 74–76, 126 | 3305, 3311, 3378 |
| Functions later in er.js: `log`, `alert` (642, shadows `window.alert` inside the closure), `sys`, `say`, `person`, `nurse`, `director`, `coach`, `arrest`, `keyMissing`, `nurseTick`, `nurseStageRise`, `openOrd` | 148–216 | 598–3714 |
| DOM ids `er-v-hr`, `er-v-spo2`, `er-v-rr`, `er-v-bp`, `er-v-bpt`, `er-v-temp`, `er-clock`, `view-er`; class `.er-mon` with `data-sound` | 95–106, 146, 176, 248 | index.html 1835–1863; `data-sound` by motion.js 313 |
| `window.nbAudio()` (shared audio context) or `AudioContext` | `ac`, assigned at 4673 | motion.js 235 |
| Case data fields (below) | 62–227 | `data/er-cases.json` |

## Data, storage and network

| kind | detail |
|---|---|
| Network | No request is made in this range. `API` (12) is the URL used by `call()` (POST, 677) and `ping()` (GET `?ping=1&_=<ms>`, 695). On any host that does not end in `.vercel.app` (GitHub Pages, localhost, the future ASP.NET host) the value is the absolute production URL `https://nabd-smoky-one.vercel.app/api/er-chat` |
| Storage | None in this range (no `localStorage` / `sessionStorage` access in 1–593) |
| JSON fields read (`data/er-cases.json`, per case) | `vitals[]` rows `{ at, hr, sbp, dbp, rr, spo2 }` (5 or 6 rows, `at` strictly increasing from 0 to 100 in all 6 cases); `risk { start, rate, watch, urgent, critical, hold? { until, at, ask } }` (`hold` only in `sepsis`, `dka`; `dka.hold` also has `line`, `from`, not read in this range); `temp`; `vt` (only `stemi`); `stageLines.{watch,urgent,critical} { patient[], nurse, parts[[vital, limit, words, dir]], rest[], held, seen, companion }`; top level `tests[] { id, ind, … }`, `actions[] { id, … }` |
| Timers | No `setTimeout` / `setInterval`. Time enters through the `requestAnimationFrame` timestamp passed to `tick(now)` (loop at 4417). Simulated time `E.sim` is in minutes: `step = dt * PACE / 60`, `dt` capped at 2 s per frame (138–142). Jobs are a simulated-time queue (`E.jobs`, 148) |
| Throttles (simulated minutes) | risk log every 0.25 (145); repaint every 0.12 (147); cuff 2 or 1 (101); dose reminder after 0.75 (159); hold prompt after 7 (164) |
| Audio | Web Audio: `createOscillator` (triangle), `createGain`, exponential ramps to 0.12, 620 Hz or 880 Hz (236–253). Real-time rate limit by rAF timestamp: 6000 ms urgent, 2600 ms critical (249) |
| History API | None in this range |
| Environment reads | `location.hostname` (12), `location.protocol` (22), `document.body` / `document.addEventListener` (45) |

## Calculations and rules worth pinning with a golden-master test

| name | lines | inputs | outputs | randomness / time |
|---|---|---|---|---|
| `vitalsAt` | 62–69 | risk, `E.c.vitals` | `{hr, sbp, dbp, rr, spo2}` (unrounded) | none. Pin for each case at risk = 20, start, each threshold, 100, and for `stemi` at 83, 83.5, 84 (VT step) |
| `modsNow` | 72–79 | `E.mods`, `E.sim` | summed deltas | none; ramp default 0.2 min |
| `live` | 80–89 | risk, mods, `E.vtNow` | vitals with clamps: SpO2 delta ±10 and cap 99; HR delta −30..0 with floor `min(hr, 60)` or 0..+30, ignored in VT; RR delta −10..0 with floor `min(rr, 14)`, positive unbounded; SBP −40..+35; DBP −20..+18 | none |
| `netRate` | 124–134 | `risk.rate`, effects active at `E.sim`, anaphylaxis, VT, `hold` | rate per minute | none. Cases: untreated anaphylaxis `max(r,0)+3`; VT `max(r, rate)`; hold `max(r,0)` while `risk <= hold.at` and `hold.until` not done |
| Risk integration in `tick` | 138–145 | frame `dt` (capped 2 s), `PACE`, `netRate` | `E.sim`, `E.risk` clamped 20..100, `riskLog` | real time via `now`; deterministic if `tick` is driven with fixed timestamps |
| Stage thresholds and transitions | 173–217 | risk, `risk.watch/urgent/critical`, `E.stage`, `c.vt` | stage 0–3, `vtNow`, anxiety +14 on rise / −12 on improvement from >= 2, logs, alarm line | `pickOf` (206) uses `Math.random` for the patient line |
| `nurseStage` | 220–227 | `stageLines[..].parts/rest/held/nurse`, live vitals, cuff reading | nurse sentence | none |
| `worst` | 228 | live vitals | `SpO2 n%` / `BP n` / `HR n` | none |
| `nbErVitals.warn` | 113–122 | key, value | boolean. Limits: HR > 110 or < 50; RR > 24 or < 10; SpO2 <= 92; SBP < 100 or >= 180; Temp >= 38 | none. Verified in the page: (hr 111) true, (hr 110) false, (spo2 92) true, (bp `--/--`) false, (bp `95/60`) true, (bp `180/100`) true, (temp 38) true, (rr 9) true |
| Cuff cycle | 99–104 | `E.sim`, `E.stage` | `E.bp`, `E.bpAt`, `E.bpTime` | none; displayed HR / SpO2 / RR carry `wobble` (random), `E.show` does not |
| Hand-over nudge condition | 153 | risk, watch, netRate, key steps, `done.size`, `sim`, role, turns | one supervisor line | `pickOf` for the doctor-role wording |
| `justGood` | 53–59 | text | boolean | none |
| `norm` | 37–38 | text | normalised text | none; many matchers depend on it |
| `forNurse` | 32 | text | text without «يا دكتور» | none |
| `clk` | 50 | minutes | `mm:ss` | none |
| `chatEn` | 264–588 | text | text | none; 281 rules, order-dependent. Samples verified (Node and page): «الضغط 90 على 60» → «الـBP 90 على 60»; «النبض 125 والتنفس 28» → «الـHR 125 والـRR 28»; «اعطيته أسبرين 300 ملغ» → «اعطيته aspirin 300 mg»; «الأكسجين 6 لتر بالدقيقة» → «الـO2 6 L/min»; «عنده ضغط وسكري» → «عنده HTN وDM»; «عنده ضغط على صدره» unchanged; Latin-only input unchanged. A golden corpus of every staff line in `er-cases.json` is the practical safety net |

## Problems

| severity | kind | evidence with line numbers |
|---|---|---|
| high | architecture / security (cost) | 12: on every host not ending `.vercel.app` the room calls the absolute production endpoint of the paid AI function. This includes `127.0.0.1` and the future ASP.NET host. The audit server's "/api answers 404" does not apply to the ER room: opening it there sends `ping` (695) and each message sends a POST (677) to production. `tools/legacy/browser-probe.mjs` has no request blocking (grep for `route`, `abort`, `block`, `vercel`: no match). For this reason the ER room was not opened in this audit. The URL must become configuration |
| medium | architecture | 136–170, 173–217: `tick` and `stageCheck` mix state transition, scheduling, chat output, DOM writes (146, 176, 178) and audio. The clinical model cannot run without a DOM; the Node harness needs a fake `document` (comment 43–45) |
| medium | architecture | 93–107: `paint` is the only place the cuff reading `E.bp` is taken (state) and also renders. Domain code forces a reading by `E.bpAt = 0; paint()` (185, 198, 222), so rules such as `nurseStage` depend on a render call |
| medium | bug (fragility) | 148: due jobs are taken as a snapshot, then each is removed with `E.jobs.splice(E.jobs.indexOf(j), 1)`. If a job's `fn` removes or replaces `E.jobs` entries (as `send()` does at 1904), `indexOf` returns −1 and `splice(-1, 1)` deletes the last queued job. Also no `E.over` check between jobs or before `stageCheck` (149), so if a job ends the case, later jobs and `stageCheck` still run and can set `data-stage` again after `finish` reset it (3862). Whether any job ends the case or calls `send`: not determined |
| medium | duplication | 53–59 `justGood` is a copy of `evaluateScientificJustification` in script.js 4425–4431 (same stock answers, same keyword list, same thresholds; comment at 52 states it). 146 repeats the `clk` formula of line 50 |
| low | bug | 158–162: in nurse role the condition passes (`NM() \|\|`), `open.nagged` is set, but `nurse(text)` without `alt` says nothing in nurse role (637–638). The reminder is consumed silently. Whether a `dose`-type `E.pending` can exist in nurse role: not determined |
| low | maintainability | 15: comment says "Simulated seconds per real second" while `E.sim` is in minutes (`dt * PACE / 60`, 141) and all thresholds are minutes. 22: six module variables on one line. 270: inner `esc` (regex escape) shadows outer `esc` (HTML escape, 35). 642: `alert` shadows `window.alert` and is called at 201 |
| low | maintainability | 264–588: `chatEn` builds 281 regexes at script load and runs all of them on every converted line. Several use lookbehind (285, 437, 541, 576, 581); the `try/catch` (264, 588) falls back to Arabic if construction throws. The fallback does not protect the file: a regex literal with lookbehind sits outside this range at 596 (`bidi`), which is a parse-time error on an engine without lookbehind |
| low | bug (display) | 96: display SpO2 is `round(clamp(v.spo2 + wobble(1), 40, 100))`; `live()` caps at 99 (82), so the tile can show 100 by jitter. 201/228: the alarm line quotes un-jittered values, the tiles show jittered ones (can differ by 1) |
| low | maintainability | 35: `esc` does not escape `'`; safe only while values are never placed in single-quoted attributes (not checked outside this range). 45, 592: production code branches on the test-harness flag `REAL`, so the harness does not exercise `chatEn` through `shown` |
| low | architecture | 113: clinical alarm limits are published as a window global for motion.js; the same limits are not shared with `worst` (228: SpO2 <= 90, SBP < 95), which uses different cut-offs |

No secrets, credentials or personal data appear in this range.

## Proposed source fragments

All ranges validated: `check-fragment.mjs er.js 12-33 34-60 61-90 91-123 124-171 172-233 234-255 256-593 --iife` printed `ok` for each.
Lines 1–11 are the bundle prefix (header comment, wrapper opening `(() => {`, `'use strict'`) and belong to no fragment.

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| – | (bundle prefix) | 1–11 | header comment, wrapper opening, `'use strict'` | – |
| 1 | `er-config-state.js` | 12–33 | endpoint and tuning constants, module state (`D`, `E`, `api*`, `tickId`, `seen`, `roleWanted`), role helpers `NM`, `forNurse` | infrastructure / application state |
| 2 | `er-helpers.js` | 34–60 | DOM lookup, HTML escape, Arabic normaliser, `clamp`, `pickOf`, `testOf`, `actOf`, `REAL`, `offInd`, `clk`, `wordsIn`, `justGood` | shared helpers (domain + presentation) |
| 3 | `er-vitals-model.js` | 61–90 | `vitalsAt`, `modsNow`, `live` | domain |
| 4 | `er-monitor-paint.js` | 91–123 | `fix`, `wobble`, `paint` (tiles and cuff cycle), `vitalsLine`, `spokenVitals`, `window.nbErVitals` | presentation (cuff state to be extracted later) |
| 5 | `er-risk-tick.js` | 124–171 | `netRate` and the per-frame `tick` | domain + application |
| 6 | `er-stages-scheduler.js` | 172–233 | `STAGES`, `stageCheck`, `nurseStage`, `worst`, job scheduler `later` / `soon` | domain + application |
| 7 | `er-alarm-tones.js` | 234–255 | Web Audio alarm tones | browser |
| 8 | `er-chat-english-terms.js` | 256–593 | `chatEn` rule list (large data-like literal, both `CHAT-EN` markers), `EN_WHO`, `shown` | presentation |

Fragments 1–4 and 7 are under 40 lines; they are kept separate because each has a different layer. Merging 1+2 (12–60)
and 3+4 (61–123) is also valid at these boundaries if fewer files are preferred.

## Open questions

1. Should the audit and test tooling block `nabd-smoky-one.vercel.app` at the browser level? Today any ER room session on localhost reaches the paid endpoint (line 12).
2. Can a queued job (`later` / `soon`) end the case or call `send()`? This decides whether the `splice(-1)` path at 148 is reachable. Not determined in this range.
3. Is the silent dose reminder in nurse role (158–162) intended? The condition explicitly admits nurse role, but `nurse()` drops the line.
4. `/*CHAT-EN-START*/` and `/*CHAT-EN-END*/` (256, 589): no consumer was found in the repository (grep over `*.js`, `*.mjs`, `*.html`, `*.json`, `*.md`: only er.js and `.work/er.lf.js`). Is there an external build or test script (for example in `nabd-model`) that extracts this block? If so, the markers must stay in one file.
5. `justGood` and `evaluateScientificJustification` (script.js 4425) are identical today: should the refactor keep one domain rule shared by both rooms?
6. The alarm line cut-offs in `worst` (SpO2 <= 90, SBP < 95) differ from the tile limits in `nbErVitals.warn` (SpO2 <= 92, SBP < 100). Intended, or should one table drive both?
