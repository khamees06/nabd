// A shallow, reversible displacement of the existing skinned abdominal surface.
export function createAbdomenSurface(patient, { Vector3, Matrix3 }) {
  const skin = patient.skins.reduce((largest, mesh) =>
    mesh.geometry.attributes.position.count > largest.geometry.attributes.position.count ? mesh : largest);
  const geometry = skin.geometry;
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const source = positions.array.slice();
  const sourceNormals = normals.array.slice();
  const v = () => new Vector3();
  const origin = v(), sample = v();
  const axes = [v().set(1, 0, 0), v().set(0, 1, 0), v().set(0, 0, 1)];
  const minX = -0.52, minZ = -1.24, cell = 0.006, columns = 175, rows = 386;
  const grid = new Float32Array(columns * rows);
  const radius = 0.102, radiusSq = radius * radius;
  const bounds = { minX: -0.153, maxX: 0.153, minZ: -0.244, maxZ: -0.066 };
  const shift = v();
  const target = v();
  let center = null;
  let patch = [];
  let probe = null;
  let snapshot = null;

  function rebuild() {
    restore();
    patient.root.updateMatrixWorld(true);
    grid.fill(-Infinity);
    const world = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      skin.getVertexPosition(i, sample).applyMatrix4(skin.matrixWorld).toArray(world, i * 3);
    }
    const indices = geometry.index?.array;
    const count = indices?.length ?? positions.count;
    for (let j = 0; j < count; j += 3) {
      const a = (indices?.[j] ?? j) * 3, b = (indices?.[j+1] ?? j+1) * 3, c = (indices?.[j+2] ?? j+2) * 3;
      const ax = world[a], az = world[a+2], bx = world[b], bz = world[b+2], cx = world[c], cz = world[c+2];
      const x0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - minX) / cell));
      const z0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - minZ) / cell));
      const x1 = Math.min(columns - 1, Math.ceil((Math.max(ax, bx, cx) - minX) / cell));
      const z1 = Math.min(rows - 1, Math.ceil((Math.max(az, bz, cz) - minZ) / cell));
      const d = (bx-ax)*(cz-az) - (bz-az)*(cx-ax);
      if (Math.abs(d) < 1e-10) continue;
      for (let row=z0; row<=z1; row++) {
        const z = minZ + row*cell - az;
        for (let col=x0; col<=x1; col++) {
          const x = minX + col*cell - ax;
          const u = (x*(cz-az)-z*(cx-ax))/d;
          const t = (z*(bx-ax)-x*(bz-az))/d;
          if (u < -0.0001 || t < -0.0001 || u+t > 1.0001) continue;
          const y = world[a+1]*(1-u-t) + world[b+1]*u + world[c+1]*t;
          const k = row*columns+col;
          if (y > grid[k]) grid[k] = y;
        }
      }
    }
    snapshot = world;
  }

  function baseHeight(x, z) {
    const gx = (x-minX)/cell, gz = (z-minZ)/cell;
    const col = Math.floor(gx), row = Math.floor(gz);
    if (col < 0 || row < 0 || col >= columns-1 || row >= rows-1) return -Infinity;
    const i = row*columns+col, fx = gx-col, fz = gz-row;
    const a = grid[i], b = grid[i+1], c = grid[i+columns], d = grid[i+columns+1];
    if (!(Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c) && Number.isFinite(d))) {
      return Math.max(a,b,c,d);
    }
    return (a*(1-fx)+b*fx)*(1-fz)+(c*(1-fx)+d*fx)*fz;
  }

  function weightAt(x, z) {
    const dx=x-center.x, dz=z-center.z;
    const amount = Math.max(0, 1 - (dx*dx+dz*dz)/radiusSq);
    return amount*amount;
  }

  function height(x, z) {
    if (!snapshot) return -Infinity;
    if (!center || shift.lengthSq() < 1e-9 || Math.hypot(x-center.x,z-center.z) > radius + 0.06) return baseHeight(x,z);
    // Undo the horizontal displacement to evaluate the lifted surface at (x, z).
    let ox=x, oz=z;
    for (let i=0;i<5;i++) {
      const w=weightAt(ox,oz);
      ox=x-shift.x*w;
      oz=z-shift.z*w;
    }
    return baseHeight(ox,oz)+shift.y*weightAt(ox,oz);
  }

  function contains(point) {
    return point.x >= bounds.minX && point.x <= bounds.maxX &&
      point.z >= bounds.minZ && point.z <= bounds.maxZ &&
      Number.isFinite(baseHeight(point.x,point.z)) && point.y >= baseHeight(point.x,point.z)-0.021;
  }

  function start(point, press = false, keepShift = false) {
    const carried = keepShift ? shift.clone() : null;
    restore();
    if (!snapshot || !contains(point)) return false;
    center = point.clone();
    center.y = baseHeight(center.x,center.z);
    let closest = Infinity;
    for (let i=0;i<positions.count;i++) {
      const x=snapshot[i*3], y=snapshot[i*3+1], z=snapshot[i*3+2];
      const dx=x-center.x, dz=z-center.z;
      const falloff=1-(dx*dx+dz*dz)/radiusSq;
      if (falloff <= 0 || y < baseHeight(x,z)-0.035) continue;
      skin.applyBoneTransform(i, origin.set(0,0,0)).applyMatrix4(skin.matrixWorld);
      const basis = axes.map((axis) => skin.applyBoneTransform(i, axis.clone()).applyMatrix4(skin.matrixWorld).sub(origin));
      const [a,b,c] = basis;
      const matrix = new Matrix3().set(a.x,b.x,c.x,a.y,b.y,c.y,a.z,b.z,c.z);
      if (Math.abs(matrix.determinant()) < 1e-8) continue;
      const inverse = matrix.clone().invert();
      const normal = v().fromArray(sourceNormals,i*3).applyMatrix3(inverse.clone().transpose()).normalize();
      patch.push({
        i, w:falloff*falloff, gx:-4*falloff*dx/radiusSq, gz:-4*falloff*dz/radiusSq,
        inverse, toLocalNormal:matrix.transpose(), normal,
      });
      if (dx*dx+dz*dz+(y-center.y)**2 < closest) {
        closest=dx*dx+dz*dz+(y-center.y)**2;
        probe=i;
      }
    }
    if (!patch.length) { center=null; return false; }
    target.y = press ? -0.007 : 0.023;
    // A re-centre carries the dent over and writes the new patch at once (no frame without the dent).
    if (carried) { shift.copy(carried); write(); }
    return true;
  }

  function drag(x, z) {
    if (!center) return;
    const dx=x-center.x, dz=z-center.z;
    const distance=Math.hypot(dx,dz);
    const gain=distance>0.042 ? 0.042/distance : 1;
    target.set(dx*gain,0.023+Math.min(distance,0.042)*0.35,dz*gain);
  }

  function press(point) {
    // A sliding press re-centres the dent every 2.5 cm; it keeps its depth instead of popping back up.
    if (!center || Math.hypot(point.x - center.x, point.z - center.z) > 0.025) start(point, true, Boolean(center));
  }

  function release() { target.set(0,0,0); }

  function update(dt) {
    if (!center) return false;
    const difference = shift.distanceToSquared(target);
    if (difference < 1e-8) {
      if (target.lengthSq() === 0) { restore(); return true; }
      return false;
    }
    shift.lerp(target,1-Math.exp(-dt*17));
    write();
    return true;
  }

  function write() {
    const local=v(), normal=v();
    for (const p of patch) {
      const i=p.i*3;
      local.copy(shift).multiplyScalar(p.w).applyMatrix3(p.inverse);
      positions.setXYZ(p.i,source[i]+local.x,source[i+1]+local.y,source[i+2]+local.z);
      const normalAmount=shift.dot(p.normal)/(1+shift.x*p.gx+shift.z*p.gz);
      normal.copy(p.normal);
      normal.x-=p.gx*normalAmount;
      normal.z-=p.gz*normalAmount;
      normal.applyMatrix3(p.toLocalNormal).normalize();
      normals.setXYZ(p.i,normal.x,normal.y,normal.z);
    }
    positions.needsUpdate = normals.needsUpdate = true;
  }

  function restore() {
    for (const {i} of patch) {
      positions.setXYZ(i,source[i*3],source[i*3+1],source[i*3+2]);
      normals.setXYZ(i,sourceNormals[i*3],sourceNormals[i*3+1],sourceNormals[i*3+2]);
    }
    if (patch.length) positions.needsUpdate = normals.needsUpdate = true;
    center=null;
    patch=[];
    probe=null;
    shift.set(0,0,0);
    target.set(0,0,0);
  }

  function contact() {
    return center?.clone().add(shift) ?? null;
  }

  function getState() {
    const vertex = probe === null ? null : skin.getVertexPosition(probe,v()).applyMatrix4(skin.matrixWorld);
    const actual = vertex && vertex.clone().sub(v().fromArray(snapshot,probe*3));
    return { center:center?.toArray(), contact:contact()?.toArray(), shift:shift.toArray(),
      vertices:patch.length, meshDelta:actual?.toArray() ?? [0,0,0] };
  }

  return { rebuild, contains, height, start, drag, press, release, update, restore, contact, getState };
}
