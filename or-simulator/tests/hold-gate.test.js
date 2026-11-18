import test from 'node:test';
import assert from 'node:assert/strict';
import { createHoldGate } from '../src/interaction/hold-gate.js';

test('camera look pauses the active manipulation and the next manipulation input resumes it',()=>{
  const gate=createHoldGate();
  assert.equal(gate.paused,false);
  gate.pause();
  assert.equal(gate.paused,true);
  gate.resume();
  assert.equal(gate.paused,false);
});
