// Four-degree-of-freedom laparoscopic instrument control around a user-selected remote centre (port).
// Pointer offset controls pitch/yaw; wheel/buttons control insertion; Z/X control axial roll.
export function createInstrumentDepth({ Vector3, Plane, crew, camera, getPort, getHeight, updateUI, onEvent = () => {} }) {
  const maxTravel = 0.135;
  const alignRadius = 0.046;
  const maxAngle = 0.62;
  // The hand rolls the instrument by turning the forearm (pronation and supination): at most 90° each way.
  const maxRoll = Math.PI / 2;
  const up = new Vector3(0, 1, 0);
  const longitudinal = new Vector3(0, 0, 1);
  let travel = 0;
  let aligned = false;
  let available = false;
  let tipTarget = null;
  let pitch = 0;
  let yaw = 0;
  let roll = 0;
  let portSnapshot = null;
  let steering = null;
  // The pointer's offset from the port on the port plane (m) that the angles follow, and the anchor added to
  // the pointer after a pause, so steering continues from where it was instead of jumping to the pointer.
  let lastPointer = null;
  const anchor = { x: 0, z: 0 };
  let lastEmitted = { pitch: 0, yaw: 0, roll: 0, travel: 0 };
  let lastEventAt = -Infinity;
  // The hand could not hold the tool at the last asked pose (the trainee stands too far back): the tool keeps
  // its last reachable pose and the caller explains it (D-03).
  let reachLost = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const degrees = (radians) => Math.round(radians * 180 / Math.PI);
  function emitMovement(reason, force = false) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const changed = Math.abs(pitch - lastEmitted.pitch) >= 0.035
      || Math.abs(yaw - lastEmitted.yaw) >= 0.035
      || Math.abs(roll - lastEmitted.roll) >= 0.035
      || Math.abs(travel - lastEmitted.travel) >= 0.002;
    if (!force && (!changed || now - lastEventAt < 90)) return;
    lastEventAt = now;
    lastEmitted = { pitch, yaw, roll, travel };
    onEvent({ reason, angles: { pitch: degrees(pitch), yaw: degrees(yaw), roll: degrees(roll) }, insertion: Number(travel.toFixed(4)), aligned, port: portSnapshot?.toArray?.() ?? null, tip: tipTarget?.toArray?.() ?? null });
  }

  function baseDirection() {
    const sign = Math.sign(camera.position.x) || 1;
    return new Vector3(-sign * 0.26, -0.96, 0).normalize();
  }

  function directionForAngles() {
    const direction = baseDirection().applyAxisAngle(up, yaw);
    const pitchAxis = new Vector3().crossVectors(direction, longitudinal).normalize();
    if (pitchAxis.lengthSq() < 1e-5) pitchAxis.set(1, 0, 0);
    return direction.applyAxisAngle(pitchAxis, pitch).normalize();
  }

  // False when the palm would be out of the trainee's reach: the hand stays where it was (aimInstrument
  // refuses) and the caller restores the previous travel and angles.
  function applyPose() {
    const { side, entry, direction, across } = steering;
    const target = entry.clone().addScaledVector(direction, aligned ? travel - 0.012 : -0.025);
    // A crew without a return value (older test doubles) counts as reachable.
    reachLost = crew.aimInstrument(side, target, direction, roll, across) === false;
    if (!reachLost) tipTarget = target;
    return !reachLost;
  }

  // rebase: the pointer has just come back after a pause (a look, the monitor, a zoom); its current place
  // takes the current angles.
  function drive(line, side, walking, rebase = false) {
    const port = getPort();
    if (!port) {
      if (walking) {
        // Walking with the tool: it is carried in front of the body on the holding hand's side, and moves
        // with the trainee.
        const carry = camera.localToWorld(new Vector3(side === 'left' ? -0.13 : 0.13, -0.18, -0.38));
        crew.driveHand(side, carry, true, undefined, { body: true });
        return true;
      }
      return false;
    }

    const plane = new Plane(up, -port.y);
    const point = line.intersectPlane(plane, new Vector3());
    if (!point) return true;

    available = true;
    portSnapshot = port.clone();
    const previous = { aligned, pitch, yaw, steering, lastPointer, anchorX: anchor.x, anchorZ: anchor.z };
    if (rebase && lastPointer) {
      anchor.x = lastPointer.x - (point.x - port.x);
      anchor.z = lastPointer.z - (point.z - port.z);
    }
    const dx = point.x - port.x + anchor.x;
    const dz = point.z - port.z + anchor.z;
    lastPointer = { x: dx, z: dz };
    const radial = Math.hypot(dx, dz);

    if (travel <= 0.001) {
      // Before insertion, the operator must deliberately align the shaft with the selected port.
      aligned = radial <= alignRadius;
      pitch = clamp(dz * 1.15, -maxAngle, maxAngle);
      yaw = clamp(dx * 1.15, -maxAngle, maxAngle);
    } else {
      // Once docked, the trocar remains the remote centre; the shaft pivots around it.
      aligned = true;
      pitch = clamp(dz * 1.45, -maxAngle, maxAngle);
      yaw = clamp(dx * 1.45, -maxAngle, maxAngle);
    }

    const direction = directionForAngles();
    let entry;
    if (aligned) {
      entry = port.clone();
    } else {
      const x = port.x + clamp(dx, -0.12, 0.12);
      const z = port.z + clamp(dz, -0.115, 0.115);
      const height = getHeight(x, z);
      entry = new Vector3(x, Number.isFinite(height) ? height : port.y, z);
    }

    // The lens/tip stays just outside the port until the student advances the instrument.
    // The work point and standing position define roll zero, even while the camera looks away.
    const across = new Vector3(camera.position.z - port.z, 0, port.x - camera.position.x).normalize();
    steering = { side, entry, direction, across };
    if (!applyPose()) {
      // Out of reach: the shaft stays where the hand last held it.
      ({ aligned, pitch, yaw, steering, lastPointer } = previous);
      anchor.x = previous.anchorX;
      anchor.z = previous.anchorZ;
      updateUI();
      return true;
    }
    emitMovement('steering');
    updateUI();
    return true;
  }

  function adjust(delta) {
    if (!available || !aligned) return false;
    const previous = travel;
    travel = clamp(travel + delta, 0, maxTravel);
    if (travel !== previous) {
      if (!applyPose()) { travel = previous; updateUI(); return false; }
      emitMovement('insertion', true);
    }
    updateUI();
    return true;
  }

  function adjustRoll(delta) {
    if (!available || !aligned) return false;
    const previous = roll;
    roll = clamp(roll + delta, -maxRoll, maxRoll);
    if (roll !== previous) {
      if (!applyPose()) { roll = previous; updateUI(); return false; }
      emitMovement('roll', true);
    }
    updateUI();
    return true;
  }

  function reset() {
    travel = 0;
    aligned = false;
    available = false;
    tipTarget = null;
    portSnapshot = null;
    steering = null;
    lastPointer = null;
    reachLost = false;
    anchor.x = anchor.z = 0;
    pitch = yaw = roll = 0;
    lastEmitted = { pitch: 0, yaw: 0, roll: 0, travel: 0 };
    updateUI();
  }

  return {
    drive, adjust, adjustRoll, reset,
    get inserted() { return travel > 0.013; },
    get aligned() { return aligned; },
    get available() { return available; },
    get reachLost() { return reachLost; },
    get percent() { return Math.round(100 * travel / maxTravel); },
    get tipTarget() { return tipTarget; },
    get port() { return portSnapshot?.clone() ?? null; },
    get angles() { return { pitch: degrees(pitch), yaw: degrees(yaw), roll: degrees(roll), insertion: travel }; },
    // +1 or −1 when the roll is at that limit (±90°), else 0.
    get rollLimit() { return roll >= maxRoll - 1e-6 ? 1 : roll <= -maxRoll + 1e-6 ? -1 : 0; },
  };
}
