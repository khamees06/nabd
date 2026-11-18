import { EventLogger } from './EventLogger.js';

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Owns training-session lifecycle and stage transitions; independent of DOM. */
export class SimulationManager {
  constructor({ logger = new EventLogger(), eventBus = null, clock = () => new Date() } = {}) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.clock = clock;
    this.state = { sessionId: null, scenario: null, source: null, stage: 'idle', startedAt: null, completedAt: null };
  }

  emit(event, options = {}) {
    const record = this.logger.record(event, { stage: this.state.stage, ...options });
    this.eventBus?.emit('simulation:event', record);
    return record;
  }

  startSession({ scenario = 'clinical-training', source = null, instrument = null, metadata = {} } = {}) {
    const sessionId = createSessionId();
    this.logger.beginSession(sessionId);
    this.state = { sessionId, scenario, source, stage: 'idle', startedAt: this.clock().toISOString(), completedAt: null };
    this.emit('simulation_started', { stage: 'idle', metadata: { scenario, source, instrument, ...metadata } });
    return this.snapshot();
  }

  setStage(stage, metadata = {}) {
    if (!stage || typeof stage !== 'string') throw new TypeError('Simulation stage must be a non-empty string.');
    if (stage === this.state.stage) return false;
    const previous = this.state.stage;
    this.state.stage = stage;
    this.emit('simulation_stage_changed', { stage, metadata: { from: previous, to: stage, ...metadata } });
    if (stage === 'complete') this.complete(metadata);
    return true;
  }

  complete(metadata = {}) {
    if (!this.state.sessionId || this.state.completedAt) return false;
    this.state.completedAt = this.clock().toISOString();
    if (this.state.stage !== 'complete') {
      const previous = this.state.stage;
      this.state.stage = 'complete';
      this.emit('simulation_stage_changed', { stage: 'complete', metadata: { from: previous, to: 'complete' } });
    }
    this.emit('simulation_completed', { stage: 'complete', metadata: { ...metadata, completedAt: this.state.completedAt } });
    return true;
  }

  record(event, options = {}) { return this.emit(event, options); }
  reset({ clearEvents = true } = {}) {
    if (clearEvents) this.logger.clear({ resetSessionId: true });
    this.state = { sessionId: null, scenario: null, source: null, stage: 'idle', startedAt: null, completedAt: null };
  }
  getEvents() { return this.logger.getEvents(); }
  snapshot() { return { ...this.state, eventCount: this.logger.count }; }
}
