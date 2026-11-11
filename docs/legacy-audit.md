# Legacy audit

This document is the audit of the legacy site of Nabd («نَبْض الأردن»), an Arabic clinical-simulation trainer for
medical and nursing students. It stands on its own. The detail behind every statement is in the 34 part files under
[legacy-audit/](legacy-audit/) (see the [index](#index-of-the-part-files)).

Two warnings apply to everything below.

- The clinical content of the cases was written for training and **has not been reviewed by a physician**. The data
  file says so itself (`reviewed: false`). The system does not diagnose or treat real patients.
- This is an account of the **legacy** site. What the refactoring changed is in [architecture.md](architecture.md).
  Where this document says "today", it means the legacy site as frozen in `tests/Nabd.Tests/LegacyBaseline/`, and,
  because the interface is frozen, the page the new application still serves.

## Scope and method

| Item | Statement |
|---|---|
| What was audited | The whole legacy static site: one `index.html`, nine stylesheets, six scripts, eight JSON data files, and the two external serverless functions the site calls (`api/er-chat.js`, `api/resp-chat.js`) as far as their source could be read. Also the test tooling that existed outside the repository |
| Baseline | Commit `5f431d5` of `main` (`legacy-manifest.json`; the part files cite the same commit) |
| How | 34 readers, one per area (a script line range, a part of `index.html`, a stylesheet group, the data files, each external function, the existing tests, feature reachability). Each reader read every line of its area and wrote a part file. Claims were checked in the code and, where marked "probe" or "verified", in the running page |
| Browser probe | `tools/legacy/browser-probe.mjs` against the legacy site served locally (headless Chrome, fresh profile, 1440x900). Part 34 lists its five runs. The probes never called the deployed external functions |
| Classification | Each feature is labelled **live** (a user can reach it), **dormant** (code and markup exist, but a guard or a style hides it), **unreferenced** (nothing refers to it), or **not determined** (could not be traced) |
| Read-only | The audit changed nothing in the legacy site and deleted nothing. All the code it describes is still in the repository, unchanged |
| Structured result | `.work/docs/audit-structured.json` holds 31 of the 34 parts in structured form. Parts 02, 05 and 09 exist only as Markdown |

Totals in the structured result (31 parts): 358 features, of which 250 live, 90 dormant, 11 unreferenced and 7 not
determined; 291 problems, of which 51 high, 140 medium and 100 low. These counts include the same problem reported
by several parts. Section [Problems found](#problems-found) consolidates them. Parts 02, 05 and 09 are not in these
counts.

Limits of the method, stated by the parts themselves:

- No request reached the deployed external functions. Whether they match the source that was read is not determined.
- Some paths were read in code only and not exercised in the page. Part 34 lists them: reload with a saved session,
  certificate print, settings tab, custom-case save, advisor note save, CSV export, cohort join form, and the nurse
  ER after the handover sheet.
- Online behaviour of the ER room (the paid model answering) was not observed. The offline path was.

## The legacy system at a glance

No build step, no server, no package manager, and no test in the repository. The site was a folder of static files
served from GitHub Pages (`.nojekyll` is in the manifest) and, in parallel, from Vercel, where the two external
functions lived.

| File | Lines | Bytes | Role |
|---|---|---|---|
| `index.html` | 2,318 | 178,399 | The single page: every view, the headers, the drawer, the modals, the footer, the script tags |
| `style.css` | 2,382 | 136,853 | Base: a hand-written utility layer plus four appended design generations |
| `theme.css` | 644 | 53,451 | Design generation v7; reverses v6 geometry, mostly with `!important` |
| `resp.css` | 235 | 21,523 | Respiratory room |
| `er.css` | 432 | 34,863 | Emergency room |
| `scope.css` | 63 | 3,339 | Hides dormant features by CSS only |
| `home9.css` | 75 | 7,328 | Signed-in home order, photo cards, full-page sign-in |
| `landing8.css` | 177 | 10,387 | Landing v8 (almost entirely unused) |
| `landing9.css` | 137 | 13,003 | Landing v9 |
| `academic8.css` | 319 | 22,936 | Academic portal |
| `script.js` | 7,124 | 767,886 | Application shell and everything except the two rooms |
| `er.js` | 4,706 | 420,473 | Emergency room (one wrapper function) |
| `resp.js` | 895 | 53,425 | Respiratory room (one wrapper function) |
| `motion.js` | 651 | 29,009 | Presentation: reveals, count-up, canvas monitor, shared audio context |
| `terms.js` | 127 | 8,486 | Rewrites Arabic clinical terms to English across the page |
| `ui.js` | 54 | 2,320 | Drawer user card |
| `data/*.json` (8 files) | not counted | 2,670,849 | See [Data files](#data-files) |
| `img/**` | 60 files | not summed | Photographs and a credits file (`img/CREDITS.txt`) |

Sources: `legacy-manifest.json` (85 files in all: 1 marker file, 1 page, 9 stylesheets, 6 scripts, 8 data files,
60 images) and `tools/migration/split-plan.json` (script line counts). The stylesheet line counts come from the
frozen copy under `tests/Nabd.Tests/LegacyBaseline/site`.

Load order (parts 24 and 27):

1. `<head>`: two `preconnect` links and one Google Fonts stylesheet (Readex Pro, IBM Plex Mono); nine stylesheets
   in the order `style`, `theme`, `resp`, `er`, `scope`, `home9`, `landing8`, `landing9`, `academic8`; one inline
   script that defines a stub `window.nbImgFail`. Order matters: `scope.css` uses `!important` against `theme.css`.
2. End of the body (lines 2311-2316): six `<script defer>` tags, in this order: `script.js`, `motion.js`,
   `terms.js`, `ui.js`, `resp.js`, `er.js`. Relative paths, no version query.
3. There is no module system. Scripts talk through globals (see
   [Architecture of the legacy code](#architecture-of-the-legacy-code)).

Two external functions are **not in the repository**: `api/er-chat.js` (410 lines) and `api/resp-chat.js`
(284 lines). They were read from a working copy outside it. They hold the model key and the prompts, which this
document does not reproduce. See [External services](#external-services).

Hosts: the page chose the service address by host name. On a host ending `.vercel.app` it used the same-origin
path; on any other host it used the absolute address of the production deployment (`er.js:12`, `resp.js:12`). The
refactoring replaced those two lines (seams 1 and 2 in `seams.json`).

## Features and reachability

Evidence is a phrase; the file and line are in the part named. "Home" below means a request for the view is
redirected to the signed-in home. Reachability for the views is the result of part 34, verified in the running
page for the three demo accounts and for a guest, unless the cell says otherwise.

### Landing and sign-in

| Feature | Where (part) | Reachability today | Evidence |
|---|---|---|---|
| Landing page (hero, facts, closing call to action) | `index.html` 270-403 (24); `landing9.css` (29) | live | Initial view when no saved session (`script.js:6554-6558`) |
| Old landing sections (roles, specialties, operating room, universities, level) | 24, 29 | dormant | Hidden by `scope.css:15-22`; some of those selectors match nothing |
| Landing showcase carousel | 04 | dormant | Targets hidden or missing hosts |
| Landing level quiz | 04 | dormant | Hosts hidden |
| Sign-in and registration page (`#auth-modal`, styled as a full page) | 27, 29, 12 | live | Verified: register, wrong password, right password |
| Registration with role card (nursing, medicine, supervisor) | 04, 12 | live | Verified with a throwaway local account |
| Demo sign-in | 02, 04, 34 | live | Button on the sign-in page and "try an ER case" on the landing; verified |
| Guest redirected to sign-in for protected views | 04 | live | `PROTECTED_VIEWS` guard in `navigateTo` |
| Removed views redirect to home | 04 | live | `REMOVED_VIEWS` (`script.js:1678`), verified for all accounts |

### Signed-in home

| Feature | Where (part) | Reachability today | Evidence |
|---|---|---|---|
| Welcome card, emergency-room card, photo cards | 25, 29 | live | `home9.css` fixes the screen order |
| Photo cards other than the emergency one (7 cards) | 25, 34 | dormant | Shown locked, no button, no code behind them |
| "What to do now" panel and training path | 04, 11, 25 | live for students | Hidden for the professor by role |
| Student university block, assignment cards | 11, 25 | live for students | Verified after a professor assigned a case |
| Professor home: KPIs, cohort table, tab shortcuts | 03, 10, 25 | live for the professor | Role toggle in `syncAuthShellUI` |
| Nurse home, learning path, operating-room cards, specialty cases, coach banner | 07, 25 | dormant | `scope.css:30-31`; `renderTrackHome` returns early (`script.js:4024`) |
| Locked-rooms strip, respiratory teaser | 25 | dormant | `home9.css:20` |
| Debrief view | 25, 34 | live as an empty state and as a redirect to the ER report | Verified |

### ER room, doctor role

| Feature | Where (part) | Reachability today | Evidence |
|---|---|---|---|
| Entry, briefing dialog, clock paused while open | 21 | live | Verified; `help` button reopens the briefing and pauses the clock |
| Monitor tiles, blood-pressure cuff cycle, case clock | 13 | live | `paint`, `tick` |
| Risk progression, stage machine, improvement and arrest events | 13, 19 | live | `netRate`, `stageCheck` |
| Alarm tones (620 and 880 Hz) when sound is on | 13 | live | Web Audio |
| Chat feed, typing dots, English terms in staff lines | 13, 14 | live | `chatEn` (281 ordered regex rules) |
| Reading a free-text message: online (service) | 14, 16, 31 | live, **not observed online** | Paid service was never called |
| Reading a free-text message: offline (act model, finding model, `localRead`) | 14, 15 | live | Verified offline |
| Dose parsing and dose-limit check | 14 | live | `er.js` 763-881 |
| Orders, order safety (allergy, off-case, too early, repeats, total dose) | 16, 18 | live | Executed in the browser only |
| Investigations column, test ordering, result cards | 21, 18 | live | Verified |
| Companion and supervisor "director" | 19 | live | Event-driven lines |
| Handover sheet, grading (server with local fallback), 100-point score, report | 19 | live | Verified offline, briefing to report |
| Saving the result to the account history | 19, 20 | live | `save()` writes `history[]` and averages |
| Supervisor questions a not-indicated test on the spot | 18 | dormant | Switched off in code (`ASK_NO_NOW`) |

### ER room, nurse role

| Feature | Where (part) | Reachability today | Evidence |
|---|---|---|---|
| Role switch before the first turn | 18, 21 | live | `canSwitch` (`er.js:3091`); verified |
| Nursing students start as nurse | 21, 34 | live | Role follows track (`er.js:4357`); verified with `rana` |
| Message routing (doctor, supervisor, relative, patient, self) | 15, 17 | live | Offline routing 70 of 70 phrasings (part 33) |
| Escalation, SBAR call, doctor arrival | 17 | live | State machine |
| Doctor's orders released from case data, executed from a panel | 17, 18 | live | `case.nurseMode.orders` |
| Four-box SBAR handover, seven-section score, report | 20 | live | Verified offline to the sheet; report after it not verified in page |
| Online nurse mode | 17, 20, 31 | not determined | Never exercised; the function's header says it was not live-verified |

### Respiratory room

| Feature | Where (part) | Reachability today | Evidence |
|---|---|---|---|
| History-taking room with synthetic patients, in-browser network, offline answers, tests, scoring | 22 | dormant | `'resp'` in `REMOVED_VIEWS`; no caller of `nbOpenResp`; card hidden |
| Chat endpoint for the room | 32 | dormant; locked in the source read | `LOCKED = true` answers 410 "room closed" |
| `window.__nbResp` test hook | 22 | unreferenced | No reader found |

### Specialty simulation (the older doctor-track room)

| Feature | Where (part) | Reachability today | Evidence |
|---|---|---|---|
| Seven doctor-track cases, workup menu, safety rules, justification, report | 01, 08, 09 | dormant | Guard at `script.js:4266`; `'sim'` in `REMOVED_VIEWS`; verified |
| Home department filter and case grid | 08 | dormant | Locked cards, start does nothing |
| Restore of an interrupted case | 01, 08, 12 | not determined | Stored state not traced |
| Image lightbox, SBAR handover modal | 09 | dormant | Belong to the closed room |

### Nursing rooms and observe

| Feature | Where (part) | Reachability today | Evidence |
|---|---|---|---|
| 13 nursing cases and chat engine, scoring | 06, 07 | dormant | `nurseStart` returns on its first line (`script.js:3888`) |
| Watch an expert (11 scripted demonstrations) | 05, 07 | dormant | `obsStart` returns on its first line |
| NEWS2 helper `nbNews2` | 05 | dormant | Used only by closed rooms |
| Level choice of rooms for nursing track | 06 | live code, leads nowhere | `nbOpenRoom` ignores its id and opens a random ER case (`script.js:2339`) |

### Coach

| Feature | Where (part) | Reachability today | Evidence |
|---|---|---|---|
| Keyword coach, four topics, mastery store | 02, 10 | dormant | `'coach'` in `REMOVED_VIEWS`; entries locked; verified |
| Coach API bridge (posts to a user-typed URL) | 10 | dormant | Hidden by CSS only |

### Profile and level quiz

| Feature | Where (part) | Reachability today | Evidence |
|---|---|---|---|
| Profile: dashboard (students), strengths, history, certificate, settings | 10 | live | Verified; print and settings not verified in page |
| Level quiz (8 questions) | 04 | live through the profile, hidden elsewhere | `#dash-retake` opens it (verified), although `scope.css` comments say it is hidden |
| Onboarding quiz after registration | 04, 07 | dormant | Returns early (`script.js:4064`); none appeared |
| OSCE timer toggle, speech setting | 04, 29 | dormant | Hidden by `scope.css` |

### Academic and professor portal

| Feature | Where (part) | Reachability today | Evidence |
|---|---|---|---|
| University view, professor five tabs (courses, assign, reports, progress, advisor) | 11 | live | Verified |
| Assign an ER case to a section | 11 | live | Writes `nabd_v2_assignments`; verified |
| Student opens an assigned case in the ER | 11 | live | `?case=`; verified |
| Cohort tables, attempt modal, publish grade, CSV export | 03, 10, 12 | live | Seven demo records; publish and export not verified in page |
| Join a section by code | 11 | live | Not verified in page |
| Professor custom-case form | 10, 12 | live control, dormant result | Cases feed hidden cards and the closed room |

### What a user can actually do today

1. Read the landing page, register a local account, or sign in with a demo account (the demo buttons sign in as a
   medical student, a nursing student or the professor).
2. Open the home page and the emergency room as a doctor (medical track and professor) or as a nurse (nursing
   track). Either can switch role before the first turn.
3. Run an ER case: talk to the patient, the relative, the nurse and the supervisor; give orders; order tests; hand
   over; read the report. Without the paid service the room works with the offline reader and fixed lines.
4. Have the result saved to the account's history in the browser, and see it on the profile page and the
   certificate view.
5. As the professor: assign ER cases to sections, read the demo cohort, publish a grade and write notes. These
   stay in that browser.
6. As a student: see the assignments for the section and open one.
7. Retake the level quiz from the profile.

A user cannot reach: the specialty simulation, the nursing rooms, "watch an expert", the coach, or the
respiratory room. Their code and markup are still in the page.

## Roles and accounts

All of this is client-side. There is no server-side account (part 34; [decision 0008](decisions/0008-no-database-and-no-authentication-in-this-phase.md)).

| Field on the account | Values seen | Where used |
|---|---|---|
| `role` | `student`, `professor`, `practitioner`; `doctor` accepted as professor | Which blocks render; professor tabs; tiers |
| `track` | `medicine`, `nursing`, `null` (set at registration) | Default ER role; falls back to a specialty starting with «الطب» |
| `specialty`, `year` | Free text from the form; 1-5 | Level derivation |
| `cohort`, `cohortName` | Section code or `null` | Assignments, student lists |
| `isDemo` | boolean | Demo accounts are excluded from login lookup and from session restore |

- **Demo accounts.** `DEMO_ACCOUNTS` defines five accounts with seeded statistics and history (four learners and
  one professor; part 02). The sign-in page offers three (`rana`, `med_student`, `doctor`; part 34). Demo sessions
  are not restored after a reload (`script.js:6539`, read in code).
- **Passwords.** Local accounts are stored with a salt and a hash (PBKDF2 helpers, part 04). The comparison runs in
  the browser. An account without a stored hash accepts any first password and stores it (part 12).
- **Choosing a role.** The user picks the role at registration. Nothing verifies a supervisor. Anyone can also sign
  in as the demo professor.
- **No view is restricted by role.** Every signed-in account can open home, profile, university, ER and debrief.
  Role only selects which blocks render and which tabs show.
- **ER role is separate** from the account role: default from the track, switchable by anyone before the first turn.
- **Persistence.** `safeStorageGet/Set` write to `localStorage` and mirror every write into `window.name`
  (`script.js:1722-1762`). Anyone who can edit the browser storage can change the role, the history and the grades.

## Architecture of the legacy code

### Global state and how scripts talk

- There is no module system. `script.js` is one classic script with no wrapper; its `const` and `function`
  declarations are global bindings that the other scripts read. `er.js` and `resp.js` are each wrapped in one
  function and expose only a few `window` members.
- `script.js` defines the shell state: `authState`, `simState`, `currentView`, `navigateTo`, the storage helpers,
  `STORAGE_KEYS`, `showToast` and the tier helpers (part 04).
- `er.js` and `resp.js` use free globals from `script.js` guarded by `typeof` (`authState`, `nbTrackOf`,
  `navigateTo`; part 21).
- `script.js` and `terms.js` reach into the ER room through the test hook `window.__nbER` (`script.js:6060`, `6097`;
  `terms.js:82-83`). The hook has 42 keys and exposes the live case file and mutators. It is on production pages.
- Other cross-script names: `window.nbOpenER`, `window.nbErReport`, `window.nbErVitals` (alarm limits),
  `window.nbAudio` (shared audio context, `motion.js`), `window.nbOpenResp`, `window.__nbResp`.
- The single initialiser `initNabdApp` (`script.js:6530-7118`, 589 lines) restores the session, renders the first
  view and wires about 120 listeners (part 12).
- The ER room keeps its whole session in one closure object `E` (about 70 fields, built in `begin`, `er.js:4344`).
  It survives sign-out: the next account on the same page gets the previous account's case and role (part 34).

### Storage keys

| Key | Holds | Part |
|---|---|---|
| `nabd_v2_accounts_map` | All accounts, with salt, hash, statistics, history | 34 |
| `nabd_v2_active_user_id` | Id of the signed-in account | 34 |
| `nabd_v2_active_sim_meta` | Case in progress of the old simulation | 34 |
| `nabd_placement_v1_<userId>` | Level quiz result | 34 |
| `nabd_v2_assignments` | Case assignments by section | 34 |
| `nabd_v2_advisor` | Advisor notes (shape not determined) | 34 |
| `nabd_v2_custom_cases` | Professor custom cases | 34 |
| `nabd_v2_prof_cohort` | Published cohort records (shape not checked on read) | 03 |
| `nabd_v2_scratchpads`, `nabd_placement_hist`, `nabd_comments_v1` | Not determined | 34 |
| `nabd_v2_coach_mastered`, `nabd_coach_api_v1` | Coach progress and bridge settings (coach is dormant) | 34 |
| `nabd_osce`, `nbSound`, `nabd_terms_lang` | Exam-mode flag, monitor sound preference, a flag that is only removed | 34 |

Every write is mirrored into `window.name` (`__NABD_STORE__`). Part 03 shows this as a path by which a payload set
on another page can reach the site.

### Network calls

| Call | From | Purpose |
|---|---|---|
| `GET data/<file>.json` | `er.js`, `resp.js`, `script.js` | Load cases and models (timeouts: act model 4 s, finding model 8 s, cases none) |
| `POST /api/er-chat` (turn, line, grade) | `er.js` | Read, voice, grade (timeouts 15 s, 9 s, 12 s) |
| `GET /api/er-chat?ping=1` | `er.js` | Free availability check on entry (4.5 s) |
| `POST /api/resp-chat` | `resp.js` | Respiratory room; room dormant (15 s) |
| `POST <user-typed URL>` with a bearer token | `script.js` coach bridge | Dormant; hidden by CSS only |
| Google Fonts | `index.html` head | Fonts; the page start depends on a third-party host |

Offline state machine of the ER room: `try`, `on`, `off`. After failures the room switches to the offline reader and
retries after 60 s. A 429 from the function switches the room to offline mode for 60 s (part 31).

### Timers and audio

- The ER clock is a `requestAnimationFrame` loop started in `begin` (`er.js:4344`); one frame advances simulated
  time. A job scheduler (`later`, `soon`) runs timed lines and effects.
- Monitor tiles are re-drawn with random jitter (3 random draws per paint). `motion.js` runs a canvas ECG and
  plethysmograph in four rooms and overwrites the heart-rate tile with a rate computed from random beat intervals
  (`motion.js:441-451`; part 23).
- Companion and supervisor break-ins draw from `Math.random` (`er.js:3641-3659`).
- Alarm tones use Web Audio (`er.js:234-255`) and a shared `AudioContext` from `motion.js`.
- Short timers: a 260 ms advance after a quiz click (no lock, so a quick double click skips a question), a 1.8 s
  CSS flash, a toast timeout.

### The ER room by section

`er.js` is 4,706 lines in one wrapper. The fragments and their layers are in
`src/Nabd.Web/ClientScripts/er/README.md`. Summary by line range:

| Lines | Content | Part |
|---|---|---|
| 12-60 | Config, module state, helpers | 13 |
| 61-255 | Vital signs from risk, monitor paint, risk tick, stage machine, scheduler, alarm tones | 13 |
| 256-593 | `chatEn`: English ward terms (display only) | 13 |
| 594-706 | Chat feed; server client, ping, offline switch | 14 |
| 707-1369 | Offline models, dose reading, order lexicon, `localRead` | 14 |
| 1370-1896 | Nurse-mode reading; offline reply generator for both rooms | 15 |
| 1897-2536 | Message intake, `apply`, open-question logic, order safety rules, nurse scope | 16 |
| 2537-3100 | Nurse mode: routing, escalation, release and execution of orders, orders panel | 17, 18 |
| 3101-3557 | Order checks, `give`, unsafe and harm, `resolve`, tests | 18 |
| 3558-3954 | Companion, director, supervisor, arrest, handover sheet, scoring, report | 19 |
| 3955-4254 | Nurse handover, nurse score, nurse report, saving a run | 20 |
| 4255-4706 | Records column, `begin`, briefing, mount, back button, open, test hook | 21 |

### Where clinical rules sit

| Rule | Where | Part |
|---|---|---|
| Vital signs from risk, treatment modifiers, net risk rate, stages, cuff | `er.js` 61-217 (ported to `Nabd.Domain`, pinned by golden masters) | 13 |
| Dose parsing and limits | `er.js` 763-881 with limits in `er-cases.json` | 14 |
| Order safety: allergy, off-case, too early, repeats, totals | `er.js` 2385-2458, 3101-3208 | 16, 18 |
| Nurse scope, escalation, order execution, SBAR grader | `er.js` 2459-2992 | 17 |
| Doctor score, fail rules, disposition | `er.js` 3774-3953 (score ported to `Nabd.Domain`) | 19 |
| Nurse score (7 sections, 7 hard fails, pass at 70) | `er.js` 4031-4106 | 20 |
| Per-case evaluation data (diagnoses, steps, results, weights) | `data/er-cases.json` | 30 |
| Reading rules, routing, diagnosis-leak check, dialect fixes | The external function and `er-lang.json` | 31 |
| Older specialty room: point values (-15, +5, -5) | Inside DOM handlers, `script.js` 4453-4921 | 08 |
| Alarm limits | Three different sets: `nrWarn` (`script.js:3588`), `nbErVitals` (`er.js:113`), `nbRespVitals` (`resp.js:249`) | 23 |
| Level quiz tiers and pass mark (70 percent, cut-offs 45 and 78) | `script.js` 2124-2650 | 04 |

The ER room's rules are interleaved with Arabic text building, DOM writes and state mutation. The role branch
`NM()` (nurse mode) appears more than 45 times inside shared functions (part 18).

## Data files

Eight JSON files, served unprotected at `/data/` by the legacy site. All parse. Full inventory, field shapes and
what a trainee could learn from each: [data-catalog.md](data-catalog.md) and part 30.

| File | Bytes | Content | Read by |
|---|---|---|---|
| `er-cases.json` | 259,214 | 6 ER cases, 22 tests, 42 actions; per-case evaluation rules and results; `reviewed: false` | Browser (`er.js`); the function |
| `er-act.json` | 410,682 | Linear classifier for 10 dialogue acts (offline) | Browser |
| `er-find.json` | 737,985 | Linear classifier, 122 classes of history findings (offline) | Browser |
| `er-lang.json` | 7,983 | Two prompt texts and 124 dialect-correction pairs | Only the function, never the page |
| `resp-ar.json` | 360,470 | Arabic wording for 223 evidences, 199 value labels, 49 conditions | Browser and the function |
| `resp-clinical.json` | 111,272 | Per-condition vitals and test ranges for 22 conditions; 12 tests | Browser (dormant room) |
| `resp-model.json` | 522,631 | 3-layer int8 network over 49 conditions | Browser (dormant room) |
| `resp-patients.json` | 260,612 | 1,296 synthetic patient records with the true condition index | Browser (dormant room) |

Findings (part 30): the cases file ships diagnoses, accepted answers, correct doses and scoring rules to every
browser; the respiratory files let a reader recover the true condition of each patient; case `dka` has five result
keys with no entry in `tests[]`; case `htn` uses the id `neuro` in two arrays; 60 of 121 finding classes appear in no
case (recomputed from the two files: 61 are mapped, 60 are not; part 30 writes 61 for both). The models were trained elsewhere; the training code is not in the repository.

## External services

Details: part 31 (`er-chat`) and part 32 (`resp-chat`), and [decision 0006](decisions/0006-understanding-services-through-a-gateway.md).
Neither function was called by the audit.

| | `api/er-chat.js` | `api/resp-chat.js` |
|---|---|---|
| Kind | Stateless serverless handler, ES module | Stateless serverless handler |
| Modes | `turn` (read the message, then optionally voice a reply), `line` (an unprompted line), `grade` (diagnosis and SBAR), `GET ?ping=1` (no model call) | One request per student message: read, decide in code, speak |
| Model calls | 1 or 2 per turn; 1 per line or grade | 2 per message in most modes; 1 for fixed-reply kinds |
| State | None. The page sends the full room state each time | None. The page sends the positive facts of the patient each time |
| Access control | `Origin` must be the function's own host or one of two listed origins; requests without `Origin` are refused with 403 | Same kind of origin check (source lines 79-83, 186) |
| Rate limit | In memory per warm instance: 150 per address per minute, 400 per instance per minute; 429 above | None |
| Spend limit | A comment refers to a limit in the provider console; not verifiable from the code | Not in code |
| Safety logic | Diagnosis-leak check on supervisor and instructor lines; dialect fixes from `er-lang.json` | A guard line in the speak prompt only |
| State today | Live as far as the source shows | **Locked in the source read**: `LOCKED = true`, so every request, including `OPTIONS`, gets HTTP 410 `{"error":"room closed"}`. Whether the deployed function is locked is not determined |

Contract in short:

- Requests are JSON. Fields are cut to fixed lengths on the server (for example `text` to 400 characters in
  `er-chat`, 300 in `resp-chat`).
- Responses carry `Cache-Control: no-store` (`er-chat`). The page reads only the status code, never the error text,
  and decides from it whether to work offline.
- The client builds some prompt text itself (`pending.ask`, `why`, `facts`), and the functions insert it into the
  model prompts. Any caller can therefore steer the output (see the high problems below).
- Grading trusts the client: the page sends the record of what was done and computes the score; the function only
  judges the diagnosis and handover text.

What the refactoring changed here: the page now calls the application's own `/api/er-chat` and `/api/resp-chat`,
which relay to the functions after a same-origin check, a per-address limit, a 64 KB body limit and, for the ER
room, a case-id check. The functions themselves were not touched and still gate by `Origin`. The stop-gap this creates is in
decision 0006.

## Problems found

Source: the `problems` of 31 parts plus the three Markdown-only parts, consolidated. The same defect often appears in
several parts; each row names them. Counts at the end of the section.

Kinds: security, data-exposure, bug, architecture, duplication, dead-code, maintainability.

**The refactoring preserved these problems on purpose**, because the objective was zero regression with a frozen
interface ([decision 0002](decisions/0002-lossless-strangler-migration.md)). The exceptions are the ones
[architecture.md](architecture.md) lists as changed: the data files are no longer public static files (the browser
can still fetch the documents the application names); the two script lines that chose the production service
address are replaced; the relay adds its checks; response headers were added; a server-side session API exists and
is off by default. Fixing any other item is a registered, reviewed change.

### High severity

| # | Problem | Kind | Where (part) |
|---|---|---|---|
| H1 | Accounts, roles, salts and hashes live in `localStorage`, copied to `window.name`; login is a comparison in the browser; the role can be edited | security | 04, 12, 10, 11, 34 |
| H2 | Anyone can sign in as the demo professor; the professor role can be chosen at self-registration; no verification | security | 04, 12 |
| H3 | Professor actions (assignments, notes, publication) are guarded only in the browser and kept in `localStorage`; they are editable by students and not shared between devices | architecture | 11, 03 |
| H4 | Stored text (history, cohort, module data) is written into `innerHTML` without escaping; a `window.name` payload can reach it when the key is absent | security | 03, 10 |
| H5 | A stored cohort of the wrong shape (`'{}'` or `'null'`) makes the cohort render throw, from an unguarded call at start-up | bug | 03 |
| H6 | `er-cases.json` is fetched whole by the browser: diagnoses, accepted answers, correct doses, indicated tests, risk and scoring rules for every case | data-exposure | 30, 01, 18 |
| H7 | `resp-patients.json` holds the true condition of 1,296 patients and `resp-model.json` the full network, both downloadable | data-exposure | 30 |
| H8 | The old case catalog ships expected workup ids, ideal summaries and result texts to every client | data-exposure | 01 |
| H9 | `window.__nbER` is on production pages: the live session, all cases, and mutators (`setRisk`, `jump`, `end`, `score`, `set api`). Production code depends on it | data-exposure, architecture | 21 |
| H10 | On any host not ending `.vercel.app` the rooms call the absolute production address of the paid function; local runs ping production, and an allow-listed origin would make paid calls | architecture | 13, 14, 16, 22, 31, 34 |
| H11 | `er-chat` and `resp-chat` have no authentication; the only gate is the `Origin` header, which a non-browser client can forge | security | 31, 32 |
| H12 | `er-chat` spend protection is in memory per warm instance and resets every minute and on cold start; `resp-chat` has none | security | 31, 32 |
| H13 | Client-supplied text (`why`, `pending.ask`, `facts`, `history`, `patient.name`) goes into model prompts as authoritative lines; the `speaker` value is not validated | security | 16, 31, 32 |
| H14 | ER case state survives sign-out; the next account on the page gets the previous case and role, and an assignment click is refused as "case in progress" | bug | 34 |
| H15 | `motion.js` overwrites the heart-rate tile with a value from random beat intervals, against its own header; alarm limits differ in three files | architecture | 23 |
| H16 | Large functions mix clinical rules, Arabic text, DOM and state: `initNabdApp` (589 lines), `apply` (about 170), `order`/`resolve`/`give`, `conclude`, `begin`, `localRead` (278) | architecture | 12, 16, 18, 19, 21, 14 |
| H17 | Role branching (`NM()`) appears 45+ times inside shared ER functions | architecture | 18 |
| H18 | Clinical point values are written inside DOM handlers of the older specialty room | architecture | 08 |
| H19 | Global mutable state shared by about 50 nursing functions mixing scoring, DOM and storage | architecture | 07 |
| H20 | About 700 lines of the specialty room, 114 KB of nursing data and a 700-line nursing engine cannot run from the UI | dead-code | 06, 07, 08, 01 |
| H21 | Dormant markup (about 400 of 700 lines in the home views) is still bound or written by script; removing it can throw | dead-code | 25, 26 |
| H22 | `view-resp` and `view-coach` are closed but wired; project notes called the respiratory room live, the code and the probe do not support that | dead-code | 22, 26, 29, 34 |
| H23 | Visibility is controlled in four places (class `hidden`, `REMOVED_VIEWS`, `scope.css` with `:has()`, `academic8.css`) | maintainability | 26, 29, 34 |
| H24 | Five design generations are active at once; each overrides the last with `!important` (339 and 282 lines in the two base files); `landing8.css` is dead | maintainability, dead-code | 28, 29 |
| H25 | Six cases' `workupOverrides` are overwritten wholesale by later assignments; the earlier copy is stale | duplication | 01, 02 |
| H26 | `offlineAnswer` (a reader) mutates `E.queue` and `E.pending` and recurses; `localRead` calls it, and is called twice on one path. Effect of the second call not determined | architecture | 14 |
| H27 | Source order differs from screen order in the signed-in home (flex `order`), so partial markup must follow the DOM | maintainability | 25 |
| H28 | The existing test tooling lived outside the repository; its stored conversation golden master was stale (54 field differences in 12 rooms); the browser-only branches of the ER room and all other scripts had no test | maintainability | 33 |

### Medium severity

140 medium rows were reported. They fall into the themes below. Each row names the parts.

| Problem | Kind | Where (part) |
|---|---|---|
| Quiz answer indexes and nursing data (`rf` closures, positional conventions) ship to the client or cannot be serialised | data-exposure, maintainability | 04, 06 |
| Pending questions carry the reference dose and reading in client state | data-exposure | 18 |
| Cohort and notes identified by display name; collisions and renames break the link | architecture | 03, 11, 04 |
| Seed data and persisted state are one structure without version or migration; the default cohort is returned by reference and mutated | bug, architecture | 03 |
| Publication never leaves the device | architecture | 03 |
| Re-assigning a case resets its timestamp, so finished work becomes unfinished; late flag uses a UTC date against a local due date | bug | 11 |
| CSV export has no quote escaping and allows spreadsheet-formula injection | security | 12 |
| An account without a stored hash accepts any first password; account id sanitising can make different emails collide (not run) | bug, security | 12 |
| Quiz option click advances after 260 ms with no lock; `nbOpenRoom` ignores its id and opens a random ER case | bug | 04, 06 |
| `nrFinish` uses `authState.user` without a null check; `avgSpec` stores the latest score, not an average; ER `save()` replaces seeded `avgEr` with the mean of ER runs only (a demo 81 percent became 2 percent after one run) | bug | 07, 20 |
| Specialty room: chat rule swallows free text as a justification; `w_admin_med` after the allergy question is always a violation; violation block copied four times | bug, duplication | 08 |
| Coach awards mastery and says 100 percent on substring hits; coach bridge posts a bearer token to a user-typed URL | bug, security | 10 |
| Inconsistent professor-role test in three places | architecture | 10 |
| `sameDose` accepts an unparsable dose and the nurse then gives the ordered dose; `escGiveUp` bypasses `escFinish` | bug | 17 |
| Offline `localGrade` is lenient: a one-line SBAR at minute 0 can score; online and offline handover grades differ | bug | 19, 20 |
| `open()` runs `begin()` inside the loading `try`: any start-up exception reads as "cases could not be loaded"; an unknown `?case=` falls back to a random case | bug | 21 |
| The trainee can pause the case clock by reopening the briefing | maintainability | 21 |
| Regular-expression lookbehind at `er.js:597` and `1201`: a browser without support cannot parse `er.js` at all; required browsers not stated | bug | 14 |
| `tick` mutates the job list while iterating; `paint` both takes the cuff reading and renders | bug, architecture | 13 |
| `justGood` duplicates `evaluateScientificJustification`; TF-IDF code, queue-reorder block and other blocks duplicated; an "early unsafe order" predicate written six times; lull rules written twice with different limits | duplication | 13, 14, 16, 19 |
| Domain decisions interleaved with Arabic sentences; text-producing functions mutate state; domain state stores a DOM node | architecture | 15, 16, 17, 18 |
| Dated patches ("chat fix 2026-11-08", "phase8") add special cases inside shared functions; 1,500-character single statements | maintainability | 16, 18 |
| Hard-coded clinical thresholds and content inside logic (SpO2 below 94, SBP below 100, gauge 18) | maintainability | 15 |
| Server grading trusts the client record; clinical routing rules split between the browser and the function | architecture | 31, 16 |
| A 429 switches the whole room offline for 60 s; worst-case server time equals the page's 15 s abort | architecture | 31 |
| Student text concatenated into both model calls with one guard line; the kill switch is a source constant that needs a redeploy; `resp-ar.json` imported at build, so versions must match | security, architecture | 32 |
| `resp.js open()` mounts and loads the model after being redirected home; its circuit rule misses the 410 the function returns; test results depend on test order | bug | 22 |
| Monitor not reproducible (`Math.random`); `terms.js` rewrites all text nodes with no restore; listeners and observers never removed | maintainability | 23 |
| About 45 element ids are looked up by script and must stay unique and unchanged; an id with a leading space (line 837); an id with a capital letter; inline handlers click other buttons by id | maintainability | 24, 25, 26, 27 |
| Demo data hard-coded in markup (counts, names, certificate values) and overwritten by script | maintainability | 25, 26 |
| Professor, student and nurse blocks are sent to every user and hidden by script | security, architecture | 24, 25 |
| Duplicate listener on `#stu-modal-toggle-pub-btn`; `#level-modal` has no accessible name; misplaced comment | bug, maintainability | 27 |
| Token duplication (seven `:root` blocks), contradictions between design generations, invalid CSS, about 700 hand-written utility lines, 131 `!important` lines in the feature sheets | maintainability | 28, 29 |
| Dangling references in data: five result keys of case `dka`, id collision in `htn`, mixed types in `nurseMode.escBy`, 60 of 121 finding classes unused | data, maintainability | 30 |
| Comments disagree with code about which rooms stay (`scope.css:3`, `script.js:1675`); `navigateTo` returns true after redirecting a removed view | maintainability | 34 |
| Test tooling: suites 1-12 exit 0 even on failure; absolute paths on one machine; five helper folders empty; fake DOM never dispatches listeners; one random stream feeds display, line choice and break-ins | maintainability | 33 |

### Low severity

100 low problems in the 31 structured parts. By kind: maintainability 20, bug 15, duplication 13, dead-code 8,
security 4, data-exposure 4, architecture 4, and 32 spread over 31 smaller kinds. Themes: stale or unused CSS rules
and comments; a11y gaps; unread data fields; copy drift between near-identical blocks; small wording or digit
handling differences; unloaded fonts and an external Wikimedia background that is never used; an exposed test hook
in tooling; a paid endpoint named in tooling; inconsistent limits between files.

## Dead-code candidates

These are **candidates**, not decisions. **Nothing was removed.** A zero-regression migration of a frozen interface
cannot remove code that the baseline tests compare character by character; a removal changes the bytes the browser
receives, and the code may be re-enabled by deleting one guard (part 34 lists the steps). Removal is a product
decision (open question: keep, archive or restore) and a separate, registered change.

Top-level names with no other occurrence (`.work/docs/xref.md`; searched across all scripts and the page):

| File | Declarations | With no other occurrence | Names (line) |
|---|---|---|---|
| `script.js` | 281 | 4 | `NB_QBANK` (2146), `NB_QTRACK` (2154), `nbHandoffNote` (2900), `nbDoctorCard` (3451) |
| `er.js` | 361 | 0 | none |
| `resp.js` | 86 | 0 | none |
| `motion.js` | 38 | 0 | none |
| `terms.js` | 13 | 0 | none |
| `ui.js` | 5 | 0 | none |

The cross-reference does not find code that is referenced only from dormant paths. Those are the dormant features:

| Candidate | Part | Why it is dormant or unreferenced |
|---|---|---|
| Specialty simulation, its catalog, workup engine, report | 01, 08, 09 | Guard at `script.js:4266` and `'sim'` in `REMOVED_VIEWS` |
| Nursing rooms and data, observe view, learning path | 05, 06, 07 | Early returns in `nurseStart` and `obsStart`; hidden entries |
| Coach and its API bridge | 02, 10 | `'coach'` in `REMOVED_VIEWS`; entries locked |
| Respiratory room, `resp.css`, `resp-*.json` | 22, 29, 30 | `'resp'` in `REMOVED_VIEWS`; no caller of `nbOpenResp`; endpoint locked in the source read |
| `landing8.css` (`.l8-*`), stale `scope.css` selectors, `html.nb9-auth-page` | 28, 29 | Zero matches in the page and scripts |
| `.nb-flagline`, `.nb-slide`, `data-terms`, `data-stage` styling | 28 | Only in the stylesheet |
| `delta` and `isContraindicated` on case questions | 01 | Never read |
| `window.__nbResp`; `terms.js` `orig` and `termsTitle`; cohort field `caseId` | 22, 23, 03 | No reader found |
| Nurse-mode branches in `supervisorLine`, `nurseLine`, `unplacedReply` | 15 | Unreachable or not traced |
| `ASK_NO_NOW` on-the-spot test challenge | 18 | Switched off |
| Dormant home and landing markup | 24, 25, 26 | Hidden by CSS; script still writes into it |

## Existing tests before the refactoring

Part 33. The repository had **no tests**. Test tooling lived in a separate working folder (`nabd-model/lang`) outside
the repository, and ran only against the ER room.

| Item | Statement |
|---|---|
| Harness | `harness-er.js`: runs the unmodified `er.js` in a Node `vm` with a string-only fake DOM, a manual frame clock, a seeded random source and a `fetch` stub that cannot reach the network |
| Suites | 19 `audit-fix-test` suites (doctor and nurse behaviour, doses, safety, ending, chat coherence, chat terms); 1,521 checks, all passing against the checkout |
| Replays | Two replays of recorded server answers (7 and 5 checks), passing |
| Evaluations | Nurse routing 70 of 70; orders 84 of 86 (no pass threshold); a bank of 471 doctor-room messages (read 471 of 471, room 470 of 471); model parity 435 of 435; dialect filter 62 of 62 |
| Conversation golden master | `golden-doctor.js`: byte-reproducible, but its stored file no longer matched the current `er.js` (54 field differences across 12 rooms) |
| Not run | `api-nurse-test.mjs`, `eval-route.js`, `run-persona.js`, `run-all-suites.sh` as a whole: their helper folders were empty |
| Coverage gaps | The browser-only branches of the ER room (briefing, injected boxes, back button, resize observer, role reset, `save()` into the account); no test touched `script.js`, `resp.js`, the response function of the respiratory room, `ui.js`, `motion.js` or `terms.js` |
| Determinism limits | Real `Date.now`; one random stream shared by display, line choice and break-ins; hard-coded absolute paths; suites 1-12 always exit 0 |

What was brought into the repository: `tests/legacy-baseline/` holds a modified copy of the harness (adds `NB_ER_JS`,
`NB_DATA` and a `transform` option), the instrumentation script, the recorder of the clinical golden masters, the
conversation recorder and its golden file. The 19 suites, the evaluations, the replays and the parity tests were not
brought in. The testing results of the new solution are in [testing-strategy.md](testing-strategy.md).

## What the audit could not determine

Grouped from the open questions of the parts (181 in the 31 structured parts; the important ones are below).

**Product intent**

- Whether the dormant features (specialty simulation, nursing rooms, observe, coach, respiratory room) are retired
  or only paused: keep, archive, restore or delete (parts 01, 04, 06, 07, 22, 26, 29).
- Whether the nursing track will be reopened (decides what happens to its data and engine; part 07).
- Whether a random ER case is the intended result of `nbOpenRoom` for nursing students (part 06).
- Whether the level quiz is meant to stay reachable from the profile (parts 04, 34).
- Whether `window.__nbER` is to stay on production pages (part 21).

**Clinical content**

- Whether any dose, threshold or pass mark was reviewed by a clinician. The data says `reviewed: false` (parts 06,
  30).
- Which alarm-limit set is authoritative; whether the 70 percent pass mark and the level cut-offs of 45 and 78 are
  fixed rules; whether the nurse score weights are official (parts 04, 07, 13, 23).

**External services**

- Whether the deployed functions match the source that was read; whether `resp-chat` is locked in production
  (parts 22, 32).
- Whether a spend limit exists in the provider console; the platform body-size limit (part 31).
- The behaviour of online nurse mode and of online grading, which were never exercised (parts 17, 20).
- Which side should own the safety rules and the SBAR grader once the room moves to the server (part 16).

**Accounts and data**

- Whether the seven demo students are fictional (the markup labels them demo; part 03) and which key should join a
  cohort record to an account.
- Where `nabd_placement_hist`, `nabd_comments_v1`, `nabd_v2_scratchpads` and `nabd_v2_advisor` are read and what
  shape they hold (part 34).
- Whether a `window.name` set on another origin reaches the site in the target browsers, which decides the real
  severity of the injection path (part 03).

**Code paths not traced**

- Which flow writes `ACTIVE_SIM`, and whether a stored case can revive the specialty room (parts 01, 08, 12).
- Whether `nbAfterReport` is reachable from a live path (part 04).
- The reachability of several nurse-mode branches in the offline reply generator (part 15).
- Whether a queued job can end the case or call `send()` (part 13).
- Whether the second `localRead` call on one path is safe (part 14).

**Environment**

- Which browsers must be supported (lookbehind regular expressions; part 14).
- Phone layouts (records sheet, back button, coarse-pointer focus) were read in code only (part 21).
- Which script rewrites the briefing heading and report terms after render (parts 20, 21).

## Index of the part files

| Part | Area | File |
|---|---|---|
| 01 | `script.js` 1-687: case catalog and workup catalog | [01-script-case-catalog.md](legacy-audit/01-script-case-catalog.md) |
| 02 | `script.js` 688-1206: workup overrides, coach topics, demo accounts | [02-script-coach-topics-demo-accounts.md](legacy-audit/02-script-coach-topics-demo-accounts.md) |
| 03 | `script.js` 1207-1673: professor cohort defaults | [03-script-cohort-defaults.md](legacy-audit/03-script-cohort-defaults.md) |
| 04 | `script.js` 1674-2648: views, navigation, sign-in, storage, level quiz | [04-script-views-auth-quiz.md](legacy-audit/04-script-views-auth-quiz.md) |
| 05 | `script.js` 2649-2891: tracks, NEWS2, expert demonstrations | [05-script-tracks-a.md](legacy-audit/05-script-tracks-a.md) |
| 06 | Nursing question bank and nursing case data | [06-script-nursing-data.md](legacy-audit/06-script-nursing-data.md) |
| 07 | Nursing rooms, operating-room section, track logic | [07-script-nursing-rooms.md](legacy-audit/07-script-nursing-rooms.md) |
| 08 | Home department tabs and the specialty simulation engine | [08-script-home-and-sim-engine.md](legacy-audit/08-script-home-and-sim-engine.md) |
| 09 | `script.js` 4969-5305: lightbox, SBAR handover, report | [09-script-lightbox-handover-report.md](legacy-audit/09-script-lightbox-handover-report.md) |
| 10 | `script.js` 5306-6009: profile, professor cohort, coach | [10-script-profile-professor-coach.md](legacy-audit/10-script-profile-professor-coach.md) |
| 11 | `script.js` 6010-6529: academic section | [11-script-academic-a.md](legacy-audit/11-script-academic-a.md) |
| 12 | `script.js` 6530-7124: initialiser and listeners | [12-script-init-listeners.md](legacy-audit/12-script-init-listeners.md) |
| 13 | `er.js`: setup, clinical state, alarm tones, English terms | [13-er-setup-clinical-state.md](legacy-audit/13-er-setup-clinical-state.md) |
| 14 | `er.js` 594-1369: stream, server client, offline reader | [14-er-stream-server-offline-reader.md](legacy-audit/14-er-stream-server-offline-reader.md) |
| 15 | `er.js` 1370-1896: nurse-mode reading, offline replies | [15-er-nurse-reading.md](legacy-audit/15-er-nurse-reading.md) |
| 16 | `er.js` 1897-2536: message handling and orders | [16-er-message-and-orders.md](legacy-audit/16-er-message-and-orders.md) |
| 17 | `er.js` 2537-3036: nurse message, escalation, orders | [17-er-nurse-message-escalation-orders.md](legacy-audit/17-er-nurse-message-escalation-orders.md) |
| 18 | `er.js`: nurse panel, order pipeline, tests | [18-er-nurse-panel-and-tests.md](legacy-audit/18-er-nurse-panel-and-tests.md) |
| 19 | `er.js`: director, companion, doctor ending | [19-er-director-and-ending.md](legacy-audit/19-er-director-and-ending.md) |
| 20 | `er.js`: nurse handover, score, report | [20-er-nurse-handover-score-report.md](legacy-audit/20-er-nurse-handover-score-report.md) |
| 21 | `er.js`: records column, start, briefing, test hook | [21-er-records-start-briefing.md](legacy-audit/21-er-records-start-briefing.md) |
| 22 | `resp.js`: respiratory room | [22-resp-room.md](legacy-audit/22-resp-room.md) |
| 23 | `ui.js`, `motion.js`, `terms.js` | [23-ui-motion-terms.md](legacy-audit/23-ui-motion-terms.md) |
| 24 | `index.html` 1-413: head, headers, drawer, landing | [24-html-head-headers-landing.md](legacy-audit/24-html-head-headers-landing.md) |
| 25 | `index.html` 414-1116: home, observe, nurse, sim, debrief | [25-html-home-sim-debrief.md](legacy-audit/25-html-home-sim-debrief.md) |
| 26 | `index.html` 1117-1887: coach, profile, university, respiratory, ER | [26-html-coach-profile-university-rooms.md](legacy-audit/26-html-coach-profile-university-rooms.md) |
| 27 | `index.html` 1888-2318: modals, footer, script tags | [27-html-modals-footer-scripts.md](legacy-audit/27-html-modals-footer-scripts.md) |
| 28 | `style.css`, `theme.css` | [28-css-style-theme.md](legacy-audit/28-css-style-theme.md) |
| 29 | Seven feature stylesheets | [29-css-feature-styles.md](legacy-audit/29-css-feature-styles.md) |
| 30 | Eight data files | [30-data-files.md](legacy-audit/30-data-files.md) |
| 31 | External function `er-chat` and its client contract | [31-api-er-chat.md](legacy-audit/31-api-er-chat.md) |
| 32 | External function `resp-chat` and its client contract | [32-api-resp-chat.md](legacy-audit/32-api-resp-chat.md) |
| 33 | Existing test tooling outside the repository | [33-existing-tests.md](legacy-audit/33-existing-tests.md) |
| 34 | Feature reachability, verified in the running page | [34-feature-reachability.md](legacy-audit/34-feature-reachability.md) |
