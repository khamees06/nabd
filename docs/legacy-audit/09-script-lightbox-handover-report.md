# Image lightbox, SBAR handover submission and report generation — script.js:4969–5305

All line numbers refer to `script.js` at commit 5f431d5 unless another file is named. "Verified live" means the behaviour was observed in the running legacy page at `http://127.0.0.1:5180/` through `tools/legacy/browser-probe.mjs` (headless Chrome, throwaway profile, 1440x900).

## Purpose

The range holds two unrelated parts of the legacy (pre-ER-room) simulator. Lines 4969–5004 implement a modal image viewer ("medical lightbox") with a zoom level clamped to 75–350 % and a reference to the workup entry whose image is shown. Lines 5005–5046 open and close the SBAR handover modal and build, inside it, one justification input per "extra" workup (requested, not expected by the case, not a safety violation). Lines 5047–5305 are one function, `finalizeSessionAndBuildReport`, which reads the handover form, classifies extra workups, applies one case-specific rule, computes the session score and pass/fail, updates the user's strengths, weaknesses, history and statistics, persists the account, renders the four tables of the debrief report and navigates to the debrief view. The lightbox is reachable today; the handover modal and the report builder are dormant because the legacy simulation view can no longer be opened.

## Features and user journeys implemented here

| # | Feature (what the user sees or does) | Reachability | Evidence |
|---|---|---|---|
| 1 | Professor opens a student's attempt and presses "معاينة وتكبير الصورة المرفقة": the lightbox opens over the attempt modal with the diagnostic image and a title "`<workup title>` — محاولة `<student name>`". | live | Call at 5652 inside `openStudentAttemptDetailModal` (5595). Verified live: `nbDemoLogin('doctor')` → `navigateTo('university')` → tab `#nb8-tab-reports` → 7 visible `[data-stu-id]` buttons in `#uni-prof-cohort-tbody` → `stu_zaid` → 2 visible `.stu-modal-zoom-img-btn` → click → `#medical-image-lightbox` has class `flex`, not `hidden`, title set, `scale(1)`, badge `100%`. The same modal is also opened from `[data-nb8-open-stu]` (6496, tab `#nb8-tab-progress`, 7 visible buttons). |
| 2 | Zoom controls in the lightbox: "تكبير +" (+40), "تصغير −" (−40), 200 %, 300 %, reset (100 %); badge shows the percentage. | live | Handlers at 6792–6796 call `applyLightboxZoom` (4975). Verified live sequence from 100: +40 → 140; 300; +40 → 340; +40 → 350; +40 → 350; reset → 100; −40 → 75; −40 → 75; 200 → badge `200%`, `transform: scale(2)`. |
| 3 | Close the lightbox with ✕ or the Escape key. | live | 6797 (`#close-lightbox-btn`), 6568 (global Escape handler, which also closes the handover modal, the auth modal and the student attempt modal in the same key press, 6563–6570). Verified live: Escape hides the lightbox. No backdrop-click close exists (the only references to `medical-image-lightbox` in all scripts are 4984 and 4999). |
| 4 | Quick note in the lightbox ("حفظ استنتاجي ✓"): the note is pre-filled from `workupRef.studentAnalysis`, and on save is written back to the workup entry and appended to the clinical scratchpad. | live for the save handler; the pre-fill / write-back to a workup entry is dormant | Pre-fill at 4992; save handler at 6798–6810 (outside the range) reads `activeLightboxWorkupRef` (set at 4989). The only callers that pass a `workupRef` are 4678 and 4682 in `appendWorkupChatCard` (4641), which renders into the dormant sim view. In the live professor path `workupRef` is `null`, the note input and save button are still visible (verified live) and saving appends to `#nurse-scratchpad` and to `localStorage` (see Problems, row 4). |
| 5 | Student clicks a workup image (or "تكبير الفحص") in the simulator chat to zoom it and record a reading. | dormant | Calls at 4678, 4682. The sim view cannot be opened: `REMOVED_VIEWS` contains `'sim'` (1678) and `navigateTo` rewrites it to `'home'` (1949); `startSimulationSession` returns to home for non-emergency starts (4266); `scope.css` hides `#home-cases-anchor` (case cards). Verified live: `navigateTo('sim')` leaves `currentView === 'home'` and `#view-sim` keeps class `hidden`. |
| 6 | Student presses "تسليم SBAR" in the simulator: the handover modal opens; if extra workups exist, an amber box lists one justification input per extra workup, pre-filled with any justification already typed in chat. | dormant | `openHandoverModal` (5008) is called only from the click listener on `#open-handover-modal-btn` (6813); that button is inside `#view-sim` (index.html:844, section starts at index.html:806) and was not visible in the live page. The OSCE timer clicks the same button programmatically (2521), but the timer stops on its second tick when `#view-sim` is hidden (2517), and the OSCE switch is hidden by `scope.css` (`label.nb-switch:has(#osce-toggle)`). Function still works when called directly (verified live: box shown, 1 input for 1 extra workup). |
| 7 | Close the handover modal with ✕, "العودة لاستكمال الجلسة" or Escape. | dormant as a user journey; the Escape call is live as a no-op | 6814, 6815, 6567. `closeHandoverModal` (5040) runs on every Escape press even though the modal is never open. |
| 8 | "سلّم واعرض التقرير": the session is closed, scored and persisted, and the debrief report (score, pass/fail, four evidence tables, SBAR vs. model answer) is shown. | dormant | `finalizeSessionAndBuildReport` (5047) is called only from 6825 (`#confirm-handover-submit-btn`, inside the handover modal, index.html:1947). The modal cannot be opened (row 6). Verified live that a direct call still works end to end: view becomes `debrief`, `#debrief-report-content` is shown, account saved to `nabd_v2_accounts_map`. |
| 9 | Not signed in when submitting: the login modal opens and nothing else happens. | dormant | 5048–5051. Verified live by direct call on the landing page: auth modal shown, no exception. |
| 10 | Legacy report content in the "debrief" view. | dormant | The debrief view itself is reachable (sidebar item, index.html:226), but `navigateTo('debrief')` shows `#debrief-report-content` only when `hasCompletedSessionInRun && simState.sessionCompleted && simState.sbarSubmitted` (1981); these are set to true only at 5092–5094. Otherwise the empty state is shown, or the ER room report takes over (`window.nbErReport`, 1978, er.js:4697). Verified live: after sign-in `navigateTo('debrief')` shows the empty state. |

Searches run for reachability (all scripts and index.html): `grep -n "<name>" *.js index.html` for each of `activeLightboxZoom`, `activeLightboxWorkupRef`, `applyLightboxZoom`, `openMedicalLightbox`, `closeMedicalLightbox`, `openHandoverModal`, `closeHandoverModal`, `finalizeSessionAndBuildReport`; `grep -n -i "lightbox"` in er.js, resp.js, ui.js, motion.js, terms.js and all CSS; `grep -n "showOnlySection\|view-sim\|'sim'"`; `grep -n "startSimulationSession"`; `grep -n "REMOVED_VIEWS\|PROTECTED_VIEWS"`. No name of this range is referenced from index.html inline handlers, er.js, resp.js, ui.js, motion.js or terms.js.

## Declarations

| Name | Lines | Kind | Responsibility | Layer | Shared state read / written | Called from |
|---|---|---|---|---|---|---|
| `activeLightboxZoom` | 4972 | `let` global (number, initial 100) | Current zoom percentage of the lightbox image. | presentation (view state) | written 4976; read 4979, 4980, 6792, 6793 | `applyLightboxZoom`; zoom handlers in `initNabdApp` (6792–6793) |
| `activeLightboxWorkupRef` | 4973 | `let` global (object or null) | Reference to the `simState.requestedWorkups` entry whose image is open; lets the note handler write `studentAnalysis` back into that entry. | presentation state holding a reference to a domain object | written 4989; read 6801 | `openMedicalLightbox`; save-note handler (6798–6810) |
| `applyLightboxZoom(pct)` | 4975–4981 | function | Clamp `pct` to 75–350, store it, set `transform: scale()` on `#lightbox-img`, write the percentage to `#zoom-level-badge`. | presentation (the clamp is a small UI rule) | writes `activeLightboxZoom`; DOM `#lightbox-img`, `#zoom-level-badge` | 4993; 6792–6796 |
| `openMedicalLightbox(imgSrc, title, workupRef = null)` | 4983–4996 | function | Show the lightbox: store the workup reference, set image source and title (through `nbBidi`, default title when empty), pre-fill the note from `workupRef.studentAnalysis`, reset zoom to 100, swap classes `hidden` → `flex`. Returns silently if the modal or image element is missing. | presentation | writes `activeLightboxWorkupRef`; reads `workupRef.studentAnalysis`; calls `nbBidi` (4532); DOM `#medical-image-lightbox`, `#lightbox-img`, `#lightbox-title`, `#lightbox-quick-note` | 4678, 4682 (`appendWorkupChatCard`, dormant); 5652 (`openStudentAttemptDetailModal`, live) |
| `closeMedicalLightbox()` | 4998–5003 | function | Hide the lightbox (classes `flex` → `hidden`). Does not clear `activeLightboxWorkupRef`, the image source or the note. | presentation | DOM `#medical-image-lightbox` | 6568 (Escape), 6797 (✕), 6809 (after saving a note) |
| `openHandoverModal()` | 5008–5038 | function | Compute the extra workups (5011–5013), rebuild the justification inputs in `#handover-extra-workups-list` or hide the box, then show `#handover-modal`. | presentation, with one domain filter inline (5013) | reads `simState.caseData.expectedWorkupIds`, `simState.requestedWorkups[*].{id,title,isViolation,studentJustification}`; DOM `#handover-modal`, `#handover-extra-workups-box`, `#handover-extra-workups-list`; creates `input.extra-workup-just-input[data-extra-wid]` | 6813 (click on `#open-handover-modal-btn`); indirectly 2521 (programmatic click from the OSCE timer) |
| `closeHandoverModal()` | 5040–5045 | function | Hide `#handover-modal`. | presentation | DOM `#handover-modal` | 5097; 6567 (Escape); 6814; 6815 |
| `finalizeSessionAndBuildReport()` | 5047–5304 | function (259 lines) | See the segment table below. | mixed: application + domain + infrastructure + presentation | see segment table | 6825 (click on `#confirm-handover-submit-btn`) |

Segments inside `finalizeSessionAndBuildReport` (not separate declarations; listed because each belongs to a different layer):

| Lines | Responsibility | Layer | State read / written |
|---|---|---|---|
| 5048–5051 | Authentication guard: open login modal and stop. | application | reads `authState`; calls `openAuthModal('login')` |
| 5053–5057 | Read recipient, diagnosis, S&B and A&R from the form into `simState`. | presentation (input reading) | writes `simState.submittedRecipient`, `.submittedDiagnosis`, `.submittedSummary`, `.submittedHandover`; DOM `#handover-recipient`, `#handover-diagnosis-input`, `#handover-summary-input`, `#handover-action-input` |
| 5059–5070 | Copy non-empty modal justification inputs into the matching workup entries. | presentation (input reading) | reads `.extra-workup-just-input`; writes `requestedWorkups[*].studentJustification` |
| 5072–5080 | Classify every extra workup as justified or unjustified. | domain | calls `evaluateScientificJustification` (4425); writes `requestedWorkups[*].isScientificallyJustified`, `simState.justifiedBonusWorkups`, `simState.unjustifiedWorkups` |
| 5082–5090 | Case-specific rule: in `case_obgyn_dysmenorrhea` and `case_gi_allergy`, add a safety mistake when question `q_preg` was not asked. | domain | reads `c.id`, `simState.askedIds`; writes `simState.safetyMistakes` |
| 5092–5097 | State transition to "submitted and completed"; refresh beginner step bar; close modal. | application | writes `simState.sbarSubmitted`, `simState.sessionCompleted`, `hasCompletedSessionInRun`; calls `updateBeginnerStepsBar` (4237), `closeHandoverModal` |
| 5099–5120 | Score calculation. | domain | reads `c.questions`, `simState.askedQuestionsLog`, `.vitalsMeasured`, `.requestedWorkups`, `.submittedSummary`, `.submittedHandover`, `.justifiedBonusWorkups`, `.safetyMistakes`, `.unjustifiedWorkups` |
| 5122–5137 | Add weakness and strength sentences to the user profile. | domain (derivation) + mutation of the account object | writes `authState.user.weaknesses`, `.strengths` |
| 5138 | Pass rule. | domain | — |
| 5140–5151 | Prepend a history entry, update statistics, persist the account. | application + infrastructure | writes `authState.user.history`, `.stats.completed`, `.stats.avgEr` or `.stats.avgSpec`; reads `isEmergencyRandomMode`; calls `saveAccountToStorage` (1787) |
| 5153–5171 | Report header: type badge, title, subtitle, total, pass status, discovered count. Line 5165 calls `nbAfterReport` (2530) inside try/catch. | presentation; 5165 is an application hook | DOM `#rep-eval-type-badge`, `#rep-main-title`, `#rep-case-subtitle`, `#rep-total-score`, `#rep-pass-status`, `#rep-discovered-count` |
| 5173–5191 | Build the five "evidence" sentences. | presentation (text derived from domain facts) | reads `simState.vitalsTimestamp`, `c.vitalsInitial.{hr,bp}`, timestamps of questions and workups |
| 5193–5230 | Competency table (5 fixed rows). | presentation | DOM `#rep-competency-tbody` (`innerHTML`) |
| 5232–5248 | Inquiry table (one row per case question). | presentation | DOM `#rep-inquiry-tbody` (`innerHTML`); reads `c.questions[*].{id,label,reason}` |
| 5250–5282 | Workup table (expected workups, then extra and violation entries). | presentation | DOM `#rep-workup-tbody` (`innerHTML`); reads `GENERAL_WORKUP_CATALOG` (28) |
| 5284–5300 | SBAR comparison table: student text next to `c.idealSummary` / `c.idealHandover`; cells are created by `innerHTML`, then filled with `textContent`. | presentation | DOM `#rep-handover-tbody`; creates `#rep-user-summary-cell`, `#rep-ideal-summary-cell`, `#rep-user-handover-cell`, `#rep-ideal-handover-cell` |
| 5302–5303 | Refresh the profile view and navigate to the debrief view. | application | calls `renderProfileView` (5309), `navigateTo('debrief')` (1948) |

## Shared state, globals and contracts

Defined here for other code:

| Item | Contract |
|---|---|
| `activeLightboxZoom`, `activeLightboxWorkupRef` | Read directly by handlers in `initNabdApp` (6792, 6793, 6801). |
| `applyLightboxZoom`, `openMedicalLightbox`, `closeMedicalLightbox`, `openHandoverModal`, `closeHandoverModal`, `finalizeSessionAndBuildReport` | Global functions; all event wiring is in `initNabdApp` (6562–6572, 6791–6825), none in index.html. |
| `simState.justifiedBonusWorkups` | Created at 5062; not part of the initial `simState` shape (1701–1718) or of the reset in `startSimulationSession` (4278–4295). Only read inside this range. |
| `requestedWorkups[*].isScientificallyJustified` | Re-computed at 5074 for every extra workup; also written at 4482 and 4776. |
| `hasCompletedSessionInRun = true`, `simState.sbarSubmitted = true`, `simState.sessionCompleted = true` | The three flags `navigateTo('debrief')` tests at 1981; `sbarSubmitted` is also read by `updateBeginnerStepsBar` (4255). |
| History entry shape | `{ caseTitle, mode, date, workupCount, score }` (5141–5147), where `score` is the string `"<n>% (مجتاز)"` or `"<n>% (غير مجتاز)"`. `nbAfterReport` (2537) then adds `caseId, num, passed, mistakes, osce, ts` to the same entry and saves again (2550). |
| `authState.user.weaknesses` / `.strengths` | New sentences are added at the front (5128, 5131, 5135). Read by `renderProfileView` (5346–5347), `nbRenderMistakes` (2592) and, as the first three items, in the request body of `nbCoachAsk` (5885). |
| `authState.user.stats` | `completed = history.length`; `avgEr` (emergency mode) or `avgSpec` (otherwise) set to the string `"<totalScore>%"` (5148–5150). |
| DOM created | `input.extra-workup-just-input[data-extra-wid]` (5026), read back at 5063; four `#rep-*-cell` ids (5288–5294). |

Expected from other code:

| Kind | Items |
|---|---|
| Globals (script.js) | `simState` (1701), `authState` (1688), `isEmergencyRandomMode` (1696), `hasCompletedSessionInRun` (1698), `GENERAL_WORKUP_CATALOG` (28; fields `id`, `title`) |
| Functions (script.js) | `nbBidi` (4532), `openAuthModal` (2073), `evaluateScientificJustification` (4425), `updateBeginnerStepsBar` (4237), `saveAccountToStorage` (1787), `nbAfterReport` (2530), `renderProfileView` (5309), `navigateTo` (1948) |
| Case object fields (`simState.caseData`, from `CASES_DB`, inline at 214 ff. and custom cases from 5957) | `id`, `title`, `deptName`, `expectedWorkupIds[]`, `questions[] {id, label, reason}`, `patient {name, age}`, `vitalsInitial {hr, bp}`, `idealSummary`, `idealHandover` |
| Workup entry fields (`simState.requestedWorkups[*]`, built at 4816–4826, 4840–4850, 4871–4881, 4900–4910, 4932–4947) | `id`, `title`, `timestamp`, `isViolation`, `resultText`, `studentAnalysis`, `studentJustification`, `isScientificallyJustified` |
| Other session fields | `simState.askedQuestionsLog[] {id, timestamp}`, `simState.askedIds` (Set), `simState.vitalsMeasured`, `simState.vitalsTimestamp`, `simState.safetyMistakes[]` (strings) |
| Account fields | `authState.user.history[]`, `.stats`, `.weaknesses`, `.strengths` (`history` and `stats` are used without a null check at 5141, 5148) |
| DOM ids in index.html | Lightbox: `medical-image-lightbox` (2097), `lightbox-title` (2102), `zoom-level-badge` (2106), `lightbox-img` (2117), `lightbox-quick-note` (2123). Handover modal: `handover-modal` (1893), `handover-recipient` (1914), `handover-diagnosis-input` (1921), `handover-extra-workups-box` (1924), `handover-extra-workups-list` (1927), `handover-summary-input` (1932), `handover-action-input` (1937). Report: `rep-eval-type-badge` (985), `rep-main-title` (988), `rep-case-subtitle` (989), `rep-total-score` (995), `rep-pass-status` (999), `rep-discovered-count` (1003), `rep-competency-tbody` (1025), `rep-inquiry-tbody` (1047), `rep-workup-tbody` (1068), `rep-handover-tbody` (1089). |
| CSS | Tailwind-style utility classes `hidden` / `flex` toggled on both modals; `.img-zoom-stage img { transition: transform … }` (style.css:383–384) animates the zoom; `#close-lightbox-btn` (theme.css:555); `#confirm-handover-submit-btn`, `#cancel-handover-btn` (style.css:2139–2140). |

## Data, storage and network

| Kind | Detail |
|---|---|
| Network | None in the range. No `fetch`, no data/*.json file is read. Indirect: weaknesses written at 5128/5131 are later sent (first three) in the body of `nbCoachAsk` (5885) when a coach endpoint is configured; that code is outside the range. |
| localStorage (written indirectly) | `nabd_v2_accounts_map` through `saveAccountToStorage(u)` at 5151 (and again inside `nbAfterReport`, 2550). Shape: object keyed by account id; each value is a deep copy of the whole account object (name, email, role, `passwordSalt`/`passwordHash` for registered accounts, `stats`, `strengths`, `weaknesses`, `recommendations`, `history`). `safeStorageSet` (1745–1752) also mirrors the value into `window.name` under the prefix `__NABD_STORE__:`. Verified live: after a direct call the map contained key `med_student` (a demo account). |
| localStorage (related, outside the range) | The lightbox save-note handler (6798–6810) writes `nabd_v2_scratchpads` through `saveScratchpadText` (1813): object keyed `"<userId>__<caseId>"` → text. `nabd_v2_active_sim_meta` (`{caseId, isEmergencyMode, view}`, written at 4376) is not cleared by the submit function; it is removed only on logout (2064). |
| sessionStorage | None. |
| Timers | None in the range. (`nbAfterReport` may start one 600 ms toast timer, 2552.) |
| Audio / speech | None. |
| History API | None in the range; `navigateTo('debrief')` (5303) does not push state on this path. |
| Time | `new Date().toISOString().slice(0, 10)` at 5144 (UTC calendar date). Timestamps shown in the report (`mm:ss`) were produced earlier by `getSessionTimestamp` (1826–1832, `Date.now()` based). |
| Randomness | None. |
| Console | `console.error(e)` at 5165 if `nbAfterReport` throws. |

## Calculations and rules worth pinning with a golden-master test

| # | Name | Lines | Inputs | Outputs | Randomness / time |
|---|---|---|---|---|---|
| 1 | Zoom clamp | 4975–4981 | `pct` | `activeLightboxZoom = max(75, min(350, pct))`; `transform: scale(pct/100)`; badge `"<pct>%"`. Verified sequence in Features row 2. Non-numeric input is not guarded: `applyLightboxZoom(NaN)` gives badge `NaN%` (verified live; no caller passes a non-number). | none |
| 2 | Extra-workup list of the modal | 5011–5034 | `caseData.expectedWorkupIds`, `requestedWorkups` | One input per entry with `id` not expected and `isViolation` false; box hidden when the list is empty. | none |
| 3 | Justification collection and classification | 5063–5080 | Modal inputs, `requestedWorkups`, `evaluateScientificJustification` (4425–4431: text shorter than 10 characters → false; exact match of a short list of dismissive phrases → false; otherwise true if a clinical keyword matches or the text has at least 5 words) | A non-empty modal input overrides the stored justification; every extra workup is re-evaluated regardless of `justificationEvaluated`; titles go to `justifiedBonusWorkups` or `unjustifiedWorkups`. An extra workup with no justification is unjustified. | none |
| 4 | Menstrual-history rule | 5083–5090 | `c.id` in {`case_obgyn_dysmenorrhea`, `case_gi_allergy`}, `askedIds.has('q_preg')` | Adds one of two fixed sentences to `safetyMistakes` (once). Verified live: submitting either case with nothing asked yields exactly 1 safety mistake. | none |
| 5 | Score | 5099–5120 | Counts and flags listed below | `inquiryScore = round(asked / totalQuestions × 35)` (0 if the case has no questions); `vitalsScore = 15` if vitals measured; `workupScore = min(20, round(matched / expected × 20))` where matched = non-violation entries whose id is expected (0 if no expected ids); `summaryScore` and `handoverScore` = 0 if the text is empty or there is no clinical evidence (no question asked, vitals not measured, no matched workup), else 15 when the trimmed text has at least 20 characters, else 7; `bonus = 5 × justified extras`; `penalty = 15 × safetyMistakes + 5 × unjustified extras`; `total = clamp(0, 100, sum + bonus − penalty)`. | none |
| 6 | Pass rule | 5138 | `totalScore`, `safetyMistakes.length` | `isPassing = totalScore >= 60 && safetyMistakes.length === 0` | none |
| 7 | Strength / weakness sentences | 5122–5137 | `unjustifiedWorkups`, `safetyMistakes`, `justifiedBonusWorkups`, `c.title` | Sentences prepended to `user.weaknesses` / `user.strengths` when not already present (exact string match). | none |
| 8 | History entry and statistics | 5140–5151 | `c.title`, `c.deptName`, `isEmergencyRandomMode`, `requestedWorkups.length`, `totalScore`, `isPassing` | Entry shape above; `mode` = `'غرفة الطوارئ العشوائية'` or `` `تدريب تخصصي (${deptName})` ``; `stats.completed = history.length`; `stats.avgEr` or `stats.avgSpec` = last score as a string (not an average). | `new Date()` at 5144 (UTC date); `nbAfterReport` adds `ts: Date.now()` |
| 9 | Report header texts | 5153–5171 | mode, `isPassing`, `totalScore`, case and patient fields, diagnosis | Three possible titles: pass; fail with `totalScore === 0`; fail otherwise. Subtitle includes the typed diagnosis or `'غير مدون'`. | none |
| 10 | Report tables (HTML snapshot of the four `tbody` elements) | 5173–5300 | all of the above | Competency row 3 shows `max(0, workupScore − penalty) / 20` (5213), i.e. the whole penalty is subtracted from the workup row only; per-question points are `(35 / max(1, totalQuestions)).toFixed(1)` (5233). | session timestamps (time-dependent; freeze `Date.now` or stub `getSessionTimestamp`) |

Reference results verified live (case `case_cardio_dm`: 4 questions, 4 expected workups; demo account `med_student`; driven through `startSimulationSession(id, …, false, false)`, `processChatTurn`, the vitals button, `requestWorkupItem`, then a direct call of the function):

| Scenario | Total | Pass | Competency rows (vitals, inquiry, workup, S&B, A&R) | Note |
|---|---|---|---|---|
| Nothing done, empty SBAR, emergency mode | 0 % | no | 0/15, 0/35, 0/20, 0/15, 0/15 | title "لم تجتز الحالة: لم يُسجَّل أي سؤال أو فحص"; `mode` = emergency label; `stats.avgEr = '0%'` |
| All questions, vitals, all expected workups, 20-character S&B and A&R (`'x'.repeat(20)`, `'y'.repeat(20)`) | 100 % | yes | 15/15, 35/35, 20/20, 15/15, 15/15 | title "اجتزت الحالة" |
| Same, plus one extra workup without justification, two safety mistakes, 5- and 6-character SBAR texts | 49 % | no | 15/15, 35/35, 0/20, 7/15, 7/15 | 35+15+20+7+7 − (30+5) = 49; the five rows add up to 64 |
| Only one extra workup, justified in the modal input; nothing else | 5 % | no | all 0 | bonus only |
| One of four questions asked, one safety mistake | 0 % | no | — | 9 − 15 clamps to 0; title says no question or test was recorded while the counter shows 1/4 |

## Problems

| # | Severity | Kind | Evidence |
|---|---|---|---|
| 1 | high | architecture | `finalizeSessionAndBuildReport` (5047–5304) is one 259-line function that reads form fields (5054–5057, 5063), applies domain rules and scoring (5072–5120, 5138), mutates the account (5124–5150), persists (5151), renders four tables (5153–5300) and navigates (5303). The score cannot be computed without the DOM: inputs are read from elements and results exist only as local constants and rendered text; nothing is returned. |
| 2 | medium | dead-code | The handover modal and the report builder are unreachable in today's UI: `'sim'` is in `REMOVED_VIEWS` (1678, applied at 1949), `startSimulationSession` returns for non-emergency starts (4266), the only opener is a button inside the hidden `#view-sim` (index.html:844). They are still wired at start-up (6813–6815, 6825) and `closeHandoverModal` runs on every Escape (6567). `openMedicalLightbox` callers 4678/4682 are dormant for the same reason. Verified live. |
| 3 | medium | security | User-typed text is inserted into `innerHTML` without escaping: `studentJustification` inside an attribute value (5026) and in table cells (5270, 5271); `studentAnalysis` (5261); `safetyMistakes` strings (5214), one of which embeds raw chat text (4459). Verified live by direct calls: markup placed in each of the three fields produced DOM elements in `#handover-extra-workups-list`, `#rep-workup-tbody` and `#rep-competency-tbody` (execution of an event-handler payload was not tested). The same raw chat text is stored in `user.weaknesses` (5131) and persisted. The S&B / A&R texts are handled safely with `textContent` (5297–5300). An escape helper exists elsewhere (`nrEsc` 3559, `nb8Esc` 6026) but is not used here. Today the path is dormant and the data stays on one device. |
| 4 | medium | bug | Live path: when the professor opens an image from a student attempt (5652, no `workupRef`), `openMedicalLightbox` leaves the note input and "حفظ استنتاجي" button visible (4983–4996 never hide them). Saving (6798–6810) appends the note to `#nurse-scratchpad` and stores it under the professor's own scratchpad key for the default case. Verified live: `nabd_v2_scratchpads` became `{"doctor__case_cardio_dm": "- قراءة الصورة التشخيصية: …"}` and the toast reported a save to the clinical notebook. |
| 5 | medium | bug | Competency row 3 prints `Math.max(0, workupScore - penalty)` (5213): every penalty, including chat medication mistakes and the menstrual-history rule, is subtracted from the workup row only and floored at 0, and the bonus is shown in no row. The rows therefore do not add up to the total (verified: rows 64, total 49). |
| 6 | low | bug | The fail title for `totalScore === 0` states that no question or test was recorded (5159–5161), also when the zero comes from penalties (verified: 1/4 questions asked, title still says none). |
| 7 | low | bug | Latent: an entry with `isViolation: true` whose id is an expected workup is shown as documented evidence with a green tick (5254, 5258–5259, lookup ignores `isViolation`) and is left out of the violations list (5266), while it scores 0 (5104). Reproduced with a synthetic state. No built-in or custom case can produce it with current data (expected ids vs. rules at 4811, 4865–4867 and the `requiresQuestion` overrides). |
| 8 | low | bug | No guard for a missing case: with `simState.caseData === null` the function throws `TypeError` at 5060 after already overwriting four `simState` fields (5054–5057) (verified by direct call). No guard against a second submission of the same session either: each call prepends another history entry (5141). |
| 9 | low | bug | `stats.avgSpec` / `stats.avgEr` are set to the latest score, not an average (5149–5150). In emergency mode 5149 overwrites the average that the ER room computes in er.js:4249 (conflict only if the dormant path runs). |
| 10 | low | bug | The history date is the UTC calendar date (5144), so a session finished between 00:00 and 03:00 Amman time is stored under the previous day. Same expression at 3967 and resp.js:793. |
| 11 | low | maintainability | Scoring weights and thresholds are literals repeated in the calculation and in the rendered strings: 35/15/20/15/15 (5101–5115, 5197–5227, 5233), 5 and 15 (5117–5118, 5270–5271, 5268, and inside the message texts at 5085–5086), 60 (5138, 5161), 20 characters (5112, 5115). The case ids of a clinical rule are hard-coded in the generic report builder (5083). |
| 12 | low | maintainability | S&B and A&R are graded by length only (5110–5115; `'x'.repeat(20)` scored 15/15 live), while the evidence text says the text was written from session evidence (5186, 5190). The typed diagnosis is displayed (5163) but not scored; `simState.submittedRecipient` (5054) is written and never read (searched all scripts). |
| 13 | low | maintainability | `simState.justifiedBonusWorkups` is not declared in the `simState` shape (1701–1718, 4278–4295) and appears only at 5062. Placeholder sentences of new accounts (7099–7100) are never removed when real strengths/weaknesses are added (5128–5135). `weaknesses`, `strengths` and `history` grow without a limit and are stored whole on every save. |
| 14 | low | maintainability | `nabd_v2_active_sim_meta` is not cleared on submission (removed only at 2064), so the next page load of a signed-in non-demo user rebuilds a session for the finished case in the hidden sim view (6549–6552). The history entry is built in two steps in two functions (5141–5147, then 2537) with two storage writes (5151, 2550). |
| 15 | low | duplication | The show/hide class toggle is written four times (4994–4995, 5002–5003, 5036–5037, 5043–5044). The history-entry construction is repeated at 3967, er.js:4239 and resp.js:793 with differing shapes. The extra-workup filter appears three times (5013, 5072, and negated at 5266). |
| 16 | low | maintainability | Both dialogs have `aria-modal="true"` (index.html:1893, 2097) but open/close only toggle classes: no focus is moved in or returned, no focus trap, no backdrop click. The section comment says zoom 100–300 % (4970) while the clamp is 75–350 (4976). The lightbox hint (index.html:2121) and the `cursor-zoom-in` class on the image (index.html:2117) promise click-to-zoom, but no click handler is attached to `#lightbox-img` (its only script references are 4977 and 4985). `closeMedicalLightbox` leaves `activeLightboxWorkupRef` pointing at the last workup entry. |

## Proposed source fragments

Validated with `node tools/legacy/check-fragment.mjs script.js 4969-5004 5005-5046 5047-5305` (all three print `ok`). Start lines 4969, 5005 and 5047 are in `.work/script-cuts.txt`. `finalizeSessionAndBuildReport` is a single function and cannot be cut further without changing the code.

| Order | File name | From–to | Single responsibility | Layer |
|---|---|---|---|---|
| 1 | `medical-image-lightbox.js` | 4969–5004 (36 lines) | Lightbox state (zoom, workup reference), zoom clamp, open and close. | presentation |
| 2 | `sbar-handover-modal.js` | 5005–5046 (42 lines) | Section header, open the SBAR modal with the extra-workup justification inputs, close it. | presentation |
| 3 | `session-finalize-and-report.js` | 5047–5305 (259 lines, includes the trailing blank line) | Submit the session: read the form, classify, score, update and persist the account, render the debrief report, navigate. | application (mixed with domain, infrastructure and presentation; see the segment table) |

## Open questions

1. Is the legacy specialty/emergency simulator (sim view, SBAR modal, this report) to be carried into the ASP.NET Core host as dormant code, or removed? Everything in 5005–5305 depends on that decision; only the lightbox (4969–5004) has a live caller.
2. If the report is kept: should the scoring rules be preserved exactly as pinned above (length-only grading of S&B and A&R, unscored diagnosis, unused recipient, whole penalty shown in the workup row, zero-score title), or corrected during the refactoring?
3. In the professor's view of a student image, is the quick-note field meant to exist at all? Today it writes into the professor's own scratchpad (Problems row 4).
4. Are `stats.avgSpec` / `stats.avgEr` intended to be averages? This range stores the latest score; er.js computes an average for `avgEr`.
5. Whether the old UI prevented a second submission of the same session by other means (for example by leaving the sim view) was not determined; the function itself has no guard.
6. Should the history date be the user's local date rather than the UTC date?
