// Distance along a walkway surrounding the table, measured in metres.
export function createWorkWalk({ sideX, endZ }) {
  const side = endZ * 2, end = sideX * 2;
  const loop = 2 * (side + end);
  const wrap = (distance) => (distance % loop + loop) % loop;
  let current = 0;
  let target = 0;
  let offset = 0;

  function onSide(sign, z) {
    const longitudinal = Math.max(-endZ, Math.min(endZ, z));
    return sign > 0 ? longitudinal + endZ : side + end + endZ - longitudinal;
  }
  function enter(x, z) {
    current = onSide(Math.sign(x) || 1, z);
    target = current;
    offset = 0;
  }
  function goTo(sign, z) {
    const desired = onSide(sign, z);
    const delta = wrap(desired - current + loop / 2) - loop / 2;
    target = current + delta;
  }
  function position() {
    const u = wrap(current);
    if (u <= side) return [sideX + offset, -endZ + u];
    if (u <= side + end) return [sideX - (u - side), endZ + offset];
    if (u <= 2 * side + end) return [-sideX - offset, endZ - (u - side - end)];
    return [-sideX + (u - 2 * side - end), -endZ - offset];
  }
  function walk(delta, accumulate = false) {
    target = (accumulate ? target : current) + delta;
  }
  function approach(delta) {
    const u = wrap(current);
    // At the corners the fixed path is continuous, so clear the extra offset.
    if (Math.min(...[0, side, side+end, 2*side+end, loop].map((corner) => Math.abs(u-corner))) < 0.22) return;
    offset = Math.min(0.25, Math.max(-0.09, offset + delta));
  }
  function update(dt, snap) {
    const delta = target - current;
    if (Math.abs(delta) < 1e-6) return false;
    const next = Math.sign(delta) * Math.min(Math.abs(delta), snap ? loop : dt * 1.35);
    const u = wrap(current);
    if (Math.min(...[0, side, side+end, 2*side+end, loop].map((corner) => Math.abs(u-corner))) < 0.26) {
      offset *= snap ? 0 : Math.max(0, 1 - dt*18);
    }
    current += next;
    return true;
  }
  return { enter, goTo, position, walk, approach, update, get moving() { return Math.abs(target-current) > 1e-6; } };
}
