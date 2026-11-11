# ER room: the message stream, talking to the server, reading the student without the server (act model, local reader) — er.js:594–1369

Audited at commit 5f431d5 (branch refactor/clean-architecture). All line numbers are er.js unless stated. "E" is the live case state object and "D" the loaded case data, both declared at er.js:22–23 (outside this range). "NM()" (er.js:29) is true when the trainee plays the nurse.

## Purpose

This range holds three things the rest of the ER room builds on. First, the chat feed: one function appends a bubble to `#er-feed`, and thin wrappers decide who speaks, merge consecutive nurse lines, and keep the transcript (`E.chat`) and event log (`E.log`). Second, the client for the serverless function `/api/er-chat`: request body assembly, timeouts, failure counting, switch to offline mode and periodic retry, a free ping, and a "one line for a speaker" call with a local fallback. Third, everything needed to read a trainee message with no server: two small bag-of-n-gram linear classifiers loaded from JSON (`er-act.json`, `er-find.json`), a dose parser and dose-limit checker, a rule set that answers the room's open question (`offlineAnswer`), a drug/test keyword disambiguator (`collisions`), and the 278-line rule reader `localRead`, which returns the same "read" object shape the server returns. The dose functions and several lexicon constants are also used on the online path, so this range is not offline-only.

## Features and user journeys implemented here

| # | What the user sees or does | Reachability | Evidence |
|---|---|---|---|
| 1 | Chat bubbles for patient, relative, nurse/doctor, supervisor, system, alarm and lab results appear in the feed; the speaking person's portrait is highlighted; the feed auto-scrolls only if the reader was near the end | live | `say` 598–610; probe: feed children `er-msg k-sys`, `k-p`, `k-n`, `k-c` after `nbOpenER()` |
| 2 | Latin runs (drug names, doses) inside Arabic text keep left-to-right order | live | `bidi` 597, used by `say` 605 and `person` 623 |
| 3 | Doctor room: several nurse lines in one turn are merged into one bubble, with a single leading «حاضر» | live | `person` 616–628 (guard `!NM() && who==='n' && E.merging`) |
| 4 | Nurse role: «يا دكتور» is stripped from lines addressed to the trainee; the ER-nurse lines are dropped, shown as a room note, or spoken by the instructor | live (nurse role) | `person` 614, `nurse`/`nurseAlt` 637–638; role set outside the range |
| 5 | Three-dot "typing" indicator while a reply is awaited | live | `typing` 645–652; callers 1932, 2547, 3067, 4620 |
| 6 | Trainee message is sent to the server with case id, risk, anxiety, room state and the last 14 chat lines | live when the API is reachable | `call` 670–693; callers 1937, 2549, 2591, 2647, 3764, 3806, 4002 and others |
| 7 | When the server cannot be reached the room shows a system note, continues in a simplified mode, retries once a minute, and announces «رجع الاتصال بخدمة الفهم.» on recovery | live | `goOff` 664–669, `call` 671–675 and 687; probe with the production host blocked: first feed line is the offline note (the note at room start is emitted outside this range) |
| 8 | A free reachability check before the case starts | live | `ping` 695, called from `open` at 4681; probe recorded `GET …/api/er-chat?ping=1&_=…` |
| 9 | Server-written line for a chosen speaker, with the case's own line as fallback; stale lines are dropped in the doctor room | live | `voice` 698–705; callers 1718, 1943, 2556, 3481–3523, 3676–3706 |
| 10 | Offline: short social/yes/no/number replies are classified by the act model | live (offline path) | `readAct` 725–735; probe: `readAct('شكرا يا دكتور')='thanks'`, `'120'→'number'`, `'مش متأكد'→'unsure'` |
| 11 | Offline: a history question that keywords miss is mapped to a finding by the second model | live (offline path) | `readFinding` 743–754, used at 1193; probe: `readFinding('بتدخن؟')='f_rf_smoking_shisha'` |
| 12 | Doses typed in Arabic or Latin are parsed and judged against the case limits («ok» / «wrong» / cannot tell) | live, online and offline | `doseOf` 785–801, `doseCheck` 804–857; callers 1581, 2428, 3133–3427; probe: `doseOf('اكسجين 5 لتر')` → `{lo:5,hi:5,kind:'vol',by:1000}` |
| 13 | Offline: a full reading of a free-text message: who is addressed, which history facts, examinations, drug orders with doses, tests, tone, and whether it answers the room's open question | live (offline path, and online for "room-only" questions at 1925) | `localRead` 1090–1367; callers 1925, 1941, 1967, 2542, 2555; probe: `localRead('اعطوه اكسجين 5 لتر')` → `to:'nurse', kind:'order', actions:[{id:'oxygen',dose:'5 لتر'}]`; `localRead('بتدخن؟')` → `to:'patient', facts:['smoke']` |

Nothing in the range was found to be dormant or unreferenced (reference counts in the Declarations table come from one grep per name over er.js; no other script or index.html references these names).

## Declarations

"Called from" lists line numbers outside 594–1369 unless marked "in range". Layers: D domain, A application, I infrastructure, P presentation.

| Name | Lines | Kind | Responsibility | Layer | Shared state read / written | Called from |
|---|---|---|---|---|---|---|
| `LABEL` | 595 | arrow fn | Speaker labels for bubbles, per role | P | R: `E.c.patient.name`, `E.c.companion.name`, `E.c.nurse.name`, `E.nurse.doc` | in range (604, 623) |
| `bidi` | 597 | arrow fn | Escape text and wrap Latin runs in `<bdi dir="ltr">` | P | uses `esc` (35) | in range |
| `say` | 598–610 | function | Append one bubble to `#er-feed`, scroll, highlight portrait | P | R: DOM `#er-feed`, `.er-p[data-who]`; uses `shown` (592) | 205, 258, 2135, 2237, 2948, 3548, 3563–3566, 3675, 3707 |
| `person` | 611–634 | function | A person's line: nurse-mode address stripping, nurse-bubble merging, transcript push | A + P | R: `E.over`, `E.merging`, `E.turns`, `E.sim`; W: `E.lastN`, `E.dTurn`, `E.dAt`, `E.chat`, `E.utt` | 34 call sites (e.g. 155, 166, 206, 211, 1847, 1906, 2142, 2193 …) |
| `nurse` | 637 | function | ER nurse line; in nurse mode delegates to `nurseAlt` | A | — | many (function-call sites among 145 name hits) |
| `nurseAlt` | 638 | function | Nurse-mode substitute: nothing, room note, or instructor line | A | — | in range (637) |
| `docSay` | 640 | arrow fn | Nurse mode: fixed line of the doctor | A | — | 2587–3021 (15 sites) |
| `sys` | 641 | arrow fn | System bubble | P | — | 30 sites (2571 …) |
| `alert` | 642 | function | Alarm bubble (shadows `window.alert` inside the wrapper) | P | — | 201, 3390, 3718 |
| `log` | 643 | arrow fn | Append `{at,type,text}` to the case event log | A | W: `E.log`; R: `E.sim` | 31 sites (183, 200, 2068 …) |
| `typing` | 645–652 | function | Three-dot placeholder bubble; returns the element | P | DOM `#er-feed` | 1932, 2547, 3067, 4620 |
| `stateNow` | 655–661 | arrow fn | Room state snapshot for the server (minute, vitals line, done acts, results back, tests pending) | A | R: `E.sim`, `E.done`, `E.harmed`, `E.tests`; uses `vitalsLine` (108), `actOf`, `testOf`, `resultText` (3530) | in range (679) |
| `timeout` | 662 | arrow fn | AbortSignal with timeout (fallback for old browsers) | I | timer | in range; 4660 |
| `goOff` | 664–669 | function | Switch to offline, schedule retry, load find model, show note once | I + P | W: `api`, `apiRetryAt`, `apiNoted` | in range (682, 690) |
| `call` | 670–693 | async fn | POST to the API with shared body; failure accounting; recovery note | I | R/W: `api`, `apiFails`, `apiRetryAt`, `apiNoted`; R: `E.c.id`, `E.risk`, `E.anx`, `E.chat`, `E.nurse.orders` | 1937, 2108, 2540, 2549, 2591, 2647, 3764, 3806, 4002 |
| `ping` | 695 | arrow fn | GET `?ping=1`; on failure sets offline with a 15 s retry | I | W: `api`, `apiRetryAt` | 4681 |
| `voice` | 698–705 | async fn | Ask the server for one line (`mode:'line'`), drop if stale, else say reply or fallback | A | R: `E`, `E.sent`, `E.over` | 1718, 1943, 2556, 3481, 3482, 3520, 3523, 3676, 3697, 3706 |
| `ACT`, `actRetried` | 709 | let | Act model (set by `loadAct` at 4660) and its one-retry flag | I | W outside: 1938, 2550, 4660 | — |
| `actText` | 711 | arrow fn | Text normalisation for the models (must match the Python trainer) | I | uses `norm` (37) | in range |
| `actGrams` | 712–724 | arrow fn | Feature extraction: meta tokens, word tokens, char n-grams `N.n[0]..N.n[1]` | I | R: `ACT` (default arg) | in range |
| `readAct` | 725–735 | function | TF-IDF + linear scores → one of 10 acts; pure digits → `'number'` | I | R: `ACT` | in range (906, 1210); test hook 4704 |
| `FIND`, `findWanted` | 737 | let | Finding model and its load-in-flight flag | I | — | in range |
| `loadFind` | 738–742 | function | Fetch `data/er-find.json`, build index | I | W: `FIND`, `findWanted` | 4685; in range (667, 695) |
| `readFinding` | 743–754 | function | Sparse linear scores, softmax confidence ≥ `tau` → finding id or null | I | R: `FIND` | in range (1193); test hook 4704 |
| `socialReply` | 756–761 | function | Fixed reply to greeting / wish / thanks | D | — | 1880 |
| `hasAny` | 764–770 | arrow fn | Keyword match on normalised text (short Arabic words allow a one-letter prefix) | D | — | 20 in range; 1414, 1466, 1596, 1642, 1673, 1694, 2526, 2900, 3775–3779, 4019, 4027 |
| `digits` | 772 | arrow fn | Arabic-Indic digits, decimal separators, strip ratios/times | D | — | in range; 2517, 3016 |
| `DOSE`, `UNITS`, `SCALE` | 773–776 | const | Dose regex; unit → (kind, factor) tables | D | — | `SCALE` also 2453 |
| `NOT_DOSE_AFTER`, `NOT_DOSE_BEFORE`, `COUNT`, `PER_KG`, `PER_TIME`, `PER_HOUR` | 778–783 | const regex | Context rules for dose parsing | D | — | in range |
| `doseOf` | 785–801 | function | Parse first usable dose: `{raw, lo, hi, kind, by, perKg, perTime, hour, unsure}` | D | — | 2905, 3135, 3140, 3141, 3173, 3202, 3332 |
| `doseIn` | 802 | arrow fn | Dose as display string with `/kg`, `/h`, `/min` | D | — | 1570, 1613, 1633, 3403, 3427 |
| `doseCheck` | 804–857 | function | Judge a dose against `limits`: `'ok'`, `'wrong'`, `null` | D | R: `E.c.kg`, `actOf(id).limits` | 1581, 2428 |
| `amountOf` | 859–865 | function | Dose in base units for the running total | D | R: `E.c.kg` | 2453, 3285 |
| `sugUnit` | 869 | arrow fn | Unit text of the nurse's suggested dose | D | — | in range |
| `doseFor` | 870–879 | function | Bare number takes the proposal's unit when that is in range | D | R: `E.c.care` | 3133, 3415, 3427 |
| `doseFits` | 880 | arrow fn | Whether a typed dose fits an open proposal | D | R: `E.c.care` | in range (943, 944) |
| `STOP` | 884 | const regex | Words that stop or withdraw | D | — | in range |
| `shortStop` | 886 | arrow fn | A sentence of ≤ 3 words that is a stop | D | — | in range |
| `offlineAnswer` | 887–973 | function | Verdict on the open question: `na/good/wrong/withdraw/partial/ungraded/noted` | A (with D rules) | R: `E.pending`; **W: `E.queue`, `E.pending`** (929–934, 944–949); uses `ACCEPT` (2249), `allergicTo` (2387), `sameFam` (2022) | in range (1358, recursive 935, 950) |
| `REPEAT_OK` | 976 | const | Orders safe to accept when repeated | D | — | 3179 |
| `NEGATED`, `STEP_OUT`, `ORDER`, `URGENT`, `HISTORY`, `ASKS_ABOUT`, `ASKS_PAST3`, `PAST_WORD` | 978–987 | const regex | Negation, order verbs, urgency, history-question openers | D | — | `STEP_OUT` 2081; `ORDER` 1373; `HISTORY` 1892 |
| `mentionsOf` | 989–1002 | arrow fn | Positions of every keyword mention | D | — | 2303 |
| `freeAt` | 1003 | arrow fn | Mention at index is not negated | D | — | 2303, 2400 |
| `FORCED` | 1006 | let | Ids added by a collision rule on the last `collisions` call | D (module state) | W: `collisions`; R: `localRead` | in range |
| `collisions` | 1007–1060 | function | Remove/add action and test ids when the same word means different things (about 30 rules) | D | W: `FORCED`; R: `E.vtNow`, `D.tests`, `D.actions` | in range (1127) |
| `clauseDose` | 1062–1066 | function | Dose written beside a given drug in a multi-drug sentence | D | — | in range |
| `sayNameOf` | 1073 | arrow fn | Drug name as typed, for the nurse's read-back | D | R: `E.c.care` | 1582, 3403, 3431, 3443 |
| `agentOfSug` | 1075–1086 | arrow fn | Agent in a proposal text that matches the typed dose | D | — | 3293 |
| `nz` | 1088–1089 | arrow fn | Reader normalisation on top of `norm` (glued Latin, oxygen spellings) | D | — | 1561, 2542, 2554, 2569, 2649, 2659 |
| `localRead` | 1090–1367 | function | Full offline read of one message into the server's "read" shape | A (with D rules) | R: `E.c.*`, `E.pending`, `E.tests`, `E.done`, `E.harmed`, `E.facts`, `E.lastOrdered`, `E.turns`, `D`; W via `offlineAnswer`; uses `ORDER_N` (1373), `firstP` (1396), `nurseShape` (1418), `unknownName` (1642), `wordDose` (1659), `wordHas` (1673), `resultAskOf` (1675), `statusOfQ` (1690), `wordsIn` (51) | 1925, 1941, 1967, 2542, 2555; test hook 4704 |
| `VITALS_Q` | 1368 | const regex | Words that name vital signs | D | — | in range (1170, 1296–1300, 1338); 1499, 1607, 1862 |

## Shared state, globals and contracts

**Defined here for the rest of er.js**

- Feed API: `say(who, text, extraHtml)`, `person`, `nurse(text, alt)`, `docSay`, `sys`, `alert`, `log(type, text)`, `typing(who)`. `who` values: `p`, `c`, `n`, `d`, `me`, `sys`, `alarm`, `lab`. `extra` is inserted as raw HTML (605): the caller must escape it.
- Transcript contract: `E.chat` items `{ r: 's'|'p'|'c'|'n'|'d', t: text }` (632); `E.log` items `{ at, type, text }` (643); `E.lastN = { el, text, turn }` (630).
- Server client: `call(body, ms)` → parsed JSON or `null`; `voice(who, speaker, why, fallback, keep)`; `ping()`; `timeout(ms)`.
- Offline readers: `readAct`, `readFinding`, `localRead`, `offlineAnswer` (internal), `socialReply`.
- Dose API: `doseOf`, `doseIn`, `doseCheck`, `amountOf`, `doseFor`, `SCALE`.
- Lexicon: `hasAny`, `mentionsOf`, `freeAt`, `nz`, `digits`, `ORDER`, `HISTORY`, `STEP_OUT`, `REPEAT_OK`, `VITALS_Q`, `sayNameOf`, `agentOfSug`.
- `localRead` return shape (1354–1364): `act, text, forbids, unclear, unclearId, readingOf, noHelp, toPat, named[], typedOrder, to ('patient'|'companion'|'nurse'|'supervisor'), facts[], exam[], actions[{id, agent, dose, bare?, sayName, _titr?}], tests[{id, reason, reason_ok}], kind ('help'|'order'|'open'|'smalltalk'|'question'|'other'), vague, vagueSub, patQ, dxAsk, dispoHome, allergenRef, resultAsk, statusOf, statusAll, titr, unknownDrug, planLater{id, when}, roomQ, helpTeam, resultsAll, howIs, monitorAsk, pending_ok, tone{introduced, empathy, rude, jargon, explained, consent}`. In nurse mode the object is passed through `nurseShape` (1366).
- `window.__nbER` (4704) exposes `readAct`, `readFinding`, `doseCheck`, `doseOf`, `doseIn`, `localRead` (confirmed in the running page).

**Expected from outside the range**

- Module variables (er.js:12–23): `API`, `OFFLINE_NOTE`, `api` (`'try'|'on'|'off'`), `apiFails`, `apiRetryAt`, `apiNoted`, `D`, `E`.
- Helpers declared earlier: `$`, `esc` (35), `norm` (37), `NM` (29), `forNurse` (32), `testOf` (41), `actOf` (42), `wordsIn` (51), `vitalsLine` (108), `shown` (592).
- Helpers declared later in the file (forward references, resolved at call time): `ORDER_N` 1373, `firstP` 1396, `nurseShape` 1418, `unknownName` 1642, `wordDose` 1659, `wordHas` 1673, `resultAskOf` 1675, `statusOfQ` 1690, `sameFam` 2022, `ACCEPT` 2249, `allergicTo` 2387, `resultText` 3530, `loadAct` 4660.
- DOM: `#er-feed`; `.er-p` elements with `data-who`; CSS classes `er-msg`, `k-<who>`, `er-who`, `er-dots`, `is-on`.
- Case data fields (`E.c`, from `data/er-cases.json` as loaded elsewhere): `id`, `patient.name`, `patient.addr[]`, `companion.name`, `nurse.name`, `kg`, `care[id].{limits, allergyKw}`, `facts[].{id, kw, who}`, `exam[].{id, kw}`, `findMap`, `results[id].key`. Dictionary (`D`): `actions[].{id, kw, ar, en, dose, limits[].{kw, unit, lo, hi, cap}, repeat.up}`, `tests[].{id, kw, en}`.
- Live state (`E`): `over, role, merging, turns, sim, sent, risk, anx, show, bp, chat, log, utt, done (Map), harmed (Set), tests, facts (Set), pending{type, a, id, sug, name, tip, allergic, since}, queue, lastOrdered, vtNow, nurse.{doc, orders, acts}`.

## Data, storage and network

| Kind | Detail | Lines |
|---|---|---|
| fetch POST | `API` = `/api/er-chat` on `*.vercel.app`, otherwise the absolute production URL (er.js:12). JSON body: `case, risk, anx, state{minute, vitals, done[], results[], ordered[]?}, history` (last 14 of `E.chat`), nurse mode adds `role:'nurse', orders[]` (max 12, `"<ar>: cancelled|done|pending"`), plus caller fields (`text`, `pending{ask}`, `mode:'line'|'grade'`, `speaker`, `why`, …). Default timeout 15 s; 9 s for `voice`; 4 s when retrying from offline | 670–680, 700 |
| Response handling | Non-OK: statuses 403, 404, 405, 429, 503 switch offline at once; any other failure switches offline on the third in a row. OK: `api='on'`, counter reset. Fields read in this range: `reply` (704). Other fields (`read`, `voiceFailed`, `to`, `held`, `unplaced`) are read by callers | 681–692 |
| Server side (read-only source `api/er-chat.js`, 410 lines) | GET `?ping=` → 200/503; POST only; origin allow-list → 403; per-instance rate limit → 429; `history` capped at 14, `orders` at 12, `done` at 20, `results` at 12: the same caps as the client | er-chat.js 273–309 |
| fetch GET | `API + '?ping=1&_=' + Date.now()`, `cache:'no-store'`, 4.5 s; body cancelled; failure → `api='off'`, retry after 15 s, `loadFind()` | 695 |
| fetch GET | `data/er-find.json` (738 KB), 8 s. Fields: `classes[122]`, `n[2]`, `tau` (0.3), `scale` (40), `bias[122]`, `idf[5000]`, `grams[5000]`, `w[5000]` as flat `[classIndex, weight, …]` pairs, `source` | 741 |
| Model data read (loaded at 4660) | `data/er-act.json` (411 KB): `acts[10]` = greeting, wish, thanks, yes, no, unsure, refuse, number, time, other; `n[2]`, `bias[10]`, `idf[8000]`, `grams[8000]`, `w[8000][10]` (bias and weights divided by 100 on load) | 725–735, 4660 |
| Timers | `setTimeout` in the `timeout` fallback (never cleared); `Date.now()` for `apiRetryAt` (60 s after failure, 15 s after failed ping) and the ping cache-buster | 662, 666, 672–673, 695 |
| localStorage / sessionStorage | none in this range | — |
| Audio, history API | none in this range | — |
| Console | `console.warn('er-find', e)` on model load failure | 741 |

Probe result (production host blocked inside the page by a fetch stub, so no deployed endpoint was contacted): from `http://127.0.0.1:5180/` the page attempted `GET https://nabd-smoky-one.vercel.app/api/er-chat?ping=1&_=…`. The local `/api` path is not used on a non-vercel host.

## Calculations and rules worth pinning with a golden-master test

| Name | Lines | Inputs | Output | Randomness / time |
|---|---|---|---|---|
| `bidi` | 597 | string | HTML string with `<bdi>` runs | none |
| `actText` + `actGrams` | 711–724 | raw text, model `n` range | token list (`#w<n>`, `#q`, `#d`, `#l`, `~word`, char n-grams) | none; must stay identical to the Python trainer |
| `readAct` | 725–735 | raw text + `er-act.json` | one of 10 acts; ties → first index | none |
| `readFinding` | 743–754 | raw text + `er-find.json` | finding id or null (softmax top ≥ 0.3, not `none`) | none |
| `socialReply` | 756–761 | act, text | fixed Arabic reply | none |
| `hasAny`, `mentionsOf`, `freeAt` | 764–770, 989–1003 | normalised text, keyword list | boolean / indices | none |
| `digits`, `doseOf`, `doseIn` | 772–802 | text | dose object / string | none |
| `doseCheck` | 804–857 | `a{id, dose, agent, said}`, `def.limits`, text, `E.c.kg` | `'ok'`, `'wrong'`, `null` | none; reads `E.c.kg` |
| `amountOf` | 859–865 | same | number (base units) | none |
| `doseFor`, `doseFits`, `sugUnit` | 869–880 | open question `q{sug, a}`, text | dose string / boolean | none; reads `E.c.care`, `NM()` |
| `shortStop`, `STOP`, `NEGATED`, `ORDER`, `URGENT`, `HISTORY` | 884–987 | text | boolean | none |
| `offlineAnswer` | 887–973 | text, normalised text, parsed parts, `E.pending`, `E.queue` | verdict string; may reorder `E.queue` and replace `E.pending` | `E.sim` written to `pending.since` |
| `collisions` | 1007–1060 | text, Set of ids | reduced/extended Set; `FORCED` | none; reads `E.vtNow`, `NM()` |
| `clauseDose`, `sayNameOf`, `agentOfSug`, `nz` | 1062–1089 | text (+ keywords / proposal) | string | none |
| `localRead` | 1090–1367 | text + `E` + `D` | read object (shape above) | none directly; depends on `E.turns`, `E.pending`, `E.done`, `E.tests`, `E.lastOrdered` |
| `stateNow` | 655–661 | `E` | request `state` object | `E.sim` |
| `call` failure policy | 670–693 | HTTP status sequence | `api` state transitions (`try/on/off`), retry time | `Date.now()` |

Suggested fixtures: the existing phrase suites (`window.__nbER.localRead`, `readAct`, `readFinding`, `doseOf`, `doseCheck`) with a fixed case and a fixed `E.pending`; both roles (doctor and nurse), because most rules branch on `NM()`.

## Problems

| Severity | Kind | Evidence |
|---|---|---|
| high | architecture | er.js:12 with 677 and 695: on any host that is not `*.vercel.app` (GitHub Pages, localhost, the future ASP.NET host) the client calls the absolute production URL of the paid AI function. Confirmed in the running page from 127.0.0.1 (ping to the production host). A re-hosted site would keep depending on that single external host unless `API` becomes configuration. |
| high | architecture | `offlineAnswer` is a reader but mutates the room: it splices and unshifts `E.queue` and replaces `E.pending` (929–934, 944–949), then recurses. `localRead` calls it for `pending_ok` (1358), so reading a message has side effects; `localRead` is called twice for one message on one path (1925 then 1941). Whether the second call ever returns a different result was not determined. |
| medium | maintainability | `localRead` is one 278-line function (1090–1367) with about 25 output flags, about 60 inline regex literals and case-specific clinical rules; doctor-room behaviour is patched in one `if (!NM())` block of 117 lines (1237–1353). Rule order decides the result and is undocumented except by dated comments. |
| medium | architecture | Layers are mixed: `person` (611–634) renders, edits a previous DOM node, and mutates the transcript and counters; `goOff`/`call` (664–693) change network state and write chat bubbles; `doseCheck`, `amountOf`, `doseFor` read the global `E` (814, 863, 878) instead of taking weight and limits as arguments. |
| medium | maintainability | Hidden module state: `collisions` writes `FORCED` (1006–1008) and `said` reads it after calling `named` (1136). The save/restore in `named` (1127: `const keep = FORCED; …; FORCED = keep;`) runs after `collisions` has already replaced the Set, so it restores the same object and has no effect. |
| medium | duplication | The TF-IDF vector and normalisation code is written twice (729–731 and 746–748). The "move another proposal to the front" block is written twice (929–935 and 946–950). The short-word prefix forms are written twice (`hasAny` 769, `mentionsOf` 995). Order, stop and negation vocabularies overlap across `STOP` 884, `NEGATED` 978 and inline regexes (896, 925, 1324). |
| medium | bug | Regex lookbehind is used (597 `(?<![ .,\-/+])`, 1201 `(?<=^| )(?<!انا |…)`). A browser without lookbehind support fails to parse the whole of er.js. Which browsers the project must support was not determined. |
| low | maintainability | `function alert` (642) shadows `window.alert` for the whole wrapper; `log` (643) is a generic name for the case event log. |
| low | bug | `said(ACTS)` is recomputed inside the `map` callback for every found action (1139), so `collisions` and all keyword scans run n+1 times per message. Result is the same; cost only. |
| low | maintainability | Declaration order hides dependencies: `VITALS_Q` (1368) is declared after the function that uses it; `localRead` and `offlineAnswer` depend on 11 names declared 5 to 2,400 lines later. |
| low | maintainability | `timeout` fallback (662) starts a timer that is never cleared after the request completes. |
| low | data-exposure | Each request sends the last 14 transcript lines, including the trainee's free text, to the external function (679). No identifier of the trainee is added in this range. |
| low | security | `say` inserts `extra` as raw HTML (605). In this range every text path is escaped (`esc`, `bidi`); the 12 outside callers that pass `extra` were not audited here. |

## Proposed source fragments

Validated with `check-fragment.mjs … --iife`: all seven print `ok`.

| Order | File name | From–to | Single responsibility | Layer |
|---|---|---|---|---|
| 1 | `er-feed-stream.js` | 594–653 | Chat feed: bubbles, speaker wrappers, transcript and log append, typing dots | presentation (+ application in `person`) |
| 2 | `er-server-client.js` | 654–706 | Request state, timeouts, online/offline switching, `call`, `ping`, `voice` | infrastructure |
| 3 | `er-offline-models.js` | 707–762 | Act model and finding model: features, scoring, loading; fixed social replies | infrastructure |
| 4 | `er-dose-reading.js` | 763–881 | Keyword match, dose parsing, unit tables, dose-limit check, totals | domain |
| 5 | `er-offline-answer.js` | 882–974 | Verdict on the room's open question without the server | application |
| 6 | `er-order-lexicon.js` | 975–1067 | Order/negation/history vocabularies, mention positions, drug/test collision rules | domain |
| 7 | `er-local-read.js` | 1068–1369 | Reader normalisation helpers and `localRead` (full offline read of a message) | application |

## Open questions

1. Should `API` become server-side configuration (and a same-origin endpoint) in the ASP.NET host, so that non-vercel origins stop calling the production function directly?
2. Is the double call of `localRead` at 1925 and 1941 safe given that `offlineAnswer` can reorder `E.queue`? A test with two open dose proposals and a "room-only" message would settle it.
3. `actText`/`actGrams` must match `nabd-model/lang/train_act.py`, which is not in this repository. Where is the trainer kept, and is there a parity test?
4. Will the two models (`er-act.json`, `er-find.json`) stay in the browser, or move behind the server as an infrastructure service? The second option changes the offline guarantee.
5. Which browsers must be supported? This decides whether the lookbehind regexes (597, 1201) need rewriting.
6. `localRead` and the server's reader must return the same object shape. Is there a written schema, or is the shape at 1354–1364 the only definition?
