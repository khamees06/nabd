# P1 interaction report

**Task.** Checkpoint 1 (14 November 2026): the owner approved P1 and the quick wins («موافق»). He asked for hand movement that looks physically real and human, and for a view he can turn left and right. This report covers that work on branch `p1-interaction`:
- the 13 quick wins of Batch 1 in the ranked fix list (clusters C1 to C5);
- the remaining P1 roadmap items F26, stale `forearmContact`, F27 and the Rapier notice, plus proposal PR-10 (cluster C6).

An independent verifier wrote this report on 17 November 2026 and changed no application code. It follows the template of [09](../09_ACCEPTANCE_AND_VALIDATION_PLAN.md) §7.

**In short.** All 13 quick wins and the five P1 items are in place. An independent re-run on the final commit `9d85155` confirms the clusters' numbers.

| Run | Result |
|---|---|
| `npm test` | 21/21 |
| Vite build | OK |
| Chrome | 70 passed, 1 failed, 1 skipped by design. The failure is C4-11a at 1440, and it is intermittent: one frame turns a tool 6.6–6.7° against a 6° limit, in 2 of 5 runs |
| Edge (first time the interaction suite ran there) | 71 passed |
| WebKit on Windows | 47 passed and 23 passed on retry, 0 failed. Every first failure was the known WebGL context loss |
| Built (Vite) app, S1 | 3/3 |

The smoke flows give P0's results except for two intended changes:
- S2: the wrist now grips before «اقترب».
- S6: the room view is refused while the drill is open.

The S4 golden trace and the V1–V4 counters are identical to P0.

**One regression:** moving the mouse without clicking dropped from 68 to 23–25 frames per second (a C2 side effect). **Fixed after this verification** (Section 11): the patient's skin keeps its skinned vertices between picks, and hover now runs at 137 frames per second. The fix also removed the intermittent C4-11a failure (8 of 8 runs pass).

**Still not realistic:**
- the trainee has no arm or body, only gloves with a 30 cm stand-in sleeve;
- contact works only on one abdominal patch;
- fingers do not wrap round a limb or a handle;
- the patient sinks up to 52 mm into the table pads;
- there is no incision.

These need P3, P5, P7 and an incision design (Section 7). The owner's checklist is in Section 8, and seven decisions wait for him in Section 9.

**Status labels** as in [P0-completion.md](P0-completion.md): VERIFIED (run by the verifier on 17 November 2026 unless a cluster is named) · TEST-VERIFIED · SOURCE-INSPECTED · UNKNOWN · BLOCKED · PROPOSED · RECOMMENDATION.

**Where the fix IDs come from.** The diagnosis of 14 November produced a ranked list of 44 quick-win findings in six areas:
- A: looking;
- B: abdomen contact;
- C: limbs;
- D: instruments;
- E: navigation;
- F: realism design.

The list and its per-area findings were working files of that session and are not in the repository. This report therefore says in plain words what each fix does. The IDs (A1, B2, D-04 …) are kept only for traceability to the commit messages.

## 1. Scope, commits and configuration

**Commit range.** `main..p1-interaction` = `8224bb3..9d85155`: 13 commits plus this report's commit. `main` (`t1-complete`) is unchanged. Nothing has been pushed, because no remote exists.

| Commit | Cluster | Content |
|---|---|---|
| `8224bb3` | C1 look | Batch 1 items 1, 2, 4, 7: turning with arrow keys, the turn buttons and drags; the 3D view stays on screen |
| `059b46f` | C1 look | Evidence only: the C1 checks re-run on a clean export of `8224bb3` |
| `967189c` | C2 hands | Items 3, 5, 6, 12, 13: gloves face the skin, abdomen grips attach, human-speed hands, no hitches, shorter sleeve |
| `7786103` | C3 limbs | Item 9: drill, wrist and ankle grips attach; limbs lift straight up; the hold pauses outside the view; released limbs settle |
| `e28a679` | C3 limbs | Line endings only (CRLF back to LF in three files saved by `7786103`) |
| `73043e6` | C4 tools | Item 11: pickup at human speed, carry pointing ahead, free tools follow the pointer, no jump after a look or the monitor, roll limit, monitor fills the view, Escape places a scope |
| `9c5f55f` | C5 navigation | Items 8 and 10: moves round the bed glide and turn at human speed; every refused move says why |
| `8e4d0ba` | C6 | F26: the surgical lamps light the work area again (as spot lights) |
| `4760066` | C6 | Stale `forearmContact` after an attached release (AC-P1-4) |
| `8edb3be` | C6 | Rapier 0.21.0 and its Apache-2.0 text in the notices (AC-P1-6) |
| `7eafc1d` | C6 | PR-10: a 30 s hover segment in the performance protocol |
| `429436e` | C6 | F27 measured, nothing changed (AC-P1-5) |
| `9d85155` | C6 | Smoke evidence re-run on the C6 code |

**Files changed** (`git diff --stat main..p1-interaction`, outside `docs/improvement-plan/evidence/`):
- application code: `index.html`, `src/app/NabdRuntime.js`, `src/instruments/InstrumentKinematics.js`, `src/interaction/BedsideInteraction.js`, `src/interaction/ForearmGrip.js`, `src/patient/AbdomenSurface.js`, `src/staff/CrewController.js`, `src/styles.css`;
- tests: `tests/browser/interaction.spec.mjs` (new, 2,995 lines), `smoke.spec.mjs` (S2 and S6, intended), `perf-capture.mjs` (hover segment), `SMOKE_PROTOCOL.md`;
- plan: `09_ACCEPTANCE_AND_VALIDATION_PLAN.md` §2.4 (hover segment).

Nothing under `assets/`, `vendor/`, `scripts/`, `vite.config.mjs`, `package.json` or `package-lock.json` differs (`git diff --quiet`). VERIFIED.

Other checks on the commits, all VERIFIED:
- Every changed file is stored with LF line endings (0 carriage returns).
- No commit carries a `Co-Authored-By` trailer.
- `vendor/rapier/rapier.mjs` still has SHA-256 `02dc6a4e…eda0d0` (INV-2).

**Decisions relied on.**
- Checkpoint 1 approval of P1 and the quick wins.
- D4: control scheme delegated to the team; mouse and keyboard are primary.
- D5: natural human movement, with no penetration of the bed or the body except declared openings.
- DN6: keep the visual identity.
- D8, option A: the Rapier notice.
- D9: Chrome and Safari required, Edge and Firefox expected; the budget is still PROPOSED, so no frame-rate threshold is applied.

**Configuration.** The same machine as P0: ASUS TUF Gaming F15, i5-12500H, Windows 11 Pro 10.0.26300, browsers on Intel Iris Xe through ANGLE D3D11, 144 Hz panel, mains power. Further details:
- Tools: Node v26.13.1 and `@playwright/test` 1.64.1.
- Browsers: Google Chrome 157.0.8103.51; Microsoft Edge 157.0.4341.60 (P0: 157.0.4341.46); Playwright WebKit 27.2 ("WebKit on Windows", an approximation of Safari's engine, not Safari). Firefox was not run: it was BLOCKED on this machine in P0.
- Server: `node scripts/serve.mjs` on ports 4591 (Chrome), 4593 (Edge), 4592 (WebKit), 4594 (owner-style review) and 4596 (C4-11a re-runs). `vite preview` ran on 4595. Port 4597 served a clean export of `main` for one comparison.
- Viewports: 1440×900 and 560×890.

## 2. What changed for the trainee, fix by fix

"Before" is the clusters' measurement of the same check on the code before their change. P0 or the commit is named in the cluster reports and commit messages. "Verifier" is this report's re-run on `9d85155`, headless Chrome, at 1440×900 / 560×890.

| Item (finding IDs) | What the trainee gets now | Before → after (cluster) | Verifier, 1440 / 560 |
|---|---|---|---|
| **1 Turn the view with keys and buttons** (A1, A4, E-03) — `8224bb3` | ←/→ turn at 90°/s and ↑/↓ tilt at 60°/s (−1.28…0.42 rad) in free mode, training steps, the drill and work areas. W/A/S/D still walk. A held tool or limb takes the arrows first. An overlay at the bottom left of the 3D view has ↺/↻ (a click turns 15°, holding keeps turning), «تغيير النظر» (L) and a hint. Touch screens get their own hint | ← held 700 ms: 0° → 62.6–64.4°, trainee moved 0 m. Turn button: none → 15.0° per click, −88 to −91° for a 1 s hold | ← 700 ms: 60.8–63.7° / 63.3–64.4° in free mode, step 1 and the drill; moved 0 m. Click 15.0°; 1 s hold −89.0° / −90.6°. Edge the same |
| **2 Drag looks wherever the hand cannot act** (A3, A6, E-01, E-02) — `8224bb3` | A miss in the drill turns the view (it no longer opens the monitor). A press on an unreachable target, or on the skin in free mode, that moves more than 8 px becomes a look. "Out of reach" shows only after a still click. Each case has its own cursor | 7×5 grid of 60 px left-drags that turn the view: free 24/35, monitor step 29/35, drill 0/35 → 34–35/35 in all three at both widths. Drag starting on the patient: 0° → 13.4° | 35, 35, 35 / 34, 35, 34 of 35 (free, monitor, drill). Drag on the patient 13.4°. Edge identical |
| **4 A look is never cut or ignored** (A5, A7, part of A8) — `8224bb3` | A reach timeout no longer ends a right-drag. The browser menu stays closed after a right-drag. Looking works during walks and pose changes. «ابدأ التدريب» no longer runs an extra pose change | Right-drag 0.3 s after «ابدأ التدريب»: 2.6° → −44.2°. Slow 5 s right-drag through a 3.2 s reach timeout: 42.9° → 87.6°. Right-drag during the walk to «الجانب المقابل»: 0° → −44.7°. Release below the view: menu opened → blocked | Start −44.4° / −44.6°. Slow drag 87.6° / 87.6°. During the walk −42.0° / −41.9°. Menu blocked |
| **7 The view stays on screen; the wheel always zooms** (D-10, D-12, A2, E-04) — `8224bb3` | At ≤ 650 px the 3D view scrolls back on screen after each step and work-area change. The held-tool bar and scope station sit inside the view, so picking up a tool no longer shrinks it. The wheel over the view zooms and never scrolls the page; port depth still comes first | 560 px canvas top after start, monitor, «البطن», region change: −666 px → 0 px. 1440 px canvas height on pickup: 618 → 570 px, now 618 → 618 px. Aim-step wheel: page scrolled 300 px → FOV 62→54.5 / 76→68.5 with scrollY 0 | 560: canvas top 0 px after start, monitor, «البطن» and region change. 1440: 618 → 618 px on pickup (560: 520 → 520). Wheel FOV 62→54.5 / 76→68.5, scrollY 0 |
| **3 The glove faces the skin** (B1 = F-01, B10, B3(2), B4) — `967189c` | The glove now comes from the trainee's side, fingers away and palm down (the F-01 basis); before, it spun about 180°. The touch normal is in world space. Press and pinch are offered only on upward-facing skin (normal.y > 0.62). The side of the abdomen is touch only, pushed out along the normal | Press on «منتصف البطن»: never attached → 186–387 ms (WebKit 738–819 ms), pad gap 6–16 mm. Fingers-forward minimum per frame: −0.95…−1.00 → 0.975. Flank: the press buried the hand → touch only, local penetration 0 mm | Press 386 / 300 ms, gap 9.5 / 14.8 mm. Fingers-forward minimum 0.975. Flank touch only, local penetration 0 mm. Owner review: 352 / 319 ms |
| **5 «إمساك السطح» attaches** (B2 corrected, part of B7, B8) — `967189c` | The pinch attach test uses the thumb–index centre the hand aims at. A sliding press keeps its dent instead of popping back every 2.5 cm | Pinch: 0/22 → 5/5 at both widths (445–574 ms). 200 px press slide: dent popped to 0 → stays at −6.9 mm | Pinch 5/5 (537–668 ms) / 5/5 (427–508 ms). Dent −6.9 mm through the slide |
| **6 Hands move at human speed** (B3(3), C7, D-01(a), E-07(a,b)) — `967189c` | The wrist is capped at 1.2 m/s and the turn at 280°/s, so hands no longer jump or flip. A lift out of the skin shortens the step instead of popping. Idle hands follow the head; hard cuts snap them | Per rendered frame on abdomen click/release and tray pick/release: up to 125.7° and 0.39 m → ≤ 5.83° and ≤ 2.50 cm. Idle-hand drift while D is held: 42 mm → 0.03 mm | ≤ 5.83° and ≤ 2.50 cm per frame. Idle drift 0.04 / 0.03 mm |
| **12 No hitches** (C8 corrected, B9 = PR-1) — `967189c` | Each patient skin keeps one fixed, enlarged bounding sphere, so no recompute happens during limb drags. Hover picks run at most once per frame, after a 3 px move. A click reuses the hover pick | Limb drag: 35–37 → 81–91 fps under the same load, 134–144 fps when quiet; 0 sphere recomputes. Click frame after pointing: 96–119 → 12–31 ms. **Side effect:** plain hover got slower (Section 9) | Limb drag 132 / 139 fps (plain rendering 111 / 124). 0 recomputes. Click frame 12.5 / 13.8 ms; a click in the same instant as a move 48.7 ms. Skin raycast 40 ms (p50) |
| **13 Shorter sleeve until P3** (B5, C10) — `967189c` | The stand-in forearm cylinder is at most 0.30 m. It is hidden beyond 0.45 m and while a limb is held | Up to 1.06–1.09 m → ≤ 0.30 m in every sampled state | Sleeve ≤ 0.30 m; 0 frames with a sleeve while a limb is held |
| **9 Limb grips work and limbs settle back** (C1, C2, C3, C5 orientation, C6, C9, PR-6) — `7786103`, `e28a679` | The drill palm comes down onto the wrist, and a stopped sweep within 4 cm still grips. Limb grips no longer use the height-field lift; the hand aims 3 cm above the skin top. Every limb grip drags on a vertical plane, so moving the mouse up lifts the limb straight up. Leaving the 3D view pauses the hold until a press. Released limbs settle at ≤ 0.32 m/s with no elbow or knee pop | Drill clicks that grip: 1/14 and 0/14 → 28/28 (0.28–0.36 s). Ankle grips: 0/2 at 560 → 8/8. 110 px up, sideways drift: −8 to −13 cm → ≤ 1.1 cm (lift +18 to +26 cm). Distance from rest 2 s after release: 13–22 cm → 0 mm. Forearm movement after leaving the view: 17–19 cm → 0 mm. Step 5 failed return: 0.21 m in one frame → 4.5 mm | Drill 14/14 and 14/14 (0.29–0.36 s). Ankles 4/4 and 4/4. Wrist lift +18.0 / +22.8 cm with −0.3 / −0.6 cm sideways. 0 mm from rest at 2 s. 0 mm movement outside the view. Step 5 failed return: largest step 15.9 mm in one frame (1440). That is under the check's 20 mm, but more than C3's 4.5 mm, on slower frames |
| **11 Tools behave in the hand** (D-01 b, c, d; D-02, D-04, D-05, D-07, D-08; D-09 Escape) — `73043e6` | The hand reaches with the tool's own rotation and takes it once matched; the tool rises over 300 ms. The carry follows the trainee's heading, so the tool points ahead on both sides of the bed. At a work area, scissors and needle holder follow the pointer 6 cm above the skin. During walks the tool rides in front of the body. After a look, a zoom or the monitor, the tool stays in place. Roll stops at ±90°. The monitor view fills the free space. Escape leaves an inserted scope in the port | Pickup turn per frame: 7.0–7.2° → ≤ 5.83°. Pickup step: 3.4–3.9 → ≤ 1.6 cm. Scissors follow the pointer: 0 → 0.19–0.39 m. Shaft direction on the far side (camera z): +0.87 → −0.87. Jump on resume after a look: 0.65–0.73 m → 0. Monitor display: 20–25 % → 58 % of the view height. Escape at 53 %: back on the tray at 0 % → placed at 53 % | Pickup ≤ 5.83° and ≤ 2.4 cm per frame, **except 2 of 5 Chrome runs at 1440 (6.64°, 6.72°; Section 3.2)**. Scissors follow 0.39 / 0.37 m near and 0.26 / 0.22 m far, tip 6.0 cm above the skin. Shaft z −0.84 near, −0.87 far. Resume jump 0 m. Monitor FOV 24.1° / 26.9°, display 58 % / 52 % of the height. Roll stops at ±90°. Escape: placed at 53 % |
| **8 Smooth movement around the bed** (E-05, E-06, A9, part of A8) — `9c5f55f` | At a work area the view turns toward the work point at ≤ 180°/s while walking and on arrival, and the trainee's own look is kept as an offset. Entry and «اقترب/ابتعد» glide. FOV changes ease over 0.3 s. Bedside steps take 0.25 s. Escape, «إعادة وضع اليدين» and leaving a work area walk back. «إعادة المنظور» returns to the current step's spot. The room view glides out over 1.2 s | Entering «البطن»: 22.6°, 16.9 cm and 10° FOV in one frame → ≤ 3.45°, ≤ 4.7 cm, ≤ 1.25° per frame. «الجانب المقابل»: 180° in one frame → ≤ 1.84° per frame; a third of the way in, 74–75° → 6.5–6.9° off the work point. A 36° look through «خطوة حول السرير»: reset → kept. Escape: one-frame cut → 27 frames. Room view: 4.16 m in one frame → 74–87 frames | Entry ≤ 3.45° and ≤ 4.7 cm per frame, FOV ≤ 1.03 / 1.25°. Other side ≤ 1.88 / 1.82° per frame, 6.8 / 6.9° off the work point a third in. Arm ≤ 2.04°. A 36.9° look kept. Escape 33 / 36 frames (≤ 3.3°, ≤ 2.1 cm). «نحو الرأس» ≤ 2.2 cm. «إعادة المنظور» ≤ 3.7°. Room view 84 / 85 frames, largest frame 0.21 / 0.25 m (Edge 0.34 m; the glide is timed, so a slow frame takes a bigger step) |
| **10 Every failure is explained** (B6, C1(c), D-03, D-11, E-08, E-09) — `9c5f55f` | A grab that times out says «لم تصل الأصابع إلى الجلد …» (drill: «تعذّر الإمساك …») and the text stays. Walking while holding, the bed edge, the approach limit, a click while walking, and depth or roll keys away from the port all give a message. The room view and the atlas are refused while the drill is open. Out of reach with a tool, depth and angles stay where they were, with «خارج مدى اليد · اقترب من السرير» | No-contact text: never shown → shown and still there 3.5 s later. Five «ابتعد» then six wheel clicks: the depth moved → stays 0 % with the reach text; back in place, the wheel inserts to 49 % | No-contact text after 4.65 s (Chrome at 30× CPU slowdown), still shown 3.5 s later. Standing back: the wheel leaves 0 % with «خارج مدى اليد · اقترب من السرير»; back in place it inserts 49 % |
| **F26 Lamp task lights** (07 P1 item 2, AC-P1-2) — `8e4d0ba` | The two lamp lights sit at the GLB lamp faces and aim at the work point, so they follow the drill wrist. They are SpotLights (#fffbf1, 1.18, no shadows) | Lights reached by the renderer: 0 → 2. V1 torso +11.7 %, room +2.4 %, no clipped skin | 2 SpotLights #fffbf1 1.18, lit, 0 mm from the lamp faces, cone axis 0.00° from the work point. The fallback path is the same |
| **Stale `forearmContact`** (07 P1 item 4, AC-P1-4) — `4760066` | A released glove lets go of its forearm collision object and follows the head again | After an attached release: right stayed true → both false. Released-glove drift while turning: 2.07 / 1.70 cm → 0 m | Both false after the release; drift 0 m at both widths |
| **Rapier notice** (07 P1 item 6, AC-P1-6, D8 A) — `8edb3be` | `index.html` lists Rapier 0.21.0 with the full Apache-2.0 text, so the Vite output and the standalone preview carry it | Missing → present once in each output (text search) | Served page: notice line, Apache text, Dimforge copyright, `vendor/rapier/LICENSE` 200. Vite and standalone outputs: INV-5 |
| **PR-10 Hover in the performance protocol** — `7eafc1d` | `perf-capture.mjs --hover` adds a 30 s hover segment. 09 §2.4 is updated | Found the hover regression (Section 9) | — |
| **F27 Table pads** (07 P1 item 5, AC-P1-5) — `429436e` | Measured only. The pad tops are at y = 0.9525, 52.5 mm above the code's deck at 0.900. 2,860 skin points sit more than 2 mm below a pad top (back up to 38.8 mm, seat 47.8 mm, legs 51.8 mm) | No change. A decision for the owner (Section 9) | Re-measured the same: pads 52.5 mm above the code deck; back 38.8 mm below the pad top |

## 3. Verification runs

### 3.1 Unit tests and build

All VERIFIED at `9d85155`:
- **`npm test`:** 21 cases, 21 pass, 0 fail, 287 ms. Full output: [verify/npm-test.log](../evidence/p1-interaction/verify/npm-test.log). No `node --test` case was added in P1, so the count is unchanged from P0.
- **`npm run build`:** exit 0 in 877 ms ([verify/vite-build.log](../evidence/p1-interaction/verify/vite-build.log)). The output is one bundle, `dist/assets/index-iWl4O-II.js`, 785.43 kB (gzip 220.97 kB; P0 763.68 kB, so +21.8 kB). Alongside it: `index-Co-k8Dbv.css` 213.36 kB and `index.html` 49.44 kB (P0 36.81 kB; the difference is the Rapier licence text and the new overlay markup). Vite's ">500 kB chunk" warning is unchanged.
- **Standalone preview:** see INV-5 in Section 4.

### 3.2 Browser suite runs

Each run covered both spec files, `smoke.spec.mjs` (17 tests) and `interaction.spec.mjs` (55 tests), against its own `serve.mjs`. The runs used `NABD_EVIDENCE_DIR=…\evidence\p1-interaction` and a private temp folder per run, so no run could overwrite another's Playwright output. The runs went one at a time. The only overlap: two short verifier probes (Section 6) ran while Edge was on its first eight C1 checks, and those checks passed.

| Run | Browser | Result line | Time | Log |
|---|---|---|---|---|
| serve, chrome | Google Chrome 157.0.8103.51, headless | **70 passed, 1 failed, 1 skipped** | 19.3 min | [run-serve-chrome.log](../evidence/p1-interaction/verify/run-serve-chrome.log) |
| serve, edge | Microsoft Edge 157.0.4341.60, headless | **71 passed, 1 skipped** | 19.1 min | [run-serve-edge.log](../evidence/p1-interaction/verify/run-serve-edge.log) |
| serve, webkit | Playwright WebKit 27.2 ("WebKit on Windows", not Safari), headless, 1 retry | **47 passed, 23 flaky (passed on retry), 0 failed, 2 skipped** | 44.7 min | [run-serve-webkit.log](../evidence/p1-interaction/verify/run-serve-webkit.log) |
| vite preview (built `dist/`), S1 only | Chrome, WebKit, Edge | **3 passed** | 22 s | [run-vite-preview-S1.log](../evidence/p1-interaction/verify/run-vite-preview-S1.log) |
| C4-11a re-runs | Chrome, 1440×900, 4 more runs | 3 passed, 1 failed | 2 min | [C4-11a-1440x900-chrome-reruns.txt](../evidence/p1-interaction/verify/C4-11a-1440x900-chrome-reruns.txt) |

Skipped tests, both by design: C3-9e at 560×890 in every browser (step 5 is checked at 1440 only, as in smoke S4), and in WebKit also C5-10b (it needs Chrome's DevTools CPU throttling). The Playwright JSON reports are `verify/report-*.json`.

**The one Chrome failure: C4-11a at 1440×900** (tools picked up at human speed).
- In the full run the grasper turned **6.64°** in one frame during the pickup. The check allows 6° (ranked list, item 11) and the hand cap is 5.83°.
- Four re-runs: 3 passed, 1 failed (the needle holder at **6.72°**). That is 2 failures in 5 runs. In each failure the hand stayed at 5.83° and only the tool went over, 52–57 ms after the grasp.
- It passed on Edge in this verification. C4 and C6 had it passing on Chrome and WebKit.
- **Reading (SOURCE-INSPECTED, not proven):** after the grasp, the tool's grip blends over 300 ms from the tool's own rotation to the carry grip (D-01 c). That blend adds to the hand's capped turn and is not capped itself. On a long frame the sum can exceed the cap. The failing run's long frames (40–61 ms) were measured; whether they are hover picks was not.
- **Effect for the trainee:** under one degree more than the cap, in one or two frames. Nobody will see it.
- **Effect for the suite:** this check fails intermittently on Chrome, so item 11's "≤ 6° per frame" is **not reliably met**.
- **RECOMMENDATION:** cap the grip blend with the same 280°/s turn limit. The alternative is to state the criterion for the hand, not the tool.
- The failing run's JSON is kept as `verify/C4-11a-1440x900-chrome-full-run-failed.json`. `interaction/serve-chrome-headless/C4-11a-…-1440x900.json` holds the last, passing re-run.

### 3.3 Smoke flows against P0

P0 columns are the P0 post-fix run on `006881f` ([P0-completion.md](P0-completion.md), [p0-post-fix/](../evidence/p0-post-fix/)). PASS = all checks passed with M11 = 0.

| Flow | P0 (C · E · W) | P1 verifier (C · E · W) | Difference and why |
|---|---|---|---|
| S1 Boot and assets | PASS · PASS · PASS | PASS · PASS · PASS | None. Ready 2.9 s (C) and 3.1 s (E), against 2.9 / 2.7 s in P0. Still 21 modules; 0 failed and 0 foreign requests (INV-10); 0 warnings |
| S2 Forearm drill | PASS · PASS · **FAIL** (R8) | PASS · PASS · PASS | **Intended.** The wrist click before «اقترب» now **grips** (C and E), where P0 had a stalled reach and a 3.4 s "out of reach". The S2 check accepts either outcome since C2 (see Deviations). Grip on the first attempt (P0 needed 2 on Chrome, PR-6 fixed). Lift 0.110 m (P0 0.109) |
| S3 Support and release | PASS · PASS · PASS | PASS · PASS · PASS | Grip on the first attempt (P0: 2). supportGap 1.7 mm (P0 1.2–1.3 mm, limit 20 mm). The wrist stays up after the release and returns to rest after «إنهاء المساندة», as in P0 |
| S4 Training session | PASS · PASS · PASS | PASS · PASS · PASS (retry) | **Golden trace (20 events) identical to P0** in Chrome, Edge and WebKit. Phase complete, 5/5 results, 0 retries |
| S5 Instruments (4 tools) | PASS ×4 in each | PASS ×4 · PASS ×4 · PASS ×4 (scissors on retry) | 0 NaN errors and M11 = 0 for every tool, as after F19 |
| S5 Staff handover | PASS · PASS · PASS (retry) | PASS · PASS · PASS | The supervisor offers the grasper (offer 0.999–1.0), as in P0 |
| S6 Room and presets | PASS · PASS · PASS | PASS · PASS · PASS (retry) | **Intended (C5, item 10).** In the drill, the room view is now refused with «أغلق تمرين الساعد أولًا ثم افتح معاينة الغرفة»; P0 ended the drill silently (F31). After the drill is closed, all 11 presets select. `#camera-overview` is still covered by `#anatomy-toggle` at 1440×900, as in P0 |
| S7 Anatomy | PASS · PASS · PASS | PASS · PASS · PASS | None. 35 structures, appendix isolated, 541 draw calls |
| S8 Hands and locomotion | PASS · PASS · PASS | PASS · PASS · PASS (retry) | Left/right order at rest unchanged (camera-space x −0.175 / +0.175, INV-3). D held 2 s: 1.21 m (C) and 1.26 m (E), inside P0's 1.20–1.27 m. Work step 0.26 m and the other side 1.54 m, as in P0; the walk now glides (C5) |
| S9 Port and scope | PASS · PASS · PASS | PASS · PASS · PASS | None. Aligned, 53 %, roll 15°, live image on 2 screens, 12 scope pixels |
| V1–V4 captures | PASS (counters = baseline) | PASS · PASS · PASS (V2 on retry) | **Counters and cameras identical to P0** in all three browsers: V1 1,206 / 387,848, V2 479 / 299,400, V3 1,528 / 462,240, V4 541 / 464,003. The C6 spot lights add no draw calls. The V1/V2 images are brighter on the torso (+11.7 %, C6) |

**WebKit on Windows.**
- All 17 smoke tests pass, five of them on the retry. Readouts as in Chrome:
  - the golden trace is identical;
  - the V1–V4 counters are identical;
  - S2 grips before «اقترب», as WebKit already did in P0. P0 counted that as a failure of the R8 check, and the check now accepts it.
- **WebGL context loss** caused all 23 first-attempt failures in the run, smoke and interaction together (Playwright JSON `verify/report-serve-webkit.json`):
  - 12 never became ready within 60 s at boot;
  - 11 booted and then logged `WebGL: context lost.` during the check, which fails M11. One also logged `INVALID_VALUE: drawBuffers`.
- That is 23 of 70 first attempts. P0 had 2–4 flaky tests in 17, and the clusters reported similar rates in their own WebKit runs. The longer interaction checks give the context more time to be lost.
- Whether P1 makes it more likely is UNKNOWN. Whether Safari on macOS shows it at all is still U21. The app still has no `webglcontextlost` handling (AC-P11-4).
- **The built app (Vite preview):** S1 passes in Chrome, WebKit and Edge. Ready in 2.7–3.1 s. One bundle, `index-iWl4O-II.js`, plus 9 GLBs and Rapier, all 200. 0 foreign requests, M11 = 0.

### 3.4 Interaction checks (C1–C6) by browser

| Check group | Chrome | Edge | WebKit on Windows |
|---|---|---|---|
| C1 look (16) | 16/16 | 16/16 | 16/16 (5 on retry) |
| C2 hands (8) | 8/8 | 8/8 | 8/8 (2 on retry) |
| C3 limbs (9 + 1 skipped by design) | 9/9 | 9/9 | 9/9 (4 on retry) |
| C4 tools (8) | **7/8** (C4-11a 1440 intermittent, see 3.2) | 8/8 | 8/8 (3 on retry) |
| C5 navigation (7) | 7/7 | 7/7 | 6/6 (2 on retry); C5-10b skipped (Chrome-only CPU throttling) |
| C6 lamps, contact, licence, F27 (6) | 6/6 | 6/6 | 6/6 (2 on retry) |

Notes on Edge:
- Edge had never run the interaction suite before. It passes every check, including the CPU-throttled no-contact check C5-10b (text after 7.2 s, still shown 3.5 s later).
- Its numbers match Chrome's closely (Section 3.5).

### 3.5 Key numbers by browser (verifier, 1440 / 560)

| Measure | Chrome | Edge | WebKit on Windows |
|---|---|---|---|
| ← held 700 ms (free, step 1, drill) | 60.8–63.7° / 63.3–64.4° | 62.5–63.3° / 63.7–63.8° | 63.2–65.7° / 62.9–66.2° |
| 60 px drag grid that turns the view (free, monitor, drill) | 35, 35, 35 / 34, 35, 34 | same | same |
| Press attaches | 386 / 300 ms | 341 / 309 ms | 497 / 614 ms |
| Pinch attaches (5 of 5) | 537–668 / 427–508 ms | 524–689 / 426–478 ms | 673–782 / 815–846 ms |
| Hands, largest step per frame | 5.83°, 2.50 cm | same | same |
| Drill clicks that grip; ankle grips | 14/14, 14/14; 4/4, 4/4 | same | same |
| Limb drag (plain rendering) | 132 (111) / 139 (124) fps | 136 (123) / 141 (128) fps | 32 (32) / 32 (34) fps |
| One skin raycast (p50) | 40 ms | 40 ms | 88–90 ms |
| Tool pickup, largest turn per frame | 5.83° (6.64° and 6.72° in 2 of 5 runs at 1440) | 5.83° | 5.83° |
| «الجانب المقابل», largest turn per frame | 1.88 / 1.82° | 1.82 / 1.83° | 1.84 / 1.85° |
| Scope monitor FOV | 24.1 / 26.9° | same | same |

## 4. Invariants

| ID | Result | Evidence |
|---|---|---|
| INV-1 Zero console errors in S1–S9 | **Pass** (Chrome, Edge, WebKit in every final attempt) | M11 = 0 in every smoke JSON under `smoke/serve-*-headless/`. The interaction suite also asserts M11 = 0 in every check. Its only error is the intended blocked light GLB in C6-a2 (`net::ERR_FAILED`), which the check expects |
| INV-2 Asset integrity | **Pass** | `asset-manifest` test passes (21/21). Nothing under `assets/` changed. `vendor/rapier/rapier.mjs` SHA-256 `02dc6a4e2fffc013bab08fbb44fa68f501d8303615e9afe4c7d89ad4eedda0d0`, as in P0 |
| INV-3 Left/right mapping | **Pass** | S8: left glove camera-space x −0.175, right +0.175 at rest (Chrome, Edge), as P0. C6-b: a left grip holds only the left hand. The glove assets and `buildHand` are unchanged in their identity and handedness. Only `contactRotation`'s normal branch changed (item 3), and it keeps a right-handed basis (positive determinant): `makeBasis(across, correctedDorsal, backward)` with `across = dorsal × backward` and `correctedDorsal = backward × across` (SOURCE-INSPECTED, `CrewController.js` 311–317) |
| INV-4 Forearm drill | **Pass, with an intended change** | S2 and S3 pass; both `forearm-contact` unit cases pass. R8 ("out of reach" before «اقترب») is no longer reproduced, by design: the reach no longer stalls, so the first click grips (C2, C3) |
| INV-5 Licence notices in every output | **Pass** | Rapier line, Apache text and Dimforge copyright found in the served `index.html` (C6-c), in the Vite `dist/index.html` (line 2×, "Apache License" 6×, "Dimforge" 2×; `dist/vendor/rapier/LICENSE` present) and in the standalone preview (`npm run preview:standalone` at `9d85155`, 34.78 MiB: Rapier line 2×, "Apache License" 6×, the Apache "TERMS AND CONDITIONS" heading 1×, "Dimforge" 2×; [verify/standalone-preview.log](../evidence/p1-interaction/verify/standalone-preview.log)). The standalone file was built for this search and is not committed (`dist/` is build output) |
| INV-6 Non-validated labels | **Pass (unchanged)** | `src/ui/` is unchanged; "DEMO SIGNALS" is still in `MonitorUI.js`. P1 changed no clinical content |
| INV-7 No dialogue/scenario module writes transforms | **Pass** | `module-graph` unit test passes. `src/simulation/` is unchanged |
| INV-8 Privacy | **Pass** | `target-filter` unit test passes. Privacy-region coverage is measured from P5 |
| INV-9 Visual identity | **Pass; owner to confirm** | `lang="ar" dir="rtl"` unchanged; the `:root` palette tokens and the fonts are unchanged. The new look overlay and the held-tool bar use white buttons with teal text, in the existing teal family: `#24585a` and `#d7e7e5` already exist, `#2f5c58` and `#4f6b6f` are new shades between them. Screenshots 01 and 10 show the overlay |
| INV-10 No foreign requests | **Pass** | S1: 0 foreign-origin requests and 0 failed requests in Chrome, Edge and WebKit, and for the built app in all three; 21 modules, 9 GLBs and Rapier all 200 |
| INV-11 Natural movement | **Recorded only** (checked from P3) | Per rendered frame, hands are capped at 5.83° and 2.5 cm; camera moves at ≤ 3.75° and ≤ 4.7 cm; the pickup tool turn is ≤ 5.83° with the 6.6–6.7° exceptions in Section 3.2. Known penetrations: the sleeve lying on the abdomen during a pinch (shot 03), the fingers about 2 cm inside the wrist on the free bedside grab, the patient up to 52 mm into the pads (F27), and the patient's hand into his body (C4). See Section 7 |

## 5. Metrics

No threshold is applied: the D9 budget and reference machine are still PROPOSED. All numbers are from the P0 laptop (Iris Xe, 144 Hz).

| Metric | P0 / before | P1 now | Source |
|---|---|---|---|
| M11 console errors, S1–S9 | 0 | 0 (Chrome, Edge, WebKit after retries) | Section 3.3 |
| M8 / M9 draw calls and triangles, V1–V4 | 1,206 / 387,848; 479 / 299,400; 1,528 / 462,240; 541 / 464,003 | Identical | Section 3.3 |
| M10 ready (one S1 load, headless) | Chrome 2.9 s, Edge 2.7 s | Chrome 2.9 s, Edge 3.1 s | S1 JSON (single sample, not the M10 protocol) |
| M7, V1 active look drag (headed Chrome, rAF) | P0 protocol: 110.2 fps. Before C2 (quick capture): 115–118 fps | 116 fps after C5; 110–112 fps with the lamps | `perf-hover/` (C6: 2 runs of 15 s active; the P0 protocol uses 3 runs of 30 s) |
| **M7, V1 hover (pointer moving, no button)** | Before C2: **68 fps**, median 7.1 ms, p95 34.8 ms | **24–25 fps**, median 41.7 ms, p95 48.7 ms (C6). Verifier, 5 s in the owner review: **23 fps**, 41.7 / 48.8 ms | `perf-hover/`, `owner-review/owner-review.json` |
| V1 idle (rAF) | 133.9 fps | 132–142 fps (C6); 136 fps (verifier) | as above |
| Limb drag (headless Chrome, rAF) | 35–37 fps under load (before C2) | 132 / 139 fps at 1440 / 560 | C2-12 |
| Click frame after pointing (rAF interval with the click) | 96–119 ms | 12.5–13.8 ms; 48.7 ms when the click comes with a move | C2-12 |
| Skin raycast (one call) | about 40 ms (P0 U7) | 40 ms p50 | C2-12 |

## 6. Owner-style review in a visible Chrome window

The verifier drove the app the way the owner would: installed Chrome 157 in a visible window, real mouse and keyboard input, entry `/?qa` (no debug overlay), 1440×900 and 560×890. The script is not part of the repository. Its readouts are in `evidence/p1-interaction/owner-review/owner-review.json`, and the 12 screenshots below are in the same folder. Zero console errors in all 9 sessions. VERIFIED.

| Shot | What was done | Readout | What it shows |
|---|---|---|---|
| `01-start-training-look-overlay-1440x900.jpg` | «ابدأ التدريب» | ← held 700 ms: **65.0°**, moved 0 m. ↻ click: **−15.0°**. Right-drag 200 px: **44.7°** | The look overlay (↻ يمين, تغيير النظر, يسار ↺ and the hint) at the bottom left of the 3D view. Its hint lies over the tray area; the handle stays clickable |
| `02-abdomen-press-attached-1440x900.jpg` | «البطن», «جسّ خفيف», click «منتصف البطن» | Attached in **352 ms** | The glove from the trainee's side, fingers away, palm on the skin. The stand-in sleeve runs from the hand towards the bottom of the view |
| `03-abdomen-pinch-attached-1440x900.jpg` | «إمساك السطح» on the same point | Attached in **482 ms** | **Still wrong:** the 0.30 m sleeve, with its jagged cuff, lies flat across the abdomen and chest beside the pinch |
| `04-abdomen-flank-touch-1440x900.jpg` | Click the side of the abdomen | Offered as **touch**, attached in 276 ms | **Looks odd:** the hand reaches under the flank palm-up, with spread fingertips. It does not sink in, but it is not how a clinician touches a flank |
| `05-drill-wrist-lifted-1440x900.jpg` | «تدريب لمس الساعد», click the wrist, mouse 80 px up | Gripped in **311 ms** with no «اقترب». Wrist lifted **+10.2 cm**, sideways 0 cm. Back at rest (0 mm) 2.3 s after the release click | The palm over the wrist, the forearm raised |
| `06-ankle-lifted-1440x900.jpg` | «الساق», click «الكاحل · يسار», mouse 70 px up | Gripped in **221 ms**. Ankle lifted **+11.9 cm**, sideways 0.03 cm. Back at rest (0 mm) | The glove round the ankle, with the sleeve running down past the table edge |
| `07-walk-to-other-side-midway-with-scissors-1440x900.jpg` | Pick «المقص الجراحي» from the tray (**497 ms**), «منطقة البطن», «الجانب المقابل» | Mid-walk, 0.73 s in | The view turns smoothly round the foot of the bed with the patient in sight. Before C5, the view at this point faced the anaesthesia machine at close range (`c5-before-after/other-side-mid-walk-before-73043e6-1440x900.jpg`). The walk took 3.7 s |
| `08-scissors-far-side-1440x900.jpg` | On the far side, move the mouse | Still held, tip **7.1 cm** above the skin | The scissors held from the far side, pointing down at the work point. The idle left glove rests near the patient's left hand |
| `09-scope-monitor-view-1440x900.jpg` | Scope from the tray, aligned at the port, 6 × «أدخل الأداة» (**53 %**), «انظر إلى الشاشة» | FOV **24.1°**, live image. Back in the field, Escape left the scope **placed at 53 %** («فلّت الأداة وهي ثابتة في فتحة التدريب») | The monitor fills most of the view |
| `10-start-training-turned-560x890.jpg` | 560×890: «ابدأ التدريب», then ←, ↻, right-drag | ← 700 ms **64.4°**, ↻ **−15.0°**, right-drag **44.7°**. Canvas top −0.4 px after the start | The 3D view kept at the top of the page. After about 94° to the left it faces the floor. **Still wrong:** two floating gloves with stub sleeves and no body |
| `11-abdomen-press-attached-560x890.jpg` | 560×890: press on «منتصف البطن», then pinch | Press **319 ms**, pinch **429 ms** | As 02, at phone-like width |
| `12-drill-wrist-lifted-560x890.jpg` | 560×890: drill grip, mouse 80 px up | Gripped in **287 ms**, lifted **+14.2 cm**, back at rest | The palm over the wrist and the raised forearm. The status line in this image reads «الطرف ثابت …» because taking a screenshot of a narrow page in a visible window pauses the hold. The status polled 1 s before the screenshot read «تم إمساك الطرف …», and a headless repeat did not pause (verifier probe) |

**Plain mouse hover** (1440×900, visible window, default bedside view; 117 pointer moves over the patient in 5 s):
- **23 frames per second**, frame median 41.7 ms, p95 48.8 ms;
- idle right after: 136 frames per second.

This confirms the C6 hover regression (Section 9).

**Seen during the review, not caused by P1.** At 560 px the scene caption («محاكاة تفاعلية · غرفة العمليات») is partly covered by the buttons at the top of the view. The two boxes have the same positions on `main` (checked on a clean export of `main` at 560×890).

## 7. What is still not realistic, and why

The quick wins removed the faults that made the hands and view feel broken: reversed gloves, grips that never closed, jumps and snaps, a frozen view, silent refusals. They did not make the trainee's body human. The remaining gaps need the phases the owner already approved in the roadmap. A quick fix would not survive those phases.

**Batch 2: needs the trainee body and arm IK (T2 / P3).**
- **The arm is not an arm.** Each hand is a rigid glove asset that floats at the wrist. A teal cylinder about 7 cm thick, now capped at 0.30 m, stands in for the forearm, and nothing connects it to a shoulder. A real two-bone arm with elbow IK replaces the cylinder (F-07). The owner's «حركة يدي تكون فيزيائية بشرية» depends on this more than on anything else.
- **No wrist.** The hand and the forearm turn as one block, and all fingers close together. A single hand-frame convention with wrist limits (F-08) and per-finger curls (P7) are needed.
- **Motion profile.** Hands now respect a speed cap (1.2 m/s, 280°/s), which removes the jumps. They still move at constant speed and then stop, instead of the bell-shaped speed of a human reach. A per-frame solve with a critically damped filter or minimum-jerk reaches (F-09) is P3 work.
- **No body to see.** Looking down shows no torso. The camera height is a constant 1.60 m, not the eyes of a body (AC-P3-10).
- **Turning during walks and pose changes** now works (C1 item 4). A full look model tied to a body (A8) remains P3.

**Batch 3: needs whole-body contact (P5) and grasp (P7).**
- **Contact covers one abdominal patch.** Press and pinch work inside a height-field patch of about 31 × 18 cm. Elsewhere the hand touches through a full-skin raycast that costs about 40 ms per call. That raycast also causes the new hover slowdown (Sections 5 and 9). A contact service with per-probe push-out and a bucketed or BVH surface (F-10, P5) is needed for the chest, flank, limbs and a future incision.
- **Hands can still sink in places.** On the free bedside wrist grab the fingers sit about 2 cm inside the wrist, the same as before (C3 report). After a press the middle fingertip floats about 1.5 cm above the dent (C2 report). The patient's body has no self-collision, so a held hand or forearm can pass into the flank, hip or abdomen (C4). When a wrist is lifted, the elbow stays straight and the whole arm pivots from the shoulder, where a relaxed arm would bend at the elbow (C11; the joint ranges need review).
- **The patient sinks into the table pads** by up to 52 mm (F27, measured in C6). The fix proposed is to lower the table-top model by 52.5 mm. It is an owner decision and was not made here (Section 9).
- **Grasp.** The fingers do not close around a limb or a tool handle; the tool is copied to a fixed palm offset. Per-finger pinch (B7), the limb grasp frame (C5) and tool grip sockets (D-02 final) are P7 work. Releasing a tool still sends it straight back to the tray, with no animated placement (D-09). The scope rolls the whole hand. The laparoscope has no tilt or fulcrum feel (D-06); how that should feel is the owner's decision.

**Batch 4: the incision («الشق»).** Today there is no incision at all (F-02):
- no scalpel can be picked up (the scalpels on the trolley are decoration);
- there is no stroke;
- there is no line drawn on the skin;
- nothing opens.

A believable cut needs four things:
- a scalpel with a pencil grip (F-03, P7);
- a press-drag-release stroke with depth bands (F-04);
- an incision mask in the skin's texture space (F-05);
- an "openings" registry with scenario rules, so that only a declared opening can be entered (F-06, P5/P6, D5).

Its site, length, technique, and even whether the v0 laparoscopic case has an incision at all, are clinical review items CR-11, CR-12, CR-13, CR-17 and CR-20. Until they are reviewed, the cut stays narrated (DL0).

## 8. The owner's visual-review checklist

Please try these yourself in Chrome: open the app, use «ابدأ التدريب» or the bedside view, and the mouse and keyboard. Each item says what should now happen. Mark each one pass, fail or comment (09 §2.5).

| # | Try this | What should happen now | Screenshot |
|---|---|---|---|
| 1 | Press «ابدأ التدريب». Then turn the view three ways: hold ← or →; click or hold the ↺ / ↻ buttons at the bottom left of the 3D view; drag with the right mouse button (or the left button on empty space). Use ↑ / ↓ to look up and down | The view turns about 90° per second with the keys; one click on a button turns 15°. You stay in place, and nothing pulls the view back. W/A/S/D still walk | 01, 10 |
| 2 | Look at the bottom-left corner of the 3D view | The turn buttons, «تغيير النظر» and a one-line hint. Does the hint hide anything you need? At 1440 px it lies over the tray handle, but the handle can still be clicked through it | 01 |
| 3 | «البطن», «جسّ خفيف», click «منتصف البطن» | The glove comes from your side, fingers pointing away from you and palm down. It touches within about half a second. Click again to let go | 02, 11 |
| 4 | Same place with «إمساك السطح» | The pinch takes hold and the skin lifts a little. Look at the 30 cm stand-in sleeve beside the hand | 03 |
| 5 | Click the side of the abdomen | Only a light touch, with the fingertips on the skin and not inside it | 04 |
| 6 | «تدريب لمس الساعد», click the wrist, move the mouse up, then click to let go | The hand grips from where you stand (no «اقترب» needed) and the forearm lifts straight up under the pointer. After the click it settles back onto the arm board slowly, with no jump | 05, 12 |
| 7 | «الساق», click the ankle marker, lift it, click to let go | The grip closes on the ankle, the leg lifts, and on release it settles back | 06 |
| 8 | Choose «المقص الجراحي» in «أداة التمرين», «الصينية», click the handle | The hand turns to the tool and lifts it in about half a second; the tool points ahead of you | — |
| 9 | With the scissors held: «منطقة البطن», move the mouse, then «الجانب المقابل» | The scissors follow the pointer about 6 cm above the skin. During the walk round the bed the view turns smoothly and keeps the patient in sight; the scissors stay in front of you and point ahead on the far side | 07, 08 |
| 10 | Scope: pick it, «منطقة البطن», aim at the port ring, «أدخل الأداة» a few times, then «انظر إلى الشاشة» | The monitor fills most of the view. Rolling stops at 90° and its button switches off. Back in the field, Escape leaves the scope in the port | 09 |
| 11 | Walk: «خطوة حول السرير», «نحو الرأس», «اقترب»/«ابتعد», Escape, «إعادة المنظور», then the room view | Every move glides instead of cutting. Is the pace right? If you turned your head before a walk, the turn is kept. Does that feel right? | — |
| 12 | Try things that are refused: walk while holding something; press «ابتعد» many times; press «معاينة الغرفة» while the forearm drill is open | Each refusal shows a short Arabic message. Is the wording right? | — |
| 13 | Move the mouse over the patient without clicking | **Known regression:** this now runs at about 25 frames per second in a visible Chrome window, against 68 before (Section 5). Does it feel sluggish to you? | — |
| 14 | Lamps: compare `c6-before-after/V1-lamps-before-9c5f55f-1440x900.jpg`, `V1-lamps-after-spot-1440x900.jpg` and `V1-lamps-not-chosen-directional-1440x900.jpg` | Pick the look you prefer | — |
| 15 | Table pads: `c6-before-after/F27-side-close-1440x900.jpg` | The patient's back sinks into the pad. Decide whether the table top may be lowered (Section 9) | — |
| 16 | Narrow window (about 560 px wide) | After each training step the 3D view comes back to the top of the screen | 10 |

Screenshot numbers refer to `evidence/p1-interaction/owner-review/` (Section 6).

## 9. Deviations, known issues and decisions waiting for the owner

**Regression found here, fixed afterwards** (Section 11).
- **Hover slowdown (C2, item 12).** Moving the mouse over the scene without clicking is slower than before. In the PR-10 capture (headed Chrome, V1) the hover frame rate fell from 68 to 25 frames per second. The median frame went from 7.1 to 41.7 ms. C6 measured this; the verifier re-measured it in Section 6.
  - **Cause:** every hover pick runs a full-skin raycast of about 40 ms, even over the empty room, because the ray passes through the skin's enlarged bounding sphere. C2 moved that pick into the frame (at most one per frame, after a 3 px move). In the capture nearly every hover frame now lasts about 42 ms; before, most frames stayed short (median 7.1 ms). Why the old path ran fewer picks was not established (UNKNOWN).
  - **RECOMMENDATION (P1 follow-up, small):** pick only when the pointer pauses (about 80 ms) or at most about 10 times a second. Keep the click path as it is (a click still picks at once). The proper fix is a coarse skin proxy or a BVH in P5.

**Deviations from the plan.**
- **AC-P1-2 (F26):** the lamp lights are now SpotLights in both paths. The criterion asks for the fallback's DirectionalLights. Restoring the DirectionalLights brightened the whole V1 picture by 30 % and the skin by 31 % (washed out). The spot lights add 11.7 % on the torso and 2.4 % in the room. Colour and intensity are unchanged. The owner picks (checklist item 14).
- **AC-P1-3 (F17):** (a), the touch normal in world space, is done inside item 3: the face normal of the skinned hit, transformed by `matrixWorld`. (b), the bind-pose forearm-grip normal, is not changed at its source (SOURCE-INSPECTED). C3 tilts the drill grip normal up instead (normal.y ≥ 0.6), which is what made the drill grip reliable. The unit tests with rotated fakes were not added. Full skinned normals stay in P5 (AC-P5-6).
- **AC-P1-4:** proven by the browser check C6-b with the real crew. The unit test with a fake crew was not added, so `npm test` stays at 21 cases.
- **AC-P1-5 (F27):** measured and confirmed (up to 52 mm), but not changed. The change waits for the owner.
- **AC-P1-7 ("one commit per fix"):** the clusters committed several fixes each; C1 has four items in one commit and C2 five. Every commit message lists its fix IDs and checks. Splitting them now would rewrite history the reports cite. **RECOMMENDATION:** an owner waiver.
- **AC-P2-5 (P2, touched early by C5):** the plan asks that switching to the room view during the drill tear the drill down, show a notice and log a new `mode_changed` event. Following the ranked list, the room view (and the anatomy view) is instead **refused** while the drill is open, with a message. No event type was added. **RECOMMENDATION:** accept the refusal and reword AC-P2-5 at P2.
- **smoke.spec.mjs:** two intended changes.
  - S2 accepts a grip before «اقترب», because the hand no longer stalls; it also accepts the new no-contact text.
  - S6 expects the room view to be refused in the drill, closes the drill, then opens the room view. SMOKE_PROTOCOL.md S6 is updated.

**Known issues left open** (from the cluster reports, unchanged by the verifier):
- **Pose and contact:**
  - The free bedside wrist grab leaves the fingers about 2 cm inside the wrist.
  - After a press the middle fingertip floats about 1.5 cm above the dent.
  - When a limb grab starts, the elbow or knee jumps about 1.1 cm (this was already there).
- **View cuts:**
  - Going from the room view back to the trainee view is still a cut.
  - Coming back from the scope monitor, the view still snaps when a limb is held or a tool is inserted.
  - A scope left in the port goes back to the tray without a word when the trainee leaves the work area.
- **Slow frames:**
  - A click in the same instant as a mouse move still takes one 42 ms raycast (a 52–57 ms frame).
  - Below 48 frames per second the hand speed caps make hands proportionally slower.
  - On a machine running at a few frames per second, a reach can time out. C5 reproduced this only with a 30× CPU slowdown.
- **Layout:**
  - At 1440 px the look hint lies over the tray handle (still clickable).
  - At 448 px with the scope held, the overlays take about 40 % of the view height.
- **QA readout:** `abdomen.penetration` reads 0.06 m on the flank because it is a top-down height. The checks use a local depth instead.
- **Browsers:** the Firefox project is still BLOCKED on this machine. WebKit on Windows still loses its WebGL context at boot now and then (U21).

**Found by this verification** (beyond the cluster reports):
- **C4-11a is intermittent on Chrome at 1440:** a tool turned 6.64° and 6.72° in one frame during the pickup, against the 6° check; 2 failures in 5 runs. It passed on Edge and WebKit. Section 3.2 gives the reading and the recommendation (cap the 300 ms grip blend).
- **Step 5, failed return (C3-9e):** the largest one-frame wrist step was 15.9 mm (Chrome, 1440). That is inside the check's 20 mm, but more than the 4.5 mm C3 measured. The settle speed is capped per second, so on long frames (40–50 ms, during mouse movement) each frame's step is larger.
- **Room view glide:** it is timed (1.2 s), so its largest single-frame step depends on the frame time: 0.21–0.25 m on Chrome and 0.34 m on Edge, out of 4.15 m. The check allows a quarter of the way.
- **Owner review, flank touch:** the hand reaches under the flank palm-up (shot 04). It does not penetrate, but it is not a natural touch.
- **Owner review, pinch:** the sleeve lies flat across the abdomen and chest (shot 03).
- **At 560 px:** the scene caption is partly covered by the top buttons. It has the same position on `main`, so P1 did not cause it.
- **Test artefact, not an app fault:** taking a screenshot of a narrow page in a visible Chrome window pauses a held limb (shot 12). A headless repeat did not pause.
- **WebKit on Windows** lost its WebGL context in 23 of 70 first attempts. All passed on retry (Section 3.3).

**Decisions waiting for the owner** (each with a recommendation, per the working agreement):

| # | Decision | Recommendation |
|---|---|---|
| 1 | Lamp look: spot lights (now) or the plan's directional lights | Keep the spot lights; they light the work area without washing out the skin |
| 2 | F27: lower the table-top model by 52.5 mm so its pads sit at 0.900 m, where the code already puts the patient. Keep the 0.47 m half-width until P5 | Yes. It is one constant at load and in `setDeckHeight`. Re-run S2, S3 and C3 afterwards and check the base seam by eye |
| 3 | Hover slowdown: a quick fix now (pick on pause, ≤ 10 per second) or wait for the P5 skin proxy | Done without either trade-off: a skinned-vertex cache makes every pick fast (Section 11) |
| 4 | Room view during the drill: accept the refusal and reword AC-P2-5 | Accept |
| 5 | AC-P1-7: waive "one commit per fix" for the cluster commits | Waive |
| 6 | Keeping your own look offset through walks round the bed | Keep, unless it feels wrong when you try it (checklist item 11) |
| 7 | Next step | Your visual review (Section 8). Then F27 as a small P1 follow-up, then P2/T2 as approved |

## 10. Evidence kept with this report

All under `docs/improvement-plan/evidence/p1-interaction/`:
- `verify/`: the run logs and Playwright JSON reports of the four runs; `npm-test.log`, `vite-build.log`, `standalone-preview.log`; the failing C4-11a JSON and the four re-run results.
- `interaction/serve-{chrome,edge,webkit}-headless/*.json`: replaced by the verifier's runs on `9d85155`, so the folder holds one consistent set per browser.
  - The Edge folder is new.
  - WebKit files come from the attempt that passed.
  - Chrome's `C4-11a-…-1440x900.json` is the last, passing re-run.
  - The clusters' earlier JSON stays in git history and in the `c3-` to `c6-before-after/` folders.
- `smoke/serve-{chrome,edge,webkit}-headless/*.json`, `smoke/vite-preview-*/S1-boot.json` and `visual/serve-*/V1–V4 *.json`: the verifier's smoke readouts.
- `owner-review/`: 12 JPEG screenshots and `owner-review.json` (Section 6).

The screenshots the suites wrote during these runs are **not** committed, to keep the repository small. The `screenshot` fields in the V1–V4 JSON therefore name files that are not kept; re-running the suite regenerates them. The clusters' committed screenshots are unchanged.

## 11. Addendum (17 November 2026): the hover regression is fixed

After the verification above, the lead found the cause of the hover slowdown with Chrome's CPU profiler and fixed it. Commit: the one that adds `src/patient/SkinPickCache.js`.

**Cause (VERIFIED with the CPU profiler, headed Chrome, V1, 6 s of hover).**
- 91 % of hover time was inside three.js `SkinnedMesh.getVertexPosition` → `applyBoneTransform`.
- three.js skins each corner of each triangle it tests and computes one bone-matrix product per weight. A vertex shared by six triangles is therefore skinned six times.
- One pick over the patient walked about 105,000 triangles (about 317,000 vertex reads), so it took about 40 ms.

**Fix.** `installSkinPickCache(skin)` is called once per patient skin, in `fixPatientSkinBounds`.
- During a raycast, each skin keeps one skinned position per vertex.
- A vertex is recomputed only when something it depends on changed:
  - one of the bones that weight it;
  - the bind matrices;
  - the morph influences;
  - the position, skin-index or skin-weight attribute. The abdomen dent changes the position attribute's version.
- It uses three.js's own arithmetic in the same order, so the hits are bit-identical.
- Outside a raycast, `getVertexPosition` is three.js's own. AbdomenSurface and CrewController read vertices directly and see no change.
- New `?qa` readout: `skinPick` (syncs, computed, reused, resets per skin).

**Checks.**

| Check | Before | After |
|---|---|---|
| Hover, headed Chrome, V1, 6 s (rAF) | 21.5 fps, median 48.6 ms, p95 55.6 ms | **137 fps, median 6.9 ms, p95 7.2 ms** (the display's 144 Hz) |
| Vertices skinned during that hover (main skin) | about 317,000 per pick | 70,278 once (each vertex once), then 0; about 118 million cached reads |
| C4-11a (tool pickup turn per frame), Chrome, 4 repeats at both sizes | 2 failures in 5 runs at 1440 (6.64°, 6.72°) | 8/8 pass, largest step 5.83° (the hand cap) |
| `tests/skin-pick-cache.test.js` (new) | — | 4/4 |

What the new unit test checks:
- A bent three-bone tube with a morph target and front-, back- and double-sided materials.
- 441 rays, compared field by field with three.js (distance, point, face, face normal, material index, uv, normal), through bone, morph and position changes.
- An unchanged pose skins no vertex again; a moved bone recomputes only the vertices it weights.
- A deliberately broken copy of the cache fails the test.

**Reading of C4-11a (TEST-VERIFIED, cause inferred).**
- The over-limit frames came after the 40 ms click-frame pick: a long frame lets the per-second speed cap take a large step.
- With the pick at a few milliseconds, the largest step is the cap's own 5.83°.
- The 300 ms grip blend was not changed.

**Still open from Section 9.** "A click in the same instant as a mouse move still takes one 42 ms raycast" no longer holds: the pick now costs a few milliseconds. A coarse proxy or BVH in P5 remains useful for contact queries, but hover no longer needs it.

**Full re-run on the fix (17 November 2026, smoke + interaction suites).**

| Run | Result |
|---|---|
| Chrome | 70 passed, 1 skipped by design. 1 failure: S1 expected 21 JavaScript modules and saw 22, because of the new `SkinPickCache.js`. S1 now expects 22 (`smoke.spec.mjs:238`, SMOKE_PROTOCOL S1). C4-11a passed |
| WebKit on Windows | 46 passed, 22 flaky (the known WebGL context loss at boot), 2 skipped. 2 failures: S1 (the same module count), and C4-11a at 1440 with 6.06–6.07° against 6° |

**C4-11a on WebKit: the tool pickup ease.**
- WebKit frames here are 43–53 ms, so the hand's turn cap gives 5.83° in each frame (280°/s with the 1/48 s step limit).
- The over-limit frame was always 3–13 ms after the grasp. The tool's step was the hand's capped step plus the grasp snap (the glove matched the tool within 4°, then the tool took the glove's rotation).
- Lowering the snap to 1.5° alone was not enough: 6.02–6.08° in 4 of 6 runs. The 300 ms carry ease turned the grip at up to 1.5 × 92.7° / 0.3 s = 464°/s, ahead of the hand's 280°/s cap, so the hand ran at the cap from the first frame after the grasp.
- **Fix (`BedsideInteraction.js`):**
  - `toolGripTurn` is 1.5° (was 4°).
  - The ease lasts `max(300 ms, 1.5 × angle / (0.7 × 280°/s))`, about 0.71 s for the 92.7° tray-to-carry turn. Its peak turn rate stays at 70 % of the hand cap, so the hand follows a bell-shaped speed profile instead of running at the cap.

| Re-check after the fix | Result |
|---|---|
| WebKit C4-11a, 3 repeats at both sizes | 6/6 pass |
| Chrome C4-11a, 3 repeats at both sizes | 6/6 pass |
| Chrome: C4 tools, S1, S4, S5, S9 | 16/16 |
| WebKit: the same | 11 passed and 5 passed on retry (known context loss and boot timeouts), 0 failed |
