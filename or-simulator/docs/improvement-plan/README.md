# Nabd Clinical Simulator v1.5 — Improvement Plan (document index)

**Prepared:** 13 November 2026 · **Updated:** 14 November 2026, with the owner's decisions on D1, D2, D3, D7 and D9 and the new document 11; updated again the same day with his second message, which settles D4, D5, D6, D8 and D10, refines D1, D2, D7 and D9, and starts task T1; updated a third time the same day after the T1 run and the F19 fix (T1 not yet complete; owner checkpoint 1 pending) · **Scope:** these documents are planning only and change no application code, asset, package or scene. The implementation work of T1, which began on 14 November 2026 on the git branch `t1-baseline-f19` and whose run and fix were done the same day, is tracked in the status note of [10](10_NEXT_IMPLEMENTATION_TASK.md) and reported in [phase-reports/P0-completion.md](phase-reports/P0-completion.md).

**Inputs used:**
- The repository itself, as extracted unchanged from `Nabd-Clinical-Simulator-v1.5-Forearm-Contact.zip`. All 83 files were checked byte-for-byte against the archive after the audit.
- The owner's `Nabd_Experience_and_Workflow_Brief.md`.
- The orientation document `Nabd_v1.5_Repository_Review.md`, named in the request, was **not found** anywhere on disk. The repository was therefore treated as the only source of truth.

**Approval gate:** on 14 November 2026 the owner agreed to the plan's decisions («طيب أنا موافق على قراراتك» — "Fine, I agree with your decisions") and approved D6, so T1 ([10](10_NEXT_IMPLEMENTATION_TASK.md)) started. **Status: the T1 run and the F19 fix were done on 14 November 2026 on the branch `t1-baseline-f19` (not merged, nothing pushed). T1 is not yet complete: 7 of its 11 acceptance criteria are MET and 4 PARTIALLY MET ([phase-reports/P0-completion.md](phase-reports/P0-completion.md)); owner checkpoint 1 is pending.** Nothing else in [07](07_PRIORITIZED_IMPROVEMENT_ROADMAP.md) or [11](11_FULL_SESSION_SCENARIO.md) has been started. Each later phase still begins only after its owner checkpoint ([07](07_PRIORITIZED_IMPROVEMENT_ROADMAP.md) §6).

## Reading order

| # | Document | Read it to learn | Time |
|---|---|---|---|
| 1 | [01_PROJECT_UNDERSTANDING.md](01_PROJECT_UNDERSTANDING.md) | What the project actually is, how it starts and runs each frame, and how its systems connect | 15 min |
| 2 | [02_CURRENT_STATE_AUDIT.md](02_CURRENT_STATE_AUDIT.md) | What was actually tested, built and run, system-by-system evidence, and the findings register F01–F35 | 30 min |
| 3 | [03_REQUIREMENTS_GAP_ANALYSIS.md](03_REQUIREMENTS_GAP_ANALYSIS.md) | Each of the 23 requested capabilities (G01–G23) compared with reality | 30 min |
| 4 | [04_EXPERIENCE_AND_WORKFLOW_DESIGN.md](04_EXPERIENCE_AND_WORKFLOW_DESIGN.md) | The proposed session: people, room layout, communication panel, action and response loop | 20 min |
| 5 | [05_HAND_CONTACT_AND_MOVEMENT_OPTIONS.md](05_HAND_CONTACT_AND_MOVEMENT_OPTIONS.md) | Hands, arms and whole-body contact: current architecture, options, recommendation | 25 min |
| 6 | [06_APPENDICITIS_CASE_WORKFLOW.md](06_APPENDICITIS_CASE_WORKFLOW.md) | The first case's structure, with every clinical item marked for qualified review | 15 min |
| 11 | [11_FULL_SESSION_SCENARIO.md](11_FULL_SESSION_SCENARIO.md) | Full session scenario — storyboard and script: the cast, stations, side chat and communication through actions, the supervisor's intervention ladder, scene-by-scene script and emergency branches, with every clinical item a draft for review | 35 min |
| 7 | [07_PRIORITIZED_IMPROVEMENT_ROADMAP.md](07_PRIORITIZED_IMPROVEMENT_ROADMAP.md) | Phases P0–P11 in dependency order, each with acceptance and evidence | 30 min |
| 8 | [08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md](08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md) | The decision log; decisions that can be made now (DN1–DN6), the owner's decisions (D1–D10), unknowns | 20 min |
| 9 | [09_ACCEPTANCE_AND_VALIDATION_PLAN.md](09_ACCEPTANCE_AND_VALIDATION_PLAN.md) | Measurable acceptance criteria per phase, metrics, clinical review checkpoints | 20 min |
| 10 | [10_NEXT_IMPLEMENTATION_TASK.md](10_NEXT_IMPLEMENTATION_TASK.md) | The single recommended next task (T1), ready to execute after approval | 10 min |
| — | [phase-reports/P0-completion.md](phase-reports/P0-completion.md) | The T1 completion report (09 §7 template): acceptance results for AC-P0-1 to AC-P0-10 and AC-P1-1, tests, smoke, invariants, metrics, unknowns, known issues and the owner checkpoint 1 | 15 min |
| — | [REPOSITORY_EVIDENCE_INDEX.md](REPOSITORY_EVIDENCE_INDEX.md) | Where every important file, function, asset and test is, and which findings it supports | reference |

The first column is the document number. Document 11, added on 14 November 2026, is read straight after 06, because it turns the session design of 04 and the case structure of 06 into the complete session script.

**Short route for the owner:** read the summary and the decision status below, then 03 (summary table only), 11 (full session scenario — storyboard and script), 07 (overview table), 08 (decision log and open questions) and 10. For checkpoint 1, read [phase-reports/P0-completion.md](phase-reports/P0-completion.md).

## Summary in one page

**What the project is.** Nabd v1.5 is a browser-based Three.js r180 operating-room prototype with an Arabic interface.

- **Code:** almost all application logic sits in one 6,160-line composition file, `src/app/NabdRuntime.js`, which also contains an inline copy of three.js. Smaller domain modules sit around it.
- **What runs today:**
  - a procedurally built room plus equipment GLB models;
  - a rigged, posable patient with an internal anatomy atlas of 35 structures, including the appendix;
  - a first-person trainee shown as two gloved forearms;
  - a full-body supervisor driven by code;
  - a forearm-contact drill that uses Rapier shape queries;
  - four kinematic instruments and a laparoscopic scope feed;
  - one generic five-step practice drill.

**What was verified.**
- **Browser run:** the app was opened in a real browser (Chromium 152, Intel Iris Xe, WebGL2). It boots with no console errors and loads every module, model and the Rapier engine. The forearm drill grips, lifts and is supported by the supervisor.
- **Two defects seen at runtime:**
  - the trainee's sleeve stretches into a very long cylinder while reaching (`evidence/03-forearm-lift-stretched-sleeve.png`);
  - the surgical scissors render without blades and raise NaN geometry errors (`evidence/10-scissors-without-blades.jpg`). *Since T1: the needle holder showed the same errors, and the F19 fix (commit `006881f`) removed them for both; the scissors now show their blades (`evidence/11-scissors-with-blades-after-f19-fix.jpg`).*
- **Tests:** 13 files, 21 cases. `node --test` reports 20 results, of which 19 pass. The forearm-contact test cannot load because the `three` package is not installed. *Since T1 (14 November 2026): after `npm ci`, `npm test` passes 21 of 21, so both forearm-contact cases are TEST-VERIFIED ([10](10_NEXT_IMPLEMENTATION_TASK.md) status note).*
- **Builds:** the standalone preview builds and runs. The Vite build could not run because its dependencies are not installed. *Since T1: the Vite build succeeds, and it deletes the standalone preview from `dist/` (U17 settled); the rebuilt preview also works over `file://` (U11). The post-fix build deleted it again, so it has to be rebuilt after every Vite build.*
- *Since T1 — browsers and performance:* a Playwright smoke suite ran the flows S1–S9 in Chrome, Edge and WebKit on Windows (a Safari-engine approximation, not Safari); Firefox is BLOCKED in this environment. The first valid frame times exist for one laptop (Intel Iris Xe), with no budget applied yet ([02](02_CURRENT_STATE_AUDIT.md) §4 status note).

**Largest gaps against the brief.**
- **People:** no trainee body, no nurse, and no doctor behaviour beyond scripted arm poses.
- **Contact:** shape-query collision exists only in the forearm drill, for the patient's left arm and the mattress.
- **Hands:** two-hand interaction is impossible.
- **Communication and scenario:** no communication of any kind, no scenario engine, and no appendicitis case.
- **Patient state and evaluation:** vital signs are demo values, and there is no evaluation or debrief.
- **Interface:** the screen is dense with authoring controls.

**Recommended order.** P0 baseline → P1 verified fixes → P2 runtime seams → P3 trainee body ‖ P4 room → P5 whole-body contact ‖ P6 scenario state → P7 two-hand and handover → P8 doctor and nurse → P9 communication panel → P10 appendicitis case and evaluation. P11 validation runs throughout.

**Next steps.** On 14 November 2026 the owner decided D1, D2, D3, D7 and D9, and in a second message the same day settled D4, D5, D6, D8 and D10 (see the decision status below). [11](11_FULL_SESSION_SCENARIO.md) sets out the full session scenario that P6–P10 build towards. With D6 approved, T1 is **in progress** (done so far and what remains: the status note in [10](10_NEXT_IMPLEMENTATION_TASK.md)). *Status: the T1 run and the F19 fix were done the same day on the branch `t1-baseline-f19`; T1 is not yet complete (7 of 11 criteria MET, 4 PARTIALLY MET), owner checkpoint 1 is pending ([phase-reports/P0-completion.md](phase-reports/P0-completion.md)), and T2 waits for it.* T1 is "Establish the baseline and pass the first verified fix through it" (all of P0 plus the F19 item of P1): put the project under version control, restore dependencies from the existing lockfile with `npm ci`, make all 21 test cases pass, run the Vite build and smoke-test it, add a browser smoke protocol on the existing `?qa` API (with WebKit runs as a first Safari approximation, now that Playwright is approved), capture visual and performance baselines in a visible window, and pass the scissors and needle-holder fix (F19, `src/staff/CrewController.js:232-233`) through that pipeline. The task after it, T2, is a time-boxed P3 spike that tests the decided D1 approach: a full-body trainee made from the existing body, with continuous arms and the camera at its eyes (branch only, owner visual review). Running the simulator locally needs none of this: it already runs in the built-in browser preview through `scripts/serve.mjs`, through `start-dev.bat`, or (untested at the time; the T1 run found that it works, U23) through VS Code Live Server.

## Decision status (14 November 2026, after the owner's second message)

| Decision | Status | In one line |
|---|---|---|
| D1 Character assets | DECIDED (owner, 2026-11-14; refined the same day) | Option A+: the trainee, supervising doctor and nurse are copies of the existing clothed body, modified in-house; changing their features is approved, and no new 3D human is built from scratch. The nurse is a woman with an ordinary appearance, a hair cover and a mask. The patient keeps its own model |
| D2 Dialogue understanding | DECIDED (owner, 2026-11-14; refined the same day) | The owner's own model, now in training, answers the trainee through a validated adapter with a deterministic fallback. It will run both locally and online, so the adapter supports a local and an online endpoint with the same contract; privacy and cost of the online path stay open |
| D3 Language register | DECIDED (owner, 2026-11-14) | A middle register between Fusha and colloquial Arabic for in-simulation dialogue and prompts |
| D4 Input and two-hand scheme | DELEGATED with consultation (owner, 2026-11-14) | The team chooses the most suitable keyboard and mouse scheme during implementation and asks the owner, with a recommendation, whenever a choice matters; mouse-and-keyboard "hold-and-act" stays the working default |
| D5 Physics and movement | DECIDED (owner, 2026-11-14) | Smooth, natural human movement: joints within natural limits, and no hand sinking into the bed or the patient, except intentional entry through wounds or incisions, ports or the scope when the scenario calls for it. Kinematic control plus constraints (former option A) |
| D6 Repository and tooling | APPROVED, IN PROGRESS (owner, 2026-11-14) | git baseline `acdab52` tagged `v1.5-baseline`, `npm ci`, 21 of 21 tests, Vite build and Playwright 1.64.1 are done; the owner authorised further downloads without asking. The T1 run is done, but T1 is not yet complete and awaits owner checkpoint 1 (status note in 10; [phase-reports/P0-completion.md](phase-reports/P0-completion.md)) |
| D7 Clinical review | DECIDED (owner, 2026-11-14; refined the same day) | The admin model and specialist models are the AI review stage. Certified doctors audit the clinical content and test the simulator before it is adopted as training, so their sign-off is the gate for "clinician-validated" and for training use. For now it is built as a prototype |
| D8 Licences and provenance | DECIDED (2026-11-14; our reading of the owner's general approval) | Option A: add the missing Rapier notice (P1) and the font licence texts, and document asset provenance (P11). Legal questions, such as the share-alike notes, stay flagged |
| D9 Platforms and browsers | DECIDED (owner, 2026-11-14; refined the same day) | The web, in desktop browsers; Chrome and Safari mandatory, other modern browsers expected. An installable desktop or mobile app may come later. Unity deferred; the minimum machine and the budget stay PROPOSED |
| D10 Visual identity | DECIDED (owner, 2026-11-14) | The yellow equipment colour changes, the equipment is redesigned toward realism in-house, and during laparoscopy a screen showing the procedure stands close to the trainee in the line of sight (P4). The interface identity is unchanged |

DN1–DN6 need no owner input beyond approving the plan. Details, residual risks and the remaining questions for the owner (minimum machine and Safari versions, privacy and cost of the online model path, the names of the certified doctors, legal advice on the share-alike notes, source files, the appendix question) are in [08](08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md).

**Working agreement (owner, 2026-11-14).** The owner wants suggestions and improvements raised while the work is under way: «وأي اقتراح أنت بتقترحه أثناء سير العملية أعطيني إياه برضه ما في عندي أي مشكلة» ("And any suggestion you make while the work is under way, give it to me as well; I have no problem with that"). Each question goes to him explained, with the options and a recommendation, and he answers: «بتطرح علي السؤال، بتوضحه، بتحكيلي أجوبتك وإيش توصيتك وأنا برد عليك» ("You put the question to me, explain it, tell me your answers and what you recommend, and I reply"). Details are in [08](08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md).

## Conventions used in every document

| Label | Meaning |
|---|---|
| **VERIFIED** | Executed and observed in the audit's own browser session (cited as R1–R21) or build run (B1–B5), or in the T1 run of 14 November 2026 (cited as "T1 run"; [10](10_NEXT_IMPLEMENTATION_TASK.md) status note) |
| **TEST-VERIFIED** | Covered by a repository test that actually passed in this audit (the test is named) |
| **SOURCE-INSPECTED** | The code was read; the behaviour was not executed |
| **PARTIALLY VERIFIED** | Only part of the behaviour was observed or tested |
| **PLANNED** | Proposed work; does not exist yet |
| **UNKNOWN** | No reliable evidence; the document states what would settle it |
| **DATA-DERIVED (audit analysis)** | Computed from asset or geometry data by read-only scripts during the audit; never a test result |
| **CLINICAL REVIEW REQUIRED (CR-nn)** | Clinical content that goes through the D7 review pipeline (the owner's admin model) and always shows its review label; only the sign-off of certified doctors makes it "clinician-validated", and the owner confirmed on 2026-11-14 that this sign-off is required before the simulator is adopted as training (D7) |
| **PROPOSED** | A threshold or tolerance in [09](09_ACCEPTANCE_AND_VALIDATION_PLAN.md) that awaits owner confirmation |
| **RECOMMENDATION** / **ASSUMPTION** | Marked separately from facts; assumptions are registered as AS# in [08](08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md) |
| **DECIDED** / **PENDING** / **OPEN** / **TO CONFIRM** | State of an owner decision in [08](08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md); TO CONFIRM marks an interpretation of the owner's answer that he still has to confirm |
| **APPROVED** / **IN PROGRESS** | The owner said yes to the recommended option of a decision / the approved work has started (D6) |
| **DELEGATED** | The owner left the choice to the team, which decides during implementation and consults him, with a recommendation, whenever a choice matters (D4) |
| **BLOCKED** | A planned check that could not run in this environment; the reason is stated, and it stays open until resolved |

**Content review labels (D7, DN5).** Scenario content carries one of three labels: "illustrative", "AI-reviewed (admin model) — not clinician-validated" or "clinician-validated". These describe clinical content, not the evidence for claims about the code.

**ID scheme:**
- Findings F01–F35 (canonical in 02).
- Gaps G01–G23 (canonical in 03).
- Phases P0–P11 (canonical in 07).
- Decisions DN1–DN6 and D1–D10, unknowns U1–U24 and assumptions AS1–AS15 (canonical in 08).
- Acceptance criteria AC-P#-# and clinical review checkpoints CRC-# (canonical in 09).
- Clinical review items CR-01–CR-42 (canonical in 06 §8); CR-34–CR-42 were introduced in 11 §13 and are registered in 06, each assigned to a checkpoint CRC-1–CRC-7 in 09 §6.
- Smoke flows S1–S9, metrics M1–M12, baseline views V1–V4 and invariants INV-1–INV-11 (canonical in 09; INV-11, natural movement, was added for D5 on 14 November 2026). The appendicitis case stages S0–S9 and depiction levels DL0–DL3 in 06 are a separate numbering; 11 uses the same scene IDs S0–S9 as 06.
- Supervisor intervention levels L0–L6 and emergency branches E0–E2 (canonical in 11).
- Tasks T1 (next task) and T2 (the P3 spike that follows it), canonical in 10.

Code references use repository-relative paths with line numbers, for example `src/staff/CrewController.js:437-453`. Some lines of `src/app/NabdRuntime.js` are minified and very long; they are cited as `line@byte`.

## Evidence folder

`evidence/` holds the screenshots taken during the audit's browser run. Since T1 it also holds image 11 and two folders from the T1 run: `baseline-p0/` (smoke, visual and performance results on the unmodified code, summarised in [evidence/baseline-p0/RESULTS.md](evidence/baseline-p0/RESULTS.md)) and `p0-post-fix/` (the runs after the F19 fix). They are indexed in [REPOSITORY_EVIDENCE_INDEX.md](REPOSITORY_EVIDENCE_INDEX.md) §6.

| File | Shows | Check |
|---|---|---|
| 01-default-bedside-view.jpg | Default trainee view | R4, R5 |
| 02-forearm-drill-grip.jpg | Forearm drill grip | R9 |
| 03-forearm-lift-stretched-sleeve.png | Stretched sleeve defect | R10 |
| 04-supervisor-support-hand.png | Supervisor support | R11 |
| 05-after-release-forearm-supported.jpg | Forearm held after release | R11 |
| 06-room-overview.jpg | Room overview | R13 |
| 07-left-side-preset-supervisor.jpg | Supervisor from the left side, after support had ended | R12 correction |
| 08-internal-anatomy-atlas.jpg | Internal anatomy atlas | R14 |
| 09-training-step-1-of-5.jpg | Training drill, step 1 of 5 | R15 |
| 10-scissors-without-blades.jpg | Scissors rendered without blades; the idle forearm in the tray view | R20, R21 |
| 11-scissors-with-blades-after-f19-fix.jpg | Scissors with blades after the F19 fix (commit `006881f`), zero console errors, in the built-in browser (T1 run, 14 November 2026); compare 10 | F19, AC-P1-1 |

Frame-rate figures were **not** valid in that session because the browser pane was hidden, so performance is recorded as UNKNOWN until measured in a visible window (P0). The first valid reading came from the T1 run on 14 November 2026: about 66 FPS idle in the default view, in headed Chrome 157 on the Intel Iris Xe. That idle figure is the loop rate, not a budget result; the full performance capture is in progress ([10](10_NEXT_IMPLEMENTATION_TASK.md) status note). *Status: the capture is complete and supersedes that preliminary reading — idle 133–144 rAF FPS with about 12 renders per second, active median frame time 7.0–13.9 ms (p95 14.0–27.8 ms), on one laptop and with no budget applied ([evidence/baseline-p0/RESULTS.md](evidence/baseline-p0/RESULTS.md) §6).*

## How the audit was done

1. **Extraction.** The archive was extracted into its own folder, `C:\Users\ss\Nabd-Clinical-Simulator-v1.5-Forearm-Contact`.
2. **Tests and builds.** `node --test` and `node --check` were run, and the dependency-free standalone preview build was built and opened. `npm ci` and the Vite build were **not** run, because installing dependencies was out of scope.
3. **Source reading.** Eight parallel read-only analyses covered:
   - runtime lifecycle;
   - room;
   - patient and anatomy;
   - staff and hands;
   - interaction and contact;
   - instruments;
   - simulation, UI and communication;
   - assets, build and tests.

   A ninth cross-check re-verified the planning-critical claims in source and corrected several misreadings, including one of the audit's own runtime observations (R12).
4. **Runtime observation.** The app was served with the project's own `scripts/serve.mjs` and exercised in the desktop app's built-in browser. Results are recorded as R1–R21 with screenshots.
5. **Documents.** Each document was written from that evidence and then adversarially fact-checked against the source by a separate reviewer. A final pass checked consistency across all documents.
6. **Integrity.** After the audit, all 83 project files were confirmed byte-identical to the archive. The temporary `dist/` preview output was deleted.
