// A pose version for the patient (12_GRAB_ANYWHERE_DESIGN.md §2.7): a counter that changes whenever any
// watched bone's world matrix changed since the last read. BedsideInteraction's pick key uses it, so a hover
// pick is never reused across a pose change, wherever on the body the change happened (the old key only
// held the four limb tips, so a turned head or a bent elbow kept a stale pick).
//
// The counter compares the matrices the skin raycast actually reads (bone.matrixWorld), value by value, so a
// writer that sets the same pose again does not invalidate anything; bump() lets a future writer that knows
// it changed the pose (Manipulation, G3) say so directly. No three.js import.

export function createPoseVersion(bones) {
  const watched = [...bones];
  const last = new Float64Array(watched.length * 16);
  let version = 0;
  let primed = false;
  function read() {
    let changed = false;
    for (let b = 0; b < watched.length; b++) {
      const e = watched[b].matrixWorld.elements, o = b * 16;
      for (let k = 0; k < 16; k++) {
        if (last[o + k] !== e[k]) { last[o + k] = e[k]; changed = true; }
      }
    }
    if (changed && primed) version++;
    primed = true;
    return version;
  }
  return {
    read,
    bump() { version++; return version; },
    get version() { return version; },
    bones: watched.length,
  };
}
