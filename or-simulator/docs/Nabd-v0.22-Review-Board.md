# Nabd v0.22 — Specialist Review Board

This is a documented role-based engineering review, not a claim that independent persistent AI agents were deployed. Each specialist perspective was applied to the project plan and the source implementation before accepting the changes.

## Clinical simulation reviewer

**Question:** Does a free point selection create a clinically meaningful interaction?

**Decision:** A selected point is a spatial work target, not a diagnosis or validated anatomical landmark. General touch is separated from the existing abdominal press/pinch path. Privacy-protected surfaces remain excluded. The current scope cavity shapes are explicitly illustrative and must not be used for clinical assessment.

## Laparoscopic instrumentation reviewer

**Question:** Should a scope be constrained to a fixed X/Y plane?

**Decision:** No. The scope is represented as a remote-centre instrument around the selected port. Pointer offset controls bounded pitch/yaw, insertion is axial, and roll is independent. The port remains the pivot after insertion. This is a kinematic training model, not a calibrated trocar/tissue mechanics model.

## 3D interaction and game engineering reviewer

**Question:** Does camera look alter a held object?

**Decision:** No. Right mouse drag is a separate look channel. A touch-screen look mode provides the same separation while a tool remains held. Object ownership remains latched until explicit release. The focus target is stored in world coordinates and is independent from the camera orientation.

## Contact / biomedical engineering reviewer

**Question:** Can general skin contact rely on a top-down height field?

**Decision:** No. General touch follows a fresh raycast against the patient surface and checks 3D proximity from glove finger-pad vertices. The abdomen height-field correction remains limited to anterior/upward-facing contact; side contact skips that correction. This is not yet a full collision solver or volumetric soft-tissue model.

## Clinical nursing reviewer

**Question:** Can a learner work on a limb or chest point without the interaction snapping back to a preset landmark?

**Decision:** Focus selection accepts any visible, non-protected patient surface point. Wrist manipulation continues to use the existing patient limb chain and IK. The selected point remains the work target until the learner chooses another point or leaves the workstation.

## UX reviewer

**Decision:** The learner has separate actions for selecting a work point and changing the view. On desktop, right drag looks around; on touch screens, the learner activates **تغيير النظر** and drags. WASD remains locomotion around the existing bed perimeter. Camera look, walking, instrument movement, and focus selection do not share one pointer action.

## QA reviewer

**Automated checks in this release:**

- Scope alignment is required before insertion.
- Camera-look pause/resume gate keeps the active grip frozen while the view changes.
- Scope pitch/yaw pivot around the selected port after insertion.
- Scope roll is independent from insertion.
- Both tower screens share the same render-target texture.
- The scope camera follows the held tool tip and orientation.
- Workstation navigation reaches the opposite side of the bed.
- All source JavaScript files pass `node --check`.

**Not verified in this environment:** Full WebGL visual execution, actual hand-to-surface feel in a desktop browser, mobile Safari touch behavior, and frame-rate performance on the target machine. The available headless Chromium runtime could not initialize WebGL/ANGLE, so no visual pass is claimed.

## Chief architecture decision

The 3D simulator remains deterministic and owns input, hand pose, contact, instrument kinematics, and rendering. Clinical AI agents/coach services may consume recorded interaction events later; they must not drive per-frame physics or hand transforms.
