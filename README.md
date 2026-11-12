# نَبْض الأردن — Nabd

An Arabic clinical-simulation trainer for medical and nursing students. A trainee manages an emergency patient in
a chat-driven room: talks to the patient and the relative, gives orders to the nurse, reads the monitor, orders
tests, hands over, and gets a report.

> **Training prototype.** The clinical content of the cases has **not been reviewed by a physician**. The system
> does not diagnose or treat real patients and must not be presented as doing so.

This branch (`refactor/clean-architecture`) re-hosts the site on **ASP.NET Core MVC** with **Clean Architecture**,
without changing what the user sees or what the simulation computes. The legacy static site on `main` is untouched.

## Where things stand

| | |
|---|---|
| The page, styles, scripts, data and images the browser receives | Identical to the legacy site, except 20 registered differences (where assets are served from, where the rooms find the understanding service: the external function that reads what the trainee wrote and voices the people in the room, and the landing's stylesheets and script). Proved by tests |
| The public landing (branch `ui/landing-v6-integration`) | The owner's V6.2 design: public header, landing view and public footer, as Razor partials with scoped styles; same IDs and same sign-in as before. Compared with the prototype at six widths and pinned by approved snapshots. V6.3 refines four sections (real product screenshots, right-to-left step arrows, a Jordanian university photo) and restyles sign-in with CSS only; awaiting the owner's review. See [docs/ui-integration-map.md](docs/ui-integration-map.md) and [ADR 0011](docs/decisions/0011-landing-v63-refinement-layer.md) |
| The clinical core of the ER room (risk, vital signs, stages, treatments, harms, tests, score) | Ported to C# and proved equal to the legacy code, bit for bit, on 45 recorded scenarios |
| Use cases, repositories, service gateway, session API | Implemented and tested. The session API is off by default |
| The room in the browser | Still runs the legacy client engine. Moving it onto the server is the next phase |
| Multi-agent system | Contracts only; nothing implemented |
| Accounts | Still demo data in the browser. There is no server-side identity |
| Real understanding services | Never called in this phase; the relay is tested against fakes |

Read [docs/architecture.md](docs/architecture.md) first. It says plainly what is and is not done.

## Quick start

```
dotnet restore Nabd.sln
dotnet build Nabd.sln
dotnet test Nabd.sln
dotnet run --project src/Nabd.Web
```

Then open <http://localhost:5054>. Requires the .NET 10 SDK. In Development the paid understanding services are
switched off and the rooms run in their offline mode; see [docs/setup.md](docs/setup.md).

## Layout

```
Nabd.sln
src/
  Nabd.Domain/           clinical simulation model (no dependencies)
  Nabd.Application/      use cases and ports
  Nabd.Infrastructure/   legacy JSON data, session store, external-service gateway
  Nabd.Web/              MVC controllers, Razor views, client scripts, static assets
tests/
  Nabd.Tests/            unit, integration, architecture, baseline and golden-master tests
  legacy-baseline/       Node tools that record golden masters from the legacy code
tools/
  legacy/                audit and browser-comparison tools
  migration/             the record of how the legacy files were cut
docs/
```

## Documentation

| Document | Content |
|---|---|
| [docs/final-report.md](docs/final-report.md) ([العربية](docs/final-report.ar.md)) | What was done, proved, not done, and what the owner must decide |
| [docs/architecture.md](docs/architecture.md) | The layers, the request paths, where logic runs today, security posture |
| [docs/requirements.md](docs/requirements.md) | What the system must do and keep, with the evidence for each |
| [docs/workflows.md](docs/workflows.md) | User journeys and system flows |
| [docs/setup.md](docs/setup.md) | Tools, commands, configuration, deployment notes |
| [docs/testing-strategy.md](docs/testing-strategy.md) | The baseline, the golden masters, results, and what is not covered |
| [docs/migration-map.md](docs/migration-map.md) | Where every legacy file and rule went, and the order of what moves next |
| [docs/data-catalog.md](docs/data-catalog.md) | Every data file and stored key: content, readers, sensitivity |
| [docs/legacy-audit.md](docs/legacy-audit.md) | The audit of the legacy site; detailed parts under `docs/legacy-audit/` |
| [docs/decisions/](docs/decisions/) | Architecture decision records |
| [docs/ui-integration-audit.md](docs/ui-integration-audit.md) | The V6.2 landing prototype: conflicts with the application, honesty and accessibility review |
| [docs/ui-integration-map.md](docs/ui-integration-map.md) | Where every part of the prototype went: partials, IDs, classes, actions, files |
| [docs/ui-design-system.md](docs/ui-design-system.md) | The landing's tokens, typography, components, breakpoints, and how its stylesheets are built |
| [docs/next-phase-backlog.md](docs/next-phase-backlog.md) | What the landing integration leaves open, including the owner's decisions |

## Ground rules

- No secret belongs in this repository, in client code, or in a response.
- The interface is frozen: a change to what the browser receives must be registered in
  `tests/Nabd.Tests/LegacyBaseline/seams.json`, with its reason.
- A change to a clinical rule fails the golden masters on purpose; see
  [docs/testing-strategy.md](docs/testing-strategy.md) for how to change one deliberately.
- The public landing's three regions are pinned by approved snapshots (`tests/Nabd.Tests/LandingBaseline/`);
  change them only after comparing with the design, as [docs/testing-strategy.md](docs/testing-strategy.md) says.
- Image credits are in `src/Nabd.Web/wwwroot/img/CREDITS.txt` and, for the landing, `src/Nabd.Web/wwwroot/img/landing/CREDITS.md`
  (six of its photos still need a documented source and licence). The landing font's licence is
  `src/Nabd.Web/wwwroot/fonts/noto-sans-arabic/LICENSE.md`.
