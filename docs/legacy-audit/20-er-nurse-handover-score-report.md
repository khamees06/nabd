# ER room, nurse mode: handover, score and report — er.js:3955–4254

## Purpose

This range ends an ER case played in the nurse role. It renders the SBAR handover form (four text boxes plus a justification box per off-indication bedside test), grades the handover (server answer merged with a local rule-based grade, or the local grade alone when offline), computes the nurse score out of 100 in seven sections with hard-fail conditions, and renders the debrief report. It also holds `save()`, which is shared with the doctor role: it appends the run to the signed-in user's history, recomputes the ER averages per role, and persists the account. Everything reads the single mutable case-state object `E` declared elsewhere in the er.js wrapper.

## Features and user journeys implemented here

| # | Feature (what the user sees or does) | Reachability | Evidence |
|---|---|---|---|
| 1 | Nurse SBAR handover dialog in `#er-sheet`: four textareas S/B/A/R (max 300 chars), "رجوع للمريض" and "سلّم" buttons | live | `#er-end` click → `openEnd` (er.js:4609) → `if (NM()) openEndNurse()` (3726). Probe: `nbDemoLogin('rana')`, `nbOpenER()`, `#er-brief-go`, `#er-end` → heading "سلّم الحالة للممرض/ة المستلم/ة (SBAR)", ids `er-sbar-s/b/a/r` |
| 2 | Submit button enabled only when every SBAR box (and every justification box) has at least 3 words | live | 3983–3992. Probe: disabled `true` before input, `false` after three words in each box |
| 3 | Justification block for bedside tests the nurse ran herself that are off indication (`ind` `no`/`harm`), excluding tests the doctor ordered | live (needs such a test in `E.tests`) | 3967–3972, 3982, 3985, 4001. Not exercised in the probe |
| 4 | Draft kept while the dialog is closed and reopened (`E.draft = {parts, just}`) | live | written 3987, restored 3965, 3981–3982 |
| 5 | Handover grading: POST `mode:'grade', role:'nurse'`; server booleans s/b/a/r/invented/note merged over the local grade; local grade alone when the call returns null | live offline (probe ran with /api 404); online path live by code, not exercised (paid endpoint) | 4002–4006; server branch api/er-chat.js:332–338 |
| 6 | Outcome decided at handover: `stable` when risk is below `c.risk.watch` and no key step or key order is missing, else `unstable` | live | 4007 |
| 7 | Nurse score /100 in seven sections (15/20/20/15/10/10/10) and seven hard-fail reasons | live | `scoreNurse` 4031–4106, called only from `concludeNurse` 4108 |
| 8 | Debrief report in `#er-debrief`: total, pass/fail line, per-section points, risk chart, "أحسنت / ما يجب أن يتغير" lists grouped by section, tests table (including blocked attempts), server note, doctor's diagnosis (informational), case brief, disclaimer | live | `conclude` → `if (NM()) concludeNurse(end)` (3866). Probe: report shown, 7 part lines, 6 sections, buttons `er-home`, `er-again`, `er-next` |
| 9 | Report buttons: repeat the same case as nurse, next case as nurse, home | live | 4222–4224 (`begin`, `navigateTo`) |
| 10 | Report can be reopened after leaving the room (`lastReport = E`) | live | set 4225; consumed er.js:4698–4700 (outside the range) |
| 11 | Run saved to user history (both roles) with per-role averages `avgErDoctor`, `avgErNurse`, and `avgEr` chosen by the user's track | live | `save` called at 3952 (doctor) and 4228 (nurse). Probe: history entry `caseId:'er_asthma_n'`, `stats.avgErNurse` written, `nabd_v2_accounts_map` present in localStorage |
| 12 | Report after cardiac arrest (no handover): `conclude(null)` → `end` is null, handover section 0 | live by code | 4094 (`!end ? 0`), 4187, 4216; caller at er.js:3720 |

## Declarations

All are declared directly inside the er.js wrapper. "Called from" lists every reference found in er.js, script.js, resp.js, ui.js, motion.js, terms.js and index.html.

| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| `SBAR_BOX` | 3956–3961 | const array of `[key, label, placeholder]` | The four handover boxes | presentation (static copy) | none | 3977, 3981, 3986, 3988, 3990, 3998 only |
| `orderedTest` | 3962 | arrow fn `(id) → bool` | True when the doctor's order list holds a live (not cancelled, not reminder) test order with this id | domain | R `E.nurse.orders` | 3967, 4198 |
| `SEC_N` | 3963 | const array of 7 strings | Section titles of the nurse report | presentation (static copy) | none | 4112, 4193 |
| `openEndNurse` | 3964–4012 | function | Renders the handover dialog, validates, keeps the draft; on submit builds the SBAR text, stores test justifications, calls the grader, merges grades, sets the outcome, calls `conclude` | presentation + application (submit handler holds orchestration and one domain rule, 4007) | R `E.draft`, `E.tests`, `E.harms`, `E.risk`, `E.c.risk.watch`, `E.over`; W `E.draft`, `E.tests[id].justify/.justOk`, `E.outcome`; DOM `#er-sheet`, `#er-input` | `openEnd` 3726 |
| `gradeHandoverNurse` | 4014–4024 | function `(end) → grade` | Offline rule-based grade of the four boxes; returns `{dx:'wrong', s, b, a, aWrong, r, mention, allergy, invented, note:''}` | domain | R `E.done`, `E.nurse.acts`; uses `gradeSbar`, `norm`, `hasAny`, `actOf`, `ALLERGY_W` | 4004 only |
| `claimedNurse` | 4026–4027 | arrow fn `(raw) → bool` | Clause-by-clause check for a claim of having given a dose-limited drug that was not given | domain | R `D.actions`, `E.done` | 4023 only |
| `nurseOwnKeys` | 4028 | arrow fn `→ [id, careDef][]` | Key care steps with a deadline that are within nursing scope (`OWN_KEYS`) | domain | R `E.c.care` | 4030, 4061 |
| `keyOrders` | 4029 | arrow fn `→ order[]` | Doctor's act orders that count as key (case `care[id].key` or `when==='collapse'`), excluding reminder/cancelled/doctorDoes/optional | domain | R `E.nurse.orders`, `E.c.care` | 4030, 4078, 4101 |
| `nurseKeyMissing` | 4030 | arrow fn `→ id[]` | Ids of own key steps not done plus key orders not executed | domain | R `E.done`, via the two above | 4007 only |
| `scoreNurse` | 4031–4106 | function `(end) → score object` | Seven-section score, total, hard-fail list, and the detail arrays the report prints | domain | R `E.c`, `E.nurse.*`, `E.tests`, `E.facts`, `E.exam`, `E.done`, `E.wrongDoses`, `E.lateTests`, `E.comm`, `E.sim`, `E.outcome`, `E.harms`; writes nothing | 4108 only |
| `concludeNurse` | 4107–4229 | function `(end)` | Builds the feedback lines per section, the tests table, the report HTML; wires three buttons; sets `lastReport`; calls `save` | presentation (with feedback-selection rules mixed in) | R as `scoreNurse` plus `E.riskLog`, `E.risk`, `E.anxTop`, `E.helps`, `E.hints`, `E.comp.count`; W `lastReport`; DOM `#er-debrief` | `conclude` 3866 |
| `save` | 4231–4253 | function `(s, passed, end)` | Appends the run to `authState.user.history`, recomputes `stats`, persists, refreshes home path. Shared by doctor and nurse roles | application + infrastructure | R `authState.user`, `E.c`, `E.tests`, `E.facts`, `NM()`; W `u.history`, `u.stats.completed/avgErDoctor/avgErNurse/avgEr`; calls `saveAccountToStorage`, `renderHomePath`, `nbTrackOf` (script.js) | 3952 (doctor report), 4228 |

## Shared state, globals and contracts

Defined here for others:

| Item | Consumer |
|---|---|
| `openEndNurse()` | `openEnd` er.js:3726 |
| `concludeNurse(end)` | `conclude` er.js:3866 |
| `save(s, passed, end)` | doctor report er.js:3952 |
| `lastReport` (assigned 4225; declared at 4343, after this range, same wrapper scope) | er.js:4698 |
| `E.draft = {parts:{s,b,a,r}, just:{testId:text}}` | the doctor form reads the same `E.draft` slot (3727) with a different shape |
| `E.outcome` = `'stable' | 'unstable'` (4007) | `scoreNurse` 4098, `concludeNurse` 4110 |
| `E.tests[id].justify`, `.justOk` (4001) | `testRows` (3838) |
| History entry shape and `stats.avgErDoctor / avgErNurse / avgEr` | script.js:2425–2428 (home path), 5326–5332 (profile) |
| DOM ids created: `er-end-h`, `er-just-h`, `er-sbar-s/b/a/r`, `er-just-<testId>`, `er-end-x`, `er-end-go`, `er-home`, `er-again`, `er-next` | `er-end-x`, `er-end-go` ids are also created by the doctor form (3742); both render into the same `#er-sheet`, one at a time |

Expected from others:

| Kind | Names (declaration line in er.js unless noted) |
|---|---|
| Case state | `E` and fields: `c` (`care`, `risk.watch`, `exam`, `facts`, `results`, `companion.name`, `collapse`, `dx.ar`, `brief`, `id`), `nurse` (`orders`, `esc{calledAt, by, sbar, updateAt, reNeededAt}`, `examAt`, `vchecks`, `stageAt`, `airwayAt`, `tempAt`, `allergyAt`, `allergyToldDoc`, `allergyGuess`, `given`, `interv`, `scope`, `notIndicated`, `readBack`, `ordersAt`, `helpAt`, `bls`, `drawn`, `bandNoted`, `alarmAt`, `sex`, `nm.escBy`, `acts`), `tests`, `facts`, `exam`, `done` (Map), `harms`, `wrongDoses`, `lateTests`, `comm`, `comp.count`, `sim`, `risk`, `riskLog`, `anxTop`, `helps`, `hints`, `over`, `outcome`, `draft` |
| Catalog | `D.actions` (`id`, `kw`, `limits`, `ar`), `D.tests` via `testOf` (41), `actOf` (42) |
| Helpers | `$`, `esc` (35), `norm` (37), `clamp` (39), `offInd` (48), `clk` (50), `wordsIn` (51), `justGood` (53), `fix` (91), `NM` (29), `forNurse` (32), `call` (670), `hasAny` (764), `ALLERGY_W` (1388), `NURSE_TESTS` (2468), `REASSESS_WIN` (2470), `OWN_KEYS` (2474), `isDrug` (2476), `docT` (2498), `escBy` (2503), `gradeSbar` (2521), `fell` (3820), `quoteOf` (3830), `testRows` (3838), `chart` (3840), `mm` (3849), `conclude` (3853), `autoFocus` (4307), `begin` (4344) |
| script.js globals (all guarded with `typeof`) | `authState`, `nbTrackOf` (3457), `saveAccountToStorage` (1787), `renderHomePath` (2407), `navigateTo` |
| DOM from index.html | `#er-sheet` (1883), `#er-debrief` (1884), `#er-input` |
| CSS classes used | `er-pane`, `er-pane-n`, `er-just`, `er-just-h`, `er-small`, `er-pane-f`, `er-report-page`, `er-report-n`, `er-score`, `er-parts`, `er-sec`, `er-sec-k`, `er-good`, `er-gaps`, `er-scroll`, `er-tests`, `is-blocked`, `font-num` |

## Data, storage and network

| Kind | Detail |
|---|---|
| Network | One call: `call({mode:'grade', role:'nurse', sbar, harms: E.harms.map(h => h.label)}, 12000)` at 4002. `call` (670) POSTs JSON to the `API` constant with `case`, `risk`, `anx`, `state`, last 14 chat turns, and in nurse mode `role` and up to 12 order strings. Returns null on failure or offline; then the local grade is used |
| Server contract (api/er-chat.js:332–338) | Nurse grade answer: `{dx:'wrong', s, b, a, r, invented, note}` (booleans, note cut to 240). The client treats a truthy `g.dx` as "server graded" (4006). Server reads `b.sbar` up to 1300 chars and up to 8 harms of 80 chars |
| localStorage | Not written directly. `save` calls `saveAccountToStorage(u)` (script.js:1787). Probe after one run showed keys `nabd_v2_accounts_map`, `nabd_v2_active_user_id`, `nabd_placement_v1_rana` |
| History entry (4239–4240) | `{caseTitle, mode:'غرفة الطوارئ', correct, workupCount, questions, score:'<n>% (مجتاز|غير مجتاز)', caseId:'er_<caseId>' + ('_n' for nurse), num, passed, ts: Date.now(), date:'YYYY-MM-DD'}`, inserted at index 0 |
| Stats written | `completed` = history length; `avgErDoctor`, `avgErNurse` (strings like `'74%'`, deleted when empty); `avgEr` |
| Case JSON fields read | `care[id].{key, by, label, why, harm}`, `results[id].{ind, by, why}`, `facts[]/exam[].{id, red, say}`, `risk.watch`, `companion.name`, `collapse.{dx, need}`, `dx.ar`, `brief`, `nurseMode` (through `E.nurse.nm.escBy`) — from data/er-cases.json |
| Timers | None created here. The awaited call has a 12 s timeout inside `call` |
| Time | `Date.now()` and `new Date().toISOString()` in `save` (4240) only. Scoring uses the simulation clock `E.sim` (minutes) |
| Randomness | None in the range |
| Audio, history API | None in the range |
| Focus | `autoFocus` (3993, 4011), `.er-score.focus({preventScroll:true})` (4226), `box.scrollTop = 0` (4227) |

## Calculations and rules worth pinning with a golden-master test

| Name | Lines | Inputs | Outputs | Randomness / time |
|---|---|---|---|---|
| `scoreNurse` | 4031–4106 | `E` (see contracts), `end.grade` | `{total, assess, escPts, interv, med, reass, comm, hand, parts, abcdeAt, timing, sbarPts, follow, rose, own, bed, ords, gapIds, first, toldPts, rbPts, iv, covered, gapMax, fails, ESC, reds, got}` | None; deterministic for a fixed `E` |
| — 1 ABCDE /15 | 4034–4050 | `N.examAt`, `N.vchecks[0]`, `N.airwayAt`, `N.tempAt`, `E.tests.glucose.at`, red facts | Each of a–e worth 2: time factor 1 by minute 3, 0.5 by minute 6, else 0; a two-part item with one part done gets half; red flags 5 × found/total (5 when the case has none) | |
| — 2 escalation /20 | 4052–4059 | `escBy()`, `X.calledAt`, `X.by`, `N.stageAt`, `X.sbar` (+`half`), `X.updateAt`, `X.reNeededAt` | timing 10 (called by `ESC` and before stage 2), 5 (called late), 0 (alarm or never); SBAR 2/1/0 per letter; follow-up 2 when no later stage rise or update within 2 min | |
| — 3 interventions /20 | 4061–4071 | own key steps vs `d.by`; indicated `NURSE_TESTS` vs `results[id].by` (default 10); order lag `doneAt − at` (≤3 full, ≤6 half) | 8 + 4 + 8, minus 2 per distinct out-of-scope attempt (max 6), minus 2 per not-indicated oxygen | Empty own/bed lists give full 8/4; empty order list gives 0 of 8 |
| — 4 medication safety /15 | 4073–4081 | `N.given[0].allergyAsked`, `N.allergyAt`, `N.allergyToldDoc`, `E.wrongDoses`, `keyOrders`, `N.readBack`, `N.ordersAt`, `E.lateTests` | allergy 5/2/0, told doctor 3, dose 4 − 2 per wrong dose (0 when nothing given or a key ordered drug not given), read-back 3, minus 2 per late test | |
| — 5 reassessment /10 | 4083–4088 | `N.interv`, `N.vchecks`, `REASSESS_WIN` (5), `E.sim` | 7 × covered/total (7 if no interventions but a vitals check after minute 3); continuity 3 (max gap ≤5), 1.5 (≤8), 0 | |
| — 6 communication /10 | 4090–4091 | `E.comm.{introduced, explained, empathy, rude, jargon}` | 2 + 4 + 2 + 2 − jargon | |
| — 7 handover /10 | 4093–4094 | `end.grade.{s,b,a,r,mention,invented}` | 2 + 2 + 3 + 2 + 1 − 3; 0 when `end` is null | |
| — hard fails | 4097–4104 | outcome, escalation, own key steps, key orders, `harms[].risk ≥ 8`, vitals checks, allergy rule | list of Arabic reasons; any entry fails the case | |
| Pass rule | 4109 | `s.total`, `fails` | `passed = total ≥ 70 && !fails.length` | |
| `gradeHandoverNurse` | 4014–4024 | `end.parts`, `end.sbar`, `E.done`, `E.nurse.acts`, catalog keywords | grade object | None |
| `claimedNurse` | 4026–4027 | handover text, `D.actions`, `E.done` | boolean | None |
| `nurseOwnKeys`, `keyOrders`, `nurseKeyMissing` | 4028–4030 | `E.c.care`, `E.nurse.orders`, `E.done` | lists | None |
| Outcome rule | 4007 | `E.risk`, `E.c.risk.watch`, `nurseKeyMissing()` | `'stable'` / `'unstable'` | None |
| Submit gate | 3988 | texts of the boxes | enabled when all have ≥ 3 words | None |
| Server/local grade merge | 4006 | server answer `g`, local grade | merged grade: server s/b/a/r/note; `invented` = server OR local; `aWrong`, `mention`, `allergy` stay local; `graded:true` | Depends on network availability |
| Feedback line selection | 4115–4192 | score object, `E` | `good[7][]`, `gaps[7][]` | None |
| `save` averages | 4243–4249 | `u.history`, track | rounded mean of `num` over `er_*` runs, per role; `avgEr` by track | `Date.now()`, `new Date()` at 4240 |

A golden-master harness needs a fixed `E` fixture and a stubbed `call` (return null for the offline path, a fixed object for the online path), and a frozen clock for `save`.

## Problems

| severity | kind | evidence with line numbers |
|---|---|---|
| medium | architecture | `openEndNurse` submit handler (3994–4010) mixes DOM reading, network call, grade merge, mutation of `E.tests` and the domain outcome rule (4007). The outcome rule cannot be tested without the DOM |
| medium | architecture | `concludeNurse` (4107–4229) decides which feedback applies (clinical rules, e.g. 4127–4141, 4160–4172) while building HTML strings; the rules cannot be reused server-side without rewriting |
| medium | bug | `save` replaces the seeded `stats.avgEr` with the mean of only the runs that carry an `er_` caseId (4244–4249). Probe: demo user `rana` had `avgEr '81%'`, `completed 8`; after one nurse run scoring 2 the stats were `avgEr '2%'`, `avgErNurse '2%'`, `completed 9`. No seeded history entry in script.js has a `caseId` starting `er_` (grep `caseId: 'er_'` in script.js: no match) |
| medium | maintainability | Online and offline handover grades follow different rules: offline `a` requires readings that match the monitor (`gradeSbar`, comment 4013), online `a` is the server's boolean (4006) while `aWrong` stays local and is not used by `scoreNurse` for the handover (4094). The same handover can score differently depending on connectivity |
| low | bug | Order execution points: with no doctor's orders `c8` is 0 of 8 (4068–4069), while the two sibling parts give full marks when their list is empty (4063, 4066). Probe run with no actions showed interventions 0/20. Whether this is intended (no escalation, hence no orders) is not determined |
| low | dead-code | `|| avgOf(erRuns)` at 4249 cannot be reached with a different value: every `er_` run is either `_n` or not, so `docAvg || nurAvg` is non-empty whenever `erRuns` is |
| low | dead-code | `src` at 4198 returns `'أمر الطبيب'` in both the first and the last branch; a test that is neither ordered nor in `NURSE_TESTS` is labelled as a doctor's order |
| low | duplication | `openEndNurse` repeats the structure of the doctor form `openEnd` (3724–3790: same sheet, draft slot, ids `er-end-x`/`er-end-go`, justification block). `concludeNurse` repeats the doctor report tail (3922–3952). The S/B/A/R label array is written twice (4133, 4188). The `ontime/late/missed` mapping is written twice (4061, 4064) |
| low | maintainability | Two notions of "asked about allergy": points use `N.given[0].allergyAsked` then `N.allergyAt` (4074); the hard fail uses `N.allergyAt === null` only (4104) |
| low | maintainability | `E.draft` holds different shapes for the doctor form and the nurse form (3727 vs 3987); safe today because the role is fixed per case |
| low | maintainability | `good` items are escaped at render (4194) but `gaps` items are raw HTML assembled by hand with per-piece `esc` (4121–4190). All dynamic pieces seen in the range are escaped or static; the convention is fragile |
| low | bug | `testOf(k.id).ar` (4145) and `testOf(x.id).en` (4200) dereference without a fallback, unlike 3970 and 4148; a test id missing from the catalog would throw inside the report. Whether such an id can occur: not determined |
| low | maintainability | `save` swallows every error with `console.error` (4252); a failed persist is invisible to the user |
| low | maintainability | Report text is rewritten after render by another script: the probe showed "سلامة الـMedication" and "الـHandover (SBAR)" where the source has Arabic words (4209, 4211). Source of the rewrite is outside this range (terms.js not traced here) |

## Proposed source fragments

Validated: `node tools/legacy/check-fragment.mjs er.js 3955-3963 3964-4012 4013-4030 4031-4106 4107-4230 4231-4254 --iife` printed `ok` for all six.

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | er-nurse-handover-constants.js | 3955–3963 | SBAR box definitions, report section titles, `orderedTest` | presentation (static copy) + one domain predicate |
| 2 | er-nurse-handover-form.js | 3964–4012 | Handover dialog: render, validate, draft, submit and grade merge | presentation / application |
| 3 | er-nurse-handover-grade.js | 4013–4030 | Offline handover grade, false-claim check, key-step and key-order selectors | domain |
| 4 | er-nurse-score.js | 4031–4106 | Seven-section nurse score and hard fails | domain |
| 5 | er-nurse-report.js | 4107–4230 | Nurse debrief report rendering and its buttons | presentation |
| 6 | er-run-save.js | 4231–4254 | Save the finished run (both roles) to user history and stats | application / infrastructure |

## Open questions

1. Is 0 of 8 for "doctor's orders executed" intended when no orders were ever given (4068–4069)?
2. Should the seeded demo averages (`avgEr`) survive the first real ER run, or is overwriting them accepted (4244–4249)?
3. Should the server's `a` verdict override the local monitor-matching check, and should `aWrong` affect the handover points (4006, 4094)?
4. Can a test that is neither ordered nor in `NURSE_TESTS` reach `E.tests` in nurse mode (4198)? Not determined in this range.
5. The online nurse grade path (4002–4006 with a non-null answer) was not exercised: the paid endpoint must not be called. The server file header marks nurse mode as "not live-verified" (api/er-chat.js:296).
6. Which script rewrites report terms after render ("Medication", "Handover"), and must golden-master output be captured before or after that rewrite?
