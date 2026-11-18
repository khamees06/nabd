import test from 'node:test';
import assert from 'node:assert/strict';
import { EventLogger } from '../src/simulation/EventLogger.js';

test('EventLogger creates structured events with unique IDs and ISO timestamps', () => {
  let id = 0;
  const logger = new EventLogger({ idFactory: () => `id-${++id}`, clock: () => new Date('2026-11-12T18:00:00.000Z') });
  logger.beginSession('session-a');
  const event = logger.record('instrument_picked', { stage: 'pickup', instrument: 'grasper', hand: 'right', metadata: { contact: [1, 2, 3] } });
  assert.equal(event.eventId, 'id-1');
  assert.equal(event.sessionId, 'session-a');
  assert.equal(event.timestamp, '2026-11-12T18:00:00.000Z');
  assert.equal(event.instrument, 'grasper');
  assert.deepEqual(event.metadata.contact, [1, 2, 3]);
});

test('EventLogger rejects unknown events and trims to the configured event limit', () => {
  const logger = new EventLogger({ idFactory: (() => { let n = 0; return () => `e-${++n}`; })(), maxEvents: 2 });
  logger.beginSession('s');
  logger.record('camera_changed');
  logger.record('hand_changed');
  logger.record('interaction_error');
  assert.equal(logger.count, 2);
  assert.deepEqual(logger.getEvents().map((event) => event.event), ['hand_changed', 'interaction_error']);
  assert.throws(() => logger.record('not_a_real_event'), /Unsupported simulation event/);
});

test('returned event snapshots cannot mutate the stored session record', () => {
  const logger = new EventLogger();
  logger.beginSession('immutable-session');
  const published = logger.record('patient_interaction', { metadata: { point: [1, 2, 3] } });
  assert.throws(() => { published.metadata.point[0] = 99; }, TypeError);
  const copy = logger.getEvents();
  copy[0].metadata.point[0] = 77;
  assert.equal(logger.getEvents()[0].metadata.point[0], 1);
});
