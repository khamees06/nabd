# ER room: who speaks next (director, companion, supervisor) and ending (handover, scoring, report) — er.js:3558–3954

## Purpose

This range decides when the patient's relative ("companion") and the supervisor speak in the ER room, and it ends a doctor-role case. The first half (3558–3722) is an event-driven "director": after each trainee turn or clinical event it applies spacing, anxiety and once-only rules, then queues a scripted companion line or asks the server for a fresh one; `coach` does the same for the supervisor; `arrest` ends the case when risk reaches 100. The second half (3723–3954) renders the handover sheet (diagnosis, disposition, SBAR, justifications for out-of-indication tests), grades it (server `grade` mode, with a local keyword fallback), computes the 100-point score, applies automatic-fail rules and renders the debrief report with a risk chart. Nurse-role endings are delegated to `openEndNurse` / `concludeNurse` (outside the range), but reuse several helpers defined here.

## Features and user journeys implemented here

| # | Feature (what the user sees) | Reachability | Evidence |
|---|---|---|---|
| 1 | Relative speaks a scripted line tied to an order, a completed action or a test (`onOrder`, `onDone`, `onTest`) | live | `compOn` called at er.js:3154, 3346, 3527 |
| 2 | Relative breaks in on alarm / worsening / improvement / lull (info, extra, ignored, angry, procedure) | live | `director` called at 190, 214, 2228, 2565, 3346, 3393, 3527; `breakIn` 3625–3659 |
| 3 | Fresh server-written relative line for alarm / worse / calm when the scripted pool is empty | dormant on the audit server (needs `api !== 'off'`, 3676); live when `/api/er-chat` answers | 3675–3676 `voice('c','companion',…)` |
| 4 | Nurse settles the relative and nudges the trainee after two unheard remarks | live in nurse role only (guard `NM()` at 3588) | 3588–3594 |
| 5 | Supervisor speaks: when called, after harm, at stage 2 (urgent) or 3 (critical) | live in doctor role; disabled in nurse role by 3693 | `coach` called at 216, 3337, 3394 |
| 6 | Cardiac arrest ending (alarm line, nurse "code" line, report without handover) | live | `arrest` called at 169 when `E.risk >= 100` |
| 7 | Handover sheet: diagnosis, destination, SBAR; "سلّم" enabled only when all filled | live; verified in the running page (button disabled → enabled after filling) | `$('er-end')` click → `openEnd` at 4609; sheet 3736–3743 |
| 8 | Mandatory written justification (≥ 3 words) for each out-of-indication test before handover | live (only rendered when such a test was ordered) | 3729–3734, 3751 |
| 9 | Draft of the sheet is kept when it is closed with "رجوع للمريض" | live | `E.draft` written 3750, read 3727 |
| 10 | Handover grading: server `grade` mode, else local keyword grading | live; on the audit server the local path ran (probe) | 3764–3767, `localGrade` 3776 |
| 11 | Debrief report: total, pass/fail with reasons, six part scores, risk chart, "أحسنت" / "ما يجب أن يتغير" lists, tests table, summary, buttons Home / Same case / Next case | live; verified in the running page (score 12, "غير مجتاز: خطوة أساسية لم تحدث، لم تطلب أي فحص", six parts, buttons `er-home`, `er-again`, `er-next`) | `conclude` 3853–3953 |
| 12 | Result saved to the signed-in user's history | live | `save(s, passed, end)` at 3952 (defined 4231) |

Probe used: one run as `med_student`, `nbOpenER()`, immediate handover (dx "test", ICU, one-line SBAR). Result parts: safety 0/40, diagnosis 0/15, tests 0/15, history 0/10, communication 2/10, handover 10/10, total 12.

## Declarations

`E` = current run state, `D` = loaded ER data, `NM()` = nurse role (all defined outside the range: er.js:22, 23, 29).

| Name | Lines | Kind | Responsibility | Layer | Shared state read / written | Called from |
|---|---|---|---|---|---|---|
| `lineOf` | 3561 | const fn | Text of a line that is a string or `{say}` | domain | — | 4410 only (not used inside the range) |
| `compPool` | 3562 | const fn | Companion line pool for a trigger key | domain | R `E.c.companion.lines` | 3631, 3663 |
| `fresh` | 3566–3567 | const fn | Filter lines not yet used and whose conditions hold (`stage`, `after`, `unless`, `when`, `fact`) | domain | R `E.comp.used`, `E.stage`, `E.sim`, `E.facts` | 1871, 3598, 3631, 3663 |
| `busyNow` | 3568 | const fn | Trainee ordered something within the last turn | domain | R `E.turns`, `E.busyTurn` | 3654 |
| `compSay` | 3569–3595 | function | Mark a companion line used, update counters, queue it (`later`/`soon`), drop it if stale, add told fact, queue nurse answer; nurse-role "settle the relative" step | application | R/W `E.comp.{sayTurn,used,lastTurn,lastAt,count,sayAt,gen,outUntil,heardTurn,unheard,nurseStep}`; W `E.facts`, `E.anx` (dead branch), `E.jobs` via `later`/`soon` | 3616, 3683 |
| `compOn` | 3597–3618 | function | Say the line tied to an order/done/test id, subject to spacing rules; returns whether a line was taken | application | R `E.c.companion.lines[kind][id]`, `E.sim`, `E.turns`; R/W `E.comp.{outUntil,explainedTurn,used,lastTurn,sayAt,reacts,lastAt}` | 3154, 3346, 3527 |
| `director` | 3620–3660 | function | Decide, per event (`alarm`, `worse`, `better`, `turn`, `procedure`, `addressed`), whether the companion breaks in and with which trigger | application (rules are domain) | R `E.over`, `E.anx`, `E.turns`, `E.sim`, `E.stage`, `E.busyTurn`, `E.pending`, `E.askedThisTurn`, `E.lastTo`, `E.betterTurn`, `E.comm.explained`, `E.comp.*`; W `E.comp.outUntil`, `E.comp.procs` | 190, 214, 2228, 2565, 3346, 3393, 3527 |
| `breakIn` | 3662–3689 | function | Pick the line for a trigger (stage-specific first, else random), or request a server-written line; update `extra`, `infos`, `ignored`, `asked`, `angry`; log anger | application | R `E.stepKind`, `E.comp.addressed`, `E.stage`, `api`; W `E.comp.{lastTurn,lastAt,count,extra,infos,ignored,asked,angry}`, `E.log` | 3625, 3629, 3639–3659 |
| `coach` | 3692–3709 | function | Supervisor line for `called`, `harm`, `urgent`, `critical`; one line per 0.5 simulated minute; builds the English instruction for the server and the local fallback | application | R `E.over`, `E.dTurn`, `E.vtNow`, `E.c.teach`; W `E.coachAt`, `E.hint`, `E.hints` | 216, 3337, 3394 |
| `doneAs` | 3711 | const fn | Done-record of an action; `call_icu` counts as `call_senior` | domain | R `E.done` | 3712, 3789 |
| `keyMissing` | 3712 | const fn | Key care steps not yet done | domain | R `E.c.care`, `E.done` | 153, 1560, 3694, 3768 |
| `arrest` | 3714–3721 | function | Set outcome `arrest`, log, alarm and nurse lines, conclude without handover | application | W `E.outcome`, `E.log` | 169 |
| `openEnd` | 3724–3773 | function | Render and wire the doctor handover sheet; keep a draft; on submit store justifications, call the grader, set outcome, conclude | presentation (+ application in the submit handler) | R `E.tests`, `E.draft`, `E.harms`, `E.risk`, `E.c.risk.watch`; W `E.draft`, `E.tests[id].justify/justOk`, `E.outcome`; DOM `er-sheet` | 4609 (`er-end` click) |
| `claimedIn` | 3775 | const fn | Detect an SBAR claim of giving a drug that was not given | domain | R `D.actions`, `E.done` | 3781 only |
| `localGrade` | 3776–3783 | function | Offline grade of diagnosis and SBAR by keyword | domain | R `E.c.dx.accept/close` | 3767 |
| `score` | 3785–3818 | function | 100-point doctor score in six parts plus detail lists | domain | R `E.c.care`, `E.c.results`, `E.c.facts`, `E.c.exam`, `E.tests`, `E.harms`, `E.wrongDoses`, `E.unneeded`, `E.outcome`, `E.facts`, `E.exam`, `E.comm` | 3867 |
| `fell` | 3820 | const fn | Case has collapsed (stage 3 reached or the collapse treatment was given) | domain | R `E.c.collapse`, `E.topStage`, `E.done` | 2751, 3003, 4217, and 3807–3930 |
| `dispoRight` | 3821 | const fn | Correct destination now | domain | R `E.c.collapse.dispo`, `E.c.dispo` | 3824, 3907 |
| `dispoCheck` | 3822–3825 | function | Classify destination: `bad` / `right` / `wrong` | domain | R `E.c.dispoBad`, `E.c.dispoAlso` | 3797 |
| `DISPO` | 3826 | const object | Arabic labels of the five destinations | presentation | — | 3871, 3905–3907 |
| `quoteOf` | 3830 | const fn | Escape a missed fact; wrap non-exam facts in `data-no-terms` | presentation | R `E.c.exam` | 3912, 4123 |
| `justCell` | 3833–3837 | const fn | HTML of the justification cell of a test row | presentation | — | 3838 |
| `testRows` | 3838 | const fn | HTML rows of the ordered-tests table, by time; optional source column for the nurse report | presentation | R `E.tests` | 3925, 4201 |
| `chart` | 3840–3847 | function | SVG risk-over-time chart with action/harm marks and urgent/critical lines | presentation | R `E.riskLog`, `E.log`, `E.c.risk` | 3936, 4213 |
| `riskAt` | 3848 | const fn | Risk value at simulated time t (step lookup) | domain | R `E.riskLog` | 3845 |
| `mm` | 3849 | const fn | Format simulated minutes as `m:ss` | presentation | — | 3846, 3884–3929, nurse report 4117–4176 |
| `IND` | 3850 | const object | Arabic labels of test indication classes | presentation | — | 3838 |
| `RSN` | 3851 | const object | Arabic labels of reason grades | presentation | — | 3838 |
| `conclude` | 3853–3953 | function | End the run: freeze state, stop the frame loop, lock inputs, mute monitor sound; doctor role: score, fail rules, feedback lists, report HTML, button wiring, save | application + domain + presentation (mixed) | W `E.over`, `E.riskLog`, `soundBack`, `lastReport`; R almost all of `E`; DOM `er-sheet`, `er-records`, `view-er`, `er-input`, `er-send`, `er-test`, `er-end`, `er-debrief` | 3720, 3770, 4009 |

## Shared state, globals and contracts

Defined here and used outside the range:

| Item | Used by |
|---|---|
| `director(evt)`, `compOn(kind,id,after,always)` | message handling, orders, tests, staging (190–3527) |
| `coach(why)`, `arrest()` | stage change (169, 216), orders (3337, 3394) |
| `keyMissing()`, `fell()`, `fresh()`, `lineOf()` | 153, 1560, 1871, 2751, 3003, 4410 |
| `conclude(end)`, `quoteOf`, `testRows`, `chart`, `mm` | nurse ending and report (4009, 4123, 4201, 4213, 4117+) |
| `E.draft` `{dx, dispo, sbar, just:{testId:text}}` | only this range |
| `E.tests[id].justify`, `.justOk` | this range and the nurse report through `testRows` |
| `E.outcome` `'arrest' | 'stable' | 'unstable'` | this range (nurse path not read) |
| `lastReport = E` | `window.nbErReport` (4697–4698), called from script.js:1978 |
| DOM ids created: `er-end-h`, `er-dx`, `er-dispo`, `er-sbar`, `er-just-h`, `er-just-<testId>`, `er-end-x`, `er-end-go`, `er-home`, `er-again`, `er-next`; classes `er-pane`, `er-just`, `er-report-page`, `er-score`, `er-parts`, `er-good`, `er-gaps`, `er-tests`, `er-chart`, `er-scroll` | CSS |

Expected from elsewhere:

| Item | Where defined |
|---|---|
| `E`, `D`, `api`, `tickId` (22–23), `soundBack`, `lastReport` (4343) | er.js wrapper |
| `NM`, `$`, `esc`, `norm`, `clamp`, `pickOf`, `testOf`, `actOf`, `offInd`, `OFF_BADGE`, `clk`, `wordsIn`, `justGood` (29–53), `hasAny` (764), `shortTip` (2008), `autoFocus` (4307) | er.js |
| `later`, `soon` (229, 232: push to `E.jobs`; `soon` caps the delay at 0.05 min), `person` (611), `nurse` (637), `alert` (642, local function, not `window.alert`), `log` (643), `call` (670), `voice` (698), `pickTeach` (1526) | er.js |
| `openEndNurse` (3964), `concludeNurse` (4107), `save` (4231), `begin` (4344) | er.js |
| `navigateTo` (global, guarded by `typeof`, 3948) | script.js |
| DOM ids in index.html: `er-sheet` (1883), `er-debrief` (1884), `er-records` (1867), `er-input`, `er-send`, `er-test`, `er-end` (1876–1879), `view-er`; `.er-mon .nb-mon-sound` button | index.html / monitor code |
| `E.comp` initial shape | 4363 |
| `E.comp.{asked,ignored,unheard,heardTurn,addressed,outUntil,gen,explainedTurn}` updated when the trainee addresses the relative | 2078–2082 |
| `E.busyTurn` (2075, 2563), `E.askedThisTurn`, `E.pending` (2093–2379), `E.lastTo` (2223), `E.betterTurn` (189), `E.dTurn` (631), `E.vtNow` (177, 3320), `E.anxTop` (144), `E.helps` (2165), `E.stepKind` (setter not searched) | er.js |

Case data fields read (per case `E.c`): `id`, `brief`, `teach[]`, `dx.{ar,accept[],close[]}`, `dispo`, `dispoAlso[]`, `dispoBad[]`, `dispoWhy`, `collapse.{need,needWhy,dispo,dx,why}`, `risk.{watch,urgent,critical}`, `care[id].{key,label,by,why}`, `results[id].{by,ind,whenShock,why,key,label}`, `facts[]` / `exam[]` `{id,red,say}`, `companion.{name,nurse,tells{line→factId},lines{info,extra,ignored,angry,procedure,alarm,worse,calm,onOrder{id},onDone{id},onTest{id}}}`; line objects `{say,stage,after,unless,when,fact,nurse}`. Global data: `D.actions[].{id,ar,kw,limits}`, `D.tests[].{id,ar,en}`.

## Data, storage and network

| Kind | Detail |
|---|---|
| Network | `call({mode:'grade', dxText, sbar, harms:[labels]}, 12000)` at 3764. `call` (670–694) POSTs JSON to `API` (er.js:12, `/api/er-chat` on a `*.vercel.app` host; other branch not read) and adds case id, risk, anxiety, state and the last 14 chat entries. Expected answer: `{dx:'right'|'close'|'wrong', s, b, a, r, invented, note}` (server schema at api/er-chat.js:333–341); `graded:true` is added client-side (3767). `null` → `localGrade`. |
| Network | `voice(who, speaker, why, fallback, keep)` at 3676, 3697, 3706: server-written line for companion or supervisor, with a local fallback string. Skipped for the companion when `api === 'off'`. |
| Storage | None directly. `save()` (4231, outside range) writes the user's history entry through `saveAccountToStorage`. |
| Timers | No `setTimeout`. Deferred speech uses the simulated-time job queue (`later`/`soon` → `E.jobs`). `cancelAnimationFrame(tickId)` at 3857 stops the simulation loop. |
| Audio | Indirect: `conclude` clicks the monitor sound button to mute it and sets `soundBack` (3860–3861); `begin` restores it (4347). |
| History API | None in the range. `lastReport` supports the Back handling in `window.nbErReport` (4697). |
| Randomness | `Math.random()` at 3641, 3644, 3648, 3654, 3657, 3659; `pickOf` at 3644, 3659, 3681. |

## Calculations and rules worth pinning with a golden-master test

| Name | Lines | Inputs | Outputs | Randomness / time |
|---|---|---|---|---|
| `fresh` line gating | 3566–3567 | line list, `E.comp.used`, `E.stage`, `E.sim`, `E.facts` | eligible lines | none |
| `compOn` spacing (doctor: turn ≥ 3, 3 turns and 1 min apart, max 3 reactions; nurse: 1.5 min hold, 1 min spacing, push ≤ 1.5) | 3597–3618 | `E.turns`, `E.sim`, `E.comp.*`, role | boolean, queued job, counters | simulated time only |
| `director` decision table | 3620–3660 | event, role, `E.anx`, `E.stage`, turn and minute gaps, `E.comp.*`, `E.comm.explained` | trigger passed to `breakIn` or none | `Math.random` thresholds 0.6, 0.55, 0.3, `clamp(anx/110, 0.2, 0.6)` |
| `breakIn` line choice and procedure filters (drug / needle / tube words vs `E.stepKind`) | 3662–3689 | trigger, pool, `E.stage`, `E.stepKind`, `E.comp.addressed` | chosen line, counters | `pickOf` when no stage-specific line |
| `coach` throttling and hint index | 3692–3709 | reason, `E.sim`, `E.coachAt`, `E.dTurn`, `keyMissing()` | spoken line or none; `E.hint`, `E.hints` | simulated time |
| `keyMissing` / `doneAs` | 3711–3712 | `E.c.care`, `E.done` | missing key steps | none |
| Outcome rule: `stable` if `E.risk < c.risk.watch` and no key step missing | 3768 | risk, care | `E.outcome` | none |
| `claimedIn` + `localGrade` | 3775–3783 | dx text, SBAR text, `c.dx`, `D.actions`, `E.done` | `{dx,s,b,a,r,invented,note}` | none |
| `score` | 3785–3818 | run state, `end` | `total` and parts: safety 40 (on time = full share, late = half; −10 per harm, −3 per wrong dose up to −9, −2 per unneeded, −10 bad destination; capped at 10 after arrest), diagnosis 15 / 8 / 0, tests 15 (−6 harm, −3 unjustified `no`, −1.5 weak reason, −2 wrong reading, −3 per missed indicated test), history 10 × red flags found, communication 10, handover 10 | none |
| `fell`, `dispoRight`, `dispoCheck` | 3820–3825 | `E.topStage`, `E.done`, case dispositions | `bad` / `right` / `wrong` | none |
| Fail rules and pass threshold (`total ≥ 70` and no fail) | 3869–3880 | score, outcome, harms (`risk ≥ 8`), VT, collapse, anaphylaxis, tests, graded dx | `fails[]`, `passed` | none |
| `riskAt`, `mm`, `chart` geometry | 3840–3849 | `E.riskLog`, `E.log` | SVG string | none |
| Report HTML for a fixed run state | 3882–3944 | run state | `er-debrief` markup | none |

## Problems

| Severity | Kind | Evidence |
|---|---|---|
| high | architecture | `conclude` (3853–3953) mixes state transition, DOM locking, audio toggle, scoring call, fail rules, feedback wording, HTML rendering, button wiring and persistence in one function. |
| medium | architecture | Clinical rules sit inside a click handler: outcome rule at 3768, justification grading at 3763; pass threshold and fail rules are inline in `conclude` (3869–3880) rather than in `score`. |
| medium | maintainability | `director` / `breakIn` call `Math.random` directly (3641–3659, 3681); behaviour cannot be reproduced in a test without patching the global. |
| medium | duplication | The "lull" rules are written twice with different limits: doctor block 3638–3644 and nurse block 3653–3659. |
| medium | bug | Offline grading is lenient: `localGrade` gives S for any SBAR longer than 15 characters and B/A/R by single keywords (3782); in the probe a one-line SBAR at minute 0:00 scored handover 10/10. A wrong diagnosis is not a fail offline by design (3878–3879). |
| low | bug | `compOn` increments `E.comp.reacts` (3607) and returns `true` (3617) even when `compSay` returns early at 3571 (already spoke this turn); the caller at 3346 then skips `director('procedure')` although nothing was said. |
| low | dead-code | 3592: `if (!NM()) E.anx = …` is inside a block that only runs when `NM()` is true (3588). |
| low | bug | A line is added to `E.comp.used` at 3573 before it is queued; if the queued job drops it (3578, 3580) the count is restored but the line stays used and `lastTurn`/`lastAt`/`sayAt` stay advanced. Intent not determined. |
| low | bug | Part scores are displayed inconsistently: `s.hand` is printed unrounded (3934) while the others use `Math.round`; the total is rounded from the unrounded sum (3816), so displayed parts may not add up to the total. |
| low | maintainability | Stale comment at 3774 ("both handover sheets use it"): `claimedIn` is referenced only at 3781 (search: `grep -n claimedIn er.js`). |
| low | maintainability | `alert(...)` at 3718 is the wrapper's own function (642) that shadows `window.alert`. |
| low | security | Report and sheet are built with `innerHTML`; `gaps` items are inserted raw (3938) and rely on every `push` escaping its parts. All user text and case text found in the range is passed through `esc`; no injection found, but the pattern is fragile. |
| low | maintainability | `conclude` mutes the monitor by simulating a click on `.er-mon .nb-mon-sound` (3860–3861). |
| low | data-exposure | Trainee free text (diagnosis, SBAR) plus harm labels are sent to the AI endpoint (3764); no consent text in this range. |

## Proposed source fragments

Validated with `check-fragment.mjs … --iife`: all seven print `ok`.

| Order | File name | From–to | Single responsibility | Layer |
|---|---|---|---|---|
| 1 | er-companion-lines.js | 3558–3619 | Companion line gating and saying a line (`lineOf`, `compPool`, `fresh`, `busyNow`, `compSay`, `compOn`) | application |
| 2 | er-director.js | 3620–3690 | Who speaks next: `director` and `breakIn` | application |
| 3 | er-supervisor-and-arrest.js | 3691–3722 | Supervisor `coach`, key-step helpers, `arrest` | application |
| 4 | er-handover-sheet.js | 3723–3773 | Doctor handover sheet `openEnd` | presentation |
| 5 | er-scoring.js | 3774–3827 | Local grading, `score`, disposition rules and labels | domain |
| 6 | er-report-parts.js | 3828–3852 | Report building blocks: test rows, risk chart, time format, labels | presentation |
| 7 | er-conclude-report.js | 3853–3954 | `conclude`: end of run, fail rules, debrief report | application / presentation |

## Open questions

1. Does the simulation clock keep running while the handover sheet is open and during the 12-second grade call? The comment at 3765 implies it does; the tick code is outside this range. Not determined.
2. Is it intended that a dropped companion line (3578, 3580) stays in `E.comp.used` and is never said?
3. Where is `E.stepKind` set, and with which values besides `drug`, `fluids`, `oral`, `needle`, `tube` (3667–3669)? Setter not searched.
4. Do all cases have a non-empty `teach` array? With an empty array `E.hint` becomes −1 at 3702. Data not checked.
5. Should the pass threshold (70), the fail rules and the part weights move to case data or to server-side configuration in the new design?
6. The server `grade` prompt and the local keyword grader can disagree; which one is the reference for a golden-master test?
