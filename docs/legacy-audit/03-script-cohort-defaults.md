# Professor cohort defaults and what follows up to the view guard — script.js:1207–1673

Audit basis: every line of the range was read (long lines cut), every consumer was traced with grep across `*.js` and `index.html`, and the behaviour was checked in the running legacy page (http://127.0.0.1:5180/, 1440×900, offline mode). Statements marked "live" were observed in the page; statements marked "by code" were read but not exercised.

## Purpose

The range holds exactly one top-level declaration: `const PROFESSOR_COHORT_DEFAULT` (1207–1672), followed by one blank line (1673). It is a hard-coded array of seven demo student attempt records (identity, case, diagnosis, vitals line, score, publication flag, question log, investigation log, notes, SBAR handover text, strengths, weaknesses, professor note). It is the default value of the professor cohort store: `getProfCohortList()` (5491–5493) returns the copy saved under `localStorage['nabd_v2_prof_cohort']` and falls back to this literal. Everything the professor dashboard, the academic portal (reports, progress, advisor, courses tabs), the student result card and the CSV export show about "the section's students" is derived from these seven records. The range contains no functions, no calculations, no DOM access, no network, no timers. The next declaration (`PROTECTED_VIEWS`, 1674) belongs to the following area.

## Features and user journeys implemented here

The range only supplies data. The journeys below are implemented elsewhere in script.js and consume this literal.

| # | What the user sees or does | Consumer (script.js) | Reachability | Evidence |
|---|---|---|---|---|
| 1 | Professor home dashboard: table of 7 student attempts with "عرض الإجابات" buttons | `renderProfessorCohortTables` 5499–5591 (home table 5505–5540) | live | Demo button `data-demo-login="doctor"` (index.html:2016) → listener 6603–6604 → `nbDemoLogin` 2042 → `syncAuthShellUI` un-hides `#home-professor-section` (1934–1935) and renders (1942). Live: section visible, 7 rows in `#home-prof-cohort-tbody`. |
| 2 | Professor KPI strip (count, published, average, flagged students) | `nb8Stats` 6229–6245, `nb8RenderKpis` 6246–6269 | live | Live values for the default data: "7 طلاب", "تمريض (4) · طب (3)", "5 منشورة · 2 بانتظار الاعتماد", "85%", "أعلى درجة: 94% · أدنى درجة: 68%", flagged: عمر الخالدي، أحمد السالم. |
| 3 | Academic portal → tab "تقارير الطلبة": same table with a specialty / weakness filter | 5542–5586, filter 5544–5548, listener 6902 | live | `navigateTo('university')` works for the professor; the table and filter are hidden until the "reports" tab is clicked (default tab is "courses"); after the click both are visible (live). Filter results (live): all 7; "التمريض" 4; "الطب" 3; "weakness" 2. |
| 4 | Student attempt detail modal (question log, investigation log with image zoom, notes, SBAR, strengths, weaknesses, professor note) | `openStudentAttemptDetailModal` 5595–5673 | live | Clicking a row button opened `#student-attempt-detail-modal` (live: title for عمر الخالدي, "سأل 2 من 3 محاور أساسية", 3 investigation rows, 1 zoom button). Also opened from the progress tab (6496). An unknown id opens the first record (5597, live). |
| 5 | "اعتماد ونشر الدرجة للطالب": sets `isPublished = true`, stores the note, saves the whole list | listener 6905–6916, `saveProfCohortList` 5495–5497, re-render of nb8 views 6527 | live | Live: after the click on `stu_ahmed` the badge changed to published, `localStorage['nabd_v2_prof_cohort']` held an array of 7 (22,277 characters), KPI changed to "6 منشورة · 1 بانتظار الاعتماد". The handler only sets `true`; there is no un-publish path (6909). |
| 6 | Portal tab "تقدّم الطلبة": four ratio bars and a per-student table | `nb8RenderProgress` 6325–6357 | live | Live: 7 rows; bars 19/21 questions asked, 7/7 allergy question, 21/24 justified investigations, 5/7 published. |
| 7 | Portal tab "المرشد الأكاديمي": one card per cohort record with recommendations, follow-up status and note | `nb8RenderAdvisor` 6373–6397, `nb8Recs` 6358–6365, save 6497–6508 | live (render); save not exercised | Live: 7 cards visible. Save handler read by code only. |
| 8 | Portal tab "المساقات والشعب": per section, number of demo records | `nb8RenderCourses` 6270–6290, `nb8StuSection` 6042 | live | Live: NUR-JU-2026 → 4, MED-JUST-2026 → 3, NUR-MEU-2026 → 0. |
| 9 | Student portal card "نتائجك المنشورة": the signed-in student's own cohort record, found by name | 6208–6216 | live | Live: demo `rana` sees 91% and the professor note of `stu_rana`; demo `med_student` sees 92% of `stu_zaid`. An unpublished record shows a locked card (6212–6213, by code). |
| 10 | Professor comment to a student from the modal (`#stu-comment-save`) | 2630–2638, `nbLoadComment` 2607–2614 | live control, click not exercised | The control is inside the live modal (index.html:2149); the handler looks the student up in the cohort list by `activeInspectedStudentId` (2631) and keys the comment by `stu.name` (2634). |
| 11 | "تصدير السجل الكامل (CSV)" download of name, university id, specialty, case, score, publication state | 6922–6938 | live control, click not exercised | Button visible on the reports tab (live). |

Text shown in the page differs from the literal: terms.js rewrites Arabic clinical terms in the DOM (TERMS list from terms.js:13, MutationObserver at terms.js:117). Live example: the literal's "مترافقة مع السكري" is displayed as "مترافقة مع DM".

## Declarations

| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| `PROFESSOR_COHORT_DEFAULT` | 1207–1672 | `const` array literal (7 objects), script-global, not a `window` property (live: `'PROFESSOR_COHORT_DEFAULT' in window` is false), not frozen | Seed / default data of the professor cohort store | infrastructure (seed data); the record shape is a domain entity (student attempt report) | Reads nothing at declaration. Is mutated in place by the publish handler when no stored copy exists (see Problems 2) | Only reference: `getProfCohortList` 5492. Searches: `grep -n "PROFESSOR_COHORT_DEFAULT\|PROF_COHORT\|professorCohort\|profCohort\|prof_cohort" *.js index.html` → 1207, 1685, 5492, 5496 only |
| (blank line) | 1673 | — | — | — | — | — |

Record shape (identical key set in all 7 records, verified live):

| field | type in literal | read at (script.js) | notes |
|---|---|---|---|
| `id` | string `stu_*` (7 unique) | 5533, 5579, 5597, 5599, 2631, 6341, 6381, 6392, 6499, 6907 | modal lookup key |
| `name` | string (7 unique) | 5515, 5557, 5609, 5652, 6208, 6250, 6266, 6335, 6382, 6914, 6926; key into comment store 2609/2634 and advisor store 6371/6379/6502 | join key to the signed-in user (6208) |
| `uniId` | string of 8 digits (7 unique) | 5558, 5602, 6926 | |
| `specialty` | string: "التمريض السريري" (4) or "الطب البشري" (3) | 5516, 5547, 5561, 5602, 6040, 6335, 6382, 6926 | filter uses `includes` (5547); track = `/الطب/` test (6040) |
| `yearLabel` | string | 5516, 5562, 5602, 6335, 6382 | |
| `caseId` | string, key of `CASES_DB` | no reader found | searches: `grep -n "stu\.caseId\|s\.caseId\|rec\.caseId" script.js` → none; every `.caseId` hit in script.js is on history entries, assignments or the active-sim meta |
| `caseTitle` | string | 5519, 5565, 5610, 6211, 6384, 6926 | equals the `CASES_DB` title plus the patient name in brackets (live comparison) |
| `submittedAt` | string "2026-10-16 · HH:MM" | 5520, 5566, 5610, 6211, 6384 | display only, never parsed |
| `diagnosis` | string | 5523, 5569, 5611 (through `nbBidi`, 4532) | |
| `vitalsInfo` | string | 5612 | |
| `score` | string "NN%" | `parseInt` at 5509, 5551, 6231, 6242, 6333; displayed 5529, 5575, 5613, 6211, 6336, 6382, 6384, 6926 | |
| `isPublished` | boolean (5 true, 2 false) | 5530, 5576, 5604–5605, 6210, 6235, 6336, 6362, 6384, 6926; written 6909 | |
| `hasUnjustifiedWorkup` | boolean (2 true) | 5526, 5546, 5572, 6237 | duplicates `workupLog[].isUnjustified` |
| `workupSummaryBadge` | string | 5526, 5572 | free text with counts |
| `inquiryLog[]` | objects `{topic, asked, time, qText, aText, eval}` (21 entries, 19 asked) | 5615–5629, 6239, 6331–6332, 6360 | allergy items found by `/حساسية/` on `topic` (6239) |
| `workupLog[]` | objects `{title, time, isImaging, imageKey?, rawSummary, studentAnalysis, studentJustification?, relationStatus, isUnjustified}` (24 entries, 3 unjustified, 8 imaging) | 5612, 5633–5657, 6241, 6331–6332, 6361 | `imageKey` indexes `DIAG_IMAGES` (5639, 5647, 5651) |
| `scratchpad`, `sbarSB`, `sbarAR` | strings (`\n` in scratchpad) | 5659, 5660, 5661 | set with `textContent` |
| `strengths[]`, `weaknesses[]` | arrays of strings | 5664, 5666, 6339–6340, 6385–6386 | |
| `profNote` | string | 5668, 6211, 6384; written 6910 | the only field edited through the UI besides `isPublished` |
| `section` | absent in all 7 records | 6042 | optional; when absent the section is derived from the track |

## Shared state, globals and contracts

Defined for others:

- Global `PROFESSOR_COHORT_DEFAULT` (script scope). One consumer: `getProfCohortList` (5492). The list it returns is the data contract for: `renderProfessorCohortTables` (5499), `openStudentAttemptDetailModal` (5595), `nb8Stats` (6229), `nb8RenderKpis` (6246), `nb8RenderCourses` (6270), `nb8RenderProgress` (6325), `nb8Recs` (6358), `nb8RenderAdvisorSum` / `nb8RenderAdvisor` (6367, 6373), the student result card (6208), the comment handler (2631), the advisor save handler (6499), the publish handler (6906), the CSV export (6923).
- No other script file references the cohort (`grep` over er.js, resp.js, ui.js, motion.js, terms.js: no hit for `PROFESSOR_COHORT_DEFAULT`, `getProfCohortList`, `saveProfCohortList`).

Expected from others (conventions the literal relies on; nothing is referenced at declaration time):

| expectation | where it is defined | status |
|---|---|---|
| `caseId` values are keys of `CASES_DB` | script.js:214 | all 6 distinct values exist (live); field is not read by code |
| `imageKey` values are keys of `DIAG_IMAGES` | script.js:11 | all 5 distinct values (`ecg_stemi`, `ecg_normal`, `xray_ankle`, `xray_chest`, `ultrasound`) exist (live) |
| `name` equals the `name` of a signed-in account for the student card | `DEMO_ACCOUNTS` script.js:1032 | name matches (live): `stu_rana` ↔ `rana`, `stu_zaid` ↔ `med_student`, `stu_ahmed` ↔ `ahmed_y1` (no demo button for `ahmed_y1`: index.html:2014–2016 offer only `rana`, `med_student`, `doctor`) |
| `specialty` contains "الطب" or "التمريض" | filter option values index.html:1713–1714; `nb8StuTrack` 6040 | holds for all 7 |
| Storage key | `STORAGE_KEYS.PROF_COHORT = 'nabd_v2_prof_cohort'` script.js:1685 | used at 5492, 5496 only |
| DOM ids that receive the data | `home-prof-cohort-tbody` (index.html:553), `uni-prof-cohort-tbody` (1735), `prof-cohort-filter` (1711), `student-attempt-detail-modal` and `stu-modal-*` (2139–2250), `doc-export-csv-btn` (1717), KPI ids `home-prof-kpi-*` (index.html:515–531) and `uni-prof-kpi-*` (set at 6261–6268) | present |

## Data, storage and network

- Network: none in the range. No fetch URL.
- Timers, audio, history API: none in the range.
- Storage: none in the range. The literal is the fallback of one key handled at 5491–5497:

| key | storage | shape | written when | removed |
|---|---|---|---|---|
| `nabd_v2_prof_cohort` | `localStorage` through `safeStorageSet` (1745–1752), mirrored into `window.name` as `__NABD_STORE__:{…}` (1732; live: the key was present in `window.name` after a publish) | JSON array of all cohort records, same shape as the literal (live: 7 records, 22,277 characters after one publish) | only by the publish handler (6911) | never: no `safeStorageRemove` call uses this key (grep on `PROF_COHORT` and `nabd_v2_prof_cohort`: 1685, 5492, 5496 only) |

- Read path: `safeStorageGet` (1736–1743) returns the parsed `localStorage` value when the key exists (including a stored `null`), otherwise the `window.name` store value, otherwise the literal itself (same reference, not a copy; live: `getProfCohortList() === PROFESSOR_COHORT_DEFAULT` is true before the first publish). Invalid JSON in `localStorage` falls through to the literal (live).
- Related stores keyed by the record's `name`: `nabd_comments_v1` (2463, 2633–2635) and `nabd_v2_advisor` (6025, 6501–6503). They are outside the range.
- Size: 466 source lines, 37,194 UTF-8 bytes; `JSON.stringify` of the literal is 22,383 characters / 32,420 UTF-8 bytes (live).

## Calculations and rules worth pinning with a golden-master test

The range contains no calculation. No randomness and no clock value enters the literal (all dates and times are fixed strings). What is worth pinning is the data itself and the values other code derives from it.

| name | lines | inputs | outputs to pin | randomness / time |
|---|---|---|---|---|
| Seed snapshot | 1207–1672 | none | SHA-256 of `JSON.stringify(PROFESSOR_COHORT_DEFAULT)` = `beb2945d6ef49d36bb4bb6b6dcbda5fe13c3dd78043700f24a97d1b40a6a8e9b` (computed in the page, before any publish); 7 records; ids in order `stu_layan, stu_omar, stu_zaid, stu_rana, stu_salma, stu_ahmed, stu_raghad` | none |
| Seed invariants | 1207–1672 | the literal, `CASES_DB`, `DIAG_IMAGES` | same 22 keys in every record; unique `id`, `name`, `uniId`; every `caseId` in `CASES_DB`; every imaging entry has an `imageKey` present in `DIAG_IMAGES`; `hasUnjustifiedWorkup === workupLog.some(w => w.isUnjustified)` for all 7 (all verified live) | none |
| Cohort statistics on the seed | 6229–6245 (`nb8Stats`) | the literal | `n 7, avg 85, max 94, min 68, pub 5, nurse 4, med 3, flagged [stu_omar, stu_ahmed], allergyHave 7, allergyAsked 7, qAll 21, qAsked 19, wAll 24, wOk 21, best stu_layan` (live) | none |
| Table filter | 5544–5548 | filter value, the literal | `all` → 7; `التمريض` → layan, omar, rana, ahmed; `الطب` → zaid, salma, raghad; `weakness` → omar, ahmed (live) | none |
| Score band | 5509–5512, 5551–5554 | `score` string | `parseInt(score) >= 85` emerald, `>= 75` teal, else amber; seed gives 5 / 1 (76%) / 1 (68%) | none |
| Track and section of a record | 6040–6042 | `specialty`, optional `section` | seed: 4 × nursing → `NUR-JU-2026`, 3 × medicine → `MED-JUST-2026` (live) | none |
| Advisor recommendations | 6358–6365 (`nb8Recs`) | one record | number of lines for the seed: layan 1, omar 3, zaid 1, rana 1, salma 1, ahmed 2, raghad 2 (live) | none |
| Publish transition | 6905–6916 | inspected student id, note input | `isPublished` becomes true; `profNote` becomes the trimmed input, or keeps the old note when the input is empty (`||` at 6910; live: "  note X  " stored as "note X"); whole list saved | none |
| Student result lookup | 6208–6216 | signed-in user's `name` | published card for `rana` (91%) and `med_student` (92%) (live) | none |

Pin function outputs or stored data rather than page text: terms.js rewrites displayed text after rendering.

## Problems

| severity | kind | evidence with line numbers |
|---|---|---|
| high | bug | The stored cohort is used without any shape check (5491–5493). With `localStorage['nabd_v2_prof_cohort'] = '{}'`, `renderProfessorCohortTables` throws `cohort.forEach is not a function` (5507, live); a stored `null` throws as well (live). The function is called without `try` from `initNabdApp` (6543) and `syncAuthShellUI` (1942). Live in a same-origin iframe: with the malformed key the page loads but start-up stops, and the demo-login button no longer signs in (its listener at 6603 is never bound). A record without `workupLog` makes the modal throw at 5612 (live). Compare `nb8GetAssignments` (6053), which validates its store. |
| high | security | Cohort strings are inserted into `innerHTML` without escaping at 5513–5537, 5555–5583, 5619–5629, 5635–5646, 5664, 5666. The list can come from `window.name` when the key is absent from `localStorage` (1741–1742, 1721–1727), which is the normal state before the first publish. Live: setting `window.name` to a `__NABD_STORE__:` payload with markup in `name` and `workupSummaryBadge` produced the injected elements in both tables; the render runs at start-up for every visitor (6543). Whether `window.name` set by another site survives navigation to the site in a given browser: not determined. The nb8 renderers escape with `nb8Esc` (6211, 6335–6341, 6382–6386); the older renderers do not. |
| medium | bug | The default is returned by reference (5492) and the publish handler mutates the record before saving (6909–6910). Live: after publishing `stu_ahmed` with no stored copy, `PROFESSOR_COHORT_DEFAULT` itself had `isPublished: true` and the new note. The `const` seed is therefore not a stable default within a session. |
| medium | architecture | Seed data and persisted state are one structure with no version or migration: after the first publish the full 7-record array is stored (6911) and shadows the literal permanently (5492); nothing removes the key. Later changes to the literal do not reach that browser. The key is global to the browser, not per professor, section or course (1685). |
| medium | architecture | Identity by display name. The student card finds the record with `s.name === u.name` (6208); comments and advisor notes are keyed by `stu.name` (2609, 2634, 6371, 6379, 6502). By code, any signed-in student whose name equals a cohort record's name receives that record's result (verified live only for the demo accounts `rana` and `med_student`). The record has `id` and `uniId`, the account has `id`; neither is used for the join. |
| medium | architecture | Publication does not leave the device. The modal label says the note appears in the student portal (index.html:2243), but the only persistence is `localStorage` / `window.name` (5495–5497, 1745–1752); the phase-8 header states "Nothing here is shared between devices" (6020). A student sees a published result only in the same browser. |
| low | data-exposure | Names, 8-digit university ids, grades and free-text assessments of seven students are shipped to every visitor in script.js and can be exported to CSV (6922–6938). The UI labels the data as demo (index.html:484). Whether the persons are fictional: not determined. After a publish the whole list is also copied into `window.name` (1732), which is not bound to the site's origin. |
| low | duplication | Derived or repeated values are stored in the literal: `hasUnjustifiedWorkup` repeats `workupLog[].isUnjustified` (consistent today); `score` is a "NN%" string parsed at five places (5509, 5551, 6231, 6242, 6333); the count "(7)" is hard-coded in index.html:1712 and not updated by any script (grep "جميع التخصصات والسنوات": index.html only); the scores of `stu_rana` and `stu_zaid` are repeated in `DEMO_ACCOUNTS` history (1139, 1173); the two table renderers are near-copies (5507–5539 and 5549–5585). |
| low | bug | Literal text inconsistent with its own logs: badge of `stu_zaid` says "4 أساسية + 1 إضافي" (1359) but the log has 4 entries, one of them the extra one (1366–1404); badge of `stu_ahmed` says "4 أساسية + 1 صورة غير مبررة" (1563) but the log has 3 entries (1569–1597). Badges at 1294 and 1563 end with a trailing space. `studentJustification` at 1327 holds a narrator sentence ("لم يكتب الطالب مبرراً…") and is rendered as the student's quoted justification (5644); the same line says "التواء كاحل" while the diagnosis is a fracture (1289). |
| low | dead-code | `caseId` is present in all 7 records (1214, 1286, 1351, 1424, 1495, 1555, 1616) and read nowhere (searches in Declarations). Reported as unreferenced field, not removed. |
| low | maintainability | Business meaning is carried by free text: track is derived from the Arabic `specialty` string by regex (6040) and the filter by substring (5547); the allergy metric depends on the word "حساسية" in `topic` (6239); `relationStatus` embeds scoring wording such as "(خصم -5 نقاط)" (1318, 1328, 1595) that restates the rule text at 5270–5271; evaluation strings embed ✓ / ✗ symbols. |

## Proposed source fragments

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | `professor-cohort-default-data.js` | 1207–1673 | Seed literal `PROFESSOR_COHORT_DEFAULT`: seven demo student attempt records used as the default professor cohort | infrastructure (seed data) |

The fragment is 467 lines because the range is one array literal; `.work/script-cuts.txt` offers no start line between 1207 and 1674. Checked: `node tools/legacy/check-fragment.mjs script.js 1207-1673` → `ok 1207-1673 (467 lines, 37195 bytes)`.

## Open questions

1. Are the seven students fictional? The names and university ids look like demo data and the UI says so (index.html:484), but the code cannot confirm it.
2. In the new design, is the cohort a server-side store seeded from this literal, or does it stay demo-only fixture data? This decides whether `nabd_v2_prof_cohort` needs a migration from existing browsers.
3. Which key joins a cohort record to an account: `uniId`, account `id`, or a new identifier? Today it is the display name (6208).
4. Should `caseId` point to the ER cases (data/er-cases.json, used by assignments at 6058–6060) instead of the older `CASES_DB` ids it holds today? No code reads it, so the intended target is not determined.
5. Should publication be reversible? The button id says "toggle" (index.html:2247) but the handler only publishes (6909), and an emptied note cannot clear the old one (6910).
6. Does `window.name` set on another origin reach the site in the browsers the project targets? This sets the real severity of the injection path; not determined here.
