# Testing strategy

The refactoring has one objective above the others: **nothing the user sees or the simulation computes may
change**. The legacy site had no tests in its repository, so the strategy is built on the legacy code itself: it
was frozen, recorded, and made the oracle for the new solution.

Every claim below names the test or the tool that backs it. Where something was not checked, it says so.

## The baseline

`tests/Nabd.Tests/LegacyBaseline/` holds what "the legacy site" means, taken from commit `5f431d5` of `main`:

| File | Content |
|---|---|
| `site/` | The page, the six scripts and the nine stylesheets, exactly as stored in Git |
| `legacy-manifest.json` | Size and SHA-256 of all 85 files of the legacy site, including the data files and the images |
| `seams.json` | Every intentional difference between the legacy site and what the application serves, with its reason (18 entries) |

## Layers of tests

All of these run with `dotnet test` (144 tests, about ten seconds). None needs Node.js, a browser or a network.

| Layer | Test class | What it proves |
|---|---|---|
| Golden masters of the clinical core | `GoldenMasters/ErClinicalTraceTests` (46) | The domain model, replaying the inputs the legacy ER room received in 45 recorded scenarios, is in the same state after every step, to the last bit of every number, and gives the same score, score parts and verdict |
| What the browser receives | `Baseline/LegacySiteBaselineTests` (28) | The rendered page, each script bundle and each stylesheet equal the legacy file character for character once the registered differences are undone; each data document and each of the 59 images is byte-identical; source fragments and unknown documents cannot be requested |
| Domain rules in plain terms | `Domain/SimulationSessionTests` (16) | Each clinical rule on its own: risk rate, onset of a treatment, the cuff cycle, the floor, the sepsis hold, repeats, harm, anaphylaxis, a test that becomes harmful in shock, arrest, the stable handover, the dangerous destination |
| Use cases | `Application/SimulationUseCaseTests` (13) | The use cases against the real cases; a neglected patient arrests at exactly the simulated minute the legacy room recorded, for all six cases; a well-managed case scores 100 and passes; invalid and out-of-state requests are refused; the store is bounded |
| Legacy data mapping | `Infrastructure/ErCaseFileMapperTests` (5) | Every field the clinical core uses is mapped as the file has it, in file order; the "not reviewed by a physician" flag is exposed; only the shipped files can be read |
| External-service adapter | `Infrastructure/HttpUnderstandingServiceGatewayTests` (9) | Against a fake transport: body, endpoint, origin header; off, missing, non-HTTPS, unreachable, slow and oversized cases all read as "unavailable" |
| HTTP endpoints | `Web/UnderstandingEndpointTests` (14), `Web/SimulationSessionsApiTests` (3) | The relay is byte-exact and status-exact; refused before relaying: unknown case, non-object, non-JSON, oversized, cross-site, over the rate limit; the session API from start to report; the API is absent when switched off; a response never carries the risk or a test's indication; errors are problem documents without stack traces |
| Architecture | `Architecture/LayeringTests` (9), `SolutionSmokeTests` (1) | The dependency rule on the compiled assemblies; exactly five projects; controllers do not take infrastructure types; use cases are sealed; nothing implements the multi-agent contracts |

## Golden masters: how they are recorded

Recording needs Node.js (the traces are committed, so running the tests does not).

```
node tests/legacy-baseline/record-er-clinical.js            # writes tests/Nabd.Tests/GoldenMasters/ErClinical/*.json
node tests/legacy-baseline/record-er-clinical.js --check    # records again and compares with the files on disk
node tests/legacy-baseline/golden-conversation.js record    # writes tests/legacy-baseline/golden/conversation.json
node tests/legacy-baseline/golden-conversation.js compare
```

- `harness-er.js` runs the real `er.js` in a Node sandbox: a fake document, a fake clock driven frame by frame, a
  seeded random source, and a `fetch` that can never reach the network.
- `instrument-er.js` adds recording hooks to the script by exact pieces of its text. The hooks only report; they
  change no value and draw no random number. A hook that no longer fits the script aborts the recording.
- A trace holds the inputs in the order the legacy code handled them, including the two points inside one clock
  tick where an input can arrive, and the state after each step.
- Recording is deterministic: a second recording is identical to the first (`--check`).

Two golden masters exist:

1. **Clinical traces** (45 files), replayed by the C# tests. Scenario families: `script-off`, `script-on`, `neglect`,
   `ideal`, `late`, `harm`, `nurse` for each of the six cases, and three rescues.
2. **Conversation** (one file, 12 rooms): everything on screen and every request body for a fixed 40-message script
   in each case, offline and with a stub service. It is compared by running the same script against the `er.js`
   the application serves:

   ```
   curl -s http://127.0.0.1:5199/js/er.js -o served-er.js
   NB_ER_JS=served-er.js node tests/legacy-baseline/golden-conversation.js compare
   NB_ER_JS=served-er.js node tests/legacy-baseline/record-er-clinical.js --check
   ```

## Browser comparison

`tools/legacy/compare-hosts.mjs` opens the legacy site and the application side by side in headless Chrome, with
the same seeded random numbers, animations off and other hosts blocked, drives both through the same steps, and
compares the live DOM, the screenshot (the PNG bytes) and the page's errors. States: landing, sign-in, register,
home for each of the three demo roles, the academic portal, the profile, a navigation to the coach (which the
legacy client refuses, so that state shows the home view), and the ER briefing in both roles; each at 1440×900
and 390×844.

```
node tools/legacy/serve-static.mjs <a checkout of main> 5180
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/Nabd.Web --no-launch-profile --urls http://127.0.0.1:5199   # bash syntax; the variable matters: without it the services are on
node tools/legacy/compare-hosts.mjs
```

It is a manual check, not part of `dotnet test`: it needs Chrome and two running hosts.

## Results of this phase

| Check | Result |
|---|---|
| `dotnet build Nabd.sln` | 0 warnings, 0 errors (warnings are errors) |
| `dotnet test Nabd.sln` | 144 passed, 0 failed, 0 skipped |
| Clinical traces re-recorded against the `er.js` the application serves | 45 of 45 identical |
| Conversation golden master against the `er.js` the application serves | 12 of 12 rooms identical |
| Browser comparison, live DOM | identical in 22 of 22 state × viewport pairs |
| Browser comparison, screenshots | identical in 20 of 22 in the full run. The two that differed (signed-in home) have identical DOM, and an earlier full run differed on two other signed-in pairs instead: The legacy site compared with itself (`--current http://127.0.0.1:5180`, signed-in home of the medical student, four runs at two viewports) differed in 2 of 8 screenshots with identical DOM, so the difference is not between the hosts; its cause was not determined. See `docs/visual-baseline/README.md` |
| Browser comparison, page errors | none on either host |
| Mutation check of the golden masters | Done by hand when the tests were written: one changed model constant failed 33 traces; one changed scoring weight failed 12. The constant: the delay before a treatment starts to move the vital signs, `SimulatedMinutes + 0.03` in `SimulationSession.ApplyIntervention`, changed to `0.04`. The weight: `UnneededOrders.Count * 2` in `SessionScorer.Score`, changed to `* 3`. Both were restored and the run is not automated |

## What is not covered

Stated plainly, so that nobody reads more into the green run than it holds:

- **The real understanding services were never called**, by tests or by hand. The relay is tested against fakes.
- **The ER room after the briefing in a real browser** is covered by the Node harness (fake DOM), not by the
  browser comparison: the running room's clock and monitor depend on frame timing and cannot be compared pixel
  by pixel.
- **The respiratory room, the specialty simulation, the nursing rooms, the professor portal and the coach** have no
  behavioural golden master. Their code reaches the browser unchanged (the bundle tests prove that), and of them
  only the academic (professor) portal was among the states compared in the browser (the coach is closed in the
  legacy UI), but their internal rules are not pinned by recorded behaviour.
- **The nurse role's score** is not ported; its clinical dynamics are (six traces).
- **Order safety** (dose checks, allergy, "too early") is not ported; the traces cover what happens after the
  legacy client has decided.
- **Browsers other than Chrome**, real phones, and screen readers were not tested.
- **Load, concurrency and long uptime** were not tested. The session store is bounded but was not stressed.
- **Publishing** (`dotnet publish`) and running behind a reverse proxy were not exercised.

## Rules for changing things

1. A change to a file under `ClientScripts/`, `Views/` or `wwwroot/css` changes what the browser receives. It must
   be registered in `seams.json` with its reason, or the baseline tests fail.
2. A change to a clinical rule in `Nabd.Domain` fails the golden masters. Re-record them from a legacy script
   carrying the same change, or record the accepted difference in the test, with review by someone who can judge
   the clinical effect.
3. When a room moves to the server, its golden master moves with it: record the room's behaviour first, then move.
4. Never weaken a baseline test to make a change pass.
