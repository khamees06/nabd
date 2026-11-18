# 13 — Visual quality plan

**Prepared:** 17 November 2026 · **Branch:** `p1-interaction` · **Status:** PLANNED (no code or asset has changed) · **Companion:** [12_GRAB_ANYWHERE_DESIGN.md](12_GRAB_ANYWHERE_DESIGN.md)

**Why now.** On 17 November 2026 the owner allowed any method that raises the quality of the shapes, precision and realism («ولو عندك طرق تزيد جودة الاشكال والدقة والواقعية اسمحلك تستعمله»). This plan applies that permission to rendering, in service of grab-anywhere: the trainee must see where the hand meets the skin, and the skin, gloves and steel must read as real under OR light.

**How it was made.** A read-only render audit, a first plan, and an adversarial review of that plan that checked every claim against the bundled three.js r180 code. This document is the corrected result. Labels follow the README: VERIFIED / DATA-DERIVED (measured by read-only scripts) / SOURCE-INSPECTED / ASSUMPTION. Every value that implies clinical appearance (dent depth, head-ring height, arm pose, skin tint) is DN5 "illustrative".

**Limits of this plan.** In-house methods only (D1 A+, D8): no new runtime dependency, no three.js upgrade, no external textures or meshes. Nothing here changes `patient.glb`, so the asset manifest is untouched unless a cluster says otherwise.

## 1. Facts the plan relies on

| Fact | Value | Label |
|---|---|---|
| Renderer | WebGLRenderer, MSAA default framebuffer, pixel ratio min(DPR, 1.8), sRGB output, ACES tone mapping at exposure 0.88, PCF shadows (`NabdRuntime.js:4643@7404-8011`) | SOURCE-INSPECTED |
| Environment map | none; steel at metalness .72–.82 renders near-black apart from highlights | VERIFIED |
| Lights | hemisphere 1.22, key directional 1.25 with a 2048 shadow map over ±4 m (≈ 3.9 mm/texel), fill .38, two spots 1.18 with decay 1.35 and no shadows (4036, 4066-4073) | SOURCE-INSPECTED |
| V1 baseline | idle 133.6 fps, 12 renders/s; active 109.6 fps, 84.4 renders/s, p95 20.6 ms; 1,206 calls and 387,848 triangles (shadow pass not counted); V3 orbit 69.5 fps | VERIFIED (P1 evidence) |
| Lamp luma (V1) | canvas mean 121.6; torso 144.1 vs room 97.1 = ratio 1.48 | VERIFIED (`evidence/p1-interaction/c6-before-after/lamp-luma-V1.json`) |
| Shadow pass | runs before `info.reset()`, so every render adds at least ≈ 500 uncounted draws: 355 static GLB meshes never culled (4545), room helpers casting by default, 4 patient skins (brows included), 13 supervisor primitives | SOURCE-INSPECTED |
| Patient skin | 105,822 triangles, mean edge 5.9 mm; albedo 2048² JPEG, normal 1024² PNG at scale .26, no TANGENT (derivative tangents; GLTFLoader stores normalScale as (.26, −.26)); roughness .58 constant; MeshPhysicalMaterial (specular, ior) | DATA-DERIVED / SOURCE-INSPECTED |
| Skin seams | 16,546 shared-position groups; normals differ ≤ 0.03°; skin weights match in every group | DATA-DERIVED |
| UV density (p50) | head .985 UV/m, trunk .554, arm .385 (≈ 1.27 mm/texel albedo, ≈ 2.5 mm/texel normal), leg .392, hand .511 | DATA-DERIVED |
| Twist collapse | 80° pronation on one bone loses 23.4 % volume at a 50/50 vertex; split over two bands 6.0 %; today's 0.19 rad wrist twist 0.45 % | DATA-DERIVED |
| Table top | every pad top at 0.9525 m (75 mm thick); pad edge |x| .282 (back, seat), .252 (head pad); arm boards |x| .356–.601, z −.705…−.235, top .951; no raised support under the head | DATA-DERIVED |
| F27 alone | after lowering the pads to 0.900 the gaps would be: shank +0.7, pelvis +4.7, foot +9.5, hand +11.1, chest +15.2, **head +45.9, upper arm +51.3, forearm +54.7 mm**; so F27 must ship with a head support and an arm re-pose ([12](12_GRAB_ANYWHERE_DESIGN.md) G2) | DATA-DERIVED |
| Room GLBs | table base/top, light pendant, anaesthesia unit have POSITION only, so GLTFLoader turns on flat shading (F28) | DATA-DERIVED |
| Tone mapping | ACES multiplies by exposure/0.6 (0.88 acts like 1.47); Neutral at exposure 1.23 matches today's mid-grey and lit skin (luma-matched range 1.05–1.28). Skin hue drifts 18.6° → 26.2° from shade to highlight under ACES, 22.8°–24.2° under Neutral | DATA-DERIVED (bundle shader) |
| Eyelids | `orbicularis03.L/R` (upper lid, 704 vertices) and `orbicularis04.L/R` (lower lid, 896) are skinned and untouched by app code | DATA-DERIVED |

## 2. Integration route

**Decision: Route A (built-ins already in the bundle) plus Route B (small in-house ports with injected classes). Route C (re-bundling three.js) is deferred.**

- three r180 is inlined in a closure in `NabdRuntime.js`; importing `three/addons/*` would load a second copy of three ("Multiple instances") and must not be done.
- `scripts/build-preview.mjs:16-21` accepts only relative named imports and `export function|class|const`.
- Available now in the bundle: `PMREMGenerator.fromScene(scene, sigma, near, far, {size, position})`, MeshPhysicalMaterial, `onBeforeCompile` and `customProgramCacheKey`, Neutral tone mapping, `shadow.intensity`, per-light `shadow.autoUpdate`/`needsUpdate`, `compileAsync`, `getMaxAnisotropy`, DataTexture, render targets.
- Small ports (MIT, notice already at `index.html:324`): `toCreasedNormals` (`BufferGeometryUtils.js:1316`) with a corrected hash.
- Route C (about one day, pixel diff must be 0 in V1–V4) only pays for GTAO/N8AO, KTX2 and SkeletonUtils. Analytic contact occlusion (Q6) replaces screen-space AO for the hand-on-skin cue at a fraction of the cost.

**New modules** (classes injected as for `loadCrew`, 4726-4734, and `createAbdomenSurface`, 6549; S1's module count raised deliberately):

| File | Role |
|---|---|
| `src/render/LookDev.js` | Environment capture, per-material environment assignment, light values, tone mapping, shadow scheduling, adaptive pixel ratio, QA render counters |
| `src/render/ShaderPatches.js` | The single `onBeforeCompile` composer per material (two separate patches on one material overwrite each other); every variant sets an explicit `customProgramCacheKey`, because r180's default key is `onBeforeCompile.toString()` and a shared closure would reuse the wrong program |
| `src/render/GeometryFixes.js` | `toCreasedNormals` port, procedural textures (detail normal, glove micro-normal), the head-ring geometry used by [12](12_GRAB_ANYWHERE_DESIGN.md) G2 |

**Engineering rules learned from the review (all SOURCE-INSPECTED in the bundle):**

1. Never set `scene.environment`: it overrides `envMapIntensity` for every material without its own `envMap` (3861@39777), so screens, steel and skin could not be tuned apart. Assign `material.envMap` per material class.
2. Change the skin normal scale with `normalScale.multiplyScalar(k)`, never `set()`, which would flip the stored negative y and turn bumps into dents.
3. r180 DataTexture defaults to Nearest filtering without mipmaps: set `generateMipmaps = true`, `LinearMipmapLinearFilter`/`LinearFilter`, `RepeatWrapping` and anisotropy on every procedural texture.
4. GLSL `smoothstep(e0, e1, x)` with e0 > e1 is undefined on Metal (WebKit via ANGLE): write `1.0 - smoothstep(0.4, 1.2, d)`.
5. Shadow `normalBias` is in world metres: keep it at .003–.005 for any shadow meant to show a hand on skin.
6. r180 PCF taps sit at ±radius and ±radius/2 texels: keep radius ≤ 2.5 to avoid a banded penumbra.
7. Keep `renderer.info.autoReset = true` so the M8/M9 baselines stay comparable; count the shadow pass separately (Q1).

## 3. Ranked upgrades

Ranked by value for grab-anywhere per unit of risk. GPU cost is an ASSUMPTION until Q1 measures it.

| Rank | Upgrade | Value | Risk | Cost per frame | Cluster |
|---|---|---|---|---|---|
| 1 | Contact occlusion where the glove and body touch | Very high: the main depth cue for "the hand is on the skin" | Medium (dark halos if proxies are wrong) | 0.2–0.6 ms at 1440×900 | Q6 |
| 2 | Image-based lighting and light rebalance | Very high: steel, gloves and skin highlights stop looking flat or black | Medium (whole look changes) | 0.1–0.3 ms | Q4 |
| 3 | Table supports and supine rest (F27, head ring, arms on the pads) | High: removes 5 cm of sinking and floating | Low–medium (rest poses and tests move) | 0 | [12](12_GRAB_ANYWHERE_DESIGN.md) G2 |
| 4 | Skin shading (detail normal and roughness, anisotropy, shadow-edge tint) | High in close grip views | Medium (waxy look, shimmer) | 0.05–0.2 ms | Q5 |
| 5 | Glove material and sleeve fix | High: gloves are always on screen | Low | ≈ 0.05 ms | Q5 |
| 6 | Shadow scheduling, caster hygiene, frustum culling | Enabler: frees budget for 1, 2 and 4 | Medium (a missed update leaves a stale shadow) | net saving | Q2 |
| 7 | Neutral tone mapping | Medium: keeps skin hue stable (needed later for pallor and cyanosis) | Low (owner A/B) | 0 | Q3 |
| 8 | Smooth normals on room GLBs (F28) | Medium–high in side views | Low | 0 (load +≤ 60 ms) | Q2 |
| 9 | Closed eyelids for the anaesthetised patient | Medium (realism of the face) | Low | 0 | Q5 |
| 10 | Spot-light shadow with a static/dynamic split | Medium (if contact occlusion is not enough) | Medium (acne, cost) | 0.5–1.5 ms on moving frames | Q7 (conditional) |
| 11 | GPU skin dent at the grip | Medium | Medium (must not hide real penetration) | < 0.1 ms | Q8 (deferred to P7 grasp) |
| 12 | Twist distribution and shoulder rhythm (no candy-wrapper) | High once limbs twist | Owned by IK | 0 | [12](12_GRAB_ANYWHERE_DESIGN.md) G5 |

## 4. Clusters

Execution order with the grab clusters: Q1 → Q2 → G1 → G2 → G3 → Q3 → G4 → G5 → G6 → Q4 → Q5 → Q6 → G7 → G8 → G9 → Q7 (if budget) → G10. Q8 follows P7.

Every cluster: unit tests, smoke S1–S9 in Chrome, Edge and WebKit, the interaction suite, `perf-capture` V1–V4, and before/after images with the luma JSON for any intended visual change. V1–V4 baselines change only on purpose.

### Q1 — Measure (no visual change)

- **Build:**
  - Under `?qa`, wrap the instance method `renderer.shadowMap.render` (3837@1101) and record per frame the `info.render.calls/triangles` deltas as `shadowCalls`, `shadowTris`, plus `shadowUpdates`.
  - Caster census: count of `castShadow` meshes per light and how many are visible.
  - Optional `gpuMs` from `EXT_disjoint_timer_query_webgl2` (Chrome only; availability is an ASSUMPTION; real Safari has none, so judge it by frame pacing).
  - `getSimulationState().render = {calls, tris, shadowCalls, shadowTris, shadowUpdates, programs, casters, envReady, toneMapping, exposure, pixelRatio, gpuMs}`.
  - Measurement scripts in `tests/browser/`: a rail rectangle added to the lamp-luma regions (today: canvas, patientTorso, tablePadsNear, room); a skin-hue tercile metric; a temporal shimmer metric (two frames 0.5 px camera jitter apart, per-pixel difference on a skin patch); a joint-band luma patch set (elbow, axilla, knee) for Q6.
  - WebKit baselines: C2-12 limb drag (today 32 fps), render rate, `perf-capture` V1–V4.
- **Accept:** V1–V4 pixel diff 0; the new readouts present in Chrome, Edge and WebKit; baseline JSON recorded including shadow calls; S1 count updated.

### Q2 — Performance, caster hygiene, smooth normals

- **Build:**
  1. `frustumCulled = true` for static GLB meshes in the traverse at 4545 (covers all four static GLBs, 4551-4552, 4563, 4579); the patient stays unculled.
  2. `castShadow = false` for the light pendant arms and ceiling meshes (`lightAsset` traverse, 4563-4575) and for the brows (a BLEND card casts its whole quad).
  3. Per-light `shadow.autoUpdate = false`; set `needsUpdate` only when a **caster signature** changes beyond ε. Signature: `manip.poseVersion` and the patient chain bone quaternions, abdomen `position.version`, glove wrist positions while they cast, supervisor arm bones, tool matrix, deck height, `focusLightTarget` position (5244), and caster `visible`/`castShadow` flags (pendant visibility toggles with camera height, 6508-6510). Also update once after each GLB load, after `setDeckHeight` (4000) and at the end of a pose tween.
  4. F28: for room GLB meshes without normals, a `toCreasedNormals` port at 35° with a position hash of 1e4 (the stock 1e2 merges distinct vertices in 137 primitives smaller than 5 cm); then `flatShading = false` and `needsUpdate`.
  5. Adaptive pixel ratio guard (Retina and WebKit): steps 1.8 → 1.5 → 1.25 when the render-interval p95 exceeds 22 ms for 2 s; steps back after 5 s below 14 ms. Inactive at DPR ≤ 1.25 (the test machine).
  6. Hygiene renames with no behaviour change: `DoubleSide: Dh` → `rn` (6545); the `AmbientLight: dr` label → HemisphereLight.
- **Accept:** idle and look-only frames add 0 to `shadowUpdates`; a moving limb or glove updates the shadow within ≤ 1 frame (unit test with a fake renderer plus a C3-9b replay); V1 main-pass calls < 1,206; V1 active ≥ 109.6 fps and ≥ 84.4 renders/s; WebKit limb drag ≥ 0.9 × its Q1 baseline; V1–V4 pixel diff 0 except the F28 meshes (reviewed by eye); 0 flat-shaded materials remain; ready time added by F28 ≤ 60 ms in Chrome and ≤ 120 ms in WebKit.

### Q3 — Neutral tone mapping (owner A/B, alone)

- **Build:** `toneMapping` from ACES (`Lo`) to Neutral (`ou = 7`) at `4643@7946-7985`, exposure starting at 1.2 and tuned until the canvas mean luma is within ±5 % of 121.6. Shipped as its own commit before Q4, so the owner can attribute the change.
- **Accept:** skin hue spread across luma terciles ≤ 3°; skin hue shift against the baseline ≤ 3°; skin luma standard deviation within ±10 % of the baseline (catches a flat look); owner A/B screenshots V1–V4 and two grip close-ups.

### Q4 — Image-based lighting and light rebalance

- **Build:**
  - `envScene` built in-house from MeshBasic panels: the HEPA diffuser 2.43 × 1.83 m at y 3.77 (3912) at ×6, lamp discs at the lamp-face positions (4570-4575) at ×20, walls and floor at their room colours × 0.6–0.9. Captured once with `PMREMGenerator.fromScene(envScene, .04, .1, 20, {size: 256, position: (0, 1.2, −.15)})`, then disposed.
  - Per material class `envMap` and `envMapIntensity` (illustrative): steel 1.0, room and pads .6–.8, gloves ≈ .6, skin .3–.5, vitals and field screens 0–.05.
  - Gate on half-float render-target support (`EXT_color_buffer_half_float` or `EXT_color_buffer_float`); otherwise keep today's lights.
  - Rebalance (tune by luma): hemisphere 1.22 → ≈ .35, key 1.25 → ≈ .95, fill .38 → ≈ .2; spots decay 1.35 → 2 at intensity ≈ 2.6.
  - `compileAsync` is not awaited before "ready" unless its delay is measured (it polls every 10 ms without `KHR_parallel_shader_compile`).
- **Accept:** torso/room luma ratio 1.9–2.3; torso clipped ≤ 0.5 %; rail region mean and standard deviation up ≥ 30 %; vitals screen text contrast within ±5 % of baseline; V1 active ≥ 110 fps with p95 ≤ 21.6 ms; V3 ≥ 66 fps; ready time (M10) +≤ 100 ms; 0 new WebKit console errors; `render.programs` recorded.

### Q5 — Skin, gloves, eyes, sleeve

- **Skin** (clinical skin and privacy materials, after `hd`, 6528):
  - anisotropy min(8, max) on `map` and `normalMap`;
  - `normalScale.multiplyScalar(.32 / .26)`;
  - detail normal and roughness: a 512² DataTexture generated at load from a fixed seed (mipmapped, linear, repeat), 110–140 repeats per UV unit (1.8–2.3 cm tiles on limbs; finer on the head), whiteout-blended in `normal_fragment_maps`, faded by `1.0 - smoothstep(0.4, 1.2, length(vViewPosition))`; roughness .58 ± .06 from the detail texture;
  - scattering imitation by a per-channel shadow-edge tint: rewrite the shadow multiply in `lights_fragment_begin` as `pow(vec3(s), vec3(.6, 1.0, 1.2))` for the shadowing lights. (A wrap-diffuse term is rejected as default: on a shadowing light it leaves a red fringe with a hard edge at the terminator.);
  - sheen 0 by default, A/B at ≤ .05 only; never transmission (it adds a full opaque pass);
  - illustrative (DN5): the skin tint must not suggest a clinical sign.
- **Gloves** (`CrewController.js:44-51`): stay MeshStandardMaterial (the glove GLB has no extensions); roughness .42–.48; a 256² mipmapped micro-dot normal at scale .15; per-material `envMap`; no clearcoat or sheen; cast shadows whenever the contact gap is < 0.10 m (feeds the Q2 signature).
- **Sleeve sawtooth:** investigate and fix the open-edge sawtooth (`CrewController.js:72-76`, edge selection plus `CylinderGeometry(.036, .057, 1, 18)`).
- **Eyes closed:** in `hd()` after posing, rotate `orbicularis03.L/R` (upper lids) and `orbicularis04.L/R` (lower lids) to close the eyes; add them to the frame snapshots ([12](12_GRAB_ANYWHERE_DESIGN.md) G1). Eye tape is an optional clinician item (DN5).
- **Accept:** temporal shimmer on the skin patch rises ≤ 10 %; skin hue within ±3° and luma within ±5 % of the Q4 result; unit test that the normal scale keeps its sign; 0 iris pixels visible in a close head view (screenshot plus owner eye); sleeve edge without sawtooth (screenshot); glove depth at grip unchanged (C3-9b ≤ 10 mm); V1 active ≥ 110 fps; `render.programs` +≤ 4.

### Q6 — Contact cues (analytic occlusion)

Depends on [12](12_GRAB_ANYWHERE_DESIGN.md) G1 (proxies, segment ids) and G3 (anchors).

- **Occluders:** 12 glove spheres per hand from the glove bones (palm × 2 at r .030, 5 middle phalanges at r .010, 5 fingertips at r .009); patient capsules from `BodyProxies` (8 limb inner proxies, the fitted trunk slices, the head ellipsoid as a sphere).
- **Formula:** `occ_i = clamp((r/d)² · max(n·(c − p)/d, 0), 0, 1)` (closest point for capsules); `ao = max(0.25, Π(1 − 0.9·occ_i))`.
- **Masks:** a per-vertex segment id (Uint8, ≈ 70 KB) from `BodySegments`; a segment never occludes itself or its parent and child segments (otherwise every elbow, axilla and knee darkens).
- **Where:** body-capsule occlusion **per vertex** on the skin (after `skinning_vertex`); table pads per fragment with patient capsules only; glove spheres per fragment only while a glove is within 0.10 m of the nearest proxy surface (measured from the palm centre). Indirect diffuse and specular × ao; direct diffuse × mix(1, ao, .4). Loop bound `uOccCount`; the CPU drops occluders farther than 0.25 m from the receiver's segment proxy.
- **Accept:** with gloves hidden by a QA option that keeps the uniforms, A/B `uOccStrength` 0/1 on the same frame: the 10 px ring around the contact is ≥ 15 % darker than a ring 4 cm away, and changes ≤ 2 % when the hand is ≥ 5 cm away; joint-band patches at rest change ≤ 3 %; pad halo outside the contact ≤ 3 %; `gpuMs` +≤ 0.6 ms at 1440×900 (Chrome); V1 active ≥ 110 fps; unit tests for the occlusion maths, the clamps and cache-key uniqueness.

### Q7 — Spot-light shadow with a static/dynamic split (conditional)

Only if Q1/Q2 leave budget and the owner wants more than Q6 gives.

- **Build:** the key light's map holds the static room only (patient, gloves, tool and supervisor `castShadow = false` during its rare updates; per-object `castShadow` does not change receiving shaders); the spot nearest the work point holds only the dynamic field casters (patient skins, gloves, tool, supervisor arms; ≈ 20 draws). Spot shadow: 2048 map (1024 below 650 px), near .5, far 3.5, radius ≤ 2.5, bias −.0002, normalBias .003–.005, `shadow.intensity` .85; key `shadow.intensity` .6.
- **Accept:** spot-pass draws ≤ 60; ≥ 10 % darkening under a hand lifted 5 cm; pad Laplacian energy up ≤ 10 % (acne check); no visible banding (owner eye); V1 active ≥ 110 fps; V3 ≥ 66 fps; WebKit ≥ 0.9 × baseline.

### Q8 — GPU skin dent at the grip (deferred to P7 grasp)

- **Build:** after `skinning_vertex`, a Gaussian push along the normal around up to 8 grip contacts with the normal tilted by the gradient (`n′ = n − 2d·f·o_t / r²`); depth driven by grip state, 2–5 mm (DN5), off inside an active `SkinPatch`; the glove pad target becomes skin minus dent, and M1 is defined against the declared dent; depth and shadow materials are not patched.
- **Accept:** the drill's M1 ≤ 1 mm still holds; the dent is visible in a close grip view; picking mismatch ≤ the dent depth and documented.

## 5. Deferred and rejected

| Item | Decision | Reason |
|---|---|---|
| Route C re-bundle → GTAO/N8AO, KTX2, 4K skin textures | Deferred | No higher-resolution in-house texture source; uncompressed 4096 adds ≈ 67 MB of GPU memory; Q6 covers the contact cue |
| Merging static meshes by material | Deferred | Needs `mergeGeometries` and a 0-pixel-diff gate; Q2 culling first |
| Drapes | Deferred | Conflict with grab-anywhere; owner and clinician decision |
| Denser patient mesh | Deferred | CPU skinning cost (picking, abdomen rebuild), D1 A+, asset manifest |
| Dual-quaternion skinning | Rejected | Would break the bit-exact CPU skinning used by `SkinPickCache`, `AbdomenSurface` and contact checks; twist distribution ([12](12_GRAB_ANYWHERE_DESIGN.md) §4.11) solves the collapse instead |
| Brows alpha-to-coverage | Rejected | No recorded defect; 4× MSAA quantises alpha to 5 levels |
| Pressure blanching or redness at the grip | Rejected | Would imply a clinical sign |
| Fog | No change | It never shows (14–30 m against an 11.4 m room) |

## 6. Owner review by eye

Before/after screenshots at 1440×900 in V1–V4, plus close views of grips on the forearm, thigh and head:

1. Neutral vs ACES tone mapping (Q3).
2. Overall light: the brighter surgical field and the steel no longer black (Q4).
3. Skin (not waxy, no shimmer), glove finish, sleeve edge, closed eyes (Q5).
4. Strength of the contact darkening where the hand grips (Q6).
5. F27 side view, the head ring and the arms resting on the pads ([12](12_GRAB_ANYWHERE_DESIGN.md) G2).

Clinicians sign off the head-ring height, the arm pose, dent depths and any skin tint (DN5, D7).
