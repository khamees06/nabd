# ER room, nurse mode side panel and what follows, and tests — er.js:3037–3557

## Purpose

The range opens with the nurse-mode side panel (participant chips, the "doctor's orders" list, click-to-execute, role switch) but most of it is the core order pipeline of the ER room, used by both roles: `order` (checks an order against the case), `give` (applies a treatment to the simulation state), `unsafe`/`harm` (challenge and injury path), and `resolve` (handles the trainee's answer to an open question). It also holds the batching of nurse read-back lines, the delayed "treatment worked" line, and the test (lab/imaging) ordering path: `orderTest`, `submitTest`, the result card and the supervisor's "read this result" question. Clinical rules, Arabic text matching, nurse dialogue strings, AI grading instructions and DOM rendering are interleaved in the same functions. There is no fetch, storage or timer API call in the range itself; time enters through the simulated clock `E.sim` and the job queue `E.jobs`.

## Features and user journeys implemented here

| # | Feature (what the user sees or does) | Lines | Reachability | Evidence |
|---|---|---|---|---|
| 1 | Nurse mode: participant chips renamed (nurse chip shows the doctor's name plus «(خارج الغرفة)» when absent; supervisor chip reads «المشرفة») | 3038–3044 | live | Called at 2706, 4388. Probe: `nbDemoLogin('rana')` + `nbOpenER()` gave chip texts «د. ريم (خارج الغرفة)» and «المشرفة». |
| 2 | Nurse mode: "doctor's orders" panel list (`#er-ord-list`), open orders first, state chips (waiting / done at time / cancelled / reminder / done by doctor), badge count on `#er-test` and `#er-tab-labs` | 3046–3066 | live | Called at 2813, 2955, 2965, 2969, 3082; exported in `window.__nbER` (4704). `#er-ord` is created at 4578–4584. Probe: `#er-ord` exists and is hidden while there are no orders (3055). |
| 3 | Nurse mode: click a button in an order row to execute it (same path as typing) | 3068–3084 | live | Delegated click handler at 4601–4602 (`[data-ord]`); also exported (4704). |
| 4 | Nurse mode: tag on each test button (own scope / doctor's order / needs an order) | 3085–3089 | live | Used by the records panel template at 4281. |
| 5 | Role switch doctor/nurse, allowed only before the case starts | 3091–3099 | live | `setRole` called at 4529, 4548 (brief dialog `[data-role]` buttons); `canSwitch` used at 4434 to show the locked text. |
| 6 | Ordering a treatment by chat: prerequisites, allergy, too-early, dose question, dose check, titration (doctor room), oxygen device mapping | 3101–3208 | live | `order(` called at 2161, 2169, 2293, 2312, 2439, 2876, 2894, 2919, 2932 and recursively in range. |
| 7 | Treatment takes effect: vitals modifiers, risk slowing, anaphylaxis rescue, shock for VT, nurse read-back, relative reaction | 3283–3347 | live | `give(` called at 2827, 2830, 2835, 2934, 3149, 3207, 3456. |
| 8 | Delayed "after X, SpO2 went from a to b" nurse line and patient "I feel better" line | 3222–3261 | live | `answerLater` called at 3312; `respond` only from 3232. |
| 9 | Batched read-back: several orders in one message get one «حاضر، X، وY» line | 3264–3281 | live | `sayBack` 3298–3300; `flushBack` at 2121, 2178, 3078; `sayDone` at 3335. |
| 10 | Unsafe order: the nurse challenges it if the risk fact is known, otherwise it is given and harms the patient after 0.3 sim-min | 3349–3396 | live | `unsafe` called at 3155, 3424; `harm` at 3366, 3470. |
| 11 | Answer to an open question (offer / dose / reason / unsafe / interpret), including cancel, retry once, accept the proposal | 3398–3485 | live | `resolve(` called outside the range (er.js 2121 area; exact call sites not listed because the name collides with `Promise.resolve`: not determined beyond 2121). |
| 12 | Ordering a test: result card in the chat, harm penalty for a dangerous test, late-culture record, supervisor asks for a reading (max 3 per case) | 3492–3556 | live | `orderTest` at 2177, 2962, 3403, 4335, 4338, exported (4704). |
| 13 | Supervisor questions a not-indicated test on the spot | 3521–3524 | dormant | Guarded by `ASK_NO_NOW = false` (3490); comment at 3488–3489 says the question moved to the handover sheet. |

## Declarations

All are directly inside the er.js wrapper function. `E` = the session state object, `NM()` = nurse mode (er.js:29).

| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| `nurseChips` | 3038–3044 | function | Rewrite the nurse and supervisor chip labels in nurse mode | presentation | R: `E.nurse.doc`, `E.nurse.present`. DOM: `.er-p[data-who="n"|"d"]` | 2706, 4388 |
| `ordTime` | 3045 | const arrow | Clock time as LTR `<bdi>` HTML | presentation | uses `clk` | 3060, 3063 |
| `buildOrders` | 3046–3066 | function | Render the orders list and badge counts; keep focus on the same button | presentation | R: `E.nurse.orders`, `REAL`. DOM: `#er-ord`, `#er-ord-list`, `#er-test`, `#er-tab-labs` (`dataset.badge`) | 2813, 2955, 2965, 2969, 3082, export 4704 |
| `execOrder` | 3068–3084 | function | Execute an open order from a panel click: post the trainee line, run `nurseTest`/`nurseAct`, flush read-back, open dose questions | application | W: `E.started`, `E.rbBuf`, `E.collect`. R: `E.nurse.orders`, `E.pending`, `E.queue`, `E.over` | 4602, export 4704 |
| `nurseTag` | 3085–3089 | const arrow | HTML tag for a test button by nurse permission | presentation (contains a rule: `NURSE_TESTS`, order exists) | R: `E.nurse.orders`, `NURSE_TESTS` | 4281 |
| `canSwitch` | 3091 | const arrow | Rule: role may change only before the case starts (`!over && !started && turns===0 && sim<0.05`) | domain | R: `E.over`, `E.started`, `E.turns`, `E.sim` | 3094, 4434 |
| `setRole` | 3092–3099 | function | Validate the role and restart the same case with it | application | W: `roleWanted`. R: `E.role`, `E.c.id`. Calls `begin` | 4529, 4548, export 4704 |
| `order` | 3101–3208 | function | Decide what happens to a treatment order: prerequisites, harm variants, allergy, repeat, titration, dose question, dose check, then `give` | domain + application (with dialogue text and AI grading instructions inline) | R: `E.c.care`, `E.anaph`, `E.stage`, `E.done`, `E.tests`, `E.harmed`, `E.vtNow`, `E.pending`, `E.queue`, `E.inApply`, `E.turns`. W: `E.parked`, `E.lastOrdered`, `E.queue`, `E.wrongDoses`, fields on `a` (`said`, `dose`, `sayDose`) | 2161, 2169, 2293, 2312, 2439, 2876, 2894, 2919, 2932, 3181, 3358, 3403, 3438, 3458, 3469 |
| `badDose` | 3209 | const arrow | Record a wrong dose and log it | domain | W: `E.wrongDoses`, `E.log` | 2454, 3148, 3195, 3448 |
| `settle` | 3212–3218 | function | Drop open questions that an arriving order has answered | application | W: `E.queue`, `E.held`, `E.parked`, `E.pending` | 1980, 1990, 2000, 3287, 3505 |
| `answerLater` | 3222–3235 | function | Schedule one combined "response to treatment" for treatments given close together | application | W: `E.resp`, `E.jobs`. R: `E.sim`, `E.risk`, `E.stage`, `E.over` | 3312 |
| `SPOKEN` | 3237 | const object | Short spoken Arabic name per treatment id (21 keys) | presentation (text data) | — | 1577, 1741, 1810, 1814, 2010, 3137, 3251, 3298, 3300, 3375, 3376 |
| `respond` | 3238–3261 | function | Compare vitals before/after with thresholds, compose the nurse line, lower relative anxiety, queue a patient improvement line | domain (thresholds) + presentation (text) | W: `E.bpAt`, `E.anx`, `E.saidBy`, `E.improved`. R: `E.c.hyper`, `E.c.improveBy`, `E.c.improve`, `E.vtNow`, `E.stage` | 3232 |
| `joinSaid` | 3264 | const arrow | Join read-back lines, stripping «حاضر» and final dots | presentation | — | 3274, 3276 |
| `sayBack` | 3265–3269 | function | Buffer a read-back line or say it now | presentation | W: `E.rbBuf`. R: `E.nurse.docDoing` | 3298, 3299, 3300 |
| `flushBack` | 3270–3277 | function | Emit the buffered read-back as one line (nurse mode: one system line) | presentation | W: `E.rbBuf` | 2121, 2178, 3078 |
| `sayDone` | 3278–3281 | function | Collect "done" lines for 0.005 sim-min and say them as one | presentation | W: `E.doneBuf`, `E.jobs` (via `later`) | 3335 |
| `give` | 3283–3347 | function | Apply a treatment: record in `E.done`, add risk-slowing effect and vitals modifier, anaphylaxis/VT rescue, read-back, relative's reaction | domain (state transition) with presentation calls | W: `E.done`, `E.lastGiven`, `E.effects`, `E.mods`, `E.anaph.treated`, `E.risk`, `E.stage`, `E.vtNow`, `E.shockedAt`, `E.bpAt`, `E.tempKnown`, `E.stepKind`, `E.rbBuf`, `E.log` | 2827, 2830, 2835, 2934, 3149, 3207, 3456 |
| `unsafe` | 3349–3367 | function | Unsafe order: challenge if the fact is known, else confirm a bare name, else harm | domain | R: `E.facts`, `E.reacted`, `E.done`, `E.pending`, `E.queue`. W: `E.caught`, `E.log` | 3155, 3424 |
| `harm` | 3369–3396 | function | Record the harm, raise risk after 0.3 sim-min, start anaphylaxis, alarm, relative and coach reactions | domain | W: `E.harmed`, `E.reacted`, `E.lastGiven`, `E.done`, `E.effects`, `E.unneeded`, `E.harms`, `E.risk`, `E.anaph`, `E.bpAt`, `E.anx`, `E.log` | 3366, 3470 |
| `resolve` | 3398–3485 | function | State machine for the answer to the pending question, by `p.type` and `grade` | application + domain | W: `E.pending`, `E.resolved`, `E.queue`, `E.tests[id].read`, `E.log`. R: `E.lastQ`, `E.lastRead`, `E.c.care`, `E.turns` | outside the range (2121 area) |
| `ASK_NO_NOW` | 3490 | const boolean (`false`) | Feature switch for the on-the-spot question about a not-indicated test | domain (configuration) | — | 3521 |
| `orderTest` | 3492–3502 | function | Order a test once; if already ordered, scroll to its card and say its status | application | R: `E.tests`. DOM: `have.el.scrollIntoView` | 2177, 2962, 3403, 4335, 4338, export 4704 |
| `submitTest` | 3504–3528 | function | Create the test record with its indication, late-test record, delayed result after a fresh cannula, harm penalty (+6 risk) and supervisor line | domain + application | W: `E.tests[id]`, `E.lateTests`, `E.risk`, `E.askedNo`, `E.busyTurn`, `E.log`. R: `E.c.results`, `E.done` | 3466, 3501 |
| `resultText` | 3530–3533 | const arrow | Result rows and report as one plain string | domain (formatting for AI and scoring) | R: `E.c.results` | 657, 3478 |
| `labCard` | 3534–3542 | function | HTML card of a result (table, flags, report, off-indication badge) | presentation | R: `E.c.results`, `E.tests`, `REAL`, `OFF_BADGE` | 3548 |
| `resultBack` | 3543–3556 | function | Mark the result as back, post the card, release nurse orders, ask the trainee to read it | application | W: `E.tests[id].back`, `E.tests[id].el`, `E.readAsks` | 3516, 3517 |

## Shared state, globals and contracts

Defined here for others:

| item | consumer |
|---|---|
| `window.__nbER.setRole`, `.execOrder`, `.buildOrders`, `.orderTest` (export object at er.js:4704) | test harnesses and script.js (script.js:6060 reads `window.__nbER`) |
| `SPOKEN` map | er.js 1577, 1741, 1810, 1814, 2010 (`spk`) |
| `settle`, `badDose`, `flushBack`, `order`, `give`, `orderTest`, `resultText` | earlier parts of er.js (lines listed above) |
| `E.tests[id]` record shape: `{ id, at, reason, reasonOk, ind, why, back, read, el }` (3511, 3545, 3548, 3475) | records panel, scoring (3764+), `offInd` |
| `E.done` entry shape: `{ at, last, n, dose, ok, amt, top }` (3286, 3378) | scoring, `again`, `overTotal` |
| `E.harms[]` `{ at, label, why, risk }`; `E.unneeded[]` `{ label, why }`; `E.caught[]` `{ id, ar, why }`; `E.wrongDoses[]` `{ ar, dose, ref }`; `E.lateTests[]` `{ ar, why }` | debrief and scoring at 3764–3900, 4002–4171 |
| `E.effects[]` `{ id, from, slow }`; `E.mods[]` `{ id, from, ramp, spo2?, hr?, rr?, sbp?, dbp? }` (3305, 3309–3311) | simulation tick / `live()` |
| Pending-question shapes: `{type:'dose', a, name, tip, sug, caveat?, retried?, ask}`, `{type:'offer', id | a, ask}`, `{type:'unsafe', a, def, allergic, ask}`, `{type:'interpret', id, ask}`; `resolve` also handles `{type:'reason', id, retried?}` created elsewhere | `ask`, `nextQuestion`, network call (see below) |
| DOM contract: `button[data-ord="<kind>:<id>"]` inside `#er-ord-list` | click handler 4601–4602, focus keeper 4272 |

Expected from others (all defined outside the range, same wrapper):

- State and flags: `E`, `NM` (29), `roleWanted` (28), `REAL` (45), `offInd` (48), `OFF_BADGE` (49).
- Helpers: `$`, `esc`, `clk`, `norm`, `clamp`, `pickOf` (40), `live` (80), `paint` (93), `spokenVitals` (110), `stageCheck` (173), `later` (229), `soon` (232), `say` (598), `person` (611), `nurse` (637), `sys` (641), `alert` (642, shadows `window.alert` inside the wrapper), `log` (643), `voice` (698), `amountOf` (859), `doseFor` (870), `doseOf`, `doseIn`, `doseBad`, `isDrug`, `actOf`, `testOf`, `sayNameOf` (1073), `agentOfSug` (1075), `resultBrief` (1647), `wordDose` (1659), `hisHer` (1700), `shortTip` (2008), `spk` (2010), `openDoses` (2253), `nextQuestion` (2285), `ask` (2317), `offCase` (2405), `untreatedSbp` (2412), `tooEarly` (2413), `again` (2430), `overTotal` (2450), `allergicTo`, `escalate` (2637), `releaseOrders` (2761), `nurseAct` (2842), `nurseGave` (2935), `nurseTest` (2957), `compOn` (3597), `director` (3620), `coach` (3692), `buildRecords` (4266), `begin`.
- Constants: `REPEAT_OK` (976), `ACCEPT` (2249), `ADJUNCT` (2423), `SUBCUT` (2427), `NURSE_TESTS` (2468), `openOrd` (1415).
- DOM ids: `er-ord`, `er-ord-list` (created at 4578–4584), `er-test` (index.html:1878), `er-tab-labs` (index.html:1853), `er-brief` (4548); chips `.er-p[data-who]` (index.html:1841–1844).
- CSS classes emitted: `er-ord-row`, `is-open`, `er-ord-chip` + `is-x|is-done|is-wait|is-rem|is-doc`, `er-ord-meta`, `er-tag` + `er-tag-own|er-tag-ord|er-tag-need`, `er-card`, `is-off`, `er-off-badge`, `er-card-h`, `er-lab`, `is-flag`, `er-report`, `font-num`.
- Case data fields read (from data/er-cases.json via `E.c`): `care[id]` with `stableHarm{unlessDone,…}`, `after`, `niHarm`, `invasiveHarm`, `needTest`, `needDone`, `needLine`, `allergyKw`, `allergyEffect`, `allergyRisk`, `anaphylaxis`, `suggest{text,dose}`, `dose`, `ivOnly`, `rateOnly`, `harm`, `early`, `needFact`, `challenge`, `why`, `label`, `effect`, `risk`, `off`, `counts`, `slow`, `onset`, `fx{spo2,hr,rr,sbp,dbp,ramp}`, `spo2`, `rb`, `done`, `limits`; `results[id]` with `rows[[name,value,unit,reference,flag]]`, `report`, `ind`, `why`, `whenShock`, `shockWhy`, `before`, `beforeWhy`, `key`; `risk.critical`, `hyper`, `improve[]`, `improveBy{}`, `patient.sex`, `id`. Catalog fields (`actOf`/`testOf`): `ar`, `en`, `id`, `dose`, `suggest`, `pushHarm`, `repeat{up,again}`, `fx`.
- Nurse state: `E.nurse.{doc, present, orders[], esc.calledAt, docDoing, given}`; order item fields `kind, id, ar, show, pick, at, doneAt, cancelled, reminder, doctorDoes`.

## Data, storage and network

| kind | detail |
|---|---|
| fetch | None in the range. Indirect: `voice()` (698) is called at 3481, 3482, 3520, 3523 with an English instruction and an Arabic fallback; `resolve` is driven by a grade that comes from the network or the offline reader. |
| Data sent to the AI endpoint | The `ask` string of each pending question built here (3120, 3122, 3143, 3145, 3184, 3185, 3191, 3198, 3203, 3352, 3554) is posted as `pending.ask` at er.js 1937 and 2549. It contains the reference dose (`def.dose`) and, for results, the reference reading (`res.key`). |
| localStorage / sessionStorage | None in the range. |
| JSON fields | See case data fields above (data/er-cases.json, loaded at 4661). |
| Timers | No `setTimeout`/`setInterval`. Scheduling goes through the simulated-clock queue `E.jobs`: direct pushes at 3228 and 3234; `later(min, fn)` at 3260 (0.08), 3279 (0.005), 3316 (0.15), 3319 (0.1), 3339 (0.1), 3340 (0.02), 3383 (0.3), 3516 (0.12), 3549 (0.02); `soon()` at 3337 (0.02), 3339 (0.03). Units are simulated minutes. |
| Audio | None directly. `alert()` (3390) and `director('alarm')` (3393) are defined elsewhere; whether they play sound was not determined here. |
| History API | None. |
| Focus / scroll | `focus({preventScroll:true})` at 3065; `scrollIntoView({block:'center'})` at 3497. |
| Randomness | `pickOf` (Math.random, er.js:40) at 3480 and 3554. `compOn(kind, id, p, …)` at 3154, 3346, 3527 takes a numeric third argument (named `after` at 3597: a delay, not a probability; its internals were not read). |

## Calculations and rules worth pinning with a golden-master test

| name | lines | inputs | outputs | randomness / time |
|---|---|---|---|---|
| `canSwitch` | 3091 | `E.over, started, turns, sim` | boolean | `E.sim` < 0.05 |
| Order list sort and badge count | 3049, 3057 | `E.nurse.orders` | open orders first, then by `at`; badge = open and not reminder | none |
| `nurseTag` | 3085–3089 | test id, `NURSE_TESTS`, orders | one of three tags | none |
| `order` gate sequence | 3108–3207 | action `{id,dose,agent,sayName,_titr,_asked,…}`, text, case `care`, `E` | one of: refusal line, offer question, dose question, `unsafe`, `give` | `E.sim`, `E.stage`, live SpO2 (3165–3166, threshold 90) |
| Text triggers inside `order` | 3116, 3117, 3118, 3171, 3189 | normalised text | potassium push, mask vs intubation, invasive-too-early, oxygen device, subcutaneous | none |
| Titration (doctor room) | 3131–3151 | previous dose, new dose, `suggest.text` | per-time unit inherited (3136), next oxygen step (3141–3144) | none |
| Repeat-accept rule | 3178–3183 | open dose question with `sug`, `REPEAT_OK` | order placed with the proposed dose | none |
| `answerLater` batching | 3222–3235 | `E.sim`, ramp | one response at `max(at)`; suppressed if `E.stage >= 3` or `E.risk > risk0 + 2` | simulated time |
| `respond` thresholds | 3245–3249 | vitals before/after | parts: SpO2 +2, RR −3, HR −5 (or +8 if HR was < 60), SBP +5 (or −8 if `c.hyper`); anxiety −5 | none; `live()` at call time |
| `joinSaid` / `flushBack` | 3264, 3270–3277 | buffered `[text,name,dose,doneFlag]` | one Arabic line | none |
| `give` effect model | 3285–3313 | `amountOf`, `meta.repeat`, `def.slow/onset/fx/spo2` | `higher`, `share`, `gain`; `E.effects` and `E.mods` entries (from = sim + 0.03, default ramp 0.2) | `E.sim` |
| Anaphylaxis rescue | 3314–3317 | adrenaline while `E.anaph` untreated | risk −18 after 0.15 | simulated time |
| VT shock | 3318–3325 | shock while `E.vtNow` | risk = `c.risk.critical − 5`, stage 2 after 0.1 | simulated time |
| `E.stepKind` classification | 3343–3345 | action id, route text | needle / tube / fluids / oral / drug / other | none |
| `unsafe` known/unknown rule | 3350–3366 | `def.needFact`, `E.facts`, `E.reacted`, `a.bare` | challenge, confirm, or harm | none |
| `harm` risk rule | 3378–3395 | `def.risk` (default 12), `allergyRisk` (default 18), `def.off`, `def.counts` | `E.harms` entry; after 0.3: risk raised, capped at `max(risk, 88)` for anaphylaxis, else 100; anxiety +20 | simulated time |
| `resolve` transitions | 3398–3485 | pending `p`, grade (`good/partial/wrong/na/withdraw/noted/ungraded`), text | next pending, order/give/harm/submitTest, read grade | `pickOf` at 3480 |
| `submitTest` indication | 3506–3519 | `res.whenShock`, `untreatedSbp() < 90`, `res.ind` (default `'no'`), `res.before` | `E.tests[id]`, `E.lateTests`, risk +6 when `ind === 'harm'`; result delayed 0.12 if cannula placed < 0.05 ago | simulated time |
| `resultText` | 3530–3533 | `results[id]` | plain string | none |
| `labCard` | 3534–3542 | `results[id]`, `E.tests[id]`, `REAL` | HTML string | none |
| `resultBack` read question | 3547–3555 | `res.report` (/incubat/i), `res.key`, `res.ind`, `E.readAsks < 3` | interpret question | `pickOf` at 3554 |

## Problems

| severity | kind | evidence with line numbers |
|---|---|---|
| high | architecture | `order` (3101–3208, 108 lines, lines up to 745 characters) mixes clinical rules, Arabic regex text matching, nurse dialogue strings, English AI grading instructions and queue manipulation. The same is true of `resolve` (3398–3485) and `give` (3283–3347). No rule can be tested without the whole `E` object and the chat renderer. |
| high | architecture | Role branching is spread through shared functions: `NM()` or `!NM()` appears more than 45 times in the range (for example 3104, 3106, 3120, 3131, 3158–3169, 3197, 3290–3300, 3331–3344, 3403–3447). Doctor and nurse behaviour cannot be changed independently. |
| medium | data-exposure | The `ask` strings built here carry the reference dose (`def.dose`: 3184, 3185, 3198, 3203) and the reference reading of a result (`res.key`: 3554); they sit in client state (`E.pending`, exported through `window.__nbER.E` at 4704) and are posted to the endpoint at 1937 and 2549. The client decides what the grader is told. |
| medium | architecture | Domain state holds a DOM node: `E.tests[id].el` is set at 3548 and used at 3497 and 3550. `give`, `harm`, `submitTest` call `paint()`, `buildRecords()`, `nurse()` directly (3297, 3316, 3321, 3388, 3516–3517). |
| medium | maintainability | Dated patch comments mark layered fixes («chat fix 2 2026-11-08», «phase8 2026-11-07») at 3105, 3129, 3157–3167, 3196, 3291, 3329, 3342, 3355, 3374, 3409, 3416, 3428, 3436, 3441, 3488, 3515, 3538; each adds a doctor-room special case inside a shared function. |
| medium | duplication | Intubation regex repeated at 3117 and 3118. Proposal split `split(/\s*\(أو\s*|\)\s*/)` repeated at 3141 and 3172. `tip.split(' (أو')[0].split('، ')[0]` written out at 3181, 3432, 3458 although `shortTip` (2008) does the same and is used at 3438. Harm risk expression computed twice (3381 and 3382). |
| low | dead-code | `ASK_NO_NOW = false` (3490) makes 3521–3524 unreachable; `E.askedNo` (init 4364) is only touched there. |
| low | bug | `execOrder` dereferences `meta.ar` (3074) without checking that `testOf(id)`/`actOf(id)` returned a value; an order id missing from the catalog would throw. Whether such an id can occur was not determined. |
| low | bug | `resolve` reads `p.type` (3402) with no guard for `E.pending === null`; it relies on every caller checking first (callers not verified). |
| low | maintainability | `data-ord` is `kind:id` and is split on `:` at 4602; an id containing `:` would break. `o.kind` is written into the attribute unescaped (3062); values seen are `test` and `act` only. |
| low | maintainability | Local function `alert` (642, used 3390) shadows `window.alert` inside the wrapper. `ask` is both a function (2317) and a property name of pending objects. |

## Proposed source fragments

Validated with `check-fragment.mjs … --iife`: all seven printed ok.

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | er-nurse-orders-panel.js | 3037–3100 | Nurse mode chips, orders list rendering, click-to-execute, test tags, role switch | presentation / application |
| 2 | er-order-intake.js | 3101–3219 | `order`: checks on a treatment order before it is given; `badDose`; `settle` | domain / application |
| 3 | er-treatment-feedback.js | 3220–3282 | Delayed treatment response line, `SPOKEN` names, read-back and "done" batching | presentation (with thresholds) |
| 4 | er-give-treatment.js | 3283–3348 | `give`: apply a treatment to the simulation state | domain |
| 5 | er-unsafe-and-harm.js | 3349–3397 | Challenge of an unsafe order and the harm path | domain |
| 6 | er-resolve-pending.js | 3398–3486 | `resolve`: answer to the open question | application |
| 7 | er-tests.js | 3487–3557 | Test ordering, indication, result card, read question | domain / application / presentation |

## Open questions

1. Which call sites invoke `resolve(grade, text)` and do all of them guarantee `E.pending` is set? (Search is polluted by `Promise.resolve`; only the 2121 area was seen.)
2. Can a nurse order carry an id that is absent from the action/test catalog (`execOrder` 3074 would throw)?
3. Is `ASK_NO_NOW` meant to stay off permanently (remove 3521–3524 and `E.askedNo`) or is it a switch to keep?
4. Is the third argument of `compOn` (3154, 3346, 3527) a delay only, or does `compOn` use randomness internally? Not read in this range.
5. In the new design, should the grading instruction strings (`ask`, `voice` instructions) move to the server so that reference doses and reference readings do not sit in client state?
6. Online nurse-mode behaviour of this range (grades arriving from the endpoint) was not exercised: the local server returns 404 for /api.
