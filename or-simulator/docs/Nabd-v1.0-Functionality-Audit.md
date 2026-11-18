# Nabd v1.0 — Functionality Audit

## Evidence and scope

The original v0.22 project test suite was run before changes. All 7 existing tests passed. The final source test suite is run after changes; 19 unit/integrity tests passed. The static local server returned HTTP 200 for the entry page, patient GLB and ES module. Headless Chromium could not initialize EGL/ANGLE in this environment, so browser/WebGL visual acceptance remains outstanding. Source-level preservation is supported by starting from the full v0.22 project archive and relocating modules with compatibility re-exports. A visual browser/WebGL session was not available in the implementation environment.

## Audit matrix

| Area | v0.22 evidence | v1.0 action | Verification status |
|---|---|---|---|
| Operating room / patient / staff assets | Existing GLB assets and procedural room code | Preserved without replacing assets | Static asset inventory; visual browser test not performed |
| First-person and room camera modes | Existing runtime controls | Preserved; camera changes now logged | Static handler review; visual browser test not performed |
| WASD / bedside movement | Existing trainee movement and workstation walk modules | Preserved; workstation module moved with compatibility export | Existing workstation unit tests + final test suite |
| Hand selection | Existing left/right hand selector | Preserved; hand changes logged | Source inspection; interactive browser test not performed |
| Instrument selection | Existing four tool keys | Preserved; centralized config added | Config unit tests; UI browser test not performed |
| Instrument grab / release | Existing bedside pointer and grip logic | Preserved; structured events added | Source inspection; visual grab test not performed |
| Patient limb / joint movement | Existing rig manipulation | Preserved | Static source inspection; visual test not performed |
| Laparoscopic / endoscope controls | Existing kinematics and scope feed | Preserved; endoscope motion event hook added | Existing kinematics/feed tests + final suite |
| Vital monitor | Existing canvas-based simulated monitor | Moved to UI domain folder | Module syntax check; visual test not performed |
| Training stages / checklist | Existing phase and checklist logic | Preserved; stage and checklist events added | Source inspection; end-to-end browser test not performed |
| Event logging | Not present as a centralized session log | Implemented in memory | Node unit tests |
| Developer diagnostics | Not present as a structured panel | Added behind `?debug=1` | Module syntax check; browser rendering not performed |
| Asset paths | Existing project-relative paths | Preserved; manifest and static server added | Asset path/hash audit |

## Known partial/incomplete systems inherited from v0.22

- The main Three.js runtime remains a large legacy composition file; this release creates service boundaries but does not rewrite the full scene/runtime into small independent controllers.
- The endoscope remote-centre constraint is a software training constraint, not a physical trocar/tissue force simulation.
- The current internal endoscope anatomy consists of illustrative training proxies and is not clinically validated anatomy.
- General contact remains based on the existing proximity/skin-surface approach; it is not a complete volumetric collision solver.
- Only one active bedside grip is supported at a time; simultaneous two-hand manipulation is not implemented.
- The workstation walk path is the existing perimeter path, not full room locomotion with obstacle avoidance.
- Performance metrics are exposed in developer mode, but no before/after benchmark was captured; no FPS improvement is claimed.
