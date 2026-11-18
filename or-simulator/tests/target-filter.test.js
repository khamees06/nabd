import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivacySurfaceHit } from '../src/interaction/target-filter.js';

test('privacy filtering is applied to the intersected face, not the entire multi-material mesh',()=>{
  const object={material:[{name:'Patient skin'},{name:'Local privacy overlay'}]};
  assert.equal(isPrivacySurfaceHit({object,face:{materialIndex:0}}),false);
  assert.equal(isPrivacySurfaceHit({object,face:{materialIndex:1}}),true);
});

test('single-material privacy surfaces remain excluded',()=>{
  assert.equal(isPrivacySurfaceHit({object:{material:{name:'Local privacy overlay'}}}),true);
  assert.equal(isPrivacySurfaceHit({object:{material:{name:'Patient skin'}}}),false);
});
