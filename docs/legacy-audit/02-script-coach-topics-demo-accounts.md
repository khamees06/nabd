# Workup overrides, coach topics and demo accounts — script.js:688–1206

Audit base: branch `refactor/clean-architecture` (commit 5f431d5). Line numbers refer to `script.js` unless another file is named.
"Probe" means a value read from the running legacy page at `http://127.0.0.1:5180/` with `tools/legacy/browser-probe.mjs` (1440x900, fresh profile, `/api` answering 404).

## Purpose

The range contains no functions. It holds three blocks of static data that run at script load.
Lines 693–963 are nine top-level assignment statements that replace, for six of the seven cases in `CASES_DB`, the `workupOverrides` object (and for three cases the `expectedWorkupIds` array) that the `CASES_DB` literal itself declared at lines 214–686. The replacement gives each test a raw "lab slip" (`labRows`) instead of an interpreted sentence.
Lines 965–1030 declare `COACH_MODULES_DEFAULT`, four teaching topics for the clinical coach, each with a keyword list used for scoring.
Lines 1032–1205 declare `DEMO_ACCOUNTS`, five ready-made user accounts (four learners, one professor) with seeded statistics, strengths, weaknesses and session history, used for sign-in without registration.
`script.js` is one classic script with no wrapper, so the two `const` declarations are global lexical bindings (probe: `'DEMO_ACCOUNTS' in window` is `false`, but the names resolve from other scripts and from the console).

## Features and user journeys implemented here

The range only supplies data; every journey below is completed by code elsewhere. Reachability is that of the consuming code.

| # | Feature (what the user sees or does) | Data used | Reachability | Evidence |
|---|---|---|---|---|
| 1 | Hero button "جرّب حالة ER": signs in as the demo medical student and opens the ER room | `DEMO_ACCOUNTS.med_student` | live | `index.html:282` (`#index-demo-cta`), proxies at `index.html:357`, `398`; handler 6602 (`nbDemoLogin('med_student')`, then `nbOpenER()` after 400 ms). Probe: after click, `currentView === 'er'`, user id `med_student`. |
| 2 | Login dialog, group "دخول تجريبي": three buttons (nursing student, medical student, professor) | `DEMO_ACCOUNTS.rana`, `.med_student`, `.doctor` | live | `index.html:2014–2016` (`data-demo-login`), handler 6603–6605, `nbDemoLogin` 2042–2054. Probe: all three buttons visible; login lands on `home`. |
| 3 | Demo placement: a demo learner is given a level so the level quiz does not interrupt | `year`, `role`, `specialty`, `stats.avgSpec` | live | 2045–2051 writes `nabd_placement_v1_<id>`. Probe: `{track:'medicine', level:3, pct:88, weak:[], rooms:[3 ids], demo:true, ts}` for `med_student`; none written for `doctor` (track is `null`). |
| 4 | "Demo account" badges in header dropdown, home welcome card and profile | `isDemo` | live | 1899, 1921, 5321. Probe: `#home-demo-indicator` visible. |
| 5 | Demo session is not restored after a page reload | `isDemo` | live (code reading; reload not executed) | 6536–6539: a stored active user with `isDemo` is discarded and `nabd_v2_active_user_id` removed. |
| 6 | Profile of a demo account: name, initials, e-mail and university, session count, ER average, strengths / weaknesses / recommendations (tab "overview"), history table, certificate | all account fields | live | `renderProfileView` 5309–5348, history 5351–5370, certificate 5381–5415. Probe (`med_student`): overview lists visible (2 / 3 / 1 items), history 6 rows, certificate serial `NABD-2026-MED_ST-106`. `#profile-stat-spec` (uses `stats.avgSpec`) is hidden by `scope.css:47`. |
| 7 | Profile dashboard card "نقاط الضعف مع المدرب": mastered count and the four coach topic titles | `COACH_MODULES_DEFAULT[].id`, `.title` | live | 5446–5447, `index.html:1287`. Probe: `#dash-coach` visible, text "0/4" plus four titles. The button `#dash-coach-go` inside it is hidden by `scope.css:40`. |
| 8 | Profile dashboard "skills by department": demo history rows grouped by case department | `history[].caseTitle`, `.score` | live | 5438–5444: seed rows have no `caseId`, so they are matched by exact `caseTitle === CASES_DB[*].title`. Probe: 4 department bars for `med_student`. |
| 9 | Interactive coach view: topic queue, drill prompt, typed answer scored by keywords, "model answer" chip, hint, reset | all of `COACH_MODULES_DEFAULT` | dormant | `'coach'` is in `REMOVED_VIEWS` (1678) and `navigateTo` redirects it to `home` (1949). Entry controls: `#app-nav-coach` carries `er-locked` + `aria-disabled` (`index.html:118`, `er.css:155` sets `pointer-events:none`); `#home-coach-banner`, `#open-coach-view-btn`, `#dash-coach-go`, `[data-foot-app="coach"]` are hidden (`scope.css:40`). `renderInteractiveCoachView` is called only from 1973 (after the redirect) and from coach-view handlers (5771, 5932, 6843, 6861, 6867). Probe: `navigateTo('coach')` and a scripted click on `#app-nav-coach` both leave `currentView === 'home'`. |
| 10 | Legacy case simulation: ordering a test shows a lab slip (title, instruction text, table of parameter / value / unit / reference, optional zoomable image) | `workupOverrides` of six cases | dormant | Only reader: `requestWorkupItem` 4806, 4893–4927, wired at 4633 inside `#view-sim`. `'sim'` is in `REMOVED_VIEWS` (1678, 1949); `startSimulationSession` returns to `home` when `goToSim && !isEmergencyMode` (4266). Callers 4006, 4220, 6896 pass `isEmergencyMode=false`; 2549 passes it only after a finished legacy session; 6551 needs a stored `nabd_v2_active_sim_meta`, which only 4376 writes. Probe: normal start leaves `simState.caseData === null`; a forced emergency start builds state but `#view-sim` stays hidden. |
| 11 | Legacy case simulation: expected-test list drives the "expected" flag, the extra-test justification prompt, 20 score points and the report table | `expectedWorkupIds` of three cases | dormant | Readers 4928, 5012, 5060, 5104–5106, 5252. Same guards as row 10. |
| 12 | Seeded weaknesses shown on the home page as "top mistakes" with a "room that fixes it" button | `weaknesses` (first three) | dormant | Rendered by 2592–2595 into `#path-mistakes`, but the card is hidden (`scope.css:33`, `:36`). Probe: content present, `pathMistakesVisible: false`. |
| 13 | Demo accounts "أحمد السالم" (first-year student) and "طارق العتيبي" (practitioner) | `DEMO_ACCOUNTS.ahmed_y1`, `.practitioner` | unreferenced | No UI control passes these ids. Searches run over `*.js` and `index.html`: `ahmed_y1`, `'practitioner'`, `data-demo-login`, `nbDemoLogin`, `DEMO_ACCOUNTS`. The only lookups are dynamic (`DEMO_ACCOUNTS[id]` at 1783 and 2043). Probe: `nbDemoLogin('ahmed_y1')` from the console works. |

Displayed text from this range is rewritten after rendering by `terms.js` (Arabic clinical terms become ward English, for example the first coach title shows "Chest pain" and "DM" in the probe). The strings in the source are therefore not byte-identical to what the user reads.

## Declarations

There are two declarations; the other entries are top-level statements. All run once at script load.

| name | lines | kind | responsibility | layer | shared state read / written | called from / read by |
|---|---|---|---|---|---|---|
| (section banner and comment) | 688–692 | comment | Banner reads "2. ILLUSTRATIVE COACH TOPICS & DEMO ACCOUNTS"; line 692 states the intent of the patch (raw slips, no diagnostic spoilers) | – | – | – |
| `CASES_DB.case_cardio_dm.expectedWorkupIds = …` | 693 | assignment statement | Replaces the list from 271; adds `w_urinalysis` | domain (reference data) | writes `CASES_DB` | 4928, 5012, 5060, 5252 |
| `CASES_DB.case_cardio_dm.workupOverrides = …` | 694–735 | assignment statement | 4 entries (`w_ecg` with image `ecg_stemi`, `w_glucometer`, `w_troponin`, `w_urinalysis`); replaces 272–285 | domain (reference data) | writes `CASES_DB` | 4806 |
| `CASES_DB.case_resp_renal.workupOverrides = …` | 737–794 | assignment statement | 5 entries; `w_ct_contrast` carries `requiresQuestion:'q_allergy'`, `isContraindicated`, `violationMsg`; replaces 338–362 | domain (reference data + safety gate) | writes `CASES_DB` | 4806 |
| `CASES_DB.case_ortho_htn.workupOverrides = …` | 796–818 | assignment statement | 2 entries (`w_xray_limb_chest` with image `xray_ankle`); replaces 415–424 | domain (reference data) | writes `CASES_DB` | 4806 |
| `CASES_DB.case_gi_allergy.expectedWorkupIds = …` | 820 | assignment statement | Replaces 476; adds `w_urinalysis` | domain (reference data) | writes `CASES_DB` | as line 693 |
| `CASES_DB.case_gi_allergy.workupOverrides = …` | 821–885 | assignment statement | 6 entries; `w_ct_contrast` and `w_xray_limb_chest` carry `requiresQuestion:'q_preg'`, `isContraindicated`, `violationMsg`; replaces 477–504 | domain (reference data + safety gate) | writes `CASES_DB` | 4806 |
| `CASES_DB.case_obgyn_anemia.workupOverrides = …` | 887–920 | assignment statement | 3 entries; replaces 548–561 | domain (reference data) | writes `CASES_DB` | 4806 |
| `CASES_DB.case_peds_dehydration.expectedWorkupIds = …` | 922 | assignment statement | Replaces 604; adds `w_urinalysis` | domain (reference data) | writes `CASES_DB` | as line 693 |
| `CASES_DB.case_peds_dehydration.workupOverrides = …` | 923–963 | assignment statement | 4 entries; replaces 605–618 | domain (reference data) | writes `CASES_DB` | 4806 |
| `COACH_MODULES_DEFAULT` | 965–1030 | `const` array of 4 objects | Coach topics: explanation steps, model answer, scoring keywords | domain (teaching content and scoring keywords) mixed with presentation copy | none | 5446–5447 (profile dashboard), 5727, 5750, 5808, 5904, 5920 (coach view), 6841, 6853, 6859 (coach handlers) |
| `DEMO_ACCOUNTS` | 1032–1205 | `const` object, 5 keys | Seed user accounts for demo sign-in | infrastructure (seed / fixture data) mixed with presentation copy | none | 1783 (`getAccountFromStorageOrDefault`), 2043 (`nbDemoLogin`) |

Override entry fields and who reads them:

| field | read at | note |
|---|---|---|
| `resultTitle`, `resultText`, `labRows[{param,val,unit,ref}]` | 4923–4925, rendered 4688–4703 | – |
| `isImaging`, `imageKey` | 4926–4927, rendered 4670–4671, 5639–5651 | all keys used in the range exist in `DIAG_IMAGES` (line 11): `ecg_stemi`, `ultrasound`, `ct_chest`, `xray_ankle`, `xray_chest` |
| `requiresQuestion`, `violationMsg` | 4893–4894 | shadowed in all three uses, see Problems P2 |
| `isContraindicated` | nowhere | search `isContraindicated` over `*.js` and `index.html` finds only the six data lines (357, 492, 499, 784, 863, 875) |

Coach module fields and who reads them:

| field | read at |
|---|---|
| `id` | 5447, 5751, 5828–5829, 5925 |
| `title` | 5447 (leading "١." stripped by regex), 5762, 5885 |
| `specialty` | 5763, 5810, 5828 (fallback), 5930 |
| `explanationSteps` | 5815 |
| `keywords` | 5920 (scoring), 6855 (hint shows the first six) |
| `sampleIdealStudentReply` | 5855, 5939 |
| `testPrompt` | 5829, only as fallback; all four ids have an entry in `coachDrillPrompts` (5822–5827), so it is never shown |
| `sourceStat`, `coachExamplePatient`, `coachExampleReply` | nowhere (searched each name over `*.js` and `index.html`) |

## Shared state, globals and contracts

Defined for others:

- `COACH_MODULES_DEFAULT` (global lexical binding): array of `{id, specialty, title, sourceStat, explanationSteps[3], coachExamplePatient, coachExampleReply, testPrompt, keywords[10–12], sampleIdealStudentReply}`. Ids: `weak_cardio_acs`, `weak_neuro_stroke`, `weak_safety_contrast_preg`, `weak_peds_workup_just`.
- `DEMO_ACCOUNTS` (global lexical binding): map id → account. Keys: `ahmed_y1`, `practitioner`, `rana`, `med_student`, `doctor`. Account shape: `{id, name, initials, email, uni, role, year?, roleNameAr, specialty, roleLabel, isDemo:true, stats:{completed, avgSpec, avgEr}, strengths[], weaknesses[], recommendations[], history[{caseTitle, mode, date, workupCount, score}]}`. `year` is absent on `practitioner` and `doctor`. This is the same account contract that registration builds at 7081–7103 (which adds `passwordSalt`, `passwordHash`, `track`, `cohort`, `cohortName`) and that `er.js:4239–4250` and `resp.js:793–796` extend (`caseId`, `num`, `passed`, `ts`, `questions`, `stats.avgErDoctor`, `stats.avgErNurse`).
- Mutated `CASES_DB` entries: after load, six cases hold the override objects from this range (probe confirmed keys and `labRows` counts; `case_obgyn_dysmenorrhea` is untouched and has no `labRows`).

Expected from others:

| what | where defined | how it is used here |
|---|---|---|
| `CASES_DB` with keys `case_cardio_dm`, `case_resp_renal`, `case_ortho_htn`, `case_gi_allergy`, `case_obgyn_anemia`, `case_peds_dehydration` | 214–686 | dereferenced at 693, 694, 737, 796, 820, 821, 887, 922, 923; must already exist |
| Workup ids of `GENERAL_WORKUP_CATALOG` | 28–212 | every override key and expected id in the range exists in the catalog (`w_ecg`, `w_glucometer`, `w_troponin`, `w_urinalysis`, `w_auscultation`, `w_abg`, `w_cbc_chem`, `w_ultrasound_doppler`, `w_ct_contrast`, `w_pulses_crt`, `w_xray_limb_chest`, `w_bhcg_iron`) |
| `DIAG_IMAGES` keys | 11 | `imageKey` values |
| Question ids of the same case | `q_allergy` (328), `q_preg` (467) | `requiresQuestion` values |
| Coach module ids hard-coded elsewhere | 5816–5827 (`coachDrillTitles`, `coachDrillPrompts`) | must stay in step with `COACH_MODULES_DEFAULT[].id` |
| Demo account ids hard-coded elsewhere | `index.html:2014–2016`, 6602 (`'med_student'`), 2413 (`u.id === 'doctor'` selects invite code `NUR-JU-2026`) | must stay in step with `DEMO_ACCOUNTS` keys |
| `role` vocabulary | `nbDerivedLevel` 2401–2405, `nbTrackOf` 3457–3462, 1882, 5470, 5946, 6027 | values used here: `student`, `practitioner`, `professor`. Consumers also accept `role === 'doctor'` as professor; no account in the range uses it |
| `specialty` prefix rule | 3461 (`/^الطب/` → `medicine`, otherwise `nursing`) | `med_student.specialty = 'الطب'`; the professor's `'الطب والتمريض'` is never tested because professors return `null` first |
| `caseTitle` equality with `CASES_DB[*].title` | 5439 | needed for the dashboard grouping because seed history has no `caseId` |

DOM ids: none are touched inside the range.

Derived values for the seed accounts (probe, computed with the page's own functions):

| id | role | year | `nbTrackOf` | `nbDerivedLevel` | `stats.completed` | history rows | history titles matching a `CASES_DB` title |
|---|---|---|---|---|---|---|---|
| `ahmed_y1` | student | 1 | nursing | 1 | 7 | 7 | 4 |
| `practitioner` | practitioner | – | nursing | 2 | 8 | 8 | 4 |
| `rana` | student | 4 | nursing | 3 | 8 | 8 | 5 |
| `med_student` | student | 4 | medicine | 3 | 6 | 6 | 4 |
| `doctor` | professor | – | null | 0 | 8 | 1 | 0 |

## Data, storage and network

The range itself performs no fetch, no storage access, no timers, no audio and no history API call. It is reached by storage code elsewhere:

| key (localStorage, mirrored into `window.name` by `safeStorageSet` 1745–1752) | shape | relation to this range |
|---|---|---|
| `nabd_v2_accounts_map` | `{ [accountId]: account }` | `loginWithAccount` (2022–2025) stores a deep copy of the demo account on first demo sign-in. Later sign-ins read the stored copy first (1781–1783). Probe: keys `med_student`, `doctor` after two demo logins. |
| `nabd_v2_active_user_id` | account id string | Set at 2026; removed on next load when the account is a demo (6539). |
| `nabd_placement_v1_<accountId>` | `{track, level, pct, weak:[], rooms:[≤3 case ids], demo:true, ts}` | Written by `nbDemoLogin` (2047–2050) from `year`, `role`, `specialty`, `stats.avgSpec`; `ts` is `Date.now()`. |
| `nabd_v2_coach_mastered` | `{ [userId or 'guest']: [moduleId, …] }` | 5690–5701; values are `COACH_MODULES_DEFAULT[].id`. Probe: absent after demo use (coach view closed). |
| `nabd_v2_active_sim_meta` | `{caseId, isEmergencyMode, view:'sim'}` | 4376; legacy simulation only. |

JSON files: none read. Images: `imageKey` resolves through `DIAG_IMAGES` to inline SVG data URIs or to `img/nb/ankle_fx.jpg` and `img/nb/cxr_normal.png`.
The serverless functions `api/er-chat.js` and `api/resp-chat.js` contain no reference to `COACH_MODULES`, `DEMO_ACCOUNTS`, `workupOverrides`, `CASES_DB` or the demo ids (grep count 0 in both files).

## Calculations and rules worth pinning with a golden-master test

The range has no calculation. These data-driven results are deterministic and worth a snapshot:

| name | lines | inputs | outputs | randomness / time |
|---|---|---|---|---|
| Load-time case patch | 693–963 (target object 214–686) | none | For each of the 7 cases: `expectedWorkupIds` and the full `workupOverrides` object after script load (JSON-serialisable). Pins that six cases come from the patch and `case_obgyn_dysmenorrhea` from the inline literal. | none |
| Workup request outcome per case and question state | data 694–963; rule code 4801–4958 | case id, workup id, set of asked question ids | `{isViolation, isExpected, resultTitle, imageKey, labRows.length}` and `simState.safetyMistakes`. Probe values to pin: `case_gi_allergy` + `w_urinalysis` → expected, 4 rows; `w_xray_limb_chest` with nothing asked → generic radiation violation; `w_ct_contrast` with nothing asked → generic allergy violation; with `q_allergy` only → generic radiation violation; with `q_allergy` + `q_preg` → non-violation result with image `ct_chest`. `case_resp_renal` + `w_ct_contrast`: nothing asked → generic allergy violation; `q_allergy` asked → non-violation result with image `ct_chest`. | timestamp string from `getSessionTimestamp()` (4807) enters each entry |
| Coach mastery rule over the keyword lists | data 979, 995, 1011, 1027; rule 5917–5926 | module id, answer text | mastered when `text.length >= 20` and at least 2 keywords are substrings of the lower-cased text. Probe: each module's own `sampleIdealStudentReply` hits 9, 6, 9, 9 keywords, so the "model answer" chip always passes. All keywords are already lower-case. | 150 ms `setTimeout` before the reply is rendered |
| Demo account derivations | data 1032–1205; rules 2401–2405, 3457–3462, 2042–2054 | account id | track, level, placement record (table above; `pct = parseInt(stats.avgSpec)`; `rooms` from `nbPickRooms`, which has no randomness, 2262–2275) | `ts: Date.now()` in the placement record |
| Demo account snapshot | 1032–1205 | none | whole object as JSON | none (history dates are literal strings, 2026-10-08 … 2026-10-16) |

## Problems

| id | severity | kind | evidence |
|---|---|---|---|
| P1 | medium | bug | `isContraindicated: true` (784, 863, 875) is never read. Once the gating question has been asked, a contraindicated study is delivered as an ordinary result with an image and without a safety mistake. Probe: `case_gi_allergy`, `q_allergy` + `q_preg` asked, `w_ct_contrast` and `w_xray_limb_chest` → `isViolation:false`; `case_resp_renal`, `q_allergy` asked, `w_ct_contrast` → `isViolation:false`. Feature is dormant today (row 10). |
| P2 | medium | dead-code | The three `requiresQuestion` / `violationMsg` gates (783–787, 862–866, 874–878) cannot fire. Rule A (4810–4835) returns first for `w_ct_contrast` when no allergy question was asked; Rule B (4864–4891) returns first for X-ray/CT on a female patient aged 12–50 when no pregnancy question was asked; when the question was asked, 4893 is false. The case-specific messages are never shown (probe: only the generic messages appear). |
| P3 | medium | duplication | The inline `workupOverrides` at 272–285, 338–362, 415–424, 477–504, 548–561, 605–618 and the inline `expectedWorkupIds` at 271, 476, 604 are overwritten at load by this range and are dead data. The two copies disagree: paediatric glucose 78 (612) vs 74 (938), Na 136 / K 3.7 (616) vs 137 / 3.4 (945–946), CRT 2.5 s (608) vs 2.6 s (930), "BUN/Creatinine acceptable" (616) vs BUN 29 and creatinine 0.58 above their stated references (948–949); orthopaedic CRT "two seconds" (418) vs 1.8 s (802). |
| P4 | medium | architecture | Shared data is built in two steps: a `const` literal and then load-time mutation by top-level statements. The result depends on statement order. If a case key is missing, lines 693–923 throw a `TypeError` during load, and because `script.js` is one classic script every later declaration (auth, navigation, `initNabdApp`) is lost. |
| P5 | medium | bug | Demo seed is used only once per browser. `loginWithAccount` prefers the copy in `nabd_v2_accounts_map` (2022, 1781–1783) and nothing resets it (searched `isDemo`: 1899, 1921, 5321, 6050, 6538–6539, 7004, 7051). Demo accounts therefore accumulate history between demonstrations, and later edits to `DEMO_ACCOUNTS` do not reach a browser that already holds a copy. Probe: after adding one history row and signing in again as `rana`, history length is 9 (seed 8). |
| P6 | medium | data-exposure | The five accounts carry personal names with e-mail addresses on real institutional domains (`ju.edu.jo`, `just.edu.jo`, `khcc.jo`: 1037, 1073, 1110, 1147, 1180), shipped in client code and shown in the profile and on the certificate (5323, 5398). Whether the identities are fictitious: not determined. |
| P7 | medium | maintainability | Seed text sends the user to closed features. Every learner's `recommendations` (1057, 1092, 1129, 1165) tells them to open the clinical coach, which is in `REMOVED_VIEWS` (1678); the profile overview tab shows this text live (probe). `ahmed_y1.roleLabel` (1043) describes the beginner steps bar of the closed simulation. History `mode` strings name per-specialty ER rooms. |
| P8 | low | bug | Seed statistics are not derivable from seed history. `doctor` has `completed: 8` with one history row (1187, 1201–1203). After the first ER run, `er.js:4242–4249` sets `completed = history.length` and replaces `avgEr` by the average of `er_*` runs only, so the seeded `avgEr` (for example 84%) is replaced by the score of that single run. Code reading; not executed. |
| P9 | low | bug | Dashboard grouping drops seed history rows whose `caseTitle` is not an exact `CASES_DB` title (5439): 3 of 7 rows for `ahmed_y1`, 4 of 8 for `practitioner`, 3 of 8 for `rana`, 2 of 6 for `med_student`, 1 of 1 for `doctor` (probe count). Titles with a patient name in brackets or a neurology case have no match. |
| P10 | low | dead-code | Unread coach fields: `sourceStat`, `coachExamplePatient`, `coachExampleReply` (12 strings) and `testPrompt` (shadowed by 5822–5829). Demo accounts `ahmed_y1` and `practitioner` have no UI entry (row 13). |
| P11 | low | duplication | Coach drill titles and prompts are repeated in `startCoachDrillAtIndex` (5816–5827), keyed by the module ids. Demo names and descriptions are repeated in `index.html:2014–2016` and as placeholders at `index.html:139`, `1433`, `1501`. |
| P12 | low | maintainability | Presentation is embedded in data: ordinal prefixes "١." in coach titles (969, 985, 1001, 1017; stripped by a regex at 5447) and in every `weaknesses` item; gendered copy per account (1129); bilingual labels inside `labRows[].param`. `case_obgyn_dysmenorrhea` (671–682) was not converted and still returns interpreted sentences without `labRows`, contrary to the stated intent at 692. The section banner at 688–690 names coach topics and demo accounts, but the first 270 lines under it are case patches. |
| P13 | low | security | Strings from this range are inserted as HTML without escaping by consumers (5447, 5762–5763, 5815, 5939; lab rows 4703). This is safe only while the data is static code; the same renderers also receive stored accounts and stored custom cases. |

Clinical correctness of the values (reference ranges, units such as "mm (mV×10)" at 703) was not reviewed: not determined.

## Proposed source fragments

Validated with `node tools/legacy/check-fragment.mjs script.js 688-964 965-1031 1032-1206` (all three print `ok`). All start lines are in `.work/script-cuts.txt`.

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | `case-workup-overrides-patch.js` | 688–964 | Load-time replacement of `expectedWorkupIds` and `workupOverrides` for six `CASES_DB` cases (data statements only; includes the section banner 688–690) | domain (reference data) |
| 2 | `coach-modules-default.js` | 965–1031 | `COACH_MODULES_DEFAULT` data literal | domain (teaching content) |
| 3 | `demo-accounts.js` | 1032–1206 | `DEMO_ACCOUNTS` seed data literal | infrastructure (seed data) |

Fragment 1 must stay after the fragment that declares `CASES_DB` and before any code that reads it at load. A finer cut per case also validates (`688-736 737-795 796-819 820-886 887-921 922-964`, all `ok`) but three of those six pieces are under 40 lines, so the single 277-line fragment is proposed.

## Open questions

1. Will the legacy case simulation (`#view-sim`, `requestWorkupItem`) be ported or dropped? If dropped, lines 693–963 have no reader in today's UI; `CASES_DB` itself is still read by live code (home counters 2644–2645, profile dashboard 5439).
2. Will the coach view be reopened? The comment at 1675–1676 says the coach stays, but `'coach'` is in `REMOVED_VIEWS` (1678) while the profile still lists the four topics with a permanent "0/4".
3. When the inline literal and the patch disagree (P3), which values are authoritative, and should `isContraindicated` carry a penalty (P1)?
4. Should a demo sign-in start from the seed every time, or keep the stored copy as it does now (P5)?
5. Are the demo identities and e-mail addresses fictitious, and may they stay on real institutional domains (P6)?
6. Should `ahmed_y1` and `practitioner` be kept without a UI entry, and should the seed `recommendations` text be rewritten for the features that exist today (P7)?
