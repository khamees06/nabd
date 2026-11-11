# Setup

## What you need

| Tool | Version used | Needed for |
|---|---|---|
| .NET SDK | 10.0.401 (`global.json` rolls forward within 10.0) | Building, testing and running the application |
| Node.js | 24 (any recent version) | Only for re-recording golden masters and for the browser comparison |
| Google Chrome | any recent | Only for the browser comparison |

No database, no container and no secret is needed to build, test or run.

## Build, test, run

From the repository root:

```
dotnet restore Nabd.sln
dotnet build Nabd.sln
dotnet test Nabd.sln
dotnet run --project src/Nabd.Web
```

`dotnet run` uses the `http` launch profile: the page is at <http://localhost:5054>. `GET /healthz` answers `ok`.

Warnings are errors in every project. Public members need XML documentation in every project except the tests.

## Configuration

Settings live in `src/Nabd.Web/appsettings.json`, overridden by `appsettings.Development.json` and by environment
variables (`Section__Key`).

| Setting | Default | Meaning |
|---|---|---|
| `UnderstandingServices:ErRoom:Enabled` | `true`; **`false` in Development** | Whether the ER room may reach its understanding service. Off, the room runs in its offline mode |
| `UnderstandingServices:ErRoom:Endpoint` | the existing function's URL | Where the service is |
| `UnderstandingServices:ErRoom:TimeoutSeconds` | `20` | How long to wait for it |
| `UnderstandingServices:ErRoom:Origin` | empty (the endpoint's own origin) | The `Origin` header sent to the service; see decision 0006 |
| `UnderstandingServices:RespiratoryRoom:*` | as above | The same, for the respiratory room |
| `RateLimits:UnderstandingPerMinute` | `40` | Requests per minute, per caller address, to `/api/er-chat` and `/api/resp-chat` |
| `RateLimits:SimulationPerMinute` | `240` | The same, for the session API |
| `Simulation:Sessions:MaximumSessions` | `500` | Sessions kept in memory at once |
| `Simulation:Sessions:IdleMinutes` | `120` | Minutes after which an untouched session is dropped |
| `Simulation:ServerSessionsApi:Enabled` | `false`; **`true` in Development** | Whether `/api/simulation/sessions` exists |
| `LegacyData:RootPath` | empty (the folder shipped with the application) | Where the legacy JSON files are read from |

### The understanding services cost money

Each turn in a room with its service switched on calls a paid model through the external function. That is why
the services are **off in Development**. Switch one on locally only on purpose:

```
UnderstandingServices__ErRoom__Enabled=true dotnet run --project src/Nabd.Web
```

The application itself holds no model key. The key lives in the environment of the external function and must
never be copied into this repository, its settings or its logs.

## Working on the code

- **Client scripts.** The browser-side code is under `src/Nabd.Web/ClientScripts/<bundle>/`, one folder per bundle,
  each with a `README.md` listing its fragments. The application joins them on first request, so restart it after
  editing a fragment. While the client is frozen, an edit fails the baseline tests until it is registered in
  `tests/Nabd.Tests/LegacyBaseline/seams.json`.
- **Views.** The views under `src/Nabd.Web/Views/` are the legacy page cut into partial views. Do not add or
  remove a line feed at the end of a view file (`.editorconfig` tells editors not to); see decision 0003.
- **Data.** The legacy JSON files are under `src/Nabd.Infrastructure/LegacyData/Files/` and are not to be edited:
  a test compares them with the legacy hashes.
- **Line endings.** Text is stored with line feeds in Git. On Windows the working copy has CRLF; the bundler and
  the tests normalise it. The legacy data files and the frozen baseline are exempt from conversion
  (`.gitattributes`).

## Tools

| Tool | Purpose |
|---|---|
| `tests/legacy-baseline/record-er-clinical.js` | Records the clinical golden masters from the legacy `er.js` (`--check` to compare) |
| `tests/legacy-baseline/golden-conversation.js` | Records or compares the conversation golden master |
| `tools/legacy/serve-static.mjs <folder> <port>` | Serves a checkout of the legacy site; `/api` answers 404 on purpose |
| `tools/legacy/compare-hosts.mjs` | Compares the legacy site and the application in headless Chrome |
| `tools/legacy/browser-probe.mjs` | Opens a page in headless Chrome, runs a script in it, saves a screenshot |
| `tools/legacy/check-fragment.mjs`, `find-cuts.mjs`, `xref.mjs` | Used by the audit to find where a script can be cut and which names are referenced |
| `tools/migration/split-legacy.mjs` | Performed the cut of the legacy files (`--check` validates the plan without writing). Kept as the record of the migration; running it again overwrites the generated files with the legacy text |

See [testing-strategy.md](testing-strategy.md) for how the tools are used together.

## Deployment notes

This phase did not deploy anything, and the legacy site was not touched: it still runs from the `main` branch.

- The application is an ordinary ASP.NET Core process. It needs a host that runs .NET; **static hosting such as
  GitHub Pages cannot run it.** Merging this branch into `main` would therefore stop the Pages copy of the site
  from working, because the static `index.html` is no longer at the repository root.
- Behind a reverse proxy, configure forwarded headers so that the same-origin check sees the real host and the
  per-caller rate limit sees the real client address (the same-origin check compares host and port, not the scheme).
  ASP.NET Core turns its forwarded-headers handling on with the environment variable
  `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true`; this was not exercised in this phase.
- Before real users, close the stop-gap described in decision 0006.
- `dotnet publish` was not exercised in this phase.
