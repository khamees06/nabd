# Initialization banner and the academic section (phase 8), first part — script.js:6010–6529

## Purpose

Lines 6010–6012 are a banner comment titled "8. INITIALIZATION & COMPLETE EVENT LISTENERS". It does not introduce initialization code: the real initialization block is at script.js:~6940 (`nb8Init()` is called at 6945). Lines 6013–6529 are the "phase8 2026-11-07" academic section. It gives students a role guide (medicine or nursing), shows them the ER cases assigned to their section, their published results and advisor notes, and lets them join a section by code. It gives professors a five-tab portal (courses, assign, reports, progress, advisor) with KPIs, an assignment form and advisor follow-up notes. Everything is built from data already in the page plus two localStorage keys, and nothing is shared between devices (header 6019–6020). The range ends at the close of `nb8Init` (6528); the rest of phase 8 continues after 6529.

## Features and user journeys implemented here

| Feature | Reachability | Evidence |
|---|---|---|
| Role guide "ماذا ستفعل الآن؟" (5 steps, medicine or nursing) on student home | live | `nb8RenderGuide` called from script.js:4022; DOM `#nb8-guide` index.html:604; hidden for professors/no track (6121) |
| Role hint appended to the sign-in toast | live | called script.js:2036 |
| Student: section line, assigned-case cards (due date, late flag, done state, "start/retry in ER room") on home and on the university view | live | `nb8RenderStudentUni` via `nb8RenderAcademic` (1944, 1964); boxes `#nb8-home-stu-uni` index.html:651, `#nb8-uni-stu` 1538 |
| Student: published result / "under review, locked" card, privacy line, supervisor and advisor notes | live | 6208–6221; locked button handled at 6474 |
| Student: join a section by code | live (only when no section) | `nb8JoinFormHtml` 6170, submit handler 6512–6524, uses `nbCohortFor` (script.js:2472) |
| Open an assigned case in the ER room via `?case=` | live | click 6473 -> `nb8OpenAssignedCase`; er.js:4686 reads `case` when a new case starts. `scope.css` lines 10, 27, 30 re-show the university portal; `REMOVED_VIEWS` (script.js:1678) no longer contains `university` |
| Professor: five tabs with arrow/Home/End keyboard navigation, tab remembered in sessionStorage | live | `nb8SetProfTab` 6411, handlers 6427–6441, tab buttons index.html:1590–1594 |
| Professor: KPIs on home and university views | live | `nb8RenderKpis` 6246; ids `home-prof-kpi-*`, `uni-prof-kpi-*` (existence in index.html not verified here; each `set` skips missing ids, 6248) |
| Professor: course cards (3 fixed courses), copy section code, jump to assign tab | live | `nb8RenderCourses` 6270, click branches 6476–6486 |
| Professor: assign a case to a section (upsert, due date, note), list, unassign | live | form 6444–6467, list 6291, unassign 6487–6495; form ids index.html:1613–1623 |
| Professor: progress bars and per-student table, open attempt detail | live | `nb8RenderProgress` 6325, click 6496 -> `openStudentAttemptDetailModal` (script.js:5595) |
| Professor: academic advisor cards (status select, note up to 500 chars, save, status summary) | live | 6373–6397, save branch 6497–6508 |
| Re-render of the professor view after publishing a grade | live | listener 6527 on `#stu-modal-toggle-pub-btn` (id not checked in index.html) |
| `[data-nb8-go]` shortcut buttons (professor home -> tab) | live | index.html:504–508; branch 6475 |

## Declarations

All are top-level in the one classic script (globals). "Shared state" lists globals/storage touched.

| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| nb8CasesCache, nb8CasesLoading | 6024 | var | memo and in-flight promise for the ER case list | application | R/W themselves | nb8LoadErCases, many renders |
| nb8Keys | 6025 | function | names of the two localStorage keys and the sessionStorage tab key | infrastructure | none | 6053–6055, 6419, 6425 |
| nb8Esc | 6026 | function | HTML escape (& < > " ') | presentation | none | every render |
| nb8IsProf | 6027 | function | role test: professor or doctor | domain | none | throughout; 2 other copies of the rule at 1882, 5470 |
| nb8Count | 6028 | function | Arabic count noun for students (1, 2, 3–10, other) | presentation | none | nb8RenderKpis |
| nb8FmtDate | 6029–6031 | function | ISO date to ar-JO long date | presentation | none | 6190, 6300 |
| nb8Courses | 6033–6039 | function | fixed list of 3 courses with track and section | domain | none (section codes must exist in NB_COHORTS) | 6273, 6308 |
| nb8StuTrack | 6040 | function | track from `specialty` text (/الطب/) | domain | none | 6042, 6236 |
| nb8StuSection | 6042 | function | section of a demo-cohort record (default first section of track) | domain | none | 6276, 6382 |
| nb8UserSection | 6043–6047 | function | section of the signed-in user (u.cohort, else demo ids rana/med_student) | domain | NB_COHORTS (R) | 6181 |
| nb8LocalStudents | 6048–6051 | function | non-demo student accounts with a cohort | infrastructure | STORAGE_KEYS.ACCOUNTS_MAP (R) | 6273 |
| nb8GetAssignments | 6053 | function | read and sanitize assignment list | infrastructure | 'nabd_v2_assignments' (R) | 6183, 6273, 6295, 6457, 6491 |
| nb8SaveAssignments | 6054 | function | write assignment list | infrastructure | 'nabd_v2_assignments' (W) | 6461, 6491 |
| nb8GetAdvisor | 6055 | function | read advisor map, reject non-objects | infrastructure | 'nabd_v2_advisor' (R) | 6159, 6370, 6376, 6501 |
| nb8LoadErCases | 6058–6068 | function | cases from `window.__nbER.D.cases`, else fetch `data/er-cases.json` once | infrastructure | window.__nbER (R), cache (W) | 6225, 6319 |
| nb8CaseLabel | 6070–6075 | function | student-safe label: bed + name + age, arrival line, never the diagnosis | domain | none | 6186, 6297, 6313 |
| nb8AssignDone | 6076–6079 | function | finds a history entry for `er_<id>` or `er_<id>_n` with `ts >= assignment.ts` | domain | u.history (R) | 6187 |
| nb8OpenAssignedCase | 6082–6100 | function (async) | sets `?case=` with replaceState, opens ER room, clears param, warns if another case is running | application | authState, location, history, window.nbOpenER, window.__nbER.E | click 6473 |
| nb8Icon | 6103–6116 | function | inline SVG paths by name | presentation | none | 6143 |
| nb8RenderGuide | 6117–6146 | function | fills the guide box (track chip, intro, 5 steps) | presentation | DOM `#nb8-guide*`; nbTrackOf | script.js:4022 |
| nb8RoleHint | 6147–6154 | function | one-line role hint text | presentation | nbTrackOf | script.js:2036 |
| nb8AdvisorNoteHtml | 6157–6162 | function | advisor-note HTML for a student (looked up by `u.name`) | presentation | advisor store (R) | 6164 |
| nb8StudentNotesHtml | 6163–6169 | function | advisor note + last 3 supervisor comments | presentation | NB_COMMENTS_KEY store (R) | 6221 |
| nb8JoinFormHtml | 6170–6176 | function | join-by-code form markup | presentation | none | 6202 |
| nb8RenderStudentUni | 6177–6226 | function | renders assignment cards, result card, notes for home and university view | presentation | authState-user arg, getProfCohortList, NB_COHORTS, assignments (R); DOM | nb8RenderAcademic |
| nb8Stats | 6229–6245 | function | cohort aggregates: n, avg/max/min, published, per-track counts, flagged, allergy asked, interview asked, workups justified, best | domain | none (pure) | 6247, 6328 |
| nb8RenderKpis | 6246–6269 | function | writes KPI text into ~16 ids | presentation | getProfCohortList (R) | nb8RenderProf |
| nb8RenderCourses | 6270–6290 | function | course cards with counts | presentation | cohort list, local accounts, assignments (R) | nb8RenderProf, 6465, 6492 |
| nb8RenderAssignList | 6291–6304 | function | assignment rows with diagnosis (professor only) | presentation | assignments (R) | 6316, 6464, 6492 |
| nb8RenderAssignPane | 6305–6320 | function | fills section and case selects, loads cases | presentation | cases cache | nb8RenderProf |
| nb8Bar | 6321–6324 | function | percentage bar markup | presentation | none | 6346–6349 |
| nb8RenderProgress | 6325–6357 | function | bars and per-student table | presentation | cohort list (R) | nb8RenderProf |
| nb8Recs | 6358–6365 | function | recommendation strings from unasked questions, unjustified workups, unpublished state | domain | none | 6387 |
| nb8AdvStatuses | 6366 | function | status code/label pairs (needs, good, contacted) | domain | none | 6371, 6380, 6504 |
| nb8RenderAdvisorSum | 6367–6372 | function | count pills per status | presentation | advisor store, cohort list (R) | 6396, 6507 |
| nb8RenderAdvisor | 6373–6397 | function | one card per student with form | presentation | advisor store, cohort list (R) | nb8RenderProf |
| nb8RenderProf | 6398–6405 | function | professor render orchestration | application | none | nb8RenderAcademic, 6527 |
| nb8RenderAcademic | 6406–6409 | function | dispatch by role | application | none | script.js:1944, 1964, 6522 |
| nb8ProfTabs | 6410 | function | tab ids | presentation | none | 6412, 6430 |
| nb8SetProfTab | 6411–6422 | function | tab selection, ARIA, sessionStorage, focus | presentation / browser | sessionStorage 'nb8_prof_tab' (W) | 6426, 6428, 6440, 6475, 6482 |
| nb8Init | 6424–6528 | function | registers tab, form, delegated click, join submit and publish listeners | presentation (events) | document, authState, assignments, advisor (W) | script.js:6945 |

## Shared state, globals and contracts

Defines for others: `nb8RenderAcademic(u)` (script.js:1944, 1964, 6522), `nb8RenderGuide(u)` (4022), `nb8RoleHint(u)` (2036), `nb8Init()` (6945). Storage contracts: 'nabd_v2_assignments' and 'nabd_v2_advisor' (see below). Delegated attributes `data-nb8-*` are a contract between the render functions and the click handler (6471).

Expects from others:
- Functions: `safeStorageGet/Set` (1736, 1745), `showToast` (1835), `navigateTo` (1948), `openAuthModal` (2073), `saveAccountToStorage` (1787), `nbCohortFor` (2472), `nbTrackOf` (3457), `getProfCohortList` (5491), `openStudentAttemptDetailModal` (5595), `window.nbOpenER` and `window.__nbER` (er.js:4695, 4704).
- Constants/globals: `STORAGE_KEYS.ACCOUNTS_MAP` (1681), `NB_COHORTS` (2464), `NB_COMMENTS_KEY` (2463), `authState`.
- Data fields: `u.role`, `u.id`, `u.name`, `u.cohort`, `u.specialty`, `u.history[].caseId/ts/score/num`; cohort record fields `id, name, specialty, yearLabel, score, isPublished, caseTitle, submittedAt, profNote, inquiryLog[{topic,asked}], workupLog[{title,isUnjustified}], strengths, weaknesses, hasUnjustifiedWorkup, section`; case fields `id, bed, patient{name,age,arrival}, dx.ar`; `NB_COHORTS[code].name/.uni`.
- DOM ids: `nb8-guide*`, `nb8-home-stu-uni`, `nb8-uni-stu`, `nb8-courses`, `nb8-as-*`, `nb8-progress`, `nb8-advisor(-sum)`, `nb8-tab-*`, `nb8-pane-*`, `home-prof-kpi-*`, `uni-prof-kpi-*`, `home-prof-attempts`, `home-prof-tab-reports-btn`, `stu-modal-toggle-pub-btn`, container `#uni-doctor-content .nb8-tabs`, `document.documentElement.dir`.
- Ordering: `nb8Init` must run after the DOM exists (called from the init block 6945). Renders are try/wrapped by callers.

## Data, storage and network

| Item | Detail |
|---|---|
| fetch | `data/er-cases.json` (6062) only when `window.__nbER.D.cases` is not yet loaded; reads `j.cases` (array) |
| localStorage 'nabd_v2_assignments' | array of `{id:'as_<base36 time><4 random>', caseId, section, due:'YYYY-MM-DD'|'', note(<=300), by:name, ts:ms}`; read filter requires string caseId and section (6053) |
| localStorage 'nabd_v2_advisor' | object keyed by student **name**: `{status:''|needs|good|contacted, note(<=500), ts, by}` (6502) |
| localStorage reads | `STORAGE_KEYS.ACCOUNTS_MAP` ('nabd_v2_accounts_map'), `NB_COMMENTS_KEY` ('nabd_comments_v1': map name -> [{text, ts}]), prof cohort list via `getProfCohortList` |
| localStorage writes | the two keys above; `saveAccountToStorage(u)` on join (6521) |
| sessionStorage 'nb8_prof_tab' | selected tab id (6419, 6425) |
| history API | `history.replaceState` to add/remove `?case=` around `nbOpenER()` (6091) |
| clipboard | `navigator.clipboard.writeText` (6478) |
| dialogs | `window.confirm` before unassign (6489) |
| timers | `setTimeout(...,0)` after the publish toggle (6527) |
| time/randomness | `Date.now()` (6459, 6460, 6502), `Math.random()` (6460), `new Date()` for today (6184) |
| audio | none |

## Calculations and rules worth pinning with a golden-master test

| Name | Lines | Inputs | Output | Time/randomness |
|---|---|---|---|---|
| nb8Count | 6028 | integer | Arabic noun phrase (1, 2, 3–10, else with "ً") | none |
| nb8UserSection | 6043 | user | section code or null (cohort, demo ids) | none |
| nb8StuTrack / nb8StuSection | 6040–6042 | student record | track, section with defaults | none |
| nb8AssignDone | 6076 | user, assignment | matching history entry or null (`er_<id>` or `er_<id>_n`, `ts >=`) | uses stored ts |
| nb8Stats | 6229 | cohort list | n, avg (rounded mean of parseInt scores), max, min, pub, med/nurse, flagged, allergy have/asked, qAll/qAsked, wAll/wOk, best (first max wins ties) | none |
| Late flag | 6184, 6188 | `a.due`, done | late if not done and `due < today` (string compare, today = UTC date) | `new Date()` |
| nb8Bar percent | 6322 | a, b | `round(a*100/b)`, 0 if b falsy | none |
| nb8Recs | 6358 | student record | list of recommendation strings | none |
| nb8CaseLabel | 6070 | case | `{title: bed · name، age سنة, line: arrival}` (no diagnosis) | none |
| Assignment upsert | 6457–6460 | caseId+section | update existing (due, note, ts, by) else push new id | `Date.now`, `Math.random` |
| Tab arrow navigation | 6429–6441 | key, dir | next/prev/home/end index with RTL swap | none |

## Problems

| severity | kind | evidence |
|---|---|---|
| high | architecture | Professor-only actions (assign, unassign, advisor save) are guarded only by a client-side role check on `authState.user` (6448, 6488, 6498); assignments, advisor notes and comments live in localStorage, so a student can edit them in devtools and assignments never reach other devices (header 6019–6020, success text 6463). Needs a server model in the re-host. |
| medium | bug | Re-assigning the same case to the same section resets `old.ts = Date.now()` (6459); `nb8AssignDone` requires `h.ts >= a.ts` (6078), so a student's finished work becomes "not done" after an edit of the due date or note. |
| medium | bug | "Today" is `new Date().toISOString().slice(0,10)` (6184), a UTC date, compared as text with the local due date (6188). In Amman (UTC+3) assignments are flagged late/not late up to 3 hours off at the day boundary. |
| medium | architecture | Advisor notes and supervisor comments are keyed by student display name (6159, 6165, 6379, 6502); two students with the same name share notes; a rename loses them. |
| medium | data-exposure | `data/er-cases.json` (diagnosis `dx.ar`, 6299, 6313) is loaded in the browser for every user including students; the student label hides it (6069), but the data file itself is client-readable. Whether students can reach it through other UI is not determined. |
| low | bug | KPI "submitted" is hard-coded `${st.n} / ${st.n}` (6253), always 100%. |
| low | bug | `nb8Count(0)` returns "0 طالباً" (6028); `nb8Stats` with non-numeric score yields `avg` null but `best` compares `parseInt || 0` (6242). |
| low | duplication | The professor-role rule exists three times (6027, 1882, 5470) and `nbTrackOf` tests only `'professor'` (3457); `nb8Esc` duplicates `nrEsc` (3559); `ul()` is defined twice (6329, 6377). |
| low | maintainability | Section codes are hard-coded in `nb8Courses` (6035–6037) and in `nb8UserSection` demo map (6046); the banner at 6010 says "initialization" but initialization is at ~6940. Render functions build HTML strings with inline styles (6161, 6167) and long template literals. |
| low | maintainability | Coupling to DOM ids across files: publish button listener (6527) and `#uni-doctor-content .nb8-tabs` (6427); a missing element silently disables the feature (optional chaining). `nb8OpenAssignedCase` relies on er.js reading `?case=` at open time and clearing it right after the await (6095); whether er.js reads it before its async data load finishes is not determined (er.js:4680–4686 reads it after `await`, inside `open`). |

## Proposed source fragments

Validated with check-fragment.mjs (all ok).

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | academic-foundation.js | 6010–6101 | banner, cache vars, storage keys, helpers, course/section rules, assignment and advisor store access, ER case loader, case label, completion rule | domain |
| 2 | academic-role-guide.js | 6102–6155 | open assigned case in ER room; icons; role guide and role hint rendering | presentation |
| 3 | academic-student-view.js | 6156–6227 | student notes, join form, assignment cards, result and notes render | presentation |
| 4 | academic-professor-dashboard.js | 6228–6357 | cohort statistics, KPIs, course cards, assignment list/pane, progress view | presentation |
| 5 | academic-advisor-and-tabs.js | 6358–6422 | recommendations, advisor cards, professor/academic render dispatch, tab selection | presentation |
| 6 | academic-event-wiring.js | 6423–6529 | `nb8Init`: tab keyboard, assignment form, delegated click actions, join submit, publish refresh | presentation |

## Open questions

1. Where are the `home-prof-kpi-*` and `uni-prof-kpi-*` ids and `stu-modal-toggle-pub-btn` defined in index.html (ids not checked)?
2. Does er.js read `?case=` before or after its awaited data load (er.js:4680–4686), and is the param cleared too early at 6095 in some paths?
3. Can a student reach `dx` data from `data/er-cases.json` through any other UI path?
4. Which part of the cohort record schema (`id`, `section`, `submittedAt`) is guaranteed by `PROFESSOR_COHORT_DEFAULT` versus by saved lists (not read here)?
5. Should assignments and advisor notes become server-side entities keyed by user id rather than name in the ASP.NET re-host?
6. Is the `doctor` role (accepted at 6027) ever produced by sign-up, given `nbTrackOf` only excludes `professor`?
