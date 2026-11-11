# Legacy data files

Scope: the eight JSON files in `C:/Users/ss/nabd-refactor/data`. All numbers below were produced by node scripts run against the files, and all reader line numbers come from grep of the checkout (`er.js`, `resp.js`, `script.js`) and of the two serverless sources in `C:/Users/ss/OneDrive/Desktop/nabd/api/` (`er-chat.js`, `resp-chat.js`). The serverless sources import copies of the same files from `../data/` (er-chat.js:17-18, resp-chat.js:11); I did not diff the Desktop copies against the checkout copies (not determined). All eight files are valid JSON (parsed with `JSON.parse`).

## Overview

All files are static assets of the site. The running legacy site answers `GET /data/<file>.json` with 200 (checked with curl for er-cases, er-lang, resp-model; the other five are served by the same static root, not individually requested). No file is access-controlled.

| file | bytes | sha256 | purpose | read by (script:line) | served to browser today? | sensitivity |
|---|---|---|---|---|---|---|
| er-cases.json | 259,214 | 4c76ccf2fb6c478deb17db926e0bb3339941fd13b7f186bdd2aac38323739865 | The 6 ER cases plus the catalogs of 22 tests and 42 actions: patient script, companion and nurse lines, vitals timeline, facts, exam, per-case evaluation rules, results, nurse-mode orders | browser: er.js:4661 (`load`, whole file into `D`); script.js:6062 (`nb8LoadErCases`, supervisor case list; reuses `window.__nbER.D` first, script.js:6059). server: er-chat.js:17 (`data`) | yes, whole file, no auth | answers, evaluation rules, patient script |
| er-act.json | 410,682 | 5891145b9b5b39c80ffc339f5fa09d29576a1257771d01d79fc5025152f3ce66 | Linear text classifier (10 dialogue acts) for short replies when the server is unreachable | er.js:4660 (`loadAct`); used by `readAct` er.js:725-735 | yes | model weights |
| er-find.json | 737,985 | eb4fedc9e3f1e4d234c66b2fd126e5bd1d0c9bcb191f1b8383f2552c6ada9367 | Linear text classifier (122 classes = history-finding ids plus `none`), offline reader of history questions | er.js:741 (`loadFind`); used by `readFinding` er.js:743-754, call site er.js:1193 | yes | model weights |
| er-lang.json | 7,983 | dc03422a26eea76ff0686f0f9f4b8c9e5e85a73954bcb581445d4fbbfb32da1b | Jordanian Arabic language notes (two prompt texts) and 124 dialect-correction pairs | only er-chat.js:18, used at 47, 100, 133, 157. No reference in any checkout `*.js` or `index.html` (grep `er-lang` over `*.js *.html *.json *.mjs` outside `data/`: only `tests/Nabd.Tests/LegacyBaseline/legacy-manifest.json:25`, a test manifest) | file is served (HTTP 200) but the page never requests it | language resource |
| resp-ar.json | 360,470 | 972abb1fab81b448b2327229383f3affbd567055022958c1266f858ef5727ed5 | Arabic question/answer wording for 223 DDXPlus evidences, 199 value labels, 49 condition names | resp.js:39 (`T`); resp.js:152-207, 408-412, 590, 656-670. server: resp-chat.js:11 (`table`), used 17-18, 39, 163, 203, 230-237 | yes | language resource (also reveals evidence vocabulary) |
| resp-clinical.json | 111,272 | c698cc23fe1faee28e02983331bb49607448daf612d475b49064e4e3ccbf0a58 | Per-condition vitals ranges, febrile flag, test ranges and reports for 22 respiratory conditions; test catalog (12) | resp.js:39 (`CL`); resp.js:226-234 (vitals), 288-342 (tests) | yes | answers (per-condition findings), evaluation inputs |
| resp-model.json | 522,631 | 10a2f7d8fdd67735fb62ff8b3f9bb6b85f45efcd6885f8b20811349160286584 | 3-layer int8 neural network over 49 DDXPlus conditions + encoder spec + evidence meta + severity | resp.js:39 (`M`); resp.js:41-57, 71-79, 109, 145, 201-207, 668, 742-744 | yes | model weights, evaluation rules (severity) |
| resp-patients.json | 260,612 | 985400524500ea1af4134761537d6f4c52a8e36f9421761b6e38b472c16afb64 | 1,296 DDXPlus test-split patient records (age, sex, true condition index, evidence tokens) | resp.js:39 (`POOL`, filtered by `plausible`, resp.js:60-63) | yes | patient script and answers (true diagnosis in `path`) |

Loading behaviour: er-cases is fetched without timeout (er.js:4661); er-act with a 4000 ms signal, er-find with 8000 ms (a failed er-find fetch is only logged, er.js:741). Resp files are fetched together via `Promise.all` and any non-OK status throws (resp.js:38-39).

## er-cases.json

Top-level shape (object, 4 keys): `tests` (array 22), `actions` (array 42), `cases` (array 6), `reviewed` (boolean, value `false`). The `reviewed` key at top level is not read by er.js (grep `D.reviewed|\.reviewed` found no top-level read; matches in er.js not examined further: not determined).

Counts: tests 22, actions 42, cases 6 (`asthma`, `sepsis`, `pe`, `stemi`, `dka`, `htn`), facts 104 in total (15/16/17/16/20/20), exam items 22 (3/3/3/3/4/6), care entries 152 (17/20/22/25/29/39), results entries 137 (22/22/22/22/27/22), nurse-mode orders 58 in total (8/12/9/7/10/12), `dx.accept` terms 103 (4/17/13/17/11/41), `findMap` entries 155 (15/28/34/27/22/29).

### tests[] (22 items)

| field path | type | meaning as used by code | example |
|---|---|---|---|
| id | string | test key; same key is used in `cases[].results`, `nurseMode.orders` (kind test), `companion.lines.onTest`, gates | `cxr` |
| ar, en | string | display names; en also goes into the model prompt (er-chat.js:98, 131) | `صورة صدر` |
| group | string | `img`, `bed`, `lab` | `img` |
| tat | number | turnaround in minutes (all 22 are numbers) | 8 |
| kw | string[] | Arabic/English trigger words for the order reader | `["اشعه صدر","xray","cxr"]` |
| panel | string | UI grouping: `imaging`, `heart`, `chem`, `blood`, `other` | `imaging` |

Test ids: cxr, ctpa, pocus, ecg, abg, peak_flow, glucose, cbc, crp, kft, lactate, troponin, ddimer, coag, blood_culture, viral_pcr, urine, ketones, lft, bnp, ct_head, ct_abdomen. Reads: `testOf` er.js:41; er.js:1042, 1154, 1170, 3506.

### actions[] (42 items)

| field path | type | meaning | example |
|---|---|---|---|
| id | string | action key used by `cases[].care`, `improveBy`, `companion.lines.onDone/onOrder`, nurse orders | `oxygen` |
| ar, en | string | names | `أكسجين` |
| dose | boolean | present on all 42; value true on at least the first and false on at least the second, distribution not tabulated | `true` |
| kw | string[] | trigger words | `["اكسجين","o2","nrb"]` |
| limits | array of `{unit, lo, hi}` | accepted dose range (23 actions) | `[{"unit":"L","lo":1,"hi":15}]` |
| repeat | object `{gap, again, max, up?}` | repeat-dose behaviour (12 actions); `up` optional boolean | `{"gap":3,"again":0.5,"max":4}` |
| fx | object (numeric deltas by vital name) | immediate vital effect (16 actions) | `{"spo2":5,"rr":-2,"hr":-3}` |
| suggest | object `{text, dose}` | suggested wording when the trainee asks "how much" (23 actions) | `{"text":"nasal 4 لتر ...","dose":"4 L/min"}` |
| risky | boolean | present on 20 actions (always true when present) | `true` |
| total | object `{unit, hi}` | cumulative cap; only `atropine` (`{"unit":"mg","hi":3}`) | |
| pushHarm | object `{harm, risk, label, why, challenge, effect}` | only `potassium`: IV push is harmful | |

Action ids: oxygen, sit_up, iv_access, neb_salbutamol, neb_ipratropium, steroid, magnesium, adrenaline, noradrenaline, atropine, fluids, antibiotics, paracetamol, aspirin, p2y12, nitrate, opioid, analgesia, anticoag, thrombolysis, cath_lab, sedative, call_senior, call_icu, temp, bp_repeat, shock, cpr, airway, antacid, beta_blocker, aminophylline, amiodarone, insulin, potassium, antihypertensive, diuretic, bicarbonate, antiemetic, foley, dextrose, call_surgery. Reads: `actOf` er.js:42, 863 (`perKg`), 1042, 1055, 1093. `cpr` has no `care` entry in any case.

### cases[] (6 items)

Field dictionary. "n" is the number of cases (of 6) that have the field.

| field path | type | meaning | n | example |
|---|---|---|---|---|
| id | string | case key; used as `?case=` query (er.js:4684) and by script.js assignment list (script.js:6299) | 6 | `asthma` |
| bed | string | bed label | 6 | `سرير 3` |
| dx.ar / dx.en | string | true diagnosis (shown only at the end; supervisor list shows `dx.ar`, script.js:6299; server prompt says never to say `dx.en`, er-chat.js:196) | 6 | |
| dx.accept | string[] | accepted wordings for a correct diagnosis | 6 | `["ربو","asthma"]` |
| dx.close | string[] | near-miss diagnosis ids | 3 | `["nstemi"]` |
| dispo | string | correct disposition: `icu`, `hdu`, `cath` | 6 | `icu` |
| dispoWhy | string | explanation of the disposition | 6 | |
| dispoAlso | string[] | extra accepted dispositions (er.js:3824) | 2 | `["icu"]` |
| dispoBad | string[] | dispositions scored as bad: always `["home","ward"]` (er.js:3823) | 6 | |
| collapse | object `{dispo, why, need, needWhy, dx}` | alternative ending if the patient decompensates; `need` is an action id (`thrombolysis`) | 1 (pe) | er.js:3820-3821 |
| patient.name, age, sex, arrival, opening | string/number | persona; `sex` is `F` or `M`; `opening` is the first spoken complaint | 6 | |
| patient.persona | string (English) | prompt text for the speaker model | 6 | |
| patient.addr | string[] | forms of address the patient uses | 6 | |
| companion.name, rel, start, calls, nurse | string/number | relative; `start` is a risk threshold (number) | 6 | |
| companion.persona | string (English) | prompt text | 6 | |
| companion.lines | object of arrays | `enter, ignored, alarm, worse, procedure, heard, answer, calm, info, extra, angry, jargon` all arrays; `alarm`/`extra` mix strings and objects; `info[]` are objects `{say, fact}` | 6 | |
| companion.lines.onDone / onTest / onOrder | object keyed by action id / test id / action id, values arrays | lines said after an event; keys differ per case (onDone 1-6 keys, onTest 0-3, onOrder only in dka) | partial | |
| companion.tells | object keyed by a full Arabic question sentence -> string | secret the companion reveals when the trainee asks a particular question; keys are free text | 3 | |
| nurse.name, handoff | string | handoff text | 6 | |
| risk.start, rate, watch, urgent, critical | number | risk score start, growth rate, three stage thresholds | 6 | `48, 3, 58, 72, 86` |
| risk.hold | object `{until, at, ask, line?, from?}` | risk stops growing at `at` until action `until` is done | 2 | `{"until":"antibiotics","at":58}` |
| vitals | array of `{at, hr, sbp, dbp, rr, spo2}` | vitals keyframes by minute (5 items in asthma; 32 keyframes over all cases) | 6 | |
| temp | number | body temperature | 6 | 37.1 |
| kg | number | weight for per-kg dosing (er.js:814, 863) | 4 | 80 |
| hyper | boolean | hypertensive case flag (er.js:3249) | 1 (htn) | |
| vt | boolean | ventricular tachycardia in critical stage | 1 (stemi) | |
| stageLines.watch/urgent/critical | object `{patient[], nurse, parts, rest, held?, companion?, seen?}` | scripted lines per stage; `parts[]` are tuples `[vital, threshold, text, ...]` (length 8 for some, shown as `["spo2",92,"..."]` in asthma) | 6 | er.js:199, 1764 |
| facts[] | array of `{id, q, kw[], say, red?, who?, covers?[], nurseNote?}` | history items; `q` is English description, `kw` trigger words, `say` the true answer, `red` red-flag marker (37 facts), `who` is `both` or `companion` (42 facts, otherwise absent), `covers` lists other fact ids | 6 | |
| exam[] | array of `{id, q, kw[], say, sayCritical?, sayReact?, red?}` | physical exam findings | 6 | |
| care | object keyed by action id (see next table) | per-action evaluation rules | 6 | |
| results | object keyed by test id (see next table) | per-test result and indication | 6 | |
| teach | string[] | Socratic prompts for the instructor | 6 | |
| brief | string | explanation shown in the briefing | 6 | |
| improve | string[] | patient lines when improving | 6 | |
| improveBy | object keyed by action id -> string | line when a specific action improved the patient | 4 | |
| nurseMode | object (see below) | nurse-role data | 6 | er.js:2478 |
| findMap | object keyed by er-find class id -> fact/exam id of this case | maps classifier output to case facts (er.js:1193) | 6 | `f_cough -> ...` |
| reviewed | boolean | per-case review flag, value `false` | 2 (dka, htn) | |

`care[actionId]` (152 entries): `key` (bool, 85), `by` (number minutes, 27), `slow` (number, 85), `onset` (number, 85), `spo2` (number effect, 6), `label` (string, 120), `why` (string, 126), `dose` (string, correct dose text, 37), `rb` (string, reply wording, 85), `done` (string, 84), `suggest` (`{text,dose}`, 21), `harm` (bool, 67), `risk` (number added to risk, 67), `challenge` (string, 67), `effect` (string, 55), `needFact` (string, 2), `stableHarm` (object, 17), `limits` (array, 11), `total` (object, 3), `allergyKw` (array, 1), `allergyRisk` (number), `allergyEffect`, `anaphylaxis` (bool), `allergyStem` (regex source string), `once` (bool), `fx` (object, 6), `off` (bool, 13), `after` (string), `needsTest` (object, 2), `needTest` (string test id, 2), `needLine` (3), `ivOnly`, `rateOnly` (bool), `needDone` (string action id), `invasiveHarm`, `niHarm` (objects, 1 each).

`results[testId]` (137 entries): `ind` (string; values `indicated`, `acceptable`, `no`, `harm`), `why`, `good` (strings, 137), `rows` (131 entries; each row is a 5-element string tuple `[param, value, unit, reference, flag]`, flag one of `L`, `H`, empty), `key` (string, 128), `report` (string, imaging, 51), `before` (string action id, 1) with `beforeWhy`, `whenShock` (`harm`, 3) with `shockWhy`, `by` (number minutes, 5) with `label`.

`nurseMode`: `doctor {name, sex}`, `escBy` (number in 5 cases, object `{after, plus, max}` in 1 case), `dxAfter {gate (null or string), text}`, `orders` keyed by action/test id with values `{kind: "act"|"test", when: "phone"|"stage3"|"gated"|"collapse"|"vt", show, exec, reminder?, optional?, repeat?, pick?, doctorDoes?, gate?, id?, line?, cancelSbp?, cancelLine?, cancelStage?}`. `gate` is an object `{needDone?, needTest?}`.

### Which code reads which fields

| area | reader |
|---|---|
| tests, actions catalogs | er.js:41-42 (`testOf`, `actOf`), 1042-1170, 3506-3544; er-chat.js:23-24, 95, 98, 128, 131 |
| patient, companion, nurse persona | er.js (companion/nurse speech); er-chat.js:76, 109, 161-170, 218-225 |
| facts, exam (`id`, `q`, `kw`, `say`, `who`) | er-chat.js:89-92, 122-125, 143-144, 215, 241, 354-389 |
| care, results | er.js:2172-2176, 3010, 3506-3544, 3792; er-chat.js:95, 98 (`dose`, `good`) |
| dx | er.js:3003, 3820; er-chat.js:196, 207, 269, 339; script.js:6299 |
| risk, stageLines, vitals | er.js:199, 1764-1767 |
| dispo*, collapse | er.js:3820-3824, 3905 |
| findMap | er.js:1193 |
| nurseMode | er.js:2464-2478, 4358; er-chat.js:109, 297 |
| bed, patient.name/age, patient.arrival, dx.ar | script.js:6070-6075 (`nb8CaseLabel`), 6186, 6297-6299 |

## er-act.json

Shape (object, 7 keys): `source` (string, training description), `acts` (string[10]: greeting, wish, thanks, yes, no, unsure, refuse, number, time, other), `n` (number[2] = `[2,4]`, n-gram length range), `bias` (number[10], integers, divided by 100 at load), `idf` (number[8000]), `grams` (string[8000], n-gram vocabulary), `w` (array of 8000 rows, each 10 integers divided by 100 at load: one weight per act). Parallel arrays: `idf`, `grams`, `w` have equal length (verified). No duplicate grams.

Reader: `loadAct` er.js:4660 builds `index` (gram -> position) and divides `bias` and `w` by 100. `readAct` er.js:725-735: all-digit text returns `number` without the model; otherwise counts n-grams via `actGrams` (er.js:712-723, same text normalisation as the training script named in the comment at er.js:711), weights `(1+ln count) * idf`, L2-normalises, adds `bias`, argmax. Loaded in `open()` at er.js:4682 and retried at er.js:1938, 2550.

## er-find.json

Shape (object, 9 keys): `source`, `classes` (string[122]: 121 finding ids `f_*` plus `none`, `none` is index 121), `n` (`[2,4]`), `tau` (0.3, confidence threshold), `scale` (40, weight quantisation), `bias` (number[122]), `idf` (number[5000]), `grams` (string[5000]), `w` (5000 rows of flat sparse pairs `[classIndex, weight, classIndex, weight, ...]`, row lengths even, max length 244, max class index 121). This is a different layout from er-act (sparse pairs, not a dense row). No duplicate classes or grams.

Reader: `loadFind` er.js:739-742; `readFinding` er.js:743-754 returns the winning class id or null when softmax confidence is below `tau` (`1/sum >= tau`) or the class is `none`; call site er.js:1193 looks the id up in `cases[].findMap`.

## er-lang.json

Shape (object, 4 keys): `source` (string, says "Not yet reviewed by a Jordanian linguist"), `speak` (string, a multi-line glossary "Arabic meaning: Jordanian form"), `read` (string, multi-line notes listing forms that count as greeting, yes, no, etc.), `fix` (array of 124 tuples; each tuple is an array of 2 or 3 strings: `[word, replacement]` or `[word, replacement, unless]`; all elements are strings; the third element is a regex fragment appended after the word, see er-chat.js:47; the first elements are unique).

Who reads it: only the serverless function `er-chat.js`: `lang.fix` builds regexes that rewrite model output into Jordanian wording (er-chat.js:47-48); `lang.read` is inserted into the reader prompts (er-chat.js:100, 133); `lang.speak` into the speaker prompt (er-chat.js:157). The page and the other scripts never request it (searches: `er-lang` over `*.js`, `index.html`, `*.json`, `*.mjs` in the checkout outside `data/`). The browser can still download it today because it sits under the static root.

## resp-ar.json

Shape (object, 4 keys): `source` (string, DDXPlus citation), `evidences` (object keyed by `E_<n>`, 223 entries), `values` (object keyed by `V_<n>`, 199 entries, string label), `conditions` (object keyed by English DDXPlus condition name, 49 entries, value Arabic name).

`evidences[E_n]` fields:

| field | type | count | meaning |
|---|---|---|---|
| q | string | 223 | standard-Arabic question (resp.js:168-181 `qText`) |
| q_cm, q_cf | string | 223 | question when a mother speaks about a boy / girl (age < 6, resp.js:31, 177) |
| en | string | 223 | English original, used in resp-chat prompt (resp-chat.js:236-237) |
| cat | string | 223 | category: symptom 66, pain 15, skin 10, breathing 15, other 3, history 77, risk 36, travel 1 (resp-chat.js:163 uses `cat` via `MAIN`) |
| alt | string[] | 223 | alternative phrasings for the matcher (resp.js:412) |
| kw | string[] | 223 | keywords for the matcher (resp.js:412, resp-chat.js:39) |
| yes, no | string | 223 | formal answers; `yes` may contain the placeholder `{v}` (resp.js:197 `fillValues`, resp-chat.js:163) |
| yes_f, no_f | string | 2 | feminine variants |
| yj, nj, yj_f, nj_f | string | 223 | Jordanian colloquial answers (resp.js:164-174; resp-chat.js:203) |
| cy_m, cn_m, cy_f, cn_f | string | 223 | formal answers by a mother for a boy / girl |
| cyj_m, cnj_m, cyj_f, cnj_f | string | 223 | colloquial versions of the same |

Readers: resp.js:39 (`T`), 164-181 (`line`, `qText`), 408-412 (cues), 590/670/752 (`T.conditions`), 656-659; resp-chat.js:17-18, 39, 163, 203, 230-237. `values` is read through `fillValues` (resp.js:197-207, not displayed in full by me; the `V_` label usage is confirmed by `THROAT` list of V ids at resp.js:187).

## resp-clinical.json

Shape (object, 3 keys): `source` (string: "Illustrative values written for Nabd per condition", i.e. not DDXPlus data), `catalog` (array of 12 `{id, group, ar, en}`; ids cxr, ctpa, neck_xray, cbc, crp, abg, ddimer, viral_pcr, strep, sputum, ecg, peak_flow; groups img, lab, bed), `conditions` (object keyed by English condition name, 22 entries).

`conditions[name]`: `febrile` (boolean), `vitals` (object with keys `adult`, `child`, `infant`; each `{hr, sbp, dbp, rr, spo2, temp}` where each value is a 2-element number tuple `[low, high]`), `basis` (string, guideline citations), `tests` (object keyed by catalog id; each entry has `report` (string), `summary_ar` (string), `rows` (array of objects `{param, unit, ref, lo, hi}` or `{param, text, unit, ref}`; `lo`/`hi` numbers or absent; the code branches on `x.text != null || x.lo == null`, resp.js:324)).

Readers: vitals picked by age band `infant` (<1), `child` (<12), `adult` (resp.js:226-234); tests resp.js:313-342 (values drawn between `lo` and `hi`; special cases by test id `peak_flow`, `ecg`, `abg`, `cbc`). 22 of the 49 model classes have an entry; 27 classes have none (see Integrity).

## resp-model.json

Shape (object, 7 keys): `version` (`v2-int8`), `trained_on` (string, DDXPlus train split, 1,025,602 synthetic patients), `classes` (string[49], index = class number), `encoder` (object), `layers` (array of 3), `meta` (object), `check` (object).

| field path | type | meaning |
|---|---|---|
| encoder.evidences | string[223] | evidence ids in feature order |
| encoder.groups | string[209] | group parent ids (a question and its follow-ups form a group) |
| encoder.ev_group | number[223] | evidence index -> group index (0..208) |
| encoder.value_col | object (957 keys) -> number | feature column per answer token: 208 plain `E_n` keys, 689 keys `E_n_@_V_m`, 60 keys `E_n_@_<digit>` (numeric answers) |
| encoder.asked_base, age_col, sex_col, n_features, age_scale | number | 957, 1180, 1181, 1182, 100 |
| encoder.rules | object of 5 strings | prose description of encoding (value, asked, follow_ups, age, sex), not read by code |
| layers[] | `{rows, cols, scale, q, b}` | dense layers 1182x256, 256x128, 128x49; `q` is a base64 string of int8 weights (403,456 / 43,692 / 8,364 chars), `scale` number[cols] per-output scale, `b` number[cols] bias; decoded at resp.js:41-47 |
| meta.evidences | object keyed by `E_n` (223) | `{type, group, parent, antecedent, default, values}`; `type` is `B` (208), `M` (5) or `C` (10); `default` is number 0 for B and a `V_` string for M/C; `values` string[] of `V_` ids (empty for B) |
| meta.severity | object keyed by class name (49) -> number | triage level 1..5 (resp.js:109, 744) |
| check | object `full/half/quarter` -> `{float_resp_top1, int8_resp_top1, float_dangerous_missed, int8_dangerous_missed}` | accuracy figures from training; no reader in resp.js (grep `.check`, `.version`, `trained_on` returned nothing) |

Readers: encoder resp.js:48-79, 127, 518, 620; meta resp.js:57, 145-207, 109, 744; classes resp.js:226, 590, 668-670, 742-752.

## resp-patients.json

Shape (object, 2 keys): `source` (string, DDXPlus citation, CC BY 4.0, with the note of changes) and `patients` (array of 1,296 objects `{age, sex, path, init, ev}`).

| field | type | meaning |
|---|---|---|
| age | number | 0..109 |
| sex | string | `F` or `M` |
| path | number | index into `resp-model.json classes` = the true condition (22 distinct values; per-condition counts 36 to 60) |
| init | string | initial evidence token (the chief complaint), e.g. `E_66` |
| ev | string[] | evidence tokens present for the patient; either `E_n` or `E_n_@_V_m` or `E_n_@_<digit>` |

Reader: resp.js:39 and 60-63 (`POOL = patients.filter(plausible)`); `plausible` drops patients under 12 that carry one of 14 adult-only evidence ids (resp.js:60-62).

## Relationships between files

| link | between | verified result |
|---|---|---|
| test ids | er-cases `tests[].id` <-> `cases[].results` keys, `nurseMode.orders` (kind test), `companion.lines.onTest`, `gate.needTest`, `care.*.needTest` | all resolve, except 5 result keys in `dka` (below) |
| action ids | er-cases `actions[].id` <-> `care` keys, `improveBy`, `companion.lines.onDone/onOrder`, `collapse.need`, `gate.needDone`, `care.*.needDone`, nurse orders of kind act | all resolve (checked by script; nurse order `intubate` resolves through its own `id: "airway"`) |
| finding ids | er-find `classes` (122) <-> `cases[].findMap` keys | every `findMap` key is a class of er-find (0 dangling); 61 of the 121 finding classes are used by at least one case; the 61 others are unmapped in every case |
| findMap values | `findMap` values -> `facts[].id` or `exam[].id` of the same case | all 6 cases: 0 values without a target |
| act labels | er-act `acts` <-> er.js | used by name in er.js (`readAct` returns the label; `number` is produced by regex, not the model) |
| evidence ids | resp-model `encoder.evidences` (223) <-> resp-ar `evidences` keys (223) <-> resp-model `meta.evidences` (223) | identical sets (0 missing in either direction) |
| patient tokens | resp-patients `init`, `ev` <-> resp-model `encoder.value_col` and resp-ar | 249 distinct tokens; every token's evidence id is in resp-ar and in `encoder.evidences`; every token containing `_@_` is a key of `value_col` (0 missing) |
| value ids | `V_` ids in `value_col` keys <-> resp-ar `values` | all present (0 missing) |
| class names | resp-model `classes` (49) <-> resp-ar `conditions` (49) <-> `meta.severity` (49) | identical sets |
| class names | resp-clinical `conditions` (22) <-> resp-model `classes` | all 22 are classes; 27 classes have no clinical entry |
| patient classes | resp-patients `path` (22 distinct) -> `classes[path]` | covers 22 classes; the clinical file also has 22 conditions (equality of the two sets not checked) |
| test catalog | resp-clinical `conditions[].tests` keys <-> `catalog[].id` | all in the catalog |
| ER vs respiratory test ids | er-cases tests (cxr, ctpa, ecg, abg, peak_flow, cbc, crp, ddimer, viral_pcr) and resp-clinical catalog share names | same id strings in separate namespaces; no code joins them |

## What a student could learn from each file if it is downloadable

All eight files are downloadable today by anyone who requests `/data/<file>` (served 200, no auth).

| file | learnable content |
|---|---|
| er-cases.json | Everything about each case: true diagnosis in `dx.ar`/`dx.en` and all accepted answers `dx.accept`; the correct disposition `dispo` and wrong ones `dispoBad`; for each action whether it is `key`, its deadline `by` and `label` (for example "أكسجين خلال أول 3 دقائق"), the correct dose text in `care[].dose` (for example "Hydrocortisone 100 mg IV كل 6 ساعات"), which actions are harmful (`harm`) and how much risk they add (`risk`); the allergy trap (`allergyStem`); for each test whether it is `indicated`, `acceptable`, `no` or `harm` (`results[].ind`) with the reason `why` and the key interpretation `key`; the full result values `rows`; which history facts are red flags (`red`); what the companion hides (`companion.tells`); the risk thresholds and stage timing (`risk`, `vitals`); the nurse-mode orders with exact doses (`nurseMode.orders[].show/exec`) and the briefing text `brief` and teaching questions `teach`. Scoring is therefore fully recoverable. |
| er-act.json | Classifier weights for 10 dialogue acts; no clinical answers. The source line says "Not a medical model". Practical risk: reproduction of the classifier only. |
| er-find.json | Classifier weights from history questions to finding ids; the class names reveal the findings vocabulary (121 ids) but not case content. |
| er-lang.json | Jordanian glossary and 124 correction pairs; no clinical content. |
| resp-ar.json | Wording of all 223 questions and answers, and the Arabic names of the 49 conditions (the list of possible diagnoses shown anyway in the diagnosis picker, resp.js:668-670). |
| resp-clinical.json | Per condition (22): febrile flag, vital ranges by age band, test result ranges and imaging reports with Arabic summaries (`summary_ar`) and guideline basis. A student can derive each condition's typical vitals and lab picture. |
| resp-model.json | The full trained network (int8 weights, bias, scales), the encoder, and per-condition severity (`meta.severity`, 1..5). A student can run the network offline on any evidence set (the in-room probability bars are computed from it, resp.js:590). `check` discloses accuracy figures. |
| resp-patients.json | Every candidate patient with the true condition index `path` and the exact evidence list; combined with `classes` this gives the correct diagnosis of each of 1,296 records. |

## Integrity notes

Verified with node scripts against the checkout files:

| check | result |
|---|---|
| JSON validity | all 8 parse |
| duplicate ids | no duplicate test ids, action ids or case ids; no duplicate classes or grams in er-find / er-act; no duplicate keys among the 124 `fix` words in er-lang |
| parallel arrays | er-act: `idf`, `grams`, `w` all length 8000; er-find: all length 5000; `w` rows in er-find have even length |
| dangling reference: `dka` results | `cases[dka].results` has 27 keys, 5 of which are not in `tests[]`: `lipase`, `osmolality`, `magnesium_level`, `phosphate`, `hba1c`. Readers of results that look the test up first (`testOf(id)`) skip them (er.js:1680 filters on `testOf(id)`); other readers that use `E.c.results[id]` or `Object.keys(E.c.results)` without the filter were not all traced (not determined) |
| id collision in `htn` | the id `neuro` exists both in `facts` and in `exam` of case `htn` (dupFactIds 1); other cases have none. `findMap` values refer to ids without saying which array |
| action without data | `cpr` is in `actions` but has no `care` entry in any of the 6 cases |
| unused finding classes | 61 of 121 er-find finding classes have no `findMap` entry in any case (they can never be resolved to a fact) |
| `reviewed` flag | top-level `false`; per-case `reviewed:false` on `dka` and `htn` only; other four cases have no such field |
| resp-clinical coverage | 22 of 49 classes have clinical data; the 27 others have none |
| resp-patients vs value tokens | in a first check, 47 tokens like `E_56_@_7` looked dangling against `V_` ids; that was my wrong test: numeric answers are keys `E_n_@_<digit>` in `value_col`, and a full check found 0 tokens missing from `value_col` |
| unread fields | `encoder.rules` (prose), `resp-model.json check/version/trained_on`, and top-level `er-cases.reviewed` have no reader found |
| copies | the serverless functions import their own copies of er-cases, er-lang and resp-ar; not diffed against the checkout (not determined) |

## Notes for typed access from C#

| item | detail |
|---|---|
| Maps keyed by id | `care` (action id), `results` (test id), `nurseMode.orders` (id), `findMap` (finding id -> fact id), `companion.lines.onDone/onTest/onOrder`, `companion.tells` (key is a full Arabic sentence), `improveBy`, `resp-ar.evidences/values/conditions`, `resp-model.encoder.value_col`, `meta.evidences`, `meta.severity`, `resp-clinical.conditions` (key has spaces and slashes, for example `Acute COPD exacerbation / infection`). Use `Dictionary<string, T>`; keep key order if iteration order matters (JS preserves insertion order and some code relies on `Object.keys`). |
| Mixed types | `nurseMode.escBy` is a number in 5 cases and an object `{after, plus, max}` in 1. `companion.lines.alarm` and `extra` mix strings and objects. `stageLines.*.parts[]` are tuples with mixed element types (name, number, string...). `nurseMode.dxAfter.gate` is null or string. `meta.evidences[].default` is number 0 or a `V_` string. `resp-clinical` test rows are either `{lo,hi}` or `{text}`. |
| Tuples as arrays | `results[].rows[]` in er-cases are 5 string tuples `[param, value, unit, ref, flag]` (flag `""`, `"L"`, `"H"`); `er-lang.fix[]` tuples of 2 or 3 strings; `stageLines.*.parts[]`; `resp-clinical vitals` ranges `[lo, hi]`; `er-find.w[]` flat sparse pairs `[classIndex, weight, ...]` (variable length); `layers[].q` base64 int8 |
| Optional fields | most of `care[]` (see counts), `actions[].limits/repeat/fx/suggest/risky/total/pushHarm`, `facts[].red/who/covers/nurseNote`, `exam[].sayCritical/sayReact`, case-level `kg/hyper/vt/collapse/dispoAlso/improveBy/reviewed`, `risk.hold`. Model as nullable. |
| Quantised numbers | er-act `bias`, `w` are integers to divide by 100; er-find `w` weights are integers to divide by `scale` (40). The browser applies these at load, so a C# port must repeat the divisions (er.js:4660, 750). |
| Regexes as data | `care[].allergyStem` and `er-lang.fix` third element are regex source text built into `RegExp`; the JS flags `gu`, lookbehind and `\p{L}` are used (er-chat.js:47). .NET needs equivalent options. |
| Mixed language fields | English `persona`/`q` strings are prompt text; Arabic strings are UI text; keep UTF-8. |
| Booleans typed as flags | `dose` on all 42 actions is boolean; `reviewed` boolean at two levels. |
| Size | resp-model and the two ER classifiers are 0.4 to 0.7 MB each; arrays of 5,000 to 8,000 rows. |

## Open questions

1. Are the Desktop copies of er-cases.json, er-lang.json and resp-ar.json (read by the serverless functions) byte-identical to the checkout copies? Not diffed.
2. Does anything fail when the `dka` result keys without a test entry (`lipase`, `osmolality`, `magnesium_level`, `phosphate`, `hba1c`) are reached? Only one filtered reader (er.js:1680) was traced.
3. Is the `neuro` id collision in case `htn` (facts and exam) harmless? `findMap` and the order reader may resolve it to either array; not traced.
4. Is the top-level `reviewed` flag in er-cases.json, and `check`/`version`/`trained_on` in resp-model.json, consumed by any tool outside the page (training or release scripts)? No reader found in the checkout.
5. Is the equality between the 22 conditions of resp-clinical and the 22 `path` values in resp-patients exact? Counts match; set equality not checked.
6. Should the 61 unmapped finding classes in er-find have `findMap` entries, or are they intentionally unreachable for these 6 cases? Not determined.
