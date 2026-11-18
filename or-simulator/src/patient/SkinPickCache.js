// Faster raycasts against the patient's skinned meshes, with the same results as three.js.
//
// three.js SkinnedMesh.raycast skins each corner of each triangle it tests (getVertexPosition ->
// applyBoneTransform, one bone-matrix product per weight), so a vertex shared by six triangles is skinned
// six times. A full-skin pick took about 40 ms, and hovering spent 91 % of its time there (P1 hover profile).
//
// During a raycast this keeps one skinned position per vertex and recomputes it only when something it
// depends on changed: one of its weighted bones, the bind matrices, the morph influences, or the position,
// skin-index or skin-weight attribute (the abdomen's dent bumps the position version). It uses three.js's
// own arithmetic in the same order, so the positions, and therefore the hits, are bit-identical.
//
// Outside a raycast getVertexPosition is three.js's own, so callers that read vertices directly
// (AbdomenSurface, CrewController) are unaffected.

const installed = new WeakMap();

// Counters for the ?qa readout: syncs (raycasts), computed and reused vertex reads, resets.
export function skinPickCacheStats(skin) {
  return installed.get(skin)?.stats ?? null;
}

function skinnedPrototype(skin) {
  for (let proto = Object.getPrototypeOf(skin); proto; proto = Object.getPrototypeOf(proto)) {
    if (Object.prototype.hasOwnProperty.call(proto, 'applyBoneTransform')) return proto;
  }
  return null;
}

function sameElements(a, b) {
  for (let i = 0; i < 16; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function installSkinPickCache(skin) {
  if (!skin?.isSkinnedMesh) return null;
  if (installed.has(skin)) return installed.get(skin);
  const skinnedProto = skinnedPrototype(skin);
  // A subclass that overrides how vertices are skinned keeps three.js's path.
  if (!skinnedProto || Object.getPrototypeOf(skin) !== skinnedProto) return null;
  const meshProto = Object.getPrototypeOf(skinnedProto);
  const Vector3 = skin.position.constructor;
  const Matrix4 = skin.matrixWorld.constructor;
  const base = new Vector3(), weighted = new Vector3(), scratch = new Matrix4();
  const stats = { syncs: 0, computed: 0, reused: 0, resets: 0 };

  let state = null;
  let generation = 0;
  let active = false;

  function reset() {
    const geometry = skin.geometry;
    const skeleton = skin.skeleton;
    const { position, skinIndex, skinWeight } = geometry.attributes;
    const count = position.count;
    const boneIndex = new Float64Array(count * 4);
    const boneWeight = new Float64Array(count * 4);
    for (let i = 0; i < count; i++) {
      // Vector4.fromBufferAttribute reads getX..getW; getComponent(r) returns them in that order.
      boneIndex[i * 4] = skinIndex.getX(i); boneIndex[i * 4 + 1] = skinIndex.getY(i);
      boneIndex[i * 4 + 2] = skinIndex.getZ(i); boneIndex[i * 4 + 3] = skinIndex.getW(i);
      boneWeight[i * 4] = skinWeight.getX(i); boneWeight[i * 4 + 1] = skinWeight.getY(i);
      boneWeight[i * 4 + 2] = skinWeight.getZ(i); boneWeight[i * 4 + 3] = skinWeight.getW(i);
    }
    state = {
      geometry, skeleton, count, boneIndex, boneWeight,
      positions: new Float64Array(count * 3),
      // The generation in which each vertex was last skinned; 0 = never.
      stamp: new Uint32Array(count),
      boneMatrices: skeleton.bones.map(() => new Matrix4()),
      boneCount: skeleton.bones.length,
      // The generation in which each bone's skinning matrix last changed.
      boneChanged: new Uint32Array(skeleton.bones.length),
      bind: new Float64Array(16).fill(NaN),
      bindInverse: new Float64Array(16).fill(NaN),
      versions: [-1, -1, -1],
      morphAttributes: undefined,
      morphRelative: undefined,
      morphInfluences: [],
      globalChanged: 0,
    };
    stats.resets += 1;
  }

  // Called at the start of every raycast: compares everything a skinned position depends on with what
  // the cached positions were computed from, and marks what changed with a new generation.
  function sync() {
    const geometry = skin.geometry;
    const { position, skinIndex, skinWeight } = geometry.attributes;
    if (!state || state.geometry !== geometry || state.skeleton !== skin.skeleton || state.count !== position.count ||
        state.boneCount !== skin.skeleton.bones.length || state.versions[1] !== skinIndex.version ||
        state.versions[2] !== skinWeight.version) {
      reset();
    }
    stats.syncs += 1;
    const next = generation + 1;
    let changed = false;
    const { bones, boneInverses } = state.skeleton;
    for (let b = 0; b < state.boneCount; b++) {
      scratch.multiplyMatrices(bones[b].matrixWorld, boneInverses[b]);
      if (!sameElements(scratch.elements, state.boneMatrices[b].elements) || state.boneChanged[b] === 0) {
        state.boneMatrices[b].copy(scratch);
        state.boneChanged[b] = next;
        changed = true;
      }
    }
    const morphAttributes = geometry.morphAttributes.position;
    const influences = skin.morphTargetInfluences ?? [];
    let global = !sameElements(skin.bindMatrix.elements, state.bind) ||
      !sameElements(skin.bindMatrixInverse.elements, state.bindInverse) ||
      state.versions[0] !== position.version || state.versions[1] !== skinIndex.version ||
      state.versions[2] !== skinWeight.version || state.morphAttributes !== morphAttributes ||
      state.morphRelative !== geometry.morphTargetsRelative || state.morphInfluences.length !== influences.length;
    if (!global) {
      for (let i = 0; i < influences.length; i++) if (influences[i] !== state.morphInfluences[i]) { global = true; break; }
    }
    if (global) {
      state.bind.set(skin.bindMatrix.elements);
      state.bindInverse.set(skin.bindMatrixInverse.elements);
      state.versions = [position.version, skinIndex.version, skinWeight.version];
      state.morphAttributes = morphAttributes;
      state.morphRelative = geometry.morphTargetsRelative;
      state.morphInfluences = Array.from(influences);
      state.globalChanged = next;
      changed = true;
    }
    if (changed) generation = next;
  }

  // SkinnedMesh.getVertexPosition + applyBoneTransform (three.js r180), with each bone's skinning matrix
  // computed once per sync instead of once per weight per call.
  function skinVertex(index, target) {
    meshProto.getVertexPosition.call(skin, index, target);
    base.copy(target).applyMatrix4(skin.bindMatrix);
    target.set(0, 0, 0);
    const offset = index * 4;
    for (let r = 0; r < 4; r++) {
      const weight = state.boneWeight[offset + r];
      if (weight !== 0) {
        target.addScaledVector(weighted.copy(base).applyMatrix4(state.boneMatrices[state.boneIndex[offset + r]]), weight);
      }
    }
    return target.applyMatrix4(skin.bindMatrixInverse);
  }

  function cachedVertex(index, target) {
    const { stamp, boneChanged, boneIndex, boneWeight, positions } = state;
    const at = index * 3;
    // Skinned or checked since the last change: nothing it depends on has moved.
    if (stamp[index] === generation) {
      stats.reused += 1;
      return target.set(positions[at], positions[at + 1], positions[at + 2]);
    }
    let needed = state.globalChanged;
    const offset = index * 4;
    for (let r = 0; r < 4; r++) {
      if (boneWeight[offset + r] !== 0) {
        const changedAt = boneChanged[boneIndex[offset + r]];
        if (changedAt > needed) needed = changedAt;
      }
    }
    if (stamp[index] === 0 || stamp[index] < needed) {
      skinVertex(index, target);
      positions[at] = target.x; positions[at + 1] = target.y; positions[at + 2] = target.z;
      stamp[index] = generation;
      stats.computed += 1;
      return target;
    }
    // None of its bones changed since it was skinned: still valid in this generation.
    stamp[index] = generation;
    stats.reused += 1;
    return target.set(positions[at], positions[at + 1], positions[at + 2]);
  }

  const raycast = skinnedProto.raycast;
  skin.raycast = function raycastWithSkinCache(raycaster, intersects) {
    sync();
    active = true;
    try {
      return raycast.call(this, raycaster, intersects);
    } finally {
      active = false;
    }
  };
  skin.getVertexPosition = function getVertexPositionWithSkinCache(index, target) {
    return active ? cachedVertex(index, target) : skinnedProto.getVertexPosition.call(this, index, target);
  };

  const handle = { stats };
  installed.set(skin, handle);
  return handle;
}
