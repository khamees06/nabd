# ER room: handling a message from the student, and orders — er.js:1897–2536

All line numbers are er.js unless a file is named. The code sits inside the single IIFE opened at line 10; `E` (line 23) is the mutable state of the running case, `D` (line 22) the loaded catalog, `NM()` (line 29) is true when the trainee plays the nurse ("nurse mode"); otherwise the "doctor room" (DM) rules apply.

## Purpose

This range is the turn engine of the ER room. `send` queues one typed message; `handle` obtains a "read" of it (from the server through `call`, or from the local reader `localRead`) and chooses the reply source; `apply` turns that read into state changes: communication scoring, relative's anxiety, history facts learned, examinations, drug orders, test orders, and the single "open question" the nurse is waiting on. The second half holds the open-question queue (`ask`, `openDoses`, `nextQuestion`, `dropNamed`, parking and holding of proposals) and the safety predicates used by `order()` (defined later, line 3101): allergy match, too-early check, repeat limits, cumulative-dose cap. The last 78 lines open the nurse-mode block: scope sets, the per-case nurse state factory, doctor wording helpers, the escalation deadline and the SBAR grader. `order`, `orderTest`, `resolve`, `settle`, `flushBack` and `handleNurse` are outside the range.

## Features and user journeys implemented here

| # | Feature (what the user sees or does) | Lines | Reachability | Evidence |
|---|---|---|---|---|
| 1 | Typing in the ER chat box and pressing send: own bubble appears, message is processed in order | 1901–1912 | live | `#er-form` submit listener at 4567 calls `send`; form at index.html:1875–1876 |
| 2 | Room-only questions to the nurse ("how is he", "what happened with the tests", "did they attach the monitor") answered locally without a server call | 1900, 1924–1931 | live (doctor room only: 1915 returns first in nurse mode) | `ROOM_ONLY` used only at 1924 |
| 3 | Typing indicator, server read with local fallback, one-time retry of loading the offline act model | 1932–1941 | live | `call` 670, `loadAct`/`actRetried` 709 |
| 4 | Vague order ("give him something for the pressure") gets "which drug and how much?"; a bare yes/no with no open question gets the room's own line | 1948–1957, 2115–2120, 2019–2020 | live (doctor room) | `vagueLine` called from 1811, 1830 (localReply) |
| 5 | Unanswered question handling: remind, park ("I have not given X yet, waiting for your word"), close | 1975–2004, 2031–2060 | live | `remind` called 2123, 2124 |
| 6 | Communication and anxiety effects of a message (introduced, consent, rude, empathy, jargon, explaining to the relative, asking the relative to wait outside) | 2062–2089 | live | `apply` called from 1929, 1956, 1960, 1971 and 1417, 1823, 1856, 2559, 2567 |
| 7 | History facts counted as obtained when the patient or relative answers; nurse acts on some (allergy band note) | 2126–2139 | live | reads `E.c.facts`, writes `E.facts` |
| 8 | Physical examination finding shown in the feed and logged | 2231–2241 | live | `examine` called at 2141 |
| 9 | Nurse proposals: several doses asked as one question, "yes to both/all" accepted, "drop the cortisone" removes one | 2247–2316 | live | `openDoses` 2194, 2297, 3081; `dropNamed` 2102 |
| 10 | Safety challenges before a drug is given: allergy, off-case order, too early, repeat too soon / maximum reached, cumulative total exceeded, adrenaline IV push in anaphylaxis, subcutaneous route for an IV-only drug | 2387–2457 | live | callers at 2877–3455 (see Declarations) |
| 11 | Deferred second fluid bolus hung automatically when the first finishes | 2436–2443 | live (doctor room) | `later` job at 2439 |
| 12 | Nurse role: scope of practice sets, nurse state, doctor wording by sex, escalation deadline, instructor one-time lines, SBAR grading | 2467–2535 | not determined in this range (depends on how `E.role === 'nurse'` is set: role selection is at 4369 and 4704, outside the range) | `newNurseState` called 4369; `gradeSbar` called 2668, 4016 |

The running page was not probed for this area: the request URL constant at line 12 resolves to the deployed endpoint on any host that is not `*.vercel.app`, so sending a message from 127.0.0.1 would call the paid API (see Problems).

## Declarations

"R/W" lists fields of `E` unless stated. "→" means "calls".

| Name | Lines | Kind | Responsibility | Layer | Shared state read / written | Called from |
|---|---|---|---|---|---|---|
| `chain` | 1898 | let (Promise) | Serial queue so messages are handled one after another | application | W here and reset at 4375 | 1911, 4375 |
| `ROOM_ONLY` | 1900 | const RegExp | Whole-message match of the room's own questions to the nurse | domain (language rule) | – | 1924 |
| `send` | 1901–1912 | function | Entry point: trim, guard `E.over`, drop conversational jobs, count, echo bubble, enqueue `handle` | application + presentation | R `over`; W `jobs`, `sent`, `started`, `typedThisTurn`; → `person` | 4567 |
| `handle` | 1914–1972 | async function | Obtain the read (server or local), pick the reply source, route to `apply` | application | R/W `cavClosed`, `pending`; R `turns`, `done`; module `ACT`, `actRetried`; → `call`, `localRead`, `localReply`, `typing`, `loadAct`, `teachLine`, `unplacedOrder`, `resultsLine`, `howLine`, `monitorLine`, `handleNurse` | 1911 |
| `remind` | 1975–2004 | function | Policy for an open question that was not answered this turn | domain (state transition) + presentation (lines) | R/W `pending`, `tail`, `readNudged`; R `queue`, `c.care`; → `settle`, `restoreHeld`, `nextQuestion`, `nurse`, `person` | 2123, 2124 |
| `shortTip` | 2008 | const fn | First clause of a proposal's tip text | presentation | – | 1752, 2013, 2014, 2161, 2321, 2327, 2352, 3438, 3902 |
| `nameOf` | 2009 | const fn | Display name of a proposal's drug | presentation | `D.actions` via `actOf` | 2010, 2013, 2014 |
| `spk` | 2010 | const fn | Spoken short name (`SPOKEN` map, 3237) or `nameOf` | presentation | `SPOKEN` | 1828, 2013–2017, 2058, 2276, 2279, 2321, 2327, 2352, 3414, 3438 |
| `named` | 2013 | const fn | Name plus tip, phrased for speech | presentation | – | 1831, 2014, 2058, 2276, 2279 |
| `namedAsk` | 2014 | const fn | "X, I suggest T" phrasing | presentation | – | 2015, 2218 |
| `shortAsk` | 2015 | const fn | Short re-ask line by proposal type | presentation | – | 1798, 2027, 2058, 2162, 2163, 2321 |
| `parkLine` | 2017 | const fn | Sentence naming parked doses and refused unsafe orders | presentation | → `hisHer` | 2037, 2045 |
| `VAGUE_LINE` | 2019 | const object | Six fixed "which drug?" lines | presentation (data) | – | 2020 |
| `vagueLine` | 2020 | const fn | Selects the vague-order line | presentation | – | 1811, 1830 |
| `FAM` | 2021 | const array | Eight drug families (action ids) | domain (data) | – | 2022 |
| `sameFam` | 2022 | const fn | Two different action ids in one family | domain | – | 915 |
| `BARE` | 2023 | const RegExp | A bare yes/no word | domain (language rule) | – | 1816, 1820, 1952 |
| `restoreHeld` | 2025–2029 | function | Put held proposals back into the queue | domain (state transition) | R/W `held`, `queue`; R `pending`, `done` | 1979, 2111, 2112, 2287, 2347 |
| `parkOld` | 2031–2033 | function | Split displaced questions into held / parked | domain (state transition) | W `held`, `parked`, `parkNote`; R `turns`, `queue`, `c.care` | 2361 |
| `notePark` | 2036 | const fn | Remember what was parked this turn | domain | W `lastPark`, `q.parkTurn` | 2037, 2047 |
| `sayPark` | 2037 | function | Say the park note as its own bubble | presentation | R/W `parkNote`, `lastN`; → `nurse` | 2203, 2205 |
| `sayTail` | 2038–2060 | function | One short re-ask of the older question, or park it | domain + presentation | R/W `queue`, `pending`, `parked`, `cavClosed`, `lastN` | 2207 |
| `apply` | 2061–2229 | function | Apply one read: scoring, anxiety, open-question resolution, facts, exam, orders, tests, turn close | application orchestration with domain rules and presentation calls mixed in | R/W most of `E` (see next section) | 1417, 1823, 1856, 1929, 1956, 1960, 1971, 2559, 2567 |
| `examine` | 2231–2241 | function | Record and show one examination finding | domain + presentation | R `c.exam`, `anaph`, `stage`; W `exam`, `chat`, `nurse.examAt`; → `say`, `log` | 2141 |
| `YES_WORD` | 2247 | const string | Alternation of yes / "give it" words | domain (language rule) | – | 2249, 2250 |
| `ACCEPT` | 2249 | const RegExp | Whole message is an acceptance | domain | – | 896, 897, 922, 1816–1826, 1923, 2104, 3415, 3429 |
| `YES_FIRST` | 2250 | const RegExp | Message starts with a yes word | domain | – | 2308 |
| `bundleLine` | 2251 | const fn | Numbered proposal list (nurse mode wording) | presentation | – | 2279 |
| `openDoses` | 2253–2283 | function | Merge all open dose questions into one question and word it | domain + presentation | R/W `pending`, `queue`, `parked`, `parkNote`, `lastQ`, `askedThisTurn`, `qLine`; R `inApply`, `bufQ` | 2194, 2297, 3081 |
| `nextQuestion` | 2285–2299 | function | Promote the next queued question (unsafe first, then doses, then rest) | domain (state transition) | R/W `queue`, `pending`, `deferNext`; → `tooEarly`, `order`, `ask`, `openDoses` | 1979, 2043, 2051, 2054, 2112, 2199, 2293, 2314, 3217, 3405, 3484 |
| `dropNamed` | 2301–2316 | function | "Not the X": remove named proposals; a leading yes gives the rest | domain + presentation | R/W `pending`, `queue`; → `mentionsOf`, `freeAt`, `order`, `nurse` | 2102 |
| `ask` | 2317–2384 | function | Open or queue one question (types `dose`, `unsafe`, `reason`, `interpret`, `offer`, `which`) with all precedence rules | domain (state transition) + presentation | R/W `pending`, `queue`, `held`, `collect`, `qLine`, `askedThisTurn`, `lastOffer` | 2294, 2298, 2891, 3120–3203, 3359, 3365, 3554 |
| `allergicTo` | 2387–2402 | const fn | Does the order name an allergen (keyword or stem), not negated, not "allergic to X" | domain | R `def.allergyKw`, `def.allergyStem` | 915, 2167, 2877, 2916, 3124, 3415, 3422 |
| `offCase` | 2405–2409 | const fn | Synthetic care definition for an order the case never planned | domain | – | 3111 |
| `untreatedSbp` | 2412 | const fn | min(model SBP at current risk, displayed SBP) | domain (calculation) | R `risk`, `bp`; → `vitalsAt` | 2172, 2418, 2751, 2757, 3508 |
| `tooEarly` | 2413–2421 | const fn | Is a drug harmful because the patient is still stable | domain | R `anaph`, `done`, `vtNow`, `stage`; → `live` | 1574, 1638, 2293, 2774, 3112, 3469 |
| `ADJUNCT` | 2423 | const array | Two actions always fair in anaphylaxis | domain (data) | – | 3111 |
| `ivPush` | 2425 | const fn | Text asks IV push and not IM / infusion | domain | – | 2428 |
| `SUBCUT` | 2427 | const RegExp | Subcutaneous route words | domain | – | 2428, 3189 |
| `doseBad` | 2428 | const fn | Dose wrong by numbers, by reader, by route | domain | R `anaph`; → `doseCheck` | 2925, 3148, 3194, 3447 |
| `again` | 2430–2448 | function | Repeat policy: once-only, max count, minimum gap; deferred second fluid bolus | domain + presentation | R `done`, `sim`; W `fluidLater`, `jobs` (via `later`) | 3152 |
| `overTotal` | 2450–2457 | function | Cumulative amount cap | domain + presentation | R `done`; → `amountOf`, `SCALE`, `badDose` | 3206, 3455 |
| `NURSE_OWN`, `NURSE_TESTS`, `DOCTOR_ONLY` | 2467–2469 | const Set | Nursing scope of practice by action/test id | domain (data) | – | 1449, 2532, 2876, 2878, 2961, 2998, 3030, 3032, 3088, 4064, 4198 |
| `REASSESS_WIN`, `ESC_SPOKEN_MIN`, `O2_OWN` | 2470 | const numbers (5, 8, 94) | Reassessment window (min), minimum minute for a spoken escalation prompt, SpO2 below which oxygen is the nurse's own | domain (thresholds) | – | 4083; 2646; 2728, 2732, 2869, 2872 |
| `BLS_AIR`, `ADV_AIR` | 2472–2473 | const RegExp | Basic vs advanced airway words | domain | – | 2852 |
| `OWN_KEYS` | 2474 | const array | Nurse's own key actions | domain (data) | – | 4028 |
| `SCOPE_NOTE` | 2475 | const string | Fixed scope sentence | presentation (data) | – | 2984 |
| `isDrug` | 2476 | const fn | Action has a dose and is not oxygen | domain | `D.actions` | 1437, 1475, 2684, 2772, 2946, 3030, 3074, 4078 |
| `newNurseState` | 2477–2489 | function | Build `E.nurse` for a case | application (state factory) | R `c.nurseMode`, `c.nurse.name`, `D.actions`, `NURSE_KW`, `DOCV`, `SUPV_N` | 4369 |
| `compVoc` | 2491–2495 | function | RegExp for addressing the relative | domain (language rule) | R `c.patient.addr`, `c.companion.name` | 2487 |
| `comes`, `docW`, `docT`, `docKnows`, `docTitle` | 2496–2500 | const fns | Doctor wording by `E.nurse.sex` | presentation | R `nurse.sex`, `nurse.doc` | 2594–3033, 4129 |
| `reached` | 2501 | const fn | Doctor called or present | domain | R `nurse.esc.calledAt`, `nurse.present` | 2582–3027 (11 sites) |
| `escBy` | 2503–2508 | function | Escalation deadline in sim minutes | domain (calculation) | R `nurse.nm.escBy`, `tests` | 2733, 4052 |
| `dOnce` | 2510–2515 | function | Instructor line said once per key | presentation + state | R/W `nurse.said`, `hints` | 2715–2990 (10 sites) |
| `numsIn` | 2517 | const fn | Numbers in a message excluding units, SpO2's 2, 12-lead | domain (parsing) | → `digits` | 2527 |
| `HIST_RX`, `HIST_FACTS` | 2518–2519 | const RegExp / Set | What counts as history (SBAR "B") | domain (data) | – | 1454, 1473, 2526 |
| `gradeSbar` | 2521–2535 | function | Grade a message as SBAR (s, b, a, r, aWrong, goodSuggest, allergy) | domain (calculation) | R `c.patient`, `c.facts`, `facts`, `show`, `bp`, `tempKnown`, `c.temp`, `nurse.nm.orders` | 2668, 4016 |

## Shared state, globals and contracts

Defined here for other parts of er.js (nothing in this range is put on `window`):

- Functions used outside the range: `send` (4567), `apply`, `ask`, `nextQuestion`, `openDoses`, `shortTip`, `spk`, `named`, `shortAsk`, `vagueLine`, `sameFam`, `allergicTo`, `offCase`, `untreatedSbp`, `tooEarly`, `doseBad`, `again`, `overTotal`, `isDrug`, `newNurseState`, `gradeSbar`, `escBy`, `dOnce`, `reached`, wording helpers. Constants: `ACCEPT`, `BARE`, `SUBCUT`, `ADJUNCT`, the nurse scope sets and thresholds, `HIST_RX`, `HIST_FACTS`.
- Several of these `const` values are referenced by functions declared earlier in the file (for example `ACCEPT` at 896, `sameFam` at 915, `NURSE_OWN` at 1449). This works because those functions run after the whole IIFE body has been evaluated; fragment order must stay as is.
- The open-question object ("proposal") contract, created by `ask` callers and by `apply` (2118, 2145, 2151): `{ type: 'dose'|'unsafe'|'reason'|'interpret'|'offer'|'which', a?: {id, sayName?, ...}, id?, name?, tip?, sug?, def?, allergic?, caveat?, retried?, line0?, ask (English text sent to the server), since, turnAt, asks, wait, parkTurn?, reopened?, vague?, vagueSub? }`.
- Queue entry contract: `E.queue` items are `[proposal, line, who]`.
- Fields of `E` written by this range: `jobs, sent, started, typedThisTurn, cavClosed, pending, queue, held, parked, parkNote, lastPark, lastN, lastQ, lastOffer, tail, qLine, collect, rbBuf, turns, comm.{introduced, consent, rude, empathy, jargon, explained}, anx, busyTurn, comp.{asked, ignored, unheard, heardTurn, addressed, outUntil, lastTurn, lastAt, gen, explainedTurn}, inApply, merging, deferNext, bufQ, askedThisTurn, lastRead, facts, exam, chat, helps, done (Map; record {at,last,n,dose,ok,amt} at 2225), resolved, lastTo, readNudged, fluidLater, hints, nurse.said, nurse.examAt`.

Expected from other parts of er.js:

- State and catalog: `E`, `D` (`D.actions[] {id, ar, en, kw, dose, repeat{max,gap}, total, risky}`, `D.tests[] {id, ar, en, kw}`), `NM`, `ACT`, `actRetried`.
- Helpers: `norm`, `clamp`, `pickOf`, `actOf`, `testOf`, `digits`, `hasAny`, `mentionsOf`, `freeAt`, `mentionedIds`, `fem`, `hisHer`, `vitalsAt`, `live`, `later`, `soon`, `doseCheck`, `amountOf`, `SCALE`, `badDose` (3209), `SPOKEN` (3237), `STEP_OUT`, `NURSE_KW`, `DOCV`, `SUPV_N`, `ALLERGY_W`.
- Workflow: `call` (670), `loadAct`, `localRead` (1090), `localReply` (1783), `teachLine`, `unplacedOrder`, `resultsLine`, `howLine`, `monitorLine`, `order` (3101), `orderTest` (3492), `resolve` (3398), `settle` (3212), `flushBack` (3270), `director` (3620), `handleNurse`, `nursePre`, `nursePost`, `nurseAct`, `nurseTest`.
- Output: `person` (611), `nurse` (637), `say` (598), `typing` (645), `log`.
- The "read" object contract consumed by `apply`/`handle` (produced by the server reader or `localRead`): `to, kind, tone{introduced, consent, rude, empathy, jargon, explained}, actions[{id, dose, reason, agent, dose_ok}], tests[{id, reason, reason_ok}], exam[], facts[], saidFact, pending_ok ('good'|'partial'|'wrong'|'withdraw'|'na'), vague, vagueSub, clarify, reopen, unclear, unclearId, offerTest, offerAct, acceptParked, acceptQueued, noHelp, escalate, howIs, resultsAll, monitorAsk, text`. Server response fields read: `read, reply, to, voiceFailed, held, unplaced`.
- DOM ids: none are touched directly in this range. The entry is `#er-form` / `#er-input` (4567; index.html:1875–1876).

## Data, storage and network

| Kind | Detail |
|---|---|
| Network | No `fetch` in the range. `handle` calls `call({ text, pending: { ask } })` (1937); `call` (670–693) POSTs JSON to `API` (line 12) with case id, risk, anxiety, state and the last 14 chat entries. On any host that is not `*.vercel.app`, `API` is the absolute deployed URL. |
| Prompt text from the client | `E.pending.ask` (English sentences built at 2118, 2145, 2151 and by `ask` callers) is sent as `pending.ask`; the function inserts up to 800 characters of it into the model prompt as `PENDING:` (api/er-chat.js:346–347). |
| localStorage / sessionStorage | None in the range. |
| Case JSON fields read | `c.care[id].{stableHarm{unlessDone, sbp, hrAbove, stage}, key, early, allergyKw, allergyStem, ivOnly, once, total{hi, unit}, dose}`; `c.facts[].{id, who, kw, nurseNote, covers}`; `c.exam[].{id, say, sayReact, sayCritical}`; `c.results[id].{ind, whenShock}`; `c.stageLines.critical.patient`; `c.patient.{name, addr, sex}`; `c.companion.name`; `c.nurse.name`; `c.temp`; `c.nurseMode.{doctor{name, sex}, escBy (number or {after, plus, max}), orders}`. |
| Timers | No `setTimeout`/`setInterval`. Deferred work uses the simulation job queue `E.jobs` through `later` (2133, 2439) and `soon` (2133); `send` removes jobs flagged `conv` (1904). |
| Promise chain | `chain` (1898) serialises `handle`; reset at 4375 when a case begins. Rejections are logged with `console.error` (1911). |
| Audio, history API | None in the range. |

## Calculations and rules worth pinning with a golden-master test

| Name | Lines | Inputs | Output | Randomness / time |
|---|---|---|---|---|
| `ROOM_ONLY`, `BARE`, `ACCEPT`, `YES_FIRST` | 1900, 2023, 2247–2250 | normalised message | boolean | none |
| `allergicTo` | 2387–2402 | action `{agent, dose}`, care def `{allergyKw, allergyStem}`, text | boolean | none (uses `freeAt` negation rule) |
| `tooEarly` + `untreatedSbp` | 2412–2421 | care def `stableHarm`, `E.anaph`, `E.done`, `E.risk`, `E.bp`, `E.stage`, `E.vtNow`, `live().hr` | boolean | `live()` depends on simulation state, not wall clock |
| `ivPush`, `SUBCUT`, `doseBad` | 2425–2428 | action, def, text, reader grade | boolean | none |
| `again` | 2430–2448 | action, `meta.repeat{max, gap}`, `def.once`, previous record `{n, last, dose}`, `E.sim` | boolean plus nurse line; may schedule a fluid job | sim clock `E.sim` |
| `overTotal` | 2450–2457 | action, `def.total`/`meta.total {hi, unit}`, `E.done` amount, `amountOf`, `SCALE` | boolean; records a wrong dose | none |
| `offCase` | 2405–2409 | `meta {ar, risky}` | synthetic care def (risk 8 or 0) | none |
| `sameFam` | 2021–2022 | two action ids | boolean | none |
| Anxiety and communication deltas in `apply` | 2066–2089 | `read.tone`, `to`, text, `E.comp.asked`, `E.turns` | `E.anx` change (+24 rude, +7 jargon, −24 explained/empathy to relative, −6 other words to relative, −1 working, +6 at third waiting turn, +2 after, +1 otherwise; clamped 0–100), `E.comm` flags, `comp.outUntil = sim + 3` | sim clock |
| `remind` | 1975–2004 | open question, `wait`, `asks`, mode | settle / park / re-ask (nurse mode: re-ask on even waits, close at wait ≥ 4; interpret closed at wait ≥ 2) | none |
| `ask` / `openDoses` / `nextQuestion` / `parkOld` / `restoreHeld` / `sayTail` | 2025–2060, 2253–2384 | sequence of proposals, `E.pending`, `E.queue`, flags `inApply`, `bufQ`, `collect` | resulting `pending`, `queue`, `held`, `parked` and spoken lines | none; best pinned as scripted message sequences through `window.__nbER` |
| `apply` end to end | 2061–2229 | read object + state | state diff and emitted bubbles | `pickOf` (Math.random, line 40) at 2127 when stage 3 mutes the patient; `director` (outside range) |
| `escBy` | 2503–2508 | `nurseMode.escBy`, `E.tests[after].at` | minutes | sim clock |
| `numsIn` | 2517 | raw text | number list | none |
| `gradeSbar` | 2521–2535 | raw text, case patient/facts, displayed vitals, `E.bp`, `c.temp`, `nurseMode.orders` | `{s, b, a, r, aWrong, goodSuggest, allergy, half}`; tolerances SpO2 ±2, HR ±8, RR ±4, SBP ±10, DBP ±8, temp ±0.3 | reads `E.show || live()` |
| `compVoc` | 2491–2495 | case patient addr, companion name | RegExp | none |
| Constants | 2467–2476 | – | scope sets, `REASSESS_WIN` 5, `ESC_SPOKEN_MIN` 8, `O2_OWN` 94 | none |

## Problems

| Severity | Kind | Evidence |
|---|---|---|
| high | architecture | `apply` (2061–2229, about 170 lines) mixes scoring rules, anxiety arithmetic, open-question state transitions, order dispatch and bubble output; over 25 flags on `E` (`inApply`, `bufQ`, `merging`, `deferNext`, `askedThisTurn`, `qLine`, `tail`, `collect`, `rbBuf`...) coordinate ordering of output within one turn. No part can be tested without the whole state object. |
| high | security | Client-authored English prompt text (`pending.ask`, 2118, 2145, 2151, sent at 1937) is inserted into the model prompt by the function (api/er-chat.js:346–347, 800-character cap). Any caller can supply arbitrary text there. |
| medium | architecture | Clinical safety rules (`allergicTo`, `tooEarly`, `again`, `overTotal`, `doseBad`, nurse scope sets) and grading (`gradeSbar`) run only in the browser with the case data; a server-hosted version has no authoritative copy of the result. |
| medium | maintainability | Line 2321 is one statement of about 1,500 characters with four nested conditional expressions; 2279, 2032, 2123–2124 are similar. Lines 2123 and 2124 repeat the same condition with small differences for the two modes. |
| medium | duplication | The predicate "an early unsafe order whose prerequisite (`stableHarm.unlessDone`) is this dose" is written out six times: 1984, 2032, 2186, 2262, 2325, 2348. |
| medium | architecture | Arabic user-facing sentences are built inside rule code throughout (for example 1999–2002, 2017, 2176, 2276–2279, 2432–2444, 2455), so wording cannot change without touching rules, and rules cannot be tested without string matching. |
| medium | architecture | Line 12 (outside the range, used by `handle` through `call`): on any host other than `*.vercel.app` the room posts to the absolute deployed URL. A local or re-hosted copy therefore calls the paid production endpoint and depends on its CORS policy. |
| low | bug | `dOnce` reads `E.nurse` (2511) before testing `!E` (2512); the null check cannot protect the dereference. |
| low | duplication | 1997 repeats `nameOf` (2009); 2312 repeats `shortTip` (2008); the "no" word list at 2112 overlaps `BARE` (2023); `ivPush` and `SUBCUT` route vocabularies are separate from the dose parser's. |
| low | maintainability | `gradeSbar` always returns `half: {}` (2534); the real value is filled later by the caller at 2677. `handle` mutates the server's `read` object in place (1942–1954). Errors in `handle` are only logged (1911), so a failed turn leaves no reply and no message to the trainee. |

No dead code was found in the range: every declaration has at least one reference (searches: one `grep -nF` per declared name over er.js; `send`/`nbEr` over index.html, script.js, resp.js, ui.js).

## Proposed source fragments

Validated with `check-fragment.mjs ... --iife`: all eight print ok.

| Order | File | From–to | Single responsibility | Layer |
|---|---|---|---|---|
| 1 | er-message-intake.js | 1897–1973 | Message queue, `send`, `handle`: obtain the read and choose the reply source | application |
| 2 | er-question-remind.js | 1974–2005 | `remind`: policy for an unanswered open question | domain |
| 3 | er-question-wording-parking.js | 2006–2060 | Proposal wording helpers, vague-order lines, drug families, hold / park / tail of older questions | domain + presentation |
| 4 | er-apply-read.js | 2061–2242 | `apply` (one read into state and output) and `examine` | application |
| 5 | er-order-questions.js | 2243–2316 | Acceptance words, `openDoses`, `nextQuestion`, `dropNamed` | domain |
| 6 | er-order-ask.js | 2317–2384 | `ask`: open or queue one question with precedence rules | domain |
| 7 | er-order-safety-rules.js | 2385–2458 | Allergy, off-case, too-early, route, repeat and cumulative-total rules | domain |
| 8 | er-nurse-scope-state-sbar.js | 2459–2536 | Nurse mode: scope sets, thresholds, state factory, doctor wording, escalation deadline, SBAR grader | domain + application |

## Open questions

1. How is `E.role === 'nurse'` chosen in today's UI (role selection is outside this range, around 4369 and 4704)? Reachability of the nurse-mode half of this range depends on it.
2. Should the open-question text sent to the model (`pending.ask`) be built on the server from a question type and id instead of being accepted from the client?
3. In the ASP.NET version, which side owns the safety rules of fragment 7 and the SBAR grader: the browser (as today), the server, or both with the server as the authority?
4. Is the absolute production URL at line 12 intended for the GitHub Pages copy only? It also applies to local and future hosts.
5. `apply` is called from `localReply` paths at 1417, 1823, 1856 as well as from `handle`; whether any of those can re-enter `apply` within one turn was not determined.
6. `named(` also matches at 1128 and 1136; whether those are this `named` or a different local identifier was not determined.
