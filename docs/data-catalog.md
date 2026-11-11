# Data catalog

This document lists every piece of data the Nabd system holds: where it lives now, what reads it, and what it would
reveal to a trainee who downloaded it. It describes the branch `refactor/clean-architecture`.

Three facts frame everything below.

- The clinical content of the cases was written for training and **has not been reviewed by a physician**. The data
  says so itself (see [Rules for this data](#rules-for-this-data)). The system does not diagnose or treat real patients.
- The rooms in the browser still run the legacy client. They download their data files and their embedded data
  today. The server-side model and use cases read only one file (`er-cases.json`) and the browser does not call them
  yet. Exposure of the legacy rooms' data is **unchanged in this phase** ([decision 0005](decisions/0005-legacy-data-behind-repositories.md)).
- There is no database, no server-side account and no authentication ([decision 0008](decisions/0008-no-database-and-no-authentication-in-this-phase.md)).
  Accounts and progress live only in the visitor's browser.

Sources: `docs/legacy-audit/30-data-files.md` (files), parts 01, 02, 03, 04, 06 and 34 of the audit (embedded data and
browser storage), `tests/Nabd.Tests/LegacyBaseline/legacy-manifest.json` (hashes), and the code under
`src/Nabd.Infrastructure/LegacyData`, `src/Nabd.Domain/Cases` and `src/Nabd.Web/ClientScripts`. Where a source did not
settle a point, the text says "not determined".

## Summary table

"Served to the browser today" means a visitor can obtain the bytes with a plain HTTP request. "Answers or scoring
rules" means the data tells a trainee what the correct diagnosis, action, test or score is.

| Data set | Lives in | Bytes | Read by (browser client / server) | Served to the browser today? | Contains answers or scoring rules? |
|---|---|---|---|---|---|
| `er-cases.json` | `src/Nabd.Infrastructure/LegacyData/Files/` | 259,214 | Browser: ER room (`er.js`), academic portal (`script.js`). Server: `ErCaseFileMapper` (part of the fields) and the external function `er-chat` (its own copy) | Yes, whole file, at `/data/er-cases.json` | Yes |
| `er-act.json` | same | 410,682 | Browser: ER room offline reader. Server: none | Yes | No (classifier weights) |
| `er-find.json` | same | 737,985 | Browser: ER room offline reader. Server: none | Yes | No (classifier weights; finding vocabulary) |
| `er-lang.json` | same | 7,983 | Browser: nothing requests it. External function `er-chat`: its own copy. Server: none | Yes (served, never requested by the page) | No |
| `resp-ar.json` | same | 360,470 | Browser: respiratory room. External function `resp-chat`: its own copy. Server: none | Yes | No (wording; reveals the evidence vocabulary) |
| `resp-clinical.json` | same | 111,272 | Browser: respiratory room. Server: none | Yes | Yes (per-condition findings) |
| `resp-model.json` | same | 522,631 | Browser: respiratory room. Server: none | Yes | Yes (network weights, severity levels) |
| `resp-patients.json` | same | 260,612 | Browser: respiratory room. Server: none | Yes | Yes (true condition of every patient record) |
| Embedded in `script.js`: case card images, diagnostic images | `ClientScripts/script/010`, `020` | 147,690 and 15,734 | Browser | Yes, inside `/js/script.js` | No |
| Embedded: departments, general workup catalog, `CASES_DB` (7 cases), workup overrides | `script/030`, `040`, `050` | 14,441; 35,916; 19,657 | Browser | Yes, inside `/js/script.js` | Yes (expected workups, ideal summaries) |
| Embedded: coach topics | `script/060` | 12,120 | Browser | Yes | Yes (scoring keywords, model answers) |
| Embedded: demo accounts | `script/070` | 14,131 | Browser | Yes | No |
| Embedded: professor cohort default data | `script/080` | 37,196 | Browser | Yes | No (demo attempt records) |
| Embedded: level-quiz banks | `script/160` | 16,076 | Browser | Yes | Yes (correct option indexes) |
| Embedded: expert demonstrations, nursing cases, nursing image catalogue | `script/330`, `350`, `360` | 41,287; 114,142; 9,290 | Browser | Yes | Yes (answer keys, per part 06) |
| Image files | `src/Nabd.Web/wwwroot/img` | about 6.9 MB on disk (60 files: 59 images, per `Every_legacy_image_is_served_unchanged`, and `CREDITS.txt`) | Browser | Yes, as static files | No |
| Browser storage (accounts, progress, notes, assignments) | The visitor's browser | not applicable | Browser | Not applicable (never reaches the server) | No |
| Server session store | Memory of the server process | not applicable | Server (session API, off by default) | Only the fields of `SessionSnapshot` and `SessionReport` | The answers stay on the server until the report |

Byte counts for the files are from `legacy-manifest.json`. Byte counts for the embedded data are the sizes of the
fragment files (`wc -c`). The image folder size is from `du` on the working copy.

## JSON files in `src/Nabd.Infrastructure/LegacyData/Files`

The eight files are the legacy files byte for byte. Git is told not to convert their line endings, and the test
`Each_data_document_is_the_legacy_file_byte_for_byte` (`LegacySiteBaselineTests.cs`) compares each served document with
the manifest size and SHA-256. `LegacyDataFiles.KnownNames` lists them; no other name can be read or served
(`Only_the_shipped_data_files_can_be_read`, `Data_that_the_application_does_not_name_cannot_be_asked_for`).

Reader line numbers below are those of the legacy `er.js`, `resp.js` and `script.js` as cited in the audit
(`docs/legacy-audit/30-data-files.md`).

### er-cases.json

- **Purpose.** The six emergency cases of the ER room (`asthma`, `sepsis`, `pe`, `stemi`, `dka`, `htn`) and the catalogs
  of 22 tests and 42 actions they share. It holds the patient script, the relative's and nurse's lines, the vital-sign
  timeline, the history facts, the examination findings, the per-case evaluation rules, the test results and the
  nurse-role orders.
- **Manifest** (`data/er-cases.json`): 259,214 bytes; SHA-256 `4c76ccf2fb6c478deb17db926e0bb3339941fd13b7f186bdd2aac38323739865`.

| Top-level field | Type | Content |
|---|---|---|
| `tests` | array of 22 | `id`, `ar`, `en`, `group`, `tat`, `kw`, `panel` |
| `actions` | array of 42 | `id`, `ar`, `en`, `dose`, `kw`, and optional `limits`, `repeat`, `fx`, `suggest`, `risky`, `total`, `pushHarm` |
| `cases` | array of 6 | One object per case (fields below) |
| `reviewed` | boolean | `false` |

Main fields of a case (audit part 30): `id`, `bed`, `dx` (true diagnosis and accepted wordings), `dispo` (correct
disposition), `dispoBad`, `collapse` (one case), `patient`, `companion`, `nurse`, `risk` (start, rate and three stage
thresholds), `vitals` (keyframes), `temp`, `kg`, `stageLines`, `facts`, `exam`, `care` (per-action evaluation rules),
`results` (per-test result and indication), `teach`, `brief`, `improve`, `nurseMode`, `findMap`.

- **Counts** (audit part 30): 6 cases; 22 tests; 42 actions; 104 facts in total; 22 examination items; 152 `care`
  entries; 137 `results` entries; 58 nurse-mode orders; 103 accepted diagnosis terms; 155 `findMap` entries. Recomputed
  from the file: all match.
- **Read by the browser.** `er.js` loads the whole file into `D` (audit: `er.js:4661`). The academic portal in
  `script.js` fetches it too, to list cases for assignment (`script/770-academic-foundation.js`, `fetch('data/er-cases.json')`).
- **Read by the server.** Yes, in part, through `ErCaseFileMapper` (see the next section). The mapper reads about a dozen
  groups of fields. The conversation, teaching and nurse-mode fields are **not mapped**. The external function
  `er-chat` imports its own copy of the file (audit part 30; whether that copy is identical was not diffed: not determined).
- **What a trainee could learn from it if downloaded.** Everything about each case: the true diagnosis and every
  accepted wording; the correct disposition and the wrong ones; for each action whether it is a key step, its deadline,
  its correct dose text, whether it is harmful and how much risk it adds; the allergy trap; for each test whether it is
  indicated, acceptable, not indicated or harmful, with the reason and the key interpretation; the full result values;
  which history items are red flags; what the relative hides; the risk thresholds and stage timing; the nurse-mode
  orders with doses.
- **Integrity notes** (audit part 30, kept as they are). In case `dka`, 5 result keys have no entry in `tests`
  (`lipase`, `osmolality`, `magnesium_level`, `phosphate`, `hba1c`). In case `htn` the id `neuro` exists in both
  `facts` and `exam`. The action `cpr` has no `care` entry in any case. 60 of the 121 finding classes in `er-find.json`
  have no `findMap` entry in any case (recomputed from the two files; audit part 30 writes 61). The `reviewed` flag is `false` at top level and also on `dka` and `htn`; the other
  four cases carry no per-case flag. Repairing any of this is a clinical-content change and was not done
  ([decision 0005](decisions/0005-legacy-data-behind-repositories.md)).

### er-act.json

- **Purpose.** A linear text classifier with 10 dialogue acts (greeting, wish, thanks, yes, no, unsure, refuse, number,
  time, other). The ER room uses it for short replies when the server cannot be reached.
- **Manifest** (`data/er-act.json`): 410,682 bytes; SHA-256 `5891145b9b5b39c80ffc339f5fa09d29576a1257771d01d79fc5025152f3ce66`.

| Field | Type | Content |
|---|---|---|
| `source` | string | Training note: "Not a medical model" |
| `acts` | string[10] | Act labels |
| `n` | number[2] | N-gram length range |
| `bias`, `idf`, `grams`, `w` | arrays | Bias (10), idf (8000), n-gram vocabulary (8000), weights (8000 rows of 10) |

- **Read by the browser.** `loadAct` and `readAct` in `er.js` (audit: `er.js:4660`, `725-735`). **Server:** none.
- **What a trainee could learn.** Classifier weights only; no clinical answers. A trainee could reproduce the classifier.
- **Integrity.** The three parallel arrays have equal length (audit).

### er-find.json

- **Purpose.** A linear classifier from a history question to one of 122 classes (121 finding ids plus `none`). The ER
  room uses it offline to decide which history item a question asks about.
- **Manifest** (`data/er-find.json`): 737,985 bytes; SHA-256 `eb4fedc9e3f1e4d234c66b2fd126e5bd1d0c9bcb191f1b8383f2552c6ada9367`.

| Field | Type | Content |
|---|---|---|
| `source`, `n`, `tau`, `scale` | string, number[2], 0.3, 40 | Training note, n-gram range, confidence threshold, weight quantisation |
| `classes` | string[122] | Finding ids and `none` |
| `bias`, `idf`, `grams`, `w` | arrays | Bias (122), idf and grams (5000 each), sparse weight rows |

- **Read by the browser.** `loadFind`, `readFinding` in `er.js` (audit: `er.js:739-754`); the id is then looked up in a
  case's `findMap` (`er.js:1193`). **Server:** none.
- **What a trainee could learn.** The vocabulary of 121 finding ids. It names findings in general; it holds no case content.

### er-lang.json

- **Purpose.** Jordanian Arabic notes (two prompt texts) and 124 correction pairs. Only the external function `er-chat`
  uses it, to rewrite the model's wording and to build its prompts.
- **Manifest** (`data/er-lang.json`): 7,983 bytes; SHA-256 `dc03422a26eea76ff0686f0f9f4b8c9e5e85a73954bcb581445d4fbbfb32da1b`.
- **Shape.** `source` (string), `speak` and `read` (multi-line strings), `fix` (124 tuples of 2 or 3 strings).
- **Read by the browser.** Nothing. The audit searched the legacy scripts and the page and found no request for it. It is
  still served. **Server:** the Nabd application does not read it; the external function does, from its own copy.
- **What a trainee could learn.** A language glossary. No clinical content.
- **Integrity.** The file's own `source` line says it is "Not yet reviewed by a Jordanian linguist".

### resp-ar.json

- **Purpose.** Arabic wording for the respiratory room: question and answer text for 223 evidences, 199 value labels and
  49 condition names.
- **Manifest** (`data/resp-ar.json`): 360,470 bytes; SHA-256 `972abb1fab81b448b2327229383f3affbd567055022958c1266f858ef5727ed5`.

| Field | Type | Content |
|---|---|---|
| `source` | string | DDXPlus citation, licence and changes (see Rules) |
| `evidences` | object, 223 keys `E_<n>` | Questions (`q` and variants for a mother speaking), English text, category, keywords, formal and Jordanian answers |
| `values` | object, 199 keys `V_<n>` | Value labels |
| `conditions` | object, 49 keys | English condition name to Arabic name |

- **Read by the browser.** `resp.js` (audit: `resp.js:39`, `152-207`, `408-412`, `590`, `656-670`). **Server:** none; the
  external function `resp-chat` reads its own copy.
- **What a trainee could learn.** The wording of every question and answer and the names of the 49 conditions. The
  respiratory room already shows the condition list in its diagnosis picker (audit).
- **Integrity.** Evidence ids match `resp-model.json` and `resp-patients.json` exactly (audit relationship table).

### resp-clinical.json

- **Purpose.** Per-condition vital-sign ranges, a febrile flag and test results with imaging reports for 22 respiratory
  conditions, plus a catalog of 12 tests.
- **Manifest** (`data/resp-clinical.json`): 111,272 bytes; SHA-256 `c698cc23fe1faee28e02983331bb49607448daf612d475b49064e4e3ccbf0a58`.
- **Shape.** `source` (string), `catalog` (12 entries: `id`, `group`, `ar`, `en`), `conditions` (22 entries keyed by
  English condition name: `febrile`, `vitals` by age band, `basis`, `tests`).
- **Read by the browser.** `resp.js` (audit: `resp.js:226-234`, `288-342`). **Server:** none.
- **What a trainee could learn.** For each of 22 conditions, the typical vital signs, laboratory picture and imaging
  reports. A trainee can derive each condition's findings.
- **Integrity.** 22 of the 49 model classes have an entry; 27 have none. The file's own `source` says the values are
  illustrative, written for Nabd, drafted and reviewed by AI, and not yet reviewed by a clinician.

### resp-model.json

- **Purpose.** A three-layer int8 neural network over 49 DDXPlus conditions, the encoder specification, evidence
  metadata and a severity level (1 to 5) per condition. The respiratory room computes its probability bars from it.
- **Manifest** (`data/resp-model.json`): 522,631 bytes; SHA-256 `10a2f7d8fdd67735fb62ff8b3f9bb6b85f45efcd6885f8b20811349160286584`.
- **Shape.** `version` (`v2-int8`), `trained_on` (DDXPlus train split, 1,025,602 synthetic patients), `classes` (49),
  `encoder`, `layers` (3, base64 int8 weights), `meta` (including `severity`), `check` (accuracy figures from training).
- **Read by the browser.** `resp.js` (audit: `resp.js:41-79`, `109`, `145-207`, `590`, `668`, `742-744`). **Server:** none;
  the model is not executed on the server in this phase.
- **What a trainee could learn.** The full network, so the model can be run offline on any evidence set, and the severity
  level of each condition. The `check` object states accuracy figures; no reader was found for it.

### resp-patients.json

- **Purpose.** 1,296 patient records from the DDXPlus test split. The respiratory room draws its simulated patients from them.
- **Manifest** (`data/resp-patients.json`): 260,612 bytes; SHA-256 `985400524500ea1af4134761537d6f4c52a8e36f9421761b6e38b472c16afb64`.
- **Shape.** `source` (string) and `patients`, each `{age, sex, path, init, ev}`: age, sex, the index of the true condition
  (`path`), the chief complaint token and the evidence tokens.
- **Read by the browser.** `resp.js` (audit: `resp.js:39`, `60-63`). **Server:** none.
- **What a trainee could learn.** The true condition and exact evidence list of each of 1,296 records.
- **Integrity.** 22 distinct conditions occur (36 to 60 records each). All 249 distinct evidence tokens resolve in the
  model encoder and in `resp-ar.json`. The 22 conditions are the 22 that have an entry in `resp-clinical.json` (recomputed from the files).

## How the server reads cases

The path, from the file to the domain:

```
LegacyDataFiles.ReadAsync("er-cases")          the only code that opens the files, by known name
   -> ErCaseFileMapper.Map(bytes)              JSON -> ErCaseFile (Catalog, Cases, Reviewed)
   -> JsonClinicalCaseRepository               reads and maps once, on first use; keeps the result
   -> IClinicalCaseRepository                  the port in Nabd.Application.Abstractions.Data
   -> ClinicalCatalog and ClinicalCase         immutable domain objects (Nabd.Domain)
```

`IClinicalCaseRepository` offers `GetCatalogAsync`, `ListCaseIdsAsync`, `FindAsync(caseId)` and
`IsClinicallyReviewedAsync`. The mapper keeps the order of the entries in the file (the cases, and each case's care
steps and results), because the scoring rules walk a case's entries in that order. The `ClinicalCase` constructor refuses a case without an id or with fewer than two
vital-sign anchors, or with anchors that do not rise in risk (`DomainException`). The mapper throws
`InvalidDataException` for an unknown test indication.

A second reader exists, but it does not interpret the data: `FileClientDataDocumentSource` reads each of the eight files
as opaque bytes, keeps them in memory and serves them with a SHA-256 based entity tag through `ClientDataController`
(`GET /data/{name}.json`).

### Field mapping (checked in `ErCaseFileMapper.cs`)

| JSON field | Domain member |
|---|---|
| `actions[].id`, `ar`, `en` | `InterventionDefinition.Id`, `ArabicName`, `EnglishName` |
| `actions[].dose` (true) | `InterventionDefinition.RequiresDose` |
| `actions[].repeat` `{gap, again, max, up}` | `RepeatRule(GapMinutes, AgainShare, Maximum, OnlyMoreAdds)` |
| `actions[].fx` `{spo2, hr, rr, sbp, dbp, ramp}` | `VitalEffect` (also used for `care[].fx`) |
| `tests[].id`, `ar`, `en` | `TestDefinition(Id, ArabicName, EnglishName)` |
| `cases[].id` | `ClinicalCase.Id` |
| `cases[].risk` `{start, rate, watch, urgent, critical}` | `RiskProfile(Start, RatePerMinute, Watch, Urgent, Critical)` |
| `cases[].risk.hold` `{until, at}` | `RiskHold(UntilActionId, AtRisk)` |
| `cases[].vitals[]` `{at, hr, sbp, dbp, rr, spo2}` | `VitalAnchor(AtRisk, VitalSigns)`, in file order |
| `cases[].temp` | `ClinicalCase.Temperature` |
| `cases[].kg` | `ClinicalCase.WeightKg` (nullable) |
| `cases[].vt` | `ClinicalCase.VentricularTachycardiaWhenCritical` |
| `cases[].care.<actionId>` `{key, by, slow, onset, spo2, fx}` | `CareStep(ActionId, IsKey, DueByMinute, RiskSlowing, OnsetMinutes, OxygenSaturationGain, Effect)` |
| `cases[].results.<testId>` `{ind, whenShock, by, before}` | `TestExpectation(TestId, Indication, WhenShocked, DueByMinute, BeforeActionId)` |
| `results[].ind` values `indicated`, `acceptable`, `no`, `harm` | `TestIndication.Indicated`, `Acceptable`, `NotIndicated`, `Harmful` (a missing `ind` becomes `NotIndicated`) |
| `cases[].stageLines.watch`, `urgent`, `critical` | `StageCue(NamesMeasuredSigns)`: true when the stage has a `parts` array. The text is not read |
| `cases[].facts[]` `{id, red}` | `ClinicalFinding(Id, IsExamination: false, IsRedFlag)` |
| `cases[].exam[]` `{id, red}` | `ClinicalFinding(Id, IsExamination: true, IsRedFlag)` |
| `cases[].dispo`, `dispoAlso`, `dispoBad` | `DispositionRule(Right, AlsoAcceptable, Dangerous)` |
| `cases[].collapse` `{need, dispo}` | `CollapseRule(RescueActionId, Destination)` |
| top-level `reviewed` (true only if the JSON value is `true`) | `ErCaseFile.Reviewed`, exposed by `IsClinicallyReviewedAsync` |

### Fields deliberately not mapped

The mapper's summary says the conversation fields stay with the legacy client. By inspection of the mapper, these
fields exist in the file and are not read on the server:

| Group | Fields not mapped |
|---|---|
| Action catalog | `kw`, `limits`, `suggest`, `risky`, `total`, `pushHarm` |
| Test catalog | `group`, `tat`, `kw`, `panel` |
| Case identity and truth | `bed`, `dx` (diagnosis and accepted wordings), `dispoWhy`, `collapse.why`, `collapse.needWhy`, `collapse.dx`, `hyper`, per-case `reviewed` |
| People | `patient`, `companion` (lines, tells, persona), `nurse` |
| Stage text | the text of `stageLines` (only the presence of `parts` is read) |
| History and examination | `facts` and `exam` fields other than `id` and `red` (question, keywords, answer, `who`, `covers`, `nurseNote`, `sayCritical`, `sayReact`) |
| Care rules | `care` fields other than `key`, `by`, `slow`, `onset`, `spo2`, `fx` (for example `label`, `why`, `dose`, `harm`, `risk`, `challenge`, the allergy fields, the gating fields) |
| Result detail | `results` fields other than `ind`, `whenShock`, `by`, `before` (for example `why`, `good`, `rows`, `key`, `report`) |
| Teaching and nurse role | `teach`, `brief`, `improve`, `improveBy`, `nurseMode`, `findMap` |

The harm and allergy judgement is therefore **not** on the server; the session API takes it as an input (decision 0007).

## Data embedded in the client scripts

The browser receives `/js/script.js` as the joined fragments under `src/Nabd.Web/ClientScripts/script/`. Everything
embedded in them is downloaded by every visitor who loads the page. "Reachable" describes whether the user interface
reaches the data today (audit parts 01, 02, 03, 06 and 34).

| Data | Fragment | What it contains | Reachable today? |
|---|---|---|---|
| `CASE_IMAGES` | `010-case-card-images.js` (147,690 bytes) | 3 embedded JPEG images (`img0` to `img2`) used on case cards; audit part 01 says three cases reuse `img1` | Not determined for display; the case cards that use them belong to the closed simulation view |
| `DIAG_IMAGES` | `020-diagnostic-images.js` (15,734) | 6 diagnostic images (`ecg_stemi`, `ecg_normal`, `xray_ankle`, `xray_chest`, `ct_chest`, `ultrasound`); 4 inline SVG and 2 file paths per the split plan | Closed simulation view only |
| `DEPARTMENTS`, `GENERAL_WORKUP_CATALOG` | `030-department-and-workup-catalog.js` (14,441) | 8 departments; 13 tests with default results | Closed simulation view only |
| `CASES_DB` | `040-clinical-cases-catalog.js` (35,916) | 7 doctor-track cases: patient, initial vitals, questions with reasons, `expectedWorkupIds`, `idealSummary`, `idealHandover` | Closed simulation view only; read by the level and room pickers where noted in part 01 |
| Workup overrides | `050-case-workup-overrides-patch.js` (19,657) | Load-time replacement of `workupOverrides` (and three `expectedWorkupIds`) for six of the seven cases, with raw lab slips | Same as `CASES_DB` |
| `COACH_MODULES_DEFAULT` | `060-coach-modules-default.js` (12,120) | 4 coach topics with explanation steps, scoring keywords and a model answer | Coach view is closed; the profile dashboard shows the four topic titles |
| `DEMO_ACCOUNTS` | `070-demo-accounts.js` (14,131) | 5 demo accounts (4 learners, 1 professor): name, role, statistics, strengths, weaknesses, session history. No password fields are listed in audit part 02 | Live. Three have buttons on the sign-in page; two (`ahmed_y1`, `practitioner`) have no button |
| `PROFESSOR_COHORT_DEFAULT` | `080-professor-cohort-default-data.js` (37,196) | 7 demo student attempt records. Fallback for the professor's cohort tables | Live, in the professor portal |
| Level-quiz data | `160-level-quiz-data.js` (16,076) | Hints, levels, tips, two question banks by track (`NB_QUIZ_BY_TRACK`) with correct option indexes; `NB_QBANK` (6 entries) is unreferenced per part 04 | Quiz is hidden but reachable from the profile page (part 34) |
| `NB_DEMOS` | `330-expert-demos-data.js` (41,287) | 11 expert demonstrations (count per the audit; not recounted) | Observe view is closed |
| `NB_NURSE_CASES` and helpers | `340`, `350-nursing-cases-data.js` (114,142) | 13 nursing cases (1 guided, 9 ward or ED, 3 operating-room) with answer keys; contains functions, so it cannot be serialised to JSON (part 06) | The nurse room cannot be opened (`nurseStart` returns at once, `#home-nurse` is hidden); the data is still read by the level and room pickers |
| `NB_IMG` | `360-nursing-image-catalogue.js` (9,290) | Nursing image catalogue | Same as nursing cases |

Counts for `CASES_DB` (7 cases, 20 questions) come from loading the fragments with a throwaway Node script. Audit part 01
mentions 22 questions; the difference is not determined.

The ER room's own text (offline fixed lines, keyword and phrase tables, unit tables) is code in `er.js`, not data
files; the fragment READMEs under `ClientScripts/er/` label those fragments `domain`. Their contents were not inventoried
for this document: not determined.

## Data kept in the browser

All of it sits in the visitor's browser. Writes go through `safeStorageSet` (`script/100-local-storage-store.js`), which
writes each key to `localStorage` and also mirrors the whole store into `window.name` as `__NABD_STORE__:` plus JSON, as
a fallback. Reads try `localStorage` first, then `window.name`. The server never sees any of it. **There is no
server-side store of accounts or progress.**

| Key | Store | Shape (in a phrase) | Written by | Personal data? |
|---|---|---|---|---|
| `nabd_v2_accounts_map` | localStorage, mirrored | Map of account id to whole account: name, email, university, role, year, specialty, salt, PBKDF2-SHA-256 hash (120,000 iterations), cohort, statistics, history | Registration (`830`), `saveAccountToStorage` (also from `er/580-run-save.js` and `resp/180-finish.js`) | Yes: name, email, university, results, password hash |
| `nabd_v2_active_user_id` | localStorage, mirrored | Id of the signed-in account | Sign-in; removed at sign-out | Indirect (an account id built from the email) |
| `nabd_v2_custom_cases` | localStorage, mirrored | Map of case id to a professor-made case without its image | Professor case creation (`760`) | Not determined |
| `nabd_v2_scratchpads` | localStorage, mirrored | Map of `userId__caseId` to the trainee's notes | Session utilities (`120`) | Free text; not determined |
| `nabd_v2_active_sim_meta` | localStorage, mirrored | `{caseId, isEmergencyMode, view}` of the old simulation | `550-sim-session-start.js`; removed at sign-out | No |
| `nabd_v2_prof_cohort` | localStorage, mirrored | Professor's cohort records (shape as the seed in `080`) | `saveProfCohortList` (`690`), called from `830` | Yes: student names, attempts and grades (demo data in practice) |
| `nabd_v2_assignments` | localStorage, mirrored | Array of `{id, caseId, section, due, note, by, ts}` | Academic portal (`nb8SaveAssignments`) | Not determined |
| `nabd_v2_advisor` | localStorage, mirrored | Object; shape not determined | Academic portal | Not determined |
| `nabd_v2_coach_mastered` | localStorage, mirrored | Mastered coach topics | Coach store (`710`) | No |
| `nabd_coach_api_v1` | localStorage, mirrored | `{url, on}` for the optional coach API bridge | `740-coach-api-bridge.js` | The URL is user-typed |
| `nabd_placement_v1`, `nabd_placement_v1_<userId>` | localStorage, mirrored | Level-quiz placement: track, level, percent, weak topics, rooms, timestamp | Quiz result (`210`), demo sign-in | Indirect |
| `nabd_placement_hist`, `nabd_placement_hist_<userId>` | localStorage, mirrored | Last 8 results `{ts, pct, level}` | Quiz result | Indirect |
| `nabd_comments_v1` | localStorage, mirrored | Professor notes about students, keyed by the student's display name | Notes save handler (`290`); read by the notes panel (`280`) | Yes: notes about named students |
| `nabd_osce` | localStorage, mirrored | Boolean | OSCE toggle (hidden in the interface) | No |
| `nbSound` | localStorage only | `'1'` or `'0'` | `motion/050-monitor.js` | No |
| `nabd_terms_lang` | localStorage | Only removed, never written (`terms/030-boot.js`) | Not applicable | No |
| `nabd_coach_key` | sessionStorage | A key the user types for the optional coach API bridge | `740-coach-api-bridge.js` | Yes: a credential the user supplies. Coach is dormant |
| `nb8_prof_tab` | sessionStorage | Name of the open professor tab | `810-academic-advisor-and-tabs.js` | No |
| `window.name` | Browser tab | `__NABD_STORE__:` plus the JSON copy of the keys above | `setFallbackStore` (`100`) | Same as the keys it copies |

Notes from the audit that bear on this data:

- Accounts and roles are trusted from browser storage. Anyone can edit `nabd_v2_accounts_map` to change a role, and the
  demo buttons sign anyone in as a professor (parts 04 and 34). The sign-in is not a security boundary.
- Stored cohort and account text is rendered into the page without escaping in several places (part 03, part 04).
- `window.name` survives navigation inside the same tab. Whether it survives to other sites: not determined (part 03).
- ER case state in the closure of `er.js` survives sign-out in the same page (part 34).
- Shape of `nabd_v2_prof_cohort` beyond the seed records, and of `nabd_v2_advisor`: not determined.

## Data kept on the server

The only data the server keeps is the in-memory session store, `InMemorySimulationSessionStore`
(`src/Nabd.Infrastructure/Simulation`). The cases and language files are read-only and are not "kept".

| Item | Detail |
|---|---|
| What an entry holds | A `SessionEntry`: the `SimulationSession` (time, risk, stage, blood-pressure cuff, interventions, harms, tests, arrest and handover state), a lock, the graded `HandoverAssessment` once handed over, and the `CommunicationRecord` recorded at the end |
| Key | A random `SessionId` (a GUID). With no authentication it is the only thing that protects a session (decision 0007) |
| Personal data | None. An entry has no user, name or account field |
| Limits | At most 500 sessions (`Simulation:Sessions:MaximumSessions`); a new one is refused when full. Idle entries are dropped after 120 minutes (`IdleMinutes`) |
| Lifetime | Until idle time, or until the process restarts. Sessions are not shared between instances |
| Persistence | None. No database, no file |
| Who can reach it | The session API under `/api/simulation/sessions`, which answers 404 unless `Simulation:ServerSessionsApi:Enabled` is true (true in Development and tests, false in `appsettings.json`) |
| What a response shows | The monitor, the cuff, the stage and what was done. The risk, its rate, the test indication and the scoring rules stay on the server until the report (`SimulationSessionsApiTests`) |
| Used by the room today | No. The legacy client does not call this API |

The relay to the understanding services (`/api/er-chat`, `/api/resp-chat`) stores nothing; it checks and forwards the
request. The real services were never called in this phase.

## Exposure today and how it closes

Rule: internal clinical evaluation data should not reach the browser. It is **not yet met for the legacy rooms**.
What changed is only where the files sit: they left the public web root and are served by `ClientDataController` from
`IClientDataDocumentSource`, under the same paths. A visitor can still request all eight files and `/js/script.js`.
"Closes" means the document leaves `IClientDataDocumentSource.Names` (decision 0005: "A document leaves
`IClientDataDocumentSource` when its room moves to the server"). The order in which rooms move is in
[migration-map.md](migration-map.md).

| Data set | Exposed to the browser today? | Condition under which it stops being served |
|---|---|---|
| `er-cases.json` | Yes, whole file | The ER room's engine runs on the server. The academic portal also fetches this file, so that use must move too (not planned in a source I read: not determined) |
| `er-act.json`, `er-find.json` | Yes | The ER room no longer reads replies offline in the browser. These files hold no answers, so they are the lowest-risk files |
| `er-lang.json` | Yes, though the page never requests it | Not tied to a room in the sources. The browser does not need it; the baseline test still expects it to be served byte for byte, so removing it needs a registered change (`seams.json`). Exact step: not determined |
| `resp-ar.json`, `resp-clinical.json`, `resp-model.json`, `resp-patients.json` | Yes | The respiratory room moves to the server. The room is dormant in the interface today (part 22, part 34) |
| Embedded data in `script.js` | Yes, inside the script | The fragment's responsibility moves to the server (the layer column in `ClientScripts/script/README.md` is the map). Until then it ships to every visitor |
| Browser storage | Never leaves the browser | Needs real identity and a store (decision 0008) |
| Session store | Only the trainee's view | Not applicable. Sessions are not persisted |

The new server path does not widen exposure: the session API is off by default, and a test asserts that its responses
omit the risk and the test indication.

## Rules for this data

- **Do not edit the files.** They are the legacy files byte for byte. A test compares each with the manifest. Changing
  a clinical value is a clinical-content change: it fails the golden masters and the byte-for-byte test on purpose, and
  it needs a registered reason (README ground rules, `seams.json`).
- **Not physician-reviewed.** `er-cases.json` has `reviewed: false` at top level, and the repository exposes the flag
  (`IsClinicallyReviewedAsync`, pinned by `The_clinical_content_is_reported_as_not_reviewed_by_a_physician`).
  `resp-clinical.json` and `resp-ar.json` state in their `source` lines that they are not yet reviewed by a clinician.
  `er-lang.json` states it was not reviewed by a Jordanian linguist. Nothing here may be presented as reviewed.
- **Not for real patients.** The system does not diagnose or treat. The classifier files say they read language, not
  medicine.
- **Licences and credits the audit names.**
  - `resp-patients.json` and `resp-ar.json` derive from the DDXPlus dataset (Fansi Tchango, Goel, Wen, Martel, Ghosn),
    licence CC BY 4.0. The `source` line in each file records the changes made by Nabd. Keep that line with the data.
  - `resp-model.json` is trained on the DDXPlus train split (1,025,602 synthetic patients), per its `trained_on` field.
    The licence of the trained weights is not stated in the file: not determined.
  - `resp-clinical.json` is not DDXPlus data; its values were written for Nabd.
  - `er-act.json` and `er-find.json` were trained on Nabd's own language batch and findings dictionary (their `source`
    lines). Licence of those training inputs: not determined. `er-lang.json` was produced from two AI-researched files.
  - Images: credits and licences are in `src/Nabd.Web/wwwroot/img/CREDITS.txt` (Wikimedia Commons photos, public domain
    or CC BY / CC BY-SA, each with its own licence). The embedded images in `script/010` and `020`: origin not determined.
- **No secrets in this data.** None of the eight files holds a key. The browser can hold a user-typed key
  (`nabd_coach_key`), which never reaches the server.
- **Personal data.** The server stores none. Browser storage holds names, emails and password hashes of the visitor's
  own accounts, and professor notes about named students; treat any future move of these to a server as a new
  personal-data decision (decision 0008).
