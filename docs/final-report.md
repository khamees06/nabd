# Final report — architecture refactoring of Nabd

Branch `refactor/clean-architecture` · 2026-11-12 · base: commit `5f431d5` of `main` (the live site)

This report states what was done, what was proved and how, what was not done, and what the owner must decide.
Every number below was produced by a command run in this phase. Where something was not checked, it says so.
An Arabic version is in [final-report.ar.md](final-report.ar.md).

## 1. Result in one paragraph

The static site was re-hosted on ASP.NET Core MVC (.NET 10) with Clean Architecture in exactly five projects. What
the browser receives is identical to the legacy site except for 18 registered differences. The clinical core of the
emergency room was ported to C# and reproduces the legacy code bit for bit on 45 recorded scenarios. The room in the
browser still runs the legacy client engine; the server-side model, use cases and session API exist and are tested
but nothing in the browser calls them yet. No data was exposed less than before and none was exposed more, with one
exception noted in section 5. The live site, `main`, and the GitHub Pages copy were not touched.

## 2. Phases of the brief

| Phase | Deliverable | Status | Evidence |
|---|---|---|---|
| 1 Audit | `docs/legacy-audit.md` | Done | 34 part reports in `docs/legacy-audit/` (one reader per area, verified in code and in the running page) |
| 2 Baseline | Golden masters, visual baseline, migration map, testing strategy | Done | `tests/Nabd.Tests/LegacyBaseline/` (frozen site, SHA-256 manifest of 85 files), 45 clinical traces, 1 conversation master (12 rooms), `docs/visual-baseline/` (22 screenshots), `docs/migration-map.md`, `docs/testing-strategy.md` |
| 3 Solution | Five projects under `Nabd.sln` | Done | `LayeringTests.The_solution_has_exactly_the_five_projects` |
| 4 Data and model isolation | Legacy data behind repositories | Done for the ER cases; the other data files are served unchanged through one controller | `docs/decisions/0005`, `docs/data-catalog.md` |
| 5 Feature-by-feature migration | Domain, use cases, gateways | Partly: the ER clinical core and doctor score are migrated; the rest is not (section 4) | `docs/migration-map.md` |
| 6 Razor UI | Layout, view, partial views | Done; interface unchanged | `LegacySiteBaselineTests`, browser comparison |
| 7 Verification | restore, build, test, run | Done; `dotnet publish` not run | section 3 |
| 8 Final docs and report | README, requirements, architecture, workflows, setup, migration map, data catalog, testing strategy, ADRs | Done | `docs/` (9 decision records) |

## 3. What was verified

| Check | Result |
|---|---|
| `dotnet restore`, `dotnet build -c Release` | 0 warnings, 0 errors (warnings are errors; public members need XML docs) |
| `dotnet test` | 164 passed, 0 failed, 0 skipped |
| Clinical traces re-recorded against the `er.js` the running application serves | 45 of 45 identical |
| Conversation golden master against the served `er.js` | 12 of 12 rooms identical |
| Browser comparison of the legacy site and the application (headless Chrome, 11 states × 2 viewports) | Live DOM identical in 22 of 22; screenshots identical in 20 of 22; no page errors on either host |
| `dotnet run` (Release, Development settings) | Page, scripts, styles, data, images, health check, error paths and headers checked by request |
| Mutation checks | Changing one model constant failed 33 of 45 traces; one scoring weight, 12; the delay of the nurse's reading after a treatment, 23 tests |

The two screenshot differences are on signed-in home views whose DOM is identical. The legacy site compared with
itself showed the same kind of difference in 2 of 8 screenshots, so it is not a difference between the hosts; its
cause was not determined.

## 4. What was not done

| Not done | Why | Consequence |
|---|---|---|
| The browser room does not use the server-side model | Rewriting about 3,300 lines of Arabic reading and conversation rules in one step could not be shown to preserve behaviour | The server path is proved equal to the legacy engine but unused |
| Order safety (dose, allergy, "too early"), reading what the trainee wrote, the conversation | Same | They stay in the browser and the external service |
| Nurse role handover grade and score | Not ported | The nurse's clinical dynamics are ported (6 traces); its score is not |
| Respiratory room, specialty simulation, nursing rooms, professor portal, coach | Out of the critical path; several are switched off in the legacy UI | Their code reaches the browser unchanged (proved by the bundle tests); no behavioural golden master |
| Authentication and a database | Would change what the user sees and needs owner decisions (`docs/decisions/0008`) | Accounts are still demo data in the browser; nothing server-side may rely on a role |
| Multi-agent system | Brief: contracts only | Interfaces exist; a test fails if anything implements them (`docs/decisions/0009`) |
| The real understanding services were never called | Standing rule: no spending of model credit without approval | The relay is tested against fakes only; end to end, it is unverified |
| `dotnet publish`, a reverse proxy, load and long uptime, browsers other than Chrome, screen readers | Out of the time and scope | Unverified |
| Physician review of the case content | Not part of engineering | The data says `reviewed: false`; a test pins that |

## 5. Risks and weaknesses, stated plainly

1. **The rule "do not expose internal evaluation data to browsers" is not met for the legacy rooms.** While a room
   runs the legacy engine, its browser downloads the case file (diagnoses, expected steps, scoring hints). The files
   moved out of the public web root, behind a repository and a controller, but they are still served. The new server
   session API sends only what a trainee may see; a test asserts that the risk and a test's indication are absent.
2. **Stop-gap with the two serverless functions** (`docs/decisions/0006`). They accept a caller by its `Origin`
   header and limit requests per address. The application sends a configured origin and all its users share one
   address. Before real users, the functions should recognise the application by a shared secret. The functions are
   not in this repository and were not changed.
3. **The audit documents quote a few lines of those functions' access control** (the origin allow-list and the
   rate-limit constants). The repository is public. If that is unwanted, remove the quotes in
   `docs/legacy-audit/31-api-er-chat.md` and `32-api-resp-chat.md` or make the repository private.
4. **No identity.** The sign-in is not a security boundary; anyone can sign in as the professor in the demo.
5. **The legacy client's own weaknesses are preserved on purpose** (unescaped rendering of stored text, client-side
   roles, a page start that depends on a third-party font host). `docs/legacy-audit.md` lists them with severity.
6. **Independent review.** Three reviewers read the new code with different lenses and each finding was checked by a
   second reader: 19 reported, 19 confirmed (1 medium, 18 low). 16 were fixed and tested; 3 low ones remain and are
   listed in `docs/testing-strategy.md`. The fixes themselves were tested but not reviewed a second time.

## 6. Decisions for the owner

| Decision | Why it matters |
|---|---|
| Where to host the application | It needs a host that runs .NET. GitHub Pages and a static Vercel site cannot run it. **Merging this branch into `main` would stop the Pages backup link.** |
| When to move the ER room onto the server | It is the step that closes risk 1 and unlocks the multi-agent phase. Order of steps: `docs/migration-map.md`, "Order of the next steps" |
| Identity (who may register, where personal data lives) | Needed before saving results on a server (`docs/decisions/0008`) |
| The functions' shared secret | Closes risk 2 |
| Dormant features (several rooms are hidden in the legacy UI) | Keep or retire; the audit lists them with the code that serves them |
| Physician review of the cases | Needed before any claim of clinical validity |

## 7. What changed in the repository

- 9 commits on `refactor/clean-architecture`; the history of `main` is untouched and nothing was rewritten.
- The legacy files moved: scripts → 183 fragments under `src/Nabd.Web/ClientScripts/`, the page → 46 Razor views,
  styles and images → `wwwroot`, data → `src/Nabd.Infrastructure/LegacyData/Files/`. Every move is recorded in
  `docs/migration-map.md`; the cut is reproducible from `tools/migration/split-plan.json`.
- New code: Domain (clinical core and scoring), Application (8 use cases, ports, agent contracts), Infrastructure
  (repositories, session store, service gateway), Web (controllers, bundler, rate limits, origin filter).
- No secret is in the repository (a scan for key patterns found none; the only mention is the name of the environment
  variable the external functions read).

## 8. How to reproduce

```
dotnet restore Nabd.sln
dotnet build Nabd.sln -c Release
dotnet test Nabd.sln -c Release
dotnet run --project src/Nabd.Web          # http://localhost:5054, understanding services off in Development
```

The golden masters and the browser comparison need Node.js and Chrome: see `docs/testing-strategy.md`.
