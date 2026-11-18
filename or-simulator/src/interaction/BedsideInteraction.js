import { createForearmGrip } from './ForearmGrip.js';
import { createHoldGate } from './hold-gate.js';
import { isPrivacySurfaceHit } from './target-filter.js';
export function createBedside({
  canvas, camera, crew, patient, Raycaster, Vector2, Vector3, Plane, Quaternion,
  isEnabled, canPickTool, allowWrist, getSide, startLimb, surfaceHit,
  look, tap, onEvent, invalidate, toolHeight, abdomen, workstation, toolField, toolReleased,
  focusPickEnabled = () => false, onFocusPoint = () => {}, lookModeEnabled = () => false, viewportInputPaused = () => false,
  lookEnabled = isEnabled, toolSpace = () => null,
}) {
  const ray = new Raycaster();
  const screen = new Vector2();
  const up = new Vector3(0, 1, 0);
  let gesture = null;
  let hover = null;
  let pointer = null;
  // The browser sends contextmenu after the right button comes up, often over the HUD below the
  // canvas. Block it while a look pointer is active and briefly after it ends.
  let blockMenuUntil = 0;
  const holdTimeout = 3200;
  // A press that cannot act (out of reach, or a free-mode skin touch) turns into a look once it moves this far.
  const lookDrag = 8;
  const lookCursor = 'all-scroll';
  // Press and pinch are offered only where the world face normal points this much up.
  const pressNormalY = 0.62;
  // Forearm drill grip: the palm comes down onto the wrist. On the near side of the wrist the face normal
  // is almost horizontal, so the fingers came in from the side and stopped on the forearm capsule (PR-6).
  const drillNormalY = 0.6;
  // When the forearm sweep has stopped the hand (within this time), a flat pad this close closes the grip;
  // the measured stalls were 0.029–0.038 m away (the normal gate stays 0.028 m).
  const stalledGap = 0.040;
  const stalledMs = 250;
  // A tool is taken in the hand once the glove matches the tool's own rotation this closely, so it barely
  // turns at the grasp. Over the next toolEaseMs or longer it rises from where it lay to the carry height and
  // the grip turns from the tool's rotation to the carry. The ease is long enough that its peak turn rate
  // (1.5 × angle / duration for the smoothstep) stays at 70 % of the hand's 280°/s cap (CrewController), so
  // the hand follows a bell-shaped speed profile instead of running at the cap with the ease ahead of it.
  const toolGripTurn = 1.5 * Math.PI / 180;
  const toolEaseMs = 300;
  const toolEaseTurnRate = 0.7 * 280 * Math.PI / 180;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smooth = (k) => k * k * (3 - 2 * k);
  // Hover picking (a full-skin raycast) runs at most once per frame and only after the pointer moved
  // at least this far since the last pick.
  const hoverMove = 3;
  let hoverFrame = 0;
  let hoverPicked = null;
  // The last hover pick, reused by a click at the same pixel while nothing that a pick depends on has
  // changed (camera pose and lens, canvas box, tool pose, limb tips), so the click frame does not repeat the
  // full-skin raycast. Cleared when a gesture starts or ends.
  const pickReuseMs = 600;
  const keyPoint = new Vector3();
  let lastPick = null;
  function pickKey(x, y, radius) {
    const box = canvas.getBoundingClientRect();
    camera.updateMatrixWorld();
    return [x, y, radius, box.left, box.top, box.width, box.height, ...camera.matrixWorld.elements,
      ...camera.projectionMatrix.elements, ...crew.tool.position.toArray(), crew.tool.visible, crew.toolMode,
      ...patient.chains.flatMap((chain) => chain.joints[2].getWorldPosition(keyPoint).toArray())].join(',');
  }
  function copyTarget(target) {
    return target && { ...target, point: target.point.clone(), normal: target.normal?.clone(), rotation: target.rotation?.clone() };
  }
  function pickOnce(x, y, radius) {
    const key = pickKey(x, y, radius);
    if (lastPick && lastPick.key === key && performance.now() - lastPick.time <= pickReuseMs) return copyTarget(lastPick.target);
    const target = pick(x, y, radius);
    lastPick = { key, time: performance.now(), target: copyTarget(target) };
    return target;
  }
  const isHold = (item) => item?.side && item.kind !== 'surface';
  const isSkinAction = (kind) => ['abdomen', 'press', 'touch'].includes(kind);
  const profile = (kind) => kind === 'abdomen' ? 'pinch' : 'flat';

  function rayAt(x, y) {
    const box = canvas.getBoundingClientRect();
    screen.set((x - box.left) / box.width * 2 - 1, 1 - (y - box.top) / box.height * 2);
    camera.updateMatrixWorld();
    ray.setFromCamera(screen, camera);
    return ray.ray;
  }

  // Limb grips drag on a vertical plane that faces the trainee: the pointer moving up lifts the limb and
  // moving sideways moves it across, whatever the camera pitch (the camera-facing plane turned an upward
  // drag into a pull across the body).
  function limbPlaneNormal() {
    const forward = camera.getWorldDirection(new Vector3());
    forward.y = 0;
    return forward.lengthSq() > 1e-6 ? forward.normalize() : camera.getWorldDirection(new Vector3());
  }
  // After a pause (look, zoom, the pointer left the view) the limb plane faces the current camera again
  // and the pointer's current pixel maps to where the limb is now, so resuming never makes it jump.
  function anchorLimbPlane(x, y) {
    const current = gesture;
    const contact = current.contact ?? current.point;
    current.plane.setFromNormalAndCoplanarPoint(limbPlaneNormal(), contact);
    const hit = rayAt(x, y).intersectPlane(current.plane, new Vector3());
    if (hit) current.offset.copy(contact).sub(hit);
    rememberPointer(x, y);
  }

  function rememberPointer(x,y) {
    const box = canvas.getBoundingClientRect();
    gesture.u = (x-box.left)/box.width;
    gesture.v = (y-box.top)/box.height;
  }
  function pointerPosition() {
    const box = canvas.getBoundingClientRect();
    return [box.left+gesture.u*box.width,box.top+gesture.v*box.height];
  }

  function pick(x, y, radius) {
    const line = rayAt(x, y);
    const surface = surfaceHit(ray);
    const surfaceDepth = surface?.distance ?? Infinity;
    const station = workstation();
    if (station?.forearm) {
      if (!surface || isPrivacySurfaceHit(surface)) return null;
      const chain = station.forearm.chain;
      const wrist = chain.joints[2].getWorldPosition(new Vector3());
      if (surface.point.distanceTo(wrist) > .062) return null;
      const normal = surface.normal?.clone() ?? surface.face?.normal?.clone();
      if (!normal) return null;
      normal.transformDirection(surface.object.matrixWorld).normalize();
      if (normal.dot(line.direction) > 0) normal.negate();
      if (normal.y < drillNormalY) {
        // Keep the side the normal faces, tilted up to normal.y = 0.6.
        const across = new Vector3(normal.x, 0, normal.z);
        if (across.lengthSq() < 1e-8) across.set(-line.direction.x, 0, -line.direction.z);
        across.normalize().multiplyScalar(Math.sqrt(1 - drillNormalY * drillNormalY));
        normal.set(across.x, drillNormalY, across.z);
      }
      return { kind:'wrist', chain, jointIndex:2, point:surface.point.clone(), normal,
        stationGrip:true, forearm:station.forearm };
    }
    const handle = crew.tool.position;
    const toolHere = !station || crew.toolMode === 'placed';
    if (toolHere && canPickTool() && crew.tool.visible && line.distanceSqToPoint(handle) < radius ** 2 &&
        camera.position.distanceTo(handle) < surfaceDepth + 0.035) {
      return { kind: 'tool', point: handle.clone(), rotation: crew.tool.quaternion.clone() };
    }
    if (station || allowWrist()) {
      const joints = station?.joints ?? patient.chains.filter(({ kind }) => kind === 'arm')
        .map((chain) => ({ chain, jointIndex: 2 }));
      let nearest = null, best = Infinity;
      for (const { chain,jointIndex,point: visiblePoint } of joints) {
        const joint = chain.joints[jointIndex].getWorldPosition(new Vector3());
        const target = visiblePoint?.clone() ?? joint.clone().addScaledVector(line.direction,-0.025);
        const tolerance = radius * (chain.kind === 'leg' ? 1.37 : 1.1);
        const miss = line.distanceSqToPoint(target);
        if (miss > tolerance*tolerance || camera.position.distanceTo(target) > surfaceDepth + 0.067) continue;
        const score = miss / (tolerance*tolerance) + camera.position.distanceTo(target) * 0.08;
        if (score >= best) continue;
        best = score;
        if (station && surface?.point.distanceTo(joint) < (chain.kind === 'leg' ? 0.105 : 0.08)) target.copy(surface.point);
        nearest = { kind:'wrist', chain, jointIndex, point:target, stationGrip:Boolean(station) };
      }
      if (nearest) return nearest;
    }
    if (station) {
      if (isPrivacySurfaceHit(surface)) return null;
      const action = surface && station.surfaceAction(surface.point, surface.object);
      if (action) {
        const normal = surface.face?.normal?.clone();
        if (normal) normal.transformDirection(surface.object.matrixWorld).normalize();
        // Press and pinch need skin that faces up (the front of the abdomen); on the side of the
        // body the fingers only touch.
        const kind = ['press', 'abdomen'].includes(action) && !(normal?.y > pressNormalY) ? 'touch' : action;
        return { kind, point:surface.point.clone(), normal };
      }
      let closest = null, miss = radius * radius;
      for (const target of station.landmarks()) {
        const distance = line.distanceSqToPoint(target.point);
        if (distance >= miss || camera.position.distanceTo(target.point) > surfaceDepth + 0.06) continue;
        closest = target;
        miss = distance;
      }
      if (!closest) return null;
      return { kind:station.surfaceAction(closest.point) ?? 'touch', point:closest.point.clone() };
    }
    if (surface && !isPrivacySurfaceHit(surface)) {
      return { kind: 'surface', point: surface.point.clone().addScaledVector(line.direction, -0.009) };
    }
    return null;
  }

  function begin(x, y, id, pointerType = 'mouse') {
    const side = getSide();
    const target = pickOnce(x, y, pointerType === 'touch' ? 0.057 : 0.042);
    lastPick = null;
    // Empty space (also in the forearm drill) is a look; a still click there may tap the monitor.
    if (!target) { gesture = { id, kind: 'look', x, y, moved: false }; return; }
    if (!crew.canReach(side, target.point)) {
      // Out of reach: a drag looks; only a still click reports the reach problem (on release).
      gesture = { id, kind: 'blocked', target, x, y, sx: x, sy: y, moved: false };
      return;
    }
    const normal = target.kind === 'tool' ? up
      : isSkinAction(target.kind) ? (target.normal ?? up)
      : target.kind === 'wrist' ? limbPlaneNormal()
      : camera.getWorldDirection(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, target.point);
    const planeHit = rayAt(x, y).intersectPlane(plane, new Vector3());
    if (!planeHit) return;
    gesture = { ...target, id, side, started: performance.now(), plane, x, y, sx: x, sy: y, offset: target.point.clone().sub(planeHit), attached: false, gate: createHoldGate() };
    // A free bedside wrist grab: the hand comes from the trainee's side (fingers away from the shoulder,
    // back of the hand up), not in the fixed instrument-holding rotation.
    if (target.kind === 'wrist' && !target.stationGrip) gesture.rotation = crew.contactRotation(side, target.point, -0.06);
    if (target.forearm) {
      target.forearm.takeOver();
      gesture.sweepStops = target.forearm.collision.stops;
      target.forearm.collision.refresh();
      crew.setForearmContact(side,target.forearm.collision);
    }
    rememberPointer(x,y);
    onEvent('reach', gesture);
    invalidate();
  }

  function finishPointer() {
    const id = pointer?.id;
    if (pointer?.look) {
      blockMenuUntil = performance.now() + 400;
      canvas.style.cursor = gesture?.attached ? 'grabbing' : '';
    }
    pointer = null;
    if (typeof id === 'number' && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }

  function release(cancelled = false) {
    const ended = gesture;
    if (!ended) return;
    gesture = null;
    // The cursor is set again by the next hover pick, wherever the pointer is now.
    hoverPicked = null;
    lastPick = null;
    // Ending a hand gesture (for example the reach timeout) never ends a look that is in progress.
    if (!pointer?.look) finishPointer();
    const cursor = pointer?.look ? lookCursor : '';
    if (ended.kind === 'blocked') {
      if (!cancelled && !ended.moved) onEvent('outOfReach', ended.target);
      canvas.style.cursor = cursor;
      return;
    }
    if (ended.forearm && ended.attached) ended.forearm.release(ended.limb);
    if (ended.side) crew.clearDrive(ended.side);
    // A released hand (attached or not) drops the forearm collision object; only a hand that is reaching
    // for or holding the forearm keeps one, so overlap and stops always describe that hand (AC-P1-4).
    if (ended.forearm) crew.setForearmContact(ended.side,null);
    canvas.style.cursor = cursor;
    if (ended.kind === 'tool' && ended.attached) toolReleased(cancelled);
    if (isSkinAction(ended.kind)) {
      if (ended.attached && ended.kind !== 'touch') abdomen.release();
      onEvent('release', ended, cancelled);
    } else if (ended.attached) onEvent('release', ended, cancelled);
    else if (!cancelled && ended.kind === 'look' && !ended.moved && !workstation()?.forearm) tap(ended.x, ended.y);
    invalidate();
  }

  // Click acts, drag looks: a press that cannot hold anything becomes a look once it moves.
  function pressBecomesLook(x, y) {
    const from = gesture;
    const canLook = from.kind === 'blocked' || (from.kind === 'surface' && !from.attached);
    if (!canLook || Math.hypot(x - from.sx, y - from.sy) <= lookDrag) return;
    if (from.side) crew.clearDrive(from.side);
    // The look starts at the press point, so the whole drag turns the view.
    gesture = { id: from.id, kind: 'look', x: from.sx, y: from.sy, moved: false };
    canvas.style.cursor = lookCursor;
    if (from.kind === 'surface') onEvent('lookFromPress', from);
  }

  function move(x, y) {
    if (!gesture) return;
    pressBecomesLook(x, y);
    if (gesture.kind === 'look') {
      const dx = x - gesture.x, dy = y - gesture.y;
      if (!gesture.moved && Math.hypot(dx, dy) < 5) return;
      if (!gesture.moved) canvas.style.cursor = lookCursor;
      gesture.moved = true;
      look(dx, dy);
    }
    if (gesture.forearmGrip) gesture.forearmGrip.movePointer(x-gesture.x,y-gesture.y);
    gesture.x = x;
    gesture.y = y;
    if (gesture.side) rememberPointer(x,y);
    invalidate();
  }

  function pauseManipulation() {
    if (!isHold(gesture)) return;
    gesture.forearmGrip?.freeze();
    gesture.gate.pause();
  }
  // After a pause (a look, a zoom, the monitor) the held tool stays where it is: the pointer's current pixel
  // maps to the tool's place and the carry continues from there. Port steering re-bases itself (toolField).
  function anchorTool(x, y) {
    const current = gesture;
    rememberPointer(x, y);
    const line = rayAt(x, y);
    if (toolField(line, current.side, true)) { current.carry = 'field'; return; }
    const held = crew.drivePoint(current.side);
    const hit = line.intersectPlane(current.plane, new Vector3());
    if (held && hit) current.offset.set(held.x - hit.x, 0, held.z - hit.z);
  }

  // Resume a paused hold with the pointer at (x, y). The forearm drill counts its drag from here; a limb
  // plane is re-anchored at the limb's current place, and so is a held tool.
  function resume(x, y) {
    if (!isHold(gesture) || !gesture.gate.paused) return;
    gesture.gate.resume();
    if (gesture.forearmGrip) { gesture.x = x; gesture.y = y; }
    else if (gesture.kind === 'wrist' && gesture.attached) anchorLimbPlane(x, y);
    else if (gesture.kind === 'tool' && gesture.attached) anchorTool(x, y);
    if (gesture.leftView) {
      gesture.leftView = false;
      onEvent('holdResumed', gesture);
    }
  }

  function updateBeforeHands(dt) {
    const current = gesture;
    if (!current?.side) return;
    if (!current.attached) {
      // A free bedside touch ('surface') never holds: it lasts while the button is down and is no failure.
      const touching = current.kind === 'surface' && pointer?.id === current.id;
      if (!touching && performance.now() - current.started > holdTimeout) {
        release(true);
        // The target was in reach (begin() checked it) but the fingers never touched it: its own reason (B6),
        // sent after the release so the reason is what the trainee reads last.
        if (current.kind !== 'surface') onEvent('noContact', current);
        return;
      }
      if (current.forearm) crew.driveSurface(current.side,current.point,'forearm',Boolean(current.closing),current.normal);
      else if (current.stationGrip) crew.driveSurface(current.side,current.point,'limb');
      else if (isSkinAction(current.kind)) crew.driveSurface(current.side, current.point, profile(current.kind), false, current.normal);
      else crew.driveHand(current.side, current.point, false, current.rotation);
      return;
    }
    // A camera-look gesture freezes the held world-space contact. The same screen pixel
    // must not be reinterpreted as a new tool target after the camera rotates.
    if (current.forearmGrip) {
      if (!current.gate.paused) current.forearmGrip.update(dt);
      current.forearm.collision.refresh();
      const { point, normal, rotation } = current.forearmGrip.sample();
      crew.followForearm(current.side,current.contact ?? point,point,current.contactRotation,rotation);
      current.contact = point;
      current.contactRotation = rotation;
      crew.driveSurface(current.side,point,'forearm',true,normal);
      return;
    }
    if (current.gate?.paused) return;
    const line = rayAt(...pointerPosition());
    if (current.kind === 'tool') { carryTool(current, line); return; }
    if (current.kind === 'touch') {
      // Surface touch follows the actual skinned patient mesh, not a flat world plane.
      const hit = surfaceHit(ray);
      if (!hit || isPrivacySurfaceHit(hit)) return;
      const point = hit.point.clone();
      if (!workstation()?.surfaceAction(point, hit.object)) return;
      // hit.normal is the unskinned, object-space normal; the world normal comes from the face, as in pick().
      const normal = hit.face?.normal?.clone().transformDirection(hit.object.matrixWorld).normalize() ?? current.normal;
      current.point.copy(point);
      current.normal = normal?.clone() ?? null;
      if (!crew.driveSurface(current.side, point, 'flat', false, current.normal)) return;
      current.contact = point.clone();
      return;
    }
    const point = line.intersectPlane(current.plane, new Vector3());
    if (!point) return;
    point.add(current.offset);
    if (current.kind === 'abdomen') {
      abdomen.drag(point.x, point.z);
      const contact = abdomen.contact();
      // Keep the skin normal while pinching, so the hand keeps the approach orientation (no flip).
      if (contact) crew.driveSurface(current.side, contact, 'pinch', true, current.normal);
    } else if (current.kind === 'press') {
      const height = abdomen.height(point.x, point.z);
      if (!Number.isFinite(height)) return;
      point.y = height;
      if (!workstation()?.surfaceAction(point) || !crew.driveSurface(current.side, point, 'flat', false, current.normal)) return;
      abdomen.press(point);
      current.contact = point.clone();
    } else if (current.kind === 'wrist') {
      if (!crew.canReach(current.side, point)) return;
      const actual = current.limb.move(point.clone().add(current.wristOffset));
      if (actual) {
        current.contact = actual.sub(current.wristOffset);
        if (current.stationGrip) crew.driveSurface(current.side,current.contact,'limb',true);
        else {
          current.rotation = crew.contactRotation(current.side, current.contact, -0.06);
          crew.driveHand(current.side,current.contact,true,current.rotation);
        }
      }
    }
  }

  // The held tool. Port steering and the walk are toolField's; otherwise the tool is carried on a horizontal
  // plane under the pointer: around the tray (from the pick height up to toolHeight, the grip turning from the
  // tool's own rotation to the carry), or just above the skin around the work point at a work area.
  function carryTool(current, line) {
    const rebase = Boolean(current.rebase);
    current.rebase = false;
    if (toolField(line, current.side, rebase)) { current.carry = 'field'; return; }
    const space = toolSpace();
    const key = space?.key ?? 'tray';
    if (current.carry !== key) {
      // A new carry space (a work area, back near the tray, after the walk or the port): the tool goes to the
      // pointer, on that space's plane. The first carry after the pick keeps the pick plane and offset.
      if (current.carry !== undefined || space) {
        const height = space ? space.height(space.centre.x, space.centre.z) : NaN;
        const y = space ? (Number.isFinite(height) ? height : space.centre.y) + space.clearance : current.graspY;
        current.plane.setFromNormalAndCoplanarPoint(up, new Vector3(0, y, 0));
        current.offset.set(0, 0, 0);
      }
      current.carry = key;
    }
    const point = line.intersectPlane(current.plane, new Vector3());
    if (!point) return;
    point.add(current.offset);
    let rotation;
    if (space) {
      point.x = clamp(point.x, space.centre.x - space.reach, space.centre.x + space.reach);
      point.z = clamp(point.z, space.centre.z - space.reach, space.centre.z + space.reach);
      // Just above the skin under the palm and along the shaft.
      const shaft = crew.getToolTip().sub(crew.tool.position);
      let top = -Infinity;
      for (const along of [0, 0.5, 1]) {
        const sample = point.clone().addScaledVector(shaft, along);
        top = Math.max(top, space.height(sample.x, sample.z));
      }
      point.y = Number.isFinite(top) ? top + space.clearance : -current.plane.constant;
    } else {
      point.x = clamp(point.x, 0.27, 0.79);
      point.z = clamp(point.z, -0.50, 0.72);
      const k = smooth(clamp((performance.now() - (current.attachedAt ?? -Infinity)) / (current.easeMs ?? toolEaseMs), 0, 1));
      point.y = current.graspY + (toolHeight - current.graspY) * k;
      if (k < 1) rotation = current.rotation.clone().slerp(crew.carryRotation(), k);
    }
    crew.driveHand(current.side, point, true, rotation);
  }

  function updateAfterHands() {
    const current = gesture;
    if (!current?.side) return;
    if (isSkinAction(current.kind)) {
      if (!current.attached) {
        const pad = crew.surfaceContact(current.side, current.point, profile(current.kind));
        if (!pad || (current.kind !== 'touch' && !abdomen.start(current.point, current.kind === 'press'))) return;
        current.contact = pad.point;
        current.contactGap = pad.gap;
        current.attached = true;
        canvas.style.cursor = 'grabbing';
        onEvent('attached', current);
      } else if (current.kind === 'touch') {
        const pad = crew.surfaceContact(current.side, current.point, 'flat');
        if (pad) { current.contact = pad.point; current.contactGap = pad.gap; onEvent('motion', current); }
      }
      return;
    }
    if (current.forearm) {
      const point = current.contact ?? current.point;
      let pad = crew.surfaceContact(current.side,point,'forearm',.028);
      if (!current.attached) {
        // The sweep stops the whole hand when one fingertip probe meets the forearm capsule; it cannot
        // slide closer. A hand stopped this way grips when a flat pad is within stalledGap.
        const stops = current.forearm.collision.stops;
        if (stops > current.sweepStops) current.stoppedAt = performance.now();
        current.sweepStops = stops;
        if (!pad && performance.now() - (current.stoppedAt ?? -Infinity) < stalledMs) {
          pad = crew.surfaceContact(current.side, point, 'forearm', stalledGap);
        }
      }
      current.contactGap = pad?.gap ?? null;
      if (current.attached) {
        onEvent('motion',current);
        return;
      }
      if (!pad || current.forearm.collision.overlap > .003) return;
      if (!current.closing) {
        current.closing = performance.now();
        return;
      }
      if (performance.now() - current.closing < 130) return;
      const wrist = current.chain.joints[2];
      current.limb = startLimb(current.chain,2);
      current.forearmGrip = createForearmGrip({ wrist, point, normal:current.normal, camera, canvas,
        limb:current.limb, Vector3, Quaternion, floorY: current.forearm.rest?.initial.y });
      current.attached = true;
      current.contact = point;
      current.contactRotation = wrist.getWorldQuaternion(new Quaternion());
      canvas.style.cursor = 'grabbing';
      onEvent('attached',current);
      return;
    }
    const pad = !current.attached && current.stationGrip ? crew.surfaceContact(current.side,current.point,'limb',0.024) : null;
    // A tool is taken once the palm is at the handle and the glove matches the tool's own rotation.
    const reached = current.stationGrip ? Boolean(pad) : crew.getPalm(current.side).distanceTo(current.point) < 0.024
      && (current.kind !== 'tool' || crew.gripTurn(current.side, current.rotation) < toolGripTurn);
    if (!current.attached && current.kind !== 'surface' && reached) {
      current.contactGap = pad?.gap;
      if (current.kind === 'wrist') {
        const wrist = current.chain.joints[current.jointIndex ?? 2].getWorldPosition(new Vector3());
        current.wristOffset = wrist.clone().sub(current.point);
        current.limb = startLimb(current.chain,current.jointIndex ?? 2);
      }
      if (current.kind === 'tool') {
        current.attachedAt = performance.now();
        current.easeMs = Math.max(toolEaseMs, 1000 * 1.5 * current.rotation.angleTo(crew.carryRotation()) / toolEaseTurnRate);
        current.graspY = current.point.y;
        // A tool docked in the port is steered on from its current angles (no swing to the pointer).
        current.rebase = true;
      }
      current.attached = true;
      canvas.style.cursor = 'grabbing';
      onEvent('attached', current);
    } else if (current.attached) onEvent('motion', current);
  }

  canvas.addEventListener('pointerdown', (ev) => {
    if (viewportInputPaused() || pointer || !ev.isPrimary) return;
    // Right mouse drag and look mode only need the view to be free; hand actions need more.
    const wantsLook = (ev.button === 2 && ev.pointerType === 'mouse') || lookModeEnabled();
    // While the hands cannot act yet (a walk, a turn toward the work point, a pose change) a left press
    // still looks when dragged, and a still click says why nothing happened.
    const busy = !wantsLook && ev.button === 0 && !isEnabled() && lookEnabled();
    if (!busy && !(wantsLook ? lookEnabled() : isEnabled())) return;
    canvas.focus({ preventScroll: true });
    // Right mouse drag is a dedicated look control. It never changes a held grip.
    if (wantsLook || busy) {
      pauseManipulation();
      pointer = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, moved: false, look: true, busy };
      canvas.setPointerCapture(ev.pointerId);
      canvas.style.cursor = lookCursor;
      ev.preventDefault();
      return;
    }
    if (ev.button !== 0) return;
    if (gesture?.forearmGrip && ev.pointerType !== 'mouse') {
      gesture.x = ev.clientX;
      gesture.y = ev.clientY;
    }
    // A press resumes a paused hold (also after the pointer left the view); a still click then lets go.
    if (isHold(gesture)) resume(ev.clientX, ev.clientY);
    // Focus-pick mode selects a world-space surface point without moving a hand.
    if (focusPickEnabled()) {
      rayAt(ev.clientX, ev.clientY);
      const hit = surfaceHit(ray);
      if (hit && !isPrivacySurfaceHit(hit)) onFocusPoint(hit.point.clone(), hit.object);
      ev.preventDefault();
      return;
    }
    pointer = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, moved: false, existing: isHold(gesture) };
    if (!gesture) begin(ev.clientX, ev.clientY, ev.pointerId, ev.pointerType);
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!ev.isPrimary || viewportInputPaused()) return;
    if (pointer?.id === ev.pointerId && pointer.look) {
      const dx = ev.clientX - pointer.x, dy = ev.clientY - pointer.y;
      if (Math.hypot(dx, dy) > 0) { pointer.moved = true; look(dx, dy); invalidate(); }
      pointer.x = ev.clientX; pointer.y = ev.clientY;
      return;
    }
    if (pointer?.id === ev.pointerId) {
      if (Math.hypot(ev.clientX - pointer.x, ev.clientY - pointer.y) > 6) pointer.moved = true;
      if (!pointer.existing || pointer.moved) move(ev.clientX,ev.clientY);
    } else if (!pointer && isHold(gesture) && ev.pointerType === 'mouse') {
      // After the pointer left the view, moving back over it does not drag the held limb.
      if (gesture.leftView) return;
      resume(ev.clientX, ev.clientY);
      move(ev.clientX,ev.clientY);
    } else if (isEnabled() && !gesture && ev.pointerType === 'mouse') {
      hover = { x: ev.clientX, y: ev.clientY };
      // The pick is a full-skin raycast: at most once per frame, and only after a real move.
      if (!hoverFrame) hoverFrame = requestAnimationFrame(hoverPick);
    }
  });
  function hoverPick() {
    hoverFrame = 0;
    if (!hover || gesture || pointer || !isEnabled()) return;
    if (hoverPicked && Math.hypot(hover.x - hoverPicked.x, hover.y - hoverPicked.y) < hoverMove) return;
    hoverPicked = { ...hover };
    const target = pickOnce(hover.x,hover.y,0.042);
    // Separate cursors: empty space looks, an unreachable target refuses, a reachable one grabs.
    canvas.style.cursor = !target ? lookCursor : !crew.canReach(getSide(),target.point) ? 'not-allowed'
      : target.kind === 'surface' ? 'crosshair' : 'grab';
  }
  canvas.addEventListener('pointerup', (ev) => {
    if (pointer?.id !== ev.pointerId) return;
    if (pointer.look) {
      const stillBusyClick = pointer.busy && !pointer.moved;
      finishPointer();
      if (stillBusyClick) onEvent('busy');
      return;
    }
    const finishHold = pointer.existing && !pointer.moved;
    finishPointer();
    if (finishHold || !isHold(gesture)) release();
  });
  for (const event of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(event, (ev) => {
      if (pointer?.id !== ev.pointerId) return;
      const wasLook = pointer.look;
      finishPointer();
      if (!wasLook && (!isHold(gesture) || !gesture.attached)) release(true);
    });
  }
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  window.addEventListener('contextmenu', (ev) => {
    if (pointer?.look || performance.now() < blockMenuUntil) ev.preventDefault();
  }, true);
  canvas.addEventListener('pointerleave', (ev) => {
    if (!gesture) { hover = null; hoverPicked = null; canvas.style.cursor = ''; return; }
    // A held limb stays where it is while the mouse is outside the 3D view (for example on the way to
    // «اطلب مساندة المشرف»); only a press on the view resumes moving it.
    if (ev.pointerType === 'mouse' && !pointer && gesture.kind === 'wrist' && gesture.attached && !gesture.leftView) {
      pauseManipulation();
      gesture.leftView = true;
      onEvent('holdPaused', gesture);
    }
  });
  window.addEventListener('blur', () => {
    finishPointer();
    if (!isHold(gesture) || !gesture.attached) release(true);
    else if (gesture.forearmGrip) pauseManipulation();
    hover = null;
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    finishPointer();
    if (!isHold(gesture) || !gesture.attached) release(true);
    else if (gesture.forearmGrip) pauseManipulation();
  });

  return {
    updateBeforeHands, updateAfterHands,
    keyboardGrip(fallback) {
      if (isHold(gesture)) { release(); return; }
      if (gesture) return;
      if (!isEnabled()) { if (lookEnabled()) onEvent('busy'); return; }
      const box = canvas.getBoundingClientRect();
      const point = fallback ?? hover ?? { x: box.left + box.width * 0.5, y: box.top + box.height * 0.59 };
      begin(point.x, point.y, 'keyboard');
      if (gesture?.kind === 'blocked') onEvent('outOfReach', gesture.target);
      if (gesture?.kind === 'look' || gesture?.kind === 'blocked') release(true);
    },
    nudge(dx, dy) {
      if (!isHold(gesture) || viewportInputPaused()) return false;
      const [x,y] = pointerPosition();
      resume(x, y);
      move(x+dx,y+dy);
      return true;
    },
    cancel() { release(true); },
    release() { if (isHold(gesture)) release(); },
    pauseManipulation,
    get manipulationPaused() { return Boolean(gesture?.gate?.paused); },
    get holder() { return gesture?.side ?? null; },
    get active() { return Boolean(gesture?.side); },
    get held() { return gesture?.attached ? gesture.kind : null; },
    get contact() { return gesture?.attached ? gesture.contact ?? gesture.point : null; },
    get contactGap() { return gesture?.contactGap ?? null; },
    get forearmState() { return !gesture?.forearm ? 'idle' : gesture.attached ? 'gripped' : gesture.closing ? 'closing' : 'approaching'; },
    get toolPlaneY() { return gesture?.kind === 'tool' ? -gesture.plane.constant : null; },
  };
}
