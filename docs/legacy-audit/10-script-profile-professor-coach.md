# Profile, professor cohort dashboard and the clinical coach — script.js:5306–6009

## Purpose
This range fills the profile view (identity, statistics, history table, printable certificate, "my dashboard" tab) and the professor-side cohort tables and the student-attempt modal. It also holds the interactive clinical coach (a keyword-matching drill chat with an optional external-API bridge) and the function that lets a professor create a custom case. All code is classic-script globals that write into the DOM with `innerHTML`/`textContent` and read or write `localStorage` through `safeStorageGet/Set` (script.js:1736, 1745). The coach is closed in today's UI (see Features). The profile and professor parts are live. The range starts at the section banner at 5306 and ends at the blank line 6009; the next banner ("8. INITIALIZATION") starts at 6010.

## Features and user journeys implemented here
| Feature | Reachability | Evidence |
|---|---|---|
| Profile header, stats, strengths/weaknesses/recommendations lists (5307–5348) | live | `renderProfileView` called from sign-in flow 1940, `showOnlySection` 2017 (when view = profile), and after a debrief 5302. Probe as `med_student`: history table had 6 rows. |
| Demo-account pill, doctor/nurse ER average label (5317–5329) | live | element `profile-stat-er` sibling label rewritten from `u.stats.avgErDoctor/avgErNurse` (5323–5327). |
| History table and printable certificate (5351–5421) | live | filled on every `renderProfileView`; certificate tab opened by 6877/6881; stat tiles `profile-stat-spec`/`cert-stat-spec` hidden by scope.css `:has()` rules but still written. |
| "My dashboard" tab: level, skills by department, recent sessions, mistakes, notes (5426–5455) | live for non-professor roles | `renderProfileDash` called at 5350 in try/catch; tab button `data-ptab="dash"` (index.html:1263) toggled hidden for professors (5428). |
| Dashboard coach block and "go to coach" button (5446–5448) | dormant | `#dash-coach-go` is `display:none !important` in scope.css:40; probe: hidden. Even if clicked, `navigateTo('coach')` is rewritten to `home` by `REMOVED_VIEWS` (script.js:1678, 1949). |
| Profile sub-tab switching (5456–5466) | live | called from 6641, 6832, 6874, 6877, 6881 and 5452. |
| University portal header/title per role (5468–5489) | live | called from 1941. The first block (5474–5483) is overwritten by the second block "phase8" (5484–5489). |
| Professor cohort tables on home and university view (5499–5592) | live | `renderProfessorCohortTables` called at 1942, 6543, 6902 (filter change), 6912. Probe as `doctor`: 7 rows in `home-prof-cohort-tbody` (visible) and 7 in `uni-prof-cohort-tbody` (hidden at probe time: not determined which tab shows it). |
| Student attempt detail modal (5593–5680) | live | opened from table buttons (5589), 6496, 6913; probe: modal became visible after clicking `.prof-open-stu-btn`. Closed by 6569, 6903, 6904. |
| Image zoom of an imaging workup in the modal (5640–5658) | live (when `w.isImaging` and key in `DIAG_IMAGES`) | calls `openMedicalLightbox` (4983). Whether any default cohort entry has such a workup: not determined. |
| Coach view, drill queue, chat, mastery store (5682–5862, 5897–5943) | dormant | `coach` is in `REMOVED_VIEWS` (1678) so `navigateTo` never reaches 1972; `#app-nav-coach` is `er-locked`, `aria-disabled` (index.html:118); `#home-coach-banner`, `#open-coach-view-btn`, `[data-foot-app="coach"]` are hidden by scope.css:40. Probe: `navigateTo('coach')` left `#view-coach` hidden, 0 messages, 0 queue buttons. |
| Experimental coach API bridge (5864–5895) | dormant | `#coach-api-box` hidden by scope.css:41 (probe: display none); `nbCoachApiInit()` still runs at 6949 and binds the save button. Config default `{url:'', on:false}`. |
| Supervisor creates a custom case (5945–6008) | live code path, UI visibility not determined | save buttons `home-doc-save-case-btn` (6689) and `doc-save-case-btn` (6918); probe as `doctor`: both title inputs `hidden` at load (home form sits behind tab `home-prof-tab-create-btn`, 6686). Role gate at 5946. |

## Declarations
| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| `renderProfileView` | 5308–5422 | function | Writes profile identity, stats, lists, history, certificate into DOM; calls `renderProfileDash` | presentation | reads `authState.user` (name, role, stats, history, strengths...), `getRoleArabicName`, `nbDateOf`; writes ~30 DOM ids | 1940, 2017, 5302 |
| `nbDateOf` | 5424 | function | Date string from `h.date` or `h.ts` | domain (formatting rule) | reads history item | 5368, 5414, 5451 |
| `renderProfileDash` | 5426–5454 | function | Level badge, per-department skill averages, coach mastery bar, recent sessions, mistakes, notes | presentation (contains aggregation = application) | reads `nbGetPlacement`, `nbDerivedLevel`, `NB_LEVELS`, `CASES_DB`, `nbCaseObj`, `COACH_MODULES_DEFAULT`, `getCoachMasteredSet`; writes `#dash-*`, `.onclick` of `dash-retake`/`dash-coach-go`, adds a click listener to `dash-hist-go` | 5350 |
| `switchProfileSubTab` | 5456–5466 | function | Show one profile pane, restyle tab buttons | presentation | DOM `profile-pane-*`, `.profile-tab-btn` | 5452, 6641, 6832, 6874, 6877, 6881 |
| `renderUniversityPortalByRole` | 5468–5489 | function | Badge/title/description of portal by role | presentation | reads `authState.user`; writes `uni-*` ids and toggles `uni-student-content`/`uni-doctor-content` | 1941 |
| `getProfCohortList` | 5491–5493 | function | Read cohort from storage, default list | infrastructure | reads `STORAGE_KEYS.PROF_COHORT`, `PROFESSOR_COHORT_DEFAULT` | 2631, 5503, 5596, 6017 area, 6208, 6247, 6273, 6328, 6370, 6376, 6499, 6906 |
| `saveProfCohortList` | 5495–5497 | function | Persist cohort | infrastructure | writes `nabd_v2_prof_cohort` | 6911 |
| `renderProfessorCohortTables` | 5499–5591 | function | Render home and university cohort tables, filter, bind open buttons | presentation | reads cohort, `#prof-cohort-filter`; writes two tbodies | 1942, 6543, 6902, 6912 |
| `activeInspectedStudentId` | 5593 | `let` | Id of the student shown in the modal | application (state) | written 5599; read 2631, 6907 | n/a |
| `openStudentAttemptDetailModal` | 5595–5673 | function | Fill and open the attempt modal | presentation | reads cohort, `DIAG_IMAGES`, `nbBidi`, `nbLoadComment`; writes `activeInspectedStudentId`, ~20 `stu-modal-*` ids | 5589, 6496, 6913 |
| `closeStudentAttemptDetailModal` | 5675–5680 | function | Hide modal | presentation | DOM | 6569, 6903, 6904 |
| `coachRuntime` | 5685–5688 | `let` object | `{activeIdx, masteredIds:Set}` | application (state) | read/write in coach functions, 6841, 6853, 6860–6865 | many |
| `getCoachMasteredSet` | 5690–5694 | function | Mastered module ids for current user | infrastructure | key `nabd_v2_coach_mastered` (hard-coded string) | 5446, 5726 |
| `saveCoachMasteredSet` | 5696–5701 | function | Persist the set | infrastructure | same key | 5926, 6865 |
| `coachWeaknessOpenOnDesktop` | 5703 | `let` | Desktop panel open flag | presentation | 5718–5721 | n/a |
| `toggleCoachWeaknessSidebar` | 5705–5723 | function | Open/close module panel (mobile vs desktop by `innerWidth < 1024`) | presentation / browser | DOM | 5772, 6837–6839 |
| `renderInteractiveCoachView` | 5725–5779 | function | Progress bar, module queue buttons, starts active drill | presentation | reads `COACH_MODULES_DEFAULT`, mastered set; writes `coachRuntime.masteredIds` | 1973, 5771, 5932, 6843, 6861, 6867 |
| `appendCoachMessage` | 5781–5804 | function | Append a chat bubble (student text via `textContent`, coach via `innerHTML`) | presentation | `#coach-chat-messages` | 5830, 5905, 5910, 5911, 5928, 5936, 6854 |
| `startCoachDrillAtIndex` | 5806–5862 | function | Set active module, write lesson message (inline title and prompt maps for 4 module ids), "model answer" chip | application + presentation | writes `coachRuntime.activeIdx` | 5770, 5778, 6842, 6860, 6868 |
| `NB_COACH_API_KEY` | 5865 | const | Storage key `nabd_coach_api_v1` | infrastructure | n/a | 5866, 5876 |
| `nbCoachApiCfg` | 5866 | function | Read `{url,on}` | infrastructure | localStorage | 5869, 5871, 5882, 5907 |
| `nbCoachApiSecret` | 5867 | function | Read bearer key from sessionStorage `nabd_coach_key` | infrastructure | sessionStorage | 5870, 5888 |
| `nbCoachApiInit` | 5868–5880 | function | Bind settings form (url, key, on) with https check | presentation | writes both storages | 6949 |
| `nbCoachAsk` | 5881–5895 | async function | POST answer to configured URL, 15 s abort, returns text ≤2000 chars | infrastructure | reads `authState.user`, `nbTrackOf` | 5909 |
| `handleCoachStudentSubmission` | 5897–5916 | function | Read input, echo, route to API or local scoring, fallback on API failure | application | `coachRuntime` | 6845, 6849 |
| `nbCoachLocal` | 5917–5943 | function | Keyword scoring and mastery award | domain | writes mastered set; `setTimeout` 150 ms | 5915 (and 5911 as fallback) |
| `createAndSaveSupervisorCase` | 5945–6008 | function | Role gate, build a case object, add to `CASES_DB`, persist, re-render cards, navigate home | application | reads `DEPARTMENTS`, `CASE_IMAGES.img0`; writes `CASES_DB`, `selectedDeptFilter` (global), calls `saveCustomCaseToStorage` (1772), `renderDepartmentFilterBar`, `renderClinicalCaseCards`, `navigateTo`, `showToast` | 6690, 6919 |

## Shared state, globals and contracts
Defines for others: `activeInspectedStudentId` (read in 2631 and 6907), `getProfCohortList`/`saveProfCohortList` (used by the phase-8 academic code at 6208–6499 and the init block), `coachRuntime`, `getCoachMasteredSet`/`saveCoachMasteredSet`, `nbDateOf`, `switchProfileSubTab`, `closeStudentAttemptDetailModal`, `renderProfileView`, `renderProfessorCohortTables`, `renderUniversityPortalByRole`, `createAndSaveSupervisorCase`.

Expects from others: `authState` (`isAuthenticated`, `user` with `id, name, initials, role, roleNameAr, specialty, email, uni, isDemo, stats{completed,avgSpec,avgEr,avgErDoctor,avgErNurse}, history[]{caseId,caseTitle,mode,date|ts,questions,workupCount,score,num,passed}, strengths, weaknesses, recommendations`), `STORAGE_KEYS.PROF_COHORT` (1685), `PROFESSOR_COHORT_DEFAULT` (1207; student fields used: `id,name,uniId,specialty,yearLabel,caseTitle,submittedAt,diagnosis,hasUnjustifiedWorkup,workupSummaryBadge,score,isPublished,vitalsInfo,workupLog[],inquiryLog[],scratchpad,sbarSB,sbarAR,strengths,weaknesses,profNote`), `COACH_MODULES_DEFAULT` (965; `id,specialty,title,explanationSteps,testPrompt,sampleIdealStudentReply,keywords`), `CASES_DB`, `DEPARTMENTS`, `CASE_IMAGES`, `DIAG_IMAGES`, `NB_LEVELS`, `nbGetPlacement`, `nbDerivedLevel`, `nbOpenLevelModal`, `nbCaseObj`, `nbTrackOf`, `nbBidi`, `nbLoadComment`, `nbRenderMistakes`, `nbRenderNotes`, `openMedicalLightbox`, `getRoleArabicName`, `safeStorageGet/Set`, `showToast`, `navigateTo`, `saveCustomCaseToStorage`, `renderDepartmentFilterBar`, `renderClinicalCaseCards`, global `selectedDeptFilter`.

DOM ids used (not exhaustive): `profile-*`, `cert-*`, `dash-*`, `uni-*`, `home-prof-cohort-tbody`, `uni-prof-cohort-tbody`, `prof-cohort-filter`, `stu-modal-*`, `student-attempt-detail-modal`, `coach-*`, `toggle-coach-weakness-*`, `coach-api-*`, and the case-form ids passed as arguments. Missing elements are mostly guarded (`if (el)`), but `renderProfileView` dereferences `profile-avatar-box`, `profile-name-heading`, `profile-role-pill`, `profile-email-uni`, `profile-stat-*` without checks (5311–5321), and `openStudentAttemptDetailModal` dereferences all `stu-modal-*` ids without checks.

## Data, storage and network
| Item | Detail |
|---|---|
| `nabd_v2_prof_cohort` (localStorage via `safeStorageGet/Set`) | JSON array of cohort student objects (shape above); default is `PROFESSOR_COHORT_DEFAULT`; written only by 6911 (professor note) in code seen. `safeStorage*` also mirrors to a fallback store (1736–1752). |
| `nabd_v2_coach_mastered` | JSON map `{ [userId or 'guest']: [moduleId...] }` (5692, 5698). |
| `nabd_coach_api_v1` | `{url:string, on:boolean}`. |
| `nabd_coach_key` (sessionStorage) | optional bearer token typed by the user; sent as `Authorization: Bearer` (5888). |
| Network | One `fetch(c.url, POST)` at 5890 to a user-typed URL (https or http localhost/127.0.0.1, checked at 5873). Body `{system, track, module, answer, weaknesses[0..3]}`; reply read from `reply`, `text` or `content[0].text`. 15 s `AbortController` timeout. Not exercised (feature hidden). No other network calls in the range. |
| Timers | `setTimeout` 150 ms before coach replies (5927, 5935); 15 s abort timer (5884). |
| Time/randomness | `new Date().toISOString()` for certificate print date (5404); `new Date(h.ts)` in `nbDateOf`; `Date.now()` for case id (5959). No `Math.random`. |
| Other browser use | `window.innerWidth < 1024` (5710, 5772); `box.scrollTop` (5802); no audio, no history API in the range. |
| Case persistence | `saveCustomCaseToStorage` (1772) – key not determined within this range. |

## Calculations and rules worth pinning with a golden-master test
| Name | Lines | Inputs → outputs | Time / randomness |
|---|---|---|---|
| Coach local scoring (`nbCoachLocal`) | 5917–5943 | text, module keywords → mastered when `txt.length >= 20` and at least 2 keywords found by case-folded `includes`; adds id to the set and saves; otherwise a hint message. Message always says "100%". | 150 ms timer only |
| Mastery progress | 5726–5735 | mastered set size / `COACH_MODULES_DEFAULT.length` → `Math.round` percent, `remCount = max(0,total-done)` | none |
| Dashboard skill averages | 5434–5444 | history items → per-department rounded mean of `h.num` (or `parseInt(h.score)`), sorted desc, top 6; colour bands ≥85, ≥70 | none |
| Date fallback | 5424 | `h.date` else `h.ts` ISO date else `--` | depends on `ts` |
| Certificate serial and pass count | 5391–5403 | `NABD-2026-` + first 6 chars of upper-case id (default `USR`) + `100 + completed`; passed count over `caseId` matching `^er_` | print date = now |
| Cohort score badge | 5509–5511 | `parseInt(score)||0` → ≥85 emerald, ≥75 teal, else amber | none |
| Cohort filter | 5545–5549 | `all`, `weakness` (= `hasUnjustifiedWorkup`), else `specialty.includes(value)` | none |
| Custom case builder | 5957–6001 | four field values + defaults → case object (fixed age 54, vitals `98/158/94/96/37.1`, two questions, expected workups `w_ecg`,`w_cbc_chem`) | id uses `Date.now()` |
| API config check | 5873 | URL must be https or http localhost/127.0.0.1 | none |

## Problems
| severity | kind | evidence |
|---|---|---|
| high | security | Stored-XSS pattern: `h.caseTitle`, `h.mode`, `stu.*`, `i.topic/qText/aText`, `w.*`, strengths, `mod.title` are inserted through `innerHTML` unescaped (5365–5370, 5412–5418, 5513–5535, 5619–5663, 5666–5669, 5762–5766). Cohort and history come from localStorage (5492) and a professor-created case title reaches storage (5959–5960). The phase-8 code has `nb8Esc` (6384) but this range does not use it. |
| medium | data-exposure | Entire cohort (names, university ids, answers) is a client-side default list plus localStorage, visible to anyone who signs in; role gating is only a UI toggle (5428, 5946) and a client check on `authState.user.role`. |
| medium | security | Coach bridge sends learner answer and up to 3 weakness strings to any user-typed URL and sends a bearer token from sessionStorage (5882–5890); hidden by CSS only (scope.css:41), init still bound (6949). |
| medium | bug | `nbCoachLocal` always shows "100%" and awards mastery for any 20+ char text containing two substrings of the keyword list (5921–5925); substring match, no word boundaries. |
| medium | architecture | Role test differs: `renderProfileDash` treats only `professor` as professor (5427), `renderUniversityPortalByRole` and `createAndSaveSupervisorCase` accept `doctor` too (5469, 5946). |
| medium | dead-code | Whole coach feature (5682–5944, plus 5446–5448) is unreachable: `coach` in `REMOVED_VIEWS` (1678) and controls hidden (scope.css:40–41). First paragraph of `renderUniversityPortalByRole` (5474–5483) is overwritten by 5484–5489. |
| low | duplication | Home and university cohort rows are two near-identical 40-line templates (5505–5543, 5552–5590); badge-class logic repeated. |
| low | maintainability | Storage key `'nabd_v2_coach_mastered'` is a literal repeated three times (5692, 5698, 5700); coach drill titles and prompts are inline maps keyed by module ids (5815–5826) instead of being in module data. |
| low | maintainability | `createAndSaveSupervisorCase` mutates global `selectedDeptFilter` and `CASES_DB` and mixes domain object building with UI refresh (5997–6003); hard-coded age/vitals/workups. |
| low | bug | Certificate serial prefix `NABD-2026` is a literal year (5399); `profile-stat-er` label code assumes `nextElementSibling` is the label (5322). |

## Proposed source fragments
| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | profile-view-render.js | 5306–5423 | `renderProfileView` (identity, stats, history, certificate) | presentation |
| 2 | profile-dashboard.js | 5424–5467 | `nbDateOf`, `renderProfileDash`, `switchProfileSubTab` | presentation |
| 3 | university-portal-header.js | 5468–5490 | `renderUniversityPortalByRole` | presentation |
| 4 | professor-cohort-store-and-tables.js | 5491–5592 | cohort storage accessors and cohort table rendering | infrastructure / presentation |
| 5 | student-attempt-modal.js | 5593–5681 | inspected-student state, open and close attempt modal | presentation |
| 6 | coach-mastery-store.js | 5682–5702 | coach banner, `coachRuntime`, mastered-set storage | infrastructure |
| 7 | coach-view-render.js | 5703–5780 | weakness sidebar toggle, coach view render | presentation / browser |
| 8 | coach-chat-and-drill.js | 5781–5863 | chat bubbles and drill start | presentation |
| 9 | coach-api-bridge.js | 5864–5896 | optional external-API config and request | infrastructure |
| 10 | coach-answer-evaluation.js | 5897–5944 | submit handler and local keyword scoring | application / domain |
| 11 | supervisor-case-creation.js | 5945–6009 | create and persist a custom case | application |

All ranges validated with check-fragment.mjs: all printed ok.

## Open questions
1. Which tab or control makes `#uni-prof-cohort-tbody` and the case-creation forms visible to a professor (probe found them hidden at load)? Not determined.
2. Is `coach` meant to return (the removal is by design in `REMOVED_VIEWS`, 1678), or should the refactoring drop it?
3. Which key does `saveCustomCaseToStorage` (1772) use, and where are custom cases reloaded? Not determined in this range.
4. Does any default cohort workup have `isImaging` with a `DIAG_IMAGES` key (zoom path 5640)? Not determined.
5. Who else writes `nabd_v2_prof_cohort`, besides the note save at 6911?
6. Are the `profile-stat-spec` and `cert-stat-spec` values still wanted, given scope.css hides them?
