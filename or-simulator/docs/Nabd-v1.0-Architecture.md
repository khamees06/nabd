# Nabd Clinical Simulator v1.0 — Architecture

## Architectural approach

Version 1.0 is a preservation-first foundation release. The existing Three.js runtime remains the composition root while its domain services are moved behind explicit modules. The renderer is not replaced, clinical scenario semantics are not changed, and the patient/staff/room assets are preserved.

## Module boundaries

```text
src/
├── app/
│   └── NabdRuntime.js              # Existing Three.js runtime and composition root
├── core/
│   ├── EventBus.js                 # Synchronous application event boundary
│   ├── SceneManager.js             # Scene/renderer/camera lifecycle boundary
│   ├── PerformanceMonitor.js       # Low-overhead renderer/FPS sampling
│   └── WorkstationNavigation.js   # Existing bedside walk-path logic
├── patient/
│   └── AbdomenSurface.js           # Existing local abdominal surface deformation
├── staff/
│   └── CrewController.js           # Existing hand/staff/instrument rig controller
├── interaction/
│   ├── BedsideInteraction.js       # Existing pointer, grip, contact and release logic
│   ├── hold-gate.js
│   └── target-filter.js
├── instruments/
│   ├── InstrumentConfig.js         # Metadata for the four existing tools
│   ├── InstrumentKinematics.js     # Existing remote-centre instrument motion
│   └── EndoscopeFeed.js             # Existing live scope render-target feed
├── simulation/
│   ├── EventLogger.js              # In-memory structured session event log
│   └── SimulationManager.js        # Session lifecycle and stage transitions
└── ui/
    ├── MonitorUI.js                 # Existing vital-sign monitor UI
    └── DiagnosticsPanel.js          # Optional ?debug=1 developer overlay
```

## Layer responsibilities

### 3D / scene layer

`SceneManager` owns the stable interface to the existing Three.js scene, renderer and active camera. The legacy runtime still creates the detailed room and procedural geometry because the original implementation is bundled into one large runtime file. Rendering and resizing now pass through `SceneManager`.

### Simulation layer

`SimulationManager` owns the current training session and stage. `EventLogger` records structured events in memory. Neither module reads DOM nodes or sends information to an external service. The event bus publishes records to optional observers such as the developer diagnostics panel.

### Interaction / instrument layer

`BedsideInteraction` remains responsible for pointer capture, reach, grip attachment, contact and release. Instrument metadata is centralized in `InstrumentConfig`; `CrewController` reads the metadata while retaining the original instrument geometry and the original v0.22 grip anchor. `InstrumentKinematics` remains responsible for the scope/grasper depth control and remote-centre movement.

### Patient / staff / UI layers

The abdominal surface, staff rig and vital monitor have been moved to domain folders. Existing compatibility re-export files remain at the previous paths to avoid breaking downstream imports.

## Event contract

Each event has:

- `eventId`: unique event identifier.
- `event`: supported event name.
- `timestamp`: ISO-8601 timestamp.
- `sessionId`: current training session or null outside a session.
- `stage`: current stage.
- `success`: boolean outcome.
- `metadata`: optional JSON-safe event details.
- Optional `instrument`, `hand`, and `target` fields.

Events are held in memory only. Starting a new session clears the prior session log. Resetting a session clears the log. No backend or external transmission is configured.

## Compatibility

- `src/engine.js` remains the HTML entry point and imports `app/NabdRuntime.js`.
- Compatibility re-exports remain at the previous `src/*.js` module paths.
- Three.js r180 implementation and the current HTML/CSS visual identity are preserved.
- Existing GLB files are not recompressed or modified in this release.
