# P0 baseline — browser smoke, visual and performance results (T1 steps 6–8)

Run on 2026-11-14 against the **unmodified** v1.5 code (branch `t1-baseline-f19`, baseline `acdab52`; the F19 fix is not applied). No file under `src/`, `index.html`, `assets/`, `vendor/`, `scripts/` or `vite.config.mjs` was changed. Every result below was executed and observed (VERIFIED) unless it says otherwise.

## 1. What ran

| Item | Detail |
|---|---|
| Machine | ASUS TUF Gaming F15 FX507ZC4; Intel Core i5-12500H (16 logical CPUs); 15.6 GB RAM; Windows 11 Pro 10.0.26300; on mains power (Win32_Battery status 2, 100 %), power scheme "Turbo" |
| GPU / display | Browsers render on **Intel Iris Xe** (`ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)`, driver 32.0.101.6790); the NVIDIA RTX 3050 Laptop GPU is present but not used by the browsers. Internal display 1920×1080 at 144 Hz |
| Node / tools | Node v26.13.1; `@playwright/test` 1.64.1; three 0.180.0; vite 6.4.6 |
| Browsers | Google Chrome 157.0.8103.51 (`channel: 'chrome'`); Microsoft Edge 157.0.4341.46 (`channel: 'msedge'`); Playwright WebKit 27.2 (**WebKit on Windows — an approximation of Safari's engine, not Safari**; it reports its renderer as "Apple GPU"); Playwright Firefox build 1555: **BLOCKED** (cannot launch here) |
| Viewport | 1440×900, devicePixelRatio 1, `prefers-reduced-motion: no-preference` (reported `false` in every run) |
| Servers | `node scripts/serve.mjs` with `PORT=4301` (127.0.0.1); built app: `npx vite preview --host 127.0.0.1 --port 4302 --strictPort` on the existing `dist/` from the lead's `npm run build` (not rebuilt here) |
| Entry | `/?qa&debug=1`, ready marker `#model-status[data-state="ready"]` |
| Files created | `tests/browser/playwright.config.mjs`, `tests/browser/smoke.spec.mjs`, `tests/browser/SMOKE_PROTOCOL.md`, `tests/browser/perf-capture.mjs`; `package.json` gained only `"smoke": "playwright test -c tests/browser/playwright.config.mjs"` |
| `npm test` | Re-run with the browser files present: **21 tests, 21 pass, 0 fail** (`npm-test-with-browser-files.txt`); `node --test` does not collect `*.spec.mjs`, `*.config.mjs` or `perf-capture.mjs` |

Runs (logs and Playwright JSON reports in `smoke/logs/`):

| Run | Server | Projects | Result line |
|---|---|---|---|
| `serve-run1` | serve.mjs :4301 | chrome, webkit, edge (headless), firefox | 47 passed, 3 flaky, 1 failed, 17 skipped (12.2 min) |
| `serve-run2` | serve.mjs :4301 | same | 48 passed, 2 flaky, 1 failed, 17 skipped (10.6 min) |
| `serve-chrome-headed` | serve.mjs :4301 | chrome, visible window (`NABD_SMOKE_HEADED=1`) | 17 passed (2.7 min) |
| `vite-run1` | vite preview :4302 | chrome, webkit, edge | 46 passed, 4 flaky, 1 failed (12.4 min) |
| `vite-run2-S1` | vite preview :4302 | chrome, webkit, edge, S1 only | 3 passed |

"Passed" counts the S5 scissors and needle-holder tests, which are marked `test.fail` (known failure F19) and therefore pass while the defect exists. "Flaky" = failed once, passed on the single WebKit retry. The QA JSON and screenshots in `smoke/<server>-<project>-<mode>/` and `visual/…` are from the last run of each configuration (serve-run2, serve-chrome-headed, vite-run1, and vite-run2-S1 for S1).

## 2. Pass / fail matrix

Same outcome in both serve runs and in the vite run unless noted. **PASS** = all checks passed with M11 = 0. **KF** = known failing check (F19), reproduced.

| Flow | Chrome (serve) | Chrome headed (serve) | Edge (serve) | WebKit on Windows (serve) | Chrome (vite) | Edge (vite) | WebKit (vite) | Firefox |
|---|---|---|---|---|---|---|---|---|
| S1 Boot and assets | PASS | PASS | PASS | PASS | PASS (×2) | PASS (×2) | PASS (×2) | BLOCKED |
| S2 Forearm drill | PASS | PASS | PASS | **FAIL** (R8 check) | PASS | PASS | **FAIL** (R8 check) | BLOCKED |
| S3 Support and release | PASS | PASS | PASS | PASS | PASS | PASS | PASS | BLOCKED |
| S4 Training session, 5 steps | PASS | PASS | PASS | PASS | PASS | PASS | PASS | BLOCKED |
| S5 grasper | PASS | PASS | PASS | PASS | PASS | PASS | PASS | BLOCKED |
| S5 scope | PASS | PASS | PASS | PASS (retry in run1) | PASS | PASS | PASS (retry) | BLOCKED |
| S5 scissors | KF: 4 NaN | KF: 4 NaN | KF: 4 NaN | KF: 4 NaN | KF: 4 NaN | KF: 4 NaN | KF: 4 NaN | BLOCKED |
| S5 needle holder | KF: 4 NaN | KF: 4 NaN | KF: 4 NaN | KF: 4 NaN | KF: 4 NaN | KF: 4 NaN | KF: 4 NaN | BLOCKED |
| S5 staff handover | PASS | PASS | PASS | PASS | PASS | PASS | PASS (retry) | BLOCKED |
| S6 Room and presets | PASS | PASS | PASS | PASS | PASS | PASS | PASS | BLOCKED |
| S7 Anatomy | PASS | PASS | PASS | PASS | PASS | PASS | PASS | BLOCKED |
| S8 Hands and locomotion | PASS | PASS | PASS | PASS (retry in run1) | PASS | PASS | PASS (retry) | BLOCKED |
| S9 Port and scope | PASS | PASS | PASS | PASS | PASS | PASS | PASS | BLOCKED |
| V1–V4 captures | PASS | PASS | PASS | PASS (V2 retry run1; V1, V3 retry run2) | PASS | PASS | PASS (V2 retry) | BLOCKED |

INV-10: zero requests outside the app origin in every S1 run. HTTP: served tree 21 `/src/**/*.js` modules, 9 GLBs and `vendor/rapier/rapier.mjs`, all 200, no failed request (R3 reproduced). Vite build: one bundle `assets/index-B9Tyn-f5.js`, the same 9 GLBs and `vendor/rapier/rapier.mjs`, all 200 (the "21 modules" check does not apply to a bundled build).

## 3. Known failure (F19, R20 reproduced)

Fresh load, `#training-tool` set, `#trainee-tray-view` opened, 2.5 s wait; console errors containing "NaN" (`S5-summary.json` per project):

| Tool | Chrome | Chrome headed | Edge | WebKit | Chrome / Edge / WebKit on the Vite build |
|---|---|---|---|---|---|
| grasper | 0 | 0 | 0 | 0 | 0 / 0 / 0 |
| scope | 0 | 0 | 0 | 0 | 0 / 0 / 0 |
| scissors | **4** | **4** | **4** | **4** | **4 / 4 / 4** |
| needleHolder | **4** | **4** | **4** | **4** | **4 / 4 / 4** |

The needle holder, SOURCE-INSPECTED only in the audit, is now **VERIFIED**: it produces the same four `computeBoundingSphere(): Computed radius is NaN` errors as the scissors. The tray screenshot (`S5-scissors-tray.jpg`) shows only the finger rings, no blades, as in `evidence/10`. Both tests carry `test.fail` with the annotation "F19 — fixed in T1 step 10"; after the fix they will report "expected to fail but passed" until the tools are removed from `F19_KNOWN` in `smoke.spec.mjs`.

## 4. Readouts and differences from the audit (R1–R21)

| Flow | Observed (Chrome unless stated) | Compared with the audit |
|---|---|---|
| S1 | ready 2.5–3.3 s in the smoke runs; `supervisorVisible` true; `#forearm-practice` enabled when ready (ready is set after Rapier loads); 0 console messages of any level | R1–R3 reproduced |
| S2 | The first wrist click (before «اقترب») starts a reach; the glove does not close and the 3.2 s hold timeout reports «خارج مدى الإيد · غيّر وقفتك أو اقترب» after 3.4–3.6 s (Chrome, Edge). «اقترب» moves the trainee 0.055 m (x 0.76 → 0.705). Grip reached; lift 0.109–0.110 m; `forearm.overlap` 0 | R8 reproduced in Chrome and Edge, but the "out of reach" is a timeout, not an immediate refusal. **WebKit differs:** the same click grips the wrist before «اقترب» (both serve runs and the vite run), so the R8 check fails there; the rest of S2 passes in WebKit |
| S2/S3 grip | **New observation:** after «اقترب», a wrist click sometimes leaves the glove stalled about 13 cm short of the wrist (glove wrist at about [0.452, 1.102, 0.093]) until the hold timeout. In debugging: 2 of 4 and 1 of 6 first clicks in Chrome headless; in one page three clicks at the same pixel all failed. The suite retries at small pixel offsets (up to 5) and records every attempt (`gripAttempts`); recorded needs: Chrome headed S2 2 attempts, Edge S3 2, vite Chrome S3 2, vite Edge S3 2, all others 1. Cause UNKNOWN (hypothesis, SOURCE-INSPECTED only: the forearm collision `stops` path in `ForearmContact`) | Not seen in the audit |
| S3 | `supportGap` 0.0003–0.0010 m (< 0.020); label «المشرف مسنّد الساعد»; after release the wrist stays at the lifted height (+0.109 m over rest); after «إنهاء المساندة» it returns exactly to rest | R11 reproduced |
| S4 | All five steps complete with tray source: phase `complete`, results monitor/pickup/aim/deposit/wrist, «5 من 5 مهارات مكتملة · محاولات الإعادة 0». Started with `#training-action`. Golden trace (20 events): `simulation_started@idle, camera_changed@idle, simulation_stage_changed@monitor, checklist_item_completed@monitor, simulation_stage_changed@pickup, camera_changed@pickup, instrument_picked@pickup, checklist_item_completed@pickup, simulation_stage_changed@aim, checklist_item_completed@aim, simulation_stage_changed@deposit, instrument_released@deposit, simulation_stage_changed@wrist, checklist_item_completed@wrist, camera_changed@wrist, patient_interaction@wrist, patient_interaction@wrist, checklist_item_completed@wrist, simulation_stage_changed@complete, simulation_completed@complete` — identical in Chrome, Edge, WebKit and on the Vite build | Steps 2–5 were UNKNOWN; now VERIFIED. Note the trace logs `checklist_item_completed@wrist` for the deposit step (stage already advanced when it is recorded) |
| S5 staff | `#training-source` = staff: after SpO₂ the supervisor offers the grasper (`crew.mode` `offered`, `offer` 0.999 within 10 s), M11 = 0. Pickup from the supervisor's hand not exercised | Handover was UNKNOWN; offer now VERIFIED, the hand-to-hand pickup still UNKNOWN |
| S6 | Room view ends the drill (`forearm` null, button `aria-pressed=false`) — F31 teardown observed. All 11 presets select. **New observation:** at 1440×900 `#camera-overview` «الجسم كامل» is covered by `#anatomy-toggle` (a pointer click hits the anatomy button; the suite records this and clicks the preset through the DOM). V3 room preset: 1,528 draw calls, 462,240 triangles | R12 correction confirmed; R13 reproduced; the overlap is also visible in the audit image `evidence/06-room-overview.jpg` but was not reported |
| S7 | 35 keys, «35 بنية معروضة», BodyParts3D · DBCLS · CC BY 4.0 shown; appendix selected and isolated → only `appendix` visible, readout «الزائدة الدودية»; full view after reset: 35 visible, 541–542 draw calls | R14 reproduced; appendix selection and isolation now VERIFIED (its visual clarity is a review item) |
| S8 | Hand buttons and Q/E toggle `aria-pressed` both ways; INV-3 lateral ordering at rest: left glove camera-space x −0.175, right +0.175; hold D 2 s in the free view moved the camera 1.20–1.27 m (z 0.15 → −1.05…−1.12, x and y unchanged); work step 0.26 m; «الجانب المقابل» walked 1.54 m from «يسار المريض» to «يمين المريض» | R18 reproduced; Q/E and WASD (U14) were UNKNOWN, now VERIFIED in a visible (headed) and a headless window |
| S9 | Scope picked from the tray, `#open-tool-field`, aligned at the port (`instrument.aligned` true), 6 × «أدخل الأداة» → 53 % (travel 0.072 m), roll +15°, `scope.live` true on 2 screens, «صورة مباشرة», monitor look on, 12 non-black scope pixels | Was UNKNOWN; now VERIFIED |
| Console | Zero console errors in every flow except the F19 tools, in Chrome, Edge and WebKit (apart from the WebKit boot incidents in Section 7, whose attempts were retried); zero warnings at boot (S1; warnings are not counted in the other flows) | R2 reproduced |

## 5. Visual baselines V1–V4 (AC-P0-7)

Official set: `visual/serve-chrome-headed/` (installed Chrome, visible window, 2 s settle after `workMoving()` false and a steady camera). Each image has a JSON with `getCamera()`, `cameraRotation`, `cameraFov` and the overlay counters. The same captures exist for Chrome/Edge headless and WebKit (serve and Vite) for comparison.

| View | Draw calls | Triangles | R6 range | Camera position | Rotation (x, y, z) | FOV |
|---|---|---|---|---|---|---|
| V1 default bedside | 1,206 | 387,848 | 1,167–1,206 / 378,534–387,848 — inside (upper end) | [0.735, 1.6, 0.15] | [−0.6, 1.5708, 0] | 62 |
| V2 drill after «اقترب» | 479 | 299,400 | 479–503 / 299,400–303,548 — inside (lower end) | [0.705, 1.6, 0.0749] | [−0.996, 1.5708, 0] | 52 |
| V3 room `#camera-room` | 1,528 | 462,240 | 1,520 / 462,240 — draw calls **+8 (+0.5 %)**, triangles equal; cause UNKNOWN | [0, 1.6, 4.24] | [−0.1427, 0, 0] | 62 |
| V4 anatomy full view | 542 | 464,067 | 542 / 464,067 — equal | [0.3926, 1.6818, −0.2758] | [−1.0119, 1.4276, 0] | 49 |

Every browser gives the same V1–V3 counters. V4 headless gives 541 / 464,003 with the camera 1 mm closer: the headed window shows a classic vertical page scrollbar (the page is taller than 900 px), so the canvas is narrower and the anatomy framing (`frameAnatomy`, aspect-dependent) differs slightly. V3 shows the same composition as `evidence/06-room-overview.jpg` (compared by eye by the test author, not by a §2.5 reviewer), which settles the 09 §2.3 ASSUMPTION that `#camera-room` is the audit's room view; the audit overlay there reads Draw 1520, now 1528.

## 6. Performance (AC-P0-8, 09 §2.4)

Script `tests/browser/perf-capture.mjs`; data `perf/chrome-headed.json` (per run, per segment, with hardware identification) and `perf/chrome-headed-raf-intervals.json` (every rAF interval); log `perf/perf-run.log`. Installed Chrome 157.0.8103.51, **headed** (visible window at 0,0, `document.visibilityState` "visible" and `hasFocus()` true at the start and end of every segment), launch args `--disable-renderer-backgrounding --disable-background-timer-throttling --disable-features=CalculateNativeWinOcclusion --window-position=0,0`, viewport 1440×900, DPR 1, display 144 Hz, Iris Xe through ANGLE D3D11, mains power, reduced motion off, no extensions (Playwright profile), no other browser test running at the time. Protocol: fresh context and load per view and run, 10 s settle, 30 s idle, 30 s active; 3 runs. Window placement relative to other windows was not controlled (the timing flags keep the frame loop running even if covered). This machine has not been confirmed as the D9 reference or minimum machine, and the D9 budget is not confirmed, so **no threshold is applied**.

**M7 and render rate, median of the three runs (Chrome, headed):**

| View | Segment | rAF rate (FPS) | Render rate (FPS) | M7 median (ms) | M7 p95 (ms) | Worst p99 / max of 3 runs (ms) | M8 draw calls (median) | M9 triangles (median) |
|---|---|---|---|---|---|---|---|---|
| V1 bedside | idle | 133.9 | 12.0 | 7.0 | 13.9 | 20.8 / 21.2 | 1,206 | 387,848 |
| V1 bedside | active (look drag) | 110.2 | 78.4 | 7.0 | 14.2 | 21.0 / 41.9 | 1,150 (691–1,206) | 380,760 |
| V2 drill | idle | 144.0 | 12.0 | 6.9 | 7.2 | 7.3 / 14.1 | 479 | 299,400 |
| V2 drill | active (grip held, lift up/down) | 85.8 | 81.6 | 13.8 | 20.8 | 21.0 / 90.4 | 479 | 299,400 |
| V3 room | idle | 135.7 | 12.0 | 7.0 | 13.6 | 13.9 / 21.0 | 1,528 | 462,240 |
| V3 room | active (orbit drag) | 69.5 | 69.4 | 13.9 | 27.8 | 27.9 / 62.5 | 1,462 (1,189–1,553) | 437,200 |
| V4 anatomy | idle | 144.0 | 12.0 | 6.9 | 7.2 | 7.3 / 14.3 | 542 | 464,067 |
| V4 anatomy | active (orbit drag) | 108.8 | 107.5 | 7.0 | 14.0 | 20.6 / 28.0 | 506 (465–652) | 459,635 |

Readings, in plain terms:
- **Idle:** the loop runs at the display rate (133–144 rAF/s on the 144 Hz panel; this is also a high-refresh capture for U18) while the app renders only about **12 frames per second**, which is the vitals repaint (F23) — confirmed by the render counter.
- **Active:** the run-to-run spread is small (rAF rate within ±2 FPS per view). In V1 the look drag does not make the app render every frame (78 of 110 frames per second rendered); in V2–V4 nearly every frame renders. The rAF intervals cluster on multiples of the 6.9 ms vsync (13.8–13.9 ms ≈ 72 FPS cadence, 27.8 ms ≈ 36 FPS). The heaviest view is V3 (room, orbit): 69.5 FPS, p95 27.8 ms. Frames over 33 ms per 30 s active segment: 0–3.
- Measured against the PROPOSED M7 threshold (median ≤ 16.7 ms, p95 ≤ 33.3 ms) every view would be inside it on this machine, but the threshold is not applied (see above).
- The overlay FPS ("FPS" in `?debug=1`) equals the rAF rate, not the render rate, as 09 §2.4 predicted from the source (VERIFIED: the overlay showed 132–144 in idle while 12 FPS were rendered).
- Input pacing: the active segments sent 764–1,711 pointer moves in 30 s (about 25–57 per second; each move is a round trip to the browser).
- One V2 attempt (run 1) failed and was repeated: three wrist clicks in a row stalled (the grip stall in Section 4); recorded in `failedAttempts`.

**M10 load to ready** (navigation start → `#model-status[data-state="ready"]`; ready is set after Rapier has loaded, so "→ `#forearm-practice` enabled" gives the same number in every load):

| Load | Run 1 | Run 2 | Run 3 | Transfer |
|---|---|---|---|---|
| Cold (new browser context, empty HTTP cache) | 2,476 ms | 1,680 ms | 1,621 ms | 26,892 KB, 32 resources |
| Warm (reload in the same context) | 1,340 ms | 1,349 ms | 1,209 ms | 20,911 KB |
| Per-view loads during the M7 runs (warm OS file cache, new context) | 1,524–1,863 ms | | | |

DOMContentLoaded 0.37–0.65 s. The first cold load includes browser start-up effects; the OS file cache was warm for all of them (the server reads local files). From the local server all loads are far below the PROPOSED 10 s.

**WebKit on Windows (approximation, not Safari), one run, headless** (`perf/webkit-on-windows-headless.json`). Playwright WebKit 27.2, renderer reported as "Apple GPU" (masked), headless (not vsync-bound to the panel; its rAF timestamps have 1 ms resolution):

| View | Idle rAF / render FPS | Idle M7 median / p95 (ms) | Active rAF / render FPS | Active M7 median / p95 (ms) | Draw / triangles (idle) |
|---|---|---|---|---|---|
| V1 | 45.0 / 10.8 | 15 / 47 | 28.8 / 28.7 | 32 / 47 | 1,206 / 387,848 |
| V2 | 55.2 / 10.7 | 16 / 30 | 17.4 / 17.4 | 62 / 64 | 479 / 299,400 |
| V3 | 52.6 / 10.8 | 15 / 32 | 21.4 / 21.3 | 47 / 48 | 1,528 / 462,240 |
| V4 | 55.3 / 10.7 | 16 / 30 | 22.4 / 22.3 | 46 / 48 | 541 / 464,003 |

WebKit loads: cold 2,729 ms, warm 2,522 ms (26,892 KB both times: the warm reload re-transferred everything). The first V1 attempt lost its WebGL context and never became ready within 90 s (repeated); the V4 page also logged `WebGL: context lost.` and became ready only after 17.8 s, so its numbers come from a recovered context. These figures describe Playwright's WebKit build on this Windows machine only; they say nothing about Safari on a Mac.

## 7. What did not work

- **Firefox: BLOCKED.** `browserType.launch: spawn UNKNOWN` for `…\ms-playwright\firefox-1555\firefox\firefox.exe -no-remote -headless -profile … -juggler-pipe -silent`. A second attempt with an explicit `executablePath` failed the same way. No system Firefox is installed. The `firefox` project skips all 17 tests with this reason; the error text is in `smoke/serve-firefox-headless/firefox-launch.json`. D9 lists Firefox as expected, so this remains open for P11.
- **WebKit on Windows boot instability.** In a dedicated loop of 10 boots, 2 logged `WebGL: context lost.`: one never reached ready (and `page.evaluate` hung), the other became ready after 18.6 s instead of about 4 s. In the three suite runs, 9 of about 60 WebKit page loads failed in the same way (7 never reached ready within 60 s; 2 had a button click that never became "stable", i.e. no frames); their console was not captured because those attempts failed before saving. The `webkit` project therefore has one retry; every retried test passed on its retry. Chrome and Edge have no retry and had no unexpected failure in any run. Whether Safari on macOS shows this is UNKNOWN (U21). The app has no `webglcontextlost` handling (relevant to AC-P11-4).
- **WebKit S2 R8 check fails** deterministically (the pre-approach click grips instead of reporting out of reach); see Section 4.
- **Grip stall after «اقترب»** (all Chromium browsers, intermittent); handled by recorded retries, cause UNKNOWN.
- **`#camera-overview` covered by `#anatomy-toggle`** at 1440×900 in room view.
- The first attempt at an official run was stopped and discarded after the grip stall was found; its files were deleted before the recorded runs. `TaskStop` did not stop child processes on Windows, so the leftover Playwright, `serve.mjs` (4301) and `vite preview` (4302) processes were stopped by PID; the lead's own `serve.mjs` on port 4190 was left running.
- `npm run build` was not re-run here; the Vite runs used the lead's existing `dist/` (built from the same unmodified tree).

## 8. Files

- `smoke/<server>-<project>-<mode>/`: `S1-boot.json` … `S9-port-scope.json`, `S5-<tool>.json`, `S5-summary.json`, `S5-staff-handover.json`, screenshots (`S2-after-approach.jpg`, `S2-grip-lift.jpg`, `S3-after-release-supported.jpg`, `S4-*.jpg`, `S5-<tool>-tray.jpg`, `S6-camera-*.jpg`, `S7-*.jpg`, `S8-other-side.jpg`, `S9-*.jpg`)
- `smoke/logs/`: list-reporter logs and Playwright JSON reports of the five runs
- `visual/<server>-<project>-<mode>/V1…V4.{jpg,json}`
- `perf/chrome-headed.json`, `perf/chrome-headed-raf-intervals.json`, `perf/webkit-on-windows-headless.json`, `perf/webkit-on-windows-headless-raf-intervals.json`, `perf/perf-run.log`
- `npm-test-with-browser-files.txt`
- Evidence size is about 32 MB before the performance files (mostly JPEG screenshots); the lead decides what to commit.

## Evidence kept in the repository (trimmed by the lead, 2026-11-14)

To keep the repository small, screenshots are committed only for the canonical runs:
- `smoke/serve-chrome-headed/`: every flow, visible Chrome on the Iris Xe GPU.
- `visual/serve-chrome-headed/`: the V1–V4 reference images.
- `visual/serve-webkit-headless/`: V1–V4 in WebKit on Windows, as a Safari-engine comparison.
- `smoke/serve-webkit-headless/S5-*`: the tool trays in WebKit.

Every JSON readout, log and Playwright report from all runs is kept. The other runs' JPEG screenshots (about 22 MB) were deleted after review. Re-running `npm run smoke` regenerates them.
