# ER room, nurse mode: one message, escalation, the doctor's orders, fixed lines — er.js:2537–3036

Audit base: branch `refactor/clean-architecture` (= main 5f431d5). All line numbers are er.js unless a file is named. Everything in the range sits directly inside the er.js wrapper function. The range was read in full; callers were traced with `grep -n "\bname\b"` over er.js, script.js, resp.js, ui.js, motion.js, terms.js and index.html (no hit outside er.js for any name in the range).

## Purpose

This range is the nurse-role half of the ER room engine. It routes one typed trainee message when the session role is `nurse` (to the server reader or to the local reader, or straight into the SBAR phone call), runs the escalation state machine (call the doctor, collect SBAR over one or two messages, one clarifying question, give-up, the doctor's arrival), releases and cancels the doctor's orders from the case file (`case.nurseMode.orders`), judges every trainee action and test against the nurse's scope and against the order as written (agent and dose), and produces the doctor's and the nurse instructor's fixed (non-AI) replies. It contains no fetch, storage, timer or DOM call of its own; all effects go through helpers defined elsewhere in er.js (`call`, `sys`, `docSay`, `person`, `later`, `log`, `order`, `give`, `orderTest`, `buildOrders`, `paint`). All time is the simulation clock `E.sim` (minutes); there is no `Math.random` and no `Date` in the range.

## Features and user journeys implemented here

Reachability evidence common to all rows: nurse role is live. `begin()` picks `role = 'nurse'` when the brief track is nursing or the role switch says so and the case has `nurseMode` (4357–4358, 4369); all six cases in data/er-cases.json have `nurseMode`. Verified in the running page: `nbDemoLogin('rana')`, `nbOpenER()`, `__nbER.beginAs('asthma',{role:'nurse'})` gives `__nbER.role === 'nurse'`, the brief shows the role switch (`[data-role]` doctor:false / nurse:true), and `__nbER.send('دكتور')` set `esc.calledAt` and `esc.awaiting = true` with `api === 'off'`.

| # | Feature (what the trainee sees or does) | Lines | Reachability | Evidence |
|---|---|---|---|---|
| 1 | Typed message in nurse mode: typing dots, server read if available, else local read; reply voiced by server only for patient / relative / instructor, never the doctor | 2538–2560 | live | `handle()` 1915 `if (NM()) return handleNurse(text)` |
| 2 | While the doctor waits on the phone, the next message is taken as SBAR with no server call (unless it is a short line to patient/relative or names the instructor) | 2541–2546, 2561–2566, 2663–2679 | live | same entry; probe showed `awaiting=true` after a call |
| 3 | Calling the doctor ("اتصلتَ ب…"), doctor's greeting after 0.15 sim-min, long first call (>= 8 words) graded at once | 2637–2653 | live | `nursePre` 2592, `nurseAct` 2847, `basicAirway` 2886 |
| 4 | One clarifying question from the doctor (numbers, or history), parts supplied after it count half | 2669–2677 | live | called from `escTurn`, `escalate` |
| 5 | Doctor nags "ألو؟" then gives up and comes with no SBAR (2 / 4 unanswered turns, or 1.5 / 3 sim-min) | 2629–2633, 2693–2701, 2740–2743 | live | `nursePost` from `apply` 2227; `nurseTick` from the clock 150 |
| 6 | Doctor's allergy question before drug orders; drug orders held up to 1 sim-min or until critical; answer handling incl. "guessed no allergy" | 2584, 2608–2625, 2687–2689, 2736, 2767, 2772 | live | 20 of 58 orders are phone drug/act orders; path through `escFinish` |
| 7 | Doctor arrives at the bedside (system line, chips rebuilt, ICU call credited if the case marks it key); also by monitor alarm at stage 3 / VT | 2702–2722 | live | `later(..., doctorArrives)` at 7 sites; `nurseStageRise` from 215 |
| 8 | Instructor nudges, each once (vitals, SpO2 protocol, escalation deadline, deterioration, open orders, allergy before drug, scope) | 2715, 2731–2734, 2887, 2949–2951, 2988–2990 | live | `dOnce` (2510) keyed '1','2','3','4','5:id','6','8','bls','allergen:id' |
| 9 | Doctor's orders spoken in one line, logged, shown in the side panel; cancelled by their own stop rule (`cancelSbp`, `cancelStage`) with `cancelLine` | 2747–2815 | live | `releaseOrders` called from 13 sites incl. 3340, 3549 |
| 10 | Doctor's own steps (shock in VT, intubation, cath lab) done by the doctor, no credit to the nurse | 2817–2840 | live for cases that carry `doctorDoes` orders (3 orders in the data) | called only from `releaseOrders` 2810, 2812 |
| 11 | Scope check on actions and tests: nurse-own steps, own-protocol oxygen below SpO2 94, basic airway, executing an order with agent and dose check, refusal with "يحتاج أمراً من الطبيب" | 2842–2991 | live | `apply` 2169, 2177; orders panel 3076–3077; records panel 4334 |
| 12 | Fixed doctor line and fixed instructor line (offline, or server held the reply) | 2994–3035 | live | `docLine` from 2596, 2659; `instructorLine` from 1786 and 2558 |

Other notes on reachability:
- `nurseAct` branch for `call_senior` / `call_icu` (2846–2850) cannot be reached through `apply`, because `nursePre` removes those two ids from `read.actions` first (2598). It is reachable from the orders panel click (3077) only if an order with that id exists, and from the test hook `window.__nbER.nurseAct` (4704). Whether any case has such an order: not determined (order ids are mostly the object keys; not enumerated).
- Order `when` values present in the data: phone 49, gated 4, collapse 2, stage3 2, vt 1. All five branches of `orderDue` have data.

## Declarations

N = `E.nurse`, X = `E.nurse.esc`. "R:" read, "W:" written.

| Name | Lines | Kind | Responsibility | Layer | Shared state read / written | Called from |
|---|---|---|---|---|---|---|
| `handleNurse(text)` | 2538–2560 | async function | One nurse-mode message: SBAR shortcut, server call, local fallback, choose reply source, hand to `apply` | application | R: E, X.awaiting, E.pending, ACT, actRetried. W: actRetried, read.text | `handle` 1915 |
| `escTurn(text)` | 2561–2566 | function | Count a turn for an SBAR message and run `escReply`, then `director('turn')` | application | W: E.turns, E.busyTurn | `handleNurse` 2545 |
| `nursePre(read, text)` | 2568–2599 | function | Commit side effects of a reading before actions run: read-back, airway assessment, blood draw, allergy band, list open orders, allergy answer, held drugs, help call, escalation routing; strips call_senior/call_icu from actions | domain (state transitions) mixed with presentation (sys lines) | R: E.turns, E.sim, E.facts. W: N.readBack, N.airwayAt, N.drawn, N.bandNoted, N.allergyToldDoc, X.contacts, X.updateAt, read.actions, read.tests | `apply` 2140 (passes a third argument `to`, ignored) |
| `helpCall()` | 2601–2606 | function | Record a code-team call | domain | W: N.helpAt, E.log | `nursePre` 2589 |
| `allergyAnswer(t)` | 2608–2625 | function | Interpret the answer to the doctor's allergy question; release held orders | domain | W: N.allergyAnswered, N.allergyGuess, N.allergyToldDoc, N.holdRel, N.relLead | `nursePre` 2584 |
| `nursePost(read, to)` | 2626–2634 | function | After a turn: read-back window countdown; count messages not addressed to the waiting doctor, nag at 2, give up at 4 | domain | W: N.rbTurns, X.unans, X.nagged | `apply` 2227 |
| `escalate(text, quiet)` | 2637–2653 | function | First call to the doctor: timestamps, credit `call_senior`, open the SBAR wait, schedule greeting | domain + application | W: X.calledAt, X.by, X.contacts, X.awaiting, X.awaitAt, X.hello, X.buf, E.done, E.log, E.jobs | `nursePre` 2592, `nurseAct` 2847, `basicAirway` 2886 |
| `reEscalate(read, text)` | 2654–2661 | function | A later call: record update, bring the doctor if absent, else `docLine`; release orders | domain | W: X.contacts, X.updateAt | `nursePre` 2595 |
| `escReply(text)` | 2663–2679 | function | Accumulate SBAR text, grade it, ask one clarifying question, mark half-credit parts | domain | W: X.buf, X.turns, X.hello, X.before, X.asked | `escTurn` 2564, `escalate` 2646 |
| `escFinish(g)` | 2680–2691 | function | Close the SBAR: store grade, decide the allergy hold, release orders, schedule arrival (0.2 min at stage >= 2, else 1.5) | domain | W: X.sbar, X.awaiting, N.escDoneTurn, N.allergyToldDoc, N.allergyAskedByDoc, N.allergyAskTurn, N.holdRel | `escReply` 2678 |
| `escGiveUp()` | 2693–2701 | function | No SBAR given: store an all-false grade with `none: true`, doctor comes | domain | W: X.awaiting, X.sbar | `nursePost` 2632, `nurseTick` 2742 |
| `doctorArrives()` | 2702–2711 | function | Mark the doctor present, rebuild chips, credit `call_icu` when `care.call_icu.key`, release orders | domain + presentation call | W: N.present, E.done | scheduled via `later` at 2592, 2593, 2658, 2690, 2700, 2720, 3007; direct 2719 |
| `nurseStageRise(s)` | 2712–2722 | function | Hook on stage rise: mark re-escalation needed, nudge, doctor arrives by alarm at stage 3 or VT | domain | W: X.reNeeded, X.reNeededAt, X.by, N.alarmAt | stage change 215 |
| `nurseTick()` | 2723–2744 | function | Per-clock-tick rules: timestamps (low SpO2, allergy asked, temperature), instructor nudges, allergy-hold timeout, stale-order cancel, phone nag / give-up | domain | R: live(), E.sim. W: N.lowAt, N.allergyAt, N.tempAt, N.holdRel, X.nagged | clock 150 |
| `orderDue(o)` | 2747–2755 | function | Is a case-file order due now (`when`: phone / gated / collapse / vt / stage3; `gate.needTest`, `gate.needDone`) | domain | R: E.tests, E.done, E.stage, E.vtNow, N.present | `releaseOrders` 2771; 1475 |
| `cancelNow(src)` | 2757 | const arrow | Order's stop rule: `cancelSbp` vs untreated SBP, `cancelStage` vs stage | domain | R: E.stage | 2738, 2776, 2789 |
| `ordItem(o)` | 2759 | const arrow | Text of one order: name + `show` + chosen dose `pick` | presentation (text) | none | 2798 (alias `item`) |
| `releaseOrders()` | 2761–2815 | function | Create due orders in N.orders, mark pre-done ones, cancel by stop rule, compose and speak the doctor's line, log, run the doctor's own steps, rebuild the panel; returns whether the doctor spoke | domain + presentation + application | W: N.orders, N.ordersAt, N.relTurn, N.rbTurns, N.holdRel, E.log | 2622, 2660, 2688, 2699, 2710, 2721, 2736, 2738, 2959, 3340, 3549, exported 4704 |
| `docDoes(o)` | 2817–2840 | function | The doctor performs shock / airway / other step through `give`, with `N.docDoing` set | domain | W: N.docDoing, N.lastShock, N.interv, o.doneAt | `releaseOrders` 2810, 2812 |
| `nurseAct(a, text)` | 2842–2879 | function | Judge a trainee action: calls, basic airway, vitals re-check, order execution, own-protocol oxygen, nurse-own steps, else scope gap | domain | W: N.vchecks, E.done, E.tempKnown, N.tempAt, E.bpAt, N.notIndicated, E.log | `apply` 2169, panel 3077, exported 4704 |
| `basicAirway()` | 2881–2888 | function | Record BLS airway step; escalate silently at stage >= 3, else nudge | domain | W: N.bls, E.log | `nurseAct` 2852 |
| `ownOxygen(a, text)` | 2889–2895 | function | Oxygen under the nurse's protocol: ask device and flow if no dose, else `order` | application | W: E.pending (through `ask`) | 2869, 2918 |
| `agentClash(id, text, exec)` | 2897–2902 | function | True when the message names a limit agent that the order text does not | domain | R: E.c.care[id].limits, catalog limits | `nurseExec` 2916 |
| `sameDose(typed, exec)` | 2904–2912 | function | Typed dose vs ordered dose in base units, tolerance 0.85–1.15 | domain | R: E.c.kg | `nurseExec` 2925 |
| `nurseExec(ord, a, text)` | 2914–2933 | function | Execute an order: allergen / wrong-agent check, reminder path, dose check, then `order` with the order's own dose | domain | W: E.wrongDoses, E.log | `nurseAct` 2866, 2875 |
| `nurseGave(a, meta)` | 2935–2956 | function | After `give` in nurse mode: record intervention, schedule reassessment prompt (3 min), record drug given and allergy status, close the matching order | domain | W: N.interv, N.reassess7, N.last7, E.hints, N.given, order.doneAt | `give` 3289 |
| `nurseTest(id, reason, ok)` | 2957–2972 | function | Test request: allowed if nurse-own test, open order or already requested; else scope gap; returns boolean | domain | W: order.doneAt | `apply` 2177, panel 3076, records panel 4334, exported 4704 |
| `scopeGap(kind, id, why, ord)` | 2974–2991 | function | Record an out-of-scope attempt and say why; instructor line once per id (first three distinct ids) | domain + presentation | W: N.scope, N.scopeSaid, E.hints, E.log | 2878, 2916, 2970 |
| `DX_Q` | 2994 | const RegExp | "what is the diagnosis" question | domain (language rule) | none | 3002, 3029 |
| `docLine(read, t)` | 2995–3022 | function | The doctor's fixed reply by priority (allergy, diagnosis, come, read-back, mentioned step, plan, update, default) | presentation (text) with state writes | W: X.updateAt; schedules `doctorArrives` | `nursePre` 2596, `reEscalate` 2659 |
| `instructorLine(read, t)` | 3023–3035 | function | The instructor's fixed reply; rotating teaching questions | presentation (text) | W: N.teachAt | `localReply` 1786, `handleNurse` 2558 |

## Shared state, globals and contracts

Defined here for other parts of er.js (nothing is put on `window` in the range; `window.__nbER` at 4704 re-exports `nurseAct`, `nurseTest`, `releaseOrders`):

| Provided | Consumer (line) |
|---|---|
| `handleNurse` | `handle` 1915 |
| `nursePre`, `nursePost` | `apply` 2140, 2227 |
| `nurseAct`, `nurseTest` | `apply` 2169, 2177; orders panel 3076–3077; records panel 4334 |
| `nurseGave` | `give` 3289 |
| `nurseTick`, `nurseStageRise` | clock 150, stage change 215 |
| `releaseOrders` | 3340, 3549 (after results / actions, via `later(0.02)`) |
| `orderDue` | 1475 (held drug ids for the reader) |
| `instructorLine`, `docLine` | `localReply` 1786; comment at 1856 |
| `cancelNow`, `ordItem`, `DX_Q` | used only inside the range |

Expected from elsewhere in er.js (declaration line):

| Kind | Names |
|---|---|
| Session state | `E` (session object), `D` (catalog: `D.actions`, `D.tests`), `NM()` 29, `ACT` / `actRetried` 709 |
| E fields read or written | `sim, turns, busyTurn, over, stage, topStage, vtNow, pending, facts (Set), done (Map id -> {at,last,n,dose,ok,amt,top}), tests[id] {at, back}, log, jobs, hints, wrongDoses, tempKnown, bpAt, bp, c (case), nurse` |
| Nurse state (shape from `newNurseState` 2477–2489) | `nm, doc, sex, present, esc{calledAt, by, awaiting, awaitAt, asked, before, buf, turns, unans, sbar, reNeeded, reNeededAt, updateAt, contacts[], hello, nagged}, orders[], ordersAt, relTurn, rbTurns, readBack, scope[], scopeSaid, notIndicated[], given[], interv[], vchecks[], lowAt, drawn, airwayAt, tempAt, allergyAt, teachAt, reassess7, last7, allergyToldDoc, allergyAskedByDoc, bandNoted, docDoing, lastShock, alarmAt, allergyAskTurn, allergyAnswered, allergyGuess, holdRel, escDoneTurn, helpAt[], bls[], acts, rx.docv`; `relLead` is added ad hoc at 2621 (not in the initial shape) |
| Reading and language | `localRead` 1090, `nurseShape` 1418, `nurseVocs` 1399, `nz` 1088, `norm` 37, `digits` 772, `wordsIn` 51, `hasAny` 764, `mentionedIds` 1414, `doseOf` 785, `gradeSbar` 2521, `BAND` 1394, `ALLERGY_W` 1388, `CALL_N` 1381, `BLS_AIR` 2472, `ADV_AIR` 2473 |
| Rules and constants | `NURSE_OWN` 2467, `NURSE_TESTS` 2468, `DOCTOR_ONLY` 2469, `ESC_SPOKEN_MIN` = 8 and `O2_OWN` = 94 (2470), `SCOPE_NOTE` 2475, `isDrug` 2476, `reached` 2501, `escBy` 2503, `openOrd` 1415, `fell` 3820, `untreatedSbp` 2412, `tooEarly` 2413, `allergicTo` 2387, `doseBad` 2428, `live` 80, `actOf` 42, `testOf` 41 |
| Effects | `call` 670 (network), `loadAct` 4660 (network), `typing` 645, `sys` 641, `docSay` 640, `person` 611, `dOnce` 2510, `log` 643, `later` 229, `ask` 2317, `apply` 2061, `localReply` 1783, `director` 3620, `order` 3101, `give` 3283, `orderTest` 3492, `paint` 93, `spokenVitals` 110, `nurseChips` 3038, `buildOrders` 3046, `docTitle` / `docT` / `docW` / `comes` / `docKnows` 2496–2500 |
| `read` object fields consumed | `to, text, readBack, airwayAssess, draw, band, allOrders, toDoc, allergyReply, heldGive, heldAsk, help, escalate, actions[{id,dose,agent}], tests[{id,reason,reason_ok}], mentioned, named, whichDrug, suggested, planOnly` |
| Server response fields consumed (`call`) | `read, reply, to, voiceFailed, held` (2554–2558) |
| DOM ids | none touched directly in the range |

## Data, storage and network

| Item | Detail |
|---|---|
| Network (indirect) | `handleNurse` 2549 calls `call({text, pending})`. `call` (670–684, outside the range) POSTs JSON to `API` (line 12: `/api/er-chat` on a `*.vercel.app` host, otherwise the absolute deployed URL) with case id, risk, anxiety, state, last 14 chat entries, `role: 'nurse'` and up to 12 order status strings. With the API off, `call` returns null and the local reader is used. |
| Network (indirect) | 2550: when the call failed and the offline act model is not loaded, `loadAct()` (4660) fetches `data/er-act.json` once (`actRetried`). Duplicate of the same line in `handle` 1938. |
| Storage | none (no localStorage / sessionStorage in the range). |
| Timers | no `setTimeout`. Deferred work uses `later(min, fn)` (229), which pushes `{at: E.sim + min, fn}` onto `E.jobs`. Delays used: 0.01, 0.15, 0.2, 0.3, 1.5, 3 sim-minutes (2592, 2593, 2652, 2658, 2690, 2700, 2720, 2940, 2949, 3007). Real-time length of a sim-minute: not determined in this range. |
| Audio, history API | none. |
| Case JSON fields read (data/er-cases.json) | `case.nurseMode.orders{key: {id?, kind 'act'|'test', when, gate{needTest, needDone}, show, exec, pick, reminder, optional, repeat, doctorDoes, line, cancelSbp, cancelStage, cancelLine}}`, `nurseMode.dxAfter{text, gate}`, `nurseMode.doctor{name, sex}` (through N); `case.care[id]{key, harm, off, needFact, allergyKw, limits[{kw}]}`, `case.results[id].ind`, `case.patient.sex`, `case.collapse{dx, need}`, `case.temp`, `case.kg`. Field counts over the 58 orders: reminder 18, optional 5, pick 3, gate 5, doctorDoes 3, cancelSbp 2, cancelStage 1, cancelLine 2, repeat 1, id 1, line 1. |
| Catalog fields read | action `ar, dose, limits, repeat.max, kw`; test `ar, kw`. |
| Records produced for scoring / debrief (consumers outside the range) | `N.scope[{id, kind, at, why}]`, `N.notIndicated[{id, at, spo2}]`, `N.given[{id, at, allergyAsked}]`, `N.interv[{id, at, ar, byDoc}]`, `N.helpAt[{at, stage, vt}]`, `N.bls[]`, `N.vchecks[]`, `X.contacts[{at, kind 'call'|'update'}]`, `X.sbar` (grade object, plus `half`, or `none: true`), `E.wrongDoses[{id, ar, dose, ref}]`, `E.log` entries of type action / order / scope / dose / check. |

## Calculations and rules worth pinning with a golden-master test

No randomness and no wall-clock time enter any of these; the only time input is `E.sim` and turn counters. All are deterministic given the session state.

| Name | Lines | Inputs | Outputs |
|---|---|---|---|
| `orderDue` | 2747–2755 | order `{when, gate}`, `E.tests`, `E.done`, `E.stage`, `E.vtNow`, `N.present`, `fell()`, `untreatedSbp()` | boolean per `when` value (phone, gated, collapse < 90 SBP or stage >= 3, vt, stage3) |
| `cancelNow` | 2757 | `{cancelSbp, cancelStage}`, untreated SBP, stage | boolean |
| `releaseOrders` | 2761–2815 | case orders, N.orders, holdRel, stage, done/tests, `tooEarly` | new N.orders entries (15 fields, 2779), cancellations, exact doctor line (lead phrase chosen at 2801: first / gated-with-test / gated / other; `relLead` override), log lines, return value |
| `sameDose` | 2904–2912 | typed dose text, order `exec` text, `E.c.kg` | boolean; base units = value x unit factor x kg (if per-kg) x 60 (if per-minute rate); accepted window 0.85 x low to 1.15 x high; returns true when either dose cannot be parsed or the typed one is unsure |
| `agentClash` | 2897–2902 | action id, message, order `exec`, limits keywords | boolean |
| `nurseExec` | 2914–2933 | order, action, text | one of: scope gap 'wrong-agent', reminder path, wrong-dose record + refusal line, or `order()` with `dose = ord.exec`, `_ok: 'good'`; bare "لتر" for fluids = '1 L' (2924) |
| `nurseAct` decision table | 2842–2879 | action id, text, SpO2 (rounded) vs 94, open/repeat order, NURSE_OWN, DOCTOR_ONLY, allergy keywords | which branch runs; `N.notIndicated` de-duplicated within 1 sim-min (2871) |
| `nurseTest` | 2957–2972 | test id, NURSE_TESTS, open order, already-requested, cancelled-this-instant | boolean + scope record |
| `scopeGap` | 2974–2991 | kind, id, why | `N.scope` record, first-time vs repeat system line, instructor line only while distinct ids <= 3 |
| SBAR collection (`escalate`, `escReply`, `escFinish`, `escGiveUp`) | 2637–2701 | message text(s), word count vs 8, `gradeSbar` result | `X.asked` ('a' before 'b'), `X.before`, `g.half`, `X.sbar`, allergy hold decision (2684–2687), arrival delay 0.2 vs 1.5 |
| Phone wait limits | 2629–2633, 2740–2743 | `X.unans`, `E.sim - X.awaitAt` | nag at 2 turns or 1.5 min; give up at 4 turns or 3 min |
| `allergyAnswer` | 2608–2625 | normalised text, `E.facts.has('allergy')`, `N.holdRel` | `allergyGuess` vs `allergyToldDoc`, doctor line, release |
| `nurseTick` nudges | 2723–2744 | `live().spo2`, `E.sim`, `escBy()`, open orders older than 3 min, holdRel older than 1 min | timestamps and once-only lines '1','2','3','8' |
| `nurseStageRise` | 2712–2722 | new stage, `E.vtNow`, reached, present, awaiting | `X.reNeeded`, alarm arrival (`X.by = 'alarm'`) |
| `nurseGave` reassessment prompt | 2940–2944 | time of intervention, `N.vchecks`, `N.reassess7` (max 2), `N.last7` (2 min gap) | prompt line + `E.hints++` |
| `docLine` priority ladder | 2995–3022 | read, normalised text, orders, case care/results, dxAfter gate | one of 11 fixed lines; `X.updateAt` side effect (3017) |
| `instructorLine` | 3023–3035 | read flags, named ids, `N.teachAt` | fixed line; rotation over 5 questions by counter |

## Problems

| Severity | Kind | Evidence |
|---|---|---|
| medium | architecture | `releaseOrders` (2761–2815) mixes five concerns in one function: order creation and cancellation (state), Arabic sentence composition (2801–2806), logging (2809), executing the doctor's own steps (2810–2812) and DOM rebuild (`buildOrders` 2813). It is also called from the per-tick loop (2736, 2738), so a rendering call sits inside a domain tick. |
| medium | architecture | Domain decisions and user-visible Arabic strings are interleaved in every function of the range (for example `nursePre` 2571–2587, `scopeGap` 2979–2990, `nurseAct` 2858–2872). No rule can be tested without the chat sink (`sys`, `docSay`, `person`). |
| medium | architecture | Functions named as text producers change state: `docLine` writes `X.updateAt` (3017) and schedules `doctorArrives` (3007); `instructorLine` advances `N.teachAt` (3034). |
| medium | bug | `sameDose` returns true when the typed dose is unparsable or unsure, or the order's `exec` is unparsable (2906); the refusal at 2925 then depends on `doseBad` alone. After that `nurseExec` always gives the order's own dose (`dose: ord.exec`, `_ok: 'good'`, 2932), so a typed dose that was not understood is recorded as the ordered dose. Whether this is intended: not determined. |
| medium | maintainability | `escGiveUp` builds the SBAR grade object by hand (2697) instead of through `gradeSbar`; its shape must be kept in step with `gradeSbar` (2521) manually. It also bypasses `escFinish`, so `N.escDoneTurn` and the allergy-hold decision (2682–2687) are not applied on the give-up path. |
| low | duplication | The nag line 'ألو؟ شو الوضع عندك؟' and give-up rule exist twice (turn-based 2631–2632, time-based 2741–2742). "Record an update contact" is written three times (2593, 2656–2657, 3017). The act-model retry line 2550 duplicates 1938. The arrival of the doctor on "come" exists in `reEscalate` 2658 and `docLine` 3007. |
| low | dead-code | `nurseAct` branch for `call_senior` / `call_icu` (2846–2850) is unreachable through `apply` because `nursePre` strips both ids (2598); remaining callers are the orders panel (3077) and the `__nbER` hook (4704). |
| low | maintainability | Hard-coded step ids and lines inside `docDoes` (`'shock'`, `'airway'`, `'cath_lab'`, fixed sentence at 2836) while the airway line comes from data (`o.line`, 2833). |
| low | maintainability | `nursePre` is declared with two parameters (2568) and called with three (2140). `const item = ordItem` (2798) is a redundant alias; the condition at 2799 is repeated at 2800. `N.relLead` is used as a temporary argument channel between `allergyAnswer` (2621–2623) and `releaseOrders` (2802) and is not part of `newNurseState`. `docW().slice(2)` (2950) derives a word by cutting the article off a string. |
| low | maintainability | In `allergyAnswer` the alternatives `لأ` (2615) are tested against text already passed through `nz`/`norm`, which maps أ to ا (norm, line 37); that alternative cannot match. Effect on behaviour: none found. |
| low | architecture | The engine session `E` is a single mutable object shared by every function; the range reads or writes about 45 distinct `E.nurse` fields with no accessor, so the nurse state has no single owner. |

## Proposed source fragments

Validated with `node tools/legacy/check-fragment.mjs er.js 2537-2635 2636-2711 2712-2745 2746-2840 2841-2895 2896-2933 2934-2992 2993-3036 --iife`: all eight print `ok`. All start lines are in `.work/er-cuts.txt`.

| Order | File | From–to | Single responsibility | Layer |
|---|---|---|---|---|
| 1 | `er-nurse-message.js` | 2537–2635 | One nurse-mode message: routing (`handleNurse`, `escTurn`) and the pre/post commit hooks of `apply` (`nursePre`, `helpCall`, `allergyAnswer`, `nursePost`) | application |
| 2 | `er-nurse-escalation.js` | 2636–2711 | Escalation state machine: call, re-call, SBAR collection, finish, give-up, doctor's arrival | domain |
| 3 | `er-nurse-clock-hooks.js` | 2712–2745 | Stage-rise and per-tick rules (`nurseStageRise`, `nurseTick`) | domain |
| 4 | `er-nurse-orders-release.js` | 2746–2840 | The doctor's orders: due / cancel rules, release with the spoken line, the doctor's own steps | domain |
| 5 | `er-nurse-scope-actions.js` | 2841–2895 | Judging a trainee action against the nurse's scope (`nurseAct`, `basicAirway`, `ownOxygen`) | domain |
| 6 | `er-nurse-order-execution.js` | 2896–2933 | Executing an order as written: agent clash, dose match, `nurseExec` | domain |
| 7 | `er-nurse-given-tests-scope-gap.js` | 2934–2992 | Recording outcomes: `nurseGave`, `nurseTest`, `scopeGap` | domain |
| 8 | `er-nurse-fixed-lines.js` | 2993–3036 | Fixed doctor and instructor lines (`DX_Q`, `docLine`, `instructorLine`) | presentation |

## Open questions

1. `sameDose` accepts an unparsable or unsure typed dose (2906) and `nurseExec` then gives the ordered dose. Is that the intended clinical rule, or should an unreadable dose be asked again?
2. On the give-up path (`escGiveUp`) the doctor never asks about allergies and `N.escDoneTurn` stays at -99. Is that intended, and does the scoring code depend on `escDoneTurn`? Not determined (consumers are outside the range).
3. Real duration of one simulation minute, and therefore of the 0.15 / 1.5 / 3 minute phone limits: not determined in this range (the clock is at about 150).
4. Does any case give an order whose id is `call_senior` or `call_icu`, which would make the branch at 2846–2850 reachable from the orders panel? Not determined.
5. `doctorArrives` credits `call_icu` as done with `ok: 'good'` when the case marks it key (2708–2709), without any action by the trainee. Is this credit meant to count in the nurse's score? Scoring is outside the range.
6. Online nurse mode (server reading and voiced replies, 2554–2558) was not exercised: the local server answers 404 for `/api` and the deployed endpoint must not be called.
