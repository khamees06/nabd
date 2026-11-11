# Architecture

Nabd («نَبْض الأردن») is an Arabic clinical-simulation trainer for medical and nursing students. This document
describes the solution as it stands on the branch `refactor/clean-architecture`: what each project holds, which way
the dependencies point, how a request travels, and what is deliberately left for the next phase.

The clinical content of the cases was written for training and **has not been reviewed by a physician**. The data
file says so itself (`reviewed: false`), the repository exposes that flag, and a test pins it.

## The five projects

```
Nabd.sln
├── src/Nabd.Domain           the clinical simulation: cases, vital signs, risk, stages, scoring
├── src/Nabd.Application      use cases and the contracts (ports) the outside world must fulfil
├── src/Nabd.Infrastructure   adapters: legacy JSON data, the session store, the external services
├── src/Nabd.Web              ASP.NET Core MVC: controllers, Razor views, client scripts, static assets
└── tests/Nabd.Tests          unit, integration, architecture, baseline and golden-master tests
```

Dependencies point inwards only:

```
Nabd.Web ──────────► Nabd.Application ──────────► Nabd.Domain
   │                        ▲
   └──► Nabd.Infrastructure ┘   (Web references Infrastructure only to register it: the composition root)
```

`tests/Nabd.Tests/Architecture/LayeringTests.cs` checks this on the compiled assemblies: the domain references
nothing but the base class library; the application references the domain only; infrastructure never references
the web; no controller takes an infrastructure type; the solution has exactly these five projects.

### Nabd.Domain

No package or project references. Everything in it is plain C#.

| Folder | Holds |
|---|---|
| `Cases/` | `ClinicalCase` (reference data: risk profile, vital-sign anchors, care steps, expected test results, stage cues, findings, disposition and collapse rules) with `VitalsAt(risk)` and `StageAt(risk)` |
| `Catalog/` | `ClinicalCatalog`: the interventions and tests every case shares, with their repeat rules and general effects |
| `Simulation/` | `SimulationSession`, the aggregate root: time, risk, stage, the blood-pressure cuff, interventions, harms, tests, anaphylaxis, ventricular tachycardia, arrest and handover. Value objects (`VitalSigns`, `VitalEffect`, records of what happened) and session events |
| `Simulation/Scoring/` | `SessionScorer`: the 100-point score in six parts, the destination verdict, and the reasons that fail a session whatever its score |
| `Common/` | `DomainException`, and the two numeric helpers kept exactly as the legacy code had them |

`SimulationSession` is a rule-for-rule port of the clinical core of the legacy ER room (`er.js`). It is pinned by
45 golden-master traces recorded from the legacy code and replayed **bit for bit** (see
[testing-strategy.md](testing-strategy.md) and [decision 0004](decisions/0004-clinical-core-pinned-by-golden-masters.md)).
The session knows nothing about text, the screen or the network: it receives the outcome of an order as a command.

### Nabd.Application

References the domain, plus the dependency-injection and logging abstractions.

| Folder | Holds |
|---|---|
| `Simulation/` | Use cases `StartSimulationSession`, `AdvanceSimulation`, `ExecuteIntervention`, `ReportHarmfulOrder`, `RequestMedicalTest`, `CompleteSimulation`, `GenerateSessionReport`; the views a trainee may see (`SessionSnapshot`, `SessionReport`) |
| `Dialogue/` | Use case `ProcessPatientMessage`: checks a room's request and relays it to the understanding service |
| `Abstractions/Data/` | `IClinicalCaseRepository`, `IClientDataDocumentSource` |
| `Abstractions/Simulation/` | `ISimulationSessionStore` |
| `Abstractions/Ai/` | `IUnderstandingServiceGateway` |
| `Abstractions/Agents/` | The multi-agent contracts: `IAgentOrchestrator`, `IPatientAgent`, `ICompanionAgent`, `INurseAgent`, `ISupervisorAgent`. **Contracts only**; a test fails if anything implements them |
| `Common/` | `Result<T>` and `Error`: a use case reports a failure without throwing |

A use case is one sealed class with one `HandleAsync` method. It loads what it needs through a port, asks the
domain to do the work, and returns a view. No clinical rule lives in this layer, and there is no mediator library
([decision 0001](decisions/0001-clean-architecture-in-five-projects.md)).

### Nabd.Infrastructure

| Folder | Holds |
|---|---|
| `LegacyData/Files/` | The eight legacy JSON files, byte for byte as they were |
| `LegacyData/` | `LegacyDataFiles` (the only code that opens those files, by known name), `JsonClinicalCaseRepository`, `FileClientDataDocumentSource`, `ErCases/ErCaseFileMapper` (legacy JSON → domain objects) |
| `Simulation/` | `InMemorySimulationSessionStore`: bounded, with an idle time limit |
| `Ai/` | `HttpUnderstandingServiceGateway`: relays to the existing serverless functions |

### Nabd.Web

| Folder | Holds |
|---|---|
| `Controllers/` | `HomeController` (the page), `ClientScriptsController` (`/js/*.js`), `ClientDataController` (`/data/*.json`) |
| `Controllers/Api/` | `UnderstandingController` (`/api/er-chat`, `/api/resp-chat`), `SimulationSessionsController` (`/api/simulation/sessions`) |
| `Views/` | `Shared/_Layout.cshtml`, `Home/Index.cshtml` and 43 partial views that together reproduce the legacy page |
| `ClientScripts/` | The browser-side client: 183 source fragments in six bundles, `bundles.json`, and `ClientBundleProvider` that joins them |
| `Http/` | Rate-limit policies, the same-origin filter, the cached-content result |
| `wwwroot/css`, `wwwroot/img` | Stylesheets and images |
| `Program.cs` | The composition root |

Controllers are thin: each action calls one use case or one application port and maps the result to HTTP.

## How the page reaches the browser

The user interface is **frozen**: the page, the styles and the client behaviour are the legacy ones.

1. `GET /` → `HomeController.Index` → the layout and views render the same HTML the static `index.html` had.
2. `GET /css/*.css`, `GET /img/**` → static files.
3. `GET /js/script.js` (and `er.js`, `resp.js`, `ui.js`, `motion.js`, `terms.js`) → `ClientScriptsController` →
   `ClientBundleProvider` joins the bundle's fragments in the order of `ClientScripts/bundles.json`. Joining is plain
   concatenation: nothing is rewritten, minified or reordered.
4. `GET /data/er-cases.json` (and the other documents) → `ClientDataController` → `IClientDataDocumentSource`.
   The data files are no longer public static files; only the documents the application names can be asked for.
5. `POST /api/er-chat` → `UnderstandingController` → `ProcessPatientMessage` → `IUnderstandingServiceGateway` →
   the external function. The answer returns unchanged, status included, because the room decides by the status
   whether to work offline.

`tests/Nabd.Tests/Baseline/LegacySiteBaselineTests.cs` starts the application in memory and compares every one of
these assets with the frozen legacy site. The only differences allowed are the 18 entries of
`tests/Nabd.Tests/LegacyBaseline/seams.json` (where stylesheets and scripts are served from, and the two lines
that told the rooms where the understanding service is).

## Where the logic runs today

This phase is a **lossless strangler** ([decision 0002](decisions/0002-lossless-strangler-migration.md)): the proven
browser-side client keeps running unchanged while the server grows underneath it.

| Concern | Runs in | Status |
|---|---|---|
| Clinical dynamics of the ER room (risk, vital signs, stages, cuff, interventions, harms, tests) | Browser (legacy client) **and** `Nabd.Domain` | The domain model reproduces the legacy client exactly. The room does not call it yet |
| Doctor-role score and verdict | Browser **and** `Nabd.Domain` | Same |
| Nurse-role handover grade and score | Browser | Not ported |
| Reading what the trainee wrote; order safety (dose, allergy, "too early") | Browser and the external understanding service | Not ported |
| Voices of the patient, relative, nurse, supervisor | External understanding service; fixed lines in the browser when offline | Relayed through the application |
| Respiratory room, specialty simulation, nursing rooms, professor portal, coach | Browser | Unchanged. Several are switched off in the legacy UI; see [legacy-audit.md](legacy-audit.md) |
| Accounts and progress | Browser `localStorage` | Unchanged. There is no server-side identity |

Each client fragment is labelled with the layer its responsibility belongs to (the `README.md` in every
`ClientScripts/<bundle>/` folder). That table is the map for moving code out of the browser one fragment at a time;
[migration-map.md](migration-map.md) lists the order.

## What is honest to say about data exposure

The rule "do not expose internal clinical evaluation data to browsers" is **not yet met for the legacy rooms**:
while a room runs the legacy client engine, the browser still downloads its case file, which contains diagnoses,
expected steps and scoring hints. What changed in this phase:

- the files moved out of the public web root into the infrastructure layer, behind a repository and a controller;
- the new server-side session API sends only what a trainee may see (the monitor, the stage, what was done); the
  risk, the indication of a test and the scoring rules stay on the server until the report. A test asserts this.

Closing the gap means moving each room's engine to the server, which is the next phase.
[data-catalog.md](data-catalog.md) lists, per file, what a trainee could learn from it today.

## Security posture

| Area | State |
|---|---|
| Secrets | The application holds none. The model key stays in the external function's environment |
| Authentication, authorization | **None.** Accounts are demo data in the browser, as before. Nothing server-side may rely on a role until real identity exists ([decision 0008](decisions/0008-no-database-and-no-authentication-in-this-phase.md)) |
| Understanding-service endpoints | Same-origin filter, per-caller rate limit, 64 KB body limit, JSON and case-id validation before anything is relayed |
| Server session API | Off by default (`Simulation:ServerSessionsApi:Enabled`); bounded in-memory store |
| Response headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`. No Content-Security-Policy: the legacy page relies on inline handlers and inline scripts |
| Errors | Problem documents without stack traces; details go to the log |
| Known weaknesses carried over from the legacy client | Listed with severity in [legacy-audit.md](legacy-audit.md) (unescaped rendering of stored text, client-side roles, page start depending on a third-party font host) |

## Preparing for the multi-agent system

Nothing of the multi-agent system is implemented. What exists is the place for it:

- `Nabd.Application/Abstractions/Agents/` defines the orchestrator and the four voices, with the context an agent
  may know (`AgentContext`) and what it answers (`AgentReply`).
- `ProcessPatientMessage` is the single point through which a room's message leaves the application. When agents
  exist, this use case asks the orchestrator instead of relaying; the rooms do not change.
- `SimulationSession` raises `SessionEvent`s (stage change, harm, arrest, …). They are what
  `IAgentOrchestrator.HandleSessionEventAsync` will react to.

See [decision 0009](decisions/0009-multi-agent-contracts-only.md).
