// Store the skin point in the moving patient's wrist frame, independent of camera look.
// floorY: the wrist's resting height. The drag never pushes the wrist below it (into the arm board).
export function createForearmGrip({ wrist, point, normal, camera, canvas, limb, Vector3, Quaternion, floorY }) {
  const localPoint = wrist.worldToLocal(point.clone());
  const localNormal = normal.clone().applyQuaternion(wrist.getWorldQuaternion(new Quaternion()).invert());
  const start = wrist.getWorldPosition(new Vector3());
  const right = camera.getWorldDirection(new Vector3()).cross(new Vector3(0, 1, 0)).normalize();
  const scale = 2 * camera.position.distanceTo(point) * Math.tan(camera.fov * Math.PI / 360) / canvas.clientHeight;
  const target = start.clone();
  let across = 0;
  let lift = 0;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  // Lowest lift: the resting height (a grip taken while the wrist settles may start above it).
  const lowest = Number.isFinite(floorY) ? Math.min(0, floorY - start.y) : 0;
  return {
    movePointer(dx, dy) {
      across = clamp(across + dx * scale, -.085, .085);
      lift = clamp(lift - dy * scale, lowest, .15);
      target.copy(start).addScaledVector(right, across);
      target.y += lift;
    },
    update(dt) {
      if (dt <= 0) return;
      const current = wrist.getWorldPosition(new Vector3());
      const delta = target.clone().sub(current);
      if (delta.lengthSq() < 1e-8) return;
      limb.move(current.add(delta.clampLength(0, dt * .33)));
    },
    freeze() {
      const current = wrist.getWorldPosition(new Vector3());
      const relative = current.clone().sub(start);
      across = relative.dot(right);
      lift = relative.y;
      target.copy(current);
    },
    sample() {
      const rotation = wrist.getWorldQuaternion(new Quaternion());
      return {
        point: wrist.localToWorld(localPoint.clone()),
        normal: localNormal.clone().applyQuaternion(rotation),
        rotation,
      };
    },
  };
}
