# Academic section second part, app initialization and event listeners — script.js:6530–7124

## Purpose
The range holds one function, `initNabdApp` (6530–7118), and its bootstrap guard (7119–7124). `initNabdApp` restores the saved session, renders the first view, and registers about 120 DOM event listeners for the whole app: navigation, sidebar, simulation workspace, chat, lightbox, SBAR handover, coach, profile, university portal, and the authentication modal with login and registration. It also contains inline business logic: password check on login, local account creation, CSV export of the cohort, grade publishing, and vitals measurement. It then calls the init functions of other sections (landing showcase, quiz, auth roles, phase 1c, nb8, observe, nurse, coach API). All of it runs once, on DOMContentLoaded or immediately if the document is already loaded.

## Features and user journeys implemented here
| Feature | Reachability | Evidence |
|---|---|---|
| Session restore: active user from storage, resume of an unfinished simulation, otherwise landing | live | 6536–6558; demo users are not restored (6538–6539) |
| Global Escape closes sidebar, account menu, auth modal, handover modal, lightbox, student detail modal, tools backdrop | live | 6561–6571 |
| Public header and landing CTAs (login, register, demo ER, `data-demo-login` buttons) | live | 6590–6601; `#index-demo-cta` exists (index.html:282); 3 `data-demo-login` elements in index.html; `#index-uni-demo-btn` has no element in index.html (0 matches), listener is a no-op |
| Signed-in header navigation, account dropdown, sidebar, footer links | live | 6609–6660, 7100–7103 |
| ER launcher: five buttons call `window.nbOpenER` after an auth check | live | 6618–6628; `nbOpenER` assigned at er.js:4695; ids at index.html:219, 621, 2288 |
| Home professor tabs (reports/create), supervisor case save, cohort filter | live | scope.css:30 says `#home-professor-section` is shown again; ids exist (index.html:596) |
| Simulation workspace: tools panel toggle, side tabs, workup category filter, vitals measurement, chat send, voice dictation (Web Speech, `ar-JO`) | live in code; reachability of the legacy sim view not determined here: `'sim'` is in `REMOVED_VIEWS` (script.js:1678) and `navigateTo` redirects it to home (1949) | `#sim-voice-btn` exists (index.html:830); `startSimulationSession` is called at 6553 and 6783 |
| Image lightbox zoom and "save note to scratchpad" | live in code, same sim-view caveat | 6785–6809 |
| SBAR handover modal and report build | same sim-view caveat | 6812–6827 |
| Coach controls (next, hint, reset, send) | dormant: `'coach'` is in `REMOVED_VIEWS` (1678); `#open-coach-view-btn` and `[data-foot-app="coach"]` are `display:none !important` (scope.css:40) | 6836–6868 |
| Profile sub-tabs, certificate print via `window.print()` | live | 6873–6885 |
| University portal: start case, publish grade with professor note, CSV export, unpublished-result toast | live (university restored in phase 8, scope.css:10–11, 27–30) | 6885–6930; ids index.html:1526, 1572, 1717 |
| Auth modal: close, backdrop close, tab switch, registration step 1 validation, role toggles year and cohort code | live | 6951–7002; `#reg-code` exists (index.html:2072) |
| Login (local PBKDF2 check) and registration (local account) | live | 7005–7094 |
| Calls to other sections' init functions | live | 6940–6948 |

## Declarations
| name | lines | kind | responsibility | layer | shared state read / written | called from |
|---|---|---|---|---|---|---|
| `initNabdApp` | 6530–7118 | function declaration (global) | One-shot bootstrap: restore session, first render, register all listeners, run section inits | application (with presentation event handling) | R: `STORAGE_KEYS`, `CASES_DB`, `authState`, `simState`, `coachRuntime`, `COACH_MODULES_DEFAULT`, `activeLightboxZoom`, `activeLightboxWorkupRef`, `activeInspectedStudentId`, `selectedWorkupCategory`, `simToolsOpenOnDesktop`. W: `window.__nabdInitialized`, `authState.isAuthenticated/user`, `selectedDeptFilter`, `selectedWorkupCategory`, `simToolsOpenOnDesktop`, `simState.vitalsMeasured/vitalsTimestamp`, `coachRuntime.masteredIds/activeIdx`, cohort record fields `isPublished`, `profNote`, `localStorage` (via helpers) | 7120, 7122 only (grep of `*.js` and index.html) |
| inline: Escape handler | 6561–6571 | closure | Close overlays on Escape | presentation | R/W DOM classes | document `keydown` |
| inline: outside-click handler | 6574–6582 | closure | Close account dropdown | presentation | DOM | document `click` |
| `launchRandomER` | 6618–6624 | const arrow, local | Auth check then `nbOpenER` | application | R: `authState` | 5 buttons (6625–6629), 6709 |
| inline: vitals button | 6743–6759 | closure | Show initial vitals, mark evidence, append system bubble | application | R: `simState.caseData.vitalsInitial`; W: `simState.vitalsMeasured`, `vitalsTimestamp` | `#sim-measure-vitals-btn` |
| inline: voice button | 6775–6790 | closure | Start SpeechRecognition, send result as chat | browser | W: `#sim-chat-input` | `#sim-voice-btn` |
| inline: lightbox note save | 6798–6810 | closure | Append image reading to scratchpad and workup ref | application | W: `activeLightboxWorkupRef.studentAnalysis`, scratchpad | `#lightbox-save-note-btn` |
| inline: publish grade | 6905–6919 | closure | Set `isPublished=true`, store professor note, re-render | domain (state transition) + application | R/W cohort list via `getProfCohortList/saveProfCohortList` | `#stu-modal-toggle-pub-btn` |
| inline: CSV export | 6922–6941 | closure | Build CSV from cohort, download via Blob | application + browser | R: cohort list | `#doc-export-csv-btn` |
| inline: credits | 6947 | IIFE | Fill `#nb-credits` from `NB_IMG` | presentation | R: `NB_IMG` | immediate |
| inline: auth backdrop | 6955–6963 | IIFE | Close modal only if press and release both on backdrop | presentation | local flags | immediate |
| inline: reg-next | 6964–6980 | closure | Validate name, email regex, password length 8, go to step 2 | application | DOM | `#reg-next-btn` |
| inline: login submit | 6991–7030 | async closure | Find local account, derive PBKDF2 digest, compare, log in or upgrade legacy account | application | R: `ACCOUNTS_MAP`; W: account via `saveAccountToStorage`, session via `loginWithAccount` | `#auth-pane-login` submit |
| inline: register submit | 7032–7092 | async closure | Validate, hash, build account object, log in | application + domain (account shape, track rule) | R: `ACCOUNTS_MAP`, `nbCohortFor`; W: new account | `#submit-register-btn` |
| bootstrap guard | 7119–7124 | if/else statement | Run `initNabdApp` after DOM ready | browser | `document.readyState` | top level |

## Shared state, globals and contracts
Defines for others:
- Global function `initNabdApp`; flag `window.__nabdInitialized` (read only inside the function; no other file references either: grep `initNabdApp|__nabdInitialized` over `*.js` and index.html).
- Account object shape created at 7068–7087: `id` = `local_` + email with non-alphanumerics replaced by `_`, `name`, `initials`, `email`, `passwordSalt`, `passwordHash`, `uni`, `role`, `year`, `roleNameAr`, `specialty`, `roleLabel`, `isDemo:false`, `track` (`null` for professor, `nursing` for practitioner, `medicine` if specialty starts with `الطب`, else `nursing`), `cohort`, `cohortName`, `stats{completed,avgSpec,avgEr}`, `strengths`, `weaknesses`, `recommendations`, `history`.
- Cohort record fields written: `isPublished`, `profNote`.

Expects from others (functions, all defined in script.js): `loadPersistedCustomCases` (not located in this audit), `safeStorageGet/Set/Remove` (1736), `getAccountFromStorageOrDefault`, `saveAccountToStorage`, `renderDepartmentFilterBar`, `renderClinicalCaseCards`, `renderProfessorCohortTables`, `syncAuthShellUI`, `startSimulationSession`, `navigateTo` (1948), `loginWithAccount` (2021), `nbDemoLogin` (2042), `openAuthModal/closeAuthModal`, `switchAuthModalTab`, `setRegStep` (4074), `nbPasswordSalt` (1794), `nbPasswordDigest` (1801), `nbCohortFor` (2472), `getRoleArabicName`, `createAndSaveSupervisorCase` (5945), `getProfCohortList/saveProfCohortList`, `openStudentAttemptDetailModal`, `closeStudentAttemptDetailModal`, coach functions (`toggleCoachWeaknessSidebar`, `startCoachDrillAtIndex`, `renderInteractiveCoachView`, `handleCoachStudentSubmission`, `appendCoachMessage`, `saveCoachMasteredSet`), sim functions (`processChatTurn`, `matchTypedQuestion`, `appendSimBubble`, `getSessionTimestamp`, `updateSimEvidenceCounter`, `updateBeginnerStepsBar`, `switchSimSideTab`, `renderWorkupCatalog`, `applyLightboxZoom`, `closeMedicalLightbox`, `openHandoverModal`, `closeHandoverModal`, `finalizeSessionAndBuildReport`), `switchProfileSubTab`, `logoutUser`, `showToast`, `saveScratchpadText`, section inits (`initLandingShowcase` 2193, `nbRenderQuiz` 2223, `initAuthRoles` 2397, `initPhase1c` 2616, `nb8Init` 6424, `initObserve` 3543, `initNurse` 3984, `nbCoachApiInit` 5868). From er.js: `window.nbOpenER` (er.js:4695). Globals: `NB_IMG`, `CASES_DB`, `COACH_MODULES_DEFAULT`.
- `nbPasswordDigest` and `nbPasswordSalt` (read-only here) are the contract for password storage: PBKDF2, SHA-256, 120000 iterations, 16-byte hex salt, 256-bit hex digest (script.js:1794–1806).
- DOM ids: about 110 ids and the classes `.dropdown-item-btn`, `.guest-side-link`, `.side-app-item`, `.sim-side-tab`, `.wcat-btn`, `.profile-tab-btn`, `.uni-start-case-btn`, `.foot-app-link`; attributes `data-demo-login`, `data-drop-view`, `data-profile-tab`, `data-side-app`, `data-stab`, `data-wcat`, `data-ptab`, `data-uni-start`, `data-foot-app`. Missing id found: `index-uni-demo-btn` (0 matches in index.html). Other ids used here that I spot-checked all exist.
- Ordering contract: `initNabdApp` must run after all other scripts define their globals (it is called from DOMContentLoaded or immediately if the document is not loading); `window.nbOpenER` must be defined by er.js before the first user click, not at init.

## Data, storage and network
| Item | Detail | Lines |
|---|---|---|
| localStorage `nabd_v2_active_user_id` | read; removed if the stored account is a demo | 6536–6539 via `STORAGE_KEYS.ACTIVE_USER_ID` (1680) |
| localStorage `nabd_v2_active_sim_meta` | read: `{caseId, isEmergencyMode}`, resume simulation | 6551–6554 |
| localStorage `nabd_v2_accounts_map` | read in login and register: map of id to account; written via `saveAccountToStorage` | 7015, 7044 |
| localStorage `nabd_v2_prof_cohort` | cohort list read and written through helpers | 6905–6919, 6926 |
| localStorage `nabd_v2_scratchpads` | keyed `userId__caseId`; written through `saveScratchpadText` | 6585–6588, 6804 |
| localStorage `nabd_v2_custom_cases` | loaded by `loadPersistedCustomCases()` | 6533 |
| Coach mastered set | saved by `saveCoachMasteredSet` (key not in this range) | 6862 |
| Network | none in this range (no fetch or XHR). Network calls happen in `nbCoachApiInit` and other sections. | n/a |
| Web Crypto | `crypto.subtle` PBKDF2 through `nbPasswordDigest` | 7020, 7050 |
| Web Speech API | `SpeechRecognition`/`webkitSpeechRecognition`, lang `ar-JO` | 6775–6790 |
| Blob download | `nabd_cohort_grades.csv`, `text/csv;charset=utf-8;`, Object URL created and never revoked | 6933–6940 |
| Timers | `setTimeout(nbOpenER, 400)` after demo login (6602); `setTimeout(window.print, 150)` (6880) | |
| History API | none directly (it is in `navigateTo`) | |
| Image credits | `NB_IMG` entries (`page`, `alt`, `lic`, `by`) rendered as links with `target=_blank rel=noopener noreferrer` | 6947 |

## Calculations and rules worth pinning with a golden-master test
| Name | Lines | Inputs | Outputs | Randomness / time |
|---|---|---|---|---|
| Registration validation | 6964–6980, 7052–7058 | name, email, password | email regex `^\S+@\S+\.\S+$`; password min length 8 (JS length); error text in Arabic | none |
| Login decision | 6991–7030 | email (lowercased, trimmed), password, accounts map | branches: empty fields, unknown email, legacy account without hash (hash set, then login), wrong digest, success | none besides PBKDF2 |
| Account id, initials | 7064–7068 | name, email | id `local_`+sanitised email; initials = first letters of the first two words, else first two chars | none |
| Track rule | 7080 | role, specialty | professor `null`; practitioner `nursing`; specialty matching `^الطب` `medicine`; else `nursing` | none |
| roleLabel | 7077 | role, year, specialty, uni | `"<role>[ · السنة y] · التخصص: <specialty> — <uni>"` | none |
| University fallback | 7048 | cohort code, field | cohort university, else field, else `الجامعة الأردنية` | none |
| Cohort CSV | 6922–6941 | cohort list | header row plus rows with quoted fields, no escaping of `"` inside values, `منشورة` or `قيد الاعتماد` | none |
| Next coach drill | 6840, 6858 | `activeIdx`, module count | `(idx+1) % length` | none |
| Publish state transition | 6905–6919 | student id, note field | `isPublished=true`, note kept if field empty | none |
| Vitals note | 6743–6759 | `simState.caseData.vitalsInitial` | texts incl. timestamp | time via `getSessionTimestamp` (Date.now) |

## Problems
| severity | kind | evidence |
|---|---|---|
| high | security | Accounts, password salt and hash live in `localStorage` (`nabd_v2_accounts_map`); login is a client-side comparison (7000–7025). Anyone with browser access can read hashes or edit the role or `isPublished`. No server-side authority. |
| high | security | Professor role is selectable at self-registration (`#reg-role`, read at 7041, used at 7080) and gives the professor view; no verification. Not determined whether the section code gates it. |
| high | architecture | One 589-line function mixes bootstrap, ~120 listeners, and business logic (auth, CSV, publish). Not testable or splittable below that unit. |
| medium | security | CSV export concatenates names and titles with only outer quotes (6930), so a `"` in a value breaks the file; a value starting with `=`, `+`, `-`, `@` is a spreadsheet-formula injection vector, because professors can export student-entered names. |
| medium | bug | Login treats an account with no hash as valid for any password: it stores the first password entered as the new hash (7010–7016). |
| medium | bug | `uniqueness` check by email lowercases, but the account id is derived by replacing non-alphanumerics (7064), so `a.b@x.com` and `a_b@x.com` get the same id and the second overwrites the first (not run to confirm). |
| low | dead-code | `#index-uni-demo-btn` (6601) has no element in index.html; `#open-coach-view-btn` and coach controls are hidden (scope.css:40) and `coach` is in `REMOVED_VIEWS` (1678). |
| low | bug | The voice recogniser has no `onerror`/`onend` handling and a new instance is created per click (6775–6790). |
| low | maintainability | Inline Arabic UI strings and Tailwind class strings (6682–6690) inside handlers; the shared state (`simToolsOpenOnDesktop`, `selectedDeptFilter`) is mutated directly as global `let`s. |
| low | duplication | `coach-header-next-btn` and `coach-next-drill-btn` handlers are identical (6840–6845, 6858–6862); `home-doc-save-case-btn` and `doc-save-case-btn` only differ in ids; the two professor tab handlers mirror each other (6677–6690). Object URL never revoked (6937). |

## Proposed source fragments
`.work/script-cuts.txt` allows a start at only two lines inside this range (6530 and 7119). The function cannot be cut at any other line without breaking syntax, so the cut is forced.

| order | file name | from–to | single responsibility | layer |
|---|---|---|---|---|
| 1 | app-init-and-listeners.js | 6530–7118 | `initNabdApp`: session restore, section init calls, all event listener wiring including auth submit handlers | application |
| 2 | app-bootstrap.js | 7119–7124 | Start `initNabdApp` on DOMContentLoaded or immediately | browser |

Validated with check-fragment.mjs: `6530-7118` ok, `7119-7124` ok. A finer split would first require moving the inline handlers (login, register, CSV, publish) into named top-level functions, which changes code and is outside a concatenation-only cut.

## Open questions
1. Is the legacy simulation view (`sim`, in `REMOVED_VIEWS` at 1678) reachable from any UI path today (university "start case" buttons at 6894–6897 call `startSimulationSession`)? Not determined.
2. Where is `loadPersistedCustomCases` defined and what key shape does it read? Not located here.
3. Does `nbCohortFor` gate the professor/supervisor role, or can anyone register as professor? Not determined.
4. What key does `saveCoachMasteredSet` use, and is coach state still reachable while the view is removed?
5. Should `#index-uni-demo-btn` exist (listener at 6600 has no element)?
6. Which scripts load after script.js, and do they depend on `initNabdApp` having run before their own DOMContentLoaded handlers? Not determined.
