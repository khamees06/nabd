# P0 completion report

**Task.** T1, "Establish the baseline and pass the first verified fix through it" ([10](../10_NEXT_IMPLEMENTATION_TASK.md)): all of P0 plus P1 item 1 (F19). Written on 14 November 2026 on the template of [09](../09_ACCEPTANCE_AND_VALIDATION_PLAN.md) §7, for owner checkpoint 1 ([07](../07_PRIORITIZED_IMPROVEMENT_ROADMAP.md) §6).

**In short.** The project now has history (a tagged, untouched baseline), 21 of 21 unit tests pass, the Vite build works, and an automated browser check runs the nine smoke flows in Chrome, Edge and WebKit on Windows. The four baseline views and the first valid frame-rate table for this laptop are recorded. The scissors and needle holder now show blades, with zero console errors. Five of the eleven T1 criteria are met. Six are only partly met: part of what is missing is evidence the team can add in a short session (among it the `npm ci` command log and the post-fix Vite preview run), and the rest needs owner decisions (the performance budget and reference machine, a waiver for the Playwright dependency sharing a commit with the smoke suite, and whether to accept the recorded Firefox and WebKit issues until they are checked outside this machine). Ten proposals wait for the owner's answers.

**Status labels used:** VERIFIED (T1 run of 14 November 2026, unless an audit run R1–R21 or build check B1–B5 is named) · TEST-VERIFIED · SOURCE-INSPECTED · DATA-DERIVED (audit analysis) · UNKNOWN · BLOCKED (could not run in this environment) · **PROPOSED** (threshold awaiting the owner, D9) · **RECOMMENDATION** · **ASSUMPTION** · **TO CONFIRM**. Criterion results: **MET** = pass; **PARTIALLY MET** = not met as it stands (09 §7: a criterion without its listed evidence is "not met"), pending the missing part or an owner waiver; **NOT MET** = fail.

- **Phase and scope (07 reference); commit range; branch.** P0 "Baseline and safety net" and P1 item 1 (F19) as in [07](../07_PRIORITIZED_IMPROVEMENT_ROADMAP.md) §4 and [10](../10_NEXT_IMPLEMENTATION_TASK.md) §1. Commit range `v1.5-baseline..006881f` (`acdab52..006881f`) on branch `t1-baseline-f19`; `main` still points at the baseline `acdab52`. No remote exists; nothing has been pushed. This report and [P0-unknowns.md](P0-unknowns.md) are not yet committed.

  | Commit | Time (+03:00) | Content |
  |---|---|---|
  | `acdab52` (tag `v1.5-baseline`) | 2026-11-14 17:05 | Untouched v1.5 tree plus `docs/improvement-plan` (106 files: 83 source files plus the plan documents and audit evidence). The source tree is byte-identical to `Nabd-Clinical-Simulator-v1.5-Forearm-Contact.zip` (SHA-256 `1d0ecd014e03f188ddfd62acc48b932e157f1d9e04f9f113aa22b24f4e35829b`), which serves as the untouched safety copy |
  | `06e2c65` | 20:03 | Playwright smoke suite: `tests/browser/SMOKE_PROTOCOL.md`, `smoke.spec.mjs`, `playwright.config.mjs`, `perf-capture.mjs`; `package.json` (+ `@playwright/test` 1.64.1 dev dependency, + `smoke` script) and `package-lock.json` (+46 lines, additions only) |
  | `a22a424` | 20:03 | P0 baseline evidence on the unmodified code (185 files under `evidence/baseline-p0/`) |
  | `7722a25` | 20:03 | The owner's decisions of 14 November recorded in the plan (9 plan documents) |
  | `006881f` | 20:15 | F19 fix (`src/staff/CrewController.js`, 2 lines), removal of the F19 known-failure markers in `smoke.spec.mjs`, post-fix evidence under `evidence/p0-post-fix/` and [evidence/11](../evidence/11-scissors-with-blades-after-f19-fix.jpg) (63 files) |

- **Decisions relied on (DN#, D#) and their recorded outcomes** ([08](../08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md) decision log):
  - **D6** APPROVED 2026-11-14, option A (git, `npm ci`, Playwright and its browser download); further downloads authorised without asking (listed under "Proposals and owner answers").
  - **D9** DECIDED 2026-11-14: the web in desktop browsers; Chrome and Safari required, Edge and Firefox expected. The reference machine and the numeric budget are still **PROPOSED**, so no M7 or M10 threshold is applied in this report.
  - **D8** DECIDED (option A): the Rapier licence notice is a P1 item, outside T1 (INV-5 recorded only).
  - **DN1** (stay on three.js r180; `three` stays 0.180.0, no upgrade), **DN4** (left/right mapping, INV-3), **DN5** (illustrative labels, INV-6), **DN6** (interface identity, INV-9).
  - **Working agreement** (owner, 2026-11-14): every proposal goes to the owner with a recommendation; he answers.
  - D1, D2, D3, D4, D5, D7 and D10 do not change T1; they shape the proposals' suggested phases.
- **Configuration.**
  - Machine: ASUS TUF Gaming F15 FX507ZC4; Intel Core i5-12500H (16 logical CPUs); 15.6 GB RAM; Windows 11 Pro 10.0.26300; on mains power, power scheme "Turbo".
  - GPU string (what the browsers use): `ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)`, driver 32.0.101.6790. The NVIDIA GeForce RTX 3050 Laptop GPU (driver 32.0.16.2114) is present but not used by the browsers.
  - Display: internal panel 1920×1080 at **144 Hz**. Viewport 1440×900, devicePixelRatio 1, `prefers-reduced-motion: no-preference`.
  - Browsers: Google Chrome 157.0.8103.51 (Playwright `channel: 'chrome'`); Microsoft Edge 157.0.4341.46 (`channel: 'msedge'`); Playwright WebKit 27.2, reported as **"WebKit on Windows"**, an approximation of Safari's engine and never "Safari" (AS15; it reports its renderer as "Apple GPU"); Playwright Firefox build 1555 **BLOCKED** (cannot launch here).
  - Tools: Node v26.13.1, npm 11.20.0, git 2.56.0.windows.4 (`core.autocrlf=false` set locally so bytes are stored exactly); `@playwright/test` 1.64.1; `three` 0.180.0; `vite` 6.4.6.

## Acceptance criteria

T1 is complete when AC-P0-1 to AC-P0-10 and AC-P1-1 hold ([09](../09_ACCEPTANCE_AND_VALIDATION_PLAN.md) §4). Result: **7 MET, 4 PARTIALLY MET, 0 NOT MET**, so T1 is not yet complete by that rule. What is missing is listed under the table.

The first fact-check gave 5 MET and 6 PARTIALLY MET. Later the same evening the lead carried out team actions T-5, T-1 and the readout part of T-2, which moved AC-P0-2 and AC-P0-4 to MET and closed item (1) of AC-P0-6. Their logs are in [p0-post-fix/](../evidence/p0-post-fix/).

| AC ID | Result (pass / fail / waived by owner) | Evidence level | Evidence links |
|---|---|---|---|
| AC-P0-1 Git baseline; `asset-manifest` test passes | **MET** (pass) | VERIFIED (git); TEST-VERIFIED | Commit `acdab52`, tag `v1.5-baseline`, 106 files (`git show --stat acdab52`). `tests/asset-manifest.test.js` passes in every `npm test` run ([npm-test-with-browser-files.txt](../evidence/baseline-p0/npm-test-with-browser-files.txt)); `assets/`, `scripts/generate-asset-manifest.mjs` and the test file are byte-identical to the baseline (`git diff --quiet v1.5-baseline`, checked for this report), so the result holds for the baseline commit. `git status` at `006881f` shows no change outside `docs/improvement-plan/`, where the only changes are the uncommitted T1 report documents (checked for this report) |
| AC-P0-2 `npm ci`; lockfile unchanged; `three` 0.180.0 | **MET** (pass) | VERIFIED | **First run:** lockfile SHA-256 `8a8b7c5428ec6b839f346b059a88b52c7385eadfe176e19de8c0e4d71216344b` before and after `npm ci` (lead's record; the same hash is recomputed from `v1.5-baseline:package-lock.json`); about 9 s; `node_modules` 54 MB. **Re-run with its full log (T-5):** [npm-ci.log](../evidence/p0-post-fix/npm-ci.log), exit 0. The lockfile hash after the run is `72fc9abb396f469657e9496cc2052e690e4f94891f864d7b97d627070f67bdef`, identical to the committed `HEAD:package-lock.json`, which already includes the Playwright entries; `git diff package-lock.json` is empty. `npm ls`: `three@0.180.0`, `vite@6.4.6`, `@playwright/test@1.64.1` |
| AC-P0-3 21 cases, 21 pass, 0 fail | **MET** (pass) | TEST-VERIFIED | Full output: [npm-test-with-browser-files.txt](../evidence/baseline-p0/npm-test-with-browser-files.txt) (21/21, both `forearm-contact` cases). After the fix: [post-fix-run.log](../evidence/p0-post-fix/post-fix-run.log) (totals 21/21). Re-run for this report at `006881f`: 21/21 |
| AC-P0-4 Vite build; built app passes S1–S9; preview not silently deleted (U17) | **MET** (pass; the WebKit S2 difference is the pre-existing one explained under AC-P0-6) | VERIFIED | **Build:** OK before (≈1.0 s) and after the fix (995 ms, [post-fix-run.log](../evidence/p0-post-fix/post-fix-run.log); full output, 961 ms, exit 0, in [vite-build.log](../evidence/p0-post-fix/vite-build.log)). **Built app before the fix:** [vite-run1.txt](../evidence/baseline-p0/smoke/logs/vite-run1.txt), [vite-run2-S1.txt](../evidence/baseline-p0/smoke/logs/vite-run2-S1.txt). **Built app after the fix (T-1):** [vite-post-fix-run.log](../evidence/p0-post-fix/vite-post-fix-run.log), Chrome, WebKit and Edge: 49 passed, 1 flaky (WebKit S5 staff handover, boot context loss, passed on retry), 1 failed (WebKit S2, the pre-existing R8 difference). S5 console errors are 0 for all four tools in all three browsers (`p0-post-fix/smoke/vite-preview-*/S5-summary.json`). **Standalone preview:** rebuilt after the post-fix build ([standalone-preview.log](../evidence/p0-post-fix/standalone-preview.log), 34.70 MiB, SHA-256 `85d2f54e…3ec638`) and opened over http in the built-in browser: ready, `window.NabdSimulation` present, scissors selected, zero console errors. U17 recorded in [08](../08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md) and here |
| AC-P0-5 Standalone preview written, S1 over http, `file://` recorded (U11) | **MET** (pass) | VERIFIED (probe run) | 34.70 MiB, SHA-256 `2a7dd0f3…d3d96840`, rebuilt at 19:44 on the pre-fix tree; S1 checks pass over http (Chrome, WebKit) and `file://` (Chrome, Edge, WebKit): [P0-unknowns.md](P0-unknowns.md) U11. The probe's raw JSON is not in the repository |
| AC-P0-6 S1–S9 written, run on both servers with Playwright; R1–R21 reproduced or differences explained; R20 a known failing check | **PARTIALLY MET** (fail until closed or waived) | VERIFIED | [SMOKE_PROTOCOL.md](../../../tests/browser/SMOKE_PROTOCOL.md), [smoke.spec.mjs](../../../tests/browser/smoke.spec.mjs), [RESULTS.md](../evidence/baseline-p0/RESULTS.md) §2–§4, run logs in [smoke/logs/](../evidence/baseline-p0/smoke/logs/), QA JSON in `smoke/<server>-<browser>-<mode>/`. R20 reproduced as a known failing check in every browser and on both servers; the needle holder now VERIFIED with the same 4 errors |
| AC-P0-7 V1–V4 baselines per §2.3; counters within R6 or each difference explained | **PARTIALLY MET** (fail until explained or waived) | VERIFIED | Reference set [visual/serve-chrome-headed/](../evidence/baseline-p0/visual/serve-chrome-headed/) (images plus camera JSON); counters in "Metrics" below |
| AC-P0-8 Performance and load per §2.4 with full hardware identification; thresholds once D9 is confirmed | **PARTIALLY MET** (capture met for this machine; budget pending) | VERIFIED | [chrome-headed.json](../evidence/baseline-p0/perf/chrome-headed.json), [chrome-headed-raf-intervals.json](../evidence/baseline-p0/perf/chrome-headed-raf-intervals.json), [webkit-on-windows-headless.json](../evidence/baseline-p0/perf/webkit-on-windows-headless.json), [perf-run.log](../evidence/baseline-p0/perf/perf-run.log), [RESULTS.md](../evidence/baseline-p0/RESULTS.md) §6 |
| AC-P0-9 Every P0 unknown has a value, an observation or a note; U21 first WebKit look; BLOCKED items with reason | **MET** (pass) | VERIFIED (probe run); raw records outside the repository | [P0-unknowns.md](P0-unknowns.md): U1–U3, U6–U12, U14–U18 all answered (SETTLED or PARTIALLY SETTLED), U21 first look done, Firefox BLOCKED with its Windows error, U23 done as an extra |
| AC-P0-10 Only the F19 fix differs under `src/` etc.; package files differ only by the approved dependency, in its own commit | **PARTIALLY MET** (fail until the owner waives the "own commit" clause) | VERIFIED | `git diff --stat v1.5-baseline..006881f`, outside `docs/`: `src/staff/CrewController.js` 2 +/2 −; `package.json` 3 +/1 −; `package-lock.json` +46 (Playwright packages only); four new files under `tests/browser/`. Nothing under `assets/`, `vendor/`, `scripts/`, `index.html` or `vite.config.mjs` differs (`git diff --quiet`, checked for this report). Deviation: the dependency shares commit `06e2c65` with the suite that needs it, instead of a commit of its own |
| **AC-P1-1** F19: M11 = 0 for all four tools; scissors and needle holder show blades | **MET** (pass) | VERIFIED | Before/after console counts per tool ([S5-summary.json](../evidence/baseline-p0/smoke/serve-chrome-headed/S5-summary.json) → [Chrome](../evidence/p0-post-fix/smoke/serve-chrome-headless/S5-summary.json), [Edge](../evidence/p0-post-fix/smoke/serve-edge-headless/S5-summary.json), [WebKit](../evidence/p0-post-fix/smoke/serve-webkit-headless/S5-summary.json)); image pairs in the next section; S5 regression checks now normal (markers removed in `006881f`) |

**What is missing (strict reading).**
- **AC-P0-2.** CLOSED by T-5: [npm-ci.log](../evidence/p0-post-fix/npm-ci.log).
- **AC-P0-4.** CLOSED by T-1:
  - the post-fix built app was smoke-tested in Chrome, WebKit and Edge;
  - the build output is kept;
  - the standalone preview was regenerated after the build and re-checked over http.

  The Vite build still empties `dist/` by design (U17), so the standalone preview must be regenerated after every `npm run build`. **RECOMMENDATION:** add that order to the build instructions in P2.
- **AC-P0-6.** (1) CLOSED for the readouts. R5 was re-measured at 1440×900 in the built-in browser at `006881f`: 39 visible buttons, 76 in the DOM, 8 visible form controls, 0 textareas, identical to the audit. R16: 0 events and stage `idle` after load. Both are in [R5-R16-recheck.json](../evidence/p0-post-fix/R5-R16-recheck.json). Adding them to the smoke suite as permanent checks stays in T-2. A grip made before starting a session was not repeated. (2) R4, R10 and R21 were not compared in the results sheet; they are visible in the kept screenshots (V1, [S2-grip-lift.jpg](../evidence/baseline-p0/smoke/serve-chrome-headed/S2-grip-lift.jpg) shows the stretched sleeve, and the tray images show the long forearm), checked by eye for this report, not by a §2.5 reviewer. (3) In WebKit, the "PASS" of the flows after a canvas resize rests on QA readouts and counters; the screenshots are blank (U21). (4) The grip stall after «اقترب» is a new behaviour with no explained cause. (5) Firefox BLOCKED. Items (1)–(2) are team work (T-2); (3)–(5) are recorded known issues the owner can accept (proposals PR-2, PR-6, PR-9).
- **AC-P0-7.** (1) V3 has 1,528 draw calls against 1,520 in R6 (+8, +0.5 %), triangles equal; the difference is recorded but its cause is UNKNOWN. (2) §2.3 asks for the D9 reference machine, which is not yet confirmed. (3) The WebKit comparison images V2–V4 are blank (U21), so they are not visual baselines.
- **AC-P0-8.** (1) The D9 reference machine and budget are not confirmed, so no pass or fail can be stated. (2) No browser profiler trace is kept (the rAF interval dump stands in; the U7 CPU profile exists only with the probe files). (3) The §2.4 protocol has no hover segment, the worst everyday case found (PR-10). (4) Only Chrome was captured to protocol; WebKit had one headless run, Edge none.
- **AC-P0-10.** The substance holds (nothing outside the F19 fix differs under the protected paths; `package.json` gained only the dependency and the `smoke` script that 10 §6 lists with it). The criterion also asks for the dependency "in its own commit", and it shares `06e2c65` with the smoke suite (deviation 5). Splitting the commit now would rewrite `06e2c65`, `a22a424`, `7722a25` and `006881f`, which every T1 document cites, so the recommendation is an owner waiver (decision 1).

## Carried from P1: AC-P1-1

**The fix** (`006881f`, the only source change in T1; [07](../07_PRIORITIZED_IMPROVEMENT_ROADMAP.md) P1 item 1):

```diff
-  ringInstrument(scissors, instruments.scissors.length, false);
-  ringInstrument(needleHolder, instruments.needleHolder.length, true);
+  ringInstrument(scissors, instruments.scissors.config.length, false);
+  ringInstrument(needleHolder, instruments.needleHolder.config.length, true);
```

The lengths now come from `src/instruments/InstrumentConfig.js` (0.10 m and 0.113 m, TEST-VERIFIED as config values by `tests/instrument-config.test.js`).

**Console per tool** (fresh load, `#training-tool` set, tray view «الصينية» opened, 2.5 s wait; `computeBoundingSphere(): Computed radius is NaN` errors):

| Tool | Before the fix: every browser and both servers (7 configurations) | After the fix, `serve.mjs`: Chrome · Edge · WebKit on Windows |
|---|---|---|
| grasper | 0 | 0 · 0 · 0 |
| scope | 0 | 0 · 0 · 0 |
| scissors | **4** (R20 reproduced) | 0 · 0 · 0 |
| needleHolder | **4** (now VERIFIED; was SOURCE-INSPECTED) | 0 · 0 · 0 |

**How the regression check flipped.** Before the fix, both tools carried Playwright's known-failure marker (`test.fail`, "F19 — fixed in T1 step 10"). With the fix in place and the markers still set, Playwright reported "Expected to fail, but passed" for both tools in Chrome and WebKit (VERIFIED, lead's run; that console output was not kept). The markers were then removed in `006881f`, so both tools are now ordinary S5 checks.

**Blades visible** (whether they *look* right is a §2.5 review item, not a T1 claim):
- Scissors: [evidence/10](../evidence/10-scissors-without-blades.jpg) (audit, rings only) → [evidence/11](../evidence/11-scissors-with-blades-after-f19-fix.jpg) (built-in browser, blades, zero console errors). Same-viewport pair from the suite: [before](../evidence/baseline-p0/smoke/serve-chrome-headed/S5-scissors-tray.jpg) → [after](../evidence/p0-post-fix/smoke/serve-chrome-headless/S5-scissors-tray.jpg).
- Needle holder: [before](../evidence/baseline-p0/smoke/serve-chrome-headed/S5-needleHolder-tray.jpg) → [after](../evidence/p0-post-fix/smoke/serve-chrome-headless/S5-needleHolder-tray.jpg).
- WebKit before-images (rings only): [scissors](../evidence/baseline-p0/smoke/serve-webkit-headless/S5-scissors-tray.jpg), [needle holder](../evidence/baseline-p0/smoke/serve-webkit-headless/S5-needleHolder-tray.jpg). No WebKit after-image was kept.

**Everything else unchanged.** After the fix, S1–S4 and S6–S9 give the same results as before in Chrome, Edge and WebKit; the V1–V4 counters and cameras are identical to the baseline in all three; the S4 golden trace (20 events) is identical to the baseline trace in all three (compared for this report). The post-fix run on the Vite preview was added later the same evening (T-1, see AC-P0-4); it gives the same per-flow results as the pre-fix Vite run, except that S5 scissors and needle holder now pass.

## Tests

- **`npm test` totals.**

  | Run | Cases | Pass | Fail | Evidence |
  |---|---|---|---|---|
  | Audit B1 (no `node_modules`) | 20 results | 19 | 1 (`forearm-contact` import of `three`, F03) | [02](../02_CURRENT_STATE_AUDIT.md) |
  | T1 after `npm ci` | 21 | 21 | 0 | lead's record |
  | T1 with `tests/browser/*` present (17:56) | 21 | 21 | 0 | [npm-test-with-browser-files.txt](../evidence/baseline-p0/npm-test-with-browser-files.txt) (full output) |
  | After the F19 fix | 21 | 21 | 0 | [post-fix-run.log](../evidence/p0-post-fix/post-fix-run.log) (totals only) |
  | Re-run for this report at `006881f` | 21 | 21 | 0 | not saved (duration 289 ms) |

  Both `tests/forearm-contact.test.js` cases now pass (F03 resolved; TEST-VERIFIED). `node --test` does not collect `*.spec.mjs`, `*.config.mjs` or `perf-capture.mjs` (VERIFIED by the counts above, which settles the 09 §2.1 ASSUMPTION for Node v26.13.1).
- **New tests.** No `node --test` case was added (T1 adds none by design). New browser suite: [smoke.spec.mjs](../../../tests/browser/smoke.spec.mjs) with 17 tests per browser project (S1, S2, S3, S4, five S5 tests, S6, S7, S8, S9, V1–V4), [playwright.config.mjs](../../../tests/browser/playwright.config.mjs) (projects chrome, webkit, edge, firefox; `testDir` restricted to `tests/browser/`), [SMOKE_PROTOCOL.md](../../../tests/browser/SMOKE_PROTOCOL.md), and the capture script [perf-capture.mjs](../../../tests/browser/perf-capture.mjs). `npm run smoke` runs the suite.
- **Pre-flight (T1 step 1).** Node v26.13.1, npm 11.20.0, git 2.56.0.windows.4. SHA-256: `package-lock.json` `8a8b7c5428ec6b839f346b059a88b52c7385eadfe176e19de8c0e4d71216344b`; `vendor/rapier/rapier.mjs` `02dc6a4e2fffc013bab08fbb44fa68f501d8303615e9afe4c7d89ad4eedda0d0` (unchanged at `006881f`, recomputed for this report); source zip `1d0ecd014e03f188ddfd62acc48b932e157f1d9e04f9f113aa22b24f4e35829b`. `node_modules/` and `dist/` were absent before T1.
- **Vite build.** Exit 0 before and after the fix (F04 resolved).
  - Before the fix (≈1.0 s): one bundle `assets/index-B9Tyn-f5.js` 763.67 kB (gzip 213.51 kB) with Vite's ">500 kB chunk" warning; `index.html` 36.81 kB; CSS 210.98 kB; `assets/` and `vendor/rapier/` copied.
  - After the fix (995 ms): `dist/assets/index-Bqn62syv.js` 763,680 B (new content hash, since `CrewController.js` changed), `dist/assets/index-BghT_WJ0.css` 210,983 B, `dist/index.html` 36,806 B (listing read from `dist/` for this report).
  - npm 11 printed an `allowScripts` warning that esbuild's postinstall script was not run; the build works anyway.
- **Standalone preview.** `npm run preview:standalone` writes `dist/Nabd-Clinical-Simulator-v1.5-Preview.html`, 34.70 MiB (B4 matched). The Vite build empties `dist/` and so deletes it (U17, settled). It was rebuilt at 19:44 on the pre-fix tree and works over `file://` and http in Chrome, Edge and WebKit (U11). It is **not** in `dist/` now: the post-fix build at 20:05 deleted it again.

## Smoke protocol

**Runs** (logs and Playwright JSON reports in [smoke/logs/](../evidence/baseline-p0/smoke/logs/); post-fix in [post-fix-run.log](../evidence/p0-post-fix/post-fix-run.log)). Before the fix, "passed" includes the six scissors and needle-holder checks marked as known failures. "Flaky" means failed once and passed on the single WebKit retry.

| Run | Code | Server | Browsers | Result |
|---|---|---|---|---|
| `serve-run1` | baseline | `serve.mjs` :4301 | chrome, webkit, edge (headless), firefox | 47 passed, 3 flaky, 1 failed, 17 skipped (12.2 min) |
| `serve-run2` | baseline | `serve.mjs` :4301 | same | 48 passed, 2 flaky, 1 failed, 17 skipped (10.6 min) |
| `serve-chrome-headed` | baseline | `serve.mjs` :4301 | chrome, visible window | 17 passed (2.7 min) |
| `vite-run1` | baseline | `vite preview` :4302 | chrome, webkit, edge | 46 passed, 4 flaky, 1 failed (12.4 min) |
| `vite-run2-S1` | baseline | `vite preview` :4302 | chrome, webkit, edge; S1 only | 3 passed |
| post-fix | `006881f` | `serve.mjs` | chrome, webkit, edge (headless) | **48 passed, 2 flaky, 1 failed** (10.2 min) |

**S1–S9 before and after the fix** (PASS = all checks passed with M11 = 0; KF = known failing check F19; C · E · W = Chrome · Edge · WebKit on Windows):

| Flow | Before, `serve.mjs` (C · E · W) | Before, Vite build (C · E · W) | After, `serve.mjs` (C · E · W) | Firefox |
|---|---|---|---|---|
| S1 Boot and assets | PASS · PASS · PASS | PASS · PASS · PASS | PASS · PASS · PASS | BLOCKED |
| S2 Forearm drill | PASS · PASS · **FAIL** (R8 check) | PASS · PASS · **FAIL** (R8 check) | PASS · PASS · **FAIL** (R8 check) | BLOCKED |
| S3 Support and release | PASS · PASS · PASS | PASS · PASS · PASS | PASS · PASS · PASS | BLOCKED |
| S4 Training session, 5 steps | PASS · PASS · PASS | PASS · PASS · PASS | PASS · PASS · PASS | BLOCKED |
| S5 grasper | PASS · PASS · PASS | PASS · PASS · PASS | PASS · PASS · PASS | BLOCKED |
| S5 scope | PASS · PASS · PASS (retry in run 1) | PASS · PASS · PASS (retry) | PASS · PASS · PASS (retry) | BLOCKED |
| S5 scissors | KF 4 NaN · KF 4 NaN · KF 4 NaN | KF · KF · KF (4 NaN each) | **PASS · PASS · PASS** (0 errors) | BLOCKED |
| S5 needle holder | KF 4 NaN · KF 4 NaN · KF 4 NaN | KF · KF · KF (4 NaN each) | **PASS · PASS · PASS** (0 errors) | BLOCKED |
| S5 staff handover | PASS · PASS · PASS | PASS · PASS · PASS (retry) | PASS · PASS · PASS (retry) | BLOCKED |
| S6 Room and presets | PASS · PASS · PASS | PASS · PASS · PASS | PASS · PASS · PASS | BLOCKED |
| S7 Anatomy | PASS · PASS · PASS | PASS · PASS · PASS | PASS · PASS · PASS | BLOCKED |
| S8 Hands and locomotion | PASS · PASS · PASS (retry in run 1) | PASS · PASS · PASS (retry) | PASS · PASS · PASS (2 `WebGL: context lost.` messages logged, passed first time) | BLOCKED |
| S9 Port and scope | PASS · PASS · PASS | PASS · PASS · PASS | PASS · PASS · PASS | BLOCKED |
| V1–V4 captures | PASS · PASS · PASS (retries; WebKit V2–V4 images blank, U21) | PASS · PASS · PASS (V2 retry) | PASS · PASS · PASS (counters equal to baseline) | BLOCKED |

The headed Chrome baseline run passed all 17 (two as KF). Post-fix QA JSON: [serve-chrome-headless](../evidence/p0-post-fix/smoke/serve-chrome-headless/), [serve-edge-headless](../evidence/p0-post-fix/smoke/serve-edge-headless/), [serve-webkit-headless](../evidence/p0-post-fix/smoke/serve-webkit-headless/).

**M11 per flow.** Before the fix: 0 in every flow except S5 scissors (4) and S5 needle holder (4), in every browser and on both servers. After the fix: **0 in every flow** in Chrome, Edge and WebKit (served tree). Not counted in M11: WebKit's `WebGL: context lost.` messages logged while the page boots, because S2–S9 count M11 from a mark set after boot (S1 counts from the start); the post-fix S8 logged 2 such messages and kept M11 = 0. WebKit logs this message at error level (the performance capture records it as a console error, [webkit-on-windows-headless.json](../evidence/baseline-p0/perf/webkit-on-windows-headless.json)). Also not counted: boot attempts that failed before their console could be saved (WebKit; retried).

**Network (INV-10).** Every S1 run, before and after: 0 requests outside the app origin, 0 failed. Served tree: 21 `/src/**/*.js` modules, 9 GLBs and `vendor/rapier/rapier.mjs`, all 200 (R3 reproduced). Vite build: one bundle, the same 9 GLBs and Rapier, all 200.

**Differences from the audit (R1–R21)**, in full in [RESULTS.md](../evidence/baseline-p0/RESULTS.md) §4:
- R8: in Chrome and Edge the first wrist click before «اقترب» ends "out of reach" through the 3.2 s hold timeout (after 3.4–3.6 s), not as an immediate refusal. In WebKit the same click grips (S2 fails its R8 check, before and after the fix).
- New: after «اقترب» a wrist click sometimes stalls the glove about 13 cm short of the wrist (Chromium browsers, intermittent; seen again in the post-fix Chrome S2, first attempt). The suite retries at small pixel offsets and records every attempt (`gripAttempts`).
- R11 reproduced: `supportGap` 0.0003–0.0010 m before the fix and 0.0007–0.0013 m after (all < 0.020 m); the forearm stays raised (+0.109 m) after release.
- R12 correction confirmed (room view ends the drill); R13 reproduced (11 presets); R14 reproduced, and appendix selection and isolation are now VERIFIED.
- R15 extended: all five steps of S4 complete; golden trace of 20 events, identical in Chrome, Edge, WebKit, on the Vite build, and after the fix.
- R17 extended: the staff source offers the grasper (`crew.mode` `offered`); the hand-to-hand pickup is still UNKNOWN.
- R18 extended and R19 closed: Q/E and the hand buttons toggle; hold D 2 s moves the camera 1.20–1.27 m (R19 was a hidden-pane artefact).
- S9, never run in the audit, now VERIFIED: aligned at the port, 53 % inserted, roll +15°, `scope.live` on 2 screens.
- New: `#anatomy-toggle` covers `#camera-overview` «الجسم كامل» at 1440×900 (also visible, unreported, in the audit image [evidence/06](../evidence/06-room-overview.jpg)).
- R5 and R16 re-checked after the fix as readouts ([R5-R16-recheck.json](../evidence/p0-post-fix/R5-R16-recheck.json)); they are not yet automated in the suite (T-2).

## Invariants

| ID | Result | Evidence |
|---|---|---|
| INV-1 Console errors | **Pass** in Chrome and Edge (0 in every flow after the fix; the R20 exception is lifted by AC-P1-1). **Pass with caveat** in WebKit on Windows (M11 = 0 on every saved attempt; boot context loss in some attempts, retried; the error-level `WebGL: context lost.` messages logged during boot, 2 in the post-fix S8, fall outside the M11 window, see "M11 per flow"). Firefox BLOCKED. Built app not re-run after the fix | Smoke JSON (M11) above |
| INV-2 Asset integrity | **Pass** | `asset-manifest` test passes; `vendor/rapier/rapier.mjs` SHA-256 `02dc6a4e…0d0` at the baseline and at `006881f`; `assets/` and `vendor/` identical to the baseline |
| INV-3 L/R mapping | **Pass (smoke readout only)** | S8: at rest the left glove is at camera-space x −0.175 and the right at +0.175, in every browser before and after the fix; the hand buttons and Q/E toggle both ways. Asset identity, determinant and handedness tests come in P3 |
| INV-4 Forearm drill | **Pass** in Chrome and Edge (S2, S3; both `forearm-contact` cases). WebKit: S3 passes, S2 fails its R8 sub-check (pre-existing). Intermittent grip stall noted | S2/S3 JSON; test output |
| INV-5 Licence notices | **Recorded only** (not gating in T1) | `index.html:311-315` lists three.js, the fonts and the patient asset; "Rapier" appears nowhere in `index.html` (checked for this report). The notice is P1 item 6 (F30, D8 option A) |
| INV-6 Illustrative labels | **Pass** | "DEMO SIGNALS" shown in the vitals dialog of S4 step 1 ([S4-step1-monitor-dialog.jpg](../evidence/baseline-p0/smoke/serve-chrome-headed/S4-step1-monitor-dialog.jpg)); no scenario content exists yet |
| INV-7 DN2 import rule | **Not applicable yet** | No scenario, dialogue or language module exists; the static check is written with the first one |
| INV-8 Privacy | **Pass** | Both `tests/target-filter.test.js` cases pass |
| INV-9 Visual identity | **Pass** | No change to `index.html` or styles; V1–V4 counters and cameras identical before and after the fix in Chrome, Edge and WebKit; tray image pairs show the same interface. Post-fix V1–V4 images were not kept (JSON only) |
| INV-10 Network | **Pass** | 0 foreign-origin requests in every S1 run, before and after; the standalone preview requests nothing beyond the file (U11) |
| INV-11 Natural movement | **Recorded only** (applies from P3) | Baseline observations: a single-frame wrist step of 125.7° after an abdomen pinch click (U6); the supervisor passes through the patient, the bed and the trolley (U16) and jumps to the other side when the trainee crosses x < 0 (U9); the hands lag and jitter above ≈66 Hz (U18); floor-standing equipment floats 2.7–8.75 cm above the floor, and the supervisor 2.6 cm (U15) |

## Proposals and owner answers

Under the working agreement, each finding below is put to the owner with a recommendation; he answers. Nothing here changes scope until he does. Effort: S small, M medium, L large.

| ID | Proposal | Suggested phase | Effort | Owner decision needed | Owner answer |
|---|---|---|---|---|---|
| PR-1 | Throttle or defer the hover pick (mouse-hover raycast) | P1, new item | S | Add to P1? | Awaiting |
| PR-2 | Investigate the WebKit blank view after a resize; check early on a real Mac | P1 investigation; Mac check now | S (M if a fix is needed) | Approve; arrange a Mac or a remote real-device service | Awaiting |
| PR-3 | Handle WebGL context loss and restore | P2 | M | Add to P2? | Awaiting |
| PR-4 | Update the hands every rendered frame (high-refresh jitter) | P3 | S–M | Confirm it is in P3 scope | Awaiting |
| PR-5 | Spine lean and stepping for the supervisor instead of tilting through the patient | P8 (with P4 stations) | M (already planned) | Confirm P8 scope | Awaiting |
| PR-6 | Investigate the grip stall after «اقترب» | P1 investigation | S (M if contact code changes) | Add to P1? | Awaiting |
| PR-7 | Separate `#anatomy-toggle` from `#camera-overview` | P2 (control split) | S | Add to P2? | Awaiting |
| PR-8 | Decide which appendix the scope should show at S6.3 | P10 (decision now; sweep in P7) | S–M | Choose option A, B or C | Awaiting |
| PR-9 | Check Firefox outside this environment | Before P11 (now) | S | Choose the route | Awaiting |
| PR-10 | Add a hover segment to the 09 §2.4 performance protocol | P1 (with PR-1) | S | Approve the protocol change | Awaiting |

**PR-1 — Hover raycast (U7).**
- *Finding.* Every mouse move over the view, with no button pressed, runs a CPU raycast against the 105,822-triangle patient skin that costs 40–43 ms. About 91 % of the busy CPU time is inside `intersectObjects`. The frame loop falls from 141.6 to 41.7 FPS while hovering (frame interval p95 48.6 ms). No ray is rejected early, because the camera sits inside the skin's 0.928 m bounding sphere. Evidence: [P0-unknowns.md](P0-unknowns.md) U1, U7 (probe run).
- *Impact on the trainee.* The simulator stutters whenever the trainee simply moves the mouse, the most common input. With a real mouse the frame rate may cap near 20–24 FPS (ASSUMPTION, U7).
- *Recommendation.* A small P1 item, in its own commit: run the hover pick at most once per frame and only after the pointer has settled (for example every 50–100 ms), or defer it to idle time. Clicks, grips and touch-follow keep their current picking. Acceptance: the hover frame loop within 10 % of the idle loop (PROPOSED), all smoke flows unchanged. Faster whole-body contact picking stays in P5.
- *Phase, effort.* P1; S.
- *Owner decision.* Add PR-1 to P1.

**PR-2 — WebKit shows a blank 3D view after any canvas resize (U21).**
- *Finding.* In WebKit 27.2 on Windows, after any canvas resize the window shows the page background instead of the 3D view, while the drawing buffer holds the correct image (its pixels match Chrome's). A pure viewport change from 1440×900 to 1440×860 reproduces it. The committed WebKit reference images V2–V4 are blank (grey-level spread 1.1–8.8 against 31.8–65.7 in Chrome); V1 and the tray views render. Evidence: [P0-unknowns.md](P0-unknowns.md) U3, U21; [visual/serve-webkit-headless/](../evidence/baseline-p0/visual/serve-webkit-headless/).
- *Impact on the trainee.* If Safari on macOS behaves the same, a Safari user sees an empty view after resizing the window or changing views. Safari is a required browser (D9). Whether Safari is affected is UNKNOWN.
- *Recommendation.* A P1 investigation item: reproduce with a minimal three.js page and try candidate mitigations on a branch. Then, early rather than at P11, run S1 and V1–V4 on a real Mac (the owner's, a borrowed one, or a remote real-device service).
- *Phase, effort.* P1 investigation (S); a fix, if needed, M. Mac check now.
- *Owner decision.* Approve the investigation, and say which Mac access is possible (a remote service may cost money).

**PR-3 — WebGL context loss at boot, with no recovery path.**
- *Finding.* WebKit on Windows sometimes loses the WebGL context while booting: 9 of about 60 suite page loads, 2 of 10 dedicated boots and 2 of 6 probe cold loads. A load then never becomes ready, or becomes ready only after 17.7–18.6 s. The post-fix S8 logged two `WebGL: context lost.` messages and still passed. The app has no `webglcontextlost` or `webglcontextrestored` handling. Evidence: [RESULTS.md](../evidence/baseline-p0/RESULTS.md) §7; [P0-unknowns.md](P0-unknowns.md) U8; [S8 post-fix](../evidence/p0-post-fix/smoke/serve-webkit-headless/S8-hands-locomotion.json).
- *Impact on the trainee.* The page can hang on the loading screen or freeze with no message; reloading is the only way out.
- *Recommendation.* In P2: on context loss, stop the frame loop and show a notice; on restore, rebuild the renderer resources or reload with a notice. Keep the WebKit retry in the suite until then, and include the check in the Mac run of PR-2. AC-P11-4 later tests it.
- *Phase, effort.* P2; M.
- *Owner decision.* Add PR-3 to P2.

**PR-4 — Hands lag and jitter above ≈66 Hz (U18).**
- *Finding.* The hands are updated at most every 15 ms (`NabdRuntime.js:5984`). On this 144 Hz panel, 45 % of the frames in which the camera moves show the hands not yet updated; the glove's screen position jumps by up to 8.5 px (p95) and 9.7 px (max). At ≈48 Hz the jump is 0.4 px (p95), and with reduced motion 0 px. Evidence: [P0-unknowns.md](P0-unknowns.md) U18.
- *Impact on the trainee.* On common 120–165 Hz displays the hands visibly stutter while walking or looking, against brief §11 item 8 (stable, natural hands).
- *Recommendation.* In P3, where the hand update is reworked anyway: update the hands every rendered frame with frame-rate-independent easing. Acceptance (PROPOSED): no stale-hand frames and jump p95 ≤ 1 px at 144 Hz. Not before P3, because P2 must keep the frame order unchanged.
- *Phase, effort.* P3; S–M.
- *Owner decision.* Confirm it belongs in P3.

**PR-5 — The supervisor passes through the patient, the bed and the trolley (U16).**
- *Finding.* During the support tilt, 2,126–2,593 of 38,083 sampled supervisor vertices lie inside the patient's skin (up to about 0.22 m deep) and about 2,300 inside table parts. At the workstation stand he overlaps the back-table trolley and the Mayo tray (387 points); at rest his hands overlap the tray (52). These are geometric upper bounds; visual confirmation is a §2.5 item. He also jumps to the other side when the trainee crosses x < 0 (U9). Evidence: [P0-unknowns.md](P0-unknowns.md) U9, U16.
- *Impact on the trainee.* The supervising doctor visibly sinks into the patient and the bed when he supports the arm, which breaks the realism the owner asked for (D5, INV-11).
- *Recommendation.* Confirm that P8 replaces the whole-body tilt with a spine lean and moves the supervisor by stepping (AC-P8-2 to AC-P8-4), with station data that keeps staff clear of trolleys (AC-P4-2). Use the U16 counts as the P8 regression measure.
- *Phase, effort.* P8 with P4 station data; M (already planned).
- *Owner decision.* Confirm the P8 scope.

**PR-6 — The wrist grip after «اقترب» sometimes stalls (Chromium).**
- *Finding.* After «اقترب», a wrist click sometimes leaves the glove about 13 cm short of the wrist until the 3.2 s timeout reports "out of reach". In debugging, 2 of 4 and 1 of 6 first clicks stalled in Chrome headless; once, three clicks at the same pixel all failed. It needed a second attempt in several recorded runs, including the post-fix Chrome S2. Cause UNKNOWN (hypothesis, SOURCE-INSPECTED only: the forearm-collision `stops` path in `ForearmContact`). Evidence: [RESULTS.md](../evidence/baseline-p0/RESULTS.md) §4, §7; `gripAttempts` in the S2/S3 JSON.
- *Impact on the trainee.* In the headline drill of v1.5, the trainee clicks the wrist, nothing happens, and then the app says "out of reach". It looks like a bug.
- *Recommendation.* A P1 investigation item: log the forearm collision state each frame during a stalled reach, reproduce it reliably, then fix it in its own commit with a regression check (the suite should then need one grip attempt).
- *Phase, effort.* P1; S for the investigation, M if the contact code must change.
- *Owner decision.* Add PR-6 to P1.

**PR-7 — `#anatomy-toggle` covers `#camera-overview` at 1440×900.**
- *Finding.* In room view a click on the preset «الجسم كامل» hits the anatomy button instead. Evidence: [RESULTS.md](../evidence/baseline-p0/RESULTS.md) §4 (S6); also visible in [evidence/06](../evidence/06-room-overview.jpg).
- *Impact on the trainee.* Choosing "full body" opens the internal anatomy instead, and entering anatomy silently ends any drill (F31).
- *Recommendation.* Fix the placement in the P2 trainee/developer control split. Acceptance: at 1440×900 and at the narrowest supported desktop width, the element under the centre of every preset button is that button.
- *Phase, effort.* P2; S.
- *Owner decision.* Add PR-7 to P2.

**PR-8 — The scope sees the appendix training proxy, not the anatomical appendix (U12).**
- *Finding.* At the S9 scope pose (53 % inserted, no pitch, yaw or roll) the "Appendix training proxy" is in view, but the BodyParts3D `appendix` and `mesoappendix` are outside the image, and stay outside after 30 roll steps. Pitch and yaw were not swept. Evidence: [P0-unknowns.md](P0-unknowns.md) U12.
- *Impact on the trainee.* At the identification step (case stage S6.3, "Identify the appendix", [11](../11_FULL_SESSION_SCENARIO.md)) the trainee would find the illustrative proxy, not the anatomical structure, and the two may disagree in position.
- *Recommendation.* The owner chooses what the trainee should identify at S6.3: (A) the proxy, labelled illustrative; (B) the BodyParts3D appendix, placed in the scope's field; or (C) both, aligned. **RECOMMENDATION: C**, with the placement reviewed under CR-14 and CR-41 (CRC-6, D7), and a pitch and yaw sweep in P7. The anatomical depiction is CLINICAL REVIEW REQUIRED.
- *Phase, effort.* Decision now; sweep in P7 (S); alignment in P10 (M).
- *Owner decision.* A, B or C.

**PR-9 — Firefox could not be tested here.**
- *Finding.* Playwright's Firefox (build 1555) does not launch in this environment (`spawn UNKNOWN`; Windows reports "Dependent Assembly mozglue … could not be found"); Playwright's own full Chromium fails the same way. **ASSUMPTION:** the agent sandbox interferes with how Windows loads these programs. No release Firefox is installed. Evidence: [firefox-launch.json](../evidence/baseline-p0/smoke/serve-firefox-headless/firefox-launch.json); [P0-unknowns.md](P0-unknowns.md) U3.
- *Impact on the trainee.* Firefox is an expected browser (D9); a Firefox user could hit a failure nobody has seen.
- *Recommendation.* Either the owner opens the app in his own Firefox (installed or newly installed) and runs S1–S4 by hand from [SMOKE_PROTOCOL.md](../../../tests/browser/SMOKE_PROTOCOL.md), with step-by-step guidance from the team, or the team installs release Firefox on this machine and runs `npm run smoke` from a normal terminal outside the agent sandbox. **RECOMMENDATION:** the second, so the check is repeatable; the first if he prefers not to install software.
- *Phase, effort.* Now, recorded in the P1 report; S.
- *Owner decision.* Choose the route.

**PR-10 — Add a hover segment to the performance protocol.**
- *Finding.* None of the §2.4 active segments includes plain mouse hover, yet hover is the worst everyday case found (41.7 FPS, PR-1). The performance table therefore misses it. Evidence: [P0-unknowns.md](P0-unknowns.md) U1.
- *Impact on the trainee.* None directly; without the segment, the budget could pass while the app stutters in normal use.
- *Recommendation.* Add a third segment to [09](../09_ACCEPTANCE_AND_VALIDATION_PLAN.md) §2.4 and to `perf-capture.mjs`: 30 s of continuous pointer movement without buttons, over the patient and over the room. Measure it before and after PR-1.
- *Phase, effort.* P1, with PR-1; S.
- *Owner decision.* Approve the protocol change.

**Downloads under the D6 standing authorisation.**

| What | Version | Source | Size |
|---|---|---|---|
| npm packages from the lockfile (`npm ci`) | `three` 0.180.0, `vite` 6.4.6 and their locked dependencies | npm registry (the lockfile's `resolved` URLs) | `node_modules` 54 MB |
| `@playwright/test`, `playwright`, `playwright-core` | 1.64.1 (Apache-2.0); 1.65.1, one day old, was avoided | npm registry (`registry.npmjs.org`) | not recorded separately |
| Playwright browsers | Chromium (full build 156.0.8078.4, per the Windows error, and the headless shell), Firefox build 1555, WebKit 27.2 | Playwright's browser download (`npx playwright install`) | about 1.3 GB in `%LOCALAPPDATA%\ms-playwright` |
| Google Chrome 157.0.8103.51, Microsoft Edge 157.0.4341.46 | as listed | the machine's installed browsers, driven through Playwright channels | whether either was installed or updated during T1 is **TO CONFIRM** by the lead |

## Metrics

| Metric | Previous phase (audit, 13 Nov) | This phase (T1, 14 Nov) | PROPOSED/approved threshold |
|---|---|---|---|
| M7 frame time, active segment (median / p95) | UNKNOWN (F33; hidden pane) | Chrome headed: V1 7.0 / 14.2 ms; V2 13.8 / 20.8; V3 13.9 / 27.8; V4 7.0 / 14.0 (table below) | PROPOSED median ≤ 16.7 ms, p95 ≤ 33.3 ms on the D9 minimum machine; **not applied** (D9 open) |
| M8 draw calls (static view) | V1 1,167–1,206; V2 479–503; V3 1,520; V4 542 (R6) | V1 1,206; V2 479; V3 **1,528**; V4 542 (headed) / 541 (headless); identical after the fix | PROPOSED: unplanned rise > 10 % triggers review; caps after D9 |
| M9 triangles (static view) | V1 378,534–387,848; V2 299,400–303,548; V3 462,240; V4 464,067 (R6) | V1 387,848; V2 299,400; V3 462,240; V4 464,067 (headed) / 464,003 (headless); identical after the fix | As M8 |
| M10 load to ready | UNKNOWN (U8) | Chrome cold 1,621–2,476 ms, warm 1,209–1,349 ms; WebKit cold 2,729 ms, warm 2,522 ms, with context-loss outliers (17.7 s, or never) | PROPOSED ≤ 10 s from a local server; **not applied** |
| M11 console errors | 0 in default flows (R2); 4 after selecting scissors (R20) | Before the fix: 0 except scissors 4 and needle holder 4; after: **0 in every flow** (Chrome, Edge, WebKit) | 0 |
| M12 event completeness | Nothing recorded before a session (R16) | S4 golden trace of 20 events, identical across browsers, servers and the fix; completeness against an expected list not computed (no list until P6) | 100 % and 0 `RangeError` (from P6) |
| M5 L/R identity | SOURCE-INSPECTED (F08) | Lateral ordering at rest: left −0.175, right +0.175 (smoke readout) | 100 % (tests from P3) |
| M6 hand swaps and flips | UNKNOWN (F09) | A single-frame wrist step of 125.7° after an abdomen pinch click and 92° after a press (U6); hand swaps not counted | 0 and 0 (from P3) |
| M1 penetration | Drill proxies only (F16, DATA-DERIVED) | `forearm.overlap` 0 at the lift in every browser; otherwise not measured | From P5 |
| M2, M3, M4 | UNKNOWN or drill only | Not measured (P5). Related, not M4: screen-space glove jump p95 8.5 px at 144 Hz (U18) | From P5 |
| Overlay FPS (`?debug=1`) | Invalid (hidden pane) | Equals the rAF rate, not the render rate: 132–144 at idle while 12 frames per second are rendered (VERIFIED, as 09 §2.4 predicted) | Label only |
| Visible controls (supporting, P2) | 39 buttons and 8 form controls (R5) | Re-measured at `006881f`: 39 visible buttons (76 in the DOM), 8 visible form controls, 0 textareas ([R5-R16-recheck.json](../evidence/p0-post-fix/R5-R16-recheck.json)) | Baseline for P2 |

**Performance, Chrome headed, median of three runs** (from [chrome-headed.json](../evidence/baseline-p0/perf/chrome-headed.json); protocol 09 §2.4: fresh context per view and run, 10 s settle, 30 s idle, 30 s active; visible, focused window; launch flags keep the frame loop running when covered):

| View | Segment | rAF rate (FPS) | Render rate (FPS) | M7 median (ms) | M7 p95 (ms) | Worst p99 / max of 3 runs (ms) | M8 draw calls (median) | M9 triangles (median) |
|---|---|---|---|---|---|---|---|---|
| V1 bedside | idle | 133.9 | 12.0 | 7.0 | 13.9 | 20.8 / 21.2 | 1,206 | 387,848 |
| V1 bedside | active (look drag) | 110.2 | 78.4 | 7.0 | 14.2 | 21.0 / 41.9 | 1,150 (691–1,206) | 380,760 |
| V2 drill | idle | 144.0 | 12.0 | 6.9 | 7.2 | 7.3 / 14.1 | 479 | 299,400 |
| V2 drill | active (grip held, lift up and down) | 85.8 | 81.6 | 13.8 | 20.8 | 21.0 / 90.4 | 479 | 299,400 |
| V3 room | idle | 135.7 | 12.0 | 7.0 | 13.6 | 13.9 / 21.0 | 1,528 | 462,240 |
| V3 room | active (orbit drag) | 69.5 | 69.4 | 13.9 | 27.8 | 27.9 / 62.5 | 1,462 (1,189–1,553) | 437,200 |
| V4 anatomy | idle | 144.0 | 12.0 | 6.9 | 7.2 | 7.3 / 14.3 | 542 | 464,067 |
| V4 anatomy | active (orbit drag) | 108.8 | 107.5 | 7.0 | 14.0 | 20.6 / 28.0 | 506 (465–652) | 459,635 |

Run-to-run spread of the active rAF rate ([perf-run.log](../evidence/baseline-p0/perf/perf-run.log)): V1 109.8–111.6, V2 84.3–86.7, V3 69.5–69.6, V4 107.7–108.9 FPS. Frames over 33 ms per 30 s active segment: 0–3. One V2 attempt failed and was repeated (the grip stall). Measured against the PROPOSED M7 threshold, every view would be inside it on this machine; the threshold is not applied.

**Outside the protocol** (probe run, [P0-unknowns.md](P0-unknowns.md)): hover without buttons 41.7 FPS (U7, PR-1); look drag with the scope live 75.0 FPS against 81.3–82.5 FPS not live (U10); walking with D, 78 renders per second (U18).

**WebKit on Windows comparison** (one headless run, [webkit-on-windows-headless.json](../evidence/baseline-p0/perf/webkit-on-windows-headless.json); not vsync-bound to the panel, 1 ms timestamp resolution; says nothing about Safari on a Mac):

| View | Idle rAF / render FPS | Idle M7 median / p95 (ms) | Active rAF / render FPS | Active M7 median / p95 (ms) | Draw / triangles (idle) |
|---|---|---|---|---|---|
| V1 | 45.0 / 10.8 | 15 / 47 | 28.8 / 28.7 | 32 / 47 | 1,206 / 387,848 |
| V2 | 55.2 / 10.7 | 16 / 30 | 17.4 / 17.4 | 62 / 64 | 479 / 299,400 |
| V3 | 52.6 / 10.8 | 15 / 32 | 21.4 / 21.3 | 47 / 48 | 1,528 / 462,240 |
| V4 | 55.3 / 10.7 | 16 / 30 | 22.4 / 22.3 | 46 / 48 | 541 / 464,003 |

The first WebKit V1 attempt lost its WebGL context and never became ready within 90 s (repeated); the V4 page logged `WebGL: context lost.` and became ready only after 17.8 s, so its numbers come from a recovered context.

**Load times (M10)** (navigation start → `#model-status[data-state="ready"]`; ready is set after Rapier loads, so "→ `#forearm-practice` enabled" gives the same numbers):

| Load | Run 1 | Run 2 | Run 3 | Transfer |
|---|---|---|---|---|
| Chrome cold (new context, empty HTTP cache) | 2,476 ms | 1,680 ms | 1,621 ms | 26,892 KB, 32 resources |
| Chrome warm (reload in the same context) | 1,340 ms | 1,349 ms | 1,209 ms | 20,911 KB |
| Chrome, per-view loads during the M7 runs | 1,524–1,863 ms | | | |
| WebKit cold / warm (one each) | 2,729 ms / 2,522 ms | | | 26,892 KB both |

DOMContentLoaded 0.37–0.65 s. The probe run agrees (U8): Chrome cold 1,542–2,352 ms, warm 1,155–1,451 ms; with Rapier blocked 1,458–1,528 ms; Rapier adds about 1.5 s only to the first load in a fresh browser process. WebKit cold 2,490–2,759 ms, warm 2,289–2,500 ms, with 2 of 6 cold loads hitting context loss.

## Visual evidence

- **V1–V4 reference images** (installed Chrome, visible window, 2 s settle after `workMoving()` is false; camera JSON beside each image): [V1](../evidence/baseline-p0/visual/serve-chrome-headed/V1-default-bedside.jpg), [V2](../evidence/baseline-p0/visual/serve-chrome-headed/V2-forearm-drill-after-approach.jpg), [V3](../evidence/baseline-p0/visual/serve-chrome-headed/V3-room-camera-room.jpg), [V4](../evidence/baseline-p0/visual/serve-chrome-headed/V4-anatomy-full.jpg).

  | View | Draw calls | Triangles | Against R6 | Camera position | Rotation (x, y, z) | FOV |
  |---|---|---|---|---|---|---|
  | V1 default bedside | 1,206 | 387,848 | inside (upper end) | [0.735, 1.6, 0.15] | [−0.6, 1.5708, 0] | 62 |
  | V2 drill after «اقترب» | 479 | 299,400 | inside (lower end) | [0.705, 1.6, 0.0749] | [−0.996, 1.5708, 0] | 52 |
  | V3 room `#camera-room` | 1,528 | 462,240 | draw calls +8 (+0.5 %), cause UNKNOWN; triangles equal | [0, 1.6, 4.24] | [−0.1427, 0, 0] | 62 |
  | V4 anatomy full view | 542 | 464,067 | equal | [0.3926, 1.6818, −0.2758] | [−1.0119, 1.4276, 0] | 49 |

  Every browser gives the same V1–V3 counters. V4 headless gives 541 / 464,003 with the camera 1 mm closer, because the headed window shows a page scrollbar and the anatomy framing depends on the canvas aspect. V3 matches the composition of [evidence/06](../evidence/06-room-overview.jpg), which settles the 09 §2.3 ASSUMPTION about `#camera-room` (compared by eye by the test author, not by a §2.5 reviewer).
- **After the fix**, the V1–V4 counters and cameras are identical to the baseline in Chrome, Edge and WebKit ([p0-post-fix/visual/](../evidence/p0-post-fix/visual/), JSON only; post-fix V1–V4 images were not kept).
- **F19 pairs:** see "Carried from P1: AC-P1-1".
- **WebKit comparison images** ([visual/serve-webkit-headless/](../evidence/baseline-p0/visual/serve-webkit-headless/)): V1 renders; **V2–V4 are blank** because of the resize defect (U21, PR-2). They are not usable as Safari-engine visual baselines.
- **Visual review records (§2.5):** none yet. The owner has not named the second reviewer, and T1 makes no visual-quality claim.
- **Evidence trimming:** JPEGs are kept only for the canonical runs (baseline: `smoke/serve-chrome-headed`, `visual/serve-chrome-headed`, `visual/serve-webkit-headless`, `smoke/serve-webkit-headless/S5-*`; post-fix: `smoke/serve-chrome-headless/S5-*`). All JSON and logs are kept. `npm run smoke` regenerates the rest.

## Unknowns

Full table, methods and numbers: [P0-unknowns.md](P0-unknowns.md). The probe scripts were run from a temporary folder and are not part of the repository; neither are their raw JSON and screenshots.

| U | Verdict | Key result | Still open |
|---|---|---|---|
| U1 | PARTIALLY SETTLED | Valid numbers for this machine; hover 41.7 FPS | D9 machine and budget (owner) |
| U2 | PARTIALLY SETTLED | Emulated touch: single-touch flows work; no multi-touch | Real tablet (record only, D9) |
| U3 | PARTIALLY SETTLED; Firefox BLOCKED | WebKit runs S1–S9 except the R8 check; context loss at boot | Firefox (PR-9); Safari on a Mac (PR-2) |
| U6 | PARTIALLY SETTLED | Wrist steps of 125.7° and 92° in one frame; roll unlimited | Attach moment; §2.5 judgement |
| U7 | SETTLED (hover); PARTIAL (touch-follow) | 40–43 ms per hover pick | Touch-follow cost measured, not only expected |
| U8 | SETTLED (this machine) | Ready in 1.2–2.5 s (Chrome) | — |
| U9 | SETTLED | Support holds at all 40 walk stations | — |
| U10 | SETTLED (one live run) | Live scope costs ≈8 % frame rate | Repeat runs |
| U11 | SETTLED (Chrome, Edge, WebKit) | Preview works over `file://` | Firefox; Safari |
| U12 | PARTIALLY SETTLED | Scope sees the proxy, not the anatomical appendix | Pitch and yaw sweep; owner choice (PR-8) |
| U14 | SETTLED | WASD works; R19 closed | — |
| U15 | SETTLED (data) | No normals or UVs; outward front wall; floating equipment | §2.5 / D10 review |
| U16 | SETTLED (geometric) | Supervisor inside patient, bed, trolley | Visual confirmation (§2.5) |
| U17 | SETTLED | Vite build empties `dist/` | Config change only with owner approval |
| U18 | SETTLED (144 Hz) | Stale hands in 45 % of moving frames | Fix in P3 (PR-4) |
| U21 | PARTIALLY SETTLED (WebKit on Windows) | APIs work; blank view after resize | Safari on macOS |
| U23 | SETTLED (emulated) | App runs under Live Server; standalone preview slow (12.0 s) | — |

**New unknowns raised in T1:** the cause of the grip stall after «اقترب» (PR-6); the cause of the +8 draw calls in V3; why WebKit grips before «اقترب» (R8 check). Unknowns outside P0 (U4, U5, U13, U19, U20, U22, U24) stay with their phases in [08](../08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md).

## Clinical

- No CRC record was produced, at either stage (admin model or certified doctors); none was due in P0.
- No clinical content was added or changed. Every CR item (CR-01 to CR-42) stays flagged with the label "illustrative".
- The "DEMO SIGNALS" label is still shown on the monitor (INV-6); the S4 drill is the existing non-clinical skills practice.
- The U12 finding about the appendix depiction (PR-8) is CLINICAL REVIEW REQUIRED (CR-14, CR-41; CRC-6).

## Deviations and known issues

**Deviations from the T1 plan** ([10](../10_NEXT_IMPLEMENTATION_TASK.md)):
1. **Browsers.** Chrome and Edge were driven as the machine's installed browsers through Playwright channels, not as Playwright's own Chromium. That Chromium does not launch here ("side-by-side configuration is incorrect"); its headless shell works but renders with SwiftShader (software), so it was not used for evidence.
2. **Firefox BLOCKED** (step 6, test 13): Playwright's Firefox does not launch here; the `firefox` project skips its 17 tests with the recorded reason.
3. **`tests/browser/perf-capture.mjs` added** for the §2.4 capture; it is not in the file list of 10 §6. Apart from the dependency, `package.json` gained only the `smoke` script.
4. **Playwright version.** Pinned to 1.64.1, released about a month earlier; the newest, 1.65.1, was one day old and was avoided.
5. **Commits.** The dependency and the smoke suite share `06e2c65` (10 §10 listed "smoke protocol" and "optional Playwright" as separate commits); reverting `06e2c65` still removes Playwright as the rollback in 10 §11 expects. The F19 commit also removes the known-failure markers and adds the post-fix evidence.
6. **Standalone preview.** The Vite build deleted it (U17); it was rebuilt after the build at 19:44 (pre-fix tree), and deleted again by the post-fix build at 20:05. It was rebuilt once more on the post-fix tree after the final build ([standalone-preview.log](../evidence/p0-post-fix/standalone-preview.log)), so `dist/` now holds both the Vite output and the preview.
7. **Post-fix verification** first ran on `serve.mjs` only, headless, in Chrome, Edge and WebKit. The Vite-preview run that T1 step 11 also asks for was added later the same evening ([vite-post-fix-run.log](../evidence/p0-post-fix/vite-post-fix-run.log)).
8. **Servers.** `node scripts/serve.mjs` was run with `PORT=4301` (probes 4311–4319) instead of `npm run serve` on 4173, to keep clear of the lead's own server on 4190; the Vite runs used `npx vite preview --host 127.0.0.1 --port 4302 --strictPort` (the `npm run preview` command plus a fixed port) on the lead's existing pre-fix `dist/`.
9. **Suite adaptations.** Up to five wrist clicks at small pixel offsets, each recorded (grip stall); one retry for the WebKit project (boot context loss); the R8 check is a soft check so the rest of S2 still runs; Edge is functional only (headed and unfocused it was throttled to about 1 FPS).
10. **Performance.** Only Chrome was captured to protocol (three runs); WebKit had one headless run and Edge none; no profiler trace is kept; window stacking was not controlled (the launch flags keep the loop running when covered).
11. **Evidence trimmed** to the canonical runs' JPEGs (about 22 MB of other screenshots deleted after review); all JSON and logs kept.
12. **Safety copy.** The untouched source zip (SHA-256 above) is the archive, instead of a separate folder copy (step 2 RECOMMENDATION).
13. **P0 probes** ran from a temporary folder outside the repository, with a probe-side init script (`__THREE_DEVTOOLS__`) and a wrapper on the renderer instance's `render`; no app file changed. Their scripts and raw output are not committed. U23 was probed as an extra.
14. **Discarded attempt.** The first official smoke attempt was stopped and its files deleted after the grip stall was found; the recorded runs came after.
15. **Not kept as files:** the `npm ci` console output, the full `npm run build` output, and the console output of the "Expected to fail, but passed" run.

**Known issues** (all pre-existing; none caused by T1):
1. WebKit on Windows grips the wrist before «اقترب», so the S2 R8 check fails (deterministic).
2. WebKit on Windows loses the WebGL context during some boots; the app cannot recover (PR-3).
3. WebKit on Windows shows a blank 3D view after any canvas resize (U21, PR-2).
4. The grip stall after «اقترب» in Chromium browsers (PR-6).
5. `#anatomy-toggle` covers `#camera-overview` at 1440×900 (PR-7).
6. V3 draws 8 more calls than R6 (cause UNKNOWN).
7. The hover pick costs 40–43 ms per mouse move (U7, PR-1).
8. Hand lag and jitter above ≈66 Hz (U18, PR-4).
9. The supervisor intersects the patient, the bed and the trolley, and jumps sides (U16, U9; PR-5).
10. Room GLBs are flat-shaded without normals; the front wall faces outward; equipment floats 2.7–8.75 cm above the floor, and the supervisor 2.6 cm (U15; P4, D10).
11. The R8 "out of reach" now comes from the 3.2 s hold timeout, not an immediate refusal.
12. The S4 trace logs `checklist_item_completed@wrist` for the deposit step, because the stage has already advanced when it is recorded (relevant to P6, F24).
13. The Vite build emits one 763.67 kB bundle with the ">500 kB chunk" warning (informational).
14. Every Vite build deletes the standalone preview (U17).
15. Firefox BLOCKED in this environment (PR-9).

## Owner checkpoint 1

- **Date:** pending. **Decision:** pending. **Conditions:** pending.
- **What the owner reviews** ([07](../07_PRIORITIZED_IMPROVEMENT_ROADMAP.md) §6, checkpoint 1): this report; [RESULTS.md](../evidence/baseline-p0/RESULTS.md); the V1–V4 images; the F19 before-and-after pairs; the performance table; [P0-unknowns.md](P0-unknowns.md).

**Decisions requested:**
1. **Accept the baseline.** **RECOMMENDATION:** accept, on two conditions: the team first closes the evidence gaps T-1, T-2 and T-5 below, and the owner accepts as recorded known issues the V3 +8 draw calls (AC-P0-7), the WebKit items (PR-2, PR-3) and Firefox BLOCKED (PR-9), and waives the "own commit" clause of AC-P0-10 (the dependency shares `06e2c65` with the smoke suite; reverting that commit still removes Playwright). AC-P0-8 then waits only for decision 2.
2. **Confirm the D9 reference machine and budget.** **RECOMMENDATION:** take this laptop (Intel i5-12500H; the browsers render on its integrated Iris Xe) as the reference machine for now, and confirm the PROPOSED thresholds (M7 median ≤ 16.7 ms and p95 ≤ 33.3 ms in the active segment; M10 ≤ 10 s from a local server). Every view is inside them on this machine (worst active p95 27.8 ms; loads ≤ 2.5 s), apart from the hover case that PR-1 addresses.
3. **Approve the remaining P1 fixes plus the new P1 candidates.** Remaining P1 items: the lamp light (F26), normal spaces (F17), stale `forearmContact`, table height measured first (F27), and the Rapier licence notice (F30, D8 option A). New candidates: PR-1 (hover pick), PR-2 (WebKit resize investigation and an early Mac check), PR-6 (grip stall investigation), PR-10 (hover segment in the protocol). **RECOMMENDATION:** approve all, each fix in its own commit.
4. **Approve P2**, with PR-3 (context loss) and PR-7 (button overlap) added. **RECOMMENDATION:** approve.
5. **Authorise T2 and set its time box** (P3 spike, branch only, ends at checkpoint 4 with a visual review). **RECOMMENDATION:** one working day of team time, with a stop-and-report as soon as skinned cloning of `supervisor.glb` (U13) proves impossible.
6. **Answer the other proposals:** PR-4 (P3 scope), PR-5 (P8 scope), PR-8 (A, B or C), PR-9 (Firefox route).
7. **Merge `t1-baseline-f19` into `main` after his review.** **RECOMMENDATION:** merge once decision 1 is given and T-1, T-2 and T-5 are done. `main` still points at the baseline, so the merge adds the T1 commits without rewriting anything. There is no remote; publishing the repository anywhere is a separate decision.

**Team actions (no owner decision needed; recorded for transparency):**
- **Status, 14 Nov evening:** T-1 and T-5 DONE. T-2 is half done: the readouts are recorded, and the suite does not check them yet. T-3 and T-4 are open.
- **T-1** (closes AC-P0-4 and T1 step 11): save the full `npm run build` output and the `dist/` listing under `evidence/p0-post-fix/`; run `npm run smoke` against the post-fix Vite preview in Chrome, Edge and WebKit; rebuild the standalone preview and re-check S1 over http.
- **T-2** (closes the R5/R16 part of AC-P0-6): add read-only readouts of the visible control count (R5) and of the events recorded before a session (R16) to the smoke suite, in a test-only commit, and record them as P2 baselines.
- **T-3** (closes the profiler-trace part of AC-P0-8): keep one Chrome performance trace of V3 active (the heaviest view) in a visible window.
- **T-4** (optional; the lead decides): copy the probe's raw JSON and a few key screenshots (U6, U12, U16, U21) into the evidence folder, so the unknowns have evidence inside the repository.
- **T-5** (closes AC-P0-2): re-run `npm ci` and keep its full output under `evidence/p0-post-fix/`, with the SHA-256 of `package-lock.json` before and after and `npm ls three vite @playwright/test`. The lockfile now includes the Playwright entries, so this re-run shows that `npm ci` leaves the current lockfile unchanged; the baseline hash stays the lead's record (recomputed from `v1.5-baseline:package-lock.json` for this report).
