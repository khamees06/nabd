import test from 'node:test';
import assert from 'node:assert/strict';
import { SimulationManager } from '../src/simulation/SimulationManager.js';
import { EventLogger } from '../src/simulation/EventLogger.js';
import { createEventBus } from '../src/core/EventBus.js';

test('starting a session clears the previous log and records lifecycle transitions', () => {
  let id = 0;
  const logger = new EventLogger({ idFactory: () => `id-${++id}`, clock: () => new Date('2026-11-12T18:00:00.000Z') });
  const bus = createEventBus();
  const published = [];
  bus.on('simulation:event', (event) => published.push(event.event));
  const manager = new SimulationManager({ logger, eventBus: bus, clock: () => new Date('2026-11-12T18:00:00.000Z') });
  manager.startSession({ scenario: 'clinical-skills-practice', source: 'tray', instrument: 'grasper' });
  manager.setStage('monitor');
  manager.setStage('pickup');
  manager.record('instrument_picked', { instrument: 'grasper', hand: 'right' });
  manager.setStage('complete');
  assert.deepEqual(manager.getEvents().map((event) => event.event), [
    'simulation_started', 'simulation_stage_changed', 'simulation_stage_changed',
    'instrument_picked', 'simulation_stage_changed', 'simulation_completed',
  ]);
  assert.equal(manager.snapshot().stage, 'complete');
  assert.equal(published.length, 6);
  manager.startSession({ scenario: 'second-session' });
  assert.equal(manager.getEvents().length, 1);
  assert.equal(manager.getEvents()[0].event, 'simulation_started');
});

test('repeated stage assignment and completion are idempotent', () => {
  const manager = new SimulationManager();
  manager.startSession();
  assert.equal(manager.setStage('monitor'), true);
  assert.equal(manager.setStage('monitor'), false);
  assert.equal(manager.complete(), true);
  assert.equal(manager.complete(), false);
  assert.equal(manager.getEvents().filter((event) => event.event === 'simulation_completed').length, 1);
});


test('reset detaches subsequent events from the previous session', () => {
  const manager = new SimulationManager();
  manager.startSession();
  manager.reset();
  const event = manager.record('interaction_error', { success: false, metadata: { reason: 'outside_session' } });
  assert.equal(event.sessionId, null);
  assert.equal(manager.snapshot().sessionId, null);
});
