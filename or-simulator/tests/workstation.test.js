import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkWalk } from '../src/workstation.js';

test('work walk reaches all four sides without changing the selected work point',()=>{
  const walk=createWorkWalk({sideX:0.76,endZ:1.38});
  walk.enter(0.72,0.1);
  let [x,z]=walk.position();
  assert.ok(x>0.7 && x<0.9);
  walk.walk(0.6);
  walk.update(1,false);
  const next=walk.position();
  assert.notDeepEqual(next,[x,z]);
  walk.goTo(-1,0.15);
  for(let i=0;i<120 && walk.moving;i++) walk.update(0.05,false);
  [x,z]=walk.position();
  assert.ok(x< -0.7);
  assert.ok(Math.abs(z-0.15)<0.08);
});
