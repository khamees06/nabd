import test from 'node:test';
import assert from 'node:assert/strict';
import { getInstrumentConfig, listInstrumentConfigs } from '../src/instruments/InstrumentConfig.js';

test('configuration covers only the four instruments already present in v0.22', () => {
  assert.deepEqual(listInstrumentConfigs().map((item) => item.id).sort(), ['grasper', 'needleHolder', 'scissors', 'scope']);
  assert.equal(getInstrumentConfig('grasper').length, 0.231);
  assert.equal(getInstrumentConfig('scissors').length, 0.10);
  assert.equal(getInstrumentConfig('needleHolder').length, 0.113);
  assert.equal(getInstrumentConfig('scope').length, 0.272);
  assert.equal(getInstrumentConfig('grasper').supportsDepth, true);
  assert.equal(getInstrumentConfig('scope').supportsDepth, true);
  assert.equal(getInstrumentConfig('scissors').supportsDepth, false);
  assert.equal(getInstrumentConfig('needleHolder').supportsDepth, false);
  assert.throws(() => getInstrumentConfig('scalpel'), /Unknown instrument/);
});

test('instrument grip offsets preserve the existing v0.22 anchor', () => {
  for (const instrument of listInstrumentConfigs()) assert.deepEqual(instrument.gripOffset, [0, 0, -0.086]);
});
