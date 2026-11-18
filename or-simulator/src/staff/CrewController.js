import { getInstrumentConfig } from '../instruments/InstrumentConfig.js';
export async function loadCrew({ T, scene, camera, loadAsset, segment, put, mobile }) {
  const { Vector3, Quaternion, Matrix4, Group, MeshStandardMaterial, CylinderGeometry } = T;
  const v = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);
  const q = () => new Quaternion();
  const up = v(0, 1, 0);
  const [leftAsset, rightAsset, staffAsset] = await Promise.all([
    loadAsset('glove-left'), loadAsset('glove-right'), loadAsset('supervisor'),
  ]);

  function getBone(model, name) {
    const normalized = name.replace(/[.]/g, '');
    let bone = null;
    model.traverse((obj) => {
      if (obj.isBone && (obj.userData.name === name || obj.name === normalized || obj.name === name)) bone ??= obj;
    });
    if (!bone) throw new Error(`Missing crew bone ${name}`);
    return bone;
  }

  function buildHand(asset, side) {
    const letter = side === -1 ? 'L' : 'R';
    const root = new Group();
    root.name = side === -1 ? 'Trainee anatomical left hand' : 'Trainee anatomical right hand';
    scene.add(root);
    root.add(asset);
    root.updateMatrixWorld(true);
    const wrist = getBone(asset, `wrist.${letter}`);
    const finger = (digit, joint) => getBone(asset, `finger${digit}-${joint}.${letter}`);
    const pivot = wrist.getWorldPosition(v());
    const tip = finger(3, 3).getWorldPosition(v());
    const forward = tip.clone().sub(pivot).normalize();
    const right = finger(2, 1).getWorldPosition(v()).sub(finger(5, 1).getWorldPosition(v()))
      .projectOnPlane(forward).normalize().multiplyScalar(-side);
    const backward = forward.clone().negate();
    const dorsal = backward.clone().cross(right).normalize();
    const inverse = q().setFromRotationMatrix(new Matrix4().makeBasis(right, dorsal, backward)).invert();
    const digits = [];
    for (let digit = 1; digit <= 5; digit++) for (let joint = 1; joint <= 3; joint++) {
      const bone = finger(digit, joint);
      const bend = digit === 1 ? [0.19, 0.30, 0.35] : [0.54, 0.76, 0.59];
      digits.push({ digit, bone, rest: bone.quaternion.clone(), angle: bend[joint - 1] });
    }
    const surfaces = [];
    asset.traverse((object) => {
      if (object.isSkinnedMesh) {
        surfaces.push(object);
        object.frustumCulled = false;
        object.castShadow = false;
        object.receiveShadow = true;
      }
    });
    const pads = { pinch: [], flat: [] };
    for (const mesh of surfaces) {
      const indices = mesh.geometry.attributes.skinIndex;
      const weights = mesh.geometry.attributes.skinWeight;
      if (!indices || !weights) continue;
      const pinchBones = [finger(1,3), finger(2,3)].map((bone) => mesh.skeleton.bones.indexOf(bone));
      const flatBones = [2,3,4,5].map((digit) => mesh.skeleton.bones.indexOf(finger(digit,3)));
      for (let i = 0; i < indices.count; i += 2) {
        for (let j = 0; j < 4; j++) {
          if (weights.getComponent(i,j) < 0.28) continue;
          const bone = indices.getComponent(i,j);
          if (pinchBones.includes(bone)) pads.pinch.push({mesh,index:i});
          if (flatBones.includes(bone)) pads.flat.push({mesh,index:i});
        }
      }
    }
    const sleeveMesh = surfaces.find((mesh) => mesh.material.name === 'Scrub sleeve') ?? surfaces.at(-1);
    const sleevePositions = sleeveMesh.geometry.attributes.position;
    const edge = [];
    for (let i = 0; i < sleevePositions.count; i++) {
      if (sleevePositions.getX(i) * -side < 0.405) edge.push(i);
    }
    const sleeve = put(scene, new CylinderGeometry(0.036, 0.057, 1, 18), sleeveMesh.material, [0, 0, 0], false);
    sleeve.visible = false;
    return {
      root, side, pivot, inverse, digits, surfaces, sleeveMesh, edge, sleeve, pads,
      tips: { pinch: [finger(1,3), finger(2,3)], flat: [finger(2,3), finger(3,3), finger(4,3), finger(5,3)] },
      contactProbes: [finger(3,1), ...[1,2,3,4,5].map((digit) => finger(digit,3))],
      forearmContact: null,
      curl: 0,
      wristPoint: v(), wristRotation: q(), drive: null,
      local: null, posed: false, settled: false,
    };
  }

  const hands = { left: buildHand(leftAsset, -1), right: buildHand(rightAsset, 1) };
  const supervisor = new Group();
  supervisor.name = 'Rigged supervising clinician';
  supervisor.position.set(-0.79, 0, 0.06);
  supervisor.rotation.order = 'YXZ';
  supervisor.rotation.y = Math.PI / 2;
  supervisor.add(staffAsset);
  scene.add(supervisor);

  function armRig(letter, sign) {
    const names = ['upperarm01', 'lowerarm01', 'wrist'];
    const bones = names.map((name) => getBone(staffAsset, `${name}.${letter}`));
    const pose = bones.map((bone) => bone.quaternion.clone());
    const joints = bones.map((bone) => supervisor.worldToLocal(bone.getWorldPosition(v())));
    const directions = [joints[1].clone().sub(joints[0]).normalize(), joints[2].clone().sub(joints[1]).normalize()];
    const baseRotation = supervisor.getWorldQuaternion(q()).invert();
    const rotations = bones.map((bone) => baseRotation.clone().multiply(bone.getWorldQuaternion(q())));
    return { bones, pose, directions, rotations, sign };
  }

  supervisor.updateMatrixWorld(true);
  const staffArms = { left: armRig('L', 1), right: armRig('R', -1) };
  staffAsset.traverse((object) => {
    if (object.isSkinnedMesh) {
      object.frustumCulled = false;
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  function orientArm(arm, amount, extendsTool) {
    const swingAmount = extendsTool ? amount : amount * 0.08;
    const targets = [
      v(arm.sign * 0.14, -0.98, 0.09).lerp(v(arm.sign * 0.05, -0.32, 0.94), swingAmount).normalize(),
      v(arm.sign * 0.045, -0.83, 0.33).lerp(v(-arm.sign * 0.15, -0.06, 0.98), swingAmount).normalize(),
    ];
    const orientation = supervisor.getWorldQuaternion(q());
    let arc;
    for (let i = 0; i < 2; i++) {
      const bone = arm.bones[i];
      const from = i === 0 ? arm.directions[i] : arm.directions[i].clone().applyQuaternion(arc);
      const turn = q().setFromUnitVectors(from, targets[i]);
      arc = i === 0 ? turn : turn.multiply(arc);
      const desired = orientation.clone().multiply(arc).multiply(arm.rotations[i]);
      bone.quaternion.copy(bone.parent.getWorldQuaternion(q()).invert().multiply(desired)).normalize();
      bone.updateWorldMatrix(false, true);
    }
    arm.bones[2].quaternion.copy(arm.pose[2]);
  }

  const staffWrist = staffArms.right.bones[2];
  const staffPad = getBone(staffAsset,'finger3-1.R');
  let support = null;
  let supportBlend = 0;
  let supportGap = null;

  function reachSupport(goal) {
    const [upper,lower,wrist] = staffArms.right.bones;
    const start = upper.getWorldPosition(v());
    const middle = lower.getWorldPosition(v());
    const end = wrist.getWorldPosition(v());
    const offset = staffPad.getWorldPosition(v()).sub(end);
    const axis = goal.clone().sub(offset).sub(start);
    const first = start.distanceTo(middle);
    const second = middle.distanceTo(end);
    const distance = Math.max(Math.abs(first-second)+.001,Math.min(first+second-.001,axis.length()));
    axis.normalize();
    const axial = (first*first + distance*distance - second*second)/(2*distance);
    const bend = v(0,-1,-.18).projectOnPlane(axis).normalize();
    const elbow = start.clone().addScaledVector(axis,axial)
      .addScaledVector(bend,Math.sqrt(Math.max(0,first*first-axial*axial)));
    const target = start.clone().addScaledVector(axis,distance);
    for (const [bone,child,position] of [[upper,lower,elbow],[lower,wrist,target]]) {
      const base = bone.getWorldPosition(v());
      const before = child.getWorldPosition(v()).sub(base).normalize();
      const after = position.clone().sub(base).normalize();
      const world = q().setFromUnitVectors(before,after).multiply(bone.getWorldQuaternion(q()));
      bone.quaternion.copy(bone.parent.getWorldQuaternion(q()).invert().multiply(world)).normalize();
      bone.updateWorldMatrix(false,true);
    }
    // Keep the calibrated pad offset through the IK rotations.
    const armRotation = wrist.getWorldQuaternion(q());
    const nextOffset = staffPad.getWorldPosition(v()).sub(wrist.getWorldPosition(v()));
    if (nextOffset.lengthSq() > 1e-5) {
      const world = q().setFromUnitVectors(nextOffset.normalize(),offset.normalize()).multiply(armRotation);
      wrist.quaternion.copy(wrist.parent.getWorldQuaternion(q()).invert().multiply(world)).normalize();
      wrist.updateWorldMatrix(false,true);
    }
  }
  const staffGrip = ['L', 'R'].flatMap((letter) => {
    const result = [];
    for (let digit = 1; digit <= 5; digit++) for (let joint = 1; joint <= 3; joint++) {
      const bone = getBone(staffAsset, `finger${digit}-${joint}.${letter}`);
      result.push({ bone, rest: bone.quaternion.clone(), angle: digit === 1 ? 0.15 : 0.41, active: letter === 'R' });
    }
    return result;
  });

  const tool = new Group();
  tool.name = 'Training instrument';
  scene.add(tool);
  const steel = new MeshStandardMaterial({ color: 0xc1cdd0, roughness: 0.3, metalness: 0.67 });
  const dark = new MeshStandardMaterial({ color: 0x2c4d5a, roughness: 0.64 });
  const grasper = new Group();
  const scissors = new Group();
  const needleHolder = new Group();
  const scope = new Group();
  const instruments = {
    grasper: { model: grasper, config: getInstrumentConfig('grasper') },
    scissors: { model: scissors, config: getInstrumentConfig('scissors') },
    needleHolder: { model: needleHolder, config: getInstrumentConfig('needleHolder') },
    scope: { model: scope, config: getInstrumentConfig('scope') },
  };
  tool.add(grasper, scissors, needleHolder, scope);
  segment(scope, [0,0,0.018], [0,0,-0.269], 0.006, steel);
  segment(scope, [0,0,0.045], [0,0,0.005], 0.015, dark);
  segment(scope, [0,0.001,0.038], [0.023,0.027,0.047], 0.006, dark);
  const lens = new MeshStandardMaterial({color:0x398991, metalness:0.36, roughness:0.18});
  segment(scope, [0,0,-0.266], [0,0,-0.272], 0.005, lens);
  segment(grasper, [0, 0, 0.004], [0, 0, -0.215], 0.003, steel);
  for (const side of [-1, 1]) {
    segment(grasper, [side * 0.007, 0, 0.001], [side * 0.028, 0, 0.032], 0.005, dark);
    segment(grasper, [side * 0.028, 0, 0.032], [side * 0.021, 0, 0.055], 0.005, dark);
    segment(grasper, [side * 0.001, 0, -0.213], [side * 0.004, 0, -0.231], 0.0018, steel);
  }
  const handle = put(grasper, new CylinderGeometry(0.008, 0.009, 0.025, 14), dark, [0, 0, 0.006], false);
  handle.rotation.x = Math.PI / 2;

  function ringInstrument(model, length, needleGrip) {
    const pivot = -0.046;
    for (const side of [-1, 1]) {
      const center = side * (needleGrip ? 0.016 : 0.021);
      for (let j = 0; j < 12; j++) {
        const start = j * Math.PI / 6;
        const end = (j + 1) * Math.PI / 6;
        const point = (angle) => [center + Math.cos(angle) * 0.011, 0, 0.013 + Math.sin(angle) * 0.014];
        segment(model, point(start), point(end), 0.0022, steel);
      }
      segment(model, [center, 0, -0.001], [0, side * 0.0015, pivot], 0.0027, steel);
      const mid = (pivot - length) / 2;
      segment(model, [0, side * 0.0015, pivot], [side * (needleGrip ? 0.004 : 0.008), 0, mid], needleGrip ? 0.0031 : 0.0028, steel);
      segment(model, [side * (needleGrip ? 0.004 : 0.008), 0, mid], [side * 0.002, 0, -length], needleGrip ? 0.0023 : 0.0013, steel);
    }
  }

  ringInstrument(scissors, instruments.scissors.config.length, false);
  ringInstrument(needleHolder, instruments.needleHolder.config.length, true);
  let toolType = 'grasper';
  let activeToolConfig = instruments.grasper.config;
  let toolLength = activeToolConfig.length;
  let toolGrip = v(...activeToolConfig.gripOffset);
  const wristToTool = q().setFromAxisAngle(v(...activeToolConfig.attachmentAxis), activeToolConfig.attachmentAngle);

  function selectTool(key) {
    const config = getInstrumentConfig(key);
    toolType = key;
    activeToolConfig = config;
    toolLength = config.length;
    toolGrip.set(...config.gripOffset);
    wristToTool.setFromAxisAngle(v(...config.attachmentAxis), config.attachmentAngle);
    for (const [name, item] of Object.entries(instruments)) item.model.visible = name === key;
  }
  selectTool('grasper');
  tool.visible = false;
  // The instrument configs give the carry grip for the trainee's default stance (on the patient's left, +X,
  // facing −X: camera yaw 90°). The carry turns with the trainee's heading (the camera yaw), so a carried
  // instrument points ahead of the trainee on either side of the bed and after a look.
  const carryReferenceYaw = Math.PI / 2;
  function cameraYaw() {
    const right = v(1, 0, 0).transformDirection(camera.matrixWorld);
    return Math.atan2(-right.z, right.x);
  }
  function carryRotation() {
    return q().setFromAxisAngle(up, cameraYaw() - carryReferenceYaw).multiply(wristToTool);
  }
  tool.traverse((item) => { if (item.isMesh) item.castShadow = false; });

  let mode = 'idle';
  let offer = 0;
  let toolSide = 'right';
  const trayPose = { position: v(0.50, 1.13, 0.49), rotation: q() };
  function parkTool() {
    setMode('tray');
    tool.position.copy(trayPose.position);
    tool.quaternion.copy(trayPose.rotation);
    tool.updateMatrixWorld(true);
  }
  function holdTool(side) { toolSide = side; setMode('held'); }
  function aimInstrument(side, tip, direction, roll = 0, referenceAcross) {
    const backward = direction.clone().negate().normalize();
    const across = (referenceAcross?.clone() ?? v(1,0,0).transformDirection(camera.matrixWorld))
      .projectOnPlane(backward).normalize();
    if (across.lengthSq() < 1e-6) across.set(0,0,1).projectOnPlane(backward).normalize();
    const dorsal = backward.clone().cross(across).normalize();
    const rotation = q().setFromRotationMatrix(new Matrix4().makeBasis(across,dorsal,backward));
    if (roll) rotation.multiply(q().setFromAxisAngle(v(0,0,1), roll));
    const palm = tip.clone().addScaledVector(backward,toolLength);
    return driveHand(side,palm,true,rotation);
  }
  function getPalm(side) {
    const hand = hands[side];
    return toolGrip.clone().applyQuaternion(hand.wristRotation).add(hand.wristPoint);
  }
  function canReach(side, point) {
    return point.y >= 0.72 && shoulder(hands[side]).distanceTo(point) <= 0.87;
  }
  // body: the hand is carried with the trainee (walking): it eases in camera space, like an idle hand, so the
  // walk itself never leaves it trailing behind.
  function driveHand(side, point, closed = false, rotation = carryRotation(), { body = false } = {}) {
    if (!canReach(side, point)) return false;
    hands[side].drive = { point: point.clone(), rotation: rotation.clone(), closed, body };
    return true;
  }
  function clearDrive(side) {
    hands[side].drive = null;
  }
  let visible = true;
  let surfaceHeight = null;
  const sample = v();
  function contactRotation(side, point, pitch, normal = null) {
    const direction = point.clone().sub(shoulder(hands[side])).normalize();
    if (normal && normal.lengthSq() > 1e-5) {
      const dorsal = normal.clone().normalize();
      // The glove's local +Z is 'backward' (fingertip to wrist, buildHand), so the fingers point
      // from the shoulder to the touched point and the back of the hand faces along the normal.
      const backward = direction.clone().negate();
      let across = dorsal.clone().cross(backward).normalize();
      if (across.lengthSq() < 1e-5) across = v(1,0,0).projectOnPlane(backward).normalize();
      const correctedDorsal = backward.clone().cross(across).normalize();
      return q().setFromRotationMatrix(new Matrix4().makeBasis(across, correctedDorsal, backward));
    }
    const yaw = Math.atan2(-direction.x, -direction.z);
    return q().setFromAxisAngle(up, yaw).multiply(q().setFromAxisAngle(v(1,0,0), pitch));
  }
  function contactAnchor(hand, surface) {
    const result = v();
    if (surface === 'pinch' || surface === 'flat') {
      // Skin contact: aim the same pad vertices that surfaceContact measures, not the bone origins
      // (joint centres), so the attach test and the drive target agree.
      const pads = hand.pads[surface];
      for (const {mesh,index} of pads) result.add(mesh.getVertexPosition(index,sample).applyMatrix4(mesh.matrixWorld));
      return result.divideScalar(pads.length);
    }
    const profile = ['limb','forearm'].includes(surface) ? 'flat' : surface;
    for (const tip of hand.tips[profile]) result.add(tip.getWorldPosition(sample));
    return result.divideScalar(hand.tips[profile].length);
  }
  function surfaceContact(side, point, profile, maxGap = 0.018) {
    const hand = hands[side];
    if (profile === 'pinch') {
      // A pinch takes the skin between thumb and index, so the clicked point lies between their pads,
      // not under one of them. The drive aims the centre of their pad vertices at the point
      // (contactAnchor); the gap is how far that centre is from the point along the skin, combined
      // with how high the lowest of those pads is above the skin's tangent plane at the point.
      const normal = hand.drive?.normal ?? up;
      const centre = contactAnchor(hand, 'pinch');
      const offset = centre.clone().sub(point);
      const along = offset.clone().addScaledVector(normal, -offset.dot(normal)).length();
      let lowest = Infinity;
      for (const {mesh,index} of hand.pads.pinch) {
        mesh.getVertexPosition(index,sample).applyMatrix4(mesh.matrixWorld);
        lowest = Math.min(lowest, sample.sub(point).dot(normal));
      }
      const gap = Math.hypot(along, Math.max(0, lowest));
      return gap <= maxGap ? { point: centre, gap } : null;
    }
    let best = null, distance = Infinity;
    // True 3D proximity: this works on the chest, limbs and side surfaces, not only a height field.
    for (const {mesh,index} of hand.pads[['limb','forearm'].includes(profile) ? 'flat' : profile]) {
      mesh.getVertexPosition(index,sample).applyMatrix4(mesh.matrixWorld);
      const gap = sample.distanceTo(point);
      if (gap < distance) { best = sample.clone(); distance = gap; }
    }
    return best && distance <= maxGap ? { point: best, gap: distance } : null;
  }
  function driveSurface(side, point, profile, closed = false, normal = null) {
    if (!canReach(side, point)) return false;
    let rotation;
    if (profile === 'forearm') {
      const backward = shoulder(hands[side]).sub(point).projectOnPlane(normal).normalize();
      const across = normal.clone().cross(backward).normalize();
      rotation = q().setFromRotationMatrix(new Matrix4().makeBasis(across,normal,backward));
    } else rotation = contactRotation(side, point, profile === 'pinch' ? -0.31 : -0.06, normal);
    hands[side].drive = { point: point.clone(), rotation, closed, surface: profile, normal: normal?.clone() ?? null };
    return true;
  }

  function maxPenetration(hand, height, stride) {
    let depth = 0;
    for (const mesh of hand.surfaces) {
      for (let i = 0; i < mesh.geometry.attributes.position.count; i += stride) {
        mesh.getVertexPosition(i, sample).applyMatrix4(mesh.matrixWorld);
        depth = Math.max(depth, height(sample.x, sample.z) - sample.y);
      }
    }
    return depth;
  }
  // Deepest glove vertex behind the plane through point with this normal, among vertices within
  // radius of point along the plane (-Infinity when none is near).
  function planeDepth(hand, point, normal, radius, stride) {
    let depth = -Infinity;
    for (const mesh of hand.surfaces) {
      for (let i = 0; i < mesh.geometry.attributes.position.count; i += stride) {
        mesh.getVertexPosition(i, sample).applyMatrix4(mesh.matrixWorld).sub(point);
        const along = sample.dot(normal);
        if (sample.addScaledVector(normal, -along).lengthSq() <= radius * radius) depth = Math.max(depth, -along);
      }
    }
    return depth;
  }
  const gripDirection = v(0.93, -0.06, -0.17).normalize();
  function offeringPoint() {
    return staffWrist.getWorldPosition(v()).add(v(0.070, 0.012, -0.017));
  }

  function setMode(next) {
    mode = next;
    if (next === 'idle' || next === 'tray') {
      tool.visible = next === 'tray';
      for (const side of Object.keys(hands)) clearDrive(side);
    }
  }

  function shoulder(hand) {
    const right = v(1, 0, 0).transformDirection(camera.matrixWorld);
    right.y = 0;
    return camera.position.clone().addScaledVector(right.normalize(), hand.side * 0.17).add(v(0.02, -0.225, 0));
  }

  // Human speed limits for the trainee's hands (placeholders until the P3 arm and reach profile):
  // the wrist travels at most about 1.2 m/s and turns at most about 280°/s, including any lift out of
  // the skin. Below the caps the hand keeps its exponential easing. A long frame (hitch) does not turn
  // into a jump: the caps scale with at most one 48 Hz frame.
  const handSpeed = 1.2;
  const handTurnRate = 280 * Math.PI / 180;
  const longestStep = 1 / 48;
  // Limb grips (work-area wrist, elbow, knee and ankle): the last finger joints aim this far above the
  // skin-top point, so the closed fingers rest on the limb (pad gap about 1 mm). Limb grips have no
  // height-field lift (at the ankle the field is the raised foot); without the lift, aiming 2.4 cm below
  // the point put the fingers up to 2.5 cm (wrist) and 5.4 cm (ankle) inside the limb.
  const limbGripOffset = 0.030;
  function cameraRotation() { return q().setFromRotationMatrix(camera.matrixWorld); }
  // Rest pose of an idle hand in camera space: in front of and below the eyes, fingers forward.
  function restPose(hand) {
    const width = mobile() ? 0.131 : 0.175;
    const point = v(hand.side * width, -0.207, -0.51);
    const end = v(hand.side * width * 0.78, -0.179, -0.69);
    const backward = point.clone().sub(end).normalize();
    const across = v(1, 0, 0).projectOnPlane(backward).normalize();
    const dorsal = backward.clone().cross(across).normalize();
    return { point, rotation: q().setFromRotationMatrix(new Matrix4().makeBasis(across, dorsal, backward)) };
  }
  function poseHand(hand) {
    hand.root.quaternion.copy(hand.wristRotation).multiply(hand.inverse);
    hand.root.position.copy(hand.wristPoint).sub(hand.pivot.clone().applyQuaternion(hand.root.quaternion));
    hand.root.updateMatrixWorld(true);
  }
  // An idle hand keeps its eased state in camera space, so it moves with the head exactly.
  function placeIdleHand(hand) {
    hand.wristPoint.copy(hand.local.point).applyMatrix4(camera.matrixWorld);
    hand.wristRotation.copy(cameraRotation()).multiply(hand.local.rotation);
    poseHand(hand);
  }
  const isIdle = (hand) => !hand.drive && !hand.forearmContact;
  // Idle hands and hands carried with the body keep their eased state in camera space.
  const inCameraSpace = (hand) => isIdle(hand) || Boolean(hand.drive?.body);
  // The camera when the hands were last posed. A hand that starts moving with the body keeps its pose
  // relative to the trainee as last shown, even when the camera already moved this frame (the first step
  // of a walk), so it is not left behind.
  let shownView = null;
  function localPose(hand) {
    const view = shownView ?? camera.matrixWorld;
    return { point: hand.wristPoint.clone().applyMatrix4(view.clone().invert()),
      rotation: q().setFromRotationMatrix(view).invert().multiply(hand.wristRotation) };
  }

  // Keep the hand out of the skin: on upward skin the height-field lift, on side-facing skin a push
  // along the contact normal. Returns the displacement applied (null when none was needed).
  function correctSurface(hand, drive) {
    if (drive?.surface === 'flat' && drive.normal && drive.normal.y <= 0.62) {
      // Side-facing skin has no height-field lift: push the hand out along the contact normal until no
      // glove vertex near the touched point is behind the skin's tangent plane (+4 mm). A stopgap until
      // the P5 contact service; the fingertips extend past the pad centre and would poke in otherwise.
      const push = planeDepth(hand, drive.point, drive.normal, 0.04, 2) + 0.004;
      return push > 0 ? drive.normal.clone().multiplyScalar(push) : null;
    }
    if (surfaceHeight && drive?.surface !== 'limb' && (!drive?.normal || drive.normal.y > 0.62)) {
      // The height-field correction: the anterior abdominal patch, idle hands and carried tools. Limb
      // grips skip it: at the ankle the field is the raised foot, which held the glove above its own target.
      const clearance = (x, z) => surfaceHeight(x, z) + 0.005;
      const lift = maxPenetration(hand, clearance, 4);
      return lift > 0 ? v(0, lift, 0) : null;
    }
    return null;
  }

  function updateHand(hand, dt, reduced) {
    const rest = restPose(hand);
    const drive = hand.drive;
    const collision = hand.forearmContact;
    const bodyFrame = inCameraSpace(hand);
    if (bodyFrame) {
      // An idle hand eases in camera space toward its rest pose (a hand carried with the body toward its
      // drive). The first pose ever starts at rest; a hand that was just released starts from where it is.
      if (!hand.local) {
        hand.local = hand.posed ? localPose(hand) : { point: rest.point.clone(), rotation: rest.rotation.clone() };
      }
      placeIdleHand(hand);
    } else hand.local = null;
    let target = rest.point.clone().applyMatrix4(camera.matrixWorld);
    let desired = cameraRotation().multiply(rest.rotation);
    const probes = () => hand.contactProbes.map((bone) => bone.getWorldPosition(v()));
    const previous = collision ? probes() : null;
    const previousWrist = collision ? hand.wristPoint.clone() : null;
    const previousRotation = collision ? hand.wristRotation.clone() : null;
    const previousCurl = hand.curl;
    const startPoint = hand.wristPoint.clone(), startRotation = hand.wristRotation.clone();
    const instant = reduced && !collision;
    const alpha = instant ? 1 : 1 - Math.exp(-dt * (drive?.closed && collision ? 38 : 15));
    // Reduced motion snaps (no easing, no speed cap), as before.
    const limit = instant ? Infinity : handSpeed * Math.min(dt, longestStep);
    const turnLimit = instant ? Infinity : handTurnRate * Math.min(dt, longestStep);
    const carrying = (mode === 'held' || mode === 'returning') && hand === hands[toolSide];
    const curlTarget = drive?.surface === 'pinch' ? (drive.closed ? 0.86 : 0.28)
      : drive?.surface === 'forearm' ? (drive.closed ? 0.58 : 0.08)
      : drive?.surface === 'limb' ? (drive.closed ? 0.80 : 0.13)
      : drive?.surface === 'flat' ? 0.045 : (carrying || drive?.closed) ? 0.90 : 0.12;
    hand.curl += (curlTarget - hand.curl) * alpha;
    function poseFingers() {
      for (const digit of hand.digits) {
        const bend = drive?.surface === 'pinch' && digit.digit >= 3 ? Math.max(hand.curl, 0.57) : hand.curl;
        digit.bone.quaternion.copy(digit.rest).multiply(q().setFromAxisAngle(v(1, 0, 0), digit.angle * bend));
      }
    }
    poseFingers();
    if (drive) desired = drive.rotation;
    const turn = Math.min(startRotation.angleTo(desired) * alpha, turnLimit);
    hand.wristRotation.copy(startRotation).rotateTowards(desired, turn);
    if (drive?.surface) {
      poseHand(hand);
      const anchorOffset = contactAnchor(hand, drive.surface).sub(hand.wristPoint);
      target = drive.point.clone().sub(anchorOffset);
      // Only upward skin has the height-field lift; on side-facing skin (flank, limbs seen from the
      // side) 'flat' stops just outside the surface instead of being pushed into it.
      const sideFacing = drive.normal && drive.normal.y <= 0.62;
      const offset = drive.surface === 'forearm' ? -.002 : drive.surface === 'pinch' ? -.008
        : drive.surface === 'limb' ? limbGripOffset
        : sideFacing && drive.surface === 'flat' ? .004 : -.024;
      target.addScaledVector(drive.normal ?? up, offset);
    }
    let gripStep = null;
    if (drive && !drive.surface) {
      // A held instrument (and the free wrist grab) is driven at its grip: the palm eases toward the drive
      // point and the wrist hangs from it with this frame's rotation, so turning the hand turns it about
      // what it holds (the instrument does not slide while the hand turns, for example after a look).
      const palm = toolGrip.clone().applyQuaternion(startRotation).add(startPoint);
      const step = drive.point.clone().sub(palm).multiplyScalar(alpha);
      if (step.lengthSq() > limit * limit) step.setLength(limit);
      gripStep = palm.add(step).sub(toolGrip.clone().applyQuaternion(hand.wristRotation));
      target = drive.point.clone().sub(toolGrip.clone().applyQuaternion(desired));
    }
    const delta = gripStep ? gripStep.sub(startPoint) : target.clone().sub(startPoint).multiplyScalar(alpha);
    if (delta.lengthSq() > limit * limit) delta.setLength(limit);
    const settled = startPoint.clone().add(delta).distanceTo(target) < 5e-4 && hand.wristRotation.angleTo(desired) < 3e-3;
    // Step, then keep out of the skin. When the correction would make this frame's travel exceed the
    // speed cap (for example fingertips turning down onto the skin), take a shorter step instead:
    // the hand lands on the skin rather than popping out of it.
    for (let attempt = 0, fraction = 1; ; attempt++) {
      if (attempt) hand.wristRotation.copy(startRotation).rotateTowards(desired, turn * fraction);
      hand.wristPoint.copy(startPoint).addScaledVector(delta, fraction);
      poseHand(hand);
      const fix = collision ? null : correctSurface(hand, drive);
      if (fix) {
        hand.wristPoint.add(fix);
        hand.root.position.add(fix);
        hand.root.updateMatrixWorld(true);
      }
      if (!fix || attempt === 2 || hand.wristPoint.distanceTo(startPoint) <= limit + 1e-6) break;
      fraction *= 0.3;
    }
    hand.posed = true;

    if (collision) {
      const fraction = collision.sweep(previous, probes());
      if (fraction < 1) {
        hand.wristPoint.lerp(previousWrist, 1 - fraction);
        hand.wristRotation.slerp(previousRotation, 1 - fraction);
        hand.curl = previousCurl + (hand.curl - previousCurl) * fraction;
        poseFingers();
        poseHand(hand);
      }
      hand.wristPoint.add(collision.resolve(probes()));
      poseHand(hand);
      collision.measure(probes());
    }
    // An idle hand keeps the result (lift included) in camera space; easing then lowers it again at
    // the capped speed instead of dropping it when it leaves the body.
    if (bodyFrame) hand.local = { point: camera.worldToLocal(hand.wristPoint.clone()), rotation: cameraRotation().invert().multiply(hand.wristRotation) };
    // Settled: at the target, or no longer moving (held back by the lift or a collision stop).
    const still = hand.wristPoint.distanceTo(startPoint) < 1e-4 && hand.wristRotation.angleTo(startRotation) < 1e-3;
    hand.settled = (settled || still) && Math.abs(curlTarget - hand.curl) < 3e-3;
  }

  // Until the P3 arm replaces it, the stand-in sleeve stays forearm-short: never longer than 0.30 m,
  // hidden when the cuff is more than 0.45 m from the shoulder (a long reach) and while a limb is held
  // (it would cover the grip). The glove's own sleeve stub then ends at the cuff.
  const sleeveMax = 0.30;
  const sleeveHideBeyond = 0.45;
  function updateSleeve(hand) {
    const holdingLimb = Boolean(hand.drive?.closed && ['limb', 'forearm'].includes(hand.drive.surface));
    hand.sleeve.visible = Boolean(surfaceHeight && visible && hand.edge.length) && !holdingLimb;
    if (!hand.sleeve.visible) return;
    const cuff = v();
    for (const index of hand.edge) {
      hand.sleeveMesh.getVertexPosition(index, sample).applyMatrix4(hand.sleeveMesh.matrixWorld);
      cuff.add(sample);
    }
    cuff.divideScalar(hand.edge.length);
    cuff.lerp(hand.wristPoint, 0.26);
    const elbow = shoulder(hand);
    elbow.y = Math.max(elbow.y, cuff.y + 0.045);
    const direction = cuff.clone().sub(elbow);
    const length = direction.length();
    if (length > sleeveHideBeyond || length < 1e-4) { hand.sleeve.visible = false; return; }
    direction.divideScalar(length);
    const shown = Math.min(length, sleeveMax);
    hand.sleeve.position.copy(cuff).addScaledVector(direction, -shown / 2);
    hand.sleeve.scale.y = shown;
    hand.sleeve.quaternion.setFromUnitVectors(up, direction);
  }

  // Per rendered frame between crew updates: idle and body-carried hands follow the camera (no trailing
  // while walking).
  function followCamera() {
    for (const hand of Object.values(hands)) {
      if (!inCameraSpace(hand) || !hand.local) continue;
      placeIdleHand(hand);
      if (monitorView) hand.sleeve.visible = false;
      else updateSleeve(hand);
      if ((mode === 'held' || mode === 'returning') && hand === hands[toolSide]) {
        tool.position.copy(getPalm(toolSide));
        tool.quaternion.copy(hand.wristRotation);
        tool.updateMatrixWorld(true);
      }
    }
    shownView = camera.matrixWorld.clone();
  }
  // A hard camera cut while carrying (moving to a work area, arriving on the other side of the bed): the hand
  // that holds a free instrument moves with the trainee's head and body instead of flying across the room.
  function carryThroughCut(before) {
    if (mode !== 'held') return;
    const hand = hands[toolSide];
    const change = camera.matrixWorld.clone().multiply(before.clone().invert());
    const turn = q().setFromRotationMatrix(change);
    hand.wristPoint.applyMatrix4(change);
    hand.wristRotation.premultiply(turn).normalize();
    if (hand.drive) {
      hand.drive.point.applyMatrix4(change);
      hand.drive.rotation.premultiply(turn).normalize();
    }
    poseHand(hand);
    tool.position.copy(getPalm(toolSide));
    tool.quaternion.copy(hand.wristRotation);
    tool.updateMatrixWorld(true);
    shownView = camera.matrixWorld.clone();
  }
  // Hard cuts (entering the trainee view, a step, a new work area): idle hands go straight to rest.
  function snapIdleHands() {
    for (const hand of Object.values(hands)) {
      if (!isIdle(hand)) continue;
      const rest = restPose(hand);
      hand.local = { point: rest.point, rotation: rest.rotation };
      hand.posed = true;
      placeIdleHand(hand);
    }
  }

  let workstation = false;
  let monitorView = false;
  function update(dt, reduced) {
    const targetOffer = mode === 'offered' || mode === 'returning' ? 1 : 0;
    const alpha = reduced ? 1 : 1 - Math.exp(-dt * 5.8);
    offer += (targetOffer - offer) * alpha;
    supportBlend += ((support ? 1 : 0)-supportBlend) * (1-Math.exp(-dt*7));
    supervisor.position.x = workstation ? -1.94 : -0.79 + offer * 0.129;
    supervisor.position.z = workstation ? 0.25 : 0.06;
    supervisor.rotation.x = offer * 0.24;
    supervisor.rotation.y = Math.PI / 2;
    if (support) {
      supervisor.position.x = support.side * .55;
      supervisor.position.z = support.point.z + .15;
      supervisor.rotation.y = -support.side * Math.PI / 2;
      supervisor.rotation.x = .42 * supportBlend;
    }
    supervisor.updateMatrixWorld(true);
    orientArm(staffArms.left, offer, false);
    orientArm(staffArms.right, offer, true);
    for (const digit of staffGrip) {
      digit.bone.quaternion.copy(digit.rest).multiply(q().setFromAxisAngle(v(1, 0, 0), digit.angle * (digit.active ? 0.32 + offer * 0.63 : 0.43)));
    }
    supervisor.updateMatrixWorld(true);

    supportGap = null;
    if (support) {
      const pad = staffPad.getWorldPosition(v());
      reachSupport(pad.lerp(support.point,supportBlend));
      supportGap = staffPad.getWorldPosition(v()).distanceTo(support.point);
    }

    const held = mode === 'held' || mode === 'returning';
    for (const hand of Object.values(hands)) {
      updateHand(hand, dt, reduced);
      hand.root.visible = visible && !monitorView;
      if (monitorView) hand.sleeve.visible = false;
      else updateSleeve(hand);
    }
    const staffHasTool = mode === 'offered' || mode === 'returned';
    tool.visible = (held && visible && !monitorView) || mode === 'placed' || (!workstation && (mode === 'tray' || staffHasTool));
    if (staffHasTool) {
      tool.position.copy(offeringPoint());
      const aim = v(-0.15, -0.96, 0.18).lerp(gripDirection.clone().negate(), offer).normalize();
      tool.quaternion.setFromUnitVectors(v(0, 0, -1), aim);
    } else if (held) {
      tool.position.copy(getPalm(toolSide));
      tool.quaternion.copy(hands[toolSide].wristRotation);
    }
    tool.updateMatrixWorld(true);
    moving = Object.values(hands).some((hand) => !hand.settled);
    shownView = camera.matrixWorld.clone();
  }
  let moving = false;

  function setVisible(enabled) {
    visible = enabled;
    for (const hand of Object.values(hands)) {
      hand.root.visible = enabled;
      if (!enabled) hand.sleeve.visible = false;
    }
    if (!enabled && (mode === 'held' || mode === 'returning')) tool.visible = false;
  }

  function getState() {
    return {
      handVisible: visible, toolVisible: tool.visible, mode, offer, toolSide, toolPosition: tool.position.toArray(),
      offeredPoint: offeringPoint().toArray(),
      wrists: Object.fromEntries(Object.entries(hands).map(([side, hand]) => [side, hand.wristPoint.toArray()])),
      contact: Object.fromEntries(Object.entries(hands).map(([side, hand]) =>
        [side, hand.drive?.surface ? surfaceContact(side,hand.drive.point,hand.drive.surface,Infinity)?.gap : null])),
      reach: Object.fromEntries(Object.entries(hands).map(([side, hand]) => [side, hand.drive?.point.toArray() ?? null])),
      reachNormal: Object.fromEntries(Object.entries(hands).map(([side, hand]) => [side, hand.drive?.normal?.toArray() ?? null])),
      forearmContact: Object.fromEntries(Object.entries(hands).map(([side, hand]) => [side, Boolean(hand.forearmContact)])),
      moving,
    };
  }

  function getToolTip() {
    return tool.localToWorld(v(0, 0, -toolLength));
  }

  function getToolMeshes() { return tool.children.filter((model) => model.visible); }
  // Where the palm goes for the tip to reach point with the carry grip.
  function aimAt(point) {
    return point.clone().add(v(0, 0, toolLength).applyQuaternion(carryRotation()));
  }
  return {
    supervisor, update, getState, setVisible, setMode, selectTool, offeringPoint, aimInstrument,
    followCamera, snapIdleHands, carryThroughCut, carryRotation,
    // How far (radians) a hand's grip is turned from a rotation: a tool is taken once the hand matches it.
    gripTurn(side, rotation) { return hands[side].wristRotation.angleTo(rotation); },
    drivePoint(side) { return hands[side].drive?.point.clone() ?? null; },
    // True while a hand is still easing toward its target: the frame loop keeps updating the crew.
    get moving() { return moving; },
    placeInstrument() { setMode('placed'); },
    freezeToolGrip() {
      if (mode !== 'held') return;
      const hand = hands[toolSide];
      hand.drive = { point: getPalm(toolSide), rotation: hand.wristRotation.clone(), closed: true };
    },
    get toolMode() { return mode; },
    get supportsDepth() { return activeToolConfig.supportsDepth; },
    setForearmContact(side, collision) { hands[side].forearmContact = collision; },
    followForearm(side, previous, point, previousRotation, rotation) {
      const hand = hands[side];
      const delta = rotation.clone().multiply(previousRotation.clone().invert()).normalize();
      hand.wristPoint.sub(previous).applyQuaternion(delta).add(point);
      hand.wristRotation.premultiply(delta);
      hand.root.quaternion.copy(hand.wristRotation).multiply(hand.inverse);
      hand.root.position.copy(hand.wristPoint).sub(hand.pivot.clone().applyQuaternion(hand.root.quaternion));
      hand.root.updateMatrixWorld(true);
    },
    driveHand, driveSurface, surfaceContact, contactRotation, clearDrive, getPalm, canReach, holdTool, parkTool, trayPose, getToolMeshes,
    setForearmSupport(value) { support = value; },
    get forearmSupportGap() { return supportGap; },
    setWorkstation(active) { workstation = active; },
    setMonitorView(active) { monitorView = active; },
    setSurfaceHeight(height) {
      surfaceHeight = height;
      for (const hand of Object.values(hands)) {
        for (const mesh of hand.surfaces) mesh.castShadow = Boolean(height);
        if (!height) hand.sleeve.visible = false;
      }
    },
    measureSurfacePenetration() {
      return surfaceHeight ? Math.max(...Object.values(hands).map((hand) => maxPenetration(hand, surfaceHeight, 1))) : 0;
    },
    aimAt, getToolTip, get offerProgress() { return offer; }, tool,
    get selectedTool() { return toolType; },
    get selectedToolConfig() { return activeToolConfig; },
  };
}
