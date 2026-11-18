# Nabd Clinical Simulator v1.0 — Foundation Release Report

**Baseline:** v0.22 source project  
**Release:** v1.0 Foundation  
**Engine:** Existing bundled Three.js r180 implementation  
**Delivery:** Modular VS Code project + standalone HTML preview

## 1. Summary

The v0.22 project was used as the starting point. The existing simulator was not rebuilt, and the Three.js engine, scene, patient/staff models, room equipment, user interface and current training scenarios were preserved. Domain modules were moved into explicit folders with compatibility re-exports. A session event logger, simulation lifecycle manager, centralized instrument metadata, scene lifecycle wrapper and opt-in performance overlay were added.

## 2. Implemented systems

- **Architecture:** `src/engine.js` is now a thin entry point. The existing large runtime is retained as `src/app/NabdRuntime.js` to avoid a risky rewrite of its bundled Three.js internals.
- **Domain organization:** patient surface, staff rig, bedside interaction, instrument kinematics, endoscope feed, monitor UI and workstation navigation are in dedicated folders.
- **Instrument metadata:** the four existing instrument types (`grasper`, `scissors`, `needleHolder`, `scope`) use a shared configuration. Existing lengths, depth-control availability and the existing `0, 0, -0.086` grip anchor are preserved. No new instrument or clinical capability was introduced.
- **Event logging:** in-memory events are emitted for session start/completion, stage changes, checklist completion, instrument selection/pick/release/failure, hand changes, camera changes, patient contact/release, endoscope movement and interaction errors.
- **Layer boundary:** `SceneManager` owns render/resize access; `SimulationManager` owns session/stage state; `EventLogger` owns session event records; the UI diagnostics panel subscribes to the event bus without controlling simulation state.
- **Diagnostics:** `?debug=1` shows FPS, frame time, draw calls, triangles, geometry count, texture count and event count. JavaScript heap memory is included when the browser exposes it.
- **Assets:** existing binary assets remain unchanged. `assets/asset-manifest.json` records the byte size and SHA-256 hash of each asset. A standalone preview build embeds the same original assets.
- **Local serving:** `npm run serve` starts a dependency-free Node static server at `http://127.0.0.1:4173`.

## 3. Preserved functionality

The original HTML and CSS interface, room and patient scene, staff and glove models, operating table, surgical light and anesthesia workstation assets, camera views, first-person trainee controls, hand selection, workstation movement, patient rig manipulation, instrument selection and existing grab/release path, vital monitor, checklist and scenario stages, laparoscopic depth controls and endoscope render-target feed were retained in the v0.22 runtime.

The previous module paths remain as compatibility re-exports where files were relocated.

## 4. Tests performed

- Original v0.22 Node test suite before changes: **7/7 passed**.
- Final Node test suite: **19/19 passed**.
- `node --check` across all project JavaScript and MJS files: **passed**.
- Standalone inline runtime bundle syntax check: **passed**.
- Standalone preview asset embedding audit: all 8 expected GLB asset IDs present; no external stylesheet or script URL references.
- Static server smoke test: `index.html`, patient GLB and ES module returned HTTP 200 with appropriate MIME types.
- Production Vite build: **not run successfully**. Vite was not installed in the execution environment and package registry installation timed out. The project retains its Vite dependency and build script for a normal `npm ci` environment.
- Interactive WebGL test: not completed. Headless Chromium could not initialize its EGL/ANGLE GPU context in this environment and timed out before DOM capture. Therefore no claim is made that the rendered scene, instrument grip behavior or browser visual layout has passed an end-to-end browser test.

## 5. Performance and asset findings

No asset was recompressed or geometrically simplified because that would require visual regression review. The manifest establishes a reproducible asset baseline. The optional diagnostics panel now exposes runtime renderer counters. No measured before/after FPS or memory improvement is claimed.

## 6. Known limitations

1. The large legacy Three.js runtime remains the composition root; further decomposition should be done incrementally behind the new boundaries.
2. The existing bedside interaction still supports one active grip at a time; simultaneous two-hand instrument manipulation is not added here.
3. Existing collision and abdominal surface deformation remain the v0.22 implementation; no complete rigid-body or volumetric soft-tissue solver is introduced.
4. Existing endoscope anatomy is illustrative and not clinically validated.
5. The endoscope kinematics remain the existing training constraint model, not a physical trocar/tissue force model.
6. Event records remain in memory and are not sent to a backend.
7. Browser/WebGL visual acceptance must still be performed on the target desktop and touch devices.

## 7. Run instructions

### Dependency-free local server

```bash
npm run serve
```

Open `http://127.0.0.1:4173`. For the developer diagnostics overlay, open `http://127.0.0.1:4173/?debug=1`.

### Vite development / production build

```bash
npm ci
npm run dev
npm run build
```

### Standalone HTML preview

```bash
npm run preview:standalone
```

The generated file is `dist/Nabd-Clinical-Simulator-v1.0-Preview.html` and contains the existing scene assets and runtime in one HTML file.

### Tests

```bash
npm test
```
