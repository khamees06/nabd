import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Quaternion } from 'three';
import physics from '../vendor/rapier/rapier.mjs';
import { createForearmContact } from '../src/interaction/ForearmContact.js';

await physics.init();

function fixture() {
  const chain = {
    joints: [0, .3, .54].map((z) => ({ getWorldPosition: (point) => point.set(0, 1, z) })),
  };
  const contact = createForearmContact({
    physics, Vector3, Quaternion, chain, bed: { width: .47, length: 1.06, height: () => .9 },
  });
  contact.refresh();
  return contact;
}

test('sweeps stop a glove probe crossing the forearm or mattress in one update', () => {
  const contact = fixture();
  const side = contact.sweep([new Vector3(-.1, 1, .45)], [new Vector3(.1, 1, .45)]);
  const down = contact.sweep([new Vector3(.2, 1, .45)], [new Vector3(.2, .85, .45)]);
  assert.ok(side > .3 && side < .45);
  assert.ok(down > .5 && down < .65);
  assert.equal(contact.stops, 2);
});

test('overlap correction pushes a glove probe out along the local surface normal', () => {
  const contact = fixture();
  const probe = new Vector3(-.022, 1, .45);
  contact.measure([probe]);
  assert.ok(contact.overlap > .006);
  probe.add(contact.resolve([probe]));
  contact.measure([probe]);
  assert.ok(contact.overlap < .001);
  assert.ok(probe.x < -.03);
});
