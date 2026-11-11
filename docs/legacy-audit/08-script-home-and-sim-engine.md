# Home view (department filter, case cards) and the specialty simulation engine — script.js:4131–4968

## Purpose

This range renders the Home view's department filter bar and the grid of specialty case cards (`CASES_DB`), then holds the chat-based specialty simulation engine: session start, patient avatar, suggested/typed questions, safety rules for medication/allergy/radiation, workup catalog, result cards (lab tables, images), and justification of off-indication tests. State is kept in the global `simState`; everything is DOM-bound and written with inline string templates. In today's UI the card "start" path is blocked by a guard at line 4266 (the click returns to Home), so most of the engine is reachable only through the session-restore path (6549–6551) and a few other callers (see Features). Nothing in the range reads the network.

## Features and user journeys implemented here

| # | Feature | Reachability | Evidence |
|---|---|---|---|
| 1 | Department filter tabs (8 buttons, `role=tab`, re-render cards on click) | live | `renderDepartmentFilterBar` 4134–4159, called 6004, 6541, 6695. Probe: `#dept-filter-bar` had 8 buttons for `med_student`. |
| 2 | Case card grid with count label «حالة واحدة / حالتان / N حالات / N حالة», empty state, extra level/status filter via `nbFilterBar('case-filter2')` and `nbFltPass` | live | 4161–4225. Probe: 7 cards, 0 locked, 8 departments, 7 entries in `CASES_DB`. Called also at 2445, 2574. |
| 3 | Locked card: button text «مقفلة», click shows a toast from `nbLockInfo` | live (code), no locked case seen for `med_student` in the probe | 4214–4218; `nbLockInfo` at 2489. |
| 4 | Card "ابدأ الحالة" -> `startSimulationSession(id,false,true)` | dormant: guard `if (goToSim && !isEmergencyMode) { navigateTo('home'); return; }` at 4266. Probe: clicking the first unlocked card left `currentView` = `home`, `view-sim` stayed hidden. | 4220, 4266; `REMOVED_VIEWS` (1678) also contains `sim`, so `navigateTo('sim')` redirects to home (1949). |
| 5 | Start from university portal button and guided-lesson button | dormant (same guard) | 6896, 4006 (4006 only if the case is not in `NB_NURSE_CASES`). |
| 6 | Restore of an active session on page load: initialises `simState`, chat DOM and panels but does not navigate (goToSim=false) | live code path, but `ACTIVE_SIM` is written only at 4376 (`goToSim` true and emergency mode) | 6549–6551; 4375–4378. Whether any flow ever writes `ACTIVE_SIM` in the current UI: not determined (the only emergency+goToSim caller found is the retry button 2549, whose `isER` comes from `isEmergencyRandomMode` at 5165). |
| 7 | Chat: suggested question chips, typed question matching by regex, patient reply, emotion change, evidence counter | dormant: `processChatTurn` is called from chips (4420) and the send button (6766); the `view-sim` section cannot be shown (see 4) | 4404–4529. |
| 8 | Medication/allergy safety check in chat (regex on typed text), -15 points recorded in `simState.safetyMistakes` | dormant (same) | 4452–4474. |
| 9 | Workup catalog, result cards with lab table and image + lightbox, interpretation box that appends to the scratchpad | dormant (same) | 4596–4799; `openMedicalLightbox` at 4983. |
| 10 | Justification of an off-indication test (card form or free chat), scored by `evaluateScientificJustification` | dormant (same); the same function is also used at 5073 in the report | 4425–4431, 4478–4491, 4747–4796. |
| 11 | Safety rules on workup request: allergy before medication/contrast, pregnancy before X-ray/CT for women 12–50, case-specific `requiresQuestion` | dormant (same) | 4809–4921. |
| 12 | Bidi/glue helper `nbBidi` wraps Latin terms and readings in LRI/PDI isolates; `copy` listener strips the invisible marks | live: `nbBidi` is also called from 3699, 4991, 5523, 5569, 5611; copy listener registers at load | 4531–4547. |
| 13 | Optional speech synthesis (`ar-JO`) of patient replies via `#sim-tts-toggle` | dormant (same) | 4519–4527. |

## Declarations

Layers: D domain, A application, I infrastructure, P presentation, B browser. "State" lists globals declared elsewhere (script.js:1694–1710 etc.). All functions are top-level function declarations in the classic script.

| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| (section comments) | 4131–4133, 4227–4229 | comment | section headings "4. HOME VIEW", "5. SIMULATION ENGINE" | - | - | - |
| renderDepartmentFilterBar | 4134–4159 | function | builds one tab button per department; click sets filter, re-renders bar and cards | P | R `DEPARTMENTS`, `selectedDeptFilter`; W `selectedDeptFilter`; DOM `#dept-filter-bar` | 4154, 6004, 6541, 6695 |
| nbCasesLabel | 4161 | function | Arabic count noun: 1, 2, 3–10, 11+ | D (pure text rule) | none | 4189, 4190 |
| renderClinicalCaseCards | 4162–4225 | function | filters `CASES_DB` by department and `nbFltPass`, writes count text, builds `article.v7-case` cards, lock handling, start handler | P | R `CASES_DB`, `selectedDeptFilter`, `DEPARTMENTS`, `NB_CASE_PHOTO`, `authState`; DOM `#cases-cards-grid`, `#cases-empty-state`, `#filtered-cases-count`, `#case-filter2` | 2445, 2574, 4155, 4169 (as callback), 6005, 6542, 6696 |
| updateSimEvidenceCounter | 4230–4235 | function | evidence count = questions asked + (vitals measured ? 1 : 0) + workups requested | D + P | R `simState`; DOM `#sim-evidence-count` | 4366, 4513, 4831, 4855, 4886, 4916, 4954, 6754 |
| updateBeginnerStepsBar | 4237–4256 | function | shows the 4-step bar for students in year 1 or 2 and marks steps done | D (who is beginner) + P | R `authState.user`, `simState`; DOM `#sim-beginner-steps-bar`, `#beg-step-1..4` | 4367, 4514, 4832, 4856, 4887, 4917, 4955, 5095, 6755 |
| hideInlinePatientBannerOnContinue | 4258–4263 | function | hides the first-row patient banner after the first turn | P | DOM `#sim-inline-patient-card` | 4449, 4644 |
| startSimulationSession | 4265–4379 | function | guard and login check; resets globals and `simState`; clears inputs; resets vitals display; builds banner HTML; renders avatar, chips, catalog; first greeting; stores `ACTIVE_SIM`; `navigateTo('sim')` | A | R `authState`, `CASES_DB`; W `activeCaseId`, `isEmergencyRandomMode`, `selectedWorkupCategory`, `simState`, storage `ACTIVE_SIM`; DOM many ids (see below) | 2549, 4006, 4220, 6551, 6896 |
| renderSimAvatar | 4381–4402 | function | initial letter avatar; sets emotion label; computes mouth path, `isFemale`, `isChild` (unused, see Problems) | P | R `simState.caseData`, `simState.emotion`; DOM `#sim-emotion-text`, `#sim-avatar-container` | 4365, 4512 |
| renderSuggestedQuestions | 4404–4423 | function | one chip per `case.questions`, asked chips get a check mark | P | R `simState.caseData`, `simState.askedIds`; DOM `#sim-suggested-questions` | 4368, 4515 |
| evaluateScientificJustification | 4425–4431 | function | accept if length >= 10, not in a blacklist of lazy answers, and (matches a keyword regex or has >= 5 words) | D | none | 4481, 4775, 5073 (er.js:52 copies the rule in a comment) |
| matchTypedQuestion | 4433–4444 | function | maps typed text to a case question by id substring + keyword regex (allergy, pregnancy, chronic, pain/history) | D | R `simState.caseData` | 6766 |
| processChatTurn | 4446–4529 | function | appends nurse bubble; rule 1 medication order check; rule 2 justification via chat; otherwise logs the question, sets emotion, replies after 150 ms, optional TTS | A | R/W `simState` (`safetyMistakes`, `requestedWorkups`, `askedIds`, `askedQuestionsLog`, `emotion`); DOM `#sim-tts-toggle` | 4420, 6766 |
| nbBidi | 4532 | function | wraps Latin parentheticals, `°C` readings and number+unit runs in U+2066/U+2069 | D (text rule) / P | none | 3699, 4558, 4574, 4618, 4622, 4657, 4667, 4681, 4752, 4991, 5523, 5569, 5611 |
| nbGlue | 4535–4540 | function | non-breaking hyphen/space handling inside an isolated run | P | none | 4532 only |
| (copy listener) | 4542–4547 | statement | at load: `document.addEventListener('copy', ...)` removes U+2060, U+2066–2069 and turns NBSP into space | B | `window.getSelection`, `clipboardData` | browser |
| appendSimBubble | 4548–4582 | function | adds system badge or nurse/patient bubble with `sender · mm:ss`, scrolls to bottom | P | R `simState.startTimeMs` (via `getSessionTimestamp`); DOM `#sim-chat-messages` | 4372, 4450, 4462, 4463, 4470, 4485, 4487, 4518, 6756 |
| switchSimSideTab | 4584–4594 | function | toggles `side-pane-vitals/workup` and tab button classes | P | DOM `#side-pane-*`, `#side-tab-*` | 4374, 6726 |
| renderWorkupCatalog | 4596–4639 | function | lists `GENERAL_WORKUP_CATALOG` filtered by category, marks requested, count badge | P | R `selectedWorkupCategory`, `simState.requestedWorkups`; DOM `#dynamic-workup-buttons`, `#workup-count-badge` | 4369, 4833, 4857, 4888, 4918, 4956, 6738 |
| appendWorkupChatCard | 4641–4799 | function | result card in chat: title, time, text, optional image from `DIAG_IMAGES` + lightbox, lab table, interpretation input (appends to scratchpad), justification form for off-indication tests | P (+ D for +5/-5 text) | R `DIAG_IMAGES`; W `req.studentAnalysis`, `req.studentJustification`, `req.justificationEvaluated`, `req.isScientificallyJustified`; DOM `#nurse-scratchpad` | 4830, 4854, 4885, 4915, 4949 |
| requestWorkupItem | 4801–4958 | function | creates a workup entry or a violation entry according to rules A (allergy), B (radiation/pregnancy), case override `requiresQuestion`; duplicates only toast | A + D | R `GENERAL_WORKUP_CATALOG`, `simState`; W `simState.safetyMistakes`, `simState.requestedWorkups` | 4633 |
| renderRequestedWorkupLog | 4960–4967 | function | writes "N فحوصات أُرسلت للشات" | P | R `simState.requestedWorkups`; DOM `#workup-log-status` | 4370, 4834, 4858, 4889, 4919, 4957 |

DOM ids touched by `startSimulationSession`: `nurse-scratchpad`, `handover-diagnosis-input`, `handover-summary-input`, `handover-action-input`, `sim-v-hr`, `sim-v-bp`, `sim-v-spo2`, `sim-v-temp`, `sim-vitals-note`, `sim-chat-messages`; it creates `sim-inline-patient-card`, `sim-avatar-container`, `sim-case-heading`, `sim-patient-age-badge`, `sim-mode-badge`, `sim-emotion-text`, `sim-evidence-count`, `sim-tts-toggle`, `sim-beginner-steps-bar`, `beg-step-1..4`, `sim-inline-intro-note`.

## Shared state, globals and contracts

Defines for others (globals, all functions in the table): `renderDepartmentFilterBar`, `renderClinicalCaseCards`, `startSimulationSession`, `updateSimEvidenceCounter`, `updateBeginnerStepsBar`, `appendSimBubble`, `nbBidi`, `evaluateScientificJustification`, `switchSimSideTab`, `renderWorkupCatalog`, `processChatTurn`, `matchTypedQuestion`. Cross-file use of range symbols outside script.js: none found (grep over `*.js` and `index.html`; `er.js:52` only mentions `evaluateScientificJustification` in a comment).

Contracts defined here:
- `simState` shape, assigned at 4278–4295: `caseData, startTimeMs, emotion, vitalsMeasured, vitalsTimestamp, askedQuestionsLog[{id,label,prompt,timestamp,reason}], askedIds:Set, requestedWorkups[], safetyMistakes[string], submittedDiagnosis, submittedSummary, unjustifiedWorkups, submittedHandover, submittedRecipient, sessionCompleted, sbarSubmitted`. Initial declaration at 1701.
- Workup entry shape (4816–4826, 4935–4947): `id, title, timestamp, resultTitle, resultText, labRows[{param,val,unit,ref}], isImaging, imageKey, isViolation, isExpected, studentAnalysis, studentJustification, justificationEvaluated, isScientificallyJustified`.
- Safety rules key on id substrings: question ids containing `allergy`, `preg`, `menses`, `fetal`, `dm`, `htn`, `renal`, `iron`, `pain`, `onset`, `neuro`, `urine`, `custom`; workup ids `w_admin_med`, `w_ct_contrast`, `w_xray_limb_chest`; case id `case_obgyn_anemia`. Ids found in the data: `q_allergy` (6 cases), `q_preg` (2), `q_weight_allergy`; `menses` not found in any id I searched (`grep -o "id: '...menses...'"`).

Expects from others:
- Globals (script.js): `DEPARTMENTS`, `CASES_DB`, `GENERAL_WORKUP_CATALOG`, `DIAG_IMAGES`, `NB_CASE_PHOTO` (3444), `STORAGE_KEYS` (1684), `authState`, `simState`, `selectedDeptFilter`, `selectedWorkupCategory`, `activeCaseId`, `isEmergencyRandomMode`, `navigateTo` (1948), `openAuthModal`, `showToast` (1835), `safeStorageSet` (1745), `loadScratchpadText` (1820), `saveScratchpadText` (1813), `getSessionTimestamp` (1826), `nbFilterBar`, `nbFltPass` (2322–2323), `nbLockInfo` (2489), `nbStartOsce`, `updateSimLevelHint` (2449, 2504), `openMedicalLightbox` (4983), `nbImgFail` (3442, called from an inline `onerror`).
- Case fields read: `id, deptId, deptName, title, cardSummary, levelLabel, durationMin, image, patient{name,age,gender,initialGreeting}, questions[{id,label,prompt,reply,emotion,reason}], expectedWorkupIds, workupOverrides[wid]{requiresQuestion,violationMsg,resultTitle,resultText,labRows,isImaging,imageKey}`.
- Catalog fields read: `id, title, subtitle, category, defaultResultTitle, defaultResultText, defaultLabRows, isImaging, imageKey`. `DIAG_IMAGES[key]`: `url, fallback, caption`.
- DOM ids owned by index.html listed above; `.sim-side-tab[data-stab]`, `#sim-send-btn`, `#sim-chat-input` are wired at 6726–6766 (outside the range).

## Data, storage and network

| Kind | Detail |
|---|---|
| Network | none in this range. |
| localStorage | `STORAGE_KEYS.ACTIVE_SIM` = `'nabd_v2_active_sim_meta'` (1684); written at 4376 as `{caseId, isEmergencyMode, view:'sim'}` via `safeStorageSet` (JSON, with in-memory fallback store 1745–1750). Cleared at 2064; read at 6549. |
| Scratchpad | read via `loadScratchpadText(user.id, caseId)` (4297); written by `saveScratchpadText(pad.value)` (4736). Key shape lives at 1813–1825 (not in this range). |
| JSON data | none loaded here; all inputs are in-script literals (`CASES_DB`, catalog, images). |
| Timers | `setTimeout(..., 150)` for patient/system replies (4461, 4469, 4483, 4517). |
| Audio | `window.speechSynthesis` with `SpeechSynthesisUtterance`, `lang='ar-JO'`, cancel before speak (4519–4527). |
| Clipboard | `copy` event handler (4542). |
| History API | not used in this range (`navigateTo` is elsewhere). |
| Images | card photo `NB_CASE_PHOTO[c.id] || c.image` (4199), `loading=lazy`; diagnostic image `imgData.url || imgData.fallback` (4675). |

## Calculations and rules worth pinning with a golden-master test

| Name | Lines | Inputs | Outputs | Randomness / time |
|---|---|---|---|---|
| nbCasesLabel | 4161 | integer n | 1 «حالة واحدة»; 2 «حالتان»; n<=10 «N حالات»; else «N حالة» (note n=0 and n<=0 give «0 حالات») | none |
| Card filtering | 4170–4172 | `CASES_DB`, `selectedDeptFilter`, `nbFltPass` | ordered list of cases (insertion order of `Object.values`) | none |
| Card summary rewrite | 4212 | `cardSummary` | replaces every «وحساسية دوائية» with «ويتطلب استقصاء السوابق الدوائية» | none |
| Evidence count | 4233 | askedQuestionsLog length, vitalsMeasured, requestedWorkups length | integer | none |
| Beginner test | 4241 | `user.role==='student'` and year 1 or 2 | boolean | none |
| evaluateScientificJustification | 4425–4431 | text | boolean: false if trimmed length < 10; false if whole text equals one of 9 lazy phrases (4428); true if keyword regex (4429) matches or word count >= 5 | none |
| matchTypedQuestion | 4433–4444 | lower-cased text, case questions | first matching question or null; order = question order; four regex families | none |
| Medication order rule (chat) | 4453–4474 | text, whether a matched chip question, asked allergy | safetyMistakes message (deduped by string), system bubble, return; two messages: "not asked allergy" vs "conflicts with allergy" | 150 ms delay only |
| Justification via chat | 4477–4491 | first request with `!isExpected && !isViolation && !justificationEvaluated`, text without «؟» | sets fields on that entry, system message | 150 ms |
| Emotion / avatar label | 4388–4393 | emotion | «متألم» default; «يتجاوب» for `open` or `relaxed` | none |
| Workup rule A | 4810–4861 | wid, asked allergy, case has allergy question | `w_admin_med` or `w_ct_contrast` (case with allergy question) before allergy asked: -15 violation; `w_admin_med` after allergy asked: always violation | `getSessionTimestamp()` (mm:ss from `startTimeMs` via `Date.now()`) |
| Workup rule B | 4864–4891 | gender female and age 12–50, wid `w_xray_limb_chest` or `w_ct_contrast`, asked preg/menses/fetal, case not `case_obgyn_anemia` | radiation violation entry | timestamp |
| Case override rule | 4893–4921 | `requiresQuestion` not asked | violation entry with `violationMsg`, lab rows from override | timestamp |
| Normal entry build | 4923–4949 | override fields over catalog defaults, `expectedWorkupIds` | entry added to the front (`unshift`); duplicate -> toast only | timestamp |
| nbBidi / nbGlue | 4532–4540 | any string | string with U+2066/2069/2060/00A0 inserted; short runs (<= 24 chars) get NBSP for all spaces | none |

## Problems

| Severity | Kind | Evidence |
|---|---|---|
| high | architecture | The only guard that decides where a case start goes (`goToSim && !isEmergencyMode` -> home, 4266) makes every card/guided/university start a no-op (verified by probe), while `sim` is also in `REMOVED_VIEWS` (1678). About 700 lines of engine are therefore reachable only from the restore path (6551) and `view-sim` cannot be shown. Dead-vs-planned status needs an owner decision. |
| high | architecture | Business rules (allergy, pregnancy, radiation, justification scoring, point values -15/+5/-5) are embedded in DOM handlers and message strings: `processChatTurn` 4453–4491, `requestWorkupItem` 4809–4921, `appendWorkupChatCard` 4756, 4780, 4784. The points quoted in text are not computed here; where the real score is computed is not determined (outside range). |
| medium | duplication | The "build violation entry, replace-or-unshift, append card, refresh four views" block is copied four times (4816–4834, 4840–4858, 4871–4889, 4900–4919). The rule-1 text appears again in chat (4459–4472). `evaluateScientificJustification` is mirrored in er.js:52 (comment). |
| medium | bug | Chat rule 2 (4478) swallows any free text without «؟» as a "justification" whenever an unjustified off-indication workup exists, including a typed history statement or a command that did not match a question. The card form (4767–4787) also sets `justificationEvaluated` without notifying the chat flow. |
| medium | bug | Rule A: `w_admin_med` with allergy already asked is always a violation (4836–4860), independent of the case data (cases without any allergy). `existingIdx` replacement (4827, 4851, 4882, 4911) can overwrite an earlier valid result of the same id. |
| medium | architecture | Hard-coded id strings and substring tests (`'allergy'`, `'preg'`, `'menses'`, `'fetal'`, `c.id !== 'case_obgyn_anemia'` at 4867, `w_admin_med`, `w_ct_contrast`) tie rules to data naming; `menses` was not found in any question id. |
| low | dead-code | `renderSimAvatar` computes `isFemale`, `isChild`, `mouth` (4385–4388) and never uses them; the SVG face was replaced by an initial letter (4401). `updateSimEvidenceCounter` / `hideInlinePatientBannerOnContinue` are fine; `renderRequestedWorkupLog` only sets one status line (4960–4967). `nbGlue` is used only by `nbBidi`. |
| low | security | Card and result markup is built with `innerHTML` from data fields: `c.deptName`, `c.levelLabel`, `c.image`, `c.patient.name`, `r.param/val/unit/ref` (4199–4206, 4326–4328, 4703–4710), `imgData.caption` (4681). All sources are in-script literals today, so no user input reaches them; chat text uses `textContent`. If cases become server data, these must be encoded. |
| low | maintainability | `startSimulationSession` swallows errors from `updateSimLevelHint`/`nbStartOsce` (4267) and mixes state reset, DOM template (about 60 lines) and navigation; side effects on load via the module-level `copy` listener (4542). Time and clock are read through `Date.now()` in `getSessionTimestamp`, which makes tests need a fake clock. |
| low | maintainability | Comment at 4746 and messages mix Arabic/English/dialect; user-facing strings are inline (no resource file), 25+ Arabic messages in 4459–4487 and 4813–4951. |

## Proposed source fragments

Start lines checked against `.work/script-cuts.txt`. All ranges validated with `check-fragment.mjs` (all ok).

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | home-dept-filter-bar.js | 4131–4160 | department tab bar rendering | presentation |
| 2 | home-case-cards.js | 4161–4226 | case count label, card grid rendering, lock handling | presentation |
| 3 | sim-progress-indicators.js | 4227–4264 | evidence counter, beginner steps bar, banner hide | presentation (rule: beginner test, evidence count) |
| 4 | sim-session-start.js | 4265–4380 | start/restore a simulation session, build initial state and chat shell | application |
| 5 | sim-avatar-and-suggested-questions.js | 4381–4424 | avatar and suggested question chips | presentation |
| 6 | sim-chat-turn-rules.js | 4425–4530 | justification rule, typed-question matching, one chat turn with medication check | domain / application |
| 7 | sim-bidi-text-helpers.js | 4531–4547 | Latin isolate/glue helpers and copy clean-up | browser |
| 8 | sim-chat-bubbles.js | 4548–4583 | chat bubble rendering | presentation |
| 9 | sim-workup-catalog-ui.js | 4584–4640 | side tabs and workup catalog buttons | presentation |
| 10 | sim-workup-result-card.js | 4641–4800 | result card, lab table, image, interpretation and justification forms | presentation |
| 11 | sim-workup-request-rules.js | 4801–4968 | workup request rules (allergy, radiation, overrides), requested-workup log | domain / application |

## Open questions

1. Is the guard at 4266 (and `sim` in `REMOVED_VIEWS`) intentional, so that the specialty simulation is retired and only the ER/respiratory rooms remain, or is it a temporary lock? This decides whether fragments 3–11 are ported or kept as an archived module.
2. Which flow, if any, writes `ACTIVE_SIM` today (4376 needs emergency mode with `goToSim` true, which then redirects home)? Not determined.
3. Where is the final score computed from `safetyMistakes`, `isScientificallyJustified` and the +5/-5/-15 values (likely the report at ~5073–5165)? This range only records the inputs.
4. Should `w_admin_med` always be a violation after the allergy question (4836), or should it depend on whether the case patient has an allergy?
5. `menses` is checked at 4866 but no question id contains it; is a case expected to add one?
6. Cases with `nbLockInfo` locked state: no locked card appeared for `med_student` in the probe; which accounts see locked cards (`rana`, `doctor`) was not probed.
