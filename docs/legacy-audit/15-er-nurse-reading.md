# ER room, nurse mode: reading the trainee — er.js:1370–1896

## Purpose

The range has two parts, although only one section header (line 1370) covers it. Lines 1370–1523 hold the nurse-mode reading rules: regular expressions for what a nurse trainee says in the first person, a detector for who a message addresses (`nurseVocs`), and `nurseShape`, which annotates an already-parsed reading (`read`) with the addressee (`read.to`) and about 20 flags. Lines 1524–1895 are not nurse-specific: they are the offline reply generator for both rooms (`localReply` and its helpers), which produce the Arabic line spoken by the supervisor, the bedside nurse, the patient or the relative when the server is not used or does not answer. Most of that second part runs only in the doctor room (`!NM()` guards). Nothing here touches the DOM, the network or storage; all effects are on the room state `E` and on the `read` object.

## Features and user journeys implemented here

Reachability base: the role switch (طبيب / ممرض/ة) is visible in the ER briefing (probe: `nbDemoLogin('rana'); nbOpenER()` shows two `[data-role]` buttons, both visible); role is chosen at er.js:4357–4358 (`opts.role`, `roleWanted`, or nursing track), all 6 cases in data/er-cases.json have `nurseMode`. With `/api` unreachable the offline reader is used, and `localRead` ends with `nurseShape` in nurse mode (1366).

| # | Feature (what the user sees) | Lines | Reachability | Evidence |
|---|---|---|---|---|
| 1 | Nurse room: a typed message is routed to the doctor, the instructor, the relative, the patient, or recorded as the nurse's own action (`read.to` = nurse / supervisor / companion / patient / self) | 1418–1523 | live | called at 1366 (offline read) and 2554 (server read) |
| 2 | Nurse room: calling the doctor by title/name, calling for help ("code blue"), talk about the doctor in the third person is not a call | 1376–1382, 1399–1412 | live | `nurseVocs` called 1422, 2542; regexes built per case at 2487 |
| 3 | Nurse room: first-person execution of an open order by short name ("بعتت الكلى"), "the drug" when exactly one drug order is open, "all orders done" | 1392–1393, 1434–1445 | live | inside `nurseShape` |
| 4 | Nurse room: a suggestion or plan that names a drug does not give it (`read.suggested`, `read.planOnly`) | 1390, 1447–1455 | live | inside `nurseShape` |
| 5 | Nurse room: short reply to the doctor's allergy question within 3 turns (`read.allergyReply`); drugs held until the allergy answer (`read.heldGive`, `read.heldAsk`) | 1466–1477, 1489, 1494 | live | reads `N.allergyAskedByDoc`, `N.holdRel` set at 2687 |
| 6 | Nurse room: read-back of orders to the doctor (`read.readBack`), vitals request becomes a `bp_repeat` action | 1488, 1499–1500, 1510–1515 | live | inside `nurseShape` |
| 7 | Doctor room, offline: supervisor answers by question type (diagnosis refused, discharge challenged, test reading, destination, dose check) and otherwise asks the next teaching question | 1526–1592 | live | `supervisorLine` called only at 1786 under `!NM()`; `teachLine` also 1963, 3704 |
| 8 | Doctor room, offline: bedside nurse answers (result values, vitals, first steps, cannula gauge, temperature offer, unplaced order questions, risky-drug challenge) | 1594–1642 | live | `nurseLine` called 1859; `unplacedReply` 1609, 1888; `unplacedOrder` 1630, 1960; `unknownName` 1314 |
| 9 | Doctor room, offline: "what is the potassium?", "what came back?", "did you give X?" answered from room state, with an offer to order or give (`read.offerTest`, `read.offerAct`, `read.reopen`) | 1643–1715, 1740–1755 | live | `resultAskOf` 1298, 1309; `statusOfQ` 1311; offers consumed at 2095, 2149 |
| 10 | Doctor room, offline: patient or relative gives a plain "no" to history the case has no line for; patient says name/age/place; how the patient feels | 1716–1781 | live | `plainNo` 1869, 1882; `patLine` 1800; `feelNow` 1772 |
| 11 | Both rooms, offline: `localReply` chooses who answers and with what line; several history questions in one message get one answer each, staggered | 1783–1895 | live | called 1928, 1955, 1963, 2558 |
| 12 | Nurse-mode branches inside `supervisorLine`, `nurseLine`, `unplacedReply` (for example line 1610, 1620, 1631) | 1552–1635 | dormant | their only callers are behind `!NM()` (1786, 1857→1859, 1609, 1888); see Problems |

## Declarations

Abbreviations: E = room state object (er.js top), N = `E.nurse`, D = loaded case data (`tests`, `actions`), NM() = nurse mode test (29).

| Name | Lines | Kind | Responsibility | Layer | Shared state read / written | Called from |
|---|---|---|---|---|---|---|
| SELF | 1372 | const RegExp | first-person nurse verbs | domain (language rule) | – | 1373 |
| ORDER_N | 1373 | const RegExp | `ORDER` (981) or SELF | domain | reads ORDER | 1093 |
| SUPV_N | 1376 | const fn → RegExp | instructor vocative for a name | domain | – | 2487 |
| SUPV_GEN | 1377 | const RegExp | generic "help me" phrases | domain | – | 1411 |
| DOCV | 1378 | const fn → RegExp | doctor vocative for a name | domain | – | 2487 |
| DOC_3P | 1380 | const RegExp | doctor spoken about, not to | domain | – | 1405 |
| CALL_N | 1381 | const RegExp | "call/tell the doctor" | domain | – | 1410, 2649 |
| HELP_CALL | 1382 | const RegExp | code / rapid response call | domain | – | 1410 |
| AIRWAY_ASSESS | 1384 | const RegExp | airway assessed (not an airway device) | domain | – | 1425 |
| DRAW | 1385 | const RegExp | blood drawn | domain | – | 1426 |
| NURSE_KW | 1386 | const object | extra keywords per action id for nurse mode | domain (data literal) | – | 2486 |
| NURSE_VITALS | 1387 | const RegExp | vitals words | domain | – | 1499 |
| ALLERGY_W | 1388 | const RegExp | allergy words | domain | – | 1470, 2534, 2582, 3001, 4022–4026 |
| SUGGEST | 1390 | const RegExp | plan / suggestion wording | domain | – | 1447 |
| ORDER_ALIAS | 1392 | const object | short names of orders, keyed by action/test id | domain (data literal) | – | 1436 |
| EXEC_V | 1393 | const RegExp | execution verbs | domain | – | 1435 |
| BAND | 1394 | const RegExp | allergy wristband | domain | – | 1433, 2574 |
| firstP | 1396–1397 | const fn | rewrites first-person exam verbs to imperative | domain | – | 1105 |
| nurseVocs | 1399–1412 | function | who is called and who first | domain | reads N.rx | 1422, 2542 |
| mentionedIds | 1414 | const fn | ids of every action/test named | domain | reads N.acts, D.tests | 1463, 2532, 2998, 3024 |
| openOrd | 1415 | const fn | order is open (not cancelled, not done, not doctor's) | domain | – | 166, 1431, 2579, 2734–3071 (12 sites) |
| nurseShape | 1418–1523 | function | annotate reading with addressee and flags | application (routing) + domain rules | reads E.turns, E.c.care, N.orders, N.esc, N.rbTurns, N.holdRel, N.nm.orders, N.allergy*, N.present, N.escDoneTurn; writes only `read` | 1366, 2554 |
| pickTeach | 1526–1534 | function | next unsaid, non-stale teaching line | domain | reads E.tests, E.done, E.facts, E.sim, E.c.teach; writes E.teachSaid | 1538, 3705 |
| teachLine | 1536–1548 | function | teaching question in turn, then 3 rotating prompts | application | writes E.afterAt, E.teachAt | 1591, 1963, 3704 |
| supervisorLine | 1550–1592 | function | offline supervisor reply by question type | application + domain (dose check, discharge rule) | reads E.show, E.bp, E.stage, E.done, E.tests; writes E.evidAsked | 1786 |
| nurseLine | 1594–1611 | function | offline nurse reply to a non-order | application | reads E.show, E.done, E.tests, E.tempKnown; writes read.offerAct | 1859 |
| unplacedOrder | 1613 | const fn | question for an order with no recognised name | presentation copy | – | 1630, 1960 |
| unplacedReply | 1615–1636 | function | nurse reply to an order-like message she cannot act on | application | writes read.to | 1609, 1888 |
| riskyNow | 1638 | const fn | drug harmful for this case now | domain | reads E.c.care | 1622 |
| riskLine | 1639 | const fn | nurse challenge line for a risky drug | application | reads E.c.care | 1623 |
| KNOWN_W | 1641 | const RegExp | order/route/unit words that are not drug names | domain | – | 1642 |
| unknownName | 1642 | const fn | the single unknown word in a dosed order | domain | reads E.c, D | 1314 |
| rowSaid | 1645 | const fn | one result row as speech with high/low/normal | presentation copy | – | 1651, 1704 |
| reportCut | 1646 | const fn | cut a report at a sentence end (≤170 chars) | presentation copy | – | 1652 |
| resultBrief | 1647–1656 | function | a result said aloud | application | reads E.c.results | 1597, 1704, 3498 |
| wordDose | 1659 | const fn | litre fractions in words → dose string | domain | – | 1250, 3415, 3427 |
| ANALYTE | 1661–1671 | const array | 19 analytes: typed pattern, row pattern, default test id | domain (data literal) | – | 1679 |
| wordHas | 1673 | const fn | keyword at word start with Arabic prefixes | domain | – | 1306, 1562, 1685 |
| fem | 1674 | const fn | Arabic noun is feminine (for pronoun) | presentation copy | – | 1625, 1707, 1754, 1855, 2321, 2432 |
| resultAskOf | 1675–1688 | function | which result/value a question asks for | domain | reads E.c.results, E.tests, D.tests | 1298, 1309 |
| openFor | 1689 | const fn | open dose question for an action id | domain | reads E.pending, E.queue, E.parked, E.held | 1694, 1748 |
| statusOfQ | 1690–1698 | function | "was X given?" detection | domain | reads E.done, E.harmed | 1311 |
| agoSaid | 1699 | const fn | sim-minutes ago as Arabic phrase | presentation copy | reads E.sim | 1577, 1750, 1810, 1814 |
| hisHer | 1700 | const fn | pronoun suffix by patient sex | presentation copy | reads E.c.patient.sex | 12 sites, incl. 2017, 3332, 3376 |
| resultLine | 1701–1708 | function | answer to a result question | application | writes read.offerTest | 1789 |
| resultsLine | 1710–1715 | function | all tests: back / still out | application | reads E.tests | 1796, 1968 |
| NO_TOPICS | 1719–1727 | const array | 7 history topics with patient / relative (m, f) "no" lines | domain (data literal) | – | 1733 |
| plainNo | 1728–1739 | function | plain "no" or repeated complaint | application | writes read.to | 1869, 1882 |
| statusLine | 1740–1755 | function | what was given / still waiting | application | reads E.done, E.harmed, E.queue, E.parked; writes read.reopen, read.clarify, read.offerAct | 1790 |
| monitorLine | 1757 | const fn | monitor reading line | application | – | 1797, 1968 |
| howLine | 1759 | const fn | vitals plus trend | application | – | 1627, 1795, 1968 |
| trendNow | 1760 | const fn | better / worse / same | domain | reads E.stage, E.betterTurn, E.saidBy, E.improved, E.risk | 1759 |
| feelNow | 1762–1769 | function | patient's "how I feel" line | domain + random pick | same as trendNow, plus c.stageLines, c.improve, c.improveBy | 1772 |
| patLine | 1770–1781 | function | patient's name / age / place / feeling | application | writes E.facts ('orient') | 1800 |
| c0 | 1782 | const fn | alias for `E.c` | – | – | 1648 only |
| localReply | 1783–1895 | function | offline reply selection for one reading | application | writes read.to, read.clarify, read.saidFact, read.facts, read.acceptParked, read.acceptQueued, read.noHelp; E.opened, E.comp.used, E.facts (through scheduled jobs) | 1928, 1955, 1963, 2558 |

None of these names is referenced in script.js, resp.js, ui.js, motion.js, terms.js or index.html (a `fem` exists in resp.js; it is a separate declaration in another wrapper).

## Shared state, globals and contracts

Defines for the rest of er.js:
- Functions: `nurseShape`, `nurseVocs`, `mentionedIds`, `openOrd`, `localReply`, `teachLine`, `pickTeach`, `unplacedOrder`, `unknownName`, `resultBrief`, `resultsLine`, `howLine`, `monitorLine`, `resultAskOf`, `statusOfQ`, `wordDose`, `wordHas`, `fem`, `hisHer`, `agoSaid`, `firstP`.
- Constants: `ORDER_N`, `SUPV_N`, `DOCV`, `CALL_N`, `NURSE_KW`, `ALLERGY_W`, `BAND`.
- The `read` contract after `nurseShape`: `to` (nurse | supervisor | companion | patient | self), `toDoc`, `kind`, `escalate`, `help`, `airwayAssess`, `draw`, `band`, `allOrders`, `whichDrug`, `noHelp`, `suggested`, `planOnly`, `allergyReply`, `heldGive`, `heldAsk`, `readBack`, `mentioned`, `tone.introduced`, `tone.explained`, and filtered `actions`, `tests`, `facts`, `exam`.
- The `read` contract after `localReply`: `to` may change; `offerAct`, `offerTest`, `reopen`, `clarify`, `saidFact`, `acceptParked`, `acceptQueued`, `noHelp` (consumed at 2095, 2149, 2155).
- State fields created lazily here: `E.teachSaid` (Set), `E.afterAt`, `E.teachAt`, `E.evidAsked`, `E.opened`.

Expects from other parts of er.js (all defined outside the range):
- `E`, `D`, `NM` (29), `norm` (37), `pickOf` (40), `testOf`/`actOf` (41–42), `wordsIn` (51), `live` (80), `spokenVitals` (110), `STAGES` (172), `later`/`soon` (229, 232), `person` (611), `socialReply` (756), `hasAny` (764), `doseIn` (802), `doseCheck` (804), `ORDER` (981), `HISTORY` (984), `sayNameOf` (1073), `nz` (1088), `VITALS_Q` (1368), `shortTip`/`spk`/`named`/`shortAsk` (2008–2015), `vagueLine` (2020), `BARE` (2023), `ACCEPT` (2249), `tooEarly` (2413), `NURSE_OWN`/`NURSE_TESTS` (2467–2468), `isDrug` (2476), `HIST_RX`/`HIST_FACTS` (2518–2519), `orderDue` (2747), `instructorLine` (3023), `SPOKEN` (3237), `fresh` (3566), `keyMissing` (3712).
- Nurse state built by `newNurseState` (2478–2490): `N.rx.{docv,supv,compv}`, `N.acts`, `N.orders[]` (`id, kind, ar, cancelled, doneAt, doctorDoes, reminder, repeat`), `N.esc.{awaiting, calledAt, sbar}`, `N.rbTurns`, `N.holdRel`, `N.nm.orders`, `N.allergyAskedByDoc`, `N.allergyAnswered`, `N.allergyAskTurn`, `N.escDoneTurn`, `N.present`.
- Room state: `E.c`, `E.turns`, `E.sim`, `E.stage`, `E.risk`, `E.bp`, `E.show`, `E.done` (Map), `E.harmed`, `E.tests`, `E.facts` (Set), `E.pending`, `E.queue`, `E.parked`, `E.held`, `E.lastGiven`, `E.lastPark`, `E.chat`, `E.comp.used`, `E.saidBy`, `E.improved`, `E.betterTurn`, `E.tempKnown`.
- DOM ids: none. Window globals: none.

## Data, storage and network

| Kind | Detail |
|---|---|
| fetch | none in range |
| localStorage / sessionStorage | none in range |
| History API, audio, DOM | none in range |
| Timers | no `setTimeout`; line 1847 schedules simulation-clock jobs with `later` (nurse mode, 0.3 sim-min steps) or `soon` (doctor mode, 0.01 steps) that call `person()` and add to `E.facts` |
| Case fields read (data/er-cases.json, `cases[]`) | `teach[]`, `care[id].{harm, off, stableHarm, challenge, dose, allergyKw}`, `patient.{name, sex, age, opening}`, `nurse.name`, `facts[].{id, who, say}`, `results[id].{rows, report}` (row = name, value, unit, reference, flag H/L), `companion.lines.{heard, answer}`, `stageLines[stage].patient`, `improve`, `improveBy`, `risk.start`, `temp`, `nurseMode` (via `N.nm`) |
| Catalogue fields read (`tests[]`, `actions[]`) | `id`, `ar`, `kw`, `group`, `dose`, `risky` |
| Embedded data literals | `NURSE_KW` (1386), `ORDER_ALIAS` (1392), `ANALYTE` (1661–1671), `NO_TOPICS` (1719–1727), teaching prompts (1540, 1545), about 60 hard-coded Arabic reply strings |

## Calculations and rules worth pinning with a golden-master test

| Name | Lines | Inputs | Outputs | Randomness / time |
|---|---|---|---|---|
| nurseVocs | 1399–1412 | normalised text, `N.rx` | `{first, call, help, gen, voc}` | none |
| nurseShape | 1418–1523 | `read`, normalised text, raw text, `online`, nurse state, `E.turns` | mutated `read` (addressee + flags) | none; depends on turn counters (allergy window ≤ 3 turns at 1469/1472, escalation window ≤ 2 at 1479) |
| firstP | 1396–1397 | text | rewritten text | none |
| pickTeach / teachLine | 1526–1548 | `E.c.teach`, `E.tests`, `E.done`, `E.facts`, `E.sim` | next line; rotation after the list ends | none; stale rule uses `E.sim > 3` |
| supervisorLine | 1550–1592 | `read`, text, vitals, stage | one reply; discharge rule `stage ≥ 1 or SBP < 100 or SpO2 < 92 or key step missing` (1560); dose verdict via `doseCheck` | none (uses `E.show || live()`; `live` is outside the range, its determinism not determined) |
| unplacedReply / unplacedOrder / unknownName | 1613–1642 | `read`, text | reply string or the unknown word | none |
| resultBrief / rowSaid / reportCut | 1645–1656 | result rows, mode | spoken result (doctor: up to 3 flagged rows, else 2 rows; nurse: 2 rows or 90 chars) | none |
| wordDose | 1659 | text | '500 مل' / '250 مل' / '1 لتر' / '' | none |
| resultAskOf | 1675–1688 | text, `E.tests`, case results | `{id, row, back, sent}` or null | none |
| statusOfQ / statusLine | 1690–1698, 1740–1755 | text, `E.done`, queues | `{id}` / `{all}`; reply + `read.offerAct` / `read.reopen` | `agoSaid` uses `E.sim` |
| agoSaid | 1699 | `E.sim - at` | bands: < 0.8, < 1.5, < 2.5, else rounded minutes | simulation clock |
| trendNow | 1760 | stage, risk vs `risk.start` (−8 / +6), improvement markers | better / worse / same | none |
| plainNo | 1728–1739 | `read`, text, case facts | line + `read.to`; relative speaks when more than half the facts are the relative's | none |
| patLine | 1770–1781 | key, patient | name / age / place line | none except `feel` |
| feelNow | 1762–1769 | stage, risk, improvement | patient line | `pickOf` → `Math.random` (40) |
| localReply | 1783–1895 | `read`, full room state | reply string or null, plus `read` mutations | `pickOf` at 1873, 1892, 1894; scheduled jobs at 1847 |

For a golden master, `Math.random` must be stubbed (it is reached through `pickOf`).

## Problems

| Severity | Kind | Evidence |
|---|---|---|
| medium | architecture | The section header at 1370 says "nurse mode: reading the trainee", but 1524–1895 is the offline reply generator for both rooms, mostly doctor-room (`!NM()` at 1552, 1557, 1572, 1609, 1787). No header separates them. |
| medium | architecture | `nurseShape` (1418–1523, 105 lines) mixes language patterns, clinical workflow rules (allergy window, held drugs, read-back) and routing in one 23-branch `if/else` ladder (1481–1503) whose result depends on branch order; it mutates its argument. |
| medium | architecture | `localReply` (1783–1895) is named as a getter but mutates `read` (`to`, `clarify`, `offerAct`, `reopen`, `saidFact`, `facts`, `acceptParked`, `acceptQueued`, `noHelp`) and room state (`E.opened` 1879, `E.comp.used` 1874, scheduled `person()` + `E.facts.add` 1847). Line 1962 states that `read.to` is final only after it. |
| medium | dead-code | Nurse-mode branches that no caller can reach: `supervisorLine` is called only at 1786 under `!NM()`, so its `NM()` tests (1552, 1557, 1571, 1572, 1582, 1583, 1590) are constant; `nurseLine` is called only at 1859 after `if (read.to === 'nurse' && NM()) return null` (1857), so line 1610 and the `!NM()` tests at 1606, 1609 are constant; `unplacedReply` is called only at 1609 and 1888 (`!NM()`), so 1620 and 1631 are unreachable. Searches: `grep -n "\bsupervisorLine\b\|\bnurseLine\b\|\bunplacedReply\b" er.js` and the same in the other scripts and index.html. |
| medium | maintainability | Reply copy, clinical thresholds and drug lists are hard-coded in logic: SpO2 < 94 (1600, 1794), SBP < 100 / SpO2 < 92 (1560), "gauge 18" (1604, 1863), drug ids (1576, 1808), allergen names (1466), fact ids (1879). `NURSE_KW`, `ORDER_ALIAS`, `ANALYTE` are keyed by ids that live in data/er-cases.json, with no check that the ids exist. |
| low | duplication | The `after` array is written twice (1540, 1545). The "first steps" sentence is built twice (1599–1602, 1794). The better/worse conditions are written in `trendNow` (1760) and again in `feelNow` (1765, 1767), although the comment at 1756 says they are the same judgement. Destination and dose-unit patterns repeat (1567, 1569, 1587). |
| low | maintainability | Non-determinism: `pickOf` (`Math.random`, line 40) decides replies at 1764–1767, 1873, 1892, 1894; there is no seed. |
| low | bug | `teachLine` nurse branch reads `E.c.teach.length` without a guard (1546), while `pickTeach` guards with `E.c.teach || []` (1531). All 6 current cases have `teach`, so it does not fail today. |
| low | bug | `SUPV_N` and `DOCV` (1376, 1378) insert a name from case data into a `RegExp` without escaping; a name with a regex metacharacter would change or break the pattern. Not triggered by current data (not checked name by name). |
| low | maintainability | Declaration order: `firstP` (1396), `ORDER_N` (1373), `nurseShape` (1418), `resultAskOf`, `statusOfQ`, `unknownName`, `wordDose`, `wordHas` are used by `localRead` at 1093–1366, before their `const` lines; `c0` (1782) is used at 1648. This works only because the uses run after the wrapper has finished evaluating; `ORDER_N` also needs `ORDER` (981) evaluated first. Fragment order must be kept. Lines 1392, 1642, 1794, 1814, 1892 are 400–900 characters long. |

## Proposed source fragments

Validated with `check-fragment.mjs ... --iife`: all seven print ok.

| Order | File name | From–to | Single responsibility | Layer |
|---|---|---|---|---|
| 1 | er-nurse-read-patterns.js | 1370–1397 | Nurse-mode phrase patterns, keyword and alias tables, `firstP` | domain |
| 2 | er-nurse-read-shape.js | 1398–1523 | `nurseVocs`, `mentionedIds`, `openOrd`, `nurseShape`: who a nurse message is for | application |
| 3 | er-offline-supervisor-lines.js | 1524–1592 | Teaching-line rotation and the offline supervisor reply | application |
| 4 | er-offline-nurse-lines.js | 1593–1642 | Offline bedside-nurse reply, unplaced orders, risky-drug challenge, unknown drug name | application |
| 5 | er-offline-result-status-lines.js | 1643–1715 | Result and status questions: analyte table, detection, spoken results, what was given | application |
| 6 | er-offline-patient-lines.js | 1716–1781 | Plain "no" topics, monitor/trend lines, how the patient feels, name/age/place | application |
| 7 | er-offline-local-reply.js | 1782–1896 | `localReply`: offline reply selection for one reading | application |

## Open questions

1. Does `teachLine` ever run in nurse mode? Its callers are 1591 (doctor only), 1963 and 3704; whether those two are reached with `NM()` true was not determined, so the nurse branch at 1544–1547 is "not determined".
2. Is `resultBrief`'s nurse branch (1654–1655) reachable? Only the call at 3498 can reach it in nurse mode; not determined.
3. `unplacedOrder` has an `NM()` arm (1613); its caller at 1960 may run in nurse mode; not determined.
4. Replies echo trainee text (`read.unknownDrug` at 1793, `read.unclear` at 1855). Whether the feed renderer (`person`, 611, outside this range) escapes HTML was not checked here.
5. In `supervisorLine` the nurse-mode wording ignores patient sex (1571, 1587). Since the function is not reached in nurse mode, is this leftover code to delete or a planned path?
6. Is the determinism of `live()` (80) and `E.show` sufficient for a golden master of the lines that quote SpO2 and pulse (1558, 1602, 1749, 1794)? Line 92 (`wobble`) uses `Math.random`; its relation to `live()` was not traced.
