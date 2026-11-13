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
| `seams.json` | Every intentional difference between the legacy site and what the application serves, with its reason (20 entries) |

`tests/Nabd.Tests/LandingBaseline/` holds the redesigned parts of the page: the V6.2 public landing
([decision 0010](decisions/0010-public-landing-v62-with-the-shell-preserved.md)) and, since V6.4, the sign-in screen
([decision 0012](decisions/0012-sign-in-and-registration-pages.md)): `regions.json` (where the four redesigned
regions are in the served page and in the legacy page) and the approved snapshot of each region
(`public-header.html`, `landing.html`, `auth.html`, `site-footer.html`).

## Layers of tests

All of these run with `dotnet test` (206 tests since V6.5, about ten seconds). None needs Node.js, a browser or a network.

| Layer | Test class | What it proves |
|---|---|---|
| Golden masters of the clinical core | `GoldenMasters/ErClinicalTraceTests` (46) | The domain model, replaying the inputs the legacy ER room received in 45 recorded scenarios, is in the same state after every step, to the last bit of every number, and gives the same score, score parts and verdict |
| What the browser receives | `Baseline/LegacySiteBaselineTests` (33) | The rendered page outside the four redesigned regions, each script bundle and each stylesheet equal the legacy file character for character once the registered differences are undone; each redesigned region equals its approved snapshot, and the regions come in page order; each data document and each of the 59 images is byte-identical; source fragments and unknown documents cannot be requested |
| Sign-in pages (V6.4) | `Web/AccountPagesTests` (14) | `/login` and `/register` are served like `/` (not stored, `HEAD` too) and equal `/` outside the sign-in screen and the title; `/login/` and `/register/` redirect to the address without the slash; `/` has the screen hidden on the sign-in form, each page has it open on its own form and first registration step; every id the legacy client reads is in the screen exactly once, with the three demo accounts, the three account types and the classes it reads (`nb-auth-simple`, `nb-auth-main`, `nb-step`); the Microsoft and Google buttons are `aria-disabled` and «قريباً», with no link to a sign-in service and no server endpoint (`/signin-google`, `/signin-microsoft`, `/signin-oidc` are 404) |
| The landing (V6.2, refined in V6.3 and V6.4) and the signed-in stylesheet (V6.5) | `Baseline/LandingV6Tests` (23) | Section order as in the prototype; one public header; the IDs the legacy client binds present exactly once and every ID unique; every in-page link has a target; no form or input, sign-in only through `openAuthModal`; external links only the credits, with `rel="noopener"`; every one of the 14 photos a local WebP of the declared size with Arabic alt text, eager hero and lazy others, and the one drawing (the laptop) a decorative SVG of its declared size; every image file credited and used; font licence present; WOFF2 fonts served; `landing.js` is its two fragments; every selector of the landing stylesheets starts from a landing root and every selector of `auth.css` from `#auth-modal` (with a minimum number of selectors read per file); no legacy stylesheet uses the `nl-` prefix; no Latin words on the header and landing except SBAR, ER, ECG, ICU, and none on the sign-in screen except Microsoft and Google; the steps are an ordered list with an arrow after steps 1–3 only; `auth.css` never sets `display` inside its layer on what `.hidden` or the registration steps show and hide, and sets it outside the layer, as an ordinary declaration, only for the forms, the fields and the error boxes; V6.5: `app-v65.css` reaches only signed-in screens and changes only paint |
| Domain rules in plain terms | `Domain/SimulationSessionTests` (16) | Each clinical rule on its own: risk rate, onset of a treatment, the cuff cycle, the floor, the sepsis hold, repeats, harm, anaphylaxis, a test that becomes harmful in shock, arrest, the stable handover, the dangerous destination |
| Use cases | `Application/SimulationUseCaseTests` (13) | The use cases against the real cases; a neglected patient arrests at exactly the simulated minute the legacy room recorded, for all six cases; a well-managed case scores 100 and passes; invalid and out-of-state requests are refused; the store is bounded |
| Legacy data mapping | `Infrastructure/ErCaseFileMapperTests` (5) | Every field the clinical core uses is mapped as the file has it, in file order; the "not reviewed by a physician" flag is exposed; only the shipped files can be read |
| External-service adapter | `Infrastructure/HttpUnderstandingServiceGatewayTests` (9) | Against a fake transport: body, endpoint, origin header; off, missing, non-HTTPS, unreachable, slow and oversized cases all read as "unavailable" |
| HTTP endpoints | `Web/UnderstandingEndpointTests` (14), `Web/SimulationSessionsApiTests` (3) | The relay is byte-exact and status-exact; refused before relaying: unknown case, non-object, non-JSON, oversized, cross-site, over the rate limit; the session API from start to report; the API is absent when switched off; a response never carries the risk or a test's indication; errors are problem documents without stack traces |
| Defects found by the independent review | `Web/ReviewFindingsTests` (20) | One test per confirmed defect that was fixed; see "Independent review" below |
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

Since the V6.2 landing, the tool takes the redesigned regions (since V6.4 four: the sign-in screen too) out of both hosts (a placeholder in the DOM,
hidden before the screenshot) together with the landing's stylesheets, fonts and script, and leaves comments and
the whitespace between tags out of the DOM comparison; the exact text, comments included, is the baseline tests'
job. The landing itself is compared with the owner's prototype by two tools:

```
node tools/legacy/landing-style-diff.mjs --proto <prototype.html> --app http://127.0.0.1:5199/ --width 1440
node tools/legacy/landing-visual-compare.mjs --proto <prototype.html> --app http://127.0.0.1:5199/
```

The first lists every element (and drawn `::before`/`::after`) whose computed styles differ; the second
screenshots both at 1536, 1440, 1024, 768, 390 and 320 px and counts differing pixels, writing the screenshots,
a difference image per width and `report.json` to `.work/visual`. After an accepted change to the landing, record
its new snapshots with `node tools/migration/landing-v6/approve-landing-baseline.mjs` and commit them with the change.

## Results of this phase

| Check | Result |
|---|---|
| `dotnet build Nabd.sln` | 0 warnings, 0 errors (warnings are errors) |
| `dotnet test Nabd.sln` | 164 passed, 0 failed, 0 skipped |
| Clinical traces re-recorded against the `er.js` the application serves | 45 of 45 identical |
| Conversation golden master against the `er.js` the application serves | 12 of 12 rooms identical |
| Browser comparison, live DOM | identical in 22 of 22 state × viewport pairs |
| Browser comparison, screenshots | identical in 20 of 22 in the full run. The two that differed (signed-in home) have identical DOM, and an earlier full run differed on two other signed-in pairs instead: The legacy site compared with itself (`--current http://127.0.0.1:5180`, signed-in home of the medical student, four runs at two viewports) differed in 2 of 8 screenshots with identical DOM, so the difference is not between the hosts; its cause was not determined. See `docs/visual-baseline/README.md` |
| Browser comparison, page errors | none on either host |
| V6.2 landing (2026-11-12), `dotnet build Nabd.sln -c Release` / `dotnet test Nabd.sln -c Release` | 0 warnings, 0 errors / 182 passed, 0 failed, 0 skipped |
| V6.2 landing against the prototype | Computed styles of the landing content identical at the six widths (header and footer differ only by the shortened brand line and the added credits); differing pixels in header + landing 0.009–0.064 %, all explained; no horizontal overflow. See `docs/visual-baseline/README.md` |
| V6.2 landing, rest of the application against the legacy site | DOM identical in 22 of 22 state × viewport pairs (one pair differed in the first run because a toast was still showing, identical when run again); screenshots identical or within 3 colour levels of 255 |
| V6.2 landing, interactions in headless Chrome | Mobile menu (open, Escape, outside click, link closes it, signed-in sidebar untouched), in-page links land 8 px below the sticky header, deep link `/#nl-method`, dialog (focus in, Tab trap, Escape, focus back), register/login buttons open the existing modal on the right tab, demo sign-in swaps header/footer/view, logout returns to the landing; no page errors |
| V6.3 refinement (2026-11-12), `dotnet build Nabd.sln` / `dotnet test Nabd.sln` | 0 warnings, 0 errors / 187 passed, 0 failed, 0 skipped |
| V6.3, unchanged parts and the rest of the application | Header to specialties pixel-identical to V6.2 at 1440 and 390; signed-in views and ER room identical to the legacy site (DOM and screenshots); see `docs/visual-baseline/README.md` |
| V6.3, behaviour in headless Chrome | Sign-in validation, error message, switch to registration, role cards, step 2 and back, demo sign-in, logout, mobile menu, dialog, in-page links: as before, no page errors |
| V6.3, two review rounds | Round 1: 16 confirmed findings (partnership layout between 901 and 1250 px, contrast, unreadable laptop screen and phone thumbnails, the hospital photo's licence, modal states, …), 2 refuted; round 2 re-checked them and found 8 more (callouts overlapping on phones, answer boxes, photo subject, modal on tall and short screens, …). All of medium or high severity were fixed and re-measured |
| V6.4 (2026-11-13), `dotnet test` | 204 passed, 0 failed, 0 skipped |
| V6.4, rest of the application against the legacy site | DOM identical in all 22 pairs except the known ER-briefing toast timing; screenshots identical except the landing (redesigned) and the states documented as flaky (re-run identical) |
| V6.4, sign-in pages in headless Chrome | Header button → `/login`, switch to `/register` and back, Back/Forward, Escape, protected-view prompt with its notice, brand link, final call to action, password reveal, registration in two steps with validation, demo sign-in on `/login` → home at `/`, wrong e-mail message, `/login` with a saved account → home, Tab kept on the screen; after the review: closing the screen inside the ER room keeps the trainee in the room, home opens at its top after a sign-in, Forward after a sign-in does not reopen the screen |
| V6.4, independent review | Round 1: five lenses (behaviour, accessibility and RTL, honesty and brief, CSS isolation, tests and docs), each finding checked by a skeptic: 26 confirmed (none high; two issues were each found twice), 5 refuted; all fixed. Round 2 re-ran every confirmed scenario (all fixed) and hunted for regressions: 9 small follow-ups (two buttons named «رجوع» on registration step 2, no ring on focused fields, one 4.4:1 digit, a jump to a #fragment on closing, a Forward edge case, stale numbers), all fixed |
| V6.5 (2026-11-13), `dotnet test` | 206 passed, 0 failed, 0 skipped. The two new tests: every selector of `app-v65.css` starts from the signed-in flag or a signed-in part (each `:is()` item checked, no sibling combinator, only `@media`/`@layer`/`@supports`), and it sets no display, visibility, opacity, transform, position, z-index, height, offset, overflow, animation or transition. Checked by mutation: an unscoped `#calm-toast` rule and a `display` on `.er-sheet` each made them fail |
| V6.5, the rest of the application | See `docs/visual-baseline/README.md` (V6.5) |
| Isolation test checks itself | Adding `button { color: red; }` to the shell stylesheet failed `Every_landing_rule_starts_from_a_landing_root`; removed again |
| Mutation check of the golden masters | Done by hand when the tests were written: one changed model constant failed 33 traces; one changed scoring weight failed 12. The constant: the delay before a treatment starts to move the vital signs, `SimulatedMinutes + 0.03` in `SimulationSession.ApplyIntervention`, changed to `0.04`. The weight: `UnneededOrders.Count * 2` in `SessionScorer.Score`, changed to `* 3`. Both were restored and the run is not automated |

## Independent review

After the code was written, three reviewers read it with one lens each (fidelity of the domain port to the legacy
JavaScript; security of the web and infrastructure layers; concurrency, lifetimes and API behaviour), and each
finding was then checked by a second reader told to refute it. 19 findings were reported and all 19 were
confirmed: one of medium severity, 18 low.

The medium one mattered: the legacy room has the nurse read the blood pressure again once a treatment has had time
to work, and the first version of the domain model did not. The golden masters had not caught it, because the
recorder treated that reading as an input and the test replayed it. The model now takes the reading itself, the
test no longer replays it, and the 45 traces pin it (51 such readings; changing the delay of that reading from 0.1
to 0.2 simulated minutes, as a check, failed 23 tests).

| Outcome | Findings |
|---|---|
| Fixed, with a test in `ReviewFindingsTests` or pinned by the golden masters | The nurse's reading after a treatment; measuring the temperature did not make it known on the server path; rejected doses, misread results and accepted justifications could not reach the server score; the session clock lost or gained part of a step on every call; a failed read of the case file, of a data document or of the script sources was remembered until restart; a harm with a number out of range (infinity) broke the session; a harm label of any length was stored; the switched-off session API read and validated the body before answering 404; validation errors named internal types; error responses lacked the protective headers; HEAD requests were answered 405; every address of one IPv6 network had its own rate allowance; one caller could fill the session store in about two minutes (starting a session is now limited separately) |
| Corrected in the documents | The reverse-proxy note: forwarded headers must be configured for the actual proxy; nothing about it was exercised |
| Not fixed, low severity, stated here | (1) The rate limit is charged before the same-origin check runs, and the health-check GET carries no Origin, so another website can use up a visitor's allowance for the understanding service (it cannot read answers or spend more than that allowance). (2) In the session store, refreshing a session's idle time and dropping idle sessions are not one atomic step, and the cap of 500 can be overshot by concurrent starts. (3) The application has no overall ceiling on relayed requests across all callers; the ER function has its own per-instance ceiling |

The review was of the code as it stood before these fixes; the fixes themselves were tested but not reviewed a
second time.

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
- **The sign-in pages' script** (`landing/020-auth-pages.js`: address and title, Back and Forward, focus) has no
  automated test; it was exercised in headless Chrome by scripted flows (results above), which are not part of
  `dotnet test`.
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
5. A change to the public landing or the sign-in screen (the four regions) fails its snapshot test. Compare it with the design
   (`landing-style-diff.mjs`, `landing-visual-compare.mjs`) first, then approve the new snapshots
   (`approve-landing-baseline.mjs`) in the same commit. A change outside the regions still fails the legacy
   comparison.
