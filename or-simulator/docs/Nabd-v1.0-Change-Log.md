# Nabd Clinical Simulator v1.0 — Change Log

## Foundation changes from v0.22

1. Moved the existing runtime to `src/app/NabdRuntime.js`; `src/engine.js` is now a small application entry point.
2. Moved patient, bedside interaction, staff, instrument kinematics, scope feed, monitor UI and workstation logic into domain folders.
3. Kept compatibility re-exports at the previous source paths.
4. Added `EventBus`, `EventLogger` and `SimulationManager`.
5. Added real event capture for session start/completion, stage changes, checklist completion, tool selection/pick/release/failure, hand selection, camera view changes, patient contact/release, endoscope movement and interaction errors.
6. Added a centralized configuration for the four existing instruments. Their existing lengths, support for depth control and grip anchor are preserved.
7. Added `SceneManager` as the render/resize lifecycle boundary.
8. Added opt-in FPS/renderer diagnostics using `?debug=1`.
9. Added an asset manifest with byte sizes and SHA-256 hashes; source GLB files remain unchanged.
10. Added a dependency-free Node static server as a fallback (`npm run serve`).

## Preserved

- Original Three.js r180 runtime and rendering approach.
- Existing room, patient, supervisor, gloves, table, surgical-light, anesthesia and instrument assets.
- Existing HTML controls, CSS identity, camera views and patient positioning controls.
- Existing training stages, vital monitor interaction, appendectomy/laparoscopic and neck scenario entry points.
- Existing scope feed and instrument kinematics.

## Not included in v1.0

No new clinical procedure capability, tissue cutting, suturing, volume-based soft-tissue physics, full rigid-body simulation, simultaneous dual-hand ownership, or anatomy validation has been added.
