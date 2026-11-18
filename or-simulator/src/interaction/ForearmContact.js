// Rapier tests the rigid collision shapes. The existing patient rig still owns limb pose.
export function createForearmContact({ physics, Vector3, Quaternion, chain, bed }) {
  const up = new Vector3(0, 1, 0);
  const zero = new Vector3();
  const identity = new Quaternion();
  const shape = (form, center, rotation = identity) => ({ form, center, rotation });
  const makeCapsule = (radius, halfLength) => shape(new physics.Capsule(halfLength, radius), new Vector3(), new Quaternion());
  const setCapsule = (capsule, from, to) => {
    capsule.center.copy(from).lerp(to, .5);
    capsule.rotation.setFromUnitVectors(up, to.clone().sub(from).normalize());
  };
  const [shoulder, elbow, wrist] = chain.joints;
  const location = (bone) => bone.getWorldPosition(new Vector3());
  const upper = makeCapsule(.043, location(shoulder).distanceTo(location(elbow)) * .5 - .024);
  const lower = makeCapsule(.022, location(elbow).distanceTo(location(wrist)) * .5 - .006);
  const mattress = shape(new physics.Cuboid(bed.width, .10, bed.length), new Vector3());
  const padShapes = [.010, .008, .007, .007, .006, .005].map((radius) => new physics.Ball(radius));
  const obstacles = [lower, upper, mattress];
  const sweepHit = new physics.ShapeCastHit(0, new Vector3(), new Vector3(), new Vector3(), new Vector3());
  const surfaceHit = new physics.ShapeContact(0, new Vector3(), new Vector3(), new Vector3(), new Vector3());
  const correction = new Vector3();
  let maximumOverlap = 0;
  let stoppedSweeps = 0;

  function refresh() {
    setCapsule(upper, location(shoulder), location(elbow));
    setCapsule(lower, location(elbow), location(wrist));
    mattress.center.y = bed.height() - .10;
  }

  function sweep(previous, proposed) {
    let fraction = 1;
    for (let i = 0; i < proposed.length; i++) {
      const path = proposed[i].clone().sub(previous[i]);
      if (path.lengthSq() < 1e-8) continue;
      for (const { form, center, rotation } of obstacles) {
        const hit = padShapes[i].castShape(previous[i], identity, path, form, center, rotation,
          zero, 0, fraction, false, sweepHit);
        if (hit) fraction = Math.min(fraction, Math.max(0, hit.time_of_impact - .001 / path.length()));
      }
    }
    if (fraction < 1) stoppedSweeps++;
    return fraction;
  }

  function resolve(probes) {
    correction.set(0, 0, 0);
    for (let pass = 0; pass < 3; pass++) {
      let deepest = 0;
      let normal;
      for (let i = 0; i < probes.length; i++) {
        const point = probes[i].clone().add(correction);
        for (const { form, center, rotation } of obstacles) {
          const contact = form.contactShape(center, rotation, padShapes[i], point, identity, .003, surfaceHit);
          if (contact && contact.distance < deepest) {
            deepest = contact.distance;
            normal = new Vector3().copy(contact.normal1);
          }
        }
      }
      if (!normal) break;
      correction.addScaledVector(normal, .001 - deepest);
    }
    return correction.clone();
  }

  function measure(probes) {
    maximumOverlap = 0;
    for (let i = 0; i < probes.length; i++) {
      for (const { form, center, rotation } of obstacles) {
        const hit = form.contactShape(center, rotation, padShapes[i], probes[i], identity, .003, surfaceHit);
        if (hit) maximumOverlap = Math.max(maximumOverlap, -hit.distance);
      }
    }
  }

  return {
    refresh, sweep, resolve, measure,
    get overlap() { return maximumOverlap; },
    get stops() { return stoppedSweeps; },
  };
}
