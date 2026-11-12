# Migration map

This document says where every part of the legacy site went in the ASP.NET Core solution, which differences were registered on purpose, how the clinical rules of the ER room map to the C# domain model, what is still in the browser, and a proposed order for moving the rest.

Read [architecture.md](architecture.md) first. The sources are the decision records in [decisions/](decisions/0002-lossless-strangler-migration.md), [testing-strategy.md](testing-strategy.md), `tools/migration/split-plan.json`, `tests/Nabd.Tests/LegacyBaseline/seams.json` and the audit in [legacy-audit/](legacy-audit/01-script-case-catalog.md).

Three facts to keep in mind while reading:

- The room in the browser still runs the legacy client engine. The server-side model and use cases exist and are tested, but the room does not call them.
- The real understanding services (the two external serverless functions) were never called in this phase. The relay is tested against fakes.
- There is no authentication. Accounts are demo data in the browser.

The clinical content of the cases was written for training and has not been reviewed by a physician. The system does not diagnose or treat real patients.

## Legacy file -> new location

The legacy site is the commit `5f431d5` of `main`: 85 files (`tests/Nabd.Tests/LegacyBaseline/legacy-manifest.json`). A frozen copy of the page, scripts and stylesheets is in `tests/Nabd.Tests/LegacyBaseline/site/`. "Changed" means the served text differs from the legacy text; every such change is a registered seam (next section).

| Legacy file | New location | How it is served | Changed? |
|---|---|---|---|
| `index.html` | `src/Nabd.Web/Views/Shared/_Layout.cshtml`, `Views/Home/Index.cshtml` and 43 partial views | `GET /` -> `HomeController.Index` renders the views | Yes, 15 seams: nine stylesheet links and six script tags |
| `script.js` | `src/Nabd.Web/ClientScripts/script/` (84 fragments, no wrapper) | `GET /js/script.js` -> `ClientScriptsController` -> `ClientBundleProvider` | No |
| `er.js` | `ClientScripts/er/` (67 fragments, `_open.txt`, `_close.txt`) | `GET /js/er.js`, same path | Yes, 1 seam: the service URL line |
| `resp.js` | `ClientScripts/resp/` (21 fragments, `_open.txt`, `_close.txt`) | `GET /js/resp.js` | Yes, 1 seam: the service URL line |
| `ui.js` | `ClientScripts/ui/` (1 fragment, `_open.txt`, `_close.txt`) | `GET /js/ui.js` | No |
| `motion.js` | `ClientScripts/motion/` (7 fragments, `_open.txt`, `_close.txt`) | `GET /js/motion.js` | No |
| `terms.js` | `ClientScripts/terms/` (3 fragments, `_open.txt`, `_close.txt`) | `GET /js/terms.js` | No |
| `style.css` | `src/Nabd.Web/wwwroot/css/style.css` | Static file, `/css/style.css` | No (the link in the page changed) |
| `theme.css` | `wwwroot/css/theme.css` | Static file | No (link changed) |
| `resp.css` | `wwwroot/css/resp.css` | Static file | No (link changed) |
| `er.css` | `wwwroot/css/er.css` | Static file | No (link changed) |
| `scope.css` | `wwwroot/css/scope.css` | Static file | No (link changed) |
| `home9.css` | `wwwroot/css/home9.css` | Static file | Yes, 1 seam (2 occurrences): an image path gains `../` |
| `landing8.css` | `wwwroot/css/landing8.css` | Static file | No (link changed) |
| `landing9.css` | `wwwroot/css/landing9.css` | Static file | No (link changed) |
| `academic8.css` | `wwwroot/css/academic8.css` | Static file | No (link changed) |
| `data/er-cases.json` | `src/Nabd.Infrastructure/LegacyData/Files/er-cases.json` | `GET /data/er-cases.json` -> `ClientDataController` -> `IClientDataDocumentSource`; also read by `JsonClinicalCaseRepository` | No (byte-identical) |
| `data/er-act.json` | `LegacyData/Files/er-act.json` | `GET /data/er-act.json`, same path | No |
| `data/er-find.json` | `LegacyData/Files/er-find.json` | `GET /data/er-find.json` | No |
| `data/er-lang.json` | `LegacyData/Files/er-lang.json` | `GET /data/er-lang.json` | No |
| `data/resp-ar.json` | `LegacyData/Files/resp-ar.json` | `GET /data/resp-ar.json` | No |
| `data/resp-clinical.json` | `LegacyData/Files/resp-clinical.json` | `GET /data/resp-clinical.json` | No |
| `data/resp-model.json` | `LegacyData/Files/resp-model.json` | `GET /data/resp-model.json` | No |
| `data/resp-patients.json` | `LegacyData/Files/resp-patients.json` | `GET /data/resp-patients.json` | No |
| `img/` (60 files: 59 images and `CREDITS.txt`) | `src/Nabd.Web/wwwroot/img/` (60 files) | Static files, `/img/**` | No (`Every_legacy_image_is_served_unchanged`) |
| `.nojekyll` (empty file) | No counterpart in the new solution | Not served | Not determined whether this was a decision. It is a GitHub Pages marker; the audit notes only that it is in the manifest |

Notes:

- The data files are no longer public static files. Only the documents the application names can be asked for (`Data_that_the_application_does_not_name_cannot_be_asked_for`). See [decision 0005](decisions/0005-legacy-data-behind-repositories.md).
- Script fragments are not served. `ClientBundleProvider` joins the fragments of a bundle in the order of `ClientScripts/bundles.json` by plain concatenation. See [decision 0002](decisions/0002-lossless-strangler-migration.md).
- The test `Each_script_bundle_is_the_legacy_script` (class `LegacySiteBaselineTests`) compares each joined bundle with the legacy script.

## The registered differences

`tests/Nabd.Tests/LegacyBaseline/seams.json` holds 20 entries (entries 19 and 20, added with the V6.2 landing, are
the landing's head links and its script tag; the three landing regions themselves are compared with their own
snapshots, see [ui-integration-map.md](ui-integration-map.md)). `LegacySiteBaselineTests` undoes them on what the application serves and requires the result to equal the legacy file; `Every_registered_difference_fits_the_legacy_file_exactly` checks that each entry matches the legacy file as many times as `count` says.

| # | File | Legacy text | Current text | Reason |
|---|---|---|---|---|
| 1 | `er.js` (1) | `const API = /\.vercel\.app$/.test(location.hostname) ? '/api/er-chat' : 'https://nabd-smoky-one.vercel.app/api/er-chat';` | `const API = '/api/er-chat';` | The room calls the application's own gateway, which forwards to the understanding service. The browser no longer needs to know where the service is hosted |
| 2 | `resp.js` (1) | Same pattern with `/api/resp-chat` | `const API = '/api/resp-chat';` | Same, for the respiratory room |
| 3 | `home9.css` (2) | `url("img/v9/login2.jpg")` | `url("../img/v9/login2.jpg")` | Stylesheets moved from the site root to `wwwroot/css`, so a relative path gains one level |
| 4 | `index.html` (1) | `href="style.css"` | `href="css/style.css"` | Stylesheets are served from `/css` |
| 5 | `index.html` (1) | `href="theme.css"` | `href="css/theme.css"` | Same |
| 6 | `index.html` (1) | `href="resp.css"` | `href="css/resp.css"` | Same |
| 7 | `index.html` (1) | `href="er.css"` | `href="css/er.css"` | Same |
| 8 | `index.html` (1) | `href="scope.css"` | `href="css/scope.css"` | Same |
| 9 | `index.html` (1) | `href="home9.css"` | `href="css/home9.css"` | Same |
| 10 | `index.html` (1) | `href="landing8.css"` | `href="css/landing8.css"` | Same |
| 11 | `index.html` (1) | `href="landing9.css"` | `href="css/landing9.css"` | Same |
| 12 | `index.html` (1) | `href="academic8.css"` | `href="css/academic8.css"` | Same |
| 13 | `index.html` (1) | `src="script.js"` | `src="js/script.js"` | Script bundles are served from `/js` by the client-script bundler |
| 14 | `index.html` (1) | `src="motion.js"` | `src="js/motion.js"` | Same |
| 15 | `index.html` (1) | `src="terms.js"` | `src="js/terms.js"` | Same |
| 16 | `index.html` (1) | `src="ui.js"` | `src="js/ui.js"` | Same |
| 17 | `index.html` (1) | `src="resp.js"` | `src="js/resp.js"` | Same |
| 18 | `index.html` (1) | `src="er.js"` | `src="js/er.js"` | Same |
| 19 | `index.html` (1) | the image-fallback script line in the head | the V6.2 landing's comment, two font preloads and two stylesheet links, then that line | The V6.2 public landing's stylesheets, after every legacy stylesheet ([decision 0010](decisions/0010-public-landing-v62-with-the-shell-preserved.md)) |
| 20 | `index.html` (1) | `\n</body>` | `\n  <script src="js/landing.js" defer></script>\n</body>` | The landing's script, after the legacy bundles |

Two things about entries 1 and 2:

- One controller serves both understanding-service paths: `Controllers/Api/UnderstandingController.cs`.
- The legacy line sent the browser to the production host when the page was not on `*.vercel.app`. The new line always uses the same origin. The relay is described in [decision 0006](decisions/0006-understanding-services-through-a-gateway.md), including its stop-gap.

## The page: index.html -> Razor views

The legacy page is one file of 2,318 lines. `tools/migration/split-plan.json` records how it was cut; the cut was made by `tools/migration/split-legacy.mjs`. Line numbers below refer to `tests/Nabd.Tests/LegacyBaseline/site/index.html`.

Composition rule: a partial view is a contiguous range of legacy lines cut at element boundaries, and a composing file holds legacy lines plus one `@await Html.PartialAsync(...)` per partial. No line feed is added after the last legacy line of a view file (a file ends in a line feed only when the last line of its range is a blank legacy line), so the line feed after each call is the one the legacy text had at that place, and the composed output equals the legacy text (`The_page_is_the_legacy_page`). See [decision 0003](decisions/0003-razor-views-reproduce-the-legacy-page.md).

`_Layout.cshtml` covers legacy lines 1-265 and 1888-2318 and renders the body (`Index.cshtml`) in between. `Index.cshtml` covers lines 266-1887. All paths are under `src/Nabd.Web/Views/`. There are 43 partial views: 11 in the layout and 32 in the home view.

Layout partials:

| View file | Legacy lines | Holds |
|---|---|---|
| `Shared/Layout/_Head.cshtml` | 3-32 | Document head: meta tags, fonts, the nine stylesheets, the image-fallback script |
| `Shared/Layout/_PublicHeader.cshtml` | 35-83 | Header for a visitor who is not signed in — **V6.2 design since 2026-11-12** |
| `Shared/Layout/_AppHeader.cshtml` | 84-185 | Header after sign-in |
| `Shared/Layout/_SidebarDrawer.cshtml` | 186-252 | Side navigation drawer |
| `Shared/Layout/_Toast.cshtml` | 253-260 | Toast message container |
| `Shared/Modals/_HandoverModal.cshtml` | 1890-1953 | SBAR handover modal of the specialty simulation |
| `Shared/Modals/_LevelModal.cshtml` | 1954-1966 | Level (placement) modal |
| `Shared/Modals/_AuthModal.cshtml` | 1967-2090 | Sign-in and registration page |
| `Shared/Modals/_ImageLightbox.cshtml` | 2091-2129 | Medical image lightbox |
| `Shared/Modals/_StudentAttemptModal.cshtml` | 2130-2257 | Professor view of one student attempt |
| `Shared/Layout/_SiteFooter.cshtml` | 2258-2310 | Site footer — **V6.2 design since 2026-11-12** (guest and signed-in links kept) |

Lines 1-2, 33-34, 261-265, 1888-1889 and 2311-2318 are literal text in `_Layout.cshtml`.

View partials (indented rows are nested inside the row above):

| View file | Legacy lines | Holds |
|---|---|---|
| `Home/Landing/_LandingView.cshtml` | 266-404 | Public landing page — **replaced by the V6.2 design** (2026-11-12, [decision 0010](decisions/0010-public-landing-v62-with-the-shell-preserved.md)): now `_Hero`, `_ValueStrip`, `_Overview` (`_Specialties`, `_SimulationShowcase`), `_Method`, `_About`, `_Institutions`, `_FinalCta`, `_LandingDialog`; see [ui-integration-map.md](ui-integration-map.md) |
| &nbsp;&nbsp;(removed) `_Hero`, `_Jordan`, `_Facts` | 275-294, 295-306, 307-314 | Hero; Jordan band; facts strip |
| &nbsp;&nbsp;(removed) `_About`, `_Problem`, `_Solution` | 315-328, 329-343, 344-360 | Vision, mission, goal; the problem; the solution |
| &nbsp;&nbsp;(removed) `_Fields`, `_Audience`, `_Closing` | 361-378, 379-391, 392-400 | Training fields; who it is for; closing call to action |
| `Home/Dashboard/_HomeView.cshtml` | 405-785 | Signed-in home page |
| &nbsp;&nbsp;`_Welcome`, `_LearnPath`, `_TrainingPath` | 416-434, 435-442, 443-461 | Welcome card; learning path box; training path panel |
| &nbsp;&nbsp;`_NurseEntry`, `_ProfessorHome`, `_Guide` | 462-475, 476-602, 603-612 | Nursing entry; professor home (cohort table and tools); role guide |
| &nbsp;&nbsp;`_ErCard`, `_StudentUniversity`, `_Fields` | 613-632, 633-703, 704-721 | Emergency room entry card; student university block; specialty fields (locked cards) |
| &nbsp;&nbsp;`_LockedRooms`, `_Cases`, `_CoachBanner` | 722-736, 737-774, 775-783 | Locked rooms; specialty cases with department filter; clinical coach card |
| `Home/Training/_ObserveView.cshtml` | 786-800 | Observe-an-expert view |
| `Home/Training/_NurseView.cshtml` | 801-805 | Nursing room view |
| `Home/Training/_SimulationView.cshtml` | 806-948 | Specialty simulation view |
| `Home/Training/_DebriefView.cshtml` | 949-1110 | Debrief (report) view |
| `Home/Coach/_CoachView.cshtml` | 1111-1219 | Clinical coach view |
| `Home/Profile/_ProfileView.cshtml` | 1220-1508 | Profile view |
| `Home/University/_UniversityView.cshtml` | 1509-1762 | University (academic portal) view |
| `Home/Rooms/_RespiratoryRoomView.cshtml` | 1763-1831 | Respiratory emergency room view |
| `Home/Rooms/_ErRoomView.cshtml` | 1832-1887 | Emergency room view |

The nine nested rows of the landing view and the twelve of the home view, plus the nine view partials, the two container partials and the eleven layout partials, make up the 43. Views carry no logic yet. When a view starts to take data from the server it becomes a registered difference.

## The scripts: bundles and fragments

Each legacy script was cut at statement boundaries into fragments (`tools/migration/split-plan.json`, proposed by the audit). A fragment holds legacy code unchanged. Each fragment carries the layer its responsibility belongs to; that label is a guide for moving code out of the browser, not a statement that the code has moved. Nothing has moved: all 183 fragments run in the browser.

Line totals below are the lines of the fragments (the wrapper lines in `_open.txt` and `_close.txt` are not counted), computed from `split-plan.json`. Layer labels are used exactly as the plan writes them, including combined labels.

| Bundle | Fragments | Wrapper | Fragment lines | Legacy lines covered | Fragment list |
|---|---|---|---|---|---|
| `script.js` | 84 | No wrapper | 7,124 | 1-7124 | `ClientScripts/script/README.md` |
| `er.js` | 67 | Yes: `_open.txt` (legacy lines 1-11), `_close.txt` (line 4706) | 4,694 | 12-4705 | `ClientScripts/er/README.md` |
| `resp.js` | 21 | Yes: `_open.txt` (1-10), `_close.txt` | 884 | 11-894 | `ClientScripts/resp/README.md` |
| `ui.js` | 1 | Yes: `_open.txt` (1-6), `_close.txt` | 47 | 7-53 | `ClientScripts/ui/README.md` |
| `motion.js` | 7 | Yes: `_open.txt` (1-6), `_close.txt` | 644 | 7-650 | `ClientScripts/motion/README.md` |
| `terms.js` | 3 | Yes: `_open.txt` (1-9), `_close.txt` | 117 | 10-126 | `ClientScripts/terms/README.md` |

The total is 183 fragments. The wrapper of `er.js`, `resp.js`, `ui.js`, `motion.js` and `terms.js` is one immediately invoked function, so the fragments of those bundles are statements inside it.

### script.js (84 fragments, 7,124 lines)

| Layer | Fragments | Lines |
|---|---|---|
| domain | 18 | 2,396 |
| presentation | 35 | 1,976 |
| application | 13 | 1,598 |
| infrastructure | 8 | 783 |
| browser | 6 | 139 |
| infrastructure + presentation | 1 | 102 |
| application + domain | 1 | 48 |
| domain + application | 1 | 46 |
| domain + presentation | 1 | 36 |

### er.js (67 fragments, 4,694 lines)

| Layer | Fragments | Lines |
|---|---|---|
| application | 18 | 1,712 |
| domain | 19 | 1,138 |
| presentation | 13 | 1,000 |
| domain + application | 4 | 307 |
| infrastructure | 3 | 120 |
| presentation + application | 2 | 102 |
| domain + application + presentation | 1 | 71 |
| browser | 2 | 55 |
| domain + presentation | 1 | 55 |
| presentation + browser | 1 | 49 |
| infrastructure + application | 1 | 36 |
| domain + presentation helpers | 1 | 27 |
| infrastructure + application state | 1 | 22 |

### resp.js (21 fragments, 884 lines)

| Layer | Fragments | Lines |
|---|---|---|
| domain | 6 | 326 |
| presentation | 7 | 247 |
| application | 5 | 209 |
| infrastructure | 3 | 102 |

### motion.js (7 fragments, 644 lines), terms.js (3 fragments, 117 lines), ui.js (1 fragment, 47 lines)

| Bundle | Layer | Fragments | Lines |
|---|---|---|---|
| `motion.js` | application | 2 | 331 |
| `motion.js` | presentation | 3 | 227 |
| `motion.js` | browser | 1 | 46 |
| `motion.js` | domain | 1 | 40 |
| `terms.js` | presentation | 1 | 61 |
| `terms.js` | domain | 1 | 40 |
| `terms.js` | browser | 1 | 16 |
| `ui.js` | presentation | 1 | 47 |

## Clinical rules: legacy function -> domain member

The clinical core of the ER room (doctor role) exists twice: in the legacy `er.js` and in `Nabd.Domain`. The golden masters (45 traces, see [decision 0004](decisions/0004-clinical-core-pinned-by-golden-masters.md)) require both to give the same numbers, bit for bit. All members below were found in `src/Nabd.Domain`. Fragments are in `src/Nabd.Web/ClientScripts/er/`.

| Legacy function | Fragment (er) | Domain member | Location | Visibility |
|---|---|---|---|---|
| `vitalsAt` | `030-vitals-model.js` | `ClinicalCase.VitalsAt` | `Cases/ClinicalCase.cs:105` | public |
| `modsNow` | `030-vitals-model.js` | `SimulationSession.TreatmentShift` | `Simulation/SimulationSession.cs:188` | private |
| `live` | `030-vitals-model.js` | `SimulationSession.CurrentVitals` | `SimulationSession.cs:205` | public |
| `netRate` | `050-risk-tick.js` | `SimulationSession.NetRiskRate` | `SimulationSession.cs:225` | public |
| `tick` | `050-risk-tick.js` | `SimulationSession.Tick`, made of `BeginTick`, `ReassessStage`, `EndTick` | `SimulationSession.cs:251`, `260`, `292`, `319` | `Tick` public; the other three internal |
| `stageCheck` | `060-stages-scheduler.js` | `SimulationSession.ReassessStage` | `SimulationSession.cs:292` | internal |
| cuff part of `paint` | `040-monitor-paint.js` (`paint` holds the tiles and the cuff cycle) | `SimulationSession.RefreshMonitor` and `TakeCuffReading` | `SimulationSession.cs:328`, `337` | `RefreshMonitor` private; `TakeCuffReading` public |
| `give` | `420-give-treatment.js` | `SimulationSession.ApplyIntervention` | `SimulationSession.cs:357` | public |
| `harm` | `430-unsafe-and-harm.js` | `SimulationSession.ApplyHarm` | `SimulationSession.cs:436` | public |
| `submitTest` | `450-tests.js` | `SimulationSession.OrderTest` | `SimulationSession.cs:504` | public |
| `untreatedSbp` | `290-order-safety-rules.js` | `SimulationSession.UntreatedSystolicPressure` | `SimulationSession.cs:246` | public |
| `keyMissing` | `480-supervisor-and-arrest.js` | `SimulationSession.MissingKeySteps` | `SimulationSession.cs:177` | public |
| `doneAs` | `480-supervisor-and-arrest.js` | `SimulationSession.RecordSatisfying` | `SimulationSession.cs:170` | public |
| `fell` | `500-scoring.js` | `SimulationSession.HasCollapsed` | `SimulationSession.cs:184` | public |
| `arrest` | `480-supervisor-and-arrest.js` | `SimulationSession.Arrest` | `SimulationSession.cs:539` | private |
| outcome rule at handover (`E.outcome = ...` when the sheet is submitted) | `490-handover-sheet.js` | `SimulationSession.HandOver` | `SimulationSession.cs:532` | public |
| `dispoCheck` | `500-scoring.js` | `SessionScorer.JudgeDestination` | `Simulation/Scoring/SessionScoring.cs:146` | public static |
| `score` | `500-scoring.js` | `SessionScorer.Score` | `SessionScoring.cs:158` | public static |
| failure list in `conclude` | `520-conclude-report.js` | `SessionScorer.Judge` | `SessionScoring.cs:226` | public static |

Notes:

- `untreatedSbp` is defined in the order-safety fragment (`290`) but is used by the ported test rule; the domain exposes it as `UntreatedSystolicPressure`. The order-safety rules that call it are not ported (next section).
- `SessionScorer` is declared in `SessionScoring.cs`.
- The domain model receives the outcome of an order as a command. It does not decide whether an order is safe.
- The traces pin the model to the legacy behaviour, including anything a physician might later correct. They say nothing about clinical correctness.

## What is not migrated to the server

From [decision 0004](decisions/0004-clinical-core-pinned-by-golden-masters.md) (scope table), [decision 0005](decisions/0005-legacy-data-behind-repositories.md), [decision 0006](decisions/0006-understanding-services-through-a-gateway.md), [decision 0008](decisions/0008-no-database-and-no-authentication-in-this-phase.md) and [architecture.md](architecture.md) ("Where the logic runs today").

| Concern | Where it runs today | Why not in this phase |
|---|---|---|
| Clinical dynamics and doctor-role score of the ER room | Browser (legacy client) and `Nabd.Domain`; the room calls only the browser copy | The strangler keeps the proven client until a room is switched over; the domain is proved equal first (decision 0002, 0004) |
| Nurse-role handover grade and score (`550`, `560`) | Browser | Not ported; only the nurse-role clinical dynamics are pinned (six traces) |
| Reading the trainee's text: dose parsing, dose checks, order vocabularies, offline reader (`120`, `140`, `150`, `160`, `170`) | Browser; online, the external understanding service reads as well | Tuned Arabic-dialect rules with no recorded behaviour on the server side; rewriting them in one step cannot be shown to preserve behaviour (decision 0002) |
| Order safety: allergy, off-case, too early, route, repeat, cumulative total (`290`, `400`, the decision part of `430`) | Browser | Not ported (decision 0004); the session API therefore takes the harm as the client judged it (decision 0007) |
| The conversation: who speaks next, what they say (`230`-`280`, `440`, `460`-`480`, offline lines `180`-`220`) | Browser; the voices come from the external service, or from fixed lines when offline | Same as above; this is also the first step of the multi-agent phase (decision 0009) |
| Voices of the patient, relative, nurse, supervisor; handover grading in grade mode | External serverless functions (outside this repository) | The brief forbids replacing the models; the application only relays (decision 0006) |
| Model weights and language lists (`er-act.json`, `er-find.json`, `er-lang.json`, `resp-*.json`) | Browser loads them; the application serves the files | The models are not executed on the server in this phase (decision 0005) |
| Case files with diagnoses and scoring hints (`er-cases.json`) | Browser downloads them through `/data/er-cases.json`; the server also reads them for the domain model | The legacy room needs the case data in the browser. This exposure is not closed; a document stops being served when its room moves to the server (decision 0005) |
| Respiratory room, specialty simulation, nursing rooms, observe view, coach, professor portal | Browser | Unchanged. Several are switched off in the legacy UI (see below) |
| Accounts, roles, progress, professor notes, grades | Browser `localStorage`, mirrored to `window.name` | No database and no identity in this phase (decision 0008) |
| Session API for a server-side ER session | Server, in memory, off by default | Nothing in the browser calls it; sessions do not survive a restart (decision 0007) |
| Multi-agent system | Contracts only in `Nabd.Application/Abstractions/Agents/` | Forbidden to implement now; a test fails if anything implements them (decision 0009) |

## Feature status

"Reachable" is from audit part 34 (verified in a running legacy page, plus code reading). "Live" means a user can reach it; "dormant" means the code exists but the interface does not lead to it (for example the view is in `REMOVED_VIEWS` or hidden by `scope.css`). The audit counts 358 feature entries over 31 parts: 250 live, 90 dormant, 11 unreferenced, 7 not determined (`.work/docs/audit-structured.json`). "Client code preserved" is true for every row, because every bundle is equal to its legacy script (`Each_script_bundle_is_the_legacy_script`).

| Feature | Reachable in the legacy UI today | Client code preserved | Server-side counterpart | Golden master |
|---|---|---|---|---|
| Landing, sign-in, registration, demo accounts | Live | Yes | Views only; no identity (decision 0008) | None for behaviour. Rendered page equals legacy; browser comparison covers landing, sign-in, register, home for the three demo roles |
| Home page (role-specific blocks) | Live; specialty cards other than Emergency are locked placeholders | Yes | Views only | Browser comparison (manual) |
| ER room, doctor role | Live | Yes | `SimulationSession`, `SessionScorer`, seven use cases, session API (off by default) | 45 clinical traces; conversation golden master (12 rooms) |
| ER room, nurse role | Live | Yes | Clinical dynamics only; score, handover grade and escalation not ported | The nurse family of traces (dynamics); conversation golden master. No golden master for the nurse score |
| ER report and debrief view | Live (the debrief view alone shows an empty state or redirects to the ER report) | Yes | `GenerateSessionReport` for the doctor-role score | Final score, parts and verdict inside the traces |
| Understanding services (ER chat, handover grading) | Live when the external function is reachable; offline mode otherwise | Yes | `UnderstandingController`, `ProcessPatientMessage`, `HttpUnderstandingServiceGateway` | Tested against fakes only (14 endpoint tests, 9 gateway tests); the real functions were never called |
| Profile, history, certificate | Live | Yes | None | Browser comparison (profile) |
| University portal and professor assignment | Live (professor has five tabs; saves not all exercised) | Yes | None | Browser comparison (academic portal) |
| Professor custom-case form | Control live; the cards it feeds are hidden | Yes | None | None |
| Level quiz | Reachable from the profile; the placement quiz is not shown after registration | Yes | None | None |
| Specialty case room (`sim`) | Dormant | Yes | None | None |
| Nursing cases (`nurse`) | Dormant | Yes | None | None |
| Observe an expert (`observe`) | Dormant | Yes | None | None |
| Clinical coach | Dormant | Yes | None | Browser comparison has a coach state; no behaviour recorded |
| Respiratory room (`resp`) | Dormant; the legacy function for it answers 410 when locked (audit part 32) | Yes | Relay at `/api/resp-chat`; model and patient documents served | None |

## Order of the next steps

**This is a proposal.** It is derived from the decision records, the testing strategy and the audit. It has not been agreed with the owner, and no effort or date is estimated.

1. **Close the understanding-service stop-gap.**
   - What moves: nothing in this repository. The two external functions must recognise the application by a shared secret instead of an origin header, and the per-address rate limit must stop treating all users as one caller ([decision 0006](decisions/0006-understanding-services-through-a-gateway.md)).
   - Fragments: none. `100-server-client.js` and `ProcessPatientMessage` stay as they are.
   - What proves it: a controlled end-to-end check of the relay against the real functions, which has never been done. Calls cost model budget, so the owner must approve them.
   - What it unlocks: switching the services on for real users. Until then the application should not face real users with the services on.

2. **Decide identity.**
   - What moves: no code. Choose ASP.NET Core Identity or an external provider, and a store ([decision 0008](decisions/0008-no-database-and-no-authentication-in-this-phase.md)).
   - Fragments: none yet. Later, the accounts and role code in `script.js` (for example `070-demo-accounts`, `090-session-state`, `100-local-storage-store`, `110-password-hashing`, `150-auth-session-modal`).
   - What proves it: a written decision record; later, tests for who may read a session.
   - What it unlocks: a real session store (a session id is the only protection today, decision 0007), saved results on the server and a real professor portal.

3. **Move the order-safety rules of the ER room.**
   - What moves: the rules that decide whether an order is unsafe: `290-order-safety-rules.js`, the check part of `400-order-intake.js`, the decision part of `430-unsafe-and-harm.js`, the indication rule in `450-tests.js`, and what they depend on: `120-dose-reading.js` and `140-order-lexicon.js`. The domain side already has `ApplyHarm`, `OrderTest` and `UntreatedSystolicPressure`.
   - What proves it: new golden masters recorded from the legacy code first (testing strategy, rule 3). The audit lists candidates: `allergicTo`, `tooEarly`, the repeat/total/dose/route rules, `doseCheck`, and the collision rules of the order lexicon (audit parts 14, 16, 18).
   - What it unlocks: the transitional inputs of the session API (`harmful-orders` and a pre-graded handover, decision 0007) can be removed.

4. **Move the conversation engine and switch the ER room to the session API.**
   - What moves: the reader and the conversation: `130`, `150`, `160`, `170`, `180`-`220`, `230`-`280`, `310`, `440`, `460`-`470`, and the state of the room kept in `010-config-state.js`. The room then calls `/api/simulation/sessions`. `er-cases.json` is removed from the client documents; whether `er-act.json`, `er-find.json` and `er-lang.json` also leave depends on where the reader runs (not determined in the documents).
   - Preconditions from the documents: step 3 done; a real session store, because the in-memory store does not survive a restart and is not shared between instances (decision 0007); the conversation golden master (12 rooms) moves with the room (testing strategy, rule 3).
   - What proves it: the clinical traces and the conversation golden master pass unchanged against the server path; the baseline tests change only through registered seams.
   - What it unlocks: closing the data-exposure gap for the ER room ([decision 0005](decisions/0005-legacy-data-behind-repositories.md)), and the first step of the multi-agent phase, which needs the conversation on the server ([decision 0009](decisions/0009-multi-agent-contracts-only.md)).

5. **Port the nurse-role score.**
   - What moves: `550-nurse-handover-grade.js`, `560-nurse-score.js`, and the nurse rules in `320`-`370` that the score reads. Their clinical dynamics are already pinned by the nurse traces.
   - What proves it: a new golden master. The audit rates `scoreNurse` deterministic from a fixed fixture (audit part 20).
   - What it unlocks: the nurse role on the server session. The position after step 4 is a choice: the audit gives no reason that `scoreNurse` alone must wait, but the escalation state it reads is conversation state.

6. **Bring the respiratory room under test, then move it.**
   - What moves: `resp.js` (21 fragments, 884 lines), then the four `resp-*.json` documents leave the client documents.
   - What proves it: first record a golden master. The audit names deterministic candidates (the model forward pass, the seeded vital signs, the matching rules; audit part 22). The room has none today.
   - What it unlocks: removing the respiratory room's documents and its relay path. The external function for this room is locked in the legacy deployment (audit part 32), so a decision about reopening it comes first.

7. **Decide with the owner what to do with the dormant features.**
   - What: the specialty case room, nursing rooms, observe view, coach and the level quiz. Their code sits in `script.js` and is not reachable from the interface. How many of its lines serve only these features is not determined.
   - Fragments: the `script.js` fragments on the case catalog, nursing data, nursing rooms and coach (audit parts 01, 06, 07, 08, 10).
   - What proves it: for "keep", a golden master before any move; for "retire", a registered change that removes the code and its tests, because removing dead code still changes what the browser receives.
   - What it unlocks: a smaller client and fewer places where the weaknesses listed in the audit are carried.

## How to move one fragment

From [testing-strategy.md](testing-strategy.md) ("Rules for changing things") and [decision 0002](decisions/0002-lossless-strangler-migration.md). Do not skip a step.

1. Pick a fragment and read its layer and responsibility in the bundle's `README.md`.
2. Find the behaviour it carries. If a golden master already covers it, run it. If not, record one first from the legacy code: `tests/legacy-baseline/record-er-clinical.js` for clinical state, `golden-conversation.js` for the conversation. Recording needs Node.js. Check that a second recording is identical (`--check`).
3. Build the server-side counterpart in the right layer: rules in `Nabd.Domain`, orchestration in a use case in `Nabd.Application`, access to files or services behind a port implemented in `Nabd.Infrastructure`. Dependencies point inwards only (`LayeringTests`).
4. Prove the counterpart equal to the legacy behaviour with a replay test, using exact equality, as `ErClinicalTraceTests` does.
5. Switch the caller. Removing or changing a fragment changes what the browser receives, so `LegacySiteBaselineTests` fails until the difference is registered as a seam in `seams.json` with its reason. Register it; do not weaken the test.
6. If a clinical rule changes on purpose, the golden masters fail on purpose. Re-record them from a legacy script carrying the same change, or record the accepted difference in the test, with review by someone who can judge the clinical effect.
7. Remove the fragment from `bundles.json` and its folder only when nothing in the browser calls it and its golden master now runs against the server path. Move its document out of `IClientDataDocumentSource` when its room is fully on the server.
8. Run `dotnet build Nabd.sln` (warnings are errors) and `dotnet test Nabd.sln`. For a change to the browser's behaviour, also run the browser comparison and the golden-master comparisons against the served scripts, as [testing-strategy.md](testing-strategy.md) describes.
9. Update the bundle `README.md`, this map and the affected decision record.
