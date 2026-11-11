# Feature reachability (verified in the running page)

## Method

- Code read: `script.js` 1674-1686 (view sets, storage keys), 1722-1792 (storage helpers), 1876-1945 (`syncAuthShellUI` role toggles), 1947-2075 (`navigateTo`, `showOnlySection`, `loginWithAccount`, `nbDemoLogin`, `logoutUser`), 2339-2342, 2380-2396, 3457-3470, 3887-3888, 4265-4271, 6025-6100, 6291-6320, 6530-6560, 6602-6631, 6975-7124; `er.js` 12, 695, 3090-3098, 4228-4252, 4357, 4425-4430, 4640-4706; `resp.js` 12, 860-895; `scope.css` (all 63 lines); `home9.css` 8-22, 71-75; `er.css` 155-158; `index.html` 105-118, 220-222, 282, 705-728, 2008-2044.
- Browser: five headless runs of `tools/legacy/browser-probe.mjs` against `http://127.0.0.1:5180/` at 1440x900, each a fresh Chrome profile (empty localStorage).
  1. Guest, `med_student`, `rana`, `doctor` in one page: `navigateTo(v)` for all 11 views, the start functions, and the list of visible controls (computed `display` not `none`, `visibility` not `hidden`, non-zero box).
  2. `rana` on a fresh page: home blocks, locked items, profile, level quiz, university view, debrief, ER as nurse up to the handover sheet.
  3. Registration form, wrong/right password login, professor portal tabs.
  4. Professor assigns a case, then `med_student` opens the assignment.
  5. Landing "try an ER case" button, ER as doctor from briefing to the report, history, debrief.
- "Visible" in the matrix means the control passed the visibility test. Sidebar items pass it while the drawer is closed (they have a box off-canvas); they are counted as entry points.
- Not exercised in the browser (code-read only or not read): page reload with a saved session, certificate print, settings tab, custom-case save, advisor note save, CSV export, cohort join form, nurse ER after the handover sheet. These are marked "not verified in page".
- Network note: the room never used local `/api`. `er.js:12` and `resp.js:12` use the absolute production URL when the host name is not `*.vercel.app`. Opening the ER room therefore sent one `GET ...?ping=1` to the production host per room entry (seen in the resource list of run 5). That request is the free check (`api/er-chat.js:287`, no model call); the origin `http://127.0.0.1:5180` is not in the server allow-list (`api/er-chat.js:27`), so the browser rejected it, `api` became `'off'` (`er.js:695`) and every message in these runs was answered by the offline path. No `POST` to the endpoint appears in the resource list.

## Matrix

Columns 2-5: result of requesting the view/feature. "home" = redirected to home. "modal" = stays on index and the sign-in page opens.

| Feature or view | Signed-out | Medical student | Nursing student | Professor | How it is reached | What hides or guards it (file:line) | Verdict |
|---|---|---|---|---|---|---|---|
| `index` (landing) | opens | opens via `navigateTo('index')` only; no visible control leads there while signed in (not determined for `#app-brand-btn`) | same | same | initial view when no saved session (`script.js:6553-6557`); `logoutUser` (`script.js:2069`) | none | live |
| Landing sections roles/specs/OR/universities/level + level CTA | hidden | n/a | n/a | n/a | header/sidebar anchors | `scope.css:15-22` (`display:none !important`) | dormant |
| Sign-in / registration page (`#auth-modal`) | opens (`#public-login-btn`, `#public-register-btn`, `#index-register-cta`, `#index-login-cta`, sidebar guest buttons) | n/a | n/a | n/a | `openAuthModal` (`script.js:2075`); also opened by the guard | none; `home9.css:45-66` styles it as a full page | live |
| Demo sign-in buttons (3) | visible inside sign-in page (`index.html:2014-2016`); landing `#index-demo-cta` signs in `med_student` and opens ER (`script.js:6602`, verified) | `#side-switch-demo-btn` visible | same | same | `nbDemoLogin` (`script.js:2042`), `[data-demo-login]` (`script.js:6603`) | none (`scope.css:52-54` says nothing is hidden any more) | live |
| `home` | modal | opens | opens | opens | `#app-nav-home`, sidebar, after login | `PROTECTED_VIEWS` (`script.js:1674`, `1952`) | live |
| Home: welcome card, ER card, sections grid `#home-fields9` | - | visible | visible | visible | - | `home9.css:11-18` orders them | live |
| Home: sections grid cards other than Emergency (7 cards) | - | shown as locked, no button | same | same | only the first `li.is-open` has a button (`index.html:711`) | markup has no handler; `home9.css:75` | dormant (placeholder, no code behind) |
| Home: `#home-path` + `#nb8-guide` ("what to do now") | - | visible | visible | hidden | rendered by `renderHomePath`, `nb8RenderGuide` (`script.js:6117`) | professor: hidden by role in code (observed; `script.js:3991`, `4065` return for professor) | live (students) |
| Home: `#home-student-uni-section` | - | visible | visible | hidden | `syncAuthShellUI` (`script.js:1936-1937`) | role toggle | live (students) |
| Home: `#home-professor-section` | - | hidden | hidden | visible | `syncAuthShellUI` (`script.js:1933-1934`) | role toggle | live (professor) |
| Home: `#home-skip-note`, `#home-learn`, `#home-nurse`, `#home-cases-anchor`, `#home-coach-banner` | - | hidden | hidden | hidden | - | `scope.css:30-31`, `39` | dormant |
| Home: `.er-rooms` strip, `#home-resp-card` | - | hidden | hidden | hidden | - | `home9.css:20`; cards also `er-locked` (`index.html:724`, `728`) | dormant |
| `er` (emergency room) | modal | opens, role doctor | opens, role nurse | opens, role doctor | `#app-nav-er`, `#side-er-btn`, `#launch-er-random-btn`, `#foot-er-btn`, `#empty-debrief-go-er` (`script.js:6627-6631`), footer `onclick="nbOpenER()"` (`index.html:2289`), section card (`index.html:711`), `nbOpenRoom` (`script.js:2339`), assignment cards | `navigateTo('er')` guard inside `open()` (`er.js:4663`) | live |
| ER role switch (doctor/nurse) | - | visible in briefing | visible in briefing; switched doctor and back (verified) | visible in briefing | `[data-role]` in `#er-brief` (`er.js:4435`, `4548`) | allowed only before the first turn: `canSwitch` (`er.js:3091`); gone after "start" (verified) | live |
| ER report (`#er-debrief`) | - | shown after hand-over (verified) | not verified in page | not verified in page | `#er-end` then `#er-end-go` | `#er-end-go` disabled until the sheet is filled (observed) | live |
| `debrief` | modal | empty state when no ER report in this page session; after an ER report `navigateTo('debrief')` shows view `er` with the report (verified) | empty state (verified) | opens (empty state) | sidebar "last session report" | `script.js:1974-1986`; `nbErReport` (`er.js:4697`) | live as an empty state and as a redirect to the ER report; the old report body (`#debrief-report-content`) needs `simState.sbarSubmitted`, which only the closed `sim` room sets: dormant |
| `profile` | modal | opens (tabs: dashboard, strengths, history, record/print, settings) | same | opens (no dashboard tab, no `#dash-retake`) | account menu, sidebar, `#home-quick-profile-btn` | `scope.css:36`, `46-47` hide the specialty stat and fix buttons | live |
| Level quiz (`#level-modal`) | - | `#dash-retake` visible on profile | visible; clicking it opened the quiz at question 1 of 8 (verified) | not shown | `$('dash-retake').onclick` (`script.js:5435`) -> `nbOpenLevelModal` (`script.js:2557`) | `scope.css:4-5` says the level quiz is hidden, but only `#path-retake`, `#sec-level`, `#index-level-cta` are hidden (`scope.css:15`, `32`). No onboarding quiz appeared after registration (verified) | live through profile only; other entries dormant |
| `university` | modal | opens, student pane `#uni-student-content` / `#nb8-uni-stu` | same | opens, professor pane with 5 tabs | `#app-nav-uni`, `#side-uni-portal-btn`, `#home-quick-uni-btn`, `#home-student-open-uni-btn`, `#home-prof-open-full-uni-btn` | none since phase8 (`script.js:1677`, `scope.css:10-11`) | live |
| Professor: assign case to a section | - | - | - | works; writes `nabd_v2_assignments` (verified) | `#nb8-tab-assign`, `#nb8-as-save` | `nb8IsProf` (`script.js:6027`) | live |
| Student: assignment card opens ER on the case | - | card visible on home after the professor assigned to `MED-JUST-2026`; click reached ER (verified, see Problems P1) | not verified with an assignment | - | `[data-nb8-open-case]` -> `nb8OpenAssignedCase` (`script.js:6082`) | none | live |
| Professor: custom case form (`#doc-save-case-btn`) | - | - | - | visible in the assign tab | `script.js:6918`; saves to `nabd_v2_custom_cases` | the cards it feeds (`#home-cases-anchor`) are hidden (`scope.css:31`) and `sim` is closed | live control, dormant result (not verified in page) |
| `sim` (specialty case room) | modal | home | home | home | `startSimulationSession` | `REMOVED_VIEWS` (`script.js:1678`, `1949`); `startSimulationSession` returns to home unless emergency mode (`script.js:4266`); with emergency mode it ran but the view stayed home (verified) | dormant |
| `nurse` (nursing cases) | modal | home | home | home | `nurseStart` | `REMOVED_VIEWS`; `nurseStart` first line is `navigateTo('home'); return;` (`script.js:3888`); `#home-nurse` hidden (`scope.css:30`) | dormant |
| `observe` (watch an expert) | modal | home | home | home | `obsStart` (`script.js:3475`), `[data-demo]` in `#home-learn` | `REMOVED_VIEWS`; `#home-learn` hidden (`scope.css:30`) | dormant |
| `coach` | modal | home | home | home | `#app-nav-coach`, sidebar item, `[data-foot-app="coach"]` | `REMOVED_VIEWS`; nav items `er-locked` (`index.html:118`, `222`; `er.css:155`); `scope.css:39-40` | dormant (see P3: comments disagree) |
| `resp` (respiratory room) | modal | home | home | home | `nbOpenResp` (`resp.js:885`) | `REMOVED_VIEWS` makes `navigateTo('resp')` show home; `open()` then still mounts and loads the model (`resp.js:867-869`; return value is `true`, see P4); sidebar item `er-locked` (`index.html:220`); `home9.css:20` | dormant |
| Sidebar "specialty cases" item, `#app-nav-cases` | - | locked / hidden | same | same | - | `index.html:221` `er-locked`; `scope.css:25-26` | dormant |
| OSCE timer toggle, TTS setting, coach API box | - | hidden | hidden | hidden | - | `scope.css:40`, `47` | dormant |

Programmatic `.click()` on the locked coach items (`#app-nav-coach`, first locked sidebar item) left the view on home (verified); the lock itself is CSS `pointer-events:none` plus `tabindex="-1"` and `aria-disabled`.

## User journeys that work today

Visitor landing
1. Page loads on `view-index`; header anchors: about, problem, solution, sections, audience.
2. Any protected view request shows index plus the sign-in page with a notice (`script.js:1952-1958`).
3. "Try an ER case" (`#index-demo-cta`) signs in `med_student` and opens the ER briefing (verified).

Sign-in and registration (verified with a throwaway local account)
1. Register: step 1 name, email, password (8+), role card (nursing / medicine / supervisor); step 2 year, section code, university; submit.
2. Account is created in localStorage, user lands on home with a role hint toast. No level quiz is shown.
3. Sign-out, sign-in with a wrong password: error text, stays on index. Right password: home.
4. Sign-in accepts only non-demo accounts stored on this device (`script.js:7004`).

Demo accounts
1. Sign-in page buttons or `nbDemoLogin(id)`; ids used today: `rana`, `med_student`, `doctor`.
2. A placement record is written for students (`script.js:2045-2052`) so no quiz interrupts.
3. Demo sessions are not restored after reload (`script.js:6539`; code only).

ER room as doctor, briefing to report (verified, offline)
1. Enter ER; briefing sheet with role switch; "start session".
2. Type in `#er-input`, send; companion, patient and nurse answer.
3. `#er-end` opens the hand-over sheet: diagnosis text, disposition select, one SBAR textarea; `#er-end-go` enables when filled.
4. Report shows score, sub-scores, risk timeline, "well done", "what must change", investigations log, summary; buttons home / same case again / next case.
5. A history entry (`caseId: er_<id>`) and `stats.avgEr`, `stats.avgErDoctor` are saved to the account.
6. `navigateTo('debrief')` reopens the report until the next case starts.

ER room as nurse (verified to step 3)
1. `rana` enters ER: role is nurse by track (`er.js:4357`, `4425-4430`); briefing names the nursing supervisor.
2. Start, send a message; offline replies arrive.
3. `#er-end` opens a four-field SBAR sheet (S, B, A, R), no diagnosis or disposition.
4. Report and history entry `er_<id>_n` (`er.js:4239`): not verified in page.

Academic portal for the professor (verified except saves)
1. Home shows the professor section (invite code copy, reports count, tab shortcuts).
2. `university` shows tabs: courses and sections, assign cases, student reports, student progress, academic advisor.
3. Assign: pick case (6 ER cases) and section (3), optional due date and note, save. Stored in `nabd_v2_assignments`.
4. Reports tab: cohort filter, CSV export, "show answers". Advisor tab: status select, note, save (`nabd_v2_advisor`). Not clicked.

Student assignments (verified)
1. Home and `university` list the student's section and assignments for it.
2. The card button opens the ER on the assigned case through `?case=` (`script.js:6082-6100`).
3. Completion is detected from history (`nb8AssignDone`, `script.js:6076`).

Profile
1. Tabs: dashboard (students), strengths, history, training record and print, settings.
2. Students: `#dash-retake` reopens the level quiz; `#dash-hist-go` jumps to history.
3. Print and settings: not verified in page.

## Dormant features and how they would be re-enabled

| Feature | Re-enable steps as the code comments describe |
|---|---|
| Any hidden part (general rule) | "delete its selector below and its guard in script.js" (`scope.css:6-7`) |
| `sim`, `nurse`, `observe`, `coach`, `resp` views | remove the id from `REMOVED_VIEWS` (`script.js:1678`); phase8 did exactly this for `university` (`script.js:1677`) |
| Specialty cases | plus remove the early return in `startSimulationSession` (`script.js:4266`) and `#home-cases-anchor`, `#app-nav-cases` from `scope.css:25-31` |
| Nursing cases | plus remove `navigateTo('home'); return;` in `nurseStart` (`script.js:3888`) and `#home-nurse` from `scope.css:30` |
| Learning path / observe | plus `#home-learn`, `#home-skip-note` in `scope.css:30` |
| Coach | plus `scope.css:39-40` and the `er-locked` class on `index.html:118`, `222` |
| Respiratory room | plus `home9.css:20`, `er-locked` on `index.html:220`, `728` |
| Level quiz entries | `#sec-level`, `#index-level-cta`, `#path-retake` in `scope.css:15`, `32` |
| Other section cards (cardiology etc.) | no code path exists; comment only says cards "open later" (`home9.css:71`) |

## Roles

| Field on the account | Values seen | Where it is checked |
|---|---|---|
| `role` | `student`, `professor`, `practitioner` (demo data, `script.js:1075`); `doctor` is also accepted as professor | `syncAuthShellUI` (`script.js:1882-1883`), `nb8IsProf` (`script.js:6027`), `nbTrackOf` (`script.js:3458-3460`), tiers (`script.js:2402-2411`, `2478`), profile (`script.js:5428`, `5470`) |
| `track` | `medicine`, `nursing`, `null` (set at registration, `script.js:7095`); demo accounts have no `track` | `nbTrackOf` (`script.js:3457`): falls back to `specialty` starting with "الطب" |
| `specialty` | free text from the form | `nbTrackOf`, `nb8StuTrack` (`script.js:6040`) |
| `year` | 1-5 for students | level derivation, beginner check (`script.js:4241`) |
| `cohort`, `cohortName` | section code or `null` | `nb8UserSection` (`script.js:6043`; demo ids are mapped by a literal table), `nb8LocalStudents` (`script.js:6048`) |
| `isDemo` | boolean | login lookup excludes demos (`script.js:7004`), session restore (`script.js:6539`) |

- No view is restricted by role: every signed-in account can open `home`, `profile`, `university`, `er`, `debrief` (verified). Role only selects which blocks render.
- ER role (doctor/nurse) is separate from account role: default from track, switchable by anyone before the first turn (`er.js:3091-3098`, `4357`). The professor gets doctor.
- Role is chosen by the user at registration (`nbSetRegRole`, `script.js:2380`); nothing verifies a supervisor.

## Accounts and persistence

All state is in the browser. There is no server-side account. `safeStorageGet/Set` mirror every write into `window.name` as a fallback (`script.js:1722-1762`).

| Key | Store | Shape | Written at |
|---|---|---|---|
| `nabd_v2_accounts_map` | localStorage | `{ [id]: account }`; account fields: `id` (`local_<email slug>` or demo id), `name`, `initials`, `email`, `passwordSalt`, `passwordHash`, `uni`, `role`, `year`, `roleNameAr`, `specialty`, `roleLabel`, `isDemo`, `track`, `cohort`, `cohortName`, `stats{completed, avgSpec, avgEr, avgErDoctor?, avgErNurse?}`, `strengths[]`, `weaknesses[]`, `recommendations[]`, `history[]`, `learn{obs, guided}` | `saveAccountToStorage` (`script.js:1787`); `er.js:4250`; `resp.js:797` |
| `history[]` entry (ER) | inside account | `caseTitle, mode, correct, workupCount, questions, score, caseId ('er_<id>' or 'er_<id>_n'), num, passed, ts, date` | `er.js:4239` |
| `nabd_v2_active_user_id` | localStorage | account id string | `script.js:2026`, removed at `2063` |
| `nabd_v2_active_sim_meta` | localStorage | `{caseId, isEmergencyMode}` (old sim room) | read at `script.js:6548` |
| `nabd_placement_v1_<userId>` | localStorage | `{track, level, pct, weak[], rooms[], demo?/skipped?, ts}` | `script.js:2050`, `2355`, `2621` |
| `nabd_placement_hist`, `nabd_comments_v1` | localStorage | not determined (constants at `script.js:2462-2463`) | not determined |
| `nabd_v2_assignments` | localStorage | array of `{id, caseId, section, due, note, by, ts}` | `nb8SaveAssignments` (`script.js:6054`) |
| `nabd_v2_advisor` | localStorage | object, shape not determined | `script.js:6055` |
| `nabd_v2_custom_cases` | localStorage | `{ [caseId]: case without image }` | `script.js:1773` |
| `nabd_v2_scratchpads`, `nabd_v2_prof_cohort` | localStorage | not determined | `script.js:1683`, `1685` |
| `nabd_v2_coach_mastered`, `nabd_coach_api_v1` | localStorage | coach progress / config (coach is dormant) | `script.js:5692-5700`, `5865` |
| `nabd_osce` | localStorage | boolean | `script.js:2498`, `2629` |
| `nbSound` | localStorage | `'1'`/`'0'` | `motion.js:316`, read `er.js:4677` |
| `nabd_terms_lang` | localStorage | only removed (`terms.js:113`) | - |
| `nb8_prof_tab` | sessionStorage | tab name | `script.js:6419` |
| `nabd_coach_key` | sessionStorage | user-typed API key for the dormant coach | `script.js:5867`, `5877` |
| ER case in progress (`E`) | page memory only | closure in `er.js` | lost on reload |

Passwords: salted digest computed in the browser (`nbPasswordSalt`, `nbPasswordDigest`, `script.js:1794-1801`); salt and hash sit in the same localStorage map as the account.

## Problems

| # | Severity | Problem | Evidence |
|---|---|---|---|
| P1 | high | ER case state survives sign-out. A case opened by one account is still the open case for the next account on the same page: the professor opened ER, signed out, `med_student` clicked an assignment and got the professor's case plus the toast "you have a case in progress". In run 1 `rana` entered a room whose role was still doctor from the previous account. | `open()` reuses `E` when not over (`er.js:4686`); `logoutUser` (`script.js:2058-2071`) does not touch ER state; runs 1 and 4 |
| P2 | high | Served from any host other than `*.vercel.app`, the rooms call the production API by absolute URL. From `localhost:4181` (allow-listed) local testing would make paid calls; from other origins every room entry still pings production. The task brief's assumption "local /api answers 404" does not describe what the page does. | `er.js:12`, `resp.js:12`, `api/er-chat.js:27`; ping seen in run 5 |
| P3 | medium | Comments disagree with the code about what is offered. `scope.css:3` and `script.js:1675` say ER, respiratory room and coach stay; `REMOVED_VIEWS` closes `resp` and `coach`, and their entries are locked. | `script.js:1678`; `index.html:118`, `220`, `222`; verified redirects |
| P4 | medium | `navigateTo` returns `true` for a removed view after silently switching to home, so callers cannot tell. `nbOpenResp()` then mounts the room and fetches its model while home is shown. | `script.js:1949`; `resp.js:867-872`; run 1 |
| P5 | medium | No role-based access check on views or actions; role is self-declared at registration; all data including the password hash is in localStorage. A student can open the professor tools by editing storage; the professor portal data is per-device. | `script.js:1947-1958`, `2380`, `7089`; `script.js:6019-6020` |
| P6 | medium | Level quiz is described as hidden but is reachable from the profile dashboard (`#dash-retake`). | `scope.css:4-5` vs `script.js:5435`; run 2 |
| P7 | medium | The professor's custom-case form is visible, but the cases it creates feed only hidden cards and the closed `sim` room. | `script.js:6918`, `scope.css:31`, `script.js:4266` (form not clicked) |
| P8 | low | `debrief` view: its own report body can no longer be reached; the view works only as an empty state or a redirect into the ER report. | `script.js:1974-1986` |
| P9 | low | Hiding relies on three mechanisms that must be kept in step by hand: `REMOVED_VIEWS`, early returns in start functions, and `!important` CSS in two files, plus the `er-locked` class. | `scope.css:6-9`, `home9.css:20`, `script.js:3888`, `4266` |
| P10 | low | Dead code after `nurseStart`'s early return, and `startSimulationSession` still runs its body in emergency mode although the view is closed. | `script.js:3888-3892`, `4266-4271` |
| P11 | low | Demo students get their section from a literal id table, registered students from `cohort`. | `script.js:6046` |

## Open questions

1. Should `resp` and `coach` be treated as removed (code) or kept (comments in `scope.css:3`, `script.js:1675`)?
2. Is the level quiz meant to stay reachable from the profile?
3. Should sign-out discard an ER case in progress, or should the case be tied to the account?
4. Nurse ER report and `er_<id>_n` history entry were not run to the end in the page; nurse report content is not verified here.
5. Session restore after reload for a registered account was read in code only (`script.js:6536-6552`).
6. Shapes of `nabd_v2_advisor`, `nabd_placement_hist`, `nabd_comments_v1`, `nabd_v2_scratchpads`, `nabd_v2_prof_cohort`: not determined in this part.
7. Where `#app-brand-btn` leads when signed in: not determined.
