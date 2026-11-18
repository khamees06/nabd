const SUPPORTED_EVENTS = new Set([
  'instrument_selected',
  'instrument_picked',
  'instrument_released',
  'instrument_pick_failed',
  'hand_changed',
  'camera_changed',
  'patient_interaction',
  'endoscope_moved',
  'simulation_stage_changed',
  'checklist_item_completed',
  'simulation_started',
  'simulation_completed',
  'interaction_error',
]);

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function safeMetadata(value) {
  if (value == null) return {};
  try { return JSON.parse(JSON.stringify(value)); }
  catch { return { serializationError: true }; }
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
}

/** In-memory, session-scoped event log. No external transmission or persistence. */
export class EventLogger {
  constructor({ clock = () => new Date(), idFactory = createId, maxEvents = 10000 } = {}) {
    this.clock = clock;
    this.idFactory = idFactory;
    this.maxEvents = maxEvents;
    this.events = [];
    this.sessionId = null;
  }

  beginSession(sessionId) {
    this.clear({ resetSessionId: true });
    this.sessionId = sessionId ?? this.idFactory();
    return this.sessionId;
  }

  record(event, { stage = 'idle', success = true, metadata = {}, instrument, hand, target } = {}) {
    if (!SUPPORTED_EVENTS.has(event)) throw new RangeError(`Unsupported simulation event: ${event}`);
    const record = {
      eventId: this.idFactory(),
      event,
      timestamp: this.clock().toISOString(),
      sessionId: this.sessionId,
      stage,
      success: Boolean(success),
      metadata: safeMetadata(metadata),
    };
    if (instrument != null) record.instrument = instrument;
    if (hand != null) record.hand = hand;
    if (target != null) record.target = target;
    this.events.push(record);
    if (this.events.length > this.maxEvents) this.events.splice(0, this.events.length - this.maxEvents);
    return deepFreeze({ ...record, metadata: safeMetadata(record.metadata) });
  }

  getEvents() { return this.events.map((event) => ({ ...event, metadata: safeMetadata(event.metadata) })); }
  get count() { return this.events.length; }
  clear({ resetSessionId = false } = {}) {
    this.events.length = 0;
    if (resetSessionId) this.sessionId = null;
  }
  exportJSON(space = 2) { return JSON.stringify(this.getEvents(), null, space); }
}

