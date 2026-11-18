/** Geometry/interaction metadata for the four instruments already present in v0.22. */
export const INSTRUMENT_CONFIG = Object.freeze({
  grasper: Object.freeze({
    id: 'grasper', displayName: 'ملقط الإمساك', length: 0.231,
    gripOffset: Object.freeze([0, 0, -0.086]),
    attachmentAxis: Object.freeze([0, 1, 0]), attachmentAngle: Math.PI / 2,
    interactionType: 'handheld', supportsDepth: true, supportsAxialRoll: true,
    constraints: Object.freeze({ requiresSelectedPort: true, maxInsertion: 0.135 }),
  }),
  scissors: Object.freeze({
    id: 'scissors', displayName: 'مقص جراحي', length: 0.10,
    gripOffset: Object.freeze([0, 0, -0.086]),
    attachmentAxis: Object.freeze([0, 1, 0]), attachmentAngle: Math.PI / 2,
    interactionType: 'handheld', supportsDepth: false, supportsAxialRoll: false,
    constraints: Object.freeze({ requiresSelectedPort: false }),
  }),
  needleHolder: Object.freeze({
    id: 'needleHolder', displayName: 'حامل إبرة', length: 0.113,
    gripOffset: Object.freeze([0, 0, -0.086]),
    attachmentAxis: Object.freeze([0, 1, 0]), attachmentAngle: Math.PI / 2,
    interactionType: 'handheld', supportsDepth: false, supportsAxialRoll: false,
    constraints: Object.freeze({ requiresSelectedPort: false }),
  }),
  scope: Object.freeze({
    id: 'scope', displayName: 'منظار', length: 0.272,
    gripOffset: Object.freeze([0, 0, -0.086]),
    attachmentAxis: Object.freeze([0, 1, 0]), attachmentAngle: Math.PI / 2,
    interactionType: 'endoscope', supportsDepth: true, supportsAxialRoll: true,
    constraints: Object.freeze({ requiresSelectedPort: true, maxInsertion: 0.135 }),
  }),
});

export function getInstrumentConfig(id) {
  const config = INSTRUMENT_CONFIG[id];
  if (!config) throw new RangeError(`Unknown instrument: ${id}`);
  return config;
}

export function listInstrumentConfigs() { return Object.values(INSTRUMENT_CONFIG); }
