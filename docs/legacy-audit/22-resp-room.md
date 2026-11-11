# Respiratory emergency room (resp.js) — resp.js:1–895

## Purpose

resp.js implements a self-contained history-taking room: a synthetic patient (DDXPlus test split) arrives with one chief complaint, the student asks questions by free text or from a list, measures vitals, orders tests, then submits a diagnosis and an urgency decision. A small feed-forward network (3 dense layers, int8 weights, 49 classes) runs in the browser and re-ranks the diagnoses after every answered question. Patient replies come from a serverless endpoint (`/api/resp-chat`) or, when it is unavailable, from a fixed Arabic answer table plus a local keyword matcher. The file ends by scoring the attempt (diagnosis 60, urgency 25, question economy 15) and writing a history entry into the signed-in account. The whole file is one IIFE (lines 8–895); it exports three globals. **In today's UI the room is dormant** (see next section).

## Features and user journeys implemented here

Reachability of the room as a whole: **dormant**. Evidence:

| Evidence | Where |
|---|---|
| `window.nbOpenResp` is assigned (resp.js:885) but no other file references it. Searched `nbOpenResp`, `OpenResp`, `view-resp`, `'resp'`, `__nbResp` in `*.js`, `index.html`, `*.css`: no caller, no inline handler. | resp.js:885 |
| `REMOVED_VIEWS` contains `'resp'`; `navigateTo` rewrites a removed view to `'home'`. | script.js:1678, 1949 |
| Home card `#home-resp-card` has class `er-locked`, `aria-hidden="true"`, a "مقفلة" tag, and no handler; it is also `display:none !important`. | index.html:728–734; home9.css:20 |
| Sidebar item for the room is `er-locked`, `tabindex="-1"`, `aria-disabled="true"`, no id, no handler; `.er-locked` has `pointer-events:none`. | index.html:220; er.css:155 |
| Running page (signed in as `med_student`): `navigateTo('resp')` returns `true` and shows `view-home`; `#home-resp-card` computed `display:none`; sidebar item computed `pointer-events:none`. | probe |
| Calling `nbOpenResp()` from the console: `navigateTo('resp')` returns `true` (not `false`), so `open()` continues, mounts listeners, fetches the 4 data files and starts a patient **inside the still-hidden** `#view-resp` (`view-home` stays the only visible view). | probe; resp.js:866 |
| Server side: the local copy of `api/resp-chat.js` has `LOCKED = true` and answers 410 before anything else (lines 169, 172). Deployed state not determined (not called). | api/resp-chat.js |

resp.js is still loaded (index.html:2315, `defer`) and `motion.js:581–595` still binds the monitor widget to `.rs-mon` and calls `window.nbRespVitals`.

Features (all dormant for the reason above; code paths are complete and ran in the probe through the `__nbResp` hook):

| Feature | Lines | What the user would see or do |
|---|---|---|
| Open room, lazy data load, retry | 36–59, 865–883 | Loading state, then patient; on failure a message with "أعد المحاولة" |
| New patient with severity mix | 108–139, 802–824 | Name, age/sex header, arrival line, volunteered chief complaint |
| Free-text question, online | 454–476, 600–618 | Typing dots, reply from the API, questions it answered are recorded |
| Free-text question, offline | 387–447, 619–632 | Local match → answer; ambiguous → up to 3 chips "هل تقصد"; greeting; "لم أفهم" |
| Question list with search | 641–663, 843–851 | Collapsible list of all questions; asked ones struck through |
| Mother answers for a child under 6, feminine forms | 164–182, 545 | Wording and speaker label change |
| Vitals monitor "قِس الآن" (also typed) | 225–286, 384, 610 | Five tiles, a system line with the readings, age-specific normal ranges |
| Order tests by button or typed order | 289–383, 608 | Lab card in the chat with values, H/L flags, report, optional meaning |
| Live model bars (top 5) | 581–591 | Probabilities after each question; hidden in exam mode until submit |
| Body map of pain / spread / rash / swelling | 480–538 | Front and back SVG figures with dots, zoom on head and neck |
| Submit dialog (searchable diagnoses + urgency box) | 666–705 | Pick one of 49 conditions (22 respiratory first), tick urgent, submit |
| Result card and history write | 708–800 | Score, breakdown, model top 3, sparkline, best missed questions, vitals, tests; entry in profile history |
| Practice / exam mode switch | 862 | Switching mid-case starts a new patient |

## Declarations

"State" below means the module variables `M, POOL, T, L, CL, evIndex, members, heads, cues, S`.

| Name | Lines | Kind | Responsibility | Layer | Shared state read / written | Called from |
|---|---|---|---|---|---|---|
| `DATA` | 11 | const | Data folder prefix | infrastructure | – | fetchAll |
| `API` | 12 | const | Endpoint URL: relative on `*.vercel.app`, otherwise absolute production URL | infrastructure | reads `location.hostname` | chatApi |
| `RESP` | 13–17 | const Set | 22 respiratory class names (grouping in submit dialog) | domain | – | openSubmit |
| `NAMES` | 18–21 | const | 12 male + 12 female first names | domain (data) | – | startPatient |
| `M, POOL, T, L, CL` | 23 | let | Model JSON, filtered patients, Arabic table, decoded layers, clinical table | infrastructure (cache) | written by fetchAll | most functions |
| `evIndex, members, heads, loading` | 24 | let | Evidence→index, group→members, group→head question, in-flight load promise | infrastructure (derived index) | written by fetchAll / load | most functions |
| `S` | 25 | const object | Session state. Initial fields: `pt, tok, asked, derived, steps, exam, done, seen, caseNo`; added later: `name, rng, vit, measured, tests, results, chat, facts` | application (state) | – | everything; exposed as `__nbResp.state` |
| `$` | 27 | const fn | `getElementById` | presentation | – | rendering code |
| `esc` | 28 | const fn | Escape `& < > "` | presentation | – | rendering code |
| `pct` | 30 | const fn | Probability → "%" string in LTR isolate (`>99`, `<0.1`, rounding rules) | presentation | – | renderBars, spark, finish |
| `CHILD` | 31 | const | Age (6) below which the mother answers | domain | – | young |
| `ageAr` | 32 | const fn | Age → Arabic phrase | presentation | – | begin |
| `load` | 36 | const fn | Single-flight, retryable loader | infrastructure | R `M`; W `loading` | open, `__nbResp.load` |
| `fetchAll` | 37–59 | async fn | Fetch 4 JSON files, decode int8 weights, build indexes, filter pool | infrastructure | W all cache variables | load |
| `ADULT_ONLY` | 63 | const Set | 14 evidence ids implausible under age 12 | domain | – | plausible |
| `plausible` | 64 | const fn | Patient filter (age ≥ 12 or no adult-only evidence) | domain | – | fetchAll |
| `net` | 69 | const fn | Remove derived groups from the asked set before inference | domain | R `S.derived` | record, bestMissed |
| `encode` | 70–81 | fn | Sparse feature vector (asked flags, value columns, age, sex) | domain | R `M.encoder`, `S.pt`, `evIndex` | predict |
| `predict` | 83–105 | fn | Forward pass (ReLU, softmax) → 49 probabilities | infrastructure (model execution) | R `L` | startPatient, record, bestMissed, `__nbResp.predict` |
| `startPatient` | 108–139 | fn | Choose patient by severity band, reset session state | application | R `POOL, M`; W most of `S` | begin |
| `factsFor` | 143–155 | fn | List of record facts (formal + Jordanian wording) sent to the API | domain | R `S.tok, heads, members, T, M` | startPatient |
| `joinAr` | 157 | const fn | Arabic list join | presentation | – | fillValues, bodyMap |
| `fillValues` | 158–161 | fn | Replace `{v}` with translated values | domain | R `S.tok, T.values` | factsFor, answer |
| `young`, `fem` | 164, 165 | const fn | Speaker and gender predicates | domain | R `S.pt` | many |
| `line` | 167–177 | fn | Pick the answer wording variant for an evidence | domain | R `T.evidences` | factsFor, answer |
| `qText` | 178–182 | const fn | Question wording (child variants) | domain | R `T.evidences, S.pt` | record, onAsk, renderQuestionList, finish |
| `THROAT`, `IMPLIED`, `isDerived` | 187–192 | const / fn | Answers implied by other signs (cough, sore throat) | domain | R `S.tok, heads` | factsFor, answer, record, bestMissed |
| `TWINS` | 194–195 | const | Six pairs of duplicate questions | domain | – | answer |
| `answer` | 198–209 | fn | Offline answer for a question group (twins, derived, smoking rules, follow-ups) | domain | R `S.tok, heads, members, M, T` | askGroup, begin, finish |
| `seeded` | 214–221 | fn | Seeded PRNG (mulberry32-style) | domain | – | startPatient |
| `hasEv`, `band` | 222, 223 | const fn | Evidence test; age band name | domain | – | vitalsFor, nbRespVitals, resultFor |
| `vitalsFor` | 225–240 | fn | Draw vitals inside the condition's ranges | domain | R `CL, M, S.rng` | startPatient |
| `NORMAL` | 243–248 | const | Normal HR/RR/SBP by age band | domain | – | nbRespVitals |
| `window.nbRespVitals` | 249–268 | global object | `warn(k,v)` and `range(k)` for the monitor widget | domain (exposed as contract) | R `S.pt` | motion.js:588–589 |
| `ECG_REF` | 269 | const | ECG rate reference text by band | domain | – | resultFor |
| `TILES` | 271 | const | Tile DOM ids | presentation | – | showVitals |
| `showVitals` | 272–279 | fn | Fill or blank the five tiles | presentation | – | measure, begin |
| `vitalsLine` | 280 | const fn | One-line text of the readings | presentation | – | measure, finish |
| `measure` | 281–286 | fn | Reveal vitals, log once | application | R/W `S.measured` | mount, onAsk, `__nbResp.measure` |
| `catOf` | 288 | const fn | Test catalog lookup | domain | R `CL` | labCard, orderTest, finish |
| `renderTests` | 289–296 | fn | Test buttons by group and count | presentation | R `CL, S.tests` | orderTest, begin |
| `decimals` | 298 | const fn | Decimal places for a lab row (second parameter unused) | domain | – | resultFor |
| `flagOf` | 300–309 | fn | Parse a reference string, return `lo` / `hi` / `''` | domain | R `S.pt` (via `fem`) | resultFor |
| `resultFor` | 311–343 | fn | Generate and cache one test result (ECG rate, PaO2, pH, CBC rules) | domain | R `CL, M, S.rng, S.vit`; W `S.results` | labCard, finish, `__nbResp.result` |
| `labCard` | 345–353 | fn | HTML of a result card | presentation | R `S.exam` | orderTest |
| `orderTest` | 355–363 | fn | Order a test once, show its card | application | W `S.tests` | mount, onAsk, `__nbResp.order` |
| `TEST_CUES` | 366–379 | const | Keywords per test for typed orders | domain (language data) | – | matchTests |
| `matchTests` | 380–383 | fn | Text → test ids | domain | – | onAsk, `__nbResp.matchTests` |
| `VITAL_CUE` | 384 | const regex | Typed "measure vitals" | domain | – | onAsk |
| `norm` | 387–388 | const fn | Arabic text normalisation | domain | – | matching, search boxes |
| `STOP`, `PRE`, `SUF` | 389–395 | const | Stop words, prefixes, suffixes | domain (language data) | – | forms, buildCues, matchLocal |
| `forms` | 396–404 | fn | Stripped word forms and consonant skeleton | domain | – | buildCues, matchLocal |
| `cues` | 405 | let | Cached cue index | infrastructure (cache) | W by buildCues | matchLocal, open |
| `buildCues` | 406–415 | fn | Build cue index from `T.evidences` (`alt`, `kw`, `q`) | domain | R `T, M, evIndex`; W `cues` | open, `__nbResp.load` |
| `matchLocal` | 416–446 | fn | Score every question against the text; threshold 2.6 | domain | R `cues` | onAsk, `__nbResp.matchLocal` |
| `GREET` | 447 | const regex | Greeting detector | domain | – | onAsk |
| `api`, `apiFails` | 452, 453 | let | Circuit state `'off' / 'try' / 'on'` and failure count | infrastructure | W by chatApi | chatApi |
| `chatApi` | 454–476 | async fn | POST to the endpoint, validate reply, trip the circuit | infrastructure | R `S.chat, S.facts, S.pt, S.name` | onAsk |
| `LOC` | 480–507 | const | About 190 body-location codes → `[view, x, y]` | presentation (data) | – | bodyMap |
| `KINDS`, `FIGURE` | 508, 509–513 | const | Four mark kinds; SVG body outline | presentation | – | bodyMap |
| `bodyMap` | 515–538 | fn | Render figures, dots, spread lines, legend | presentation | R `S.asked, S.tok, T.values` | record, begin |
| `say` | 541–552 | fn | Append a chat message; push to `S.chat` | presentation (+ state write) | W `S.chat` | many |
| `typing` | 554–562 | fn | Typing indicator | presentation | – | onAsk |
| `record` | 565–579 | fn | Mark groups asked, add a model step, refresh panels | application | W `S.asked, S.derived, S.steps` | onAsk, askGroup |
| `renderBars` | 581–591 | fn | Top-5 bars or exam-mode notice | presentation | R `S.steps, S.exam, S.done` | record, finish, begin, mount |
| `renderAsked` | 593–595 | fn | Question counter | presentation | R `S.steps` | record, begin |
| `howAreYou` | 597–598 | const fn | Canned reply to "how are you" | domain | – | onAsk |
| `onAsk` | 600–639 | async fn | Route typed text: test order → vitals → API → local match → chips / greeting / not understood | application | R `S.done, S.caseNo` | mount (form submit) |
| `askGroup` | 641–650 | fn | Answer one question group offline and record it | application | R `S.asked, S.done` | onAsk, mount, `__nbResp.ask` |
| `renderQuestionList` | 652–663 | fn | Filtered question buttons | presentation | R `heads, T, S.asked` | record, begin, mount |
| `openSubmit` | 666–705 | fn | Build the diagnosis dialog and its handlers | presentation | R `M.classes, T.conditions` | mount |
| `bestMissed` | 708–718 | fn | Up to 3 unasked questions with gain > 0.02 | domain | R `S.steps, S.asked` | finish |
| `spark` | 720–725 | fn | Sparkline SVG of the true-diagnosis probability | presentation | R `S.steps` | finish |
| `triage` | 730–734 | fn | Urgency rule by severity; returns `{ok, html}` | domain (with embedded HTML) | – | finish |
| `qPoints` | 736 | const fn | Question-economy points | domain | – | finish |
| `finish` | 738–800 | fn | Score, render result card, lock inputs, write history | application + presentation + infrastructure | W `S.done`; W `authState.user.history/stats` | openSubmit |
| `begin` | 802–824 | fn | Start a patient and reset every panel | application | via startPatient | finish, mount, open, `__nbResp.start` |
| `mount` | 826–863 | fn | One-time listener wiring, dialog ARIA | presentation | W `S.exam` | open |
| `open` | 865–883 | async fn | Navigate, mount, load, begin or resume, error view | application | – | `window.nbOpenResp` |
| `window.nbOpenResp` | 885 | global | Entry point | presentation (contract) | – | no caller found |
| `window.__nbResp` | 887–894 | global object | Test hook: `load, predict, start, ask, state, matchLocal, measure, order, result, matchTests, CL, M, pool` | infrastructure (test) | exposes all state | no caller found in the repository (searched `*.js`, `index.html`, `tools/`) |

## Shared state, globals and contracts

Defined for others:

| Item | Lines | Consumer |
|---|---|---|
| `window.nbOpenResp()` | 885 | none found |
| `window.nbRespVitals.warn(key, value)`, `.range(key)` | 249–268 | motion.js:588–589 (monitor widget on `.rs-mon`) |
| `window.__nbResp` | 887–894 | none found in the repository |
| History entry pushed to `authState.user.history` | 790–792 | profile / academic views in script.js (consumers not traced here) |

Expected from others:

| Item | Where used | Provider |
|---|---|---|
| `navigateTo(view)` (optional, `typeof` guarded); only a return of exactly `false` aborts | 782, 866 | script.js:1948 |
| `authState.user` (optional), `saveAccountToStorage(user)` (optional) | 787–795 | script.js:1688, 1787 |
| motion.js toggling `.nb-mon-tile.is-picked` on click inside `#rs-mon-card` | 821 | motion.js:331–352 |
| CSS classes `rs-*`, `is-loading`, `font-num` | throughout | resp.css, theme files |
| DOM ids in index.html:1766–1830: `view-resp, rs-mode, rs-new, rs-pt, rs-feed, rs-form, rs-input, rs-send, rs-dx-btn, rs-submit, rs-mon-card, rs-measure, rs-v-hr, rs-v-bp, rs-v-spo2, rs-v-temp, rs-v-rr, rs-v-note, rs-tests-card, rs-tests, rs-tcount, rs-bars, rs-count, rs-body, rs-q-card, rs-qsearch, rs-qlist`; class `.rs-jump` with `[data-jump]`, `.rs-chat` | throughout | index.html |
| DOM ids created by resp.js itself: `rs-submit-h, rs-submit-x, rs-dx-search, rs-urgent, rs-pick, rs-go, rs-next, rs-home, rs-retry` | 677–703, 776, 780–781, 881 | resp.js |

## Data, storage and network

| Kind | Detail |
|---|---|
| fetch GET | `data/resp-model.json` (523 KB), `data/resp-patients.json` (261 KB), `data/resp-ar.json` (360 KB), `data/resp-clinical.json` (111 KB); in parallel, once, on first open (lines 38–39). Confirmed in the probe. |
| fetch POST | `API` (line 12). On any host not ending `.vercel.app` this is the absolute production URL `https://nabd-smoky-one.vercel.app/api/resp-chat`. Body: `{text, history (≤12 of {r:'p'|'s', t}), facts [{id, a, j}], chief, patient {age, sex, name, speaker:'mother'|'self'}}`. Expected response: `{reply: string, ids: string[]}`; ids not in `evIndex` are dropped. Timeout `AbortSignal.timeout(15000)`. |
| Circuit rule | Starts `'off'` on `file:`. HTTP 403/404/405/503 → off at once; any other failure or exception → off after 2 in a row; a good reply resets (lines 452–475). |
| Server contract (api/resp-chat.js, read only) | `LOCKED = true` → 410 for every request, before CORS headers (169–172). Otherwise: POST only (405), 503 without a key, 403 unless same host or an allow-listed origin, 400 on empty text, facts capped at 80, history at 10, 502/500 on upstream failure. Two model ids are named in the file (lines 15–16). |
| resp-model.json fields read | `classes[49]`, `layers[3]{rows, cols, scale[], q (base64 int8), b[]}` (1182→256→128→49), `encoder{evidences[223], groups[209], ev_group, value_col, asked_base, age_col, sex_col, age_scale}`, `meta.evidences[id]{type}`, `meta.severity[class]`. Present but not read: `version, trained_on, check, encoder.rules, encoder.n_features`. |
| resp-patients.json | `patients[1296]{age, sex, path (class index), init (evidence id), ev[] ("E_x" or "E_x_@_value")}`; 1218 remain after `plausible`. Severity counts in the file: 1:60, 2:240, 3:456, 4:420, 5:120. |
| resp-ar.json | `evidences[id]{q, q_cm, q_cf, alt[], kw[], yes, no, yes_f, no_f, yj, nj, yj_f, nj_f, cy_m, cn_m, cy_f, cn_f, cyj_m, cnj_m, cyj_f, cnj_f}` (also `cat`, `en`, not read), `values[code]` (199), `conditions[class]` (49). |
| resp-clinical.json | `catalog[12]{id, group ('img'|'lab'|'bed'), ar, en}`, `conditions[22 respiratory classes]{febrile, vitals{adult|child|infant}{hr, sbp, dbp, rr, spo2, temp: [lo, hi]}, tests[id]{rows[{param, unit, ref, lo, hi, text}], report, summary_ar}}` (`basis` not read). Every patient in the file has a clinical entry (checked). |
| localStorage | No direct access. Indirect: `saveAccountToStorage(u)` rewrites `nabd_v2_accounts_map[u.id]` with the new history entry `{caseTitle, mode, date (UTC yyyy-mm-dd), workupCount, questions, score (string), caseId 'resp_'+class, num, passed, ts}` and `stats.completed`. |
| sessionStorage, history API, audio, timers | None in this file (only the fetch timeout). |
| Randomness / time | `Math.random` ×3 in startPatient (band, patient, name); seeded PRNG for vitals and results; `Date` in the history entry (791–792). |

## Calculations and rules worth pinning with a golden-master test

All are drivable through `window.__nbResp` without network access.

| Name | Lines | Inputs | Outputs | Randomness / time |
|---|---|---|---|---|
| Weight decode | 42–47 | `layers[].q, scale, cols` | Float32 weights | none |
| `plausible` pool filter | 63–64 | patients | 1218 of 1296 | none |
| `encode` + `predict` | 70–105 | patient, asked groups | 49 probabilities. Observed: patient 0 after the chief complaint → Bronchiectasis 0.082512, Sarcoidosis 0.069869, Pericarditis 0.065626 | none (Float32 arithmetic) |
| `net` / `isDerived` / `IMPLIED` | 69, 187–192 | record tokens | derived groups excluded from inference | none |
| `answer` and `line` | 167–209 | group, age, sex, formal flag | answer text (twins, ex-smoker, follow-ups, child and feminine variants) | none |
| `factsFor` | 143–155 | patient | fact list (8 for patient 0) | none |
| `seeded` | 214–221 | seed `1 + poolIndex * 7919` | number stream | deterministic |
| `vitalsFor` | 225–240 | patient, clinical ranges, PRNG | Observed patient 0: hr 117, bp 138/89, rr 26, spo2 88, temp 36.5 | seeded |
| `nbRespVitals.warn` / `range` | 249–268 | key, value, age band | boolean / text (BP upper limit is range + 15; spo2 ≤ 94; temp ≥ 38 or ≤ 36) | none |
| `flagOf`, `decimals` | 298–309 | reference string, value, sex | `lo` / `hi` / `''`, decimals | none |
| `resultFor` | 311–343 | test id, patient, vitals, PRNG | rows with values and flags. Observed patient 0, CBC ordered first: WBC 12.5 H, Neutrophils 78 H, Lymphocytes 13.1 L, Eosinophils 2.0, Hemoglobin 14.9, Platelets 288 | seeded, **depends on order of ordering** (see Problems) |
| `matchTests`, `VITAL_CUE` | 366–384 | text | test ids ("بدي cbc وصورة صدر" → cxr, cbc) | none |
| `norm`, `forms`, `matchLocal` | 387–446 | text | ranked `{g, id, score}` ("عندك حرارة" → E_91, 4.033); accept rule in onAsk: single hit or second < 0.85 × first | none |
| Severity band choice | 110–115 | `Math.random` | 70% severity 4–5, 20% severity 3, 10% severity 1–2; no repeats until the band is exhausted | `Math.random` |
| `bestMissed` | 708–718 | truth, asked | top 3 gains > 0.02 | none |
| `triage`, `qPoints`, score and pass | 730–749 | severity, urgent, right, asked | score = 60 + 25 + qPoints; qPoints 0 below 3 questions, 15 for 3–10, minus 1 per extra; pass = score ≥ 70 and asked ≥ 3 | none |
| `pct` | 30 | probability | display string | none |
| History entry shape | 790–792 | result | object above | `Date` |

## Problems

| Severity | Kind | Evidence |
|---|---|---|
| high | security / architecture | Line 12: every host that is not `*.vercel.app` (local server, GitHub Pages, a future ASP.NET host) posts typed questions to the absolute production URL of a paid AI endpoint. A local test that types into the room calls production. er.js:12 has the same pattern. |
| medium | dead-code / architecture | The room is unreachable (script.js:1678, 1949; home9.css:20; index.html:220, 728) but resp.js, resp.css, `#view-resp` markup and the motion.js binding are still shipped and executed on load. About 1.25 MB of data files are deployed for it. |
| medium | bug | Line 866: `open()` aborts only when `navigateTo` returns `false`; for a removed view it returns `true` after redirecting home, so the room loads its data and starts a patient in a hidden section and focuses a hidden input (probe). |
| medium | bug | Lines 126 and 313: comment says the same patient always has the same results, but all tests draw from one PRNG stream after the vitals, so values depend on the order in which tests are ordered. Only the vitals are stable. |
| medium | architecture | Scoring, pass decision and the history write are client side (738–797) into `nabd_v2_accounts_map`; any user can edit them. The right diagnosis (`path`) is in the downloaded patients file and in `__nbResp.state`. |
| medium | maintainability | `finish` (738–800) mixes scoring, a 30-line HTML template, focus handling, input locking and persistence. `triage` returns rule result and HTML together (730–734). |
| medium | bug | Circuit vs server: the server's locked answer is 410 (and without CORS headers across origins), which is not in the immediate-off list (line 466), so two questions pay a failed round trip each before offline mode starts. |
| low | data-exposure | `window.__nbResp` test hook (887–894) is shipped in production and exposes the model, the pool and the session state. |
| low | duplication | `esc` (28) is identical to er.js:35; `norm` (387) nearly identical to er.js:37; API URL pattern duplicated at er.js:12; er.js:662 has a timeout fallback, resp.js:457 uses `AbortSignal.timeout` without one. |
| low | maintainability | `S` gains eight fields outside its initializer (119–137); `decimals` has an unused parameter (298); `renderAsked` renders a counter (593); dialog handlers are re-created on every open and there is no focus trap although `aria-modal` is set (689–703, 830–832). |
| low | bug | Typed text containing a test keyword is treated only as an order; any question in the same message is dropped (608). The cue `ct` (368) matches any standalone "ct" token. |
| low | bug | Client sends 12 history turns (460); the server keeps 10. `date` uses UTC (791), so an entry after midnight local time can carry the previous day. |
| low | maintainability | Adult normal HR is 50–110 in `NORMAL` (247) but the ECG reference text is 60–100 (269). Not determined whether intended. |
| low | maintainability | Stale texts outside this range still advertise the room: index.html:424, script.js:7101, comment script.js:1675. |

## Proposed source fragments

Validated with `check-fragment.mjs ... --iife`: all 21 print `ok`.

| Order | File | From–to | Single responsibility | Layer |
|---|---|---|---|---|
| 1 | resp-config-state.js | 11–33 | Constants, cache variables, session state, small helpers | application (state) |
| 2 | resp-data-loader.js | 34–65 | Fetch and decode data, build indexes, pool filter | infrastructure |
| 3 | resp-network.js | 66–106 | Feature encoding and forward pass | infrastructure (model execution) |
| 4 | resp-patient.js | 107–210 | Patient selection, facts, offline answers | domain |
| 5 | resp-vitals.js | 211–270 | PRNG, vitals generation, normal ranges, `nbRespVitals` | domain |
| 6 | resp-vitals-tests-panel.js | 271–297 | Monitor tiles, measure action, test buttons | presentation |
| 7 | resp-lab-results.js | 298–344 | Reference parsing and result generation | domain |
| 8 | resp-lab-order.js | 345–364 | Result card and ordering a test | presentation |
| 9 | resp-order-cues.js | 365–385 | Typed test and vitals order detection | domain |
| 10 | resp-question-matcher.js | 386–448 | Arabic normalisation and local question matching | domain |
| 11 | resp-chat-api.js | 449–477 | Endpoint call and circuit state | infrastructure |
| 12 | resp-body-map-data.js | 478–514 | Body location table, mark kinds, figure outline (data literal) | presentation (data) |
| 13 | resp-body-map.js | 515–539 | Body map rendering | presentation |
| 14 | resp-chat-screen.js | 540–596 | Chat feed, typing dots, recording a step, bars, counter | presentation |
| 15 | resp-ask-flow.js | 597–664 | Routing of a typed or picked question, question list | application |
| 16 | resp-submit-dialog.js | 665–706 | Diagnosis dialog | presentation |
| 17 | resp-scoring.js | 707–737 | Missed questions, sparkline, triage rule, question points | domain |
| 18 | resp-finish.js | 738–801 | Result card and history write | application |
| 19 | resp-begin.js | 802–825 | Start or restart a case | application |
| 20 | resp-mount.js | 826–864 | One-time event wiring | presentation |
| 21 | resp-open-exports.js | 865–894 | Entry point, error view, global exports and test hook | application |

## Open questions

1. Is the room to be migrated as a dormant feature, restored, or dropped? Today it is locked in four places (script.js, home9.css, index.html, and the server copy's `LOCKED`).
2. Is the deployed `api/resp-chat` in the same locked state as the local source copy? Not determined (endpoint not called by rule).
3. Who uses `window.__nbResp`? No caller in the repository; the header comment mentions checks against a Python model that are not in this checkout.
4. Should test results be stable per patient regardless of ordering sequence (as the comment at line 126 states)? A golden master must fix the ordering sequence either way.
5. In the new host, which URL should the room call, and should non-production hosts be prevented from reaching the paid endpoint?
6. Are the adult HR limits 50–110 (monitor) versus 60–100 (ECG reference) intended to differ?
