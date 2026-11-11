# Clinical case catalog and workup catalog — script.js:1–687

## Purpose

Lines 1–687 of script.js hold the static content of the original "doctor case" simulation: three case-card photos, six diagnostic images, the department list, a 13-item workup (test) catalog, and `CASES_DB`, seven patient cases with questions, expected tests, per-case test results, safety gates, and an ideal summary and handover. The range contains no functions and no executable logic; it only declares five top-level `const` data literals (script.js:5, 11, 13, 28, 214). All behaviour that reads this data lives later in script.js (about 2264–2650, 4139–4420, 4800–5300, 5439, 6550). Lines 692–1000 then overwrite part of this data at load time (see Problems). Today the student-facing simulation view that consumes this data is closed (see Features).

## Features and user journeys implemented here

| # | Feature | Reachability | Evidence |
|---|---|---|---|
| 1 | Seven doctor-track cases (cardio/DM, resp/renal, ortho/HTN, GI/allergy, OB-GYN anemia, peds dehydration, OB-GYN dysmenorrhea), each with patient, vitals, 2–4 history questions, expected tests, results, ideal summary and handover | dormant | `startSimulationSession` returns to home when `goToSim && !isEmergencyMode` (script.js:4266). `'sim'` is in `REMOVED_VIEWS` (1678) and `navigateTo` redirects it home (1949). Probe: `startSimulationSession('case_cardio_dm',false,true)` left `currentView='home'`, `#view-sim` has display none and class `hidden`. Callers 4006, 4220, 6896 all pass `isEmergencyMode=false`. |
| 2 | Department filter bar built from `DEPARTMENTS` | dormant | Built at 4139 inside the sim view's case browser; same closure as row 1. |
| 3 | Workup menu (category filter all/imaging/lab/bedside) from `GENERAL_WORKUP_CATALOG` | dormant | `renderWorkupCatalog` 4602-4603, only rendered inside the sim view. |
| 4 | Test request: result lookup from `workupOverrides`, fall back to `defaultResult*` and `defaultLabRows` | dormant | `requestWorkupItem` 4801-4935. |
| 5 | Safety gate: a test with `requiresQuestion` not yet asked records a safety mistake and toast | dormant | 4893-4897. Only `requiresQuestion` and `violationMsg` are read. |
| 6 | Imaging zoom of `DIAG_IMAGES[imageKey]` in the chat card and in the report | dormant | 4670-4671, 5639, 5647-5651. |
| 7 | Report "ideal summary" and "ideal handover" cells | dormant | 5298, 5300. |
| 8 | Hero counters: number of cases and distinct departments written to `#hero-stat-cases`, `#hero-stat-depts` | dormant | 2644-2645; probe found neither id in the DOM. |
| 9 | OSCE/recommendation room lists (`nbRecommend` pool, `nb-room` rows) include `CASES_DB` | dormant (hidden) | 2264, 2281, 2333-2335. Probe after `nbDemoLogin('med_student')`: 3 `.nb-room` nodes exist, 0 are visible (CSS rule that hides them not traced). |
| 10 | `levelLabel` to tier mapping (`nbTier`) and `durationMin` for the OSCE timer | dormant | 2476, 2508; reached only through `updateSimLevelHint` / `nbStartOsce` called from `startSimulationSession` (4267). |
| 11 | Restore of an interrupted case from storage via `activeSimMeta.caseId` | not determined | 6550-6551 calls `startSimulationSession(..., goToSim=false)`; whether a stored `activeSimMeta` can exist today was not traced. |
| 12 | Custom/generated case written into `CASES_DB` at runtime | not determined | 1768 (load from storage), 6001 (new case). Not traced beyond the assignment; both depend on the sim view. |

`CASES_DB`, `GENERAL_WORKUP_CATALOG`, `DEPARTMENTS`, `DIAG_IMAGES`, `CASE_IMAGES` are not referenced by er.js, resp.js, ui.js, motion.js, terms.js or index.html (grep over `*.js` and index.html, hits only in script.js). The live ER and respiratory rooms do not use this range.

## Declarations

| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| `CASE_IMAGES` | 5–9 | const object (3 keys `img0..img2`) | Three base64 JPEG case-card photos (line 6: 45,698 chars; 7: 57,762; 8: 43,977). | infrastructure (embedded asset data) | none | `CASES_DB.*.image` (219, 294, 371, 433, 513, 570, 627); 1767, 1775 (default and strip on save), 5961 |
| `DIAG_IMAGES` | 11 | const object, single 15,289-char JSON line | Six diagnostic images keyed `ecg_stemi`, `ecg_normal`, `xray_ankle`, `xray_chest`, `ct_chest`, `ultrasound`; each `{url, fallback, caption}`. Four are inline SVG data URIs; `xray_ankle.url` is `img/nb/ankle_fx.jpg` and `xray_chest.url` is `img/nb/cxr_normal.png` (both files exist). Captions are Arabic. | infrastructure (embedded asset data) | none | 4670, 5639, 5647-5651 (and keys named at 697, 773, 786, 809, 824, 865, 877, 911, 1234…) |
| `DEPARTMENTS` | 13–22 | const array of 8 `{id,name}` | Department list; `neuro` is labelled "قيد الإضافة" and no case has `deptId:'neuro'`. | domain (reference data) | none | 4139, 4174, 5960 |
| `GENERAL_WORKUP_CATALOG` | 28–212 | const array of 13 items | Test menu with `id`, `category` (`imaging`/`lab`/`bedside`), optional `isImaging`+`imageKey`, `title`, `subtitle`, `defaultResultTitle`, `defaultResultText`, `defaultLabRows[{param,val,unit,ref}]`. Items: w_ecg, w_glucometer, w_urinalysis, w_auscultation, w_pulses_crt, w_cbc_chem, w_troponin, w_abg, w_bhcg_iron, w_ultrasound_doppler, w_xray_limb_chest, w_ct_contrast, w_admin_med. | domain (clinical reference values) | none | 4602-4603, 4803, 5253 |
| `CASES_DB` | 214–686 | const object, 7 cases | Case content. Keys per case: id, deptId, deptName, image, title, comorbidities, cardSummary, levelLabel, durationMin, patient{name,age,gender,bio,initialGreeting}, vitalsInitial{hr,bp,spo2,temp}, questions[{id,label,prompt,reply,emotion,delta,reason}], expectedWorkupIds, workupOverrides, idealSummary, idealHandover. | domain | none in range; mutated later (693-1000 patches, 1768, 6001) | 2264-2281, 2455, 2508, 2644-2645, 3456, 4168, 4276, 5439, 6550 |

Per-case summary (verified by evaluating lines 1–687):

| case id | dept | level | min | questions (id:delta:emotion) | expectedWorkupIds in range | override keys in range |
|---|---|---|---|---|---|---|
| case_cardio_dm | cardio | متوسط | 14 | q_pain:10:open, q_dm_history:12:open, q_allergy:15:relaxed, q_resp:8:open | w_ecg, w_glucometer, w_troponin | same 3 |
| case_resp_renal | resp | متقدم | 15 | q_onset_travel:12, q_renal_meds:14, q_allergy:16:relaxed | w_auscultation, w_abg, w_cbc_chem, w_ultrasound_doppler | those 4 + w_ct_contrast (gate q_allergy) |
| case_ortho_htn | ortho | سهل | 12 | q_neurovascular:12, q_htn_ulcer:15:relaxed, q_allergy:8 | w_pulses_crt, w_xray_limb_chest | those 2 |
| case_gi_allergy | gi | متوسط | 12 | q_pain_gi:10, q_allergy:15:relaxed, q_preg:15:relaxed | w_ultrasound_doppler, w_cbc_chem, w_bhcg_iron | those 3 + w_ct_contrast, w_xray_limb_chest (gate q_preg) |
| case_obgyn_anemia | obgyn | سهل | 10 | q_fetal_move:12, q_iron_meds:15:relaxed | w_cbc_chem, w_bhcg_iron, w_ultrasound_doppler | same 3 |
| case_peds_dehydration | peds | متوسط | 12 | q_urine_tears:14, q_weight_allergy:16:relaxed | w_pulses_crt, w_glucometer, w_cbc_chem | same 3 |
| case_obgyn_dysmenorrhea | obgyn | متوسط | 12 | q_pain:10, q_preg:18:relaxed, q_allergy:12 | w_urinalysis, w_ultrasound_doppler | same 2 (w_ultrasound_doppler sets `isImaging`, `imageKey:'ultrasound'`) |

## Shared state, globals and contracts

Defines for others (all classic-script globals; none are on `window` explicitly):
- `CASE_IMAGES.img0|img1|img2` (data URIs).
- `DIAG_IMAGES[key] = {url, fallback, caption}`; consumers read `.url` (and `.fallback`/`.caption` at 4670-4680, 5639-5660, not traced further).
- `DEPARTMENTS[] = {id,name}`, with `'all'` as the sentinel id compared to `selectedDeptFilter` (script.js:1694).
- `GENERAL_WORKUP_CATALOG[]` and the item contract above. Item `id` values are the contract with `expectedWorkupIds` and `workupOverrides` keys.
- `CASES_DB[caseId]`: the case contract above. Fields consumed elsewhere: `patient.initialGreeting` (4372), `vitalsInitial` (5174, 6744), `questions[].prompt/reply/emotion/reason` (4420, 4498-4506), `workupOverrides[wid].{requiresQuestion,violationMsg,labRows,resultTitle,resultText,isImaging,imageKey}` (4806-4935), `expectedWorkupIds` (4928, 5012, 5060), `idealSummary`/`idealHandover` (5298, 5300), `levelLabel`/`durationMin`/`deptName`/`cardSummary` (2335, 2476, 2508, 4037).
- Id-naming contracts hidden in code: any question whose id contains the substring `allergy` counts as an allergy check (4810-4811); `NB_MED_GUIDED_ID` excludes one case from the pool (2281).

Expects from others: nothing at evaluation time. The range has no dependency on any other declaration. Later code expects `simState.askedIds` (a Set, 4893) to contain question ids that match `requiresQuestion` values (`q_allergy`, `q_preg`).

## Data, storage and network

| Item | Detail |
|---|---|
| fetch / XHR | none in range |
| localStorage / sessionStorage / window.name | none in range. Elsewhere, `CASES_DB` entries are stored without `image` (1775, "keep storage compact") and re-hydrated with `CASE_IMAGES.img0` (1767); storage key and shape not traced here. |
| Timers, audio, history API | none in range |
| External files referenced | `img/nb/ankle_fx.jpg`, `img/nb/cxr_normal.png` (via `DIAG_IMAGES`, line 11); both exist in the checkout. |
| Embedded data size | script.js lines 6–8: 147,373 chars of base64 JPEG; line 11: 15,289 chars. The range is 163,423 bytes for lines 1–12 of the 215 KB it occupies in total (check-fragment). |
| JSON fields read by later code | see the contract list above. `delta` (every question) is never read outside the data (grep for `delta` over all `*.js` and index.html: only the literals in this range and 5982, 5991). |

## Calculations and rules worth pinning with a golden-master test

The range has no calculation. These data-driven rules are worth pinning because the sim logic depends on exact values.

| Name | Lines | Inputs | Outputs | Randomness / time |
|---|---|---|---|---|
| Case catalog snapshot | 214–686 (+ patches 692–1000) | final `CASES_DB` after the whole startup script has run | JSON of all cases: ids, vitals, question ids/prompts/replies/emotions/deltas, expected ids, effective `workupOverrides` | none |
| Workup catalog snapshot | 28–212 | none | 13 ids, categories, default titles, default lab rows (param, val, unit, ref) | none |
| Effective result per (case, test) | data 214–686 and 692–1000; logic 4801-4935 | caseId, wid, set of asked question ids | `{resultTitle, resultText, labRows, isImaging, imageKey, isExpected}` or a violation entry | timestamp via `getSessionTimestamp()` (time) |
| Safety gates | 783-787, 862-878 (shadow copies); effective ones in patches | wid in {w_ct_contrast, w_xray_limb_chest} with `requiresQuestion` | violation message, `simState.safetyMistakes` entry | none |
| Allergy rule | 4810-4811 (logic outside range, depends on question ids in range) | wid `w_admin_med` or `w_ct_contrast`, case has a question id containing `allergy` | violation if no `*allergy*` question asked | none |
| Department/level taxonomy | 13–22, 2476 | `levelLabel` | tier 1/2/3 (سهل/متوسط/متقدم); unknown gives 2 | none |
| Diagnostic image keys | 11 | key | `{url, fallback, caption}` | none |

## Problems

| severity | kind | evidence with line numbers |
|---|---|---|
| high | duplication / bug risk | Six cases get `workupOverrides` replaced wholesale by plain assignments at 694, 737, 796, 821, 887, 923 (and `expectedWorkupIds` for three cases at 693, 820, 922). The in-range overrides for case_cardio_dm, resp_renal, ortho_htn, gi_allergy, obgyn_anemia, peds_dehydration (about 190 lines of the range) are therefore never effective. Only case_obgyn_dysmenorrhea keeps its in-range overrides. The case content is split across two places and the in-range copy is stale. |
| high | data-exposure | Answers ship to every client: `expectedWorkupIds`, `idealSummary`, `idealHandover`, per-question `reason`, `delta`, and full result text for every case (214–686). A student can read the expected workup and ideal handover from the page source. For the server-side re-host these must stay on the server. |
| medium | dead-code | `delta` on all 22 questions is never read (grep over `*.js` and index.html). `isContraindicated` (784, 863, 875) is never read; the gate uses `requiresQuestion` only (4893). |
| medium | dead-code | Whole range is reachable only through the closed sim view (1678, 1949, 4266). `neuro` in `DEPARTMENTS` (20) has no case. The OSCE/recommendation lists and hero counters that read `CASES_DB` are hidden or have no DOM element (probes). |
| medium | architecture | Safety rules are string-convention coupled: any question id containing `allergy` (4810-4811) and fixed test ids `w_admin_med`, `w_ct_contrast`, `w_xray_limb_chest` (4811, 4865) are hard-coded in logic outside the data. Case data in range uses the same id `q_pain` for different meanings in two cases (cardio vs dysmenorrhea, lines 225 and 650 area), so ids are only unique per case. |
| medium | maintainability | 163 KB of base64 and SVG inside one script (6–8, 11); `img0` is reused for 2 cases, `img1` for 3, `img2` for 2 (219, 294, 371, 433, 513, 570, 627), so card images do not identify the case. |
| low | data | Default `w_cbc_chem` rows use female reference ranges for Hb (12.0–16.0, line ~106) for every case, including male patients, if a case has no override. |
| low | data | `w_bhcg_iron` in case_obgyn_anemia (in range) is overridden to show ferritin only, with the title naming ferritin; the catalog item title says B-hCG & Ferritin. The effective patch was not compared (patch at 887). |
| low | maintainability | Text mixes colloquial and formal Arabic, and lab parameter names mix English and Arabic inside one string (for example `Sodium (Na+) / Potassium (K+)` stores two values in one `val`: "139 / 4.1"), so a lab value cannot be parsed numerically. |
| low | security | No dynamic code in range. Results are later inserted through template strings (for example 5639 builds HTML with `w.*` fields); the data in range contains no markup, so no injection from this range. Insertion sites were not audited here. |

## Proposed source fragments

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | case-card-images.js | 1–10 | `CASE_IMAGES` embedded JPEG data | infrastructure |
| 2 | diagnostic-images.js | 11–12 | `DIAG_IMAGES` image catalog (inline SVG and two file paths) | infrastructure |
| 3 | department-and-workup-catalog.js | 13–213 | `DEPARTMENTS` and `GENERAL_WORKUP_CATALOG` reference data | domain |
| 4 | clinical-cases-catalog.js | 214–687 | `CASES_DB` seven cases (later patched at 692+) | domain |

Validated with `node tools/legacy/check-fragment.mjs script.js 1-10 11-12 13-213 214-687` (each fragment also checked individually: 1-10, 11-12, 13-23, 24-213, 13-213, 214-687 all print ok). Line 687 is the blank line before the section-2 banner at 688. Fragments 13–23 and 24–213 can be split further if the department list should be separate (both print ok).

## Open questions

1. Is the doctor-track simulation (sim view, `REMOVED_VIEWS` at 1678) to be re-hosted, or only archived? That decides whether this range is migrated or dropped.
2. Which copy of `workupOverrides` is authoritative for the six patched cases: the patches at 692–1000 (effective at runtime) or the in-range literals (stale)?
3. Can a stored `activeSimMeta` or stored custom case (1768, 6001, 6550-6551) still revive a sim today? Not traced.
4. What CSS rule hides the three `.nb-room` rows in the home view (scope.css or another file)? Not traced.
5. Are `ER` and respiratory cases (er.js, resp.js, data/*.json) meant to replace `CASES_DB`, or stay separate content?
6. Should `delta` and `isContraindicated` be kept as scoring metadata for the new domain model, since no current code reads them?
