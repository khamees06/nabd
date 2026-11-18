# 12 — Grab the patient anywhere: final design

**Prepared:** 17 November 2026 · **Branch:** `p1-interaction` · **Status:** PLANNED (design only; no code, asset or test has changed) · **Companion:** [13_VISUAL_QUALITY_PLAN.md](13_VISUAL_QUALITY_PLAN.md)

**Owner's request (17 November 2026).** «كمل تطوير وما بدي اماكن محددة يمسك منها الجسم، اريده واقعي وين ما يمسك الجسم يقدر يحرك … ولو عندك طرق تزيد جودة الاشكال والدقة والواقعية اسمحلك تستعمله» — "Continue development. I don't want specific places to grab the body; I want it realistic: wherever he grabs the body, he can move it. If you have ways to increase the quality of the shapes, precision and realism, you may use them."

**Standing rules that still apply.** D5 movement rules (smooth human motion, natural joint limits, no sinking, entry only through declared openings), the supine anaesthetised patient on the OR table, INV-1 to INV-11, and DN5 labels on every clinical number (illustrative → AI-reviewed → clinician-validated; certified doctors sign off before training use, D7).

## 0. Decision summary

### 0.1 How this design was chosen

Three complete designs were prototyped read-only on the reconstructed supine patient and scored by three independent judges (realism, engineering risk, fit with the codebase):

| Design | Idea | Realism | Engineering | Fit | Total |
|---|---|---|---|---|---|
| A | Kinematic anchored-point IK, no physics world | 5 | 7 | 7.5 | **19.5** |
| C | In-house XPBD articulated body | 7 | 5 | 6 | 18 |
| B | Rapier ragdoll | 6 | 6 | 5 | 17 |

**Final design = A's architecture, inside D5 option A** ("deterministic kinematic targets with constraint projection", [08](08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md) D5), with the strongest ideas of B and C grafted in and every fatal flaw the judges named fixed (table 0.2). It needs no Rapier World and no new dependency. A true dynamic simulation (C) stays available as a later D5 revisit, behind the backend interface of §2.9, if the acceptance checks of §8 fail after measurement (the D5 revisit rule).

### 0.2 Fatal flaws named by the judges and how this design fixes them

| Flaw (source) | Fix in this design |
|---|---|
| A: self-collision is only a soft penalty on the swivel, so a limb can be driven into the torso or the other leg (INV-11c); the A prototype let the left knee cross the midline by 15.8 cm (all three judges) | A **hard constraint pass** after every solve: real skin contact samples against the table supports and against the proxies of non-adjacent segments; the target is projected out of the obstacle, then bisected toward the last valid target (§4.6). It is a blocking gate in G3 and G4 |
| A: release is not physical; the default "escorted lowering" moves the trainee's hand on its own (realism) | Default release is a **path-constrained gravity fall**: a scripted, deterministic fall along the passive descent path, with gravity timing, inelastic landing and a drop flag (§4.8). Escorted lowering is only an opt-in teaching assist |
| A: `floorY` defined as "deck + 0.0525 after F27", which contradicts the F27 fix (fit) | Supports come from **`SupportSurface`, measured from the drawn table-top GLB at load** (§2.2), so they always match what is drawn before and after F27. F27 ships together with a head ring and an arm re-pose (G2) |
| A: rate caps were per solve, but solving moves to every rendered frame (32–144 Hz) (engineering) | Every cap is **per second** |
| A: grab pop 1.7–3.4 mm, above the 2 mm target (all) | **Exact warm start**: solving for the current anchor returns the current pose (unit test ≤ 0.5 mm; browser gate ≤ 2 mm) |
| A: 25–60 mm lag on out-of-reach vertical lifts | C's **slack relax** of the drag target (§4.2); C measured 9.2 mm mean on a straight-leg raise |
| A: effective mass from a noisy finite difference | Load is low-pass filtered (10 Hz) before it feeds the target filter or the UI (§4.12) |
| B: Rapier box limits break under torque (forearm twist 114.9° and 142.7° against ±69°) | No Rapier joints. `JointModel` enforces elliptical swing and twist limits by **nearest-point projection** (C's verified method) |
| B: mid-thigh lift misread as "one hand cannot lift a leg" (realism, fit) | Acceptance gate in G5: a mid-thigh lift of 20 cm reaches ≥ 15 cm with lag ≤ 20 mm (§8, G5) |
| C: penetration claims rest on synthetic rings and boxes, not skin | Proxies and samples are **fitted from `patient.glb` skin weights** (B's method), and every penetration gate is **measured on re-skinned clinical-skin vertices**, not samples against proxies (§5.2) |
| C: owning a 2–3k-line physics engine, 1.7–2.6 ms per step | Not adopted now; it is the documented D5 revisit option |

### 0.3 What changes for the trainee, in one table

| Today | After this design |
|---|---|
| Bedside: only the arm wrists can be grabbed; everything else is "surface" touch | Any non-privacy skin of the arms, legs, hands, feet, head and neck can be grabbed; the trunk gives press, pinch and pull anywhere |
| Workstation: 8 fixed joint markers, one abdomen patch | Same as bedside, with press and pinch anywhere on the trunk; markers hidden by default (QA ids kept) |
| Lifting a wrist straightens the elbow and pivots the whole arm at the shoulder (P1 known issue C11) | Lifting a wrist bends the elbow while the upper arm stays on the table; lifting the mid-forearm lets the hand hang |
| Knee pops about 1.1 cm at grab and bends backwards (bug B1) | No pole: knee and elbow are hinges about the rig's own axes; pop ≤ 2 mm |
| Glove drifts 1.7–4.4 cm off a mid-forearm grab point (bug B2) | The glove sits on the grabbed skin point, re-skinned every frame (drift ≤ 5 mm, target ≤ 2 mm) |
| Released limb is scripted back to rest at ≤ 0.32 m/s | A supported limb stays where it is put; an unsupported one falls under gravity and is flagged as dropped if released more than 5 cm above its support |
| Arm passes through the torso; limb floor is a deck constant 52 mm under the drawn pads (F27) | Hard constraints against the table, the arm boards, the head support and the patient's own body |

## 1. What the trainee experiences

### 1.1 Gestures (unchanged model, D4 working default)

- **Still click = grab, move = carry, still click = release, drag = look, right-drag = look** (SMOKE_PROTOCOL.md; tests C1-2, C1-2b).
- A press on a grabbable part starts the reach at once, exactly as the wrist grab does today. If the pointer moves more than 8 px before the glove attaches, the reach is cancelled and the press becomes a look (extends `pressBecomesLook`). This keeps C1-2 (≥ 90 % of drags turn the view) and C1-2b valid.
- Once attached, moving the pointer (button up or down) carries the grabbed point in the vertical plane that faces the trainee, as today.
- **New, D4 consult item:** holding **Shift** while carrying switches the drag plane to the horizontal table plane, so the pointer moves the grabbed point toward or away from the trainee. Default on; shown to the owner with the G3 demo.
- Pause and resume are unchanged for every part: a look, zoom or view turn, or the pointer leaving the view, pauses the hold with `HOLD_PAUSED`; a press resumes it with no jump.
- The hold timeout (3.2 s, `noContact`), the out-of-reach message on a still click only, Q/E hand switching and the human hand caps (1.2 m/s, 280°/s) are unchanged.

### 1.2 What moves when you grab where

All clinical statements are DN5 "illustrative — needs certified-clinician review" (CR-09, CR-36). Sources: clinical study §F (standard handling teaching), ASA 2018, R1–R9 below.

| Grab place | Part that moves | What the rest of the body does | Feedback |
|---|---|---|---|
| Forearm (any point) | Forearm about the elbow, upper arm about the shoulder as needed | Elbow stays on the table when possible; hand hangs from the wrist (wrist drop) | — |
| Wrist zone | As forearm; effector is the wrist | Elbow bends as the wrist rises; upper arm stays down | — |
| Hand (back, palm, thumb) | Hand with the forearm behind it | Wrist extends under the forearm's weight within limits | — |
| Fingers | Mapped to the hand | As hand | «لا ترفع الطرف من الأصابع» ("do not lift the limb by the fingers") |
| Elbow zone | Elbow (dual anchor upper arm + forearm) | Forearm and hand swing about the elbow | — |
| Upper arm, shoulder, axilla | Upper arm about the shoulder; clavicle follows above 30° elevation | Forearm hangs or rests on the table or chest | Long hold over the mid upper arm: radial-nerve note (R3, metadata only) |
| Thigh | Thigh about the hip | Knee bends, heel slides on the pad | Load above 50 N: heavy note |
| Knee zone (top or popliteal) | Knee (dual anchor) | Hip and knee flex together, heel slides | — |
| Shank | Shank about the knee, thigh as needed | Foot droops into plantarflexion | — |
| Ankle zone, heel | Straight-leg raise about the hip | Knee stays nearly straight; hip tends to roll out | Hamstring WARN above 60° |
| Foot, toes | Foot with the shank behind it | Ankle dorsiflexes under load within limits | Toes: «لا ترفع الطرف من أصابع القدم» |
| Head (temple, occiput, forehead, jaw, ears) and neck | Head about the neck (neck bones share the turn) | Trunk never moves | One hand: «ثبّت الرأس بكلتا اليدين: القذال والفك»; rotation above 45°: amber warning (R7) |
| Chest, abdomen, flank, pelvis | Skin only (press, pinch, pull ≤ 2 cm) | Trunk bones never move | Pull beyond 2 cm or lift beyond 3 cm: «لا يُحرَّك الجذع بيد واحدة — قلبُ المريض يحتاج فريقاً من ٤ أشخاص على الأقل» (R8, R9) |
| Privacy area, eyes | Nothing (not grabbable; the press becomes a look) | — | — |

### 1.3 Weight, feel and limits

- **Weight.** The grabbed point follows the pointer through a critically damped filter whose speed cap and acceleration depend on the part (arm 0.33 m/s, leg 0.25 m/s, head 0.15 m/s; acceleration ≤ 60 N divided by the effective mass). Heavier parts start and stop more slowly. The glove always stays on the grabbed skin, never on the cursor.
- **Lag made visible.** When the grabbed point is more than 2 cm behind the pointer (out of reach, at a limit or blocked), a faint ghost ring marks the pointer target and a strain ring grows around the glove. The glove wrist pitches down by up to 6° in proportion to the load.
- **Load.** A per-hand readout "الحمل ≈ N نيوتن (قيمة توضيحية)" shows the gravity load at the grab. Above 50 N for more than 0.5 s: «الطرف ثقيل — اسنده باليد الأخرى». Reference loads (CALC, clinical study §C): whole arm by the wrist 19.5 N, straight leg by the ankle 52.9 N, head 59.6 N.
- **Swing.** Passive joints (the parts not held) follow their gravity rest with a lightly damped spring, so a hanging hand or foot swings a little after the hand stops and then settles.
- **Limits.** Past a WARN value the status shows «تجاوزت المدى الآمن تحت التخدير» and the release event carries the warning. At a HARD value the part stops, the glove stays on the skin and the ghost ring shows the pointer: «بلغ {المفصل} أقصى مداه». No joint can turn 360°.
- **No sinking.** The patient's skin does not go into the table pads, arm boards, head support or the patient's own body beyond M1, and the glove does not go into the skin beyond the grip gate (≤ 10 mm today, target ≤ 5 mm).

### 1.4 Release

1. **Supported** (the lowest skin sample of the moved chain is within 10 mm of a support: table pad, arm board, head support, or the patient's chest, abdomen or thighs): the part stays where it was put and that pose becomes its new rest. If it is within 4 cm and 8° of its stored rest, it eases to the exact rest (today's rule: ≤ 0.32 m/s, < 3 mm at 2 s), so the step-5 scoring and the existing settle tests keep working.
2. **Unsupported:** it falls under gravity along its passive descent path, lands without bouncing more than 5 mm, and comes to rest within about 0.6 s of landing. If it lands within 4 cm and 8° of its stored rest, it then eases to the exact rest.
3. **Dropped flag:** released with the grabbed point more than 5 cm above where it lands (DN5, ASSUMED threshold): «سقط الطرف — أنزله بهدوء قبل الإفلات», and the release event carries `dropped: true`.
4. **Off the table edge (R4):** an arm or leg released beyond the table edge or arm board hangs off it and the status warns «الطرف خارج حافة الطاولة».
5. **Opt-in assist:** a setting "lower the limb for me" (off by default) makes the trainee's hand lower an unsupported limb to its support at ≤ 0.32 m/s before letting go.
6. **Reset:** «إعادة وضعية المريض» and any pose change restore the authored rest pose.

### 1.5 Hover and markers

- Cursors: `grab` over reachable limb or head skin, `crosshair` over trunk skin, `not-allowed` when out of reach, `all-scroll` elsewhere and over privacy or eyes.
- A small ring (12 mm, aligned with the posed skin normal) marks the predicted grip point while hovering. It replaces the fixed body markers, which are hidden by default (`#show-body-points` unchecked, `index.html:161`). The QA `points` ids stay as test coordinates.
- Status on press: «إمساك {الجزء}» (for example «إمساك الساعد الأيسر»); when held: «تمسك {الجزء} · حرّك المؤشر · انقر للإفلات». Trunk press keeps 'لمس سطح المريض' (C1-2b).

### 1.6 Honest limits of this design

This is kinematic control with scripted passive motion, not rigid-body physics. Pulling an arm never rocks the trunk; there is no momentum transfer between parts; friction is implicit (a heel slides freely); a falling limb follows a precomputed descent path and does not tumble. The fall, swing, damping, load and limit values are teaching approximations labelled illustrative (DN5). This is stated in the phase report and shown to the owner.

## 2. Architecture

### 2.1 Principles

- **D5 option A.** Deterministic kinematic targets plus hard constraint projection. Passive motion (swing, fall) is scripted from a computed gravity rest, which D5 calls scripted placement. No physics World; Rapier stays drill-only.
- **One driver per chain** (GA-13): the trainee's hands (one or two), the supervisor (L4, later), the drill, the studio manipulator `md`, or a pose tween. `Manipulation` arbitrates.
- **The trunk is never written.** Spine, pelvis and chest bones keep their pose, which protects the internal atlas (attached to `g.root`, `InternalAnatomy.js:55`), the scope and port, the height field and the 6 ms spine re-skin.
- **Pure math modules have no three.js imports.** Classes are injected, imports are relative named imports only (`scripts/build-preview.mjs:16-21`), and every module is unit-tested in node on npm `three@0.180.0`.

### 2.2 New modules

| File | Role | Main exports |
|---|---|---|
| `src/patient/BodySegments.js` | Bone → segment table built from sanitised bone names (`sanitizeNodeName`, `NabdRuntime.js:69`; "upperarm01.L" becomes "upperarm01L"). Per primitive, an `Int8Array triSeg` plus top-2 segment ids and weights per triangle (weights below 0.02 ignored), built once at load (105,822 + 1,718 triangles) | `createBodySegments(skins, skeleton)`, `ofHit(hit)` → `{segment, s2, w1, w2, zone, side}` |
| `src/patient/BodyProxies.js` | Fitted from skin weights at load (B's method): per limb segment a PCA axis and radius profile (inner proxy = p50 × 0.9 for self-collision; outer = p85 for the pick fallback); trunk as 5 overlapping z-slice rounded boxes fitted to the p95 skin extent; head ellipsoid. Contact samples: 24–40 per segment by farthest-point sampling over vertices with dominant weight ≥ 0.8, stored as vertex indices plus bone-local positions, always including each segment's lowest rest vertex. Rest-overlap allowance per sample pair | `fitBodyProxies(...)`, `sdProxy(id, p)`, `samples(segment)`, `allowance(i, j)` |
| `src/patient/SupportSurface.js` | Supports measured from the table-top GLB at load (pads, arm boards, head ring, rails, edges) as rounded boxes in table space; follows `setDeckHeight`; floor at y = 0 off the table | `createSupportSurface(topAsset, deck)`, `sd(p)`, `supportAt(x, z)`, `kind(p)` |
| `src/patient/JointModel.js` | Per-joint frames from the rig's anatomical neutral (hinge axes from the bind pose), swing-twist decomposition, quadrant-ellipse swing limits with nearest-point projection, twist and hinge limits, coupled limits (hip with knee straight, ankle with knee straight), WARN/HARD classification; holds the joint limit table of §2.4 | `createJointModel(skeleton, limits)`, `clamp(joint, qRel)`, `classify(joint, qRel)`, `angles(joint, qRel)` |
| `src/patient/LimbSolver.js` | Anchored-point two-bone solve for any point on a limb (§4.3, §4.4), swivel search, extension lock, re-aim, exact warm start, per-second caps | `solveLower`, `solveUpper`, `solveZone` |
| `src/patient/HeadSolver.js` | Neck and head rotation about neck01 with limits and head-support contact (§4.9) | `solveHead` |
| `src/patient/PassiveMotion.js` | Quasi-static gravity rest of passive joints, spring follower (swing), path-constrained fall, magnet ease (§4.7, §4.8) | `createPassiveMotion(...)` |
| `src/patient/Manipulation.js` | Owns held and settling parts: backends (`kinematic` default, `legacy` = today's `createLimbDrag` until G10), target pipeline, constraint pass, bone writer (twist distribution, clavicle rhythm, write discipline), `poseVersion`, release, supports, QA and event metadata. Exposes today's limb facade `{chain, jointIndex, initial, move, restore, easeToRest, rest}` for step-5 scoring, the drill and the supervisor | `createManipulation(deps)` |
| `src/patient/SkinPatch.js` | `AbdomenSurface` generalised to any trunk point (§4.10); the old abdomen API stays as a facade | `createSkinPatch(...)` |

S1's module count (`smoke.spec.mjs:238`, already 22 because of `SkinPickCache.js`) is raised deliberately in each cluster that adds a module.

### 2.3 Changed files and integration points

Line numbers are from the working tree on 17 November 2026; locate by function name.

| File | Change |
|---|---|
| `src/interaction/BedsideInteraction.js` | `pick` (≈112-185): body branch after the drill and tool branches (§3.1). `begin` (≈187-218): kinds `'wrist'` (alias for every limb part) and `'head'`, plane choice incl. Shift = horizontal. `pickKey` (≈51-60): include `manip.poseVersion` instead of `joints[2]`. `pressBecomesLook` (≈261): also cancels unattached body reaches. `updateBeforeHands` (≈320) and the drag code (≈365-391): `manip.setTarget(...)`. Attach (≈442-513): store the contact anchor instead of the world `wristOffset` (≈503). `held` (≈660): `'wrist'` for limb parts, `'head'` for the head |
| `src/staff/CrewController.js` | New profile `'grip'` in `driveSurface` (363-373) and `contactRotation` (307-321) with the posed face normal; `followAnchor(side, anchorFrame)` generalising `followForearm` (769-777), called every rendered frame; `surfaceContact(..., 'grip', 0.024)` measured to the anchor (335-362); load-proportional wrist pitch ≤ 6° |
| `src/app/NabdRuntime.js` | Build segments, proxies, supports, joint model and `manip` after `hd()` (6528). `manip.update(dt)` replaces `updateLimbSettles(dt)` (6492) and runs every rendered frame. `allowWrist` (6594) becomes `allowBodyGrab` (same phases, supine). Release handlers (5959-6117) route body grabs to `manip.release`. `G(pose)` and the pose tween call `manip.cancelAll()` and restore rest locals. Frame snapshots `h`/`f()`/`R()` (4596) gain every bone `manip` writes. Skin-bounds margin (5730-5740) stays 0.4 m with a QA assertion. QA fields (6636-6695). Events metadata (5968-5977) |
| `src/patient/AbdomenSurface.js` | `contains` (16, 90-94) delegates to `SkinPatch`; rebuild becomes time-sliced (§4.8 step 6) |
| `index.html` | `#show-body-points` unchecked by default (line 161) |
| `src/simulation/EventLogger.js` | No change: no new event types (§2.8) |

### 2.4 Data

**Segments** (DATA-DERIVED from `patient.glb` unless marked; masses and CoM are Winter/Dempster fractions of 75 kg, DN5 illustrative):

| Segment | Bones written | Length (m) | Radius p50 / p75 (m) | Mass (kg) | CoM from proximal | Pendulum about proximal joint (Hz, CALC) | Grab behaviour |
|---|---|---|---|---|---|---|---|
| Upper arm | upperarm01, upperarm02 (twist) | .260 | .051 / .060 | 2.10 | .436 | whole arm .77 | upper-segment solve |
| Forearm | lowerarm01, lowerarm02 (twist) | .275 | .030 / .036 | 1.20 | .430 | forearm + hand .95 | lower-segment solve |
| Hand (incl. fingers) | wrist (fingers: curl only) | .203 | .043 / .057 | 0.45 | .506 | hand 1.32 | lower-segment solve through the wrist |
| Thigh | upperleg01, upperleg02 | .442 | .077 / .100 | 7.50 | .433 | whole leg .63 | upper-segment solve |
| Shank | lowerleg01, lowerleg02 | .450 | .044 / .060 | 3.49 | .433 | shank + foot .79 | lower-segment solve |
| Foot (incl. toes) | foot | .210 | .031 / .045 | 1.09 | .50 | foot .96 | lower-segment solve through the ankle |
| Head + neck | neck01, neck02, neck03, head | head .142, neck .106 | ellipsoid (.087, .124, .111) | 6.08 | — | — | head solve |
| Shoulder band | clavicle, shoulder01 | — | — | — | — | — | merged: upper arm if upper-arm weight ≥ chest weight, else trunk; clavicle by rhythm only |
| Chest, abdomen, pelvis | never written | — | — | — | — | — | soft tissue (SkinPatch) |

Facts behind the table: 92.9 % of non-privacy triangles have a top segment weight ≥ 0.65; 1.5 % are below 0.5; joint blend bands are elbow −4.2..+2.5 cm, wrist −1.2..+1.7, knee −4.4..+3.9, ankle −5.1..+3.8 (DATA-DERIVED, skeleton study). The forearm/upper-arm length ratio of the asset is 1.06 (a property of the asset, not corrected).

**Joint limits.** Degrees from anatomical neutral, patient supine. HARD = physical stop for a flaccid anaesthetised patient (awake normal + 0–10°, ASSUMPTION). WARN = shown to the trainee and logged. **Every value: DN5 "illustrative — AI review, then certified-clinician sign-off (CR-09, CR-36)".** Sources: AAOS normal values (Greene & Heckman 1994; recalled, not fetched), CDC Joint ROM Study (Soucie 2011; fetched), ASA 2018 perioperative neuropathy advisory (fetched), Inman scapulohumeral rhythm (recalled).

| Joint | Motion | HARD | WARN | Source |
|---|---|---|---|---|
| Shoulder | flexion | 180 | > 90 held | AAOS; CDC male 168.8 |
| | extension | 60 (only off the table edge) | > 10 | AAOS |
| | abduction | 180 (glenohumeral ≈ 120 plus rhythm) | **> 90 (ASA R1)** | AAOS; ASA 2018 |
| | adduction across the chest | 45 | — | AAOS |
| | internal / external rotation | 70 / 90 | ER > 60 when abduction ≥ 60 | AAOS |
| Elbow | flexion | 150 | > 90 held (ulnar nerve) | AAOS; CDC 144.6; ASA |
| | hyperextension | 5 | > 0 | CDC; ASA |
| Forearm | pronation / supination | 85 / 90 | full pronation on an arm board | CDC 76.9 / 85.0; ASA |
| Wrist | flexion / extension | 85 / 75 | > 60 held | AAOS |
| | radial / ulnar deviation | 25 / 35 | — | AAOS |
| Hip | flexion, knee bent | 130 | > 90 | CDC 130.4 |
| | flexion, knee straight (coupled) | 85 | > 60 | AAOS; ASA (hamstring) |
| | extension | 15 | > 0 | CDC 17.4; ASA (femoral) |
| | abduction / adduction | 45 / 30 | abduction > 30 | AAOS |
| | internal / external rotation | 40 / 50 | ER > 30 with flexion | AAOS |
| Knee | flexion | 140 | sustained hyperflexion | CDC 137.7 |
| | hyperextension | 5 | > 0 | CDC |
| Ankle | dorsiflexion | 20 knee bent / 10 knee straight (coupled) | > 10 knee straight | CDC 12.7; AAOS |
| | plantarflexion | 55 | — | CDC 54.6 |
| | inversion / eversion | 35 / 20 | — | AAOS |
| Neck (shared by neck01–03 and head) | flexion / extension | 50 / 60 | extension > 15 | AAOS |
| | rotation | 80 | **> 45 (R7)** | no consensus value; ASSUMED |
| | lateral flexion | 45 | > 20 away from an abducted arm | AAOS |

Elbow and knee are hinges about the bind-pose flexion axis with ±4° off-axis tolerance; the supine forearm lies 11.4° out of the rig's hinge plane (knee 1.4°), and this rest offset is kept, not "corrected" (DATA-DERIVED). The swing reference axis of the shoulder is anterior (the ceiling when supine), so the swing-twist singularity lies posterior, outside the HARD range. Today's uncited `dd` limits (`NabdRuntime.js:4643@265`) stay only for the legacy backend and `md` until G10.

**Positioning rules flagged (DN5):** R1 supine arm abduction ≤ 90°; R2 forearm on a board supinated or neutral, tucked arm neutral; R3 no prolonged pressure on the spiral groove or the fibular head; R4 the arm never hangs off the table edge; R5 hip flexion/extension and hamstring stretch within need; R7 head rotation > 45° flagged; R8 the trunk is never dragged or lifted by one person (log roll ≥ 4 people); R9 manual handling ≈ 156 N per caregiver (Waters 2007).

**Passive motion constants (DN5, ASSUMED unless marked):** follower natural frequency = the pendulum frequency of the table above (CALC); damping ratio 0.12 in the air and 0.35 in contact with a support (clinical study §D derives 0.06 free and about 0.3 on the table; 0.12 is chosen to avoid long oscillation and is tuned with the owner); fall restitution 0.

### 2.5 Per-frame order

Inside the frame loop `ee` (`NabdRuntime.js:6461-6524`):

1. Pose tween `V`; all manipulation is frozen while `E` runs.
2. Movement and view (6473-6481).
3. Height-field slice: at most 5 ms of an in-progress rebuild (replaces the one-shot rebuild at 6482-6489).
4. `abdomen.update` / `SkinPatch.update`.
5. `updateForearmPractice` (drill; unchanged; the drill chain is owned by the drill).
6. **`manip.update(dt)`** in place of `updateLimbSettles(dt)` (6492), on every rendered frame while anything is held, falling, easing or swinging: target pipeline → solve held parts → passive parts → constraint pass → bone write → `poseVersion++` → one `g.root.updateMatrixWorld` → `crew.followAnchor` for attached hands.
7. Crew block (6494-6510, still gated at ≤ 66 Hz): `updateBeforeHands` only sets targets; `crew.update` drives unattached hands; `updateAfterHands` runs attach tests and events. `crewDue` also covers `manip.active`.
8. Render; the dirty flag `I` stays set while `manip.active`.

### 2.6 Anchors: keeping the grabbed point under the glove

At attach, two anchors are stored:

- **Contact anchor** `{mesh, a, b, c, bary, padOffset}`, with the pad offset along the posed face normal. Each rendered frame the three vertices are re-skinned (`getVertexPosition`, bit-identical to the GPU path and to `SkinPickCache`), and the glove is placed at the anchor frame times the hand-local transform captured at attach. The glove therefore follows the deforming skin exactly (fixes B2 and B7).
- **Driver anchor**: the grab point in the driver bone frame. In a joint zone (top segment weight below 0.65) it is a **dual anchor**: the point stored in both bone frames and blended with the renormalised top-2 weights, which is the same blend the skin uses for that point (B measured 10.7/14.4 mm → 2.3/3.5 mm with dual anchors).

Drift = distance between the driver point and the re-skinned contact point. It is reported per frame (`grab.driftMm`).

### 2.7 Write discipline and picking caches

- A bone is written only if its rotation changes by more than 1e-5 rad. Parts at rest are never written, so `SkinPickCache` (`SkinPickCache.js:97-105`) re-skins nothing at rest, and C2-12 stays at 0 extra work.
- `poseVersion` increments on any write; `pickKey` uses it, so a hover pick is never reused across a pose change.
- First hover pick after a move re-skins only the moved part: about 1.5 ms for an arm or leg and 3 ms for the head (DATA-DERIVED in node).
- Skin bounding spheres keep the fixed +0.4 m margin (5730-5740). A QA assertion checks that every chain tip and the head stay inside each skin's sphere (a hand raised overhead is about 0.93 m from the centre against a 1.32 m radius, ASSUMPTION from arithmetic).

### 2.8 Events and QA (additive only)

- No new event types; `SUPPORTED_EVENTS` is unchanged and the S4 golden trace stays identical by construction.
- `patient_interaction` metadata gains `{part, segment, s2, chain, bone, localPoint, anchorMode, loadN, limitWarnings, supported, dropped, dropHeightM, result: 'rest'|'placed'|'fell'|'off_edge'}`. `target` stays `grip.kind` (`'wrist'` alias for limbs, `'head'` for the head).
- `interaction_error` gains the reason `'trunk_immovable'`.
- `getSimulationState()` gains `grab` and `manip` (§5.3). `__studioQA` gains `grabSamples(region, n, side)`, `jointAngles()`, `skinPenetration()`, `setGrabBackend(name)`.

### 2.9 Interplay with existing systems

| System | Interplay |
|---|---|
| Forearm drill (`ForearmGrip`, `ForearmContact`, drill settle 5912-5927) | Unchanged and picked first while open; the drill owns the left arm chain. INV-4 tests stay the regression reference (S2, S3, C3-9a, C3-9d, C6-b) |
| Step-5 training (6076-6116) | Uses the facade: `limb.initial` is the near arm's wrist joint at grab time, whatever point of that arm is grabbed; thresholds 0.052 m and 0.045 m unchanged (they need DN5 labels in the UI text) |
| Studio manipulator `md` | Keeps `createLimbDrag`; when it changes the pose, `manip.syncFromBones()` runs. G10 moves its limits to `JointModel` and fixes the swing ratchet (B5) |
| Supervisor L4 lift (later, [11](11_FULL_SESSION_SCENARIO.md)) | Drives the same facade; arbitration gives one driver per chain |
| `AbdomenSurface` height field | Still used for hand lift, landmarks and tool depth; no longer used for patient supports (privacy hole of up to 0.225 m, B8). Rebuilt time-sliced when all parts are supported and no hand touches skin |
| `SkinPickCache` | No change needed; write discipline keeps it cheap |
| Rapier | Not used by grab-anywhere; a Rapier load failure still only disables the drill |
| WebKit / Safari | Pure JS arithmetic; no wasm, no new GPU feature |
| Backend interface | `Manipulation` takes a backend object `{solveHeld, solvePassive, release}`. `kinematic` is the only one built. A physics backend (XPBD from design C, with B's fitted proxies) could be added later behind `?grab=physics` after an owner decision under the D5 revisit rule, without touching picking, anchors, events or QA |

## 3. Picking, reach and attach

### 3.1 Pick order

1. **Drill** (unchanged, when `workSpec().forearm`).
2. **Tool** (unchanged).
3. **Body** (new): `hit = surfaceHit(ray)` (6596).
   - Privacy face (`isPrivacySurfaceHit`) or the eyes mesh → `null` (the press becomes a look).
   - Brows → head.
   - `seg = segments.ofHit(hit)` (precomputed `triSeg`, top-2 weights by barycentre).
   - Limb or head, and (`allowBodyGrab` at the bedside, or any workstation) → `{kind: 'wrist' | 'head', part, seg, hit, normal: posed face normal}`. The posed face normal is used, never `hit.normal`, which is unskinned (fixes B4).
   - Trunk at a workstation → `surfaceAction(point, object)` (press, abdomen pinch or touch; from G8 via `SkinPatch` anywhere on the trunk). Trunk at the bedside → `'surface'` (unchanged, C1-2b).
   - Limb at the bedside outside the allowed phases → `'surface'`.
4. **Capsule fallback** when the ray misses skin within tolerance (thin wrist, fingers): ray against the outer segment proxies inflated by the pick radius × 1.1 (arm) or × 1.37 (leg), the `md` pattern (`4643@3510`). The anchor snaps to the nearest contact sample of that segment, which carries its triangle and barycentric coordinates.
5. **Landmarks** at a workstation when nothing else hit (unchanged).

`bodyJoints()` markers stay as QA points and visible only when the checkbox is on; their branch is removed from `pick` in G3 because clicking a marker position now hits skin and goes through the body branch (C3-9b clicks `points['leftLeg-2']` and gets a shank/foot grab).

### 3.2 Reach and attach

- `crew.canReach(side, point)` unchanged (`CrewController.js:291-293`; P3 replaces it later).
- Drive with profile `'grip'`: palm faces −n (posed normal), fingers across the segment axis, yaw from `contactRotation`; glove target = contact anchor + n × 0.004.
- Attach when the flat pads are within 0.024 m, then 130 ms of closing, then a finger-curl solve: curl rises from 0 to 0.9 in 6 bisection steps until every fingertip probe is at least 1 mm outside the segment's outer proxy.
- Out of reach: unchanged (`'blocked'`, message on a still click only).

## 4. Algorithms

### 4.1 Hit to part

For each corner k of the hit triangle and each influence with weight ≥ 0.02, add `bary_k × w` to that bone's segment. Normalise; top segment s1 with weight w1, second s2 with w2. If w1 ≥ 0.65: single anchor on s1. Otherwise a joint zone between adjacent segments: limb–limb → dual anchor (s1, s2); trunk–limb → the limb; neck → head; fingers → hand; toes → foot. The per-triangle result is precomputed once into `triSeg`; only the dual-anchor weights are computed per hit.

### 4.2 Target pipeline (per held part, per rendered frame)

```
P      = ray ∩ dragPlane + offset           # vertical camera-facing plane; Shift: horizontal
e      = anchorWorld − (P + slack)
eh     = horizontal part of e, minus its component along the pointer's horizontal motion
slack += eh · min(1, 12·dt)                 # slack relax (from C): lifts follow the limb's arc
Traw   = P + slack
a      = clamp(ω²·(Traw − x) − 2ω·v, ±F_hand / m_eff)    # critically damped filter
v      = clamp(v + a·dt, ±v_max);  x += v·dt;  T = x
```

ω and v_max: arm 2π·4 and 0.33 m/s; leg 2π·2.5 and 0.25 m/s; head 2π·3 and 0.15 m/s. F_hand = 60 N; m_eff = filtered load / g (§4.12). All illustrative (DN5).

### 4.3 Lower-segment solve (forearm, hand, shank, foot)

The hand or foot is held at its current wrist or ankle angle; the passive layer may change that angle afterwards.

```
S = proximal joint (shoulder or hip); lu = |E − S|
pL = driver anchor in the lower-segment frame; s = axial part, ρ = radial part
if |T − anchorWorld(currentPose)| < 0.5 mm: return currentPose          # exact warm start
for pass in 1..2:
  Ta = T − R_lower·ρ
  D  = clamp(|Ta − S|, Dof(γmax), Dof(γmin))      # Dof(γ) = sqrt(lu² + s² + 2·lu·s·cos γ)
  n  = (Ta − S)/D; a = (D² + lu² − s²)/(2D); r = sqrt(lu² − a²); C = S + a·n
  search swivel φ in φ0 ± 3.6 rad/s·dt (13 samples, then bisection), minimising
    J(φ) = g·Σ m_i·y_CoM,i  +  ½·kτ·τ²  +  kER·(τ − τ_bias)²  +  soft proximity terms
  given E(φ): flexion Δθ about the bind-pose hinge axis; twist τ from the azimuth
  if γ < γmin + 3°: keep τ (near-extension lock)
  clamp Δθ, τ to the per-second rate caps (4 rad/s) and through JointModel.clamp
  upper = R(a1, τ)·shortestArc(a1rest, a1)·upperRest;  lower = upper·R(hinge, Δθ)·relRest
  re-aim: premultiply upper by shortestArc(P_act − S, Ta − S), then JointModel.clamp
```

kτ = 1 J/rad² (arm), 3 (leg); hip external-rotation bias τ_bias 15–30° (supine hips roll out); all ASSUMED, DN5. The soft proximity terms only choose the swivel; non-penetration is enforced by §4.6.

### 4.4 Upper-segment and joint-zone solve (upper arm, thigh, elbow, knee)

One bone about the proximal joint: the shortest arc maps (P − S) onto (T − S), then `JointModel.clamp`. The distal part is passive: a 9×9 grid over (twist, flexion) within the per-second window, refined, minimising J with the heel or hand on its support. For a joint-zone grab the effector is the dual-anchor point, which depends on both bones; two re-aim passes alternate the upper solve and the passive flexion update.

### 4.5 Joint limits

```
qRel  = (qParent·fParent)⁻¹ · (qChild·fChild)
twist = normalise(qRel.x, 0, 0, qRel.w);   t = 2·atan2(twist.x, twist.w)
(sy, sz) = log(qRel · twist⁻¹)
if (sy, sz) outside the quadrant ellipse (a±, b±):
  project to the NEAREST point (8 Newton steps on
  f(θ) = (a² − b²)·cosθ·sinθ − x·a·sinθ + y·b·cosθ); never scale radially
t = clamp(t, tmin, tmax);  rebuild qRel
```

Radial scaling injected energy and snaps in the C prototype (body speeds 22–43 m/s); nearest-point projection held the worst excess at 1.56° under a violent yank (DATA-DERIVED). Coupled limits interpolate the hip-flexion and ankle-dorsiflexion HARD values by the knee angle. WARN is a classification only; HARD is a clamp.

### 4.6 Hard constraint pass (no sinking, no self-penetration)

After each solve, re-skin-free evaluation on the moved chain's contact samples (bone-local, so this is a matrix multiply per sample):

1. **Supports:** `SupportSurface.sd(sample) ≥ −tol` (tol 1 mm).
2. **Self:** distance to every non-adjacent inner proxy (other limbs, trunk slices, head) ≥ −(allowance + tol). The allowance is the rest overlap of that pair plus 2 mm, dropping to zero once the pair separates (C measured 6 such pairs, up to 35 mm, mostly thigh–thigh).
3. If violated: move T out along the summed contact normals by the deepest violation and re-solve (at most 3 passes). The grabbed point therefore slides along the obstacle instead of sticking.
4. If still violated: bisect between the last valid target and T (7 steps, as today's A0). Mark the part `blocked` (ghost ring).
5. The passive layer's result is checked the same way; a violating passive step is clamped back toward the previous valid angles.

Worst case is 10 solves per chain per frame (≈ 0.8 ms in V8); the typical case is one.

### 4.7 Passive motion (swing, droop)

- **Quasi-static rest** q* of every passive joint: minimise J over that joint's free angles, within limits and constraints (wrist and ankle droop under gravity, elbow sag when the upper arm is held, knee flexion when the thigh is held).
- **Follower:** each passive angle follows q* with `q̈ = ω²(q* − q) − 2ζω·q̇`, ω = 2π × the pendulum frequency of §2.4, ζ = 0.12 in the air and 0.35 when the segment touches a support; integrated at a fixed 1/120 s with at most 3 substeps per frame; followed by §4.6 step 5.
- Expected flaccid behaviour: a mid-forearm lift lets the hand hang (C measured the hand tip 177 mm below the wrist); hip external roll and ankle plantarflexion appear at rest.

### 4.8 Release

1. Remove the grab constraint and compute the passive equilibrium q_eq of the whole chain (minimum J with supports, limits and self constraints), starting from the current pose.
2. **Supported** (lowest sample within 10 mm of a support): stay; the pose becomes the chain's new rest (magnet rule below).
3. **Unsupported → path-constrained fall:** the path q(s), s ∈ [0, 1], interpolates each joint from the current pose to q_eq (swing-twist slerp). Advance s with `s̈ = −V′(s)/M(s) − c·ṡ`, where V(s) = J(q(s)) and M(s) = Σ m_i·|dx_CoM,i/ds|² + rotational terms (finite differences over the path). At the first s where a sample meets a support or proxy, stop (inelastic, restitution 0); distal joints keep their follower state, which gives a small swing on impact. Then the follower settles the chain to q_eq with §4.6.
4. **Magnet:** once supported and within 4 cm and 8° of the stored rest, ease to the exact rest (today's rule, ≤ 0.32 m/s, < 0.002 rad end).
5. **Drop flag:** fall height of the grabbed point > 0.05 m → `dropped: true`; beyond the table edge → `result: 'off_edge'` and the R4 warning.
6. **Height field:** when every part is supported and no hand touches skin, a rebuild runs in slices of ≤ 5 ms per frame and swaps in when done (replaces the 17–22 ms one-shot; resets the abdominal dent as today).
7. **Opt-in assist:** with "lower the limb for me" on, the trainee's hand stays attached and moves the grab point down the same path at ≤ 0.32 m/s before releasing.
8. Re-grab during a fall or an ease takes the part over and keeps the original stored rest (today's `startPatientLimb` behaviour).

### 4.9 Head and neck

Pivot = neck01 head. The shortest arc maps (P − pivot) onto (T − pivot); swing-twist about the neck axis gives rotation, flexion/extension and lateral flexion, each clamped by the neck row of §2.4. The rotation is distributed 0.2 / 0.25 / 0.25 / 0.3 over neck01, neck02, neck03 and head (ASSUMED). Constraint: occiput samples ≥ head support − 2 mm. Speed cap 0.15 m/s at the grab point. The airway and tube are the anaesthetist's responsibility; the one-hand message and the 45° warning are always shown.

### 4.10 Trunk soft tissue (SkinPatch)

`AbdomenSurface`'s `start/drag/press/update/write` (96-172) are reused with:

- `contains(p)` = trunk segment weight ≥ 0.65, not privacy, posed normal y > 0.3 (replaces the rectangle at 16 and the 0.62 normal gate in `pick`).
- Patch radius 0.102 m with falloff by 3D distance and normal agreement n·n0 > 0.3, found through a spatial hash of the rebuild snapshot; shift in the tangent frame.
- Depth = F/k with relaxed stiffness from Remus 2024 (epigastric 0.34 N/mm, umbilical 0.29, lower rectus 0.24, flank 0.25) and the sternum about 8–10 N/mm (ASSUMED); capped at 25 mm on the abdomen and 5 mm on the sternum. Pinch lift ≤ 25 mm. Tangential slide ≤ 20 mm, then the R8 message and `interaction_error {reason: 'trunk_immovable'}`. DN5.
- Trunk bones are never written (checked by QA: spine and pelvis matrices bit-identical before and after).

### 4.11 Bone write

- Driver rotations come from the solver; twist is distributed along the chain as cumulative fractions of the segment twist: upperarm01 0.5 / upperarm02 1.0; lowerarm01 0 / lowerarm02 0.5 / wrist 1.0 (pronation); upperleg01 0.5 / upperleg02 1.0; lowerleg01 0.5 / lowerleg02 1.0. Splitting 80° of pronation over two bands cuts volume loss at a 50/50 vertex from 23.4 % to 6.0 % (DATA-DERIVED).
- Clavicle and shoulder01: above 30° of humeral elevation they take (θ − 30°)/3, capped at 15° (Inman; DN5).
- Order: root to leaves, rotations only (bone lengths stay rigid), skip writes below 1e-5 rad.

### 4.12 Load and feedback

Load at the grab = gravity part + inertial part: `L = (J(T + 5 mm·ŷ) − J(T)) / 5 mm + m_eff·|a|`, low-pass filtered at 10 Hz. The glove wrist pitches down by `min(6°, 6° × L / 60 N)`. Strain ring radius grows with `|T_pointer − anchor|`; the ghost ring shows when that exceeds 2 cm.

## 5. Performance and measurement

### 5.1 Budgets

| Item | Budget (Chrome, Iris Xe, 1440×900) | Evidence |
|---|---|---|
| One held chain: solve + constraint pass | mean ≤ 0.3 ms, p95 ≤ 0.8 ms | A prototype 0.081 ms mean per solve in V8 (DATA-DERIVED) |
| All of `manip.update` | p95 ≤ 2 ms per frame (AC-P5-7) | — |
| Passive follower + fall | ≤ 0.2 ms | ASSUMPTION |
| First hover pick after a move | +1.5 ms (limb), +3 ms (head) once | DATA-DERIVED in node |
| Bone writes at rest | 0 | write discipline |
| Hover, limb drag | V1 hover ≥ 120 fps; drag ≥ min(100, 0.9 × plain) in Chrome and Edge at 1440 and 560; WebKit ≥ 0.9 × its 32 fps baseline | C2-12, P1 baselines |

WebKit (JavaScriptCore) is assumed 1–2× slower; real Safari on macOS is still untested (U3).

### 5.2 How penetration and drift are measured

- **Skin vs supports:** every clinical-skin vertex is re-skinned (QA only, `skinPenetration()`) and its signed distance to `SupportSurface` recorded: max, p95 and count deeper than 2 mm (the C6-e method, not samples against proxies).
- **Self:** re-skinned vertices of each moved segment against the inner proxies of non-adjacent segments.
- **Glove into skin:** the existing glove-probe depth (C3-9b gate ≤ 10 mm).
- **Drift:** driver point vs re-skinned contact anchor, per frame.

### 5.3 QA readouts (additive, under `?qa`)

- `getSimulationState().grab = {part, segment, s2, w1, chain, bone, side, localPoint, anchorMode, anchorGapMm, driftMm, loadN, limitState, blocked, pointerLagMm}` (null when nothing is held).
- `getSimulationState().manip = {backend, poseVersion, active, solveMs, solveMsP95, writesLastFrame, parts: {chainId: {state, supported, swingDeg, twistDeg, flexDeg}}, selfGapMm, supportGapMm}`.
- `__studioQA.grabSamples(region, n, side)` → area-weighted, visible, non-occluded screen points with expected region and world point, for coverage sweeps. Regions: forearm, hand, elbow, wrist, upperArm, shoulder, thigh, knee, shank, ankle, foot, head, neck, chest, abdomen, flank, pelvis, privacy.
- `__studioQA.jointAngles()` → per joint `{swingY, swingZ, twist, flex, warn, hard}`.
- `__studioQA.skinPenetration()` → `{supportMaxMm, supportP95Mm, over2mm, selfMaxMm}`.
- `__studioQA.setGrabBackend('kinematic' | 'legacy')`.

## 6. Risks and mitigations

| Risk | Evidence | Mitigation |
|---|---|---|
| Swivel or twist flips near full extension | A prototype: 37–60 mm/frame before caps | Per-second rate caps, extension lock; gate: patient joint step ≤ 20 mm/frame |
| Knee collapses toward the midline | A prototype: 15.8 cm medial at the IR limit | ER bias, asymmetric hip rotation limits, other-leg hard constraint; gate in G4 |
| Proxies coarser than skin block motion | C: 162 mm blocked carry across the chest with crude boxes | Proxies fitted from skin weights (inner p50 × 0.9); carry-across-chest gate in G3 |
| Grab pop | A: 1.7–3.4 mm | Exact warm start; gate ≤ 2 mm |
| Mid-thigh grab cannot lift | B: 4.6° at 150 N | Slack relax, passive knee, fitted proxies; gate in G5 |
| Stale height field while parts are placed | — | Time-sliced rebuild; supports from `SupportSurface`, never from the height field |
| Candy-wrapper skin at twist | 23.4 % loss at 80° on one bone | Twist distribution; band-radius gate ≥ 90 % |
| Bounding sphere too small for a raised limb | — | QA assertion; widen the margin only if it fires |
| Limits wrong clinically | All values uncited until review | DN5 labels; certified-clinician sign-off before training use |
| Frame-rate dependence (32 fps WebKit vs 144 Hz) | — | Fixed 1/120 s passive substeps; all caps per second |
| Not real physics | — | Stated in §1.6; physics backend kept as a D5 revisit option |
| Test churn | Release and rest pose change | Changes isolated in G2 (rest) and G6 (release); every changed assertion listed in §7 |

## 7. Migration and tests

**Kept unchanged (gates for every cluster):** unit `forearm-contact`, `skin-pick-cache`, `target-filter`, `hold-gate`, `module-graph`, `event-logger`, `instrument-depth`, `asset-manifest`; smoke S2, S3, S4 (golden trace), S6, S8, V2; interaction C1-1, C1-2 (all modes), C1-2b, C1-4, C2-3, C2-5, C2-6, C2-12, C3-9a, C3-9d, C3-9e, C4-11b, C5-8a, C5-10a, C5-10b, C6-a, C6-b, C6-e; `perf-capture` V1–V4 (M8/M9 within +10 %).

**Deliberately updated:**

| Test | Cluster | Change |
|---|---|---|
| S1 module count | every cluster adding a module | 22 → actual |
| C3-9b, C3-9c, C3-9e, S2, S3, C5-8a, C6-a | G2 | Rest joint positions move (arms on the pads, F27); tests already read live rest positions; visual baselines refreshed with before/after images |
| C3-9b, C3-9c settle assertions | G6 | Split into (a) "lowered release": pointer back down, release, ease ≤ 0.34 m/s and < 3 mm at 2 s (unchanged numbers), and (b) "dropped release" from the lift: `dropped: true`, lands within 0.5 s, support penetration ≤ 2 mm, rebound ≤ 5 mm, within 3 mm of rest at 2 s via the magnet. "Re-grab while settling" becomes "re-grab while falling or easing" |
| `SMOKE_PROTOCOL.md` | G3, G6 | Pointer model text: grab anywhere, Shift plane, release behaviour |
| Kind `'wrist'` | — | Kept as the alias for every limb grab (C2-12, C3-9b, C3-9c, C3-9e, S4 unchanged) |

**Added:** unit `body-segments`, `body-proxies`, `support-surface`, `joint-model` (round trip, nearest-point projection vs brute force, continuity), `limb-solver` (warm start ≤ 0.5 mm, limits, anchor tracking, per-second caps), `passive-motion` (fall timing vs analytic pendulum, no bounce), `manipulation` (write discipline, poseVersion, facade); browser `G-coverage` (per region, per hand, per side), `G-lift`, `G-wrist-lift-elbow`, `G-across-chest`, `G-leg-lateral`, `G-thigh-lift`, `G-release`, `G-head`, `G-trunk`, `G-two-hands`, `G-perf`.

## 8. Implementation clusters

Each cluster is one commit series on `p1-interaction` (or a child branch), passes `npm test`, the smoke suite in Chrome, Edge and WebKit, the interaction suite and `perf-capture` V1–V4, and ends with a short phase-report entry. Effort is an ASSUMPTION.

| Id | Title | Depends on | Effort |
|---|---|---|---|
| G1 | Foundations: segments, proxies, supports, joint model, QA (no behaviour change) | — | 3–4 d |
| G2 | Supports and supine rest: F27, head ring, arms on the pads | G1, owner F27 | 2–3 d |
| G3 | Core: grab anywhere on forearm, hand, elbow and wrist zones (both arms) | G1, G2 | 5–7 d |
| G4 | Legs: shank, foot, knee and ankle zones; lateral knee; other-leg constraint | G3 | 3–4 d |
| G5 | Upper arm and thigh; passive motion (droop, swing); twist distribution; clavicle rhythm | G4 | 3–4 d |
| G6 | Release fidelity: stay, fall, magnet, drop flag, time-sliced field | G5 | 3–4 d |
| G7 | Head and neck | G3 | 2–3 d |
| G8 | Trunk soft tissue anywhere (SkinPatch) | G1 | 3–5 d |
| G9 | Weight, two hands, strain and ghost feedback | G6 | 3–4 d |
| G10 | Legacy removal, `md` limits, documentation | G1–G9 | 1–2 d |

### G1 — Foundations

- **Build:** `BodySegments`, `BodyProxies`, `SupportSurface`, `JointModel` (with the §2.4 table), `poseVersion` in `pickKey`, frame snapshots extended to every bone listed in §2.4 plus the eyelid bones (Q5), QA `grabSamples`, `jointAngles`, `skinPenetration`, `bodySegments()` summary.
- **Accept:** `triSeg` assigns 100 % of non-privacy triangles and ≥ 92 % with w1 ≥ 0.65; proxies: ≥ 95 % of each segment's dominant vertices lie outside its inner proxy; each segment's lowest rest vertex is a sample; `SupportSurface` pad tops within 1 mm of the GLB raycast (0.9525 today), arm boards at |x| 0.356–0.601, z −0.705…−0.235; joint model round trip ≤ 1e-9, nearest-point projection within 0.1° of a 3,600-sample brute force, continuous input gives continuous output; the authored supine pose has 0 HARD violations (WARN listed in the report); all existing tests green; no visual change (V1–V4 pixel diff 0).

### G2 — Supports and supine rest (F27 package)

- **Build:** `PAD_DROP = 0.0525`: `topAsset.position.y = Un.high − PAD_DROP` (4556) and in `setDeckHeight` (4000); procedural gel head ring (about 1k triangles, PU teal, roughness .7, footprint 0.22 × 0.20 m, top 0.9455 m, centred under the occiput at z ≈ −0.70; height DN5); `Cr` rise 0.0455 and footprint shrunk to the ring; `$` min-Y fed from `SupportSurface`; `Pr.supine` arm targets re-posed so the arms rest on the pad beside the body with the wrist inside the pad edge (start: upperArm z −0.12 → ≈ −0.34, lowerArm x 0.10 → ≈ 0.03, then tune), optional root −5 mm; if the chest still floats more than 8 mm, a ≤ 3° spine01/spine02 extension in supine, with the abdomen points checked unchanged ≤ 1 mm.
- **Accept:** `skinPenetration()`: 0 vertices more than 2 mm below a support except a declared compression allowance ≤ 5 mm under pelvis, calf and heel (DN5); lowest skin over its support per segment within −5…+5 mm for head, upper arm, forearm, hand, pelvis, calf and heel, and ≤ +8 mm for the chest (M2 max); both wrists at |x| ≤ 0.258 m; under-table V3 orbit shows no base/top seam (owner eye); drill S2, S3, C3-9a, C3-9d, C6-a, C6-b green; C5-8a aim < 1°; C3-9b, C3-9c, C3-9e, S4 green; V1–V4 baselines refreshed with before/after images; owner visual review.

### G3 — Core: arms, lower segments and zones

- **Build:** `LimbSolver` (§4.3, §4.4 zone path), `Manipulation` with the `kinematic` and `legacy` backends, target pipeline (§4.2, incl. Shift plane), anchors (§2.6), constraint pass (§4.6) against supports and every non-adjacent proxy, pick body branch (§3.1) for the arms (legs and head still go to today's paths), `pressBecomesLook` extension, `'grip'` profile and `followAnchor`, hover ring, cursors and status texts, markers hidden by default, `grab`/`manip` QA, event metadata. Release in G3 uses today's settle semantics through the facade (the anchor eases back to its rest position ≤ 0.32 m/s).
- **Accept:**
  - Coverage: ≥ 95 % of 40 `grabSamples` per region (forearm, hand, elbow, wrist) per arm, per hand, from each bed side where reachable, attach within 3.2 s; privacy 0 %; unreachable points never attach and a still click reports out of reach.
  - Fidelity: drift p95 ≤ 2 mm, max ≤ 5 mm over scripted drags; pop at attach ≤ 2 mm on every patient joint; glove depth at grip ≤ 10 mm.
  - Motion: 110 px up lifts dy > 6 cm with |dx| < 2 cm for mid-forearm, hand and wrist grabs; **a 10 cm wrist lift gives elbow flexion ≥ 30° with the elbow rising ≤ 15 mm** (fixes C11); patient joint step ≤ 20 mm/frame; grab point ≤ 0.33 m/s; hands ≤ 6°/frame and ≤ 2.5 cm/frame.
  - Limits and contact: 0 HARD excess > 0.5° in scripted sweeps; support penetration p95 ≤ 2 mm, max ≤ 5 mm; carrying the forearm across the chest ends resting on it with self gap ≥ −2 mm and lag ≤ 15 mm.
  - Performance: `manip.solveMsP95` ≤ 0.8 ms per held chain; C2-12 invariants (hover ≤ 1 pick/frame, burst = 1 skin raycast, tiny moves 0, 0 sphere recomputes); drag fps ≥ min(100, 0.9 × plain); WebKit ≥ 0.9 × baseline and 0 console errors.
  - Regression: S4 golden trace identical; C1-2 ≥ 0.9 in all modes; C1-2b green; all §7 gates green with `?grab=kinematic` and with `?grab=legacy`.

### G4 — Legs

- **Build:** body branch for the legs; ER bias and asymmetric hip rotation limits; other-leg proxy constraint; leg target filter (0.25 m/s).
- **Accept:** coverage ≥ 95 % for shank, foot, knee and ankle regions (C3-9b: 7/7 ankle grips); ankle lift 30 cm keeps knee flexion ≤ 10° with final anchor error ≤ 10 mm and worst ≤ 20 mm during the lift; mid-shank lift 20 cm plus 25 cm toward the hip keeps the knee lateral (knee centre |x| ≥ hip centre |x| − 0.02 m) with other-leg gap ≥ −2 mm and hip IR below HARD; knee pop ≤ 2 mm (B1 gone); heel never below the pad by more than 2 mm while sliding; joint step ≤ 20 mm/frame.

### G5 — Upper segments, passive motion, deformation

- **Build:** `solveUpper` for upper arm and thigh, `PassiveMotion` follower and droop, twist distribution (§4.11), clavicle rhythm.
- **Accept:** thigh lift 15 cm → knee flexion ≥ 30°, heel within −2…+10 mm of the pad; **mid-thigh lift 20 cm reaches ≥ 15 cm rise with lag ≤ 20 mm**; mid-upper-arm lift 10 cm → elbow flexion changes ≥ 15° with the hand staying on its support or hanging within limits; mid-forearm lift → wrist droop ≥ 30° and ≤ HARD; after the hand stops, distal swing amplitude falls below 10 % within 2.5 s, first overshoot ≤ 15°, and still jitter ≤ 0.5 mm RMS (M4); minimum skin radius in the forearm and shoulder bands ≥ 90 % of rest over the full allowed range (node test); clavicle angle = (elevation − 30°)/3 ± 1°.

### G6 — Release fidelity

- **Build:** §4.8 (stay, fall, magnet, drop flag, off-edge warning, time-sliced height field, opt-in assist); deliberate C3-9b and C3-9c updates (§7).
- **Accept:** release from ≥ 10 mm unsupported falls; time to landing within ±20 % of the path-pendulum prediction (unit) and ≤ 0.5 s from a 15 cm lift; landing support penetration ≤ 2 mm; rebound ≤ 5 mm; all samples below 2 mm/s within 0.6 s of landing; 0 bone writes at rest; magnet: within 3 mm of rest at 2 s and ease ≤ 0.34 m/s; `dropped` true above 5 cm, false at or below; a forearm placed on the chest stays (gap ≤ 3 mm, drift 0 over 5 s); height-field slices ≤ 5 ms each and `abdomen.ready` true within 10 frames; arm released beyond the edge shows the R4 warning; S4 trace identical; C3-9e green.

### G7 — Head and neck

- **Build:** `HeadSolver`, body branch for head and neck, one-hand message, 45° warning.
- **Accept:** coverage ≥ 95 % of non-eye head and neck skin; rotation ≤ 80°, flexion ≤ 50°, extension ≤ 60°, lateral ≤ 45°; WARN at 45° in release metadata and status; occiput ≥ head support − 2 mm; drift ≤ 5 mm; spine and pelvis matrices bit-identical (QA); scope and atlas tests green; first hover after a head move ≤ 4 ms extra.

### G8 — Trunk soft tissue anywhere

- **Build:** `SkinPatch` (§4.10), abdomen facade, `trunk_immovable` reason.
- **Accept:** press or pinch attaches on ≥ 95 % of samples in chest, upper abdomen, flank and pelvis (non-privacy) at a workstation; privacy 0 %; `contactGap` ≤ 2 mm; penetration < 5 mm; abdomen depth ≤ 25 mm, sternum ≤ 5 mm; pull beyond 2 cm gives the message and the event; trunk matrices bit-identical; patch start ≤ 6 ms; C2-3, C2-5, C4-11b green; bedside trunk stays `'surface'` (C1-2b).

### G9 — Weight, two hands, feedback

- **Build:** load readout and heavy message, glove strain pitch, ghost and strain rings, two-hand holds on one chain (one solve with two anchor targets, weighted least squares over the passive angles), finger and toe warnings.
- **Accept:** static load within ±20 % of the analytic values (arm by the wrist 19.5 N, straight leg by the ankle 52.9 N at 0°, head 59.6 N); heavy message within 0.5 s above 50 N; leg lifted with two hands (heel + knee): both drifts ≤ 5 mm and knee rise ≥ 10 cm; arm with wrist + elbow: both drifts ≤ 5 mm; ghost ring appears when lag > 2 cm and hides below 1 cm; strain pitch ≤ 6°.

### G10 — Cleanup

- **Build:** remove the `legacy` backend after G9 is green for a full suite run; `md` uses `JointModel` limits with a persistent reference (B5); update [09](09_ACCEPTANCE_AND_VALIDATION_PLAN.md) with GA rows, [08](08_TECHNICAL_DECISIONS_AND_OPEN_QUESTIONS.md) with the owner's answers, `SMOKE_PROTOCOL.md`, and a phase report.
- **Accept:** full suite green in Chrome, Edge and WebKit; `?grab=legacy` gone; no dead code paths for `allowWrist`, `wristOffset` or `bodyJoints` picking.

## 9. Owner decisions (default = recommendation)

1. **Released limb:** falls under gravity and is flagged if dropped (recommended, realistic) — or is lowered automatically.
2. **Trunk:** press, pinch and pull only; one hand never moves the trunk (recommended, R8/R9) — a deliberate exception to "wherever he grabs".
3. **Head:** the trainee may turn the head within limits with warnings (recommended) — or the head stays the anaesthetist's only.
4. **F27 and arm position:** lower the table top 52.5 mm, add a head ring, rest the arms on the pad beside the body (recommended) — or arms on the arm boards at ≤ 90° abduction.
5. **Shift for depth:** Shift + move pushes and pulls the grabbed part across the table (recommended, D4 consult).
6. **Physics engine:** not now; propose it only if G3–G6 fail their checks after measurement (recommended, D5 revisit rule).

All limits, masses, damping, loads, depths and thresholds remain illustrative until certified doctors sign them off (D7).
