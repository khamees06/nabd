# Nabd v1.5 — Browser smoke protocol (S1–S9) and visual baselines (V1–V4)

Source of truth: [09 §2.2, §2.3, §2.4](../../docs/improvement-plan/09_ACCEPTANCE_AND_VALIDATION_PLAN.md) and [10 step 6–8](../../docs/improvement-plan/10_NEXT_IMPLEMENTATION_TASK.md).
Automated version: `tests/browser/smoke.spec.mjs` (Playwright, config `tests/browser/playwright.config.mjs`).
Performance capture (09 §2.4): `tests/browser/perf-capture.mjs` (plain Node script, not a test).
The protocol is read-only with respect to the app: it clicks, types, moves the mouse and reads the `?qa` hook. Smoke flow IDs S1–S9 are unrelated to the case stages S0–S9 in 06.

## 1. How to run

| What | Command |
|---|---|
| Unit suite (browser-free; 65 cases since G1: 21 in P0, 4 for `SkinPickCache` in P1, 18 for `render/LookDev.js` and `tests/browser/render-metrics.mjs` in Q1, 4 of them for a WebGL context loss and restore, 22 for the G1 grab-anywhere foundations; all must pass) | `npm test` |
| Smoke suite against `scripts/serve.mjs` (port 4301) | `npm run smoke` (all projects) or `npm run smoke -- --project chrome` |
| Smoke suite against the Vite build (port 4302) | `npm run build`, then `NABD_SMOKE_SERVER=vite npm run smoke` |
| Visible browser window (chrome, edge) | add `NABD_SMOKE_HEADED=1` |
| One flow | `npm run smoke -- --grep "S5"` |
| Performance, headed Chrome | `node tests/browser/perf-capture.mjs --browser chrome` |
| Performance, WebKit (one run) | `node tests/browser/perf-capture.mjs --browser webkit --runs 1 --loads 0` |
| Performance with the GPU time of each canvas frame, shadow pass + main pass (`gpuMs`; Chrome, where `EXT_disjoint_timer_query_webgl2` exists) | add `--gpu 1` (loads `?qa&debug=1&gpu=1`) |
| Grab-anywhere and visual-quality checks (Q1: render readout, the readout across a forced WebGL context loss and restore, image-metric baselines) | `npm run smoke -- grab.spec --project=chrome` |
| V1–V4 exact pixel diff against a base commit (13 Q1, Q2: "pixel diff 0") | `node tests/browser/pixel-diff.mjs --base <ref> --browser chrome` (also `webkit`, `edge`) |

The config starts the server itself (`webServer`); run one suite per port at a time. `NABD_SMOKE_PORT` overrides the port, `NABD_EVIDENCE_DIR` the output folder. Note (U17, observed in P0): `npm run build` deletes `dist/Nabd-Clinical-Simulator-v1.5-Preview.html`, so build before `npm run preview:standalone`, not after.

**Projects.** `chrome` = installed Google Chrome (D9 required), headless by default (real GPU through ANGLE D3D11 here). `webkit` = Playwright WebKit on Windows, reported as "WebKit on Windows", an approximation of Safari's engine and never "Safari" (U21, AS15); one retry because of intermittent WebGL context loss at boot in this environment. `edge` = installed Microsoft Edge (D9 expected), functional only. `firefox` = Playwright Firefox (D9 expected); every test is skipped with a recorded reason when the browser cannot launch (in this environment: `spawn UNKNOWN`, see `smoke/<server>-firefox-headless/firefox-launch.json`).

## 2. Common rules

- **Entry** `/?qa&debug=1`, viewport 1440×900, locale en-US. Each flow starts from a fresh page load, so S6 and S7 never inherit drill, support or tool state (F31).
- **Ready** `#model-status[data-state="ready"]` (set at `NabdRuntime.js:6104` together with `window.__studioQA`; it is set after Rapier loaded, so `#forearm-practice` is already enabled). No QA call before it: `getSimulationState` has no null guards.
- **M11** per flow = `console.error` messages + uncaught page errors after boot. Expected 0 everywhere except S5 scissors / needle holder (F19).
- **INV-10** every request must go to the app's own origin (recorded in S1).
- **Readouts** are saved as JSON per flow, with browser name and version, run attempt and the count of "WebGL: context lost" messages.
- **Pointer model** (`src/interaction/BedsideInteraction.js`): a click (press + release without moving) on a grip target starts a held gesture; moving the mouse with no button pressed moves the held object; a second click without moving releases it. Moving the mouse over the canvas while holding drags, so the protocol returns to the last pointer position before a release click.

## 3. Flows

| Flow | Steps (controls) | Checks (fail the flow) | Recorded readouts |
|---|---|---|---|
| **S1 Boot** | Load, wait for ready, 2.5 s settle | `__studioQA` has the 9 functions; `supervisorVisible === true`; `#forearm-practice` enabled; served tree: 29 `/src/**/*.js` modules HTTP 200 (21 in P0, plus `patient/SkinPickCache.js` since P1, `render/LookDev.js` since Q1, `patient/BodySegments.js`, `BodyProxies.js`, `SupportSurface.js`, `JointModel.js`, `PoseVersion.js` since G1, and `render/GeometryFixes.js` since G2); 9 GLBs HTTP 200; `vendor/rapier/rapier.mjs` HTTP 200; no foreign-origin request; M11 = 0 | ready time, asset status, WebGL renderer string, reduced-motion flag, overlay counters (V1), camera, full response list, warnings. Vite build: modules are bundled, so the 21-module count is not applicable and is recorded instead |
| **S2 Forearm drill** | `#forearm-practice` → wait for `forearm` state and `abdomen.ready` → click the wrist (`practice.wrist` screen point) → wait up to 7 s → «اقترب» `[data-work-approach="-1"]` → click the wrist → wait for `forearm.state === 'gripped'` (if the hold timeout reports out of reach instead, click again at a small pixel offset; up to 5 attempts, each recorded in `gripAttempts`, because the glove intermittently stalls short of the wrist) → move the pointer 90 px up | out-of-reach status before «اقترب» (R8; soft check, the rest of the flow still runs); «اقترب» moves the trainee; grip reached; wrist raised > 1 cm; M11 = 0 | status sequence with timings after the first click (observed: a reach starts and the 3.2 s hold timeout reports «خارج مدى الإيد» in Chrome and Edge; WebKit grips instead), camera before/after «اقترب», `forearm.{state, overlap, stops, gap, contact}`, wrist lift, screenshots |
| **S3 Support and release** | as S2 up to the lift → `#forearm-assist` → wait for «المشرف مسنّد الساعد» → click at the same pointer position (release) → wait 1.8 s → «إنهاء المساندة» (`#forearm-assist`) → wait 3.5 s | label shown (`supportGap < 0.020`); forearm `idle` after release; wrist stays above rest by more than half the lift; M11 = 0 | supportGap, wrist heights (rest, lifted, released, after ending support), labels |
| **S4 Training session** | «ابدأ التدريب» via `#training-action` (recorded) → `#training-action` again (monitor) → `#vitals-confirm` (SpO₂) → click the tool handle (`practice.tool`) → move to `practice.aimPointer` (small search around it) → move to `practice.tray`, click → click the wrist (`practice.wrist`), lift until `practice.lift ≥ 0.052`, move back, click | phase `complete`; `practice.results` = monitor, pickup, aim, deposit, wrist; M11 = 0 | per-step phase, count, instruction, feedback, retries; result text; **golden trace** = `NabdSimulation.getEvents()` (full events and type sequence); screenshots of the monitor dialog (shows "DEMO SIGNALS", INV-6), the lifted wrist and the result |
| **S5 Instruments** | Fresh load per tool: `#training-tool` = grasper / scope / scissors / needleHolder → `#trainee-tray-view` («الصينية») → 2.5 s; plus one run with `#training-source` = staff: start the session, confirm SpO₂, wait for the supervisor's offer | zero `NaN` console errors and M11 = 0 per tool. **Known failing check:** scissors and needle holder (`test.fail`, annotation "F19 — fixed in T1 step 10"); the suite passes while the defect exists and reports "expected to fail but passed" once the fix lands, at which point the tool is removed from `F19_KNOWN`. Staff run: phase `pickup` and `crew.offer > 0.92` within 10 s | per-tool console counts in `S5-<tool>.json` and `S5-summary.json`; tray screenshot per tool; crew `toolVisible`, `mode`; staff offer state and screenshot |
| **S6 Room and presets** | `#forearm-practice` (drill open) → `#toggle-trainee-mode` (refused) → `#forearm-practice` (drill closed) → `#toggle-trainee-mode` → each `#camera-*` preset (11) | since P1 C5 the room view is refused while the drill is open, with the status «أغلق تمرين الساعد أولًا ثم افتح معاينة الغرفة» (P0: the drill ended silently, F31); after the drill is closed the room view opens; every preset `aria-pressed="true"`; M11 = 0 | teardown state; per preset `getCamera()`, `cameraRotation`, `cameraFov`, overlay counters; whether the button is reachable by a pointer (P0: `#camera-overview` is covered by `#anatomy-toggle` at 1440×900 and is then clicked through the DOM); V3 screenshot (all presets on Chrome) |
| **S7 Anatomy** | `#anatomy-toggle` → `#anatomy-organ` = appendix → tick `#anatomy-isolate` → `#anatomy-reset` | 35 keys; readout contains 35; attribution contains "BodyParts3D"; isolated selection `appendix` and visible; M11 = 0 | `anatomy.{keys, visible, selected, attached}` at each step; attribution text; screenshots (isolated appendix, full view = V4) |
| **S8 Hands and locomotion** | `#trainee-reach-left`, `#trainee-reach-right`, keys Q and E, hold D for 2 s in the free bedside view (U14) → `#trainee-focus-abdomen` → `[data-work-step="1"]` → `#work-other-side` | hand buttons and Q/E toggle `aria-pressed`; INV-3 lateral ordering at rest (left glove camera-space x < 0, right > 0); M11 = 0 | `crew.getState()` per hand; `getCamera()` before/after D, the work step and the other side; `#work-side` text |
| **S9 Port and scope** | `#training-tool` = scope → `#trainee-tray-view` → click the handle → `#open-tool-field` → move to `instrument.portScreen` → 6 × `#tool-depth-controls [data-tool-depth="1"]` → 1 × `[data-tool-roll="1"]` → `#scope-view` → back | `instrument.aligned`; `percent > 0`; `scope.live` and `lookingAtMonitor`; 12 scope pixels; M11 = 0 | `instrument.{aligned, percent, angles, tip, port}`, `scope.*`, `getScopePixels()`, depth text, screenshots |

## 4. Visual baselines V1–V4 (09 §2.3)

| View | How it is reached | Saved beside the image |
|---|---|---|
| V1 default bedside view | load, ready | `getCamera()`, `cameraRotation`, `cameraFov`, overlay draw calls and triangles |
| V2 forearm drill after «اقترب» | `#forearm-practice`, «اقترب» | same |
| V3 room view | `#toggle-trainee-mode`, `#camera-room` «من مدخل الغرفة» | same |
| V4 internal anatomy, full view | `#anatomy-toggle`, `#anatomy-reset` | same |

Capture rule: wait until `workMoving()` is false and the camera is steady (two reads 250 ms apart), then settle 2 s (PROPOSED), then capture. The official baselines come from the `chrome` project run with `NABD_SMOKE_HEADED=1` (folder `visual/serve-chrome-headed`). Comparison is by reviewed side-by-side pairs, not pixel equality (vitals vary on a sine; hands ease). For changes that must not alter the picture, `pixel-diff.mjs` compares V1–V4 exactly: with `prefers-reduced-motion` the vitals monitor draws once, without `debug=1` there is no overlay, and one frame is rendered through the app renderer and read back from the canvas, so two loads of one tree are bit-identical (each run checks this) and nothing is masked. Playwright WebKit on Windows screenshots V2–V4 as an almost blank canvas (at the base commit too); the canvas readback is not affected. R6 ranges for reference: V1 1,167–1,206 draw calls / 378,534–387,848 triangles; V2 479–503 / 299,400–303,548; V3 1,520 / 462,240; V4 542 / 464,067.

## 5. Performance capture (09 §2.4)

`perf-capture.mjs` launches headed installed Chrome with `--disable-renderer-backgrounding --disable-background-timer-throttling --disable-features=CalculateNativeWinOcclusion`, viewport 1440×900. Per view (V1–V4) and run (3): fresh context and load, set up the view, 10 s settle, 30 s idle (no input), 30 s active (V1 right-button look drag; V2 forearm grip held and moved up and down; V3/V4 left-button orbit drag), then 30 s hover (no button, the pointer sweeping across the patient and the room; PR-10, `--hover 0` skips it). Measured: M7 = rAF interval (median, p95, p99, max) from the script's own rAF loop; render rate = frames in which the app issued a WebGL `clear()` (the overlay FPS is the rAF rate, not the render rate); M8/M9 from the `?debug=1` overlay, sampled each second; M10 = navigation start → ready, and → `#forearm-practice` enabled, 3 cold loads (fresh context) and 3 warm reloads. Hardware and browser identification is written into the JSON. WebKit: one run of the same views, headless, labelled "WebKit on Windows (approximation, not Safari)". Since Q1 each per-second sample also reads the `?qa` render readout (`__studioQA.getRenderStats()`, the same object as `getSimulationState().render`): the shadow pass's draw calls and triangles, which the overlay never counted (three.js draws the shadow pass before `info.reset()`), app renders and light-map redraws per second, shader programs and, with `--gpu 1`, `gpuMs`: the GPU time of the whole canvas `render()` call, which holds the shadow pass and the main pass (three.js draws the shadow pass inside `render()`; offscreen renders such as the scope feed are not in it). The readout also says whether the WebGL context is lost now and counts losses, restores, rebuilt renderer objects followed by the counters, and frames issued while lost; after a restore three.js replaces `renderer.info` and `renderer.shadowMap`, and the counters follow the new objects.

## 6. Manual equivalent (no Playwright)

Run `npm run serve`, open `http://127.0.0.1:4173/?qa&debug=1` in a visible window, follow the steps in Section 3, read `window.__studioQA.getSimulationState()` in the console after each step, and fill one sheet per browser:

| Flow | Pass / fail | M11 | Notes (readouts, differences from R1–R21) |
|---|---|---|---|
| S1 … S9 | | | |
