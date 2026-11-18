# P0 unknowns — T1 step 9 (AC-P0-9), probe run of 14 November 2026

**What this file is.** The unknowns table and per-unknown details from the T1 probe run of 14 November 2026, cleaned for the repository: content, numbers and status labels are unchanged; local temporary paths are removed, and the probe's first-person wording is made neutral. Lines added in this copy are marked *"Added in this copy"*. The phase report that uses this table is [P0-completion.md](P0-completion.md); the unknowns themselves are defined in [08](../08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md) §3.

**Where the probe files are.** Probe scripts were run from a temporary folder and are not part of the repository. The same applies to the probe's raw JSON output and its screenshots: the file names below identify those records, but they cannot be opened from the repository. Files that *are* in the repository are linked.

Scope: U1–U3, U6–U12, U14–U18 from `08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md` §3, plus U21 (WebKit first look) and U23 (VS Code Live Server). U17 was settled by the lead (the Vite build empties `dist/`); it is listed for completeness only.

## How the probes ran

| Item | Detail |
|---|---|
| Code under test | Branch `t1-baseline-f19`, unmodified v1.5 source (F19 not applied). No file under `src/`, `index.html`, `assets/`, `vendor/`, `scripts/` or `vite.config.mjs` was touched. No git command was run. |
| Only repository-side effect | `npm run preview:standalone` was run once at 19:44 to recreate `dist/Nabd-Clinical-Simulator-v1.5-Preview.html` (34.70 MiB, SHA-256 `2a7dd0f3…d3d96840`), which the lead's Vite build had deleted (U17). `dist/` is git-ignored. A copy was kept with the probe files (outside the repository). |
| Machine | The T1 laptop (Intel i5-12500H, Intel Iris Xe via ANGLE D3D11, internal panel 144 Hz, 1440×900 viewport, DPR 1, reduced motion off). |
| Browsers | Installed Chrome 157.0.8103.51 (`channel: 'chrome'`, **headed**, timing args `--disable-renderer-backgrounding --disable-background-timer-throttling --disable-features=CalculateNativeWinOcclusion --window-position=0,0`) for anything timing-related. Edge 157.0.4341.46 headless (functional only). Playwright WebKit 27.2, reported as "WebKit on Windows", never as Safari (AS15). Firefox: BLOCKED (U3). |
| Servers | The project's own `node scripts/serve.mjs` with `PORT` set, on ports 4311–4318 only (one at a time). U23 used port 4319. All servers and browsers were stopped afterwards (checked: nothing listening on 4311–4319). |
| Read-only scene access | An init script defines `window.__THREE_DEVTOOLS__`, so the bundled three r180 dispatches its own `observe` events (Scene and WebGLRenderer constructors). That gives the probe references to the two scenes and the renderer. The probe wraps the renderer **instance's** `render` for timing and sampling (and, in U7, `SkinnedMesh.prototype.raycast` for counting). Nothing in the app's files changes. The same technique could serve the P2 QA seams. |
| Status labels | VERIFIED = executed and observed in this run. "Smoke run" or "perf run" = VERIFIED in the earlier T1 runs whose files the probe read ([evidence/baseline-p0/RESULTS.md](../evidence/baseline-p0/RESULTS.md), [perf/](../evidence/baseline-p0/perf/)); the probe did not re-run those. SOURCE-INSPECTED, ASSUMPTION and UNKNOWN are used as in the plan. |

Probe scripts were run from a temporary folder and are not part of the repository; their JSON output and screenshots stayed with them (names listed under "Files" at the end).

## Summary table

| U | Verdict | One-line result | Plan items affected |
|---|---|---|---|
| U1 | PARTIALLY SETTLED | 8 view×segment rows (V1–V4, idle and active) measured on this machine (perf run). Two input cases outside that protocol cost far more: mouse hover drops the frame loop to ≈42 FPS (U7), and a live scope costs ≈8 % FPS (U10). D9 reference machine and budget not confirmed | D9 budget, AC-P0-8, M7, U22, P5, P8 |
| U2 | PARTIALLY SETTLED (emulated touch) | With Chrome touch emulation, S1–S3 and S4 step 1 work by tap and one-finger drag. A two-finger spread does nothing (non-primary pointer ignored). No real tablet was used | D4 (record only), P7/P9 design |
| U3 | PARTIALLY SETTLED | WebKit: smoke S1–S9 run, with two failures: the R8 check, and boot context loss (2 of 6 cold loads here). **New:** the WebGL view is not shown after any canvas resize (below, U21). Firefox: **BLOCKED**. Windows SideBySide error: "Dependent Assembly mozglue … could not be found" | AC-P0-9, P11 matrix (AC-P11-2, AC-P11-7), D9 |
| U6 | PARTIALLY SETTLED | Wrist rotation was logged per rendered frame. On a click on the abdomen centre (pinch action), the right glove turned **125.7° between two rendered frames**; with the press action, 92°. A view reset moved the gloves up to 0.182 m in camera space, settling in 181 ms. Roll is unbounded: 30 × 15° steps, shown modulo 360°. Attach itself was not reached | F09, P3 (G08, G09, G13), P2 QA seam, M6 |
| U7 | SETTLED (hover); PARTIALLY (touch-follow) | One `surfaceHit` costs **40–43 ms** on the 105,822-triangle skin, and every idle mouse move does one. ≈91 % of busy CPU is inside `intersectObjects`. The frame loop falls from 141.6 to 41.7 FPS while hovering. The ray never misses early: the camera is inside the skin's 0.928 m bounding sphere | P5 contact budget, M7, D9 budget, F33 |
| U8 | SETTLED (this machine) | Ready, Chrome: cold 1.54–2.35 s, warm 1.16–1.45 s, Rapier blocked 1.46–1.53 s. Fetching the 4.34 MB `rapier.mjs` takes 13–33 ms. Rapier adds ≈1.5 s only on the first load in a fresh browser process, otherwise ≤0.25 s. WebKit: 2.29–2.76 s; 2 of 6 cold loads hit context loss (one took 17.7 s, one never became ready) | M10, D9 load budget (≤10 s), AC-P0-8 |
| U9 | SETTLED | Support holds (`supportGap` < 0.020 m, label shown) at all 40 stations walked around the whole loop. The supervisor switches side when the trainee's x < 0. A grip is possible only from +X stations at z ≥ 0.075 (5/5 out of reach at z −0.185 and −0.445) | P8, S3, F31 |
| U10 | SETTLED (single live run) | Look drag at the port station: scope live 75.0 FPS (p95 frame interval 27.7 ms) vs not live 81.3–82.5 FPS (p95 20.9 ms). App frame callback mean 9.7 vs 8.0–8.3 ms. The scope render call itself is 0.26–0.39 ms of CPU. With the scope live the app renders continuously, 59 renders/s idle | P7 budget, F20, D9 |
| U11 | SETTLED (Chrome, Edge, WebKit) | The standalone preview works over `file://` in headed Chrome (ready 2.52 s), headless Edge (2.73 s) and WebKit (3.16 s), and over http. Rapier loads through its `data:` URL import, 0 console errors or warnings, no request beyond the file. Firefox BLOCKED | AC-P0-5, offline delivery path |
| U12 | PARTIALLY SETTLED | Selecting and isolating the appendix works (smoke S7). At the S9 scope pose, the scope frustum holds the "Appendix training proxy" but **not** the BodyParts3D `appendix` and `mesoappendix` (NDC −1.3, 1.41), even after 30 roll steps. Pitch and yaw were not swept; "as intended" is the owner's call | P10, CRC (D7), F29 |
| U14 | SETTLED | WASD works in a visible window. Free view: D 2 s → 1.255 m, A → 1.26 m, S → 0.71 m, W → 0.085 m (stops at the bed). Workstation: A/D → 1.30 m around the loop, W/S hit the approach limits (−0.09, +0.25). R19 was a hidden-pane artefact | S8, R19 closed |
| U15 | SETTLED (data); visual review open | All 355 meshes of the 4 room GLBs lack normals and UVs; 354 render flat-shaded. The 3 front-wall planes at z 4.8 face +z (outward), single-sided, so they are culled from inside. The anesthesia screen glass has a canvas texture but no UVs. Floor top y −0.025: table base 3.9 cm above it, anesthesia unit 6.0 cm, supervisor 2.6 cm, procedural carts up to 8.75 cm | P4 (G01), D10, §2.5 review |
| U16 | SETTLED (geometric, upper bound) + screenshots | During the support tilt, 2,126–2,593 of 38,083 sampled supervisor vertices lie inside the patient's skin height-span (up to 0.216 m below the skin top), and ≈2,300 inside table-top part boxes. At the workstation stand the supervisor overlaps the back-table trolley and the Mayo tray (387 vertices); at rest the hands overlap the tray (52) | P8 (believable staff), D1 A+, U22 |
| U17 | SETTLED (lead) | The Vite build empties `dist/`. The preview was recreated afterwards in this run | Delivery, AC-P0-4/5 |
| U18 | SETTLED (144 Hz panel) | While walking, **45 %** of rendered frames with camera motion show hands not yet updated. Glove screen-position jerk: p95 8.5 px, max 9.7 px. Paced to every 3rd vsync (≈48 Hz, crew updates every frame): p95 0.4 px. Reduced motion: 0 px. The 15 ms crew throttle causes visible hand jitter above ≈66 Hz | P3 hand stability, M4, F01 |
| U21 | PARTIALLY SETTLED (WebKit on Windows only) | Every D9 feature exists in WebKit 27.2 except CSS `overscroll-behavior-x` (cosmetic) and `performance.memory` (debug overlay only). `roundRect` is called 57×, 0 errors; `showModal`, Rapier WASM and the `data:` import all work. **Defect:** after any canvas resize the WebKit window shows a blank 3D view while the drawing buffer is correct | P11 Safari check, AC-P11-4/7, AS15 |
| U23 | SETTLED (emulated with the owner's own extension code) | The installed extension's own server (Live Server 5.7.10, live-server 2.2.0, send 0.17.2, mime 1.6.0) serves everything with 200 and correct types (`.mjs` as `application/javascript`, `.glb` as `model/gltf-binary`). S1 passes in Chrome and WebKit; the reload script is injected without errors. The standalone preview takes 12.0 s to ready through it | Owner's "Go Live" path (not a P0 gate) |

## Details per unknown

### U1 — Frame time and FPS on target hardware (F33)
- **Method.** Read the perf run ([chrome-headed.json](../evidence/baseline-p0/perf/chrome-headed.json), protocol 09 §2.4: 3 runs × 4 views, 10 s settle, 30 s idle, 30 s active, headed Chrome, visible and focused). The probe added its own conditions in headed Chrome: hover (U7), walking (U18), scope live (U10).
- **Observation (perf run).** Idle: the frame loop runs at 133–144 FPS and the app renders 12 FPS (the vitals repaint). Active, as rAF FPS and M7 median / p95: V1 look drag 110.2 FPS, 7.0 / 14.2 ms; V2 lift 85.8 FPS, 13.8 / 20.8 ms; V3 orbit 69.5 FPS, 13.9 / 27.8 ms; V4 orbit 108.8 FPS, 7.0 / 14.0 ms.
- **Observation (this run).**
  - Hover without buttons: the frame loop drops to 41.7 FPS (frame interval p95 48.6 ms, max 55.6 ms), because each pointer move runs a 40–43 ms raycast (U7). None of the 09 §2.4 active segments includes plain hover, so the perf table misses the worst everyday case.
  - Walking with D: 78 renders/s.
  - Look drag with the scope live: 75 FPS.
- **Verdict.** PARTIALLY SETTLED. Valid numbers exist for this machine. Whether it is the D9 reference or minimum machine, and the budget itself, are owner decisions. **RECOMMENDATION:** add a "hover" active segment to the 09 §2.4 protocol.
- **Affects.** D9 budget, AC-P0-8, M7, U22, P5, P8.

### U2 — Touch behaviour (record only since D9)
- **Method.** Probe script `u2-touch-u16b.mjs`. Headed Chrome, context `hasTouch: true` (`pointer: coarse`, `hover: none`), taps through Playwright and finger moves through CDP `Input.dispatchTouchEvent`.
- **Observation.**
  - A one-finger drag in the free view turned the camera (yaw −0.585 rad).
  - A two-finger spread changed nothing: FOV stayed 62, yaw and pitch stayed the same, page scale stayed 1. The second finger is a non-primary pointer and is ignored (`isPrimary` false), as `BedsideInteraction.js:309` implies.
  - The drill by taps, after «اقترب»: the first tap ended out of reach, the second gripped. A one-finger drag lifted the wrist 0.109 m. Tapping «اطلب مساندة المشرف» showed the label (gap 0.0176 m). Tapping to release left the forearm supported.
  - S4 step 1 by taps: the vitals dialog opened, and confirm moved the phase to `pickup`.
  - 0 console errors.
- **Verdict.** PARTIALLY SETTLED: emulated touch only, no real tablet. Single-touch flows work; there is no multi-touch gesture.
- **Affects.** D4 (record only), P7/P9 design.

### U3 — Firefox and Safari
- **Method (WebKit).** The smoke run (S1–S9) plus this run's U8, U11, U21 and U23 WebKit loads.
- **Observation (WebKit).**
  - Functional flows run (smoke); the S2 R8 check fails deterministically (smoke).
  - Boot context loss: 2 of 6 WebKit cold loads across two U8 runs. One never became ready within 90 s. The other logged `WebGL: context lost.` plus `WebGL: INVALID_VALUE: drawBuffers: more than max draw buffers` and became ready only after 17.7 s.
  - **New defect, not in the smoke report.** The 3D view is blank in WebKit screenshots of V2, V3, V4, S2, S3, S4-complete and S7: viewport pixel standard deviation 0.5–6.2, against 58–92 in Chrome. Root cause is under U21. The smoke matrix marks WebKit V2–V4 as PASS on renderer counters, not pixels.
- **Method (Firefox).** One fresh approach: launch `firefox.exe` directly with `Start-Process`, without Playwright, and read the Windows Application log.
- **Observation (Firefox).**
  - The direct launch fails: "side-by-side configuration is incorrect".
  - SideBySide event 33 (19:50:07, and again at 17:37, 18:19 and 18:29): "Dependent Assembly mozglue … version 1.0.0.0 could not be found", although `mozglue.dll` (656,896 B) is present. The bundled `chrome.exe` fails the same way: "Dependent Assembly 156.0.8078.4 … could not be found".
  - Both binaries are unsigned and have no Zone.Identifier. Their ACLs include `S-1-15-3-…` capability SIDs and a `CodexSandboxUsers` entry. **ASSUMPTION** (not verified): the agent sandbox interferes with side-by-side activation.
  - No system Firefox is installed.
- **Verdict.** WebKit PARTIALLY SETTLED, as WebKit on Windows only. Firefox **BLOCKED in this environment**; reason recorded. **RECOMMENDATION:** retry `npx playwright install firefox` and the smoke run from a normal terminal outside the agent sandbox, or with an installed release Firefox.
- **Affects.** AC-P0-9, P11 browser matrix (AC-P11-2, AC-P11-7), D9.

### U6 — Visual effect of the orientation conventions (F09)
- **Method.** Probe script `u16-u6-u12.mjs`. A per-render sampler logs the world quaternions of `GloveRig_left` and `GloveRig_right`, the camera quaternion and the gloves' camera-space positions. Three paths were driven: a view reset (`#trainee-lock` after a 220 px right-drag look), a click on abdomen-centre with `#work-action` = «إمساك السطح» (pinch), and the same with «جسّ خفيف» (press). The roll was then stepped 30 times (`[data-tool-roll="1"]`) with the scope inserted.
- **Observation.**
  - **Pinch:** in the 1.2 s after the click, the right glove rotated **125.7° between two consecutive rendered frames**; 3 frames had steps above 30°. Net change at the end: 0°.
    - A step that large needs a target rotation about 180° away. With `alpha = 1 − exp(−dt·15)` and `dt ≤ 0.08`, one step can cover at most ≈70 % of the gap. So the target was ≈180° away, consistent with the ≈180° branch difference in F09.
  - **Press:** largest step 92°, 3 frames above 30°, net 48.3°.
  - Neither click reached `grip` = attached within 5 s. The status showed the instruction text, so the attach moment itself was not isolated.
  - **View reset:** largest step 12.1°. The gloves were up to 0.182 m away from their final camera-space position (world-space lag) and settled within 5 mm after 181 ms.
  - **Roll:** 30 × 15° = 450°. The read-out showed 75, 150, −135, −60, 15, 90°, so the roll wraps and has no stop (unlimited roll confirmed).
  - Cross-body reach and the world-fixed `wristToTool` with a held tool were not exercised.
- **Verdict.** PARTIALLY SETTLED. The flips and the lag are now measurable without the P2 QA extension. The visual judgement ("reversed or twisted") needs the frame screenshots (`U6-abdomen-attached.jpg`, `U6-press-attached.jpg`; probe screenshots, not in the repository) and a §2.5 review.
- **Affects.** F09, P3 (G08, G09, G13), M6, P2 QA seam.

### U7 — Cost of the full-skin CPU raycasts
- **Method.** Headed Chrome.
  - Probe script `u7-raycast.mjs`: pointer-move handler time, measured from a window capture listener to a window bubble listener, and a CDP CPU profile at 100 µs sampling.
  - Probe script `u7b-raycast.mjs`: a probe-side wrapper on `SkinnedMesh.prototype.raycast` that counts and times every skin raycast; a frame-rate count during continuous hover; chest "touch" drags.
- **Observation.**
  - The skins hit-tested are `Clinical_anatomy_with_local_privacy` (105,822 triangles), `_1` (1,718), `PatientBrows` (648) and `PatientEyes` (1,060).
  - Handler time per idle mouse move: over the patient, median 41.4 ms (p95 44.6); off the patient (upper-left wall), 40.1 ms; at the chest workstation, 40.5 ms; looking up at the ceiling, 40.7 ms.
  - `surfaceHit` median 40.4–42.8 ms (n ≈ 400); almost all of it on the main skin.
  - CPU profile: 90.5–91.2 % of busy time inside `intersectObjects`. Top self time: `applyBoneTransform` 4.7–5.3 s and `multiplyMatrices` 3.8–4.3 s per 15 s profile.
  - Frame loop: 141.6 FPS with no input; 41.7 FPS while hovering (only 102 moves in 5 s; each event blocks the main thread ≈43 ms).
  - Why every ray pays the full cost: the main skin's bounding sphere has radius 0.928 m and contains the bedside camera, so no ray is rejected early. `SkinnedMesh.boundingBox` stays null, so there is no box early-out either. Every ray loops over all triangles with bone transforms (three r180 `SkinnedMesh.raycast`, SOURCE-INSPECTED at `NabdRuntime.js:68`).
  - Touch-follow: in the scripted chest trials the hand approached («الإيد بتقرب من نقطة التلامس») but the touch never attached, so the per-crew-update raycast of `updateBeforeHands` was not reached. Its cost per call is the same `surfaceHit` (SOURCE-INSPECTED, `BedsideInteraction.js` touch branch).
- **Verdict.** SETTLED for hover: ≈40 ms per move on this CPU. PARTIALLY for touch-follow: one ≈40 ms raycast per crew update is expected from the source, not measured.
  - **ASSUMPTION:** with a real mouse, Chrome coalesces pointer moves to one per frame, so hover caps the frame rate near 20–24 FPS.
- **Affects.** P5 contact budget, M7, D9 budget, F33.

### U8 — Rapier load time
- **Method.** Probe script `u8-load.mjs`.
  - Headed Chrome: 3 cold loads (new context each), 3 warm reloads, 3 cold loads with `vendor/rapier/rapier.mjs` aborted by `context.route`; run twice.
  - WebKit headless: 3 cold, 2 warm, 1 aborted.
  - "Ready" = `#model-status[data-state="ready"]`, timed by a MutationObserver; resource timing for `rapier.mjs`.
- **Observation (Chrome).**
  - Cold: 2,338, 1,823, 1,557 ms (series 2) and 2,352, 1,542, 1,544 ms (series 1).
  - Warm: 1,155–1,451 ms.
  - Rapier aborted: 1,458–1,528 ms. The forearm button stays disabled with the title «تعذّر تشغيل محرك التصادم», and the expected `Nabd could not load forearm collision` error is logged.
  - `rapier.mjs` transfer: 4,340,592 B in 13–33 ms.
  - Ready minus Rapier response end: 1,484–1,510 ms on the **first** cold load after browser launch; 34–47 ms on later cold loads; 31–246 ms warm.
  - The last GLB finishes at 0.81–1.74 s.
  - So GLB loading dominates. Rapier adds ≈1.5 s only to the first load in a fresh browser process; WebAssembly compile is the likely cause (ASSUMPTION).
- **Observation (WebKit).** Cold 2,490–2,759 ms; warm 2,289–2,500 ms; aborted 2,584 ms. 2 of 6 cold loads hit context loss: one took 17,684 ms, the other never became ready within 90 s.
- **Verdict.** SETTLED for this machine: far below the PROPOSED ≤10 s from a local server (the perf run's M10 agrees).
- **Affects.** M10, D9 load budget, AC-P0-8.

### U9 — Supervisor support reach from every trainee stance
- **Method.** Probe script `u9-support.mjs`, headed Chrome.
  - Part A: from five +X stations (−2 … +2 work steps of 0.26 m, then «اقترب»): grip (up to 5 tries), lift, «اطلب مساندة المشرف».
  - Part B: support set at the default station, then released (the support holds), then 40 work steps of 0.26 m around the whole loop (8.3 m); `supportGap`, label and side read at each step.
- **Observation (Part A).** z −0.445 and −0.185: out of reach 5/5. z 0.075: grip on the 2nd try. z 0.335 and 0.595: grip on the 1st try. Label after 690–709 ms, gap 0.0041–0.0042 m.
- **Observation (Part B).**
  - All 40 stations: `supportGap` 7.9e-6 – 1.7e-5 m, label «المشرف مسنّد الساعد», `aria-pressed` true. That covers the left side, foot end, right side and head end, once round.
  - The gap value changes exactly when the trainee crosses x < 0 (steps 8–24). The supervisor jumps to +X, from `side: -Math.sign(t.position.x)`, `NabdRuntime.js:5511`.
  - Screenshots: `U9-B-step02…40.jpg` (probe screenshots, not in the repository). Step 14 shows the supervisor leaning over the patient from +X.
- **Verdict.** SETTLED. Support reach holds from every walk station. Gripping is possible only from the +X side at z ≥ 0.075.
- **Affects.** P8, S3, F31.

### U10 — Scope feed cost
- **Method.** Probe script `u10-scope.mjs`, headed Chrome. S9 path: align, 6 × «أدخل الأداة» → 53 %, so `scope.live` true on 2 screens. Then 6 s idle and 6 s right-button look drag, with the scope inserted and then withdrawn to 0 % (`scope.live` false). A second insertion failed: alignment was lost after the drag, so run 2 has two more "not live" samples.
- **Observation.**
  - Idle: live 130.8 rAF FPS, 59.2 main renders/s, each paired with a scope render (0.26 ms mean CPU), against 143.2 rAF FPS and 48–60 renders/s not live. At the port station the app renders about 50–60 times per second even without the scope.
  - Look drag: live 75.0 FPS (frame interval median 13.9 ms, p95 27.7 ms), main render call p95 17.6 ms, app callback mean 9.69 ms. Not live: 81.3, 82.5, 81.8 FPS (p95 20.9 ms), render p95 9.5–12.1 ms, callback mean 7.98–8.26 ms.
- **Verdict.** SETTLED for this machine on a single live run: a live scope costs ≈8 % frame rate and ≈1.5 ms of app time per frame in the look drag.
- **Affects.** P7 budget, F20, D9.

### U11 — Standalone preview over `file://`
- **Method.** Probe script `u11-u21.mjs`. A copy of the preview, kept outside the repository, opened as `file://…/Nabd-Clinical-Simulator-v1.5-Preview.html?qa&debug=1`, and over http from `serve.mjs` (`/dist/…`).
- **Observation.**

  | Browser | Protocol | Ready |
  |---|---|---|
  | Chrome headed | file | 2,523 ms |
  | Edge headless | file | 2,728 ms |
  | WebKit | file | 3,155 ms |
  | WebKit | http | 3,144 ms |
  | Chrome headed | http | 2,588 ms |

  In every case: `__studioQA` present, forearm button enabled (so the Rapier `data:text/javascript;base64` dynamic import works), 3 asset groups true, supervisor visible, 0 console errors or warnings, 10 requests (the page plus `data:` URLs, nothing external). `roundRect` was called 57 times without error.
- **Verdict.** SETTLED for Chrome, Edge and WebKit-on-Windows. Firefox BLOCKED (U3). Safari on macOS UNKNOWN.
- **Affects.** AC-P0-5, offline delivery path.

### U12 — Appendix visible and selectable as intended
- **Method.** Smoke S7 (VERIFIED: appendix selected and isolated, only `appendix` visible, read-out «الزائدة الدودية»). In this run (probe script `u16-u6-u12.mjs`): S9 scope pose, then the scope camera and scope scene were captured from the render-target call, and every structure's centroid was projected into that camera.
- **Observation.**
  - The scope scene holds 47 meshes, including "Appendix training proxy", `appendix` and `mesoappendix`.
  - At the S9 pose (pitch 0, yaw 0, roll 0, 53 %) the proxy is in view at NDC (0.17, −0.31). The BodyParts3D `appendix` is **out of view** at NDC (−1.30, 1.41), 0.157 m away, and `mesoappendix` at (−1.25, 1.56).
  - After 30 roll steps (roll 90°) they are still out of view: appendix at (0.77, 2.34).
  - In view: peritoneal shell, liver, stomach, gallbladder, cecum proxies, small bowel loops A–C, appendix proxy, 3 landmarks, vena cava, pancreas, colon, left kidney, adrenals, ureters.
  - Screenshot: `U12-scope-monitor-at-S9-pose.jpg` (probe screenshot, not in the repository).
- **Verdict.** PARTIALLY SETTLED. Selectable and isolatable: yes. Seen by the scope at the default pose: no, only the illustrative proxy. A pitch/yaw sweep was not run. "As intended" is defined by the owner. CLINICAL REVIEW REQUIRED for the depiction.
- **Affects.** P10, CRC (D7), F29.

### U14 — WASD walking
- **Method.** Probe script `u14-u18.mjs`, headed Chrome, `visibilityState` "visible" and `hasFocus()` true; each key held 2 s (1 s for W/S at the workstation).
- **Observation.**

  | View | Key | Camera change |
  |---|---|---|
  | Free | D | z −1.255 m |
  | Free | A | z +1.26 m |
  | Free | W | x −0.085 m (stops at the bed edge) |
  | Free | S | x +0.71 m |
  | Workstation | D | 1.295 m along the loop, to «جهة الرأس» |
  | Workstation | A | 1.305 m back |
  | Workstation | W | 0.09 m (approach limit −0.09) |
  | Workstation | S | 0.34 m (to +0.25) |

  0 console errors. The smoke run's S8 agrees (1.20–1.27 m).
- **Verdict.** SETTLED. WASD works; R19 was a hidden-pane artefact.
- **Affects.** S8, R19.

### U15 — How the room GLBs look (F28)
- **Method.** Probe script `u15-room.mjs`: measured on the live scene graph. Visuals: the smoke run's S6 preset screenshots (`baseline-p0/smoke/serve-chrome-*/S6-camera-*.jpg`). *Added in this copy:* after the evidence was trimmed, the repository keeps these images for the headed run only: [evidence/baseline-p0/smoke/serve-chrome-headed/](../evidence/baseline-p0/smoke/serve-chrome-headed/) (`S6-camera-*.jpg`).
- **Observation.**
  - The 4 GLBs (table base 45 meshes, table top 69, light/pendant 129, anesthesia 112) have **no normals and no UVs on any mesh**; 354 of the 355 use `flatShading` materials.
  - Front wall: the 3 planes at z 4.8 (2.45×3.9, 2.45×3.9, 2.26×1.42) have world normal (0, 0, +1) facing away from the room centre, with `FrontSide` material. They are back-face-culled when seen from inside. The other three walls face inward.
  - `anesthesia_screen_glass` (BufferGeometry) has a canvas texture but **no UV attribute**.
  - Floor plane top y −0.025. Lowest points: table base +0.014 (3.9 cm gap), anesthesia unit +0.035 (6.0 cm), supervisor +0.0007 (2.6 cm). Procedural equipment groups bottom out at y 0.002–0.0625, gaps 2.7–8.75 cm.
- **Verdict.** SETTLED as data (the audit's DATA-DERIVED values confirmed at runtime). How visible it is remains a §2.5 / D10 review item.
- **Affects.** P4 (G01), D10.

### U16 — Supervisor intersecting the bed, the patient and the trolley
- **Method.** Probe scripts `u16-u6-u12.mjs` and `u2-touch-u16b.mjs`.
  - Supervisor skinned vertices (every 2nd: 38,083) are tested against three things: table-top mesh boxes; a 2 cm patient grid holding the minimum and maximum y of the skinned skin per cell, counting points more than 1 cm inside the span; and the boxes of equipment meshes under 2 m.
  - States: rest, workstation stand (x −1.94, z 0.25), support tilt from either side.
  - Box tests are upper bounds.
- **Observation.**
  - Support tilt, supervisor at −X (trainee +X), rotation.x 0.42: 2,593 points inside the patient span, up to 0.215 m below the skin top (e.g. (0.038, 0.939, 0.083)); 2,296 inside table-top parts (central carrier 814, deck 602, seat pad 368, back pad 208…), up to 0.075 m below a pad top.
  - Supervisor at +X (trainee at −X): 2,126 points in the patient span and 2,306 in table-top parts.
  - Workstation stand: inside the back-table trolley (RoundedBox 1.12×0.045×0.68 at x −3.13…−1.97: 252 points = top 187, second layer 26, rails 31, other parts 8) and the Mayo tray moved to x −1.61 (135 points = 78 + 26 + 31): 387 points in total.
  - Rest pose: the hands (meshes `ClinicalPatientSurface_6` and `_9`) are inside the tray top (52 points).
  - Screenshots: `U16-*.jpg` and `U9-B-step14.jpg` (probe screenshots, not in the repository).
- **Verdict.** SETTLED as a geometric indication that the supervisor body passes through the patient and the bed during the support tilt, and through the trolley at the workstation stand. Visual confirmation from a QA camera is a §2.5 item.
- **Affects.** P8, D1 A+, U22.

### U17 — Vite build and the standalone preview
- SETTLED by the lead. This run recreated the preview afterwards (see "How the probes ran").
- *Added in this copy:* the post-fix Vite build of 14 November (20:05, after the probe) emptied `dist/` again, so the preview recreated at 19:44 is no longer in `dist/`; it has to be regenerated after every Vite build (see [P0-completion.md](P0-completion.md), "Deviations and known issues").

### U18 — Hand lag and jitter from the 15 ms crew throttle on high-refresh displays
- **Method.** Probe script `u14-u18.mjs`. On this 144 Hz panel: hold D 3 s in the free view; per rendered frame, project the left glove to screen pixels. Configurations, 2 runs each:
  - native;
  - rAF paced to every 2nd vsync (≈72 Hz);
  - rAF paced to every 3rd vsync (≈48 Hz, where the throttle never skips);
  - native with `reducedMotion: 'reduce'` (crew update every frame, `alpha = 1`).
- **Observation.**

  | Configuration | Stale-hand share of camera-moving frames | Second difference, median / p95 / max | Rendered FPS |
  |---|---|---|---|
  | Native 144 Hz | 0.449–0.454 | 3.9–4.0 / 8.5 / 9.7 px | 78 |
  | ≈72 Hz | 0.50 | 8.2 / 8.3 / 8.5 px | 72 |
  | ≈48 Hz | 0 | 0 / 0.4 / 3.1 px | 48 |
  | Reduced motion | 0 | 0 px | 85–87 |

  The glove's camera-space x range was 44.5 mm native and 35.8 mm at 48 Hz (the lag from easing). Camera speed 0.39 m/s average.
- **Verdict.** SETTLED. On displays above ≈66 Hz the throttle (`NabdRuntime.js:5984`, `now − crewTime > 15`) leaves the hands un-updated in about half the moving frames, a measurable 4–9 px stutter.
- **Affects.** P3 hand stability, M4, F01.

### U21 — Safari / WebKit compatibility (first look, WebKit on Windows)
- **Method.** Probe script `u11-u21.mjs`: feature checks, plus probe-side counters on `roundRect` and `showModal`, then a drill and the vitals dialog. Probe script `u21b-webkit-blank.mjs`: `gl.readPixels` on a 9×5 grid straight after the app's own `render()`. Probe script `u21c-webkit-oscapture.mjs`: OS screen capture of the headed WebKit window rectangle. Probe script `u21d-webkit-resize.mjs`: viewport resize only, in V1.
- **Observation (features, WebKit 27.2).**
  - UA "Version/27.2 Safari/605.1.15"; renderer reported as "Apple GPU" (masked).
  - Present: `roundRect`, WebGL2 (MAX_DRAW_BUFFERS 8), `showModal`, `Array.at`, `Object.hasOwn`, `dvh`, `backdrop-filter` (prefixed and unprefixed), ResizeObserver, Pointer Events and pointer capture, WebAssembly, `data:` URL dynamic import, `requestFullscreen` and `webkitRequestFullscreen`.
  - Absent: `overscroll-behavior-x` (`CSS.supports` false; cosmetic) and `performance.memory` (debug overlay only; no error).
- **Observation (exercised).**
  - `roundRect` called 57× with 0 errors (Chrome: 57×, 0 errors).
  - The drill session opened (Rapier WebAssembly works).
  - The vitals dialog opened through `showModal` (1 call).
  - 0 console errors in these runs; context loss in 2 of 6 cold loads (U8).
- **Defect (WebKit on Windows).** After any WebGL canvas resize, the window shows the page background instead of the 3D view.
  - V1 renders. V2, V3, V4, S2, S3, S4-complete and S7 are blank: screenshot viewport standard deviation 0.5–6.2 in both headless and headed WebKit; the OS capture of the real headed window confirms it (0.2 vs 85.8).
  - Meanwhile the drawing buffer holds the correct image: the readPixels grid matches Chrome's values in V3 and V4 exactly and V1 and V2 to within ±2.
  - A pure viewport change in V1 (1440×900 → 1440×860) reproduces it: blank at 0.6, and still blank after restoring 1440×900. Chrome stays at 83–98.
  - *Added in this copy:* the committed WebKit reference images show this: [V2](../evidence/baseline-p0/visual/serve-webkit-headless/V2-forearm-drill-after-approach.jpg), [V3](../evidence/baseline-p0/visual/serve-webkit-headless/V3-room-camera-room.jpg) and [V4](../evidence/baseline-p0/visual/serve-webkit-headless/V4-anatomy-full.jpg) in `evidence/baseline-p0/visual/serve-webkit-headless/` show the page background where the 3D view should be, while [V1](../evidence/baseline-p0/visual/serve-webkit-headless/V1-default-bedside.jpg) and the WebKit tray images `smoke/serve-webkit-headless/S5-*-tray.jpg` render. Checked for this copy by eye (V3) and by the grey-level standard deviation of a 1050×520 crop of the 3D area: WebKit V1 50.1, V2 8.8 (the crop reaches into the drill panel below the shorter V2 view), V3 1.1, V4 2.9, trays 52.3–53.6; headed Chrome V1–V4 31.8–65.7.
- **Verdict.** PARTIALLY SETTLED: the APIs work in WebKit 27.2 on Windows, and there is a presentation defect after resize in this WebKit port. Whether Safari on macOS shows it is UNKNOWN; it needs a Mac or a real-device service. The smoke run's WebKit "V1–V4 PASS" is counter-based and should be re-read in this light.
- **Affects.** P11 Safari check, AC-P11-4 (context loss) and AC-P11-7, AS15.

### U23 — VS Code Live Server
- **Method.** Probe script `u23-liveserver.mjs`.
  - The owner has `ritwickdey.liveserver-5.7.10` installed (in his VS Code extensions folder, `%USERPROFILE%\.vscode\extensions`). Its bundled server `node_modules/live-server` 2.2.0 (send 0.17.2, mime 1.6.0) was started from a probe script with the extension's `generateParams` defaults: root = project folder, `wait` 100, ignore `.vscode/**`, `**/*.scss`, `**/*.sass`, `**/*.ts`, `cors` false.
  - Deviation: host 127.0.0.1 and port 4319, instead of the extension's 0.0.0.0:5500.
  - VS Code itself was not driven.
- **Observation.**
  - Chrome headed: ready 2,852 ms, 33 responses, 0 failed, 0 foreign. 21 `/src` modules with 200 and `application/javascript; charset=UTF-8`. 9 GLBs with 200 and `model/gltf-binary`. `rapier.mjs` 200, `application/javascript`. HTML injected with the reload script (WebSocket `ws://127.0.0.1:4319//ws`). M11 = 0, no warnings. Forearm enabled, supervisor visible.
  - WebKit: the same, ready 2,685 ms.
  - Standalone preview through Live Server (Chrome): works, but ready takes 11,958 ms, against 2.6 s through `serve.mjs`. live-server reads the 36 MB file synchronously to inject the script.
  - Note: Live Server reloads the page when watched files change, for example when `dist/` is rebuilt.
- **Verdict.** SETTLED, emulated with the owner's own extension code. The app runs correctly under Live Server.
- **Affects.** The owner's "Go Live" path; not a P0 gate.

## Files

Probe scripts were run from a temporary folder and are not part of the repository. The raw data and screenshots below were written next to them and are not part of the repository either; the names are kept so that the observations above can be traced to the records that produced them.

- Scripts: `lib.mjs`, `explore.mjs`, `explore2.mjs`, `u2-touch-u16b.mjs`, `u7-raycast.mjs`, `u7b-raycast.mjs`, `u8-load.mjs`, `u9-support.mjs`, `u10-scope.mjs`, `u11-u21.mjs`, `u14-u18.mjs`, `u15-room.mjs`, `u16-u6-u12.mjs`, `u21b-webkit-blank.mjs`, `u21c-webkit-oscapture.mjs`, `u21d-webkit-resize.mjs`, `u23-liveserver.mjs`, `imgstat.py`.
- Data (JSON): `U2-U16b.json`, `U7-raycast.json`, `U7b-raycast.json`, `U8-load.json`, `U9-support.json`, `U10-scope.json`, `U11-U21.json`, `U14-U18.json`, `U15-room.json`, `U16-U6-U12.json`, `U21b-webkit-blank.json`, `U21c-webkit-oscapture.json`, `U21d-webkit-resize.json`, `U23-liveserver.json`, `explore.json`, `explore2.json`.
- Screenshots: U2, U6, U7, U9 (A and B), U10, U11, U12, U14, U16, U21, U21b, U21c (OS captures, PNG), U21d, U23.
- In the repository and used by this table: [evidence/baseline-p0/RESULTS.md](../evidence/baseline-p0/RESULTS.md), [evidence/baseline-p0/perf/](../evidence/baseline-p0/perf/), [evidence/baseline-p0/smoke/](../evidence/baseline-p0/smoke/), [evidence/baseline-p0/visual/](../evidence/baseline-p0/visual/).
