# Nabd Clinical Simulator v0.22 — Implementation Report

## Baseline

Implementation is based on the complete v0.21 VS Code project and retains the v0.20/v0.21 patient, room, staff, glove, and equipment assets. The approved Project 3 operating-room plan is the design reference.

## Implemented in this slice

### 1. Patient-centered work focus

- Added a focus-pick mode that raycasts any visible, non-privacy-protected patient surface.
- Stores the selected point in world coordinates and uses it as the work target/port reference.
- The learner can choose a different point without being restricted to the preset chest/abdomen/limb landmarks.
- Privacy filtering is applied to the intersected material face, so one protected face does not disable visible skin faces on the same multi-material mesh.
- The existing walk-around-bed path moves to the selected side and longitudinal position.
- Both surgical task lights aim at the selected work point; leaving the workstation restores the neutral table focus.

### 2. Separate look, locomotion, and manipulation

- Right mouse drag rotates the view without changing the held object.
- Added a touch look mode for phones/tablets.
- WASD/arrow controls remain responsible for movement around the bed perimeter.
- Work-area zoom is available independently of instrument insertion.

### 3. General surface touch

- General touch follows the actual patient surface by raycasting on each pointer update.
- The hand orientation uses the surface normal when available.
- Contact validation uses 3D distance from glove finger-pad vertices to the selected surface point, not only a horizontal height comparison.
- The existing abdomen press/pinch solver remains a specialized path.

### 4. Scope kinematics and screen feed

- Added a remote-centre kinematic model around the selected port.
- Pitch/yaw are controlled by pointer movement around the port.
- Axial roll is independent and controlled by Z/X or the on-screen roll buttons.
- Insertion/retraction is controlled by the mouse wheel, buttons, or R/V.
- Both endoscopy tower screens now share a WebGL render target from a camera following the scope tip and orientation. When the scope is not inserted, both screens show an explicit NO SCOPE SIGNAL state.
- The current internal cavity/organ shapes are illustrative proxies only, not validated anatomy.

## Controls

| Action | Control |
|---|---|
| Select work point | Click **تحديد نقطة العمل**, then click a visible patient surface |
| Look around | Right mouse drag; on touch, activate **تغيير النظر** then drag |
| Walk around bed | W/A/S/D or arrow keys |
| Zoom while working | Mouse wheel when no scope insertion is active; + / - |
| Scope pitch/yaw | Move pointer around the selected port while the scope is held |
| Scope insertion/retraction | Mouse wheel, on-screen depth buttons, R/V |
| Scope axial roll | Z/X or on-screen roll buttons |
| Release tool | Click again or use the release control |

## Verification

- `node --check` passed for every JavaScript source file.
- `node --test` passed 7 tests covering scope alignment, remote-centre pivot, independent roll, live render-target attachment, camera following, camera-look hold gating, multi-material privacy filtering, and bed-perimeter navigation.
- Full WebGL visual testing was not possible in the current headless runtime because ANGLE/SwiftShader initialization failed. No browser visual acceptance is claimed.

## Known limitations / next implementation stages

1. The work path is still the existing perimeter path; free walking through all room floor space and obstacle avoidance are not implemented.
2. There is still one active pointer/grip gesture at a time; simultaneous two-hand manipulation is a later stage.
3. Tool attachment remains kinematic, not a full rigid-body physics/ownership solver with collisions and falling.
4. The scope port is a kinematic pivot; trocar deformation, tissue resistance, and collision with internal anatomy are not implemented.
5. The endoscopic view is a live 3D render, but its internal anatomy proxies require replacement by reviewed patient-specific/anatomical assets before clinical use.
6. General body touch is 3D proximity-based; whole-body swept collision and volumetric tissue deformation remain future work.
7. The current body-region inference is a spatial heuristic for focus labels, not an anatomical segmentation model.
